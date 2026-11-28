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

/** أقسام «مركز الرحلات» (صفحة /home): تُفتح بـ ?section= وتنزلق الصفحة للقسم. */
export const JOURNEY_CENTER_SECTIONS: TabOption[] = [
  { value: "paths", label: "المسارات المهنية" },
  { value: "learning", label: "كيف تحب أن تتعلم؟" },
  { value: "why", label: "لماذا صناع المسار؟" },
  { value: "popular", label: "الرحلات الأكثر طلبًا" },
  { value: "projects", label: "من التدريب إلى التنفيذ" },
  { value: "testimonials", label: "قصص نجاح المتدربين" },
  { value: "partners", label: "شركاؤنا في النجاح" },
  { value: "cta", label: "ابدأ رحلتك الآن" },
];

/** «طرق التعلم»: كل نوع رحلة تبويب (يفتح /journeys/<النوع>). */
export const LEARNING_MODE_TABS: TabOption[] = [
  { value: "professional", label: "رحلة الاحتراف المتكاملة" },
  { value: "one-day", label: "رحلات اليوم الواحد" },
  { value: "free", label: "الرحلات المجانية" },
];

export const LEARNING_MODES_PAGE = "/journeys";
export const JOURNEY_CENTER_PAGE = "/home";

export const STATIC_PAGES: PageOption[] = [
  { value: "/", label: "الصفحة الرئيسية", tabs: [{ value: "points", label: "شاشة السحب الشهري وطرق زيادة النقاط" }] },
  { value: JOURNEY_CENTER_PAGE, label: "مركز الرحلات", tabs: JOURNEY_CENTER_SECTIONS },
  { value: LEARNING_MODES_PAGE, label: "طرق التعلم", tabs: LEARNING_MODE_TABS },
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
    if (page === LEARNING_MODES_PAGE) return `/journeys/${link.tab || "professional"}`;
    if (!link.tab) return page;
    if (page === JOURNEY_CENTER_PAGE) return `${page}?section=${encodeURIComponent(link.tab)}`;
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
  if (v.kind === "page") {
    const page = String(v.page ?? "/");
    // روابط قديمة: «مركز الرحلات: الرحلات الاحترافية...» أصبحت تبويبات داخل «طرق التعلم».
    const legacy = page.match(/^\/journeys\/(professional|one-day|free)$/);
    if (legacy) return { kind: "page", page: LEARNING_MODES_PAGE, tab: legacy[1] };
    return { kind: "page", page, tab: String(v.tab ?? "") };
  }
  if (v.kind === "custom") return { kind: "custom", url: String(v.url ?? "") };
  return null;
}

export function isWhatsAppHref(href: string) {
  return /(?:wa\.me|whatsapp\.com)\//i.test(href);
}
