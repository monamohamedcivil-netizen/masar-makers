/*
 * وجهة زر الإعلان / زر العرض: بدل كتابة الرابط يدويًا، تُختار من قائمة:
 *  - رسالة واتساب (الرقم + نص الرسالة)
 *  - صفحة في المنصة (الصفحة ثم التبويب داخلها)
 *  - رابط مخصص (للحالات الخاصة)
 * ملف عادي يعمل في المتصفح والسيرفر.
 */

export const DEFAULT_WHATSAPP_NUMBER = "201031885659";

export type LinkConfig =
  | { kind: "whatsapp"; number: string; text: string }
  | { kind: "page"; page: string; tab: string }
  | { kind: "custom"; url: string };

export type TabOption = { value: string; label: string };
export type PageOption = { value: string; label: string; tabs: TabOption[] };

/** تبويبات صفحة الكورس (تُفتح بـ ?tab=). */
export const COURSE_TABS: TabOption[] = [
  { value: "professional", label: "الرحلة الاحترافية" },
  { value: "workshop", label: "رحلات اليوم الواحد" },
  { value: "free", label: "الرحلات المجانية" },
  { value: "outcome", label: "المشاريع والنتائج" },
  { value: "reviews", label: "آراء المتدربين" },
  { value: "gifts", label: "الهدايا" },
];

export const COURSE_TAB_IDS = COURSE_TABS.map((tab) => tab.value);

export const STATIC_PAGES: PageOption[] = [
  { value: "/", label: "الصفحة الرئيسية", tabs: [{ value: "points", label: "شاشة السحب الشهري وطرق زيادة النقاط" }] },
  { value: "/journeys/professional", label: "مركز الرحلات: الرحلات الاحترافية", tabs: [] },
  { value: "/journeys/one-day", label: "مركز الرحلات: رحلات اليوم الواحد", tabs: [] },
  { value: "/journeys/free", label: "مركز الرحلات: الرحلات المجانية", tabs: [] },
];

export type DestinationSources = {
  courses: Array<{ slug: string; title: string }>;
  careerPaths: Array<{ slug: string; title: string }>;
};

export function buildPageOptions(sources: DestinationSources): PageOption[] {
  return [
    ...STATIC_PAGES,
    ...sources.careerPaths.map((p) => ({ value: `/career-path/${p.slug}`, label: `مسار: ${p.title}`, tabs: [] })),
    ...sources.courses.map((c) => ({ value: `/course/${c.slug}`, label: `كورس: ${c.title}`, tabs: COURSE_TABS })),
  ];
}

const digits = (v: string) => v.replace(/\D/g, "");

/** الرابط النهائي المحفوظ في الإعلان. */
export function buildHref(link: LinkConfig | null | undefined): string {
  if (!link) return "#";
  if (link.kind === "whatsapp") {
    const number = digits(link.number) || DEFAULT_WHATSAPP_NUMBER;
    const text = link.text.trim();
    return `https://wa.me/${number}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
  }
  if (link.kind === "page") {
    const page = link.page.trim() || "/";
    if (!link.tab) return page;
    if (page === "/" && link.tab === "points") return "/?points=1";
    return `${page}?tab=${encodeURIComponent(link.tab)}`;
  }
  return link.url.trim() || "#";
}

/** قراءة آمنة لإعداد الوجهة المخزَّن (jsonb) من قاعدة البيانات. */
export function parseLinkConfig(value: unknown): LinkConfig | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  if (v.kind === "whatsapp") return { kind: "whatsapp", number: String(v.number ?? DEFAULT_WHATSAPP_NUMBER), text: String(v.text ?? "") };
  if (v.kind === "page") return { kind: "page", page: String(v.page ?? "/"), tab: String(v.tab ?? "") };
  if (v.kind === "custom") return { kind: "custom", url: String(v.url ?? "") };
  return null;
}

export function isWhatsAppHref(href: string) {
  return /(?:wa\.me|whatsapp\.com)\//i.test(href);
}
