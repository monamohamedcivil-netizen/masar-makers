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
  journey_kind: JourneyKind;
  /** اشتراك مكافأة (مثل جائزة السحب الشهري) بلا دفع */
  is_reward?: boolean;
  reward_reason?: string | null;
  reward_date?: string | null;
  created_at: string;
  /** يُحسب تلقائيًا: none = لم يسجّل بالمنصة، registered = له حساب بلا اشتراك نشط بالكورس، enrolled = مشترك. */
  account_status?: "none" | "registered" | "enrolled";
}

/**
 * نوع رحلة الدفعة: أساسيات / متقدم / متكاملة (أساسيات + متقدم) / يوم واحد.
 * يأتي من نوع طلب الاشتراك (enrollments.journey_type) عند القبول.
 */
export type JourneyKind =
  | "integrated"
  | "fundamental"
  | "advanced"
  | "one_day";

export const JOURNEY_KIND_LABELS: Record<JourneyKind, string> = {
  fundamental: "أساسيات",
  advanced: "متقدم",
  integrated: "متكاملة",
  one_day: "يوم واحد",
};

/** يحوّل أي قيمة (من الجدول أو من نوع طلب الاشتراك) إلى نوع رحلة صالح. */
export function normalizeJourneyKind(value: unknown): JourneyKind {
  const v = String(value ?? "")
    .trim()
    .toLowerCase()
    .replaceAll("-", "_");
  if (["workshop", "one_day", "one_day_journey"].includes(v)) return "one_day";
  if (v === "fundamental" || v === "fundamentals") return "fundamental";
  if (v === "advanced") return "advanced";
  return "integrated";
}

export type CourseStage = "fundamental" | "advanced" | "other";

/**
 * مرحلة الاشتراك من رمز الإصدار:
 * C3D-F / CSD-F2 أساسيات، C3D-A / CSD-A1 متقدم، C3D-F+A متكاملة.
 */
export function stageOfEdition(edition: string | null | undefined): CourseStage {
  const code = String(edition ?? "").toUpperCase();
  const hasF = /-F(\d|\+|$)/.test(code);
  const hasA = /[-+]A(\d|$)/.test(code);
  // C3D-F+A (أو C3D-F1+A1 القديم) = اشتراك متكامل (أساسيات + متقدم)
  if (hasF && hasA) return "other";
  if (hasF) return "fundamental";
  if (hasA) return "advanced";
  return "other";
}

/**
 * رموز الإصدار تختلف عن رموز الكورسات لبعض الكورسات:
 * SPD → PD، SID → SIDRA، SYN → SYNCHRO، VIS → VISSIM.
 */
const EDITION_PREFIX_BY_COURSE: Record<string, string> = {
  SPD: "PD",
  SID: "SIDRA",
  SYN: "SYNCHRO",
  VIS: "VISSIM",
};

/** بادئة رمز الإصدار من رمز الكورس (C3D, CSD, VT, BIM, PD, CUBE, VISUM, VISSIM, SIDRA, SYNCHRO). */
export function editionPrefixOf(courseCode: string | null | undefined) {
  const code = String(courseCode ?? "").trim().toUpperCase();
  if (!code) return null;
  return EDITION_PREFIX_BY_COURSE[code] ?? code;
}

/**
 * رمز الإصدار التلقائي حسب نوع الاشتراك:
 * كورس بمرحلتين: أساسيات C3D-F / متقدم C3D-A / متكاملة C3D-F+A،
 * كورس بمرحلة واحدة أو رحلة يوم واحد: VT / BIM / PD / CUBE / VISUM / VISSIM / SIDRA / SYNCHRO.
 */
export function buildEditionCode(input: {
  courseCode: string | null | undefined;
  journeyKind: JourneyKind;
  isSplitCourse: boolean;
}) {
  const prefix = editionPrefixOf(input.courseCode);
  if (!prefix) return null;

  if (!input.isSplitCourse) return prefix;

  if (input.journeyKind === "fundamental") return `${prefix}-F`;
  if (input.journeyKind === "advanced") return `${prefix}-A`;
  if (input.journeyKind === "integrated") return `${prefix}-F+A`;
  // يوم واحد في كورس بمرحلتين: بدون مرحلة
  return prefix;
}

/** مرحلة الدفعة: من نوع الرحلة إن كان أساسيات/متقدم، وإلا من رمز الإصدار. */
export function stageOfPayment(r: {
  journey_kind: string | null;
  edition_code: string | null;
}): CourseStage {
  if (r.journey_kind === "fundamental" || r.journey_kind === "advanced") {
    return r.journey_kind;
  }
  return stageOfEdition(r.edition_code);
}

export type JourneyLabel = "أساسيات" | "متقدم" | "رحلة يوم واحد" | "كورس كامل";

export const JOURNEY_ORDER: JourneyLabel[] = [
  "أساسيات",
  "متقدم",
  "كورس كامل",
  "رحلة يوم واحد",
];

/** نوع الرحلة للدفعة: أساسيات / متقدم / يوم واحد / كورس كامل (للكورسات غير المنقسمة). */
export function journeyLabelOf(r: {
  journey_kind: string | null;
  edition_code: string | null;
}): JourneyLabel {
  if (r.journey_kind === "one_day") return "رحلة يوم واحد";
  const stage = stageOfPayment(r);
  if (stage === "fundamental") return "أساسيات";
  if (stage === "advanced") return "متقدم";
  return "كورس كامل";
}

export interface FinanceOffer {
  id: string;
  name: string;
  discount_percent: number;
  sort_order: number;
  is_active: boolean;
}

/**
 * سطر في «أسعار الكورسات الأساسية»: من «قوائم الشات والأسعار» مباشرة
 * (السعر قبل الخصم لكل كورس / نوع اشتراك / رحلة يوم واحد). null = لا يوجد سعر بهذه العملة.
 */
export interface FinancePriceItem {
  code: string;
  label: string;
  course_code: string | null;
  price_egp: number | null;
  price_sar: number | null;
  price_usd: number | null;
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

/**
 * رمز الإصدار الموحّد بدون رقم الدفعة:
 * CSD-F2 → CSD-F، C3D-A1 → C3D-A، C3D-F1+A1 → C3D-F+A، BIM1 → BIM، PD1 → PD، VT1 → VT.
 * (الأرقام داخل اسم الكورس مثل C3D تبقى كما هي.)
 */
export function normalizeEditionCode(edition: string | null | undefined) {
  const code = String(edition ?? "").trim().toUpperCase();
  if (!code) return null;
  return code.replace(/([A-Z])\d+(?=$|[-+])/g, "$1");
}

/** تحويل رمز نسخة الإكسل (C3D-F1, CSD-A1, BIM1, PD1, VT1) إلى رمز الكورس في المنصة. */
export function courseCodeFromEdition(edition: string | null | undefined) {
  const code = String(edition ?? "").trim().toUpperCase();
  if (!code) return null;
  const head = code.split(/[-.\s+]/)[0].replace(/\d+$/, "");
  const byPrefix = Object.entries(EDITION_PREFIX_BY_COURSE).find(
    ([, prefix]) => prefix === head,
  );
  return byPrefix ? byPrefix[0] : head || null;
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
