import type {
  Course,
  CourseType,
  PathSlug,
} from "@/data/types";

export type {
  Course,
  CourseType,
  PathSlug,
} from "@/data/types";

export const courses: Course[] = [

    
  /*
  ==================================================
  Road Design Path
  ==================================================
  */

  {
    id: 1,
    slug: "civil-3d",

    title: "Civil 3D",
    shortTitle: "Civil 3D",

    description:
      "تعلم منهجية تصميم الطرق باستخدام Civil 3D بداية من إعداد البيانات وحتى إنتاج مشروع طرق متكامل.",

    image: "/images/courses/course-civil3d.jpg",
    icon: "/images/courses/icons/civil3d.png",

    pathSlug: "road",
    type: "professional",

    duration: "30 ساعة",
    projects: "5 مشاريع",
    level: "من المبتدئ إلى المتقدم",

    instructorIds: ["mona-abdallah"],

    subtitle:
  "ابدأ رحلة احتراف تصميم الطرق باستخدام Civil 3D",

longDescription:
  "رحلة تدريبية عملية تساعدك على بناء مشروع طرق متكامل باستخدام Civil 3D، بداية من إعداد البيانات والأسطح وحتى تصميم المحاور والقطاعات والكوريدور واستخراج المخرجات النهائية.",

learningOutcomes: [
  "إنشاء وإدارة الأسطح",
  "تصميم المحاور الأفقية",
  "إنشاء القطاعات الطولية",
  "إنشاء Assemblies وCorridors",
  "إعداد القطاعات العرضية",
  "استخراج الكميات واللوحات",
],

gifts: [
  "ملفات المشاريع التطبيقية",
  "قوالب Civil 3D جاهزة",
  "مجموعة Lisp تساعد على تسريع العمل",
  "ملخصات وملاحظات الكورس",
],

finalOutcome:
  "إنشاء مشروع طريق متكامل باستخدام Civil 3D بداية من البيانات المساحية وحتى اللوحات النهائية.",

freeSessionSlugs: [
  "civil-3d-first-session",
],

workshopSlugs: [],

curriculum: [
  {
    id: "civil3d-01",
    title: "إعداد المشروع والبيانات",
    description:
      "التعرف على بيئة البرنامج وإعداد ملف المشروع.",
    duration: "3 ساعات",
    order: 1,
  },
  {
    id: "civil3d-02",
    title: "الأسطح والنقاط المساحية",
    description:
      "إنشاء الأسطح وتعديلها وتحليلها.",
    duration: "5 ساعات",
    order: 2,
  },
  {
    id: "civil3d-03",
    title: "المحاور والقطاعات الطولية",
    description:
      "تصميم المحاور الأفقية والرأسية.",
    duration: "6 ساعات",
    order: 3,
  },
  {
    id: "civil3d-04",
    title: "Assemblies وCorridors",
    description:
      "بناء نموذج الطريق وتطبيق القطاعات النموذجية.",
    duration: "8 ساعات",
    order: 4,
  },
  {
    id: "civil3d-05",
    title: "القطاعات واللوحات",
    description:
      "إعداد القطاعات العرضية والمخرجات النهائية.",
    duration: "8 ساعات",
    order: 5,
  },
],

    featured: true,
    active: true,
    order: 1,
  },

  {
    id: 2,
    slug: "civil-site-design",

    title: "Civil Site Design",
    shortTitle: "CSD",

    description:
      "رحلة متكاملة لتصميم الطرق والتقاطعات وإدارة المشروع باستخدام Civil Site Design.",

    image: "/images/courses/course-csd.jpg",
    icon: "/images/courses/icons/csd.png",

    pathSlug: "road",
    type: "professional",

    duration: "36 ساعة",
    projects: "6 مشاريع",
    level: "من الأساس إلى الاحتراف",

    instructorIds: ["mona-abdallah"],

    featured: true,
    active: true,
    order: 2,

    variants: [
  {
    id: "csd-integrated",
    slug: "csd-integrated",

    title: "رحلة Civil Site Design المتكاملة",
    shortTitle: "الرحلة المتكاملة",

    type: "integrated",

    description:
      "رحلة تجمع بين أساسيات البرنامج والمستوى المتقدم للوصول إلى مستوى احترافي متكامل.",

    duration: "60 ساعة",
    projects: "10 مشاريع",
    level: "من الأساسيات إلى الاحتراف",

    curriculum: [
      {
        id: "csd-integrated-01",
        title: "أساسيات بيئة البرنامج",
        description:
          "التعرف على بيئة Civil Site Design وإعداد المشروع.",
        duration: "4 ساعات",
        order: 1,
      },
      {
        id: "csd-integrated-02",
        title: "تصميم المحاور والقطاعات",
        description:
          "إنشاء المحاور والقطاعات الطولية والعرضية.",
        duration: "12 ساعة",
        order: 2,
      },
      {
        id: "csd-integrated-03",
        title: "تصميم التقاطعات",
        description:
          "إنشاء التقاطعات وإدارة العلاقات بين الطرق.",
        duration: "14 ساعة",
        order: 3,
      },
      {
        id: "csd-integrated-04",
        title: "الأدوات المتقدمة",
        description:
          "تطبيق الأدوات المتقدمة وتحسين جودة التصميم.",
        duration: "14 ساعة",
        order: 4,
      },
      {
        id: "csd-integrated-05",
        title: "المشروع النهائي",
        description:
          "تنفيذ مشروع متكامل من البداية حتى المخرجات النهائية.",
        duration: "16 ساعة",
        order: 5,
      },
    ],

    status: "open",
    active: true,
    order: 1,
  },

  {
    id: "csd-essentials",
    slug: "csd-essentials",

    title: "Civil Site Design Essentials",
    shortTitle: "رحلة الأساسيات",

    type: "fundamental",

    description:
      "رحلة تأسيسية لتعلم أدوات البرنامج الأساسية وتصميم الطرق والتقاطعات.",

    duration: "36 ساعة",
    projects: "6 مشاريع",
    level: "من المبتدئ إلى المتوسط",

    curriculum: [
      {
        id: "csd-essentials-01",
        title: "إعداد المشروع",
        description:
          "إعداد ملف المشروع والبيانات الأساسية.",
        duration: "4 ساعات",
        order: 1,
      },
      {
        id: "csd-essentials-02",
        title: "المحاور",
        description:
          "إنشاء وتعديل محاور الطرق.",
        duration: "8 ساعات",
        order: 2,
      },
      {
        id: "csd-essentials-03",
        title: "القطاعات",
        description:
          "إعداد القطاعات الطولية والعرضية.",
        duration: "10 ساعات",
        order: 3,
      },
      {
        id: "csd-essentials-04",
        title: "التقاطعات الأساسية",
        description:
          "إنشاء التقاطعات وتنسيقها.",
        duration: "8 ساعات",
        order: 4,
      },
      {
        id: "csd-essentials-05",
        title: "المشروع التطبيقي",
        description:
          "تطبيق جميع الأدوات في مشروع متكامل.",
        duration: "6 ساعات",
        order: 5,
      },
    ],

    status: "open",
    active: true,
    order: 2,
  },

  {
    id: "csd-advanced",
    slug: "csd-advanced",

    title: "Civil Site Design Advanced",
    shortTitle: "الرحلة المتقدمة",

    type: "advanced",

    description:
      "رحلة متقدمة لتطوير التصميم وإدارة المشروعات المعقدة باحتراف.",

    duration: "24 ساعة",
    projects: "4 مشاريع",
    level: "متقدم",

    curriculum: [],

    status: "coming_soon",
    active: true,
    order: 3,
  },
],
  },

  {
    id: 3,
    slug: "smart-project-deliverables",

    title: "Smart Project Deliverables",
    shortTitle: "SPD",

    description:
      "تعلم منهجية احترافية لاستخراج اللوحات وتنظيم ملفات المشروع وإعداد التسليمات بسرعة ودقة.",

    image: "/images/courses/course-spd.jpg",
    icon: "/images/courses/icons/spd.png",

    pathSlug: "road",
    type: "professional",

    duration: "18 ساعة",
    projects: "500+ لوحة",
    level: "متوسط إلى متقدم",

    instructorIds: ["mona-abdallah"],

    featured: true,
    active: true,
    order: 3,
  },

  {
    id: 4,
    slug: "vehicle-tracking",

    title: "Vehicle Tracking",
    shortTitle: "Vehicle Tracking",

    description:
      "تعلم تحليل مسارات المركبات وتصميم الدوارات والمواقف ومراجعة كفاءة الحركة داخل المشروع.",

    image: "/images/courses/course-vt.jpg",
    icon: "/images/courses/icons/vehicle-tracking.png",

    pathSlug: "road",
    type: "professional",

    duration: "12 ساعة",
    projects: "3 مشاريع",
    level: "متوسط",

    instructorIds: ["mona-abdallah"],

    featured: false,
    active: true,
    order: 4,
  },

  {
  id: 5,
  slug: "bim-for-roads",

  title: "BIM for Roads",
  shortTitle: "BIM Roads",

  description:
    "حوّل تصميم شبكة الطرق إلى نموذج ثلاثي الأبعاد يشمل العلامات المرورية والإنارة وعناصر الطريق.",

  image: "/images/courses/course-bim.jpg",
  icon: "/images/courses/icons/bim.png",

  pathSlug: "road",
  type: "professional",

  duration: "20 ساعة",
  projects: "4 مشاريع",
  level: "متوسط إلى متقدم",

  instructorIds: ["mona-mohamed"],

  professionalJourneyStatus: "coming_soon",

  professionalJourneyId:
    "5ffe9e9f-e370-47a2-94e1-4bf0778d6cd3",

  featured: true,
  active: true,
  order: 5,
},

  /*
  ==================================================
  Traffic Engineering Path
  Keep this list unchanged:
  SIDRA, Synchro, VISSIM, VISUM, CUBE
  ==================================================
  */

  {
    id: 6,
    slug: "sidra",

    title: "SIDRA",
    shortTitle: "SIDRA",

    description:
      "تحليل التقاطعات والدوارات وتقييم الأداء المروري والسعة والتأخير ومستوى الخدمة باستخدام SIDRA.",

    image: "/images/courses/course-sidra.jpg",
    icon: "/images/courses/icons/sidra.png",

    pathSlug: "traffic",
    type: "professional",

    duration: "سيحدد لاحقًا",
    projects: "مشاريع تطبيقية",
    level: "متوسط",

    instructorIds: [],

    featured: true,
    active: true,
    order: 1,
  },

  {
    id: 7,
    slug: "synchro",

    title: "Synchro",
    shortTitle: "Synchro",

    description:
      "تحليل وتشغيل التقاطعات والإشارات المرورية ودراسة التأخير والطوابير ومستوى الخدمة باستخدام Synchro.",

    image: "/images/courses/course-synchro.jpg",
    icon: "/images/courses/icons/synchro.png",

    pathSlug: "traffic",
    type: "professional",

    duration: "سيحدد لاحقًا",
    projects: "مشاريع تطبيقية",
    level: "متوسط",

    instructorIds: [],

    featured: true,
    active: true,
    order: 2,
  },

  {
    id: 8,
    slug: "vissim",

    title: "VISSIM",
    shortTitle: "VISSIM",

    description:
      "إنشاء نماذج محاكاة مرورية دقيقة وتحليل حركة المركبات داخل التقاطعات وشبكات الطرق.",

    image: "/images/courses/course-vissim.jpg",
    icon: "/images/courses/icons/vissim.png",

    pathSlug: "traffic",
    type: "professional",

    duration: "سيحدد لاحقًا",
    projects: "مشاريع تطبيقية",
    level: "متوسط إلى متقدم",

    instructorIds: [],

    featured: true,
    active: true,
    order: 3,
  },

  {
    id: 9,
    slug: "visum",

    title: "VISUM",
    shortTitle: "VISUM",

    description:
      "بناء نماذج النقل وتحليل الطلب المروري وتوزيع الرحلات ودراسة شبكات النقل باستخدام VISUM.",

    image: "/images/courses/course-visum.jpg",
    icon: "/images/courses/icons/visum.png",

    pathSlug: "traffic",
    type: "professional",

    duration: "سيحدد لاحقًا",
    projects: "مشروع نقل متكامل",
    level: "متقدم",

    instructorIds: [],

    featured: true,
    active: true,
    order: 4,
  },

  {
    id: 10,
    slug: "cube",

    title: "CUBE",
    shortTitle: "CUBE",

    description:
      "إنشاء وتحليل نماذج النقل الاستراتيجية ودراسة توزيع الرحلات والاختيار المروري باستخدام CUBE.",

    image: "/images/courses/course-cube.jpg",
    icon: "/images/courses/icons/cube.png",

    pathSlug: "traffic",
    type: "professional",

    duration: "سيحدد لاحقًا",
    projects: "مشروع نقل متكامل",
    level: "متقدم",

    instructorIds: [],

    featured: true,
    active: true,
    order: 5,
  },
];

export function getCourseBySlug(slug: string) {
  return courses.find(
    (course) =>
      course.slug === slug &&
      course.active
  );
}

export function getCoursesByPath(
  pathSlug: PathSlug
) {
  return courses
    .filter(
      (course) =>
        course.pathSlug === pathSlug &&
        course.type === "professional" &&
        course.active
    )
    .sort((a, b) => a.order - b.order);
}

export function getCoursesByType(
  type: CourseType
) {
  return courses
    .filter(
      (course) =>
        course.type === type &&
        course.active
    )
    .sort((a, b) => a.order - b.order);
}

export function getFeaturedCourses() {
  return courses
    .filter(
      (course) =>
        course.featured &&
        course.active
    )
    .sort((a, b) => a.order - b.order);
}