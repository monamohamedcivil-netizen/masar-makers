"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/server";
import { mapPayment } from "@/lib/finance/queries";
import {
  DEFAULT_RATES,
  derivePaymentStatus,
  normalizeCurrency,
  toEgp,
  type FinanceExpense,
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

const PAYMENT_BOOL_FIELDS = [
  "email_sent",
  "certificate_issued",
  "survey_done",
  "followup_done",
] as const;

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

    refresh();
    return { success: true, data: mapPayment(updated as Record<string, unknown>) };
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

    refresh();
    return { success: true, data: mapPayment(data as Record<string, unknown>) };
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

function buildExpense(
  input: Record<string, unknown>,
  rates: FinanceRates,
): Record<string, unknown> {
  const months = Math.max(1, Math.round(asNumber(input.months_count, 1)));
  const monthly = asNumber(input.monthly_amount);
  const currency = normalizeCurrency(input.currency);
  const total = Math.round(monthly * months * 100) / 100;
  return {
    payee: asText(input.payee) ?? "مصروف",
    start_month: asDate(input.start_month) ?? new Date().toISOString().slice(0, 10),
    end_month: asDate(input.end_month),
    months_count: months,
    currency,
    monthly_amount: monthly,
    total_amount: total,
    total_egp: toEgp(total, currency, rates),
    notes: asText(input.notes),
  };
}

export async function saveExpense(
  id: string | null,
  input: Record<string, unknown>,
): Promise<FinanceActionResult<FinanceExpense>> {
  try {
    await requireAdmin();
    const admin = createAdminClient();
    const rates = await loadRates(admin);

    let base = input;
    if (id) {
      const { data: current } = await admin
        .from("finance_expenses")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      base = { ...(current ?? {}), ...input };
    }
    const row = buildExpense(base, rates);

    const query = id
      ? admin.from("finance_expenses").update(row).eq("id", id)
      : admin.from("finance_expenses").insert(row);
    const { data, error } = await query.select("*").single();
    if (error) throw new Error(error.message);

    refresh();
    return { success: true, data: data as unknown as FinanceExpense };
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
  // الإجمالي بالجنيه = المبلغ المحوَّل + الربح الإضافي (بالجنيه)
  const totalEgp =
    input.total_egp !== undefined && input.total_egp !== "" && input.__manualTotal
      ? asNumber(input.total_egp)
      : Math.round((toEgp(amount, currency, rates) + extra) * 100) / 100;
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

/* ============================ إنشاء سجل الدفع عند القبول ============================ */

const FREE_JOURNEYS = new Set(["free", "free_session", "free_journey"]);

export async function createPaymentForEnrollment(
  enrollmentId: string,
  followup?: { reason: string; date: string } | null,
): Promise<FinanceActionResult<{ created: boolean }>> {
  try {
    await requireAdmin();
    const admin = createAdminClient();

    const { data: enrollment } = await admin
      .from("enrollments")
      .select(
        "id,user_id,course_id,student_name,student_email,journey_type,enrollment_source,subscription_price,subscription_currency,offer_label",
      )
      .eq("id", enrollmentId)
      .maybeSingle();
    if (!enrollment) throw new Error("طلب الاشتراك غير موجود");

    const journey = String(enrollment.journey_type ?? "")
      .toLowerCase()
      .replaceAll("-", "_");
    if (enrollment.enrollment_source === "reward" || FREE_JOURNEYS.has(journey)) {
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

    const price = enrollment.subscription_price
      ? Number(enrollment.subscription_price)
      : 0;
    const currency = normalizeCurrency(enrollment.subscription_currency);
    const profileRow = (profile ?? {}) as Record<string, unknown>;

    const followupDate = !price && followup ? asDate(followup.date) : null;
    const followupReason = !price && followup ? asText(followup.reason) : null;

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

    const { error } = await admin.from("finance_payments").insert({
      enrollment_id: enrollmentId,
      user_id: enrollment.user_id,
      course_id: course?.id ?? null,
      course_code: course?.course_code ?? null,
      student_name:
        asText(profileRow.full_name) ?? asText(enrollment.student_name) ?? "طالب",
      certificate_name: asText(profileRow.full_name_en) ?? null,
      email: asText(profileRow.email) ?? asText(enrollment.student_email),
      phone: asText(profileRow.phone) ?? asText(profileRow.phone_number),
      country: asText(profileRow.country),
      offer_id: offerId,
      offer_label: offerLabel,
      currency,
      amount_total: price || null,
      amount_paid: price,
      amount_egp: toEgp(price, currency, rates),
      payment_status: price ? "paid" : "unpaid",
      paid_at: new Date().toISOString().slice(0, 10),
      followup_date: followupDate,
      followup_reason: followupReason,
      source: "enrollment",
    });
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
        amount_egp:
          raw.amount_egp !== undefined && raw.amount_egp !== null && raw.amount_egp !== ""
            ? asNumber(raw.amount_egp)
            : toEgp(paid, currency, rates),
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
      const row = buildExpense(raw, rates);
      // نحافظ على الإجماليات كما هي في الإكسل إن وُجدت
      if (raw.total_amount !== undefined && raw.total_amount !== null)
        row.total_amount = asNumber(raw.total_amount);
      if (raw.total_egp !== undefined && raw.total_egp !== null)
        row.total_egp = asNumber(raw.total_egp);
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
      if (raw.total_egp !== undefined && raw.total_egp !== null)
        row.total_egp = asNumber(raw.total_egp);
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
