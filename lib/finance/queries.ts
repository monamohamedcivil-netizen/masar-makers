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
  courses: Array<{ id: string; code: string; title: string }>;
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
    admin.from("courses").select("id,course_code,title,title_ar,career_path_id"),
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
      })),
  }));

  const rates: FinanceRates = { ...DEFAULT_RATES };
  for (const r of (ratesRes.data ?? []) as Array<Record<string, unknown>>) {
    rates[String(r.currency)] = num(r.rate_to_egp) || 1;
  }

  return {
    paths,
    payments: ((paymentsRes.data ?? []) as Array<Record<string, unknown>>).map(
      mapPayment,
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
