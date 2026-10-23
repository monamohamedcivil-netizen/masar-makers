"use server";

import { revalidatePath } from "next/cache";

import { isInternalEmail } from "@/lib/admin/internal-accounts";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/server";
import { applyAutoFlags, mapPayment } from "@/lib/finance/queries";
import { computeExpenseTotals } from "@/lib/finance/expense-calc";
import {
  DEFAULT_RATES,
  derivePaymentStatus,
  normalizeCurrency,
  normalizeJourneyKind,
  buildEditionCode,
  editionPrefixOf,
  type JourneyKind,
  toEgp,
  classifyExpense,
  type BillingPeriod,
  type ExpenseCategory,
  type FinanceExpense,
  type FinanceService,
  type FinanceOtherIncome,
  type FinancePayment,
  type FinanceRates,
  type PaymentStatus,
} from "@/lib/finance/shared";

export interface FinanceActionResult<T = undefined> {
  success: boolean;
  message?: string;
  data?: T;
}

function fail<T = undefined>(error: unknown): FinanceActionResult<T> {
  return {
    success: false,
    message: error instanceof Error ? error.message : String(error),
  };
}

function refresh() {
  revalidatePath("/admin/finance/payments");
  revalidatePath("/admin/finance/expenses");
  revalidatePath("/admin/reports");
  revalidatePath("/admin/students/enrollment-requests");
}

async function loadRates(
  admin: ReturnType<typeof createAdminClient>,
): Promise<FinanceRates> {
  const rates: FinanceRates = { ...DEFAULT_RATES };
  const { data } = await admin.from("finance_exchange_rates").select("*");
  for (const row of data ?? []) {
    const rate = Number(row.rate_to_egp);
    if (rate > 0) rates[String(row.currency)] = rate;
  }
  return rates;
}

const asNumber = (v: unknown, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const asText = (v: unknown) => {
  const s = typeof v === "string" ? v.trim() : v == null ? "" : String(v).trim();
  return s ? s : null;
};

const asDate = (v: unknown) => {
  const s = asText(v);
  return s && /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : null;
};

/* ============================ المدفوعات ============================ */

const PAYMENT_TEXT_FIELDS = [
  "course_code",
  "edition_code",
  "student_name",
  "certificate_name",
  "email",
  "phone",
  "nationality",
  "country",
  "offer_label",
  "notes",
  "followup_reason",
  "activation_key",
] as const;

// الشهادة والاستبيان يُحسبان تلقائيًا من بيانات المنصة ولا يُعدَّلان يدويًا.
const PAYMENT_BOOL_FIELDS = ["email_sent", "followup_done"] as const;

const PAYMENT_DATE_FIELDS = ["paid_at", "followup_date", "expires_at"] as const;

function buildPaymentPatch(
  patch: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};

  for (const f of PAYMENT_TEXT_FIELDS) if (f in patch) out[f] = asText(patch[f]);
  for (const f of PAYMENT_BOOL_FIELDS) if (f in patch) out[f] = Boolean(patch[f]);
  for (const f of PAYMENT_DATE_FIELDS) if (f in patch) out[f] = asDate(patch[f]);

  if ("currency" in patch) out.currency = normalizeCurrency(patch.currency);
  if ("list_price" in patch)
    out.list_price = patch.list_price === "" || patch.list_price == null ? null : asNumber(patch.list_price);
  if ("amount_total" in patch)
    out.amount_total = patch.amount_total === "" || patch.amount_total == null ? null : asNumber(patch.amount_total);
  if ("amount_paid" in patch) out.amount_paid = asNumber(patch.amount_paid);
  if ("journey_kind" in patch)
    out.journey_kind = normalizeJourneyKind(patch.journey_kind);
  if ("delivery_type" in patch)
    out.delivery_type =
      patch.delivery_type === "recorded" || patch.delivery_type === "interactive"
        ? patch.delivery_type
        : null;
  if (
    "payment_status" in patch &&
    ["paid", "partial", "unpaid"].includes(String(patch.payment_status))
  )
    out.payment_status = patch.payment_status;

  return out;
}

export async function updatePayment(
  id: string,
  patch: Record<string, unknown>,
): Promise<FinanceActionResult<FinancePayment>> {
  try {
    await requireAdmin();
    const admin = createAdminClient();

    const clean = buildPaymentPatch(patch);

    const { data: current, error: loadError } = await admin
      .from("finance_payments")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (loadError || !current) throw new Error(loadError?.message || "السجل غير موجود");

    const merged = { ...current, ...clean } as Record<string, unknown>;
    const moneyChanged = ["amount_paid", "amount_total", "currency"].some(
      (k) => k in clean,
    );

    if (moneyChanged) {
      const rates = await loadRates(admin);
      clean.amount_egp = toEgp(
        asNumber(merged.amount_paid),
        String(merged.currency),
        rates,
      );
      if (!("payment_status" in clean)) {
        clean.payment_status = derivePaymentStatus(
          merged.amount_total == null ? null : asNumber(merged.amount_total),
          asNumber(merged.amount_paid),
        );
      }
    }

    // ربط العرض بقائمة العروض عند تطابق الاسم
    if ("offer_label" in clean) {
      const label = clean.offer_label as string | null;
      let offerId: string | null = null;
      if (label) {
        const { data: offer } = await admin
          .from("finance_offers")
          .select("id")
          .eq("name", label)
          .maybeSingle();
        offerId = offer?.id ? String(offer.id) : null;
      }
      clean.offer_id = offerId;
    }

    // إذا حُدد موعد متابعة جديد نعيد تفعيل التنبيه
    if ("followup_date" in clean || "followup_reason" in clean) {
      clean.followup_notified_at = null;
    }
    if (clean.followup_done === true) clean.followup_notified_at = null;

    clean.updated_at = new Date().toISOString();

    const { data: updated, error } = await admin
      .from("finance_payments")
      .update(clean)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);

    const [withFlags] = await applyAutoFlags(admin, [
      mapPayment(updated as Record<string, unknown>),
    ]);

    refresh();
    return { success: true, data: withFlags };
  } catch (error) {
    return fail(error);
  }
}

export async function createPayment(
  init: Record<string, unknown>,
): Promise<FinanceActionResult<FinancePayment>> {
  try {
    await requireAdmin();
    const admin = createAdminClient();
    const rates = await loadRates(admin);

    const clean = buildPaymentPatch(init);
    const currency = String(clean.currency ?? "EGP");
    const paid = asNumber(clean.amount_paid);
    const total = clean.amount_total == null ? null : asNumber(clean.amount_total);

    const row = {
      student_name: "طالب جديد",
      ...clean,
      currency,
      amount_paid: paid,
      amount_egp: toEgp(paid, currency, rates),
      payment_status:
        (clean.payment_status as PaymentStatus | undefined) ??
        derivePaymentStatus(total, paid),
      paid_at: (clean.paid_at as string | null | undefined) ?? new Date().toISOString().slice(0, 10),
      source: "manual",
    };

    const { data, error } = await admin
      .from("finance_payments")
      .insert(row)
      .select("*")
      .single();
    if (error) throw new Error(error.message);

    const [withFlags] = await applyAutoFlags(admin, [
      mapPayment(data as Record<string, unknown>),
    ]);

    refresh();
    return { success: true, data: withFlags };
  } catch (error) {
    return fail(error);
  }
}

export async function deletePayment(id: string): Promise<FinanceActionResult> {
  try {
    await requireAdmin();
    const { error } = await createAdminClient()
      .from("finance_payments")
      .delete()
      .eq("id", id);
    if (error) throw new Error(error.message);
    refresh();
    return { success: true };
  } catch (error) {
    return fail(error);
  }
}

export async function completeFollowup(id: string): Promise<FinanceActionResult> {
  try {
    await requireAdmin();
    const { error } = await createAdminClient()
      .from("finance_payments")
      .update({ followup_done: true, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw new Error(error.message);
    refresh();
    return { success: true };
  } catch (error) {
    return fail(error);
  }
}

/* ============================ العروض والأسعار والعملات ============================ */

export async function saveOffer(input: {
  id?: string;
  name: string;
  discount_percent: number;
}): Promise<FinanceActionResult<{ id: string }>> {
  try {
    await requireAdmin();
    const admin = createAdminClient();
    const name = asText(input.name);
    if (!name) throw new Error("اسم العرض مطلوب");
    const discount = Math.min(100, Math.max(0, asNumber(input.discount_percent)));

    if (input.id) {
      const { error } = await admin
        .from("finance_offers")
        .update({ name, discount_percent: discount })
        .eq("id", input.id);
      if (error) throw new Error(error.message);
      refresh();
      return { success: true, data: { id: input.id } };
    }

    const { data, error } = await admin
      .from("finance_offers")
      .insert({ name, discount_percent: discount, sort_order: 100 })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    refresh();
    return { success: true, data: { id: String(data.id) } };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteOffer(id: string): Promise<FinanceActionResult> {
  try {
    await requireAdmin();
    const { error } = await createAdminClient()
      .from("finance_offers")
      .delete()
      .eq("id", id);
    if (error) throw new Error(error.message);
    refresh();
    return { success: true };
  } catch (error) {
    return fail(error);
  }
}

export async function savePriceItem(input: {
  code: string;
  label?: string;
  price_egp?: number;
  price_sar?: number;
  price_usd?: number;
}): Promise<FinanceActionResult> {
  try {
    await requireAdmin();
    const patch: Record<string, unknown> = {};
    if (input.label !== undefined) patch.label = asText(input.label) ?? input.code;
    if (input.price_egp !== undefined) patch.price_egp = asNumber(input.price_egp);
    if (input.price_sar !== undefined) patch.price_sar = asNumber(input.price_sar);
    if (input.price_usd !== undefined) patch.price_usd = asNumber(input.price_usd);

    const { error } = await createAdminClient()
      .from("finance_price_items")
      .update(patch)
      .eq("code", input.code);
    if (error) throw new Error(error.message);
    refresh();
    return { success: true };
  } catch (error) {
    return fail(error);
  }
}

export async function saveExchangeRate(
  currency: string,
  rate: number,
): Promise<FinanceActionResult> {
  try {
    await requireAdmin();
    const code = normalizeCurrency(currency);
    const value = asNumber(rate);
    if (code === "EGP" || value <= 0) throw new Error("قيمة السعر غير صحيحة");

    const { error } = await createAdminClient()
      .from("finance_exchange_rates")
      .upsert({
        currency: code,
        rate_to_egp: value,
        updated_at: new Date().toISOString(),
      });
    if (error) throw new Error(error.message);
    refresh();
    return { success: true };
  } catch (error) {
    return fail(error);
  }
}

/* ============================ المصروفات ============================ */

const CATEGORIES: ExpenseCategory[] = ["ads", "platform", "other"];
const PERIODS: BillingPeriod[] = ["daily", "monthly", "yearly"];

const todayIso = () => new Date().toISOString().slice(0, 10);

function buildExpense(
  input: Record<string, unknown>,
  rates: FinanceRates,
): Record<string, unknown> {
  const payee = asText(input.payee) ?? "مصروف";
  const guess = classifyExpense(payee);

  const months = Math.max(1, Math.round(asNumber(input.months_count, 1)));
  const monthly = asNumber(input.monthly_amount);
  const currency = normalizeCurrency(input.currency);
  const category = CATEGORIES.includes(input.category as ExpenseCategory)
    ? (input.category as ExpenseCategory)
    : guess.category;
  const period = PERIODS.includes(input.billing_period as BillingPeriod)
    ? (input.billing_period as BillingPeriod)
    : guess.period;
  const start = asDate(input.start_month) ?? todayIso();
  const running = input.is_running === true;

  // المستمر: يُحسب تلقائيًا حتى اليوم. المتوقف: العدد المخزَّن.
  const totals = computeExpenseTotals(
    {
      start,
      period,
      amount: monthly,
      currency,
      running,
      fixedCount: running ? null : months,
    },
    todayIso(),
    rates,
  );

  return {
    payee,
    start_month: start,
    end_month: running ? null : asDate(input.end_month),
    months_count: running ? Math.max(1, totals.count) : months,
    currency,
    monthly_amount: monthly,
    total_amount: totals.totalAmount,
    total_egp: totals.totalEgp,
    notes: asText(input.notes),
    category,
    billing_period: period,
    is_running: running,
  };
}

export async function saveExpense(
  id: string | null,
  input: Record<string, unknown>,
): Promise<FinanceActionResult<{ id: string }>> {
  try {
    await requireAdmin();
    const admin = createAdminClient();
    const rates = await loadRates(admin);

    let base: Record<string, unknown> = input;
    if (id) {
      const { data: current } = await admin
        .from("finance_expenses")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (current?.service_id) {
        // الصف مرتبط بخدمة: يُعدَّل من جدول الخدمات، ونسمح هنا بالملاحظات والفئة فقط.
        const allowed: Record<string, unknown> = {};
        if ("notes" in input) allowed.notes = asText(input.notes);
        if (CATEGORIES.includes(input.category as ExpenseCategory))
          allowed.category = input.category;
        if (Object.keys(allowed).length === 0)
          throw new Error("هذا الصف مرتبط بخدمة؛ عدّليه من جدول الخدمات أسفل الصفحة.");
        const { error } = await admin
          .from("finance_expenses")
          .update(allowed)
          .eq("id", id);
        if (error) throw new Error(error.message);
        refresh();
        return { success: true, data: { id } };
      }

      base = { ...(current ?? {}), ...input };

      // إيقاف/تشغيل: عند الإيقاف نثبّت عدد مرات الصرف حتى اليوم.
      if ("is_running" in input && current) {
        if (input.is_running === true) {
          base.end_month = null;
        } else if (current.is_running === true) {
          const frozen = computeExpenseTotals(
            {
              start: String(current.start_month),
              period: (current.billing_period as BillingPeriod) ?? "monthly",
              amount: asNumber(current.monthly_amount),
              currency: String(current.currency),
              running: true,
            },
            todayIso(),
            rates,
          );
          base.months_count = Math.max(1, frozen.count);
          base.end_month = todayIso();
        }
      }
    }
    const row = buildExpense(base, rates);

    const query = id
      ? admin.from("finance_expenses").update(row).eq("id", id)
      : admin.from("finance_expenses").insert(row);
    const { data, error } = await query.select("id").single();
    if (error) throw new Error(error.message);

    refresh();
    return { success: true, data: { id: String(data.id) } };
  } catch (error) {
    return fail(error);
  }
}

/* ============================ خدمات المنصة ومواعيد التجديد ============================ */

export async function saveService(
  id: string | null,
  input: Record<string, unknown>,
): Promise<FinanceActionResult<{ id: string }>> {
  try {
    await requireAdmin();
    const admin = createAdminClient();

    let current: Record<string, unknown> = {};
    if (id) {
      const { data } = await admin
        .from("finance_services")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      current = (data ?? {}) as Record<string, unknown>;
    }
    const m = { ...current, ...input };

    const row: Record<string, unknown> = {
      name: asText(m.name) ?? "خدمة جديدة",
      category: CATEGORIES.includes(m.category as ExpenseCategory)
        ? m.category
        : "platform",
      amount: m.amount === "" || m.amount == null ? null : asNumber(m.amount),
      currency: normalizeCurrency(m.currency),
      billing_period: PERIODS.includes(m.billing_period as BillingPeriod)
        ? m.billing_period
        : "monthly",
      started_on: asDate(m.started_on),
      stopped_on: asDate(m.stopped_on),
      is_running: m.is_running === true,
      next_renewal: asDate(m.next_renewal),
      next_renewal_note: asText(m.next_renewal_note),
      last_payment_note: asText(m.last_payment_note),
      notes: asText(m.notes),
    };

    // مستمر ⇐ يبدأ الصرف من تاريخ البداية (أو اليوم) ويُلغى تاريخ التوقف؛ متوقف ⇐ يتوقف اليوم.
    if ("is_running" in input) {
      if (row.is_running) {
        row.started_on = row.started_on ?? todayIso();
        row.stopped_on = null;
      } else if (current.is_running === true && !("stopped_on" in input)) {
        row.stopped_on = todayIso();
      }
    }

    let serviceId = id;
    if (id) {
      const { error } = await admin.from("finance_services").update(row).eq("id", id);
      if (error) throw new Error(error.message);
    } else {
      const { data, error } = await admin
        .from("finance_services")
        .insert({ ...row, sort_order: 100 })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      serviceId = String(data.id);
    }

    // كل خدمة لها صف مصروف مرتبط بها (يُنشأ تلقائيًا إن لم يوجد)،
    // فيتحدث الصرف كلما تغيّر سعرها أو حالتها.
    const { data: linked } = await admin
      .from("finance_expenses")
      .select("id")
      .eq("service_id", serviceId)
      .limit(1);

    if (!linked || linked.length === 0) {
      const { error: expenseError } = await admin.from("finance_expenses").insert({
        payee: row.name,
        start_month: (row.started_on as string | null) ?? todayIso(),
        months_count: 1,
        currency: row.currency,
        monthly_amount: row.amount ?? 0,
        total_amount: 0,
        total_egp: 0,
        category: row.category,
        billing_period: row.billing_period,
        is_running: row.is_running,
        service_id: serviceId,
      });
      if (expenseError) throw new Error(expenseError.message);
    }

    refresh();
    return { success: true, data: { id: String(serviceId) } };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteService(id: string): Promise<FinanceActionResult> {
  try {
    await requireAdmin();
    const admin = createAdminClient();
    await admin.from("finance_expenses").delete().eq("service_id", id);
    const { error } = await admin.from("finance_services").delete().eq("id", id);
    if (error) throw new Error(error.message);
    refresh();
    return { success: true };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteExpense(id: string): Promise<FinanceActionResult> {
  try {
    await requireAdmin();
    const { error } = await createAdminClient()
      .from("finance_expenses")
      .delete()
      .eq("id", id);
    if (error) throw new Error(error.message);
    refresh();
    return { success: true };
  } catch (error) {
    return fail(error);
  }
}

/* ============================ دخل آخر (بيع نسخ البرامج) ============================ */

function buildIncome(
  input: Record<string, unknown>,
  rates: FinanceRates,
): Record<string, unknown> {
  const currency = normalizeCurrency(input.currency);
  const amount = asNumber(input.amount);
  const extra = asNumber(input.extra_profit);
  // الإجمالي بالجنيه = نسبتي (بعملة الدفع) محوَّلة للجنيه + الربح الإضافي (بالجنيه)
  const myPercent =
    input.my_percent === "" || input.my_percent == null
      ? 0
      : asNumber(input.my_percent);
  const totalEgp =
    input.total_egp !== undefined && input.total_egp !== "" && input.__manualTotal
      ? asNumber(input.total_egp)
      : Math.round((toEgp(myPercent, currency, rates) + extra) * 100) / 100;
  return {
    received_from: asText(input.received_from),
    for_what: asText(input.for_what),
    month: asDate(input.month) ?? new Date().toISOString().slice(0, 10),
    currency,
    amount,
    my_percent: input.my_percent === "" || input.my_percent == null ? null : asNumber(input.my_percent),
    extra_profit: extra,
    extra_reason: asText(input.extra_reason),
    total_egp: totalEgp,
    notes: asText(input.notes),
  };
}

export async function saveOtherIncome(
  id: string | null,
  input: Record<string, unknown>,
): Promise<FinanceActionResult<FinanceOtherIncome>> {
  try {
    await requireAdmin();
    const admin = createAdminClient();
    const rates = await loadRates(admin);

    let base = input;
    if (id) {
      const { data: current } = await admin
        .from("finance_other_income")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      base = { ...(current ?? {}), ...input };
    }
    const row = buildIncome(base, rates);

    const query = id
      ? admin.from("finance_other_income").update(row).eq("id", id)
      : admin.from("finance_other_income").insert(row);
    const { data, error } = await query.select("*").single();
    if (error) throw new Error(error.message);

    refresh();
    return { success: true, data: data as unknown as FinanceOtherIncome };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteOtherIncome(id: string): Promise<FinanceActionResult> {
  try {
    await requireAdmin();
    const { error } = await createAdminClient()
      .from("finance_other_income")
      .delete()
      .eq("id", id);
    if (error) throw new Error(error.message);
    refresh();
    return { success: true };
  } catch (error) {
    return fail(error);
  }
}

/* ============================ سعر الاشتراك في طلبات الاشتراك ============================ */

export async function saveEnrollmentPricing(
  enrollmentId: string,
  input: { price: number | null; currency: string; offerLabel: string },
): Promise<FinanceActionResult> {
  try {
    await requireAdmin();
    const admin = createAdminClient();

    const { data: enrollment } = await admin
      .from("enrollments")
      .select("status")
      .eq("id", enrollmentId)
      .maybeSingle();
    if (!enrollment) throw new Error("طلب الاشتراك غير موجود");

    const price =
      input.price == null || !(Number(input.price) > 0)
        ? null
        : Number(input.price);

    const { error } = await admin
      .from("enrollments")
      .update({
        subscription_price: price,
        subscription_currency: normalizeCurrency(input.currency),
        offer_label: asText(input.offerLabel),
      })
      .eq("id", enrollmentId);
    if (error) throw new Error(error.message);

    // لو الاشتراك مقبول بالفعل ولديه سجل دفع، نزامنه
    const { data: existing } = await admin
      .from("finance_payments")
      .select("id")
      .eq("enrollment_id", enrollmentId)
      .maybeSingle();
    if (existing && price) {
      await updatePayment(String(existing.id), {
        currency: input.currency,
        amount_total: price,
        amount_paid: price,
        offer_label: input.offerLabel,
      });
    }

    revalidatePath("/admin/students/enrollment-requests");
    return { success: true };
  } catch (error) {
    return fail(error);
  }
}

/* ============================ بيانات الدفع قبل القبول ============================ */

/**
 * بيانات الدفع التي تُملأ في جدول طلبات الاشتراك قبل القبول،
 * وتُنقل كما هي إلى جدول المدفوعات عند قبول الطلب.
 * (السعر بعد الخصم والعملة والعرض محفوظة في أعمدة الطلب نفسها.)
 */
export interface EnrollmentPaymentDraft {
  edition_code?: string | null;
  delivery_type?: "recorded" | "interactive" | null;
  list_price?: number | null;
  amount_paid?: number | null;
  payment_status?: PaymentStatus | null;
  paid_at?: string | null;
  notes?: string | null;
  needs_followup?: boolean;
  followup_date?: string | null;
  followup_reason?: string | null;
}

function sanitizePaymentDraft(
  input: Record<string, unknown>,
): EnrollmentPaymentDraft {
  const optionalNumber = (v: unknown) =>
    v === "" || v == null ? null : asNumber(v);

  const needsFollowup = Boolean(input.needs_followup);

  return {
    edition_code: asText(input.edition_code),
    delivery_type:
      input.delivery_type === "recorded" || input.delivery_type === "interactive"
        ? input.delivery_type
        : null,
    list_price: optionalNumber(input.list_price),
    amount_paid: optionalNumber(input.amount_paid),
    payment_status: ["paid", "partial", "unpaid"].includes(String(input.payment_status))
      ? (input.payment_status as PaymentStatus)
      : null,
    paid_at: asDate(input.paid_at),
    notes: asText(input.notes),
    needs_followup: needsFollowup,
    followup_date: needsFollowup ? asDate(input.followup_date) : null,
    followup_reason: needsFollowup ? asText(input.followup_reason) : null,
  };
}

export async function saveEnrollmentPaymentDraft(
  enrollmentId: string,
  input: Record<string, unknown>,
): Promise<FinanceActionResult<EnrollmentPaymentDraft>> {
  try {
    await requireAdmin();
    const admin = createAdminClient();

    const draft = sanitizePaymentDraft(input);

    if (draft.needs_followup && !(draft.followup_reason && draft.followup_date)) {
      throw new Error("اكتب سبب المتابعة وحدّد موعدها.");
    }

    const { error } = await admin
      .from("enrollments")
      .update({ payment_draft: draft })
      .eq("id", enrollmentId);
    if (error) throw new Error(error.message);

    revalidatePath("/admin/students/enrollment-requests");
    return { success: true, data: draft };
  } catch (error) {
    return fail(error);
  }
}

/** رمز الإصدار التلقائي حسب نوع الاشتراك (C3D-F / C3D-A / C3D-F+A / VT ...). */
async function suggestEditionCode(
  admin: ReturnType<typeof createAdminClient>,
  courseCode: string | null,
  journeyKind: JourneyKind,
): Promise<string | null> {
  if (!editionPrefixOf(courseCode)) return null;

  // كورس بمرحلتين (أساسيات / متقدم) حسب courses.level.
  const { data: courseRow } = await admin
    .from("courses")
    .select("level")
    .eq("course_code", courseCode)
    .limit(1)
    .maybeSingle();

  return buildEditionCode({
    courseCode,
    journeyKind,
    isSplitCourse:
      String(courseRow?.level ?? "").toLowerCase() === "split",
  });
}

/* ============================ إنشاء سجل الدفع عند القبول ============================ */

const FREE_JOURNEYS = new Set(["free", "free_session", "free_journey"]);

export async function createPaymentForEnrollment(
  enrollmentId: string,
  followup?: { reason: string; date: string } | null,
): Promise<FinanceActionResult<{ created: boolean }>> {
  try {
    await requireAdmin();
    const admin = createAdminClient();

    // select("*") حتى يعمل الكود قبل وبعد إضافة عمود payment_draft.
    const { data: enrollment } = await admin
      .from("enrollments")
      .select("*")
      .eq("id", enrollmentId)
      .maybeSingle();
    if (!enrollment) throw new Error("طلب الاشتراك غير موجود");

    const draft = sanitizePaymentDraft(
      (enrollment.payment_draft ?? {}) as Record<string, unknown>,
    );

    const journey = String(enrollment.journey_type ?? "")
      .toLowerCase()
      .replaceAll("-", "_");
    const isReward = enrollment.enrollment_source === "reward";
    if (!isReward && FREE_JOURNEYS.has(journey)) {
      return { success: true, data: { created: false } };
    }

    const { data: existing } = await admin
      .from("finance_payments")
      .select("id")
      .eq("enrollment_id", enrollmentId)
      .maybeSingle();
    if (existing) return { success: true, data: { created: false } };

    const [{ data: course }, { data: profile }, rates] = await Promise.all([
      admin
        .from("courses")
        .select("id,course_code")
        .eq("id", enrollment.course_id)
        .maybeSingle(),
      admin
        .from("profiles")
        .select("*")
        .eq("id", enrollment.user_id)
        .maybeSingle(),
      loadRates(admin),
    ]);

    // المكافآت تُسجَّل في المدفوعات بقيمة 0 مع سبب المكافأة وتاريخها.
    let rewardReason: string | null = null;
    if (isReward) {
      const { data: draw } = await admin
        .from("monthly_draws")
        .select("month_key")
        .eq("reward_enrollment_id", enrollmentId)
        .maybeSingle();
      const mk = draw?.month_key ? String(draw.month_key) : "";
      const [y, m] = mk.split("-");
      rewardReason = mk
        ? `مكافأة السحب الشهري لشهر ${Number(m)}-${y}`
        : "مكافأة بطاقة المكافآت";
    }

    // اشتراكات فريق العمل لا تُسجَّل في المدفوعات.
    if (
      isInternalEmail((profile as Record<string, unknown> | null)?.email) ||
      isInternalEmail(enrollment.student_email)
    ) {
      return { success: true, data: { created: false } };
    }

    const price = !isReward && enrollment.subscription_price
      ? Number(enrollment.subscription_price)
      : 0;
    const currency = normalizeCurrency(enrollment.subscription_currency);
    const profileRow = (profile ?? {}) as Record<string, unknown>;

    /*
     * بيانات التسجيل (الاسم بالإنجليزي، الهاتف، بلد الإقامة) تُحفظ أيضًا مع الحساب
     * في Supabase Auth؛ نستخدمها إذا كانت ناقصة في جدول profiles.
     */
    let authMeta: Record<string, unknown> = {};
    let authEmail: string | null = null;
    if (enrollment.user_id) {
      const { data: authUser } = await admin.auth.admin.getUserById(
        String(enrollment.user_id),
      );
      authMeta = (authUser?.user?.user_metadata ?? {}) as Record<string, unknown>;
      authEmail = authUser?.user?.email ?? null;
    }

    const firstText = (...values: unknown[]) => {
      for (const v of values) {
        const t = asText(v);
        if (t) return t;
      }
      return null;
    };

    const journeyKind = normalizeJourneyKind(journey);
    const editionCode =
      draft.edition_code ??
      (await suggestEditionCode(admin, course?.course_code ?? null, journeyKind));

    // المتابعة: المحددة في بيانات الدفع بالجدول، أو المطلوبة عند القبول بدون سعر.
    const followupDate = draft.needs_followup
      ? draft.followup_date ?? null
      : !price && followup
        ? asDate(followup.date)
        : null;
    const followupReason = draft.needs_followup
      ? draft.followup_reason ?? null
      : !price && followup
        ? asText(followup.reason)
        : null;

    const amountPaid = isReward
      ? 0
      : draft.amount_paid ?? price;
    const paymentStatus: PaymentStatus = isReward
      ? "paid"
      : draft.payment_status ?? derivePaymentStatus(price || null, amountPaid);

    const offerLabel = asText(enrollment.offer_label);
    let offerId: string | null = null;
    if (offerLabel) {
      const { data: offer } = await admin
        .from("finance_offers")
        .select("id")
        .eq("name", offerLabel)
        .maybeSingle();
      offerId = offer?.id ? String(offer.id) : null;
    }

    const row = {
      enrollment_id: enrollmentId,
      user_id: enrollment.user_id,
      course_id: course?.id ?? null,
      course_code: course?.course_code ?? null,
      student_name:
        firstText(profileRow.full_name, enrollment.student_name, authMeta.full_name) ??
        "طالب",
      certificate_name: firstText(
        profileRow.full_name_en,
        enrollment.student_name_en,
        enrollment.student_name_on_certificate,
        authMeta.full_name_en,
      ),
      email: firstText(profileRow.email, enrollment.student_email, authEmail),
      phone: firstText(
        profileRow.phone,
        profileRow.phone_number,
        profileRow.whatsapp_number,
        authMeta.phone,
      ),
      nationality: firstText(profileRow.nationality, authMeta.nationality),
      country: firstText(profileRow.country, profileRow.country_name, authMeta.country),
      offer_id: offerId,
      offer_label: offerLabel,
      edition_code: editionCode,
      delivery_type: draft.delivery_type ?? null,
      list_price: isReward ? null : draft.list_price ?? null,
      currency,
      amount_total: price || null,
      amount_paid: amountPaid,
      amount_egp: toEgp(amountPaid, currency, rates),
      payment_status: paymentStatus,
      // نوع الرحلة الفعلي من طلب الاشتراك: أساسيات / متقدم / متكاملة / يوم واحد.
      journey_kind: journeyKind,
      paid_at: draft.paid_at ?? new Date().toISOString().slice(0, 10),
      notes: draft.notes ?? null,
      followup_date: followupDate,
      followup_reason: followupReason,
      source: "enrollment",
      ...(isReward
        ? {
            is_reward: true,
            reward_reason: rewardReason,
            reward_date: new Date().toISOString().slice(0, 10),
            notes: rewardReason,
          }
        : {}),
    };

    let { error } = await admin.from("finance_payments").insert(row);

    // قبل تطبيق migration 20261028 يقبل الجدول "integrated" / "one_day" فقط.
    if (error?.code === "23514" && row.journey_kind !== "one_day") {
      ({ error } = await admin
        .from("finance_payments")
        .insert({ ...row, journey_kind: "integrated" }));
    }
    if (error) throw new Error(error.message);

    refresh();
    return { success: true, data: { created: true } };
  } catch (error) {
    return fail(error);
  }
}

/* ============================ الاستيراد من الإكسل ============================ */

export interface ImportPayload {
  payments: Array<Record<string, unknown>>;
  expenses: Array<Record<string, unknown>>;
  otherIncome: Array<Record<string, unknown>>;
}

export interface ImportResult {
  paymentsAdded: number;
  paymentsSkipped: number;
  expensesAdded: number;
  expensesSkipped: number;
  incomeAdded: number;
  incomeSkipped: number;
}

const firstEmail = (v: unknown) => {
  const m = String(v ?? "").match(/[^\s,&;]+@[^\s,&;]+/);
  return m ? m[0].toLowerCase() : "";
};

const paymentKey = (p: Record<string, unknown>) =>
  [
    firstEmail(p.email) || String(p.student_name ?? "").trim().toLowerCase(),
    String(p.edition_code ?? "").trim().toLowerCase(),
    String(p.paid_at ?? ""),
    Math.round(asNumber(p.amount_paid) * 100),
  ].join("|");

export async function commitFinanceImport(
  payload: ImportPayload,
): Promise<FinanceActionResult<ImportResult>> {
  try {
    await requireAdmin();
    const admin = createAdminClient();
    const rates = await loadRates(admin);

    const payments = (payload.payments ?? []).slice(0, 3000);
    const expenses = (payload.expenses ?? []).slice(0, 1000);
    const income = (payload.otherIncome ?? []).slice(0, 1000);

    const result: ImportResult = {
      paymentsAdded: 0,
      paymentsSkipped: 0,
      expensesAdded: 0,
      expensesSkipped: 0,
      incomeAdded: 0,
      incomeSkipped: 0,
    };

    /* ---- المدفوعات (نضيف الناقص فقط) ---- */
    const { data: existingPayments } = await admin
      .from("finance_payments")
      .select("email,student_name,edition_code,paid_at,amount_paid");
    const seen = new Set(
      (existingPayments ?? []).map((p) => paymentKey(p as Record<string, unknown>)),
    );

    const toInsert: Array<Record<string, unknown>> = [];
    for (const raw of payments) {
      const clean = buildPaymentPatch(raw);
      const currency = String(clean.currency ?? "EGP");
      const paid = asNumber(clean.amount_paid);
      const total = clean.amount_total == null ? null : asNumber(clean.amount_total);
      const row: Record<string, unknown> = {
        ...clean,
        currency,
        amount_paid: paid,
        // نحسب المبلغ بالجنيه من بيانات الدفع وأسعار الصرف، لا من رقم الإكسل.
        amount_egp: toEgp(paid, currency, rates),
        payment_status:
          (clean.payment_status as PaymentStatus | undefined) ??
          derivePaymentStatus(total, paid),
        course_code: clean.course_code ?? null,
        source: "import",
      };
      if (!row.student_name) row.student_name = "—";

      // متابعات الإكسل القديمة: لا نرسل لها تنبيهات جماعية عند الاستيراد.
      if (
        row.followup_date &&
        String(row.followup_date) <= new Date().toISOString().slice(0, 10)
      ) {
        row.followup_notified_at = new Date().toISOString();
      }

      const key = paymentKey(row);
      if (seen.has(key)) {
        result.paymentsSkipped += 1;
        continue;
      }
      seen.add(key);
      toInsert.push(row);
    }

    // ربط course_id بحسب رمز الكورس
    const { data: courseRows } = await admin
      .from("courses")
      .select("id,course_code");
    const courseIdByCode = new Map(
      (courseRows ?? []).map((c) => [String(c.course_code), String(c.id)]),
    );
    for (const row of toInsert) {
      row.course_id = courseIdByCode.get(String(row.course_code)) ?? null;
    }

    for (let i = 0; i < toInsert.length; i += 200) {
      const chunk = toInsert.slice(i, i + 200);
      const { error } = await admin.from("finance_payments").insert(chunk);
      if (error) throw new Error(`المدفوعات: ${error.message}`);
      result.paymentsAdded += chunk.length;
    }

    /* ---- المصروفات ---- */
    const { data: existingExpenses } = await admin
      .from("finance_expenses")
      .select("payee,start_month,total_amount");
    const expSeen = new Set(
      (existingExpenses ?? []).map(
        (e) => `${e.payee}|${e.start_month}|${Number(e.total_amount)}`,
      ),
    );
    const expRows: Array<Record<string, unknown>> = [];
    for (const raw of expenses) {
      // المستورد: متوقف (يحافظ على عدد المرات من الإكسل) ومصنّف تلقائيًا من الاسم.
      const row = buildExpense({ ...raw, is_running: false }, rates);
      const key = `${row.payee}|${row.start_month}|${row.total_amount}`;
      if (expSeen.has(key)) {
        result.expensesSkipped += 1;
        continue;
      }
      expSeen.add(key);
      expRows.push(row);
    }
    if (expRows.length) {
      const { error } = await admin.from("finance_expenses").insert(expRows);
      if (error) throw new Error(`المصروفات: ${error.message}`);
      result.expensesAdded = expRows.length;
    }

    /* ---- دخل بيع النسخ ---- */
    const { data: existingIncome } = await admin
      .from("finance_other_income")
      .select("for_what,month,amount");
    const incSeen = new Set(
      (existingIncome ?? []).map(
        (i) => `${i.for_what}|${i.month}|${Number(i.amount)}`,
      ),
    );
    const incRows: Array<Record<string, unknown>> = [];
    for (const raw of income) {
      const row = buildIncome(raw, rates);
      const key = `${row.for_what}|${row.month}|${row.amount}`;
      if (incSeen.has(key)) {
        result.incomeSkipped += 1;
        continue;
      }
      incSeen.add(key);
      incRows.push(row);
    }
    if (incRows.length) {
      const { error } = await admin.from("finance_other_income").insert(incRows);
      if (error) throw new Error(`دخل النسخ: ${error.message}`);
      result.incomeAdded = incRows.length;
    }

    refresh();
    return { success: true, data: result };
  } catch (error) {
    return fail(error);
  }
}
