/*
 * عرض بيانات الطالب (الاسم والمهنة والبلد) حسب لغة الموقع.
 *
 * - الاسم: بالإنجليزية نستخدم الاسم الإنجليزي المخصص للشهادة، ولو كان طويلًا
 *   نأخذ أول 3 أسماء فقط. لو لم يوجد اسم إنجليزي نعرض الاسم المحفوظ كما هو
 *   (لا نترجم الأسماء آليًا حتى لا نخطئ فيها).
 * - البلد: ترجمة من قاموس الدول (عربي ⇄ إنجليزي).
 * - المهنة: ترجمة من قاموس للمسميات الشائعة، وما لا يُعرف يبقى كما كُتب.
 *
 * ملف عادي بلا اعتماد على المتصفح، يعمل في السيرفر والواجهة.
 */

export type DisplayLocale = "ar" | "en";

const ARABIC_RE = /[؀-ۿ]/;

function normalizeArabic(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[ً-ْـ]/g, "")
    .replace(/[إأآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ");
}

/* ---------------- الاسم ---------------- */

export function localizeStudentName(
  locale: DisplayLocale,
  name?: string | null,
  nameEn?: string | null,
): string {
  const arabicName = name?.trim() ?? "";

  if (locale !== "en") {
    return arabicName;
  }

  const english = nameEn?.trim() ?? "";

  if (english) {
    return english.split(/\s+/).slice(0, 3).join(" ");
  }

  // لا اسم إنجليزي مخصص: لو الاسم المحفوظ لاتيني نختصره، وإلا نتركه كما هو.
  if (arabicName && !ARABIC_RE.test(arabicName)) {
    return arabicName.split(/\s+/).slice(0, 3).join(" ");
  }

  return arabicName;
}

/* ---------------- البلد ---------------- */

const COUNTRIES: Array<{ ar: string[]; en: string }> = [
  { ar: ["مصر"], en: "Egypt" },
  {
    ar: ["السعودية", "المملكة العربية السعودية", "السعوديه"],
    en: "Saudi Arabia",
  },
  { ar: ["العراق"], en: "Iraq" },
  {
    ar: ["الامارات", "الإمارات", "الامارات العربية المتحدة", "الإمارات العربية المتحدة"],
    en: "United Arab Emirates",
  },
  { ar: ["ليبيا"], en: "Libya" },
  { ar: ["عمان", "سلطنة عمان"], en: "Oman" },
  { ar: ["السودان"], en: "Sudan" },
  { ar: ["نيجيريا"], en: "Nigeria" },
  { ar: ["الكويت"], en: "Kuwait" },
  { ar: ["قطر"], en: "Qatar" },
  { ar: ["البحرين"], en: "Bahrain" },
  { ar: ["الاردن", "الأردن"], en: "Jordan" },
  { ar: ["فلسطين"], en: "Palestine" },
  { ar: ["لبنان"], en: "Lebanon" },
  { ar: ["سوريا", "سورية"], en: "Syria" },
  { ar: ["اليمن"], en: "Yemen" },
  { ar: ["الجزائر"], en: "Algeria" },
  { ar: ["المغرب"], en: "Morocco" },
  { ar: ["تونس"], en: "Tunisia" },
  { ar: ["موريتانيا"], en: "Mauritania" },
  { ar: ["الصومال"], en: "Somalia" },
  { ar: ["تركيا"], en: "Turkey" },
  { ar: ["السنغال"], en: "Senegal" },
  { ar: ["جيبوتي"], en: "Djibouti" },
];

const COUNTRY_AR_TO_EN = new Map<string, string>();
const COUNTRY_EN_TO_AR = new Map<string, string>();

for (const entry of COUNTRIES) {
  for (const arabic of entry.ar) {
    COUNTRY_AR_TO_EN.set(normalizeArabic(arabic), entry.en);
  }

  COUNTRY_EN_TO_AR.set(entry.en.toLowerCase(), entry.ar[0]);
}

export function localizeCountry(
  locale: DisplayLocale,
  value?: string | null,
): string {
  const text = value?.trim() ?? "";

  if (!text) {
    return "";
  }

  if (locale === "en") {
    return ARABIC_RE.test(text)
      ? COUNTRY_AR_TO_EN.get(normalizeArabic(text)) ?? text
      : text;
  }

  return COUNTRY_EN_TO_AR.get(text.toLowerCase()) ?? text;
}

/* ---------------- المهنة ---------------- */

// عبارات كاملة شائعة (عربي ⇄ إنجليزي).
const JOB_PHRASES: Array<{ ar: string[]; en: string }> = [
  { ar: ["مهندس", "مهندسه", "مهندسة"], en: "Engineer" },
  { ar: ["مهندس مدني", "مهندسة مدنية"], en: "Civil Engineer" },
  { ar: ["استشاري", "مستشار"], en: "Consultant" },
  { ar: ["مدرب", "مدرّب"], en: "Trainer" },
  { ar: ["طالب", "طالبة"], en: "Student" },
  { ar: ["مدير مشروع", "مدير مشاريع"], en: "Project Manager" },
  { ar: ["مهندس معماري", "مهندسة معمارية"], en: "Architect" },
  { ar: ["مهندس موقع", "مهندسة موقع"], en: "Site Engineer" },
  { ar: ["مهندس مساحه", "مهندس مساحة"], en: "Survey Engineer" },
  { ar: ["مساح"], en: "Surveyor" },
  { ar: ["رسام", "رسام هندسي"], en: "Draftsman" },
  { ar: ["مصمم"], en: "Designer" },
  { ar: ["مهندس تصميم طرق"], en: "Road Design Engineer" },
];

// كلمات تُركَّب منها مسميات "مهندس X".
const JOB_WORDS: Record<string, string> = {
  مدني: "Civil",
  تصميم: "Design",
  طرق: "Road",
  طريق: "Road",
  مشاريع: "Projects",
  مشروع: "Project",
  مواقع: "Site",
  موقع: "Site",
  مساحه: "Survey",
  كميات: "Quantity",
  تنفيذ: "Construction",
  انشائي: "Structural",
  هيكلي: "Structural",
  مرور: "Traffic",
  جسور: "Bridges",
  مياه: "Water",
  صرف: "Drainage",
  بنيه: "Infrastructure",
  تحتيه: "Utilities",
  جيوتقني: "Geotechnical",
  عقود: "Contracts",
  تخطيط: "Planning",
};

const JOB_AR_TO_EN = new Map<string, string>();
const JOB_EN_TO_AR = new Map<string, string>();

for (const entry of JOB_PHRASES) {
  for (const arabic of entry.ar) {
    JOB_AR_TO_EN.set(normalizeArabic(arabic), entry.en);
  }

  JOB_EN_TO_AR.set(entry.en.toLowerCase(), entry.ar[0]);
}

function translateComposedArabicJob(text: string): string | null {
  const words = normalizeArabic(text).split(" ");

  if (words[0] !== "مهندس" && words[0] !== "مهندسه") {
    return null;
  }

  const rest = words.slice(1);

  if (rest.length === 0 || rest.length > 4) {
    return null;
  }

  const translated: string[] = [];

  for (const word of rest) {
    const english = JOB_WORDS[word];

    if (!english) {
      return null;
    }

    translated.push(english);
  }

  // الإضافة العربية تُعكس: "تصميم طرق" => "Road Design".
  return `${translated.reverse().join(" ")} Engineer`;
}

export function localizeJobTitle(
  locale: DisplayLocale,
  value?: string | null,
): string {
  const text = value?.trim() ?? "";

  if (!text) {
    return "";
  }

  if (locale === "en") {
    if (!ARABIC_RE.test(text)) {
      return text;
    }

    return (
      JOB_AR_TO_EN.get(normalizeArabic(text)) ??
      translateComposedArabicJob(text) ??
      text
    );
  }

  // خيار "Other" القادم من التسجيل لا يصلح كمهنة معروضة.
  if (text.toLowerCase() === "other") {
    return "";
  }

  return JOB_EN_TO_AR.get(text.toLowerCase()) ?? text;
}
