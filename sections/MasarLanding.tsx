"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Play,
  Rocket,
  Pause,
Volume2,
VolumeX,
Maximize2,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

import { createClient } from "@/lib/supabase/client";

type Locale = "ar" | "en";

type Course = {
  title: string;
  aliases: string[];
  icon: string;
  note: Record<Locale, string>;
  description: Record<Locale, string>;
};

type Track = {
  title: Record<Locale, string>;
  courses: Course[];
};

type SelectedCourse = {
  trackIndex: number;
  courseIndex: number;
} | null;

type DbCourse = {
  id: string;
  title: string | null;
  title_ar: string | null;
  title_en: string | null;
  slug: string | null;
  course_code: string | null;
};

type PromoRow = {
  course_id: string;
  video_source: string | null;
  youtube_url: string | null;
  youtube_video_id: string | null;
  is_active: boolean;
};

type PublicLandingPromoRow = {
  course_id: string;
  title: string | null;
  title_ar: string | null;
  title_en: string | null;
  slug: string | null;
  course_code: string | null;
  video_source: string | null;
  youtube_url: string | null;
  youtube_video_id: string | null;
  is_active: boolean;
};

type PromoSlide = {
  trackIndex: number;
  courseIndex: number;
  course: Course;
  youtubeVideoId: string;
};

const tracks: Track[] = [
  {
    title: {
      ar: "هندسة وتصميم الطرق",
      en: "Road Design Engineering",
    },
    courses: [
      {
        title: "Civil 3D",
        aliases: ["civil 3d", "civil3d", "c3d"],
        icon: "/images/courses/icons/civil3d.png",
        note: {
          ar: "ابدأ من الأساس",
          en: "Start with the fundamentals",
        },
        description: {
          ar: "أساس قوي لتصميم الطرق والعمل على المحاور والمناسيب والنماذج داخل Civil 3D.",
          en: "Build a strong foundation in road design, alignments, profiles, levels and Civil 3D models.",
        },
      },
      {
        title: "Civil Site Design",
        aliases: ["csd", "civil site design"],
        icon: "/images/courses/icons/csd.png",
        note: {
          ar: "تصميم أسرع وأكثر ذكاءً",
          en: "Design faster and smarter",
        },
        description: {
          ar: "منهجية احترافية لتصميم الطرق باستخدام Civil Site Design وربط عناصر المشروع بكفاءة.",
          en: "Learn a professional road-design workflow using Civil Site Design and connect project elements efficiently.",
        },
      },
      {
        title: "Smart Deliverables",
        aliases: [
          "smart deliverables",
          "smart project deliverables",
          "project deliverables",
          "spd",
        ],
        icon: "/images/courses/icons/spd.png",
        note: {
          ar: "تسليمات احترافية",
          en: "Professional deliverables",
        },
        description: {
          ar: "منهجية منظمة لإنتاج مئات اللوحات والتسليمات بسرعة ودقة بدل العمل اليدوي المتكرر.",
          en: "Use an organized workflow to produce hundreds of drawings and deliverables quickly and accurately.",
        },
      },
      {
        title: "Vehicle Tracking",
        aliases: ["vehicle tracking", "autodesk vehicle tracking", "vt"],
        icon: "/images/courses/icons/vehicle-tracking.png",
        note: {
          ar: "اختبر حركة المركبات",
          en: "Test vehicle movements",
        },
        description: {
          ar: "تحليل مسارات المركبات والمناورات ومتطلبات التصميم باستخدام Vehicle Tracking.",
          en: "Analyze vehicle paths, maneuvers and design requirements using Vehicle Tracking.",
        },
      },
      {
        title: "BIM for Roads",
        aliases: ["bim for roads", "bim roads", "bim"],
        icon: "/images/courses/icons/bim-roads.png",
        note: {
          ar: "انقل مشروعك إلى BIM",
          en: "Move your project into BIM",
        },
        description: {
          ar: "ربط تصميم الطرق ببيئة BIM وإنشاء نموذج متكامل للمشروع وعناصره.",
          en: "Connect road design to a BIM workflow and create an integrated model of the project and its elements.",
        },
      },
    ],
  },
  {
    title: {
      ar: "هندسة المرور",
      en: "Traffic Engineering",
    },
    courses: [
      {
        title: "SIDRA",
        aliases: ["sidra"],
        icon: "/images/courses/icons/sidra.png",
        note: {
          ar: "حلّل التقاطعات",
          en: "Analyze intersections",
        },
        description: {
          ar: "تحليل أداء التقاطعات والسعات والتأخيرات واختبار الحلول المرورية بصورة عملية.",
          en: "Analyze intersection performance, capacity and delay, and test traffic solutions in practice.",
        },
      },
      {
        title: "Synchro",
        aliases: ["synchro"],
        icon: "/images/courses/icons/synchro.png",
        note: {
          ar: "نسّق الإشارات",
          en: "Coordinate signals",
        },
        description: {
          ar: "تحليل الشبكات المرورية وتنسيق الإشارات وتحسين التشغيل باستخدام Synchro.",
          en: "Analyze traffic networks, coordinate signals and improve operations using Synchro.",
        },
      },
      {
        title: "VISSIM",
        aliases: ["vissim"],
        icon: "/images/courses/icons/vissim.png",
        note: {
          ar: "شاهد الحركة قبل التنفيذ",
          en: "See traffic before implementation",
        },
        description: {
          ar: "محاكاة مرورية دقيقة لاختبار السيناريوهات والحلول قبل تطبيقها على أرض الواقع.",
          en: "Build detailed traffic simulations to test scenarios and solutions before real-world implementation.",
        },
      },
      {
        title: "VISUM",
        aliases: ["visum", "traffic impact study"],
        icon: "/images/courses/icons/visum.png",
        note: {
          ar: "خطط للشبكات",
          en: "Plan transport networks",
        },
        description: {
          ar: "تخطيط وتحليل شبكات النقل والنمذجة الاستراتيجية باستخدام VISUM.",
          en: "Plan and analyze transport networks and strategic models using VISUM.",
        },
      },
      {
        title: "CUBE",
        aliases: ["cube", "traffic engineering"],
        icon: "/images/courses/icons/cube.png",
        note: {
          ar: "نمذجة النقل المتكاملة",
          en: "Integrated transport modeling",
        },
        description: {
          ar: "نمذجة الطلب على النقل وبناء النماذج وتحليل السيناريوهات باستخدام CUBE.",
          en: "Model travel demand, build transport models and analyze scenarios using CUBE.",
        },
      },
    ],
  },
];

const pageText = {
  ar: {
    explore: "استكشف المنصة",
    contact: "تواصل معنا",
    heroBefore: "لا تتعلم كورس فقط...",
    heroAfter: "ابنِ مسيرتك المهنية",
    heroSubtitle:
      "اختر مسارك، تعرّف على محطتك القادمة، وابدأ رحلة واضحة نحو الاحتراف.",
    chooseMethod: "اختر طريقتك المفضلة للتعلم",
    closeDetails: "إغلاق تفاصيل المحطة",
    videoUnavailable: "سيتم إضافة فيديو إعلان هذه المحطة قريبًا.",
    finalLine: "رحلتك تبدأ بخطوة... وما بعدها نصنعه معًا",
    freeTitle: "الرحلات المجانية",
    freeDesc:
      "ابدأ رحلتك معنا مجانًا، وتعرّف على أسلوب التعلم في صناع المسار.",
    oneDayTitle: "رحلة اليوم الواحد",
    oneDayDesc:
      "موضوع متخصص ومركز يمكنك إنجازه في وقت قصير واكتساب مهارة جديدة.",
    professionalTitle: "رحلة الاحتراف المتكاملة",
    professionalDesc:
      "رحلة متدرجة تأخذك من الأساسيات حتى التطبيق والاحتراف بخطوات واضحة ومنظمة.",
  },
  en: {
    explore: "Explore Platform",
    contact: "Contact Us",
    heroBefore: "Don’t just take a course...",
    heroAfter: "Build your professional path",
    heroSubtitle:
      "Choose your path, discover your next station, and start a clear journey toward professional mastery.",
    chooseMethod: "Choose your preferred way to learn",
    closeDetails: "Close station details",
    videoUnavailable: "The promotional video for this station will be added soon.",
    finalLine:
      "Your journey starts with one step... we build what comes next together",
    freeTitle: "Free Journeys",
    freeDesc:
      "Start with us for free and discover the Masar Makers learning experience.",
    oneDayTitle: "One-Day Journey",
    oneDayDesc:
      "A focused specialist topic you can complete quickly and turn into a practical new skill.",
    professionalTitle: "Integrated Professional Journey",
    professionalDesc:
      "A structured journey that takes you from fundamentals to application and professional mastery.",
  },
} as const;

const modes = [
  {
    key: "professional",
    accent: "gold",
    titleKey: "professionalTitle",
    descriptionKey: "professionalDesc",
  },
  {
    key: "one-day",
    accent: "blue",
    titleKey: "oneDayTitle",
    descriptionKey: "oneDayDesc",
  },
  {
    key: "free",
    accent: "green",
    titleKey: "freeTitle",
    descriptionKey: "freeDesc",
  },
] as const;

const roadStations = {
  road: [
    { left: 85, top: 28 },
    { left: 82, top: 37 },
    { left: 83, top: 49 },
    { left: 70, top: 55 },
    { left: 60, top: 58 },
  ],
  traffic: [
    { left: 15, top: 28 },
    { left: 19, top: 37 },
    { left: 19, top: 50 },
    { left: 29, top: 55 },
    { left: 40, top: 58 },
  ],
};

const mobileRoadStations = {
  road: [
    { left: 84, top: 41 },
    { left: 84, top: 47 },
    { left: 80, top: 53 },
    { left: 70, top: 58 },
    { left: 60, top: 60.5 },
  ],
  traffic: [
    { left: 17, top: 41 },
    { left: 16, top: 47 },
    { left: 19, top: 53 },
    { left: 29, top: 58 },
    { left: 40, top: 60.5 },
  ],
};

const AUTO_ROTATE_MS = 8000;
const MANUAL_PAUSE_MS = 12000;

function normalizeValue(value: string | null | undefined) {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

function courseMatchesDbCourse(course: Course, dbCourse: DbCourse) {
  const dbValues = [
    dbCourse.title,
    dbCourse.title_ar,
    dbCourse.title_en,
    dbCourse.slug,
    dbCourse.course_code,
  ]
    .map(normalizeValue)
    .filter(Boolean);

  const aliases = [course.title, ...course.aliases]
    .map(normalizeValue)
    .filter(Boolean);

  return aliases.some((alias) =>
    dbValues.some(
      (value) =>
        value === alias ||
        value.includes(alias) ||
        alias.includes(value),
    ),
  );
}

function getYoutubeEmbedUrl(
  videoId: string,
  mobile = false,
) {
  const params = new URLSearchParams({
    // Desktop: يبدأ تلقائيًا صامتًا.
    // Mobile: نسمح بالمحاولة أيضًا، لكن إذا منع المتصفح
    // يستطيع المستخدم الضغط مباشرة على YouTube player.
    autoplay: "1",
    mute: "1",
    playsinline: "1",

    // على الموبايل نُظهر controls الأصلية لضمان إمكانية التشغيل.
    controls: "0",
    disablekb: "1",
    fs: "1",

    rel: "0",
    modestbranding: "1",
    iv_load_policy: "3",
    enablejsapi: "1",
    vq: "hd1080",
  });

  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}

export default function MasarLanding() {
  const [locale, setLocale] = useState<Locale>("ar");
  const [localeReady, setLocaleReady] = useState(false);
  const [selected, setSelected] = useState<SelectedCourse>(null);
  const [dbCourses, setDbCourses] = useState<DbCourse[]>([]);
  const [promos, setPromos] = useState<PromoRow[]>([]);

  useEffect(() => {
    const savedLocale = window.localStorage.getItem(
      "masar-locale",
    ) as Locale | null;

    if (savedLocale === "ar" || savedLocale === "en") {
      setLocale(savedLocale);
    }

    setLocaleReady(true);

    const handleLocaleChange = (event: Event) => {
      const customEvent = event as CustomEvent<{
        locale?: Locale;
      }>;

      if (
        customEvent.detail?.locale === "ar" ||
        customEvent.detail?.locale === "en"
      ) {
        setLocale(customEvent.detail.locale);
      }
    };

    window.addEventListener(
      "masar:locale-change",
      handleLocaleChange,
    );

    return () => {
      window.removeEventListener(
        "masar:locale-change",
        handleLocaleChange,
      );
    };
  }, []);

  useEffect(() => {
    if (!localeReady) return;

    document.documentElement.lang = locale;
    document.documentElement.dir =
      locale === "ar" ? "rtl" : "ltr";
  }, [locale, localeReady]);

  useEffect(() => {
    let cancelled = false;

    const loadPromos = async () => {
      const supabase = createClient();

      const { data, error } = await supabase.rpc(
        "get_public_landing_promos",
      );

      if (error) {
        console.error("Landing promos load error:", error);

        if (!cancelled) {
          setDbCourses([]);
          setPromos([]);
        }

        return;
      }

      if (cancelled) return;

      const rows = (data ?? []) as PublicLandingPromoRow[];

      setDbCourses(
        rows.map((row) => ({
          id: row.course_id,
          title: row.title,
          title_ar: row.title_ar,
          title_en: row.title_en,
          slug: row.slug,
          course_code: row.course_code,
        })),
      );

      setPromos(
        rows.map((row) => ({
          course_id: row.course_id,
          video_source: row.video_source,
          youtube_url: row.youtube_url,
          youtube_video_id: row.youtube_video_id,
          is_active: row.is_active,
        })),
      );
    };

    void loadPromos();

    return () => {
      cancelled = true;
    };
  }, []);

  const text = pageText[locale];

  const selectedCourse = selected
    ? tracks[selected.trackIndex].courses[selected.courseIndex]
    : null;

  const promoSlides = useMemo<PromoSlide[]>(() => {
    const displayOrder = [
      ...tracks[0].courses
        .map((course, courseIndex) => ({
          trackIndex: 0,
          courseIndex,
          course,
        }))
        .reverse(),
      ...tracks[1].courses
        .map((course, courseIndex) => ({
          trackIndex: 1,
          courseIndex,
          course,
        }))
        .reverse(),
    ];

    return displayOrder.flatMap((item) => {
      const matchedDbCourse = dbCourses.find((dbCourse) =>
        courseMatchesDbCourse(item.course, dbCourse),
      );

      if (!matchedDbCourse) return [];

      const promo = promos.find(
        (row) =>
          row.course_id === matchedDbCourse.id &&
          row.is_active &&
          row.video_source === "youtube" &&
          row.youtube_video_id,
      );

      if (!promo?.youtube_video_id) return [];

      return [
        {
          ...item,
          youtubeVideoId: promo.youtube_video_id,
        },
      ];
    });
  }, [dbCourses, promos]);

  const selectedPromo = useMemo(() => {
    if (!selected) return null;

    return (
      promoSlides.find(
        (slide) =>
          slide.trackIndex === selected.trackIndex &&
          slide.courseIndex === selected.courseIndex,
      ) ?? null
    );
  }, [promoSlides, selected]);

  const [hoverPaused, setHoverPaused] = useState(false);
  const [manualPaused, setManualPaused] = useState(false);
  const [fullscreenPaused, setFullscreenPaused] = useState(false);

  useEffect(() => {
    if (promoSlides.length === 0) return;

    const selectedStillExists =
      selected &&
      promoSlides.some(
        (slide) =>
          slide.trackIndex === selected.trackIndex &&
          slide.courseIndex === selected.courseIndex,
      );

    if (!selectedStillExists) {
      setSelected({
        trackIndex: promoSlides[0].trackIndex,
        courseIndex: promoSlides[0].courseIndex,
      });
    }
  }, [promoSlides, selected]);

  useEffect(() => {
    if (
      promoSlides.length <= 1 ||
      hoverPaused ||
      manualPaused ||
      fullscreenPaused
    ) {
      return;
    }

    const timer = window.setInterval(() => {
      setSelected((current) => {
        if (!current) {
          return {
            trackIndex: promoSlides[0].trackIndex,
            courseIndex: promoSlides[0].courseIndex,
          };
        }

        const currentIndex = promoSlides.findIndex(
          (slide) =>
            slide.trackIndex === current.trackIndex &&
            slide.courseIndex === current.courseIndex,
        );

        const nextIndex =
          currentIndex < 0
            ? 0
            : (currentIndex + 1) % promoSlides.length;

        return {
          trackIndex: promoSlides[nextIndex].trackIndex,
          courseIndex: promoSlides[nextIndex].courseIndex,
        };
      });
    }, AUTO_ROTATE_MS);

    return () => window.clearInterval(timer);
  }, [
    promoSlides,
    hoverPaused,
    manualPaused,
    fullscreenPaused,
  ]);

  const selectCourse = (
    trackIndex: number,
    courseIndex: number,
  ) => {
    setSelected({
      trackIndex,
      courseIndex,
    });
  };

  const selectCourseManually = (
    trackIndex: number,
    courseIndex: number,
  ) => {
    selectCourse(trackIndex, courseIndex);
    setManualPaused(true);

    window.setTimeout(() => {
      setManualPaused(false);
    }, MANUAL_PAUSE_MS);
  };

  const ArrowIcon =
    locale === "ar" ? ArrowLeft : ArrowRight;

 return (
    <main
      dir={locale === "ar" ? "rtl" : "ltr"}
      className="min-h-screen overflow-x-hidden bg-[#07152E] text-white"
    >
      <header className="relative z-50 hidden border-b border-white/10 bg-[#07152E]/95 md:block">
        <div className="mx-auto flex min-h-[80px] max-w-[1500px] items-center justify-between gap-3 px-4 sm:px-7 lg:px-10">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-3"
            aria-label="Masar Makers"
          >
            <Image
              src="/images/logo/masar-makers-mark.png"
              alt="Masar Makers"
              width={75}
              height={50}
              priority
              className="h-[50px] w-auto object-contain sm:h-[75px]"
            />

            <div className="hidden md:block">
              <p className="text-[24px] font-black leading-none lg:text-[28px]">
                {locale === "ar" ? (
                  <>
                    صناع{" "}
                    <span className="text-[#F7B548]">
                      المسار
                    </span>
                  </>
                ) : (
                  <>
                    Masar{" "}
                    <span className="text-[#F7B548]">
                      Makers
                    </span>
                  </>
                )}
              </p>

              <p className="mt-1 text-[12px] font-bold tracking-[.18em] text-[#F7B548] lg:text-[14px]">
                Masar{" "}
                <span className="text-white">
                  Makers
                </span>
              </p>
            </div>
          </Link>

          <div className="flex gap-2 sm:gap-4">
            <Link
              href="/home"
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-[#F7B548] px-3 text-[12px] font-black text-[#07152E] shadow-lg transition hover:-translate-y-0.5 sm:px-3 sm:text-[14px]"
            >
              {text.explore}
              <ArrowIcon className="h-4 w-4" />
            </Link>

            <a
              href="https://wa.me/201031885659?text=السلام عليكم، أرغب في الاستفسار عن منصة صناع المسار."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-[#25D366]/60 bg-[#0B502B]/60 px-3 text-[11px] font-black text-white transition hover:bg-[#25D366] sm:px-3 sm:text-[14px]"
            >
              <FaWhatsapp className="h-6 w-6 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">
                {text.contact}
              </span>
            </a>
          </div>
        </div>
      </header>

      <section
        className="
          relative mx-auto
          min-h-[1150px] w-full max-w-[2000px]
          overflow-hidden bg-[#07152E]
          bg-[url('/images/landing/learning-roads-bg.png')]
          bg-[length:100%_100%]
          bg-center bg-no-repeat
          sm:min-h-[1050px]
          md:min-h-[700px]
          lg:min-h-[900px]
          xl:min-h-[950px]
        "
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#07152E]/58 via-[#07152E]/5 to-[#07152E]/30" />

        <div className="relative z-20 mx-auto max-w-[1450px] px-2 pt-4 text-center sm:px-4 sm:pt-3 lg:pt-3">
          <h1 className="mx-auto whitespace-nowrap text-[clamp(21px,5.6vw,25px)] font-black leading-[1.1] md:text-[clamp(24px,3.2vw,42px)]">
            <span>{text.heroBefore}</span>{" "}
            <span className="text-[#F7B548]">
              {text.heroAfter}
            </span>
          </h1>

          <p className="mx-auto mt-3 max-w-3xl px-4 text-[14px] font-semibold leading-5 text-slate-200 sm:text-[13px] md:mt-2 md:px-0 md:text-[15px] lg:text-[16px]">
            {text.heroSubtitle}
          </p>
        </div>

        <div className="absolute left-[3%] top-[12%] z-20 hidden text-center text-[#F7B548] md:block md:left-[7%] lg:left-[13%]">
          <p className="text-[13px] font-black sm:text-lg lg:text-3xl">
            {tracks[1].title[locale]}
          </p>
          <div className="mx-auto mt-2 h-0.5 w-[clamp(55px,7vw,120px)] bg-[#F7B548]" />
        </div>

        <div className="absolute right-[3%] top-[12%] z-20 hidden text-center text-[#F7B548] md:block md:right-[7%] lg:right-[10%]">
          <p className="text-[13px] font-black sm:text-lg lg:text-3xl">
            {tracks[0].title[locale]}
          </p>
          <div className="mx-auto mt-2 h-0.5 w-[clamp(55px,7vw,120px)] bg-[#F7B548]" />
        </div>


        {/* Mobile path titles */}
        <div className="absolute left-[12%] top-[34.5%] z-20 text-center text-[#F7B548] md:hidden">
          <p className="text-[17px] font-black">
            {tracks[1].title[locale]}
          </p>
          <div className="mx-auto mt-1.5 h-0.5 w-20 bg-[#F7B548]" />
        </div>

        <div className="absolute right-[6%] top-[34.5%] z-20 text-center text-[#F7B548] md:hidden">
          <p className="text-[17px] font-black">
            {tracks[0].title[locale]}
          </p>
          <div className="mx-auto mt-1.5 h-0.5 w-24 bg-[#F7B548]" />
        </div>

        {/* Mobile stations */}
        <div className="md:hidden">
          {tracks[1].courses.map((item, courseIndex) => {
            const visualIndex =
              tracks[1].courses.length - 1 - courseIndex;

            const pos = mobileRoadStations.traffic[visualIndex];

            const active =
              selected?.trackIndex === 1 &&
              selected?.courseIndex === courseIndex;

            return (
              <StationPin
                key={`mobile-traffic-${item.title}`}
                course={item}
                active={active}
                left={pos.left}
                top={pos.top}
                onSelect={() => selectCourseManually(1, courseIndex)}
                onHoverStart={() => {
                  setHoverPaused(true);
                  selectCourse(1, courseIndex);
                }}
                onHoverEnd={() => setHoverPaused(false)}
                labelSide="outside-left"
              />
            );
          })}

          {tracks[0].courses.map((item, courseIndex) => {
            const visualIndex =
              tracks[0].courses.length - 1 - courseIndex;

            const pos = mobileRoadStations.road[visualIndex];

            const active =
              selected?.trackIndex === 0 &&
              selected?.courseIndex === courseIndex;

            return (
              <StationPin
                key={`mobile-road-${item.title}`}
                course={item}
                active={active}
                left={pos.left}
                top={pos.top}
                onSelect={() => selectCourseManually(0, courseIndex)}
                onHoverStart={() => {
                  setHoverPaused(true);
                  selectCourse(0, courseIndex);
                }}
                onHoverEnd={() => setHoverPaused(false)}
                labelSide="outside-right"
              />
            );
          })}
        </div>

        {/* Mobile centered brand + CTAs between the two paths */}
        <div className="absolute left-1/2 top-[39.5%] z-30 flex -translate-x-1/2 flex-col items-center gap-2.5 md:hidden">
          <div className="flex items-center justify-center gap-0 px-2 py-0">
            <Image
              src="/images/logo/masar-makers-mark.png"
              alt="Masar Makers"
              width={72}
              height={72}
              className="h-[70px] w-auto object-contain drop-shadow-[0_8px_18px_rgba(0,0,0,.45)]"
            />

            <div className="text-right">
              <p className="whitespace-nowrap text-[20px] font-black leading-none text-white">
                صناع <span className="text-[#F7B548]">المسار</span>
              </p>
              <p className="mt-1 whitespace-nowrap text-[11px] font-bold tracking-[.12em] text-[#F7B548]">
                Masar <span className="text-white">Makers</span>
              </p>
            </div>
          </div>

          <Link
            href="/home"
            className="inline-flex min-h-10 w-[155px] items-center justify-center gap-2 rounded-xl bg-[#F7B548] px-4 text-[13px] font-black text-[#07152E] shadow-lg"
          >
            {text.explore}
            <ArrowIcon className="h-4 w-4" />
          </Link>

          <a
            href="https://wa.me/201031885659?text=السلام عليكم، أرغب في الاستفسار عن منصة صناع المسار."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-10 w-[155px] items-center justify-center gap-2 rounded-xl border border-[#25D366]/70 bg-[#0B502B]/85 px-4 text-[13px] font-black text-white shadow-lg"
          >
            <FaWhatsapp className="h-5 w-5" />
            {text.contact}
          </a>
        </div>

        {/* Desktop stations */}
        <div className="hidden md:block">
        {tracks[1].courses.map((item, courseIndex) => {
          const visualIndex =
            tracks[1].courses.length - 1 - courseIndex;

          const pos = roadStations.traffic[visualIndex];

          const active =
            selected?.trackIndex === 1 &&
            selected?.courseIndex === courseIndex;

          return (
            <StationPin
              key={item.title}
              course={item}
              active={active}
              left={pos.left}
              top={pos.top}
              onSelect={() => selectCourseManually(1, courseIndex)}
              onHoverStart={() => {
                setHoverPaused(true);
                selectCourse(1, courseIndex);
              }}
              onHoverEnd={() => setHoverPaused(false)}
              labelSide="outside-left"
            />
          );
        })}

        {tracks[0].courses.map((item, courseIndex) => {
          const visualIndex =
            tracks[0].courses.length - 1 - courseIndex;

          const pos = roadStations.road[visualIndex];

          const active =
            selected?.trackIndex === 0 &&
            selected?.courseIndex === courseIndex;

          return (
            <StationPin
              key={item.title}
              course={item}
              active={active}
              left={pos.left}
              top={pos.top}
              onSelect={() => selectCourseManually(0, courseIndex)}
              onHoverStart={() => {
                setHoverPaused(true);
                selectCourse(0, courseIndex);
              }}
              onHoverEnd={() => setHoverPaused(false)}
              labelSide="outside-right"
            />
          );
        })}


        </div>
        

        <PromoShowcase
          locale={locale}
          selected={selected}
          course={selectedCourse}
          trackTitle={
            selected
              ? tracks[selected.trackIndex].title[locale]
              : ""
          }
          youtubeVideoId={
            selectedPromo?.youtubeVideoId ?? null
          }
          slides={promoSlides}
          autoPaused={
            hoverPaused ||
            manualPaused ||
            fullscreenPaused
          }
          onFullscreenChange={setFullscreenPaused}
          onSelectSlide={(slide) =>
            selectCourseManually(
              slide.trackIndex,
              slide.courseIndex,
            )
          }
        />

        <div className="absolute left-1/2 top-[70%] z-20 -translate-x-1/2 text-center md:top-[65%]">
          <div
            className="
              relative whitespace-nowrap
              px-8 py-4
              text-[30px] font-black
              text-[#FFF7E7]
              sm:text-[30px]
              lg:text-[40px]
              [text-shadow:0_3px_5px_rgba(0,0,0,.95),0_0_16px_rgba(0,0,0,.8),0_0_28px_rgba(247,181,72,.35)]
            "
          >
            <span
              className="
                pointer-events-none
                absolute left-1/2 top-1/2 -z-10
                h-[80px] w-[360px]
                -translate-x-1/2 -translate-y-1/2
                rounded-full
                bg-[radial-gradient(ellipse,rgba(247,181,72,.62)_0%,rgba(247,181,72,.28)_42%,rgba(247,181,72,.08)_70%,transparent_82%)]
                blur-[7px]
                sm:w-[520px]
                lg:h-[100px] lg:w-[680px]
              "
            />

            {text.chooseMethod}
          </div>
        </div>

        <div
          className="
            absolute inset-x-[3%] top-[78%] z-20 md:inset-x-[4%] md:top-auto md:bottom-[10%]
            grid grid-cols-3
            gap-2 sm:gap-4 lg:gap-20
          "
        >
          {modes.map((mode) => (
            <LearningModeCard
              key={mode.key}
              mode={mode}
              locale={locale}
            />
          ))}
        </div>
      </section>

      <section className="border-t border-white/10 bg-[#061329] px-4 py-3 text-center sm:py-4">
        <p className="text-[11px] font-black sm:text-lg lg:text-xl">
          {text.finalLine}
        </p>

        <div className="mx-auto mt-2 flex items-center justify-center gap-2">
          <span className="h-px w-20 bg-[#F7B548] sm:w-48" />
          <span className="h-2 w-2 rounded-full bg-[#F7B548]" />
          <span className="h-px w-20 bg-[#F7B548] sm:w-48" />
        </div>
      </section>
    </main>
  );
}

function PromoShowcase({
  locale,
  selected,
  course,
  trackTitle,
  youtubeVideoId,
  slides,
  autoPaused,
  onFullscreenChange,
  onSelectSlide,
}: {
  locale: Locale;
  selected: SelectedCourse;
  course: Course | null;
  trackTitle: string;
  youtubeVideoId: string | null;
  slides: PromoSlide[];
  autoPaused: boolean;
  onFullscreenChange: (fullscreen: boolean) => void;
  onSelectSlide: (slide: PromoSlide) => void;
}) {
  const text = pageText[locale];
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const videoContainerRef = useRef<HTMLDivElement | null>(null);

  const [showControls, setShowControls] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(
      "(max-width: 767px), (hover: none), (pointer: coarse)",
    );

    const syncMobile = () => {
      setIsMobile(media.matches);
    };

    syncMobile();
    media.addEventListener?.("change", syncMobile);

    return () => {
      media.removeEventListener?.("change", syncMobile);
    };
  }, []);

  const sendYoutubeCommand = (
    func: string,
    args: unknown[] = [],
  ) => {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({
        event: "command",
        func,
        args,
      }),
      "*",
    );
  };

  const togglePlay = () => {
    if (isPlaying) {
      sendYoutubeCommand("pauseVideo");
      setIsPlaying(false);
    } else {
      sendYoutubeCommand("playVideo");
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      sendYoutubeCommand("unMute");
      sendYoutubeCommand("setVolume", [100]);
      setIsMuted(false);
    } else {
      sendYoutubeCommand("mute");
      setIsMuted(true);
    }
  };

  const openFullscreen = async () => {
    const container = videoContainerRef.current;
    const iframe = iframeRef.current;

    if (!container || !iframe) return;

    try {
      onFullscreenChange(true);

      sendYoutubeCommand("playVideo");
      sendYoutubeCommand("unMute");
      sendYoutubeCommand("setVolume", [100]);
      sendYoutubeCommand("setPlaybackQuality", ["hd1080"]);

      setIsPlaying(true);
      setIsMuted(false);

      if (container.requestFullscreen) {
        await container.requestFullscreen();
      } else if (iframe.requestFullscreen) {
        await iframe.requestFullscreen();
      }

      window.setTimeout(() => {
        sendYoutubeCommand("playVideo");
        sendYoutubeCommand("unMute");
        sendYoutubeCommand("setVolume", [100]);
        sendYoutubeCommand("setPlaybackQuality", ["hd1080"]);
      }, 500);
    } catch (error) {
      console.error("Fullscreen error:", error);
    }
  };

  useEffect(() => {
    setIsPlaying(true);
    setIsMuted(true);
    setShowControls(false);
  }, [youtubeVideoId]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const fullscreenElement = document.fullscreenElement;

      const isOurVideoFullscreen =
        fullscreenElement === videoContainerRef.current ||
        fullscreenElement === iframeRef.current;

      onFullscreenChange(isOurVideoFullscreen);

      if (isOurVideoFullscreen) {
        sendYoutubeCommand("playVideo");
        sendYoutubeCommand("unMute");
        sendYoutubeCommand("setVolume", [100]);

        setIsPlaying(true);
        setIsMuted(false);

        window.setTimeout(() => {
          sendYoutubeCommand("setPlaybackQuality", ["hd1080"]);
        }, 700);
      }
    };

    document.addEventListener(
      "fullscreenchange",
      handleFullscreenChange,
    );

    return () => {
      document.removeEventListener(
        "fullscreenchange",
        handleFullscreenChange,
      );
    };
  }, [onFullscreenChange]);

  return (
    <div
      className="
        absolute left-1/2 top-[9%] z-30
        h-[255px] min-h-0
        w-full max-w-none
        -translate-x-1/2
        overflow-hidden
        bg-[#07152E]/96
        md:top-[15%]
        md:h-[31%] md:min-h-[190px]
        md:w-[48%] md:max-w-[820px]
        md:rounded-[18px]
        md:border md:border-[#F7B548]/85
        md:shadow-[0_18px_55px_rgba(0,0,0,.40),0_0_26px_rgba(247,181,72,.12)]
        md:backdrop-blur-md
        lg:w-[38%]
      "
    >
      {course ? (
        <div
          className={`grid h-full min-h-0 grid-cols-1 grid-rows-[62px_minmax(0,1fr)] md:grid-rows-1 ${
            locale === "ar"
              ? "md:grid-cols-[32%_68%]"
              : "md:grid-cols-[68%_32%]"
          }`}
        >
          {/* Course info column */}
          <div
            className={`
              flex min-w-0 flex-col justify-center gap-2
              bg-[linear-gradient(180deg,rgba(7,21,46,.98),rgba(12,30,57,.96))]
              px-3 py-2 text-white
              sm:px-4 md:py-3
              order-1 ${
                locale === "ar"
                  ? "text-right md:order-1"
                  : "text-left md:order-2"
              }
            `}
          >
            <div className="flex items-center gap-2">
              <div className="relative h-9 w-9 shrink-0 rounded-lg bg-white sm:h-11 sm:w-11">
                <Image
                  src={course.icon}
                  alt={course.title}
                  fill
                  sizes="44px"
                  className="object-contain p-1"
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-[8px] font-black text-[#F7B548] sm:text-[10px]">
                  {trackTitle}
                </p>
                <h2 className="break-words text-[12px] font-black leading-tight sm:text-[16px] lg:text-[20px]">
                  {course.title}
                </h2>
              </div>
            </div>

            <p className="hidden line-clamp-3 text-[8px] font-semibold leading-4 text-slate-200 md:block sm:text-[10px] lg:mt-3 lg:text-[12px] lg:leading-6">
              {course.description[locale]}
            </p>
{slides.length > 0 && (
       <div className="flex items-center justify-center gap-1.5 rounded-full bg-white/10 px-3 py-1">
          {slides.map((slide) => {
            const active =
              selected?.trackIndex === slide.trackIndex &&
              selected?.courseIndex === slide.courseIndex;

            return (
              <button
                key={`${slide.trackIndex}-${slide.courseIndex}`}
                type="button"
                onClick={() => onSelectSlide(slide)}
                aria-label={slide.course.title}
                title={slide.course.title}
                className={`h-1.5 rounded-full transition-all ${
                  active
                    ? "w-5 bg-[#F7B548]"
                    : "w-1.5 bg-white/50 hover:bg-white/85"
                }`}
              />
            );
          })}
        </div>
      )}
            <div className="mt-auto hidden items-center gap-2 text-[8px] font-bold text-slate-400 md:flex sm:text-[10px]">
              <span
                className={`h-2 w-2 rounded-full ${
                  autoPaused
                    ? "bg-[#F7B548]"
                    : "animate-pulse bg-emerald-400"
                }`}
              />
              <span>
                {autoPaused
                  ? locale === "ar"
                    ? "تم تثبيت المحطة مؤقتًا"
                    : "Station paused"
                  : locale === "ar"
                    ? "الإعلانات تتغير تلقائيًا"
                    : "Promos rotate automatically"}
              </span>
            </div>
          </div>

          {/* Full video column */}
          <div
  ref={videoContainerRef}
  onMouseEnter={() => {
    if (!isMobile) setShowControls(true);
  }}
  onMouseLeave={() => {
    if (!isMobile) setShowControls(false);
  }}
  onClick={() => {
    if (!isMobile) setShowControls(true);
  }}
  className={`group relative min-h-0 overflow-hidden bg-black fullscreen:flex fullscreen:items-center fullscreen:justify-center ${
    locale === "ar"
      ? "order-2 md:order-2"
      : "order-2 md:order-1"
  }`}
>
            {youtubeVideoId ? (
              <>
                <iframe
                  ref={iframeRef}
                  key={youtubeVideoId}
                  src={getYoutubeEmbedUrl(
                    youtubeVideoId,
                    isMobile,
                  )}
                  title={`${course.title} promo`}
                  className="pointer-events-none h-full w-full border-0 bg-black"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
                <div
                  className={`
                    absolute inset-x-0 bottom-0 z-20
                    flex items-center justify-between
                    bg-gradient-to-t from-black/85 via-black/45 to-transparent
                    px-2 pb-2 pt-7 md:px-3 md:pb-3 md:pt-8
                    transition-all duration-300
                    ${
                      isMobile || showControls
                        ? "translate-y-0 opacity-100"
                        : "pointer-events-none translate-y-2 opacity-0"
                    }
                  `}
                >
  <div className="flex items-center gap-2">
    {/* تشغيل / إيقاف */}
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        togglePlay();
      }}
      className="
        flex h-9 w-9 items-center justify-center
        rounded-full
        border border-white/20
        bg-black/55 text-white
        backdrop-blur-md
        transition
        hover:border-[#F7B548]
        hover:bg-[#F7B548]
        hover:text-[#07152E]
      "
      aria-label={
        isPlaying
          ? locale === "ar"
            ? "إيقاف الفيديو"
            : "Pause video"
          : locale === "ar"
            ? "تشغيل الفيديو"
            : "Play video"
      }
    >
      {isPlaying ? (
        <Pause className="h-4 w-4" />
      ) : (
        <Play className="h-4 w-4 fill-current" />
      )}
    </button>

    {/* الصوت */}
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        toggleMute();
      }}
      className="
        flex h-9 w-9 items-center justify-center
        rounded-full
        border border-white/20
        bg-black/55 text-white
        backdrop-blur-md
        transition
        hover:border-[#F7B548]
        hover:bg-[#F7B548]
        hover:text-[#07152E]
      "
      aria-label={
        isMuted
          ? locale === "ar"
            ? "تشغيل الصوت"
            : "Enable sound"
          : locale === "ar"
            ? "كتم الصوت"
            : "Mute sound"
      }
    >
      {isMuted ? (
        <VolumeX className="h-4 w-4" />
      ) : (
        <Volume2 className="h-4 w-4" />
      )}
    </button>
  </div>

  {/* تكبير */}
  <button
    type="button"
    onClick={(event) => {
      event.stopPropagation();
      void openFullscreen();
    }}
    className="
      flex h-9 w-9 items-center justify-center
      rounded-full
      border border-white/20
      bg-black/55 text-white
      backdrop-blur-md
      transition
      hover:border-[#F7B548]
      hover:bg-[#F7B548]
      hover:text-[#07152E]
    "
    aria-label={
      locale === "ar"
        ? "تكبير الفيديو"
        : "Fullscreen"
    }
  >
    <Maximize2 className="h-4 w-4" />
  </button>
</div>
              </>
            ) : (
              <div className="flex h-full items-center justify-center p-4 text-center text-white">
                <div>
                  <Play className="mx-auto h-8 w-8 text-[#F7B548]" />
                  <p className="mt-2 text-[9px] font-bold sm:text-xs">
                    {text.videoUnavailable}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        
      ) : (
        <div className="flex h-full items-center justify-center p-5 text-center text-white">
          <div>
            <Play className="mx-auto h-9 w-9 text-[#F7B548]" />
            <p className="mt-3 text-xs font-bold">
              {text.videoUnavailable}
            </p>
          </div>
        </div>
      )}

      
    </div>
  );
}

function LearningModeCard({
  mode,
  locale,
}: {
  mode: (typeof modes)[number];
  locale: Locale;
}) {
  const text = pageText[locale];

  const isProfessional =
    mode.accent === "gold";
  const isOneDay =
    mode.accent === "blue";

  const title =
    text[
      mode.titleKey as
        | "professionalTitle"
        | "oneDayTitle"
        | "freeTitle"
    ];

  const description =
    text[
      mode.descriptionKey as
        | "professionalDesc"
        | "oneDayDesc"
        | "freeDesc"
    ];

  const cardClasses =
    isProfessional
      ? "border-[#F7B548]/90 bg-[linear-gradient(135deg,rgba(247,181,72,.50),rgba(138,84,8,.66))] shadow-[0_16px_45px_rgba(247,181,72,.13)]"
      : isOneDay
        ? "border-[#67A9FF]/90 bg-[linear-gradient(135deg,rgba(45,115,218,.57),rgba(17,54,112,.78))] shadow-[0_16px_45px_rgba(77,148,255,.13)]"
        : "border-[#67D567]/90 bg-[linear-gradient(135deg,rgba(41,143,70,.62),rgba(12,78,37,.78))] shadow-[0_16px_45px_rgba(75,201,100,.13)]";

  const iconClasses =
    isProfessional
      ? "border-[#FFD56C] bg-[#765313]/95 text-[#FFD56C]"
      : isOneDay
        ? "border-[#7EB7FF] bg-[#17498D]/95 text-[#7EB7FF]"
        : "border-[#72DE7A] bg-[#135C2C]/95 text-[#72DE7A]";

  return (
    <article
      className={`
        relative mt-6
        min-h-[150px]
        rounded-[18px] border
        px-2 pb-3 pt-8 text-center
        backdrop-blur-md
        sm:min-h-[120px]
        sm:rounded-[24px]
        sm:px-4 sm:pb-0 sm:pt-8
        ${cardClasses}
      `}
    >
      <div
        className={`
          absolute left-1/2 top-0
          flex h-[48px] w-[48px]
          -translate-x-1/2 -translate-y-1/2
          items-center justify-center
          rounded-full border-[3px]
          sm:h-[58px] sm:w-[58px]
          ${iconClasses}
        `}
      >
        {isProfessional && (
          <CalendarDays className="h-5 w-5 sm:h-7 sm:w-7" />
        )}

        {isOneDay && (
          <Rocket className="h-5 w-5 sm:h-7 sm:w-7" />
        )}

        {!isProfessional && !isOneDay && (
          <Play className="h-5 w-5 fill-current sm:h-7 sm:w-7" />
        )}
      </div>

      <h3
        className={`text-[16px] font-black leading-tight sm:text-lg ${
          isProfessional
            ? "text-[#FFE29A]"
            : isOneDay
              ? "text-[#9CCBFF]"
              : "text-[#8AF08F]"
        }`}
      >
        {title}
      </h3>

      <div
        className={`mx-auto mt-2 h-[2px] w-10 sm:mt-3 sm:w-14 ${
          isProfessional
            ? "bg-[#F7B548]"
            : isOneDay
              ? "bg-[#67A9FF]"
              : "bg-[#67D567]"
        }`}
      />

      <p className="mx-auto mt-3 max-w-sm text-[8px] font-semibold leading-4 text-white/95 sm:mt-3 sm:text-[12px] sm:leading-4 lg:text-[14px]">
        {description}
      </p>
    </article>
  );
}

function StationPin({
  course,
  active,
  left,
  top,
  onSelect,
  onHoverStart,
  onHoverEnd,
  labelSide,
}: {
  course: Course;
  active: boolean;
  left: number;
  top: number;
  onSelect: () => void;
  onHoverStart: () => void;
  onHoverEnd: () => void;
  labelSide:
    | "outside-left"
    | "outside-right";
}) {
  return (
    <button
      type="button"
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      onFocus={onHoverStart}
      onBlur={onHoverEnd}
      onClick={onSelect}
      className="group absolute z-20 -translate-x-1/2 -translate-y-1/2 focus:outline-none"
      style={{
        left: `${left}%`,
        top: `${top}%`,
      }}
      aria-label={course.title}
    >
      <span
        className={`
          relative block
          h-[60px] w-[50px]
          transition duration-200
          sm:h-[64px] sm:w-[52px]
          lg:h-[74px] lg:w-[62px]
          ${
            active
              ? "scale-110 drop-shadow-[0_0_12px_rgba(247,181,72,.9)]"
              : "drop-shadow-[0_8px_16px_rgba(0,0,0,.38)]"
          }
        `}
      >
        <svg
          viewBox="0 0 64 80"
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          <path
            d="M32 2C15.4 2 2 15.4 2 32c0 22 30 46 30 46s30-24 30-46C62 15.4 48.6 2 32 2Z"
            fill="white"
            stroke={active ? "#F7B548" : "#07152E"}
            strokeWidth="3"
          />
        </svg>

        <span className="absolute left-1/2 top-[10%] h-[55%] w-[70%] -translate-x-1/2 overflow-hidden rounded-full bg-white">
          <Image
            src={course.icon}
            alt=""
            fill
            sizes="48px"
            className="object-contain p-1"
          />
        </span>
      </span>

      <span
        className={`
          absolute top-[80%]
          -translate-y-1/2
          max-w-[118px]
          whitespace-normal
          text-[13px] font-black leading-[1.05]
          drop-shadow-[0_2px_6px_rgba(0,0,0,.9)]
          sm:max-w-[145px] sm:text-sm
          md:max-w-none md:whitespace-nowrap
          lg:text-[20px]
          ${
            labelSide === "outside-left"
              ? "right-[calc(100%+5px)] text-right md:left-auto md:right-[calc(100%+10px)] md:text-right"
              : "left-[calc(100%+5px)] text-left md:right-auto md:left-[calc(100%+10px)] md:text-left"
          }
          ${active ? "text-[#F7B548]" : "text-white"}
        `}
      >
        {course.title}
      </span>
    </button>
  );
}