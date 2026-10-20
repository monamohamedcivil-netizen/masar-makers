// أنواع وأدوات مشتركة لنظام المدفوعات (آمنة للاستخدام في السيرفر والمتصفح).

export type CurrencyCode = "EGP" | "USD" | "SAR";

export type PaymentStatus = "paid" | "partial" | "unpaid";

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  paid: "مدفوع كامل",
  partial: "مدفوع جزئي",
  unpaid: "غير مدفوع",
};

export const DEFAULT_RATES: Record<CurrencyCode, number> = {
  EGP: 1,
  USD: 50,
  SAR: 13.5,
};

export interface FinancePayment {
  id: string;
  enrollment_id: string | null;
  course_id: string | null;
  course_code: string | null;
  edition_code: string | null;
  delivery_type: "recorded" | "interactive" | null;
  student_name: string | null;
  certificate_name: string | null;
  email: string | null;
  phone: string | null;
  nationality: string | null;
  country: string | null;
  offer_id: string | null;
  offer_label: string | null;
  list_price: number | null;
  currency: string;
  amount_total: number | null;
  amount_paid: number;
  amount_egp: number;
  payment_status: PaymentStatus;
  paid_at: string | null;
  notes: string | null;
  followup_date: string | null;
  followup_reason: string | null;
  followup_done: boolean;
  activation_key: string | null;
  email_sent: boolean;
  expires_at: string | null;
  certificate_issued: boolean;
  survey_done: boolean;
  source: "enrollment" | "import" | "manual";
  journey_kind: "integrated" | "one_day";
  created_at: string;
  /** يُحسب تلقائيًا: none = لم يسجّل بالمنصة، registered = له حساب بلا اشتراك نشط بالكورس، enrolled = مشترك. */
  account_status?: "none" | "registered" | "enrolled";
}

export type CourseStage = "fundamental" | "advanced" | "other";

/** مرحلة الاشتراك من رمز الإصدار: C3D-F1 / CSD-F2 أساسيات، CSD-A1 متقدم. */
export function stageOfEdition(edition: string | null | undefined): CourseStage {
  const code = String(edition ?? "").toUpperCase();
  if (/-F/.test(code)) return "fundamental";
  if (/-A/.test(code)) return "advanced";
  return "other";
}

export interface FinanceOffer {
  id: string;
  name: string;
  discount_percent: number;
  sort_order: number;
  is_active: boolean;
}

export interface FinancePriceItem {
  code: string;
  label: string;
  course_code: string | null;
  price_egp: number;
  price_sar: number;
  price_usd: number;
  sort_order: number;
}

export type ExpenseCategory = "ads" | "platform" | "other";
export type BillingPeriod = "daily" | "monthly" | "yearly";

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  ads: "إعلانات مدفوعة",
  platform: "خدمات المنصة",
  other: "مصروفات أخرى",
};

export const BILLING_PERIOD_LABELS: Record<BillingPeriod, string> = {
  daily: "يومي",
  monthly: "شهري",
  yearly: "سنوي",
};

export interface FinanceExpense {
  id: string;
  payee: string;
  start_month: string;
  end_month: string | null;
  /** عدد مرات الصرف (للمتوقف: المخزَّن، وللمستمر: يُحسب تلقائيًا حتى اليوم) */
  months_count: number;
  currency: string;
  monthly_amount: number;
  total_amount: number;
  total_egp: number;
  notes: string | null;
  category: ExpenseCategory;
  billing_period: BillingPeriod;
  is_running: boolean;
  service_id: string | null;
  /** يُملأ للصفوف المرتبطة بخدمة: اسم الخدمة */
  service_name?: string | null;
}

export interface FinanceService {
  id: string;
  name: string;
  category: ExpenseCategory;
  amount: number | null;
  currency: string;
  billing_period: BillingPeriod;
  started_on: string | null;
  stopped_on: string | null;
  is_running: boolean;
  next_renewal: string | null;
  next_renewal_note: string | null;
  last_payment_note: string | null;
  notes: string | null;
  sort_order: number;
}

export interface FinanceOtherIncome {
  id: string;
  received_from: string | null;
  for_what: string | null;
  month: string;
  currency: string;
  amount: number;
  my_percent: number | null;
  extra_profit: number;
  extra_reason: string | null;
  total_egp: number;
  notes: string | null;
}

export type FinanceRates = Record<string, number>;

/** يحوّل رمز العملة المكتوب في الإكسل ($ / SAR / EGP ...) إلى رمز موحّد. */
export function normalizeCurrency(value: unknown): string {
  const raw = String(value ?? "").trim().toUpperCase();
  if (raw === "$" || raw === "USD" || raw === "دولار") return "USD";
  if (raw === "SAR" || raw === "ريال" || raw === "SR") return "SAR";
  return "EGP";
}

export function toEgp(
  amount: number,
  currency: string,
  rates: FinanceRates,
): number {
  const rate = rates[currency] ?? DEFAULT_RATES[currency as CurrencyCode] ?? 1;
  return Math.round(amount * rate * 100) / 100;
}

export function derivePaymentStatus(
  total: number | null | undefined,
  paid: number,
): PaymentStatus {
  if (!(paid > 0)) return "unpaid";
  if (total && total > 0 && paid < total) return "partial";
  return "paid";
}

/** تحويل رمز نسخة الإكسل (C3D-F1, CSD-A1, BIM1, PD1, VT1) إلى رمز الكورس في المنصة. */
export function courseCodeFromEdition(edition: string | null | undefined) {
  const code = String(edition ?? "").trim().toUpperCase();
  if (!code) return null;
  const head = code.split(/[-.\s]/)[0].replace(/\d+$/, "");
  if (head === "PD") return "SPD";
  return head || null;
}

export function monthKey(date: string | null | undefined) {
  return date ? date.slice(0, 7) : "";
}

/** تصنيف مصروف مستورد من اسم المستلم (إعلانات / خدمات المنصة / أخرى) ودورة الصرف. */
export function classifyExpense(payee: string): {
  category: ExpenseCategory;
  period: BillingPeriod;
} {
  const name = payee.toLowerCase();
  if (/meta|إعلان|اعلان|ads/.test(name)) return { category: "ads", period: "daily" };
  if (/namecheap|domain|دوماين|دومين/.test(name))
    return { category: "platform", period: "yearly" };
  if (/zoom|cloudways|chatgpt|openai|bunny|digitalocean|cloud|claude|resend|سيرفر/.test(name))
    return { category: "platform", period: "monthly" };
  return { category: "other", period: "monthly" };
}
