import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/server";

import {
  DEFAULT_RATES,
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
  otherIncome: FinanceOtherIncome[];
}

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

export function mapPayment(row: Record<string, unknown>): FinancePayment {
  return {
    ...(row as unknown as FinancePayment),
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
        .in("status", ["active", "approved"])
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
    const stage = stageOfEdition(p.edition_code);
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
    admin.from("finance_price_items").select("*").order("sort_order"),
    admin.from("finance_exchange_rates").select("*"),
    admin
      .from("finance_expenses")
      .select("*")
      .order("start_month", { ascending: false }),
    admin
      .from("finance_other_income")
      .select("*")
      .order("month", { ascending: false }),
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

  return {
    paths,
    payments: await applyAutoFlags(
      admin,
      ((paymentsRes.data ?? []) as Array<Record<string, unknown>>).map(
        mapPayment,
      ),
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
    priceItems: (
      (pricesRes.data ?? []) as Array<Record<string, unknown>>
    ).map((p) => ({
      code: String(p.code),
      label: String(p.label),
      course_code: (p.course_code as string | null) ?? null,
      price_egp: num(p.price_egp),
      price_sar: num(p.price_sar),
      price_usd: num(p.price_usd),
      sort_order: num(p.sort_order),
    })),
    rates,
    expenses: ((expensesRes.data ?? []) as Array<Record<string, unknown>>).map(
      (e) => ({
        ...(e as unknown as FinanceExpense),
        months_count: num(e.months_count) || 1,
        monthly_amount: num(e.monthly_amount),
        total_amount: num(e.total_amount),
        total_egp: num(e.total_egp),
      }),
    ),
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
