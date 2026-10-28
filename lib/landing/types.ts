/* =========================================================
   صفحات هبوط الإعلانات (/lp/<slug>)
   المحتوى كله JSON واحد يُعدَّل من لوحة التحكم:
   /admin/content/landing-pages
   صفحة Civil 3D هي النموذج الأساسي، وأي صفحة جديدة تبدأ كنسخة منه.
========================================================= */

export type LandingFact = { value: string; label: string };
export type LandingWho = { tag: string; title: string; text: string };
export type LandingStage = { sta: string; title: string; en: string; text: string; image: string };
export type LandingTopic = { ar: string; en: string };
export type LandingLevel = { title: string; badge: string; outcome: string; topics: LandingTopic[] };
export type LandingDeliverable = { title: string; en: string };
export type LandingGift = { icon: "file" | "video" | "cert"; title: string; text: string };
export type LandingPlan = { title: string; desc: string; bullets: string[]; featured: boolean; flag: string };
export type LandingStep = { title: string; text: string };
export type LandingFaq = { q: string; a: string };
export type LandingStation = { title: string; sub: string; icon: string; current: boolean };
export type LandingCountry = { name: string; code: string };

export type LandingContent = {
  seo: { title: string; description: string };
  hero: {
    badge: string;
    titleBefore: string;
    titleHighlight: string;
    titleAfter: string;
    lead: string;
    startLabel: string;
    startDate: string;
    startNote: string;
    ctaBook: string;
    ctaBookChip: string;
    ctaTopics: string;
    note: string;
    image: string;
    youtubeId: string;
    caption: string;
  };
  facts: LandingFact[];
  who: { eyebrow: string; title: string; items: LandingWho[] };
  journey: { eyebrow: string; title: string; lead: string; stages: LandingStage[] };
  levels: { eyebrow: string; title: string; lead: string; items: LandingLevel[] };
  help: {
    eyebrow: string;
    title: string;
    chatTitle: string;
    chatText: string;
    chatCta: string;
    chatUrl: string;
    chatBubble: string;
    chatOptions: string[];
    chatImage: string;
    videoTitle: string;
    videoText: string;
    videoCta: string;
    videoUrl: string;
    videoImage: string;
    videoLabel: string;
  };
  outputs: { eyebrow: string; title: string; lead: string; featured: LandingDeliverable; items: LandingDeliverable[] };
  gifts: { eyebrow: string; items: LandingGift[] };
  offer: {
    eyebrow: string;
    title: string;
    percentLabel: string;
    percent: string;
    heading: string;
    text: string;
    plans: LandingPlan[];
  };
  booking: {
    eyebrow: string;
    title: string;
    steps: LandingStep[];
    planOptions: string[];
    countries: LandingCountry[];
    messageIntro: string;
    button: string;
    note: string;
  };
  faq: { eyebrow: string; title: string; items: LandingFaq[] };
  path: {
    eyebrow: string;
    title: string;
    image: string;
    stations: LandingStation[];
    cta: string;
    url: string;
  };
};

export type LandingPageRow = {
  id: string;
  slug: string;
  title: string;
  status: "draft" | "published";
  course_id: string | null;
  whatsapp_number: string;
  meta_pixel_id: string | null;
  content: LandingContent;
  created_at: string;
  updated_at: string;
};

const IMG = "/images/landing/civil3d";

/* نموذج Civil 3D (أول صفحة هبوط، اعتمدتها منى في 28 أكتوبر 2026). */
export const CIVIL3D_TEMPLATE: LandingContent = {
  seo: {
    title: "رحلة Civil 3D | صنّاع المسار",
    description:
      "رحلة عملية على مشروع شبكة طرق متكاملة: من النقاط المساحية حتى القطاعات والكميات ولوحات حزمة الطرق. خصم الحجز المبكر يصل إلى 40%.",
  },
  hero: {
    badge: "رحلة Civil 3D · التسجيل مفتوح الآن",
    titleBefore: "من نقاط مساحية على الشاشة… إلى",
    titleHighlight: "طريق كامل",
    titleAfter: "بقطاعاته وكمياته",
    lead: "رحلة عملية على مشروع طرق متكامل، تتعلم فيها Civil 3D خطوة بخطوة بمستويين: أساسي ومتقدم. كل محاضرة تطبيق على المشروع المتكامل، لحد ما تطلّع مخرجات جاهزة للتسليم.",
    startLabel: "تبدأ الرحلة المتقدمة",
    startDate: "الجمعة 6 نوفمبر · 8 مساءً",
    startNote: "بتوقيت السعودية",
    ctaBook: "احجز بخصم الحجز المبكر",
    ctaBookChip: "40%",
    ctaTopics: "شوف محاور الرحلة",
    note: "الأماكن محدودة · خصم الحجز المبكر يصل إلى 40%",
    image: `${IMG}/hero.webp`,
    youtubeId: "gJHqj3iwi7I",
    caption: "AUTODESK CIVIL 3D · REAL ROAD PROJECT",
  },
  facts: [
    { value: "مستويان", label: "أساسي ومتقدم، أو الرحلة المتكاملة" },
    { value: "مشروع متكامل", label: "من النقاط المساحية للمخرجات النهائية" },
    { value: "شهادة", label: "إتمام من صنّاع المسار + محاضرات مسجلة" },
  ],
  who: {
    eyebrow: "الرحلة مناسبة لك لو",
    title: "مهندس عايز يشتغل على Civil 3D بثقة في مشروع حقيقي",
    items: [
      {
        tag: "FRESH GRADUATE",
        title: "متخرج جديد أو طالب هندسة مدنية",
        text: "تبدأ من الصفر بمراجعة AutoCAD، وتطلع بخبرة مشروع كامل تقدر تعرضه في أي مقابلة شغل.",
      },
      {
        tag: "LEVEL UP",
        title: "مهندس محتاج يطوّر مهارات التصميم باحتراف",
        text: "تنقل مستواك في التصميم خطوة لقدّام: تصميم ديناميكي يتحدث مع كل تعديل، وتطلّع مخرجات احترافية من قطاعات وكميات ومناسيب، ولوحات كاملة لحزمة الطرق جاهزة للتسليم.",
      },
    ],
  },
  journey: {
    eyebrow: "STA 0+000 → 1+400 · Project Workflow",
    title: "رحلة المشروع، محطة بمحطة",
    lead: "مشروع متكامل من أول محاضرة لآخر محاضرة. كل محطة بتبني على اللي قبلها، زي ما بيحصل في الشغل الحقيقي.",
    stages: [
      { sta: "STA 0+000", title: "بيانات المشروع والنقاط", en: "Points", text: "إعداد المشروع واستيراد النقاط المساحية وتنظيمها بالمجموعات والأنماط.", image: `${IMG}/points.webp` },
      { sta: "STA 0+200", title: "سطح الأرض والكنتور", en: "Surfaces", text: "بناء سطح الأرض الطبيعية من النقاط وقراءة الكنتور والميول.", image: `${IMG}/surface.webp` },
      { sta: "STA 0+400", title: "المسار الأفقي", en: "Alignments", text: "تصميم محور الطريق بالمنحنيات وربطه بالمرجع الخارجي للمشروع.", image: `${IMG}/align.webp` },
      { sta: "STA 0+600", title: "القطاع الطولي", en: "Profiles", text: "رسم الأرض الطبيعية وتصميم المنسوب النهائي وتجهيز أنماط العرض.", image: `${IMG}/profile.webp` },
      { sta: "STA 0+800", title: "النموذج العرضي ونموذج الطريق", en: "Assemblies & Corridors", text: "بناء القطاع النموذجي وتوليد نموذج الطريق، مع تحليل التصميم والتصريف والميول العرضية.", image: `${IMG}/corridor.webp` },
      { sta: "STA 1+000", title: "القطاعات العرضية", en: "Cross Sections", text: "قطاعات عرضية على طول الطريق بأنماط عرض وجداول جاهزة للتسليم.", image: `${IMG}/sections.webp` },
      { sta: "STA 1+200", title: "الكميات", en: "Cut/Fill & Materials", text: "حساب كميات الحفر والردم والمواد (Material) وجداولها من نموذج الطريق.", image: `${IMG}/quantities.webp` },
      { sta: "STA 1+400", title: "مخرجات احترافية", en: "Plan Production", text: "حزمة لوحات مشروع الطرق المتكامل: مساقط أفقية وقطاعات طولية وعرضية ومناسيب وجداول توقيع.", image: `${IMG}/output.webp` },
    ],
  },
  levels: {
    eyebrow: "محاور الرحلة",
    title: "مستويان… تبدأ من اللي يناسبك",
    lead: "المستوى الأساسي يبني لك مشروع طريق كامل. المستوى المتقدم يكمّل بالتقاطعات والدوارات وإخراج اللوحات. والرحلة المتكاملة تجمع الاتنين مع الهدايا.",
    items: [
      {
        title: "المستوى الأساسي",
        badge: "FUNDAMENTALS",
        outcome: "مشروع طريق كامل من النقاط المساحية حتى القطاعات العرضية والكميات والمخرجات النهائية.",
        topics: [
          { ar: "التعرف على البرنامج ومميزاته", en: "Introduction" },
          { ar: "ضبط إعدادات المشروع", en: "Settings" },
          { ar: "بيانات المشروع والنقاط", en: "Points" },
          { ar: "الأسطح", en: "Surfaces" },
          { ar: "المسارات الأفقية", en: "Alignments" },
          { ar: "القطاعات الطولية", en: "Profiles" },
          { ar: "النموذج العرضي", en: "Assemblies" },
          { ar: "نموذج الطريق", en: "Corridors" },
          { ar: "تغيير الميول العرضية", en: "Superelevation" },
          { ar: "القطاعات العرضية", en: "Cross Sections" },
          { ar: "المخرجات النهائية", en: "Final Output" },
        ],
      },
      {
        title: "المستوى المتقدم",
        badge: "ADVANCED",
        outcome: "تصميم التقاطعات والدوارات ونهايات الطرق، وإخراج لوحات المشروع والتقارير والكميات باحتراف.",
        topics: [
          { ar: "استكشاف المشروع", en: "Project Explorer" },
          { ar: "تغيير الميول العرضية المتقدم", en: "Advanced Superelevation" },
          { ar: "التقاطعات", en: "Intersections" },
          { ar: "نهايات الطرق", en: "Cul-de-sac" },
          { ar: "الدوارات", en: "Roundabout" },
          { ar: "القطاعات العرضية المتقدمة", en: "Conditional Assemblies" },
          { ar: "طرق تسوية الأسطح", en: "Grading & Feature Lines" },
          { ar: "نقل البيانات", en: "Data Shortcuts" },
          { ar: "المخرجات الاحترافية", en: "Plan Production" },
          { ar: "التقارير والكميات", en: "Reports & Quantities" },
        ],
      },
    ],
  },
  help: {
    eyebrow: "مش متأكد تبدأ منين؟",
    title: "اسأل مساعد المنصة، أو جرّب المحاضرة الأولى مجانًا",
    chatTitle: "اسأل مساعد المنصة",
    chatText: "شات على منصة صنّاع المسار بيرد عليك فورًا عن تفاصيل الرحلة والمستوى المناسب ليك.",
    chatCta: "افتح الشات على المنصة ←",
    chatUrl: "/?ask=civil3d",
    chatBubble: "أهلًا بيك 👋 شكرًا لاهتمامك برحلة Civil 3D. اختار سؤالك وهرد عليك فورًا.",
    chatOptions: ["تفاصيل الكورس", "محاور الرحلة", "أريد الاشتراك"],
    chatImage: `${IMG}/surface.webp`,
    videoTitle: "شوف المحاضرة الأولى مجانًا",
    videoText: "شوف أسلوب الشرح والتطبيق بنفسك قبل ما تحجز.",
    videoCta: "شاهد على يوتيوب ←",
    videoUrl: "https://www.youtube.com/watch?v=aqx8yTPe7fs",
    videoImage: `${IMG}/hero.webp`,
    videoLabel: "المحاضرة الأولى · YouTube",
  },
  outputs: {
    eyebrow: "FINAL DELIVERABLES",
    title: "مخرجات حقيقية تسلّمها",
    lead: "نفس المخرجات اللي بتتطلب منك في أي مشروع طرق.",
    featured: { title: "لوحات حزمة الطرق", en: "Plan Production" },
    items: [
      { title: "الأسطح التصميمية", en: "Design Surfaces" },
      { title: "جداول الكميات (حفر وردم وماتريال)", en: "Cut/Fill & Material Quantities" },
      { title: "القطاعات الأفقية والطولية", en: "Plan & Profile" },
      { title: "القطاعات العرضية", en: "Cross Sections" },
      { title: "مناسيب الطرق", en: "Road Levels" },
      { title: "التوقيع والإحداثيات", en: "Setting-out & Coordinates" },
    ],
  },
  gifts: {
    eyebrow: "هدايا الرحلة المتكاملة",
    items: [
      { icon: "file", title: "ملف Template جاهز", text: "تشتغل بيه في مشاريعك مباشرة." },
      { icon: "video", title: "المحاضرات المسجلة كاملة", text: "ترجع لأي محاضرة في أي وقت على المنصة." },
      { icon: "cert", title: "شهادة إتمام", text: "تصدر من صنّاع المسار لما تكمل الرحلة 100%." },
    ],
  },
  offer: {
    eyebrow: "الحجز المبكر",
    title: "الحق خصم الحجز المبكر الآن",
    percentLabel: "خصم يصل إلى",
    percent: "40%",
    heading: "على كل مستويات رحلة Civil 3D",
    text: "الخصم للحجز قبل بداية الرحلة المتقدمة يوم الجمعة 6 نوفمبر. سجّل بياناتك تحت ونرد عليك على واتساب بالسعر بعد الخصم بعملة بلدك.",
    plans: [
      {
        title: "الرحلة المتكاملة",
        desc: "المستويان الأساسي والمتقدم مع هدايا الرحلة.",
        bullets: ["المستويان الأساسي والمتقدم كاملين", "ملف Template جاهز تشتغل بيه في مشاريعك", "المحاضرات المسجلة كاملة", "شهادة إتمام الرحلة"],
        featured: true,
        flag: "الأشمل",
      },
      {
        title: "المستوى الأساسي",
        desc: "مشروع طريق كامل من النقاط المساحية للمخرجات النهائية.",
        bullets: ["15 محاضرة لمشروع شبكة طرق متكاملة", "تطبيق عملي خطوة بخطوة", "مراجعة AutoCAD في البداية"],
        featured: false,
        flag: "",
      },
      {
        title: "المستوى المتقدم",
        desc: "احتراف تصميم عناصر الطرق المختلفة والحالات الخاصة (تقاطعات ودوارات ونهايات طرق).",
        bullets: ["التقاطعات والدوارات ونهايات الطرق", "التسوية و Feature Lines", "لوحات حزمة الطرق والتقارير والكميات"],
        featured: false,
        flag: "",
      },
    ],
  },
  booking: {
    eyebrow: "احجز مكانك",
    title: "احجز مكانك قبل ما الرحلة تبدأ",
    steps: [
      { title: "تكتب بياناتك", text: "وتبعتها لنا على واتساب برسالة جاهزة. من غير دفع دلوقتي." },
      { title: "نرد عليك", text: "بتفاصيل المستوى والسعر بعد الخصم وطريقة الدفع." },
      { title: "تتفعّل رحلتك على المنصة", text: "وتبدأ الرحلة المتقدمة يوم الجمعة 6 نوفمبر." },
    ],
    planOptions: ["الرحلة المتكاملة (الأساسي + المتقدم)", "المستوى الأساسي", "المستوى المتقدم", "مش متأكد، محتاج استشارة"],
    countries: [
      { name: "السعودية", code: "+966" },
      { name: "مصر", code: "+20" },
      { name: "الإمارات", code: "+971" },
      { name: "الكويت", code: "+965" },
      { name: "قطر", code: "+974" },
      { name: "عُمان", code: "+968" },
      { name: "البحرين", code: "+973" },
      { name: "دولة أخرى", code: "" },
    ],
    messageIntro: "السلام عليكم، عايز أحجز مكاني في رحلة Civil 3D بخصم الحجز المبكر.",
    button: "إرسال بياناتي على واتساب",
    note: "هيفتح واتساب برسالة فيها بياناتك على رقمنا. اضغط إرسال بس.",
  },
  faq: {
    eyebrow: "أسئلة متكررة",
    title: "قبل ما تحجز",
    items: [
      { q: "إمتى الرحلة بتبدأ؟", a: "الرحلة المتقدمة تبدأ يوم الجمعة 6 نوفمبر الساعة 8 مساءً بتوقيت السعودية. اللي يحجز قبلها يستفيد بخصم الحجز المبكر اللي يصل إلى 40%." },
      { q: "محتاج خبرة سابقة على البرنامج؟", a: "لا. المستوى الأساسي بيبدأ من التعرف على البرنامج ومراجعة AutoCAD، وبعدها تطبيق على المشروع خطوة بخطوة." },
      { q: "أختار الأساسي ولا المتقدم ولا المتكاملة؟", a: "لو أول مرة تشتغل على Civil 3D ابدأ بالأساسي أو المتكاملة. لو بتشتغل عليه فعلًا وعايز التقاطعات والدوارات وإخراج اللوحات، المتقدم مناسب لك. ولو محتار اختار «مش متأكد» في نموذج الحجز ونساعدك تختار." },
      { q: "المحاضرات مسجلة؟", a: "أيوه. المحاضرات المسجلة كاملة متاحة لك على المنصة ضمن هدايا الرحلة المتكاملة." },
      { q: "هاخد شهادة؟", a: "أيوه، شهادة إتمام من صنّاع المسار لما تكمل الرحلة 100%، وتظهر في قسم «شهاداتي» على المنصة." },
      { q: "إزاي أدفع؟", a: "بعد الحجز بنتواصل معاك على واتساب ونبعتلك طرق الدفع المتاحة في دولتك." },
    ],
  },
  path: {
    eyebrow: "مسار تصميم الطرق في صنّاع المسار",
    title: "Civil 3D هي أول محطة في مسار احتراف تصميم الطرق",
    image: "/images/paths/road-design.jpg",
    stations: [
      { title: "Civil 3D", sub: "تصميم الطرق باحتراف", icon: "/images/courses/icons/civil3d.png", current: true },
      { title: "Civil Site Design", sub: "تصميم شبكات الطرق بسرعة", icon: "/images/courses/icons/csd.png", current: false },
      { title: "Smart Project Deliverables", sub: "لوحات مشروعات الطرق", icon: "/images/courses/icons/spd.png", current: false },
      { title: "Vehicle Tracking", sub: "حركة المركبات والدوران", icon: "/images/courses/icons/vehicle-tracking.png", current: false },
      { title: "BIM Roads", sub: "نموذج ثلاثي الأبعاد", icon: "/images/courses/icons/bim-roads.png", current: false },
    ],
    cta: "استكشف منصتنا التعليمية ومحطاتنا الاحترافية",
    url: "/",
  },
};

/** يملأ أي حقول ناقصة في محتوى قديم من النموذج حتى لا تنكسر الصفحة. */
export function withDefaults(content: unknown): LandingContent {
  return deepMerge(CIVIL3D_TEMPLATE, content) as LandingContent;
}

function deepMerge(base: unknown, value: unknown): unknown {
  if (value === undefined || value === null) return base;
  if (Array.isArray(base)) return Array.isArray(value) ? value : base;
  if (base && typeof base === "object") {
    if (!value || typeof value !== "object" || Array.isArray(value)) return base;
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(base as Record<string, unknown>)) {
      out[key] = deepMerge((base as Record<string, unknown>)[key], (value as Record<string, unknown>)[key]);
    }
    return out;
  }
  return typeof value === typeof base ? value : base;
}

/* أسماء الحقول بالعربي في محرر لوحة التحكم. */
export const FIELD_LABELS: Record<string, string> = {
  seo: "عنوان الصفحة في جوجل والمشاركة",
  hero: "البداية (أعلى الصفحة)",
  facts: "المربعات تحت الفيديو",
  who: "الرحلة مناسبة لمين",
  journey: "محطات المشروع (بالصور)",
  levels: "محاور المستويات",
  help: "مش متأكد تبدأ منين؟",
  outputs: "المخرجات",
  gifts: "الهدايا",
  offer: "الخصم والمستويات",
  booking: "نموذج الحجز",
  faq: "الأسئلة المتكررة",
  path: "مسار المنصة (آخر الصفحة)",
  title: "العنوان",
  description: "الوصف",
  badge: "الشارة",
  titleBefore: "العنوان (قبل الجزء الملوّن)",
  titleHighlight: "الجزء الملوّن من العنوان",
  titleAfter: "العنوان (بعد الجزء الملوّن)",
  lead: "النص التعريفي",
  startLabel: "عنوان الموعد",
  startDate: "الموعد",
  startNote: "ملاحظة الموعد",
  ctaBook: "زر الحجز",
  ctaBookChip: "نسبة الخصم على زر الحجز",
  ctaTopics: "زر المحاور",
  note: "ملاحظة",
  image: "الصورة",
  youtubeId: "كود فيديو يوتيوب (يظهر عند الضغط على الصورة)",
  caption: "نص أسفل الفيديو",
  value: "القيمة",
  label: "الوصف",
  eyebrow: "العنوان الصغير",
  items: "العناصر",
  tag: "الوسم",
  text: "النص",
  stages: "المحطات",
  sta: "رقم المحطة",
  en: "الاسم بالإنجليزي",
  outcome: "هتطلع بإيه؟",
  topics: "المحاور",
  ar: "المحور بالعربي",
  chatTitle: "عنوان مربع الشات",
  chatText: "نص مربع الشات",
  chatCta: "رابط مربع الشات (النص)",
  chatUrl: "رابط الشات",
  chatBubble: "رسالة الشات في الصورة",
  chatOptions: "أزرار الشات في الصورة",
  chatImage: "خلفية مربع الشات",
  videoTitle: "عنوان مربع الفيديو",
  videoText: "نص مربع الفيديو",
  videoCta: "رابط مربع الفيديو (النص)",
  videoUrl: "رابط الفيديو",
  videoImage: "صورة الفيديو",
  videoLabel: "اسم الفيديو على الصورة",
  featured: "العنصر المميز",
  icon: "الأيقونة",
  percentLabel: "نص قبل النسبة",
  percent: "النسبة",
  heading: "العنوان",
  plans: "المستويات",
  desc: "الوصف",
  bullets: "النقاط",
  flag: "شارة المميز",
  steps: "الخطوات",
  planOptions: "اختيارات نوع الرحلة",
  countries: "الدول",
  name: "الاسم",
  code: "كود الاتصال",
  messageIntro: "أول سطر في رسالة واتساب",
  button: "زر الإرسال",
  q: "السؤال",
  a: "الإجابة",
  stations: "المحطات",
  sub: "الوصف",
  current: "المحطة الحالية؟",
  cta: "نص الزر",
  url: "رابط الزر",
};

export function isImageField(key: string) {
  return /(^image$|Image$|^icon$)/.test(key);
}
