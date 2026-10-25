import {
  INTERNAL_ACCOUNT_EMAILS,
  getInternalAccountUserIds,
} from "@/lib/admin/internal-accounts";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/server";

import { computeExpenseTotals } from "./expense-calc";
import {
  DEFAULT_RATES,
  normalizeJourneyKind,
  stageOfPayment,
  type BillingPeriod,
  type ExpenseCategory,
  type FinanceService,
  type FinanceExpense,
  type FinanceOffer,
  type FinanceOtherIncome,
  type FinancePayment,
  type FinancePriceItem,
  type FinanceRates,
} from "./shared";

export interface FinancePathTab {
  id: string;
  title: string;
  courses: Array<{
    id: string;
    code: string;
    title: string;
    /** كورس بمرحلتين (أساسيات ومتقدم) */
    split: boolean;
  }>;
}

export interface FinanceData {
  paths: FinancePathTab[];
  payments: FinancePayment[];
  offers: FinanceOffer[];
  priceItems: FinancePriceItem[];
  rates: FinanceRates;
  expenses: FinanceExpense[];
  services: FinanceService[];
  /** مصروفات كل سنة بالجنيه (محسوبة تلقائيًا حتى اليوم) */
  expensesByYear: Record<string, number>;
  otherIncome: FinanceOtherIncome[];
}

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

export function mapPayment(row: Record<string, unknown>): FinancePayment {
  return {
    ...(row as unknown as FinancePayment),
    journey_kind: normalizeJourneyKind(row.journey_kind),
    list_price: row.list_price == null ? null : num(row.list_price),
    amount_total: row.amount_total == null ? null : num(row.amount_total),
    amount_paid: num(row.amount_paid),
    amount_egp: num(row.amount_egp),
  };
}

const EMAIL_RE = /[^\s,&;]+@[^\s,&;]+\.[^\s,&;]+/g;

/**
 * يحدد تلقائيًا (من بيانات المنصة) هل صدرت شهادة للطالب في هذا الكورس،
 * وهل أنجز الاستبيان؛ بالمطابقة عبر حساب الطالب (أو بريده) والكورس.
 */
export async function applyAutoFlags(
  admin: ReturnType<typeof createAdminClient>,
  rows: FinancePayment[],
): Promise<FinancePayment[]> {
  if (rows.length === 0) return rows;

  const enrollmentIds = rows
    .map((r) => r.enrollment_id)
    .filter((v): v is string => Boolean(v));

  const [certRes, surveyRes, profileRes, courseRes, enrollRes, allEnrollRes] =
    await Promise.all([
      admin
        .from("certificates")
        .select("user_id,course_id,student_email,status,revoked_at,certificate_type")
        .eq("status", "issued")
        .is("revoked_at", null)
        .limit(5000),
      admin
        .from("student_surveys")
        .select(
          "user_id,course_id,student_email,rating,general_survey_completed,detailed_survey_completed",
        )
        .limit(5000),
      admin.from("profiles").select("id,email").limit(5000),
      admin.from("courses").select("id,course_code"),
      enrollmentIds.length
        ? admin.from("enrollments").select("id,user_id").in("id", enrollmentIds)
        : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
      admin
        .from("enrollments")
        .select("user_id,course_id,status")
        .in("status", ["active", "completed", "expired", "suspended"])
        .limit(5000),
    ]);

  const lower = (v: unknown) => String(v ?? "").trim().toLowerCase();

  // مفاتيح الشهادات: على مستوى الكورس، ومع المرحلة (fundamental / advanced).
  const certKeys = new Set<string>();
  for (const c of (certRes.data ?? []) as Array<Record<string, unknown>>) {
    const stage = lower(c.certificate_type);
    const add = (base: string) => {
      certKeys.add(base);
      if (stage) certKeys.add(`${base}|${stage}`);
    };
    if (c.user_id) add(`u:${c.user_id}|${c.course_id}`);
    if (c.student_email) add(`e:${lower(c.student_email)}|${c.course_id}`);
  }

  const enrolledKeys = new Set<string>();
  for (const e of (allEnrollRes.data ?? []) as Array<Record<string, unknown>>) {
    enrolledKeys.add(`${e.user_id}|${e.course_id}`);
  }

  const surveyKeys = new Set<string>();
  for (const sv of (surveyRes.data ?? []) as Array<Record<string, unknown>>) {
    const done =
      sv.rating != null ||
      sv.general_survey_completed === true ||
      sv.detailed_survey_completed === true;
    if (!done) continue;
    if (sv.user_id) surveyKeys.add(`u:${sv.user_id}|${sv.course_id}`);
    if (sv.student_email)
      surveyKeys.add(`e:${lower(sv.student_email)}|${sv.course_id}`);
  }

  const userByEmail = new Map<string, string>();
  for (const pr of (profileRes.data ?? []) as Array<Record<string, unknown>>) {
    if (pr.email) userByEmail.set(lower(pr.email), String(pr.id));
  }

  const courseByCode = new Map<string, string>();
  for (const c of (courseRes.data ?? []) as Array<Record<string, unknown>>) {
    if (c.course_code) courseByCode.set(String(c.course_code), String(c.id));
  }

  const userByEnrollment = new Map<string, string>();
  for (const e of (enrollRes.data ?? []) as Array<Record<string, unknown>>) {
    userByEnrollment.set(String(e.id), String(e.user_id));
  }

  return rows.map((p) => {
    const courseId =
      p.course_id ?? (p.course_code ? courseByCode.get(p.course_code) : undefined);
    if (!courseId)
      return {
        ...p,
        certificate_issued: false,
        survey_done: false,
        account_status: "none",
      };

    const emails = (p.email ?? "").toLowerCase().match(EMAIL_RE) ?? [];
    const userIds = new Set<string>();
    const direct =
      (p.enrollment_id ? userByEnrollment.get(p.enrollment_id) : undefined) ??
      (p as FinancePayment & { user_id?: string | null }).user_id;
    if (direct) userIds.add(direct);
    for (const em of emails) {
      const uid = userByEmail.get(em);
      if (uid) userIds.add(uid);
    }

    const keys = [
      ...[...userIds].map((u) => `u:${u}|${courseId}`),
      ...emails.map((em) => `e:${em}|${courseId}`),
    ];

    // الكورس بمرحلتين: الشهادة تُقرأ للمرحلة نفسها (أساسيات / متقدم).
    const stage = stageOfPayment(p);
    const certKeysToCheck =
      stage === "other" ? keys : keys.map((k) => `${k}|${stage}`);

    const accountStatus: FinancePayment["account_status"] =
      userIds.size === 0
        ? "none"
        : [...userIds].some((u) => enrolledKeys.has(`${u}|${courseId}`))
          ? "enrolled"
          : "registered";

    return {
      ...p,
      certificate_issued: certKeysToCheck.some((k) => certKeys.has(k)),
      survey_done: keys.some((k) => surveyKeys.has(k)),
      account_status: accountStatus,
    };
  });
}

/*
 * «أسعار الكورسات الأساسية» مربوطة بأسعار الكورسات في «قوائم الشات والأسعار»:
 * كل كورس (أو كل نوع اشتراك: أساسيات / متقدم / متكامل) + السعر العام لرحلة اليوم الواحد.
 * السعر الأساسي = السعر قبل الخصم (original_price) وإلا السعر الحالي.
 */
async function loadChatPriceList(
  admin: ReturnType<typeof createAdminClient>,
): Promise<FinancePriceItem[]> {
  const [{ data: courses }, { data: variants }, { data: prices }, { data: oneDay }] =
    await Promise.all([
      admin
        .from("whatsapp_courses")
        .select("id,title,whatsapp_label,course_key,has_variants,is_active,sort_order")
        .eq("is_active", true)
        .order("sort_order"),
      admin
        .from("whatsapp_course_variants")
        .select("id,course_id,title,title_en,is_active,sort_order")
        .eq("is_active", true)
        .order("sort_order"),
      admin
        .from("whatsapp_course_prices")
        .select("course_id,variant_id,currency_code,current_price,original_price,is_active,sort_order")
        .eq("is_active", true)
        .order("sort_order"),
      admin
        .from("whatsapp_oneday_prices")
        .select("course_id,lesson_id,currency_code,current_price,original_price,is_active,sort_order")
        .eq("is_active", true)
        .is("lesson_id", null)
        .order("sort_order"),
    ]);

  const basePrice = (r: Record<string, unknown>) => {
    const original = r.original_price == null ? NaN : Number(r.original_price);
    if (Number.isFinite(original) && original > 0) return original;
    const current = Number(r.current_price);
    return Number.isFinite(current) && current > 0 ? current : null;
  };
  const pick = (rows: Array<Record<string, unknown>>, code: string) => {
    const row = rows.find((r) => String(r.currency_code).toUpperCase() === code);
    return row ? basePrice(row) : null;
  };
  const toItem = (
    code: string,
    label: string,
    rows: Array<Record<string, unknown>>,
    sort: number,
  ): FinancePriceItem => ({
    code,
    label,
    course_code: null,
    price_egp: pick(rows, "EGP"),
    price_sar: pick(rows, "SAR"),
    price_usd: pick(rows, "USD"),
    sort_order: sort,
  });

  const items: FinancePriceItem[] = [];
  let sort = 0;
  for (const c of (courses ?? []) as Array<Record<string, unknown>>) {
    const name = String(c.whatsapp_label || c.title || c.course_key || "");
    const coursePrices = ((prices ?? []) as Array<Record<string, unknown>>).filter(
      (p) => String(p.course_id) === String(c.id),
    );
    const courseVariants = ((variants ?? []) as Array<Record<string, unknown>>).filter(
      (v) => String(v.course_id) === String(c.id),
    );

    if (c.has_variants && courseVariants.length) {
      for (const v of courseVariants) {
        const rows = coursePrices.filter((p) => String(p.variant_id) === String(v.id));
        items.push(toItem(`${c.id}:${v.id}`, `${name} — ${String(v.title_en || v.title || "")}`, rows, sort++));
      }
    } else {
      const rows = coursePrices.filter((p) => !p.variant_id);
      items.push(toItem(`${c.id}:main`, name, rows, sort++));
    }

    const oneDayRows = ((oneDay ?? []) as Array<Record<string, unknown>>).filter(
      (p) => String(p.course_id) === String(c.id),
    );
    if (oneDayRows.length) {
      items.push(toItem(`${c.id}:oneday`, `${name} — رحلة يوم واحد`, oneDayRows, sort++));
    }
  }

  return items.filter(
    (i) => i.price_egp != null || i.price_sar != null || i.price_usd != null,
  );
}

export async function getFinanceData(): Promise<FinanceData> {
  await requireAdmin();
  const admin = createAdminClient();

  const [
    pathsRes,
    coursesRes,
    paymentsRes,
    offersRes,
    pricesRes,
    ratesRes,
    expensesRes,
    incomeRes,
    servicesRes,
  ] = await Promise.all([
    admin
      .from("career_paths")
      .select("id,title,title_ar,display_order,is_active")
      .order("display_order"),
    admin
      .from("courses")
      .select("id,course_code,title,title_ar,career_path_id,level"),
    admin
      .from("finance_payments")
      .select("*")
      .order("paid_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false }),
    admin.from("finance_offers").select("*").order("sort_order"),
    loadChatPriceList(admin),
    admin.from("finance_exchange_rates").select("*"),
    admin
      .from("finance_expenses")
      .select("*")
      .order("start_month", { ascending: false }),
    admin
      .from("finance_other_income")
      .select("*")
      .order("month", { ascending: false }),
    admin.from("finance_services").select("*").order("sort_order"),
  ]);

  const courses = (coursesRes.data ?? []) as Array<Record<string, unknown>>;

  const paths: FinancePathTab[] = (
    (pathsRes.data ?? []) as Array<Record<string, unknown>>
  ).map((path) => ({
    id: String(path.id),
    title: String(path.title_ar || path.title || "مسار"),
    courses: courses
      .filter((c) => c.career_path_id === path.id && c.course_code)
      .map((c) => ({
        id: String(c.id),
        code: String(c.course_code),
        title: String(c.title_ar || c.title || c.course_code),
        split: c.level === "split",
      })),
  }));

  const rates: FinanceRates = { ...DEFAULT_RATES };
  for (const r of (ratesRes.data ?? []) as Array<Record<string, unknown>>) {
    rates[String(r.currency)] = num(r.rate_to_egp) || 1;
  }

  const today = new Date().toISOString().slice(0, 10);

  const services: FinanceService[] = (
    (servicesRes.data ?? []) as Array<Record<string, unknown>>
  ).map((sv) => ({
    id: String(sv.id),
    name: String(sv.name),
    category: (sv.category as ExpenseCategory) ?? "platform",
    amount: sv.amount == null ? null : num(sv.amount),
    currency: String(sv.currency ?? "USD"),
    billing_period: (sv.billing_period as BillingPeriod) ?? "monthly",
    started_on: (sv.started_on as string | null) ?? null,
    stopped_on: (sv.stopped_on as string | null) ?? null,
    is_running: sv.is_running === true,
    next_renewal: (sv.next_renewal as string | null) ?? null,
    next_renewal_note: (sv.next_renewal_note as string | null) ?? null,
    last_payment_note: (sv.last_payment_note as string | null) ?? null,
    notes: (sv.notes as string | null) ?? null,
    sort_order: num(sv.sort_order),
  }));
  const serviceById = new Map(services.map((sv) => [sv.id, sv]));

  const expensesByYear: Record<string, number> = {};
  const expenses: FinanceExpense[] = (
    (expensesRes.data ?? []) as Array<Record<string, unknown>>
  ).map((e) => {
    const service = e.service_id ? serviceById.get(String(e.service_id)) : null;

    const base = service
      ? {
          start: service.started_on ?? (e.start_month as string),
          period: service.billing_period,
          amount: service.amount ?? 0,
          currency: service.currency,
          running: service.is_running,
          fixedCount: null,
          stoppedOn: service.stopped_on,
        }
      : {
          start: e.start_month as string,
          period: ((e.billing_period as BillingPeriod) ?? "monthly") as BillingPeriod,
          amount: num(e.monthly_amount),
          currency: String(e.currency ?? "EGP"),
          running: e.is_running === true,
          fixedCount: num(e.months_count) || 1,
          stoppedOn: null,
        };

    const totals = computeExpenseTotals(base, today, rates);
    for (const [y, v] of Object.entries(totals.byYear)) {
      expensesByYear[y] = Math.round(((expensesByYear[y] ?? 0) + v) * 100) / 100;
    }

    return {
      id: String(e.id),
      payee: service ? service.name : String(e.payee),
      start_month: base.start,
      end_month: service
        ? service.stopped_on
        : ((e.end_month as string | null) ?? null),
      months_count: totals.count,
      currency: base.currency,
      monthly_amount: base.amount,
      total_amount: totals.totalAmount,
      total_egp: totals.totalEgp,
      notes: (e.notes as string | null) ?? null,
      category: service
        ? service.category
        : ((e.category as ExpenseCategory) ?? "other"),
      billing_period: base.period,
      is_running: base.running,
      service_id: service ? service.id : null,
      service_name: service ? service.name : null,
    };
  });

  // حسابات فريق العمل لا تظهر في المدفوعات ولا التقارير ولا الأعداد.
  const internalIds = new Set(await getInternalAccountUserIds());
  const internalEmails = new Set(
    INTERNAL_ACCOUNT_EMAILS.map((e) => e.toLowerCase()),
  );
  const isInternalPayment = (row: Record<string, unknown>) => {
    if (row.user_id && internalIds.has(String(row.user_id))) return true;
    const emails =
      String(row.email ?? "").toLowerCase().match(/[^\s,&;]+@[^\s,&;]+\.[^\s,&;]+/g) ?? [];
    return emails.some((e) => internalEmails.has(e));
  };

  return {
    paths,
    payments: await applyAutoFlags(
      admin,
      ((paymentsRes.data ?? []) as Array<Record<string, unknown>>)
        .filter((row) => !isInternalPayment(row))
        .map(mapPayment),
    ),
    offers: ((offersRes.data ?? []) as Array<Record<string, unknown>>).map(
      (o) => ({
        id: String(o.id),
        name: String(o.name),
        discount_percent: num(o.discount_percent),
        sort_order: num(o.sort_order),
        is_active: o.is_active !== false,
      }),
    ),
    priceItems: pricesRes,
    rates,
    expenses,
    services,
    expensesByYear,
    otherIncome: ((incomeRes.data ?? []) as Array<Record<string, unknown>>).map(
      (i) => ({
        ...(i as unknown as FinanceOtherIncome),
        amount: num(i.amount),
        my_percent: i.my_percent == null ? null : num(i.my_percent),
        extra_profit: num(i.extra_profit),
        total_egp: num(i.total_egp),
      }),
    ),
  };
}
