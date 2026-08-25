"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Play,
  Rocket,
  X,
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
        title: "CSD",
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
    { left: 84, top: 30 },
    { left: 83, top: 38.5 },
    { left: 84.2, top: 46 },
    { left: 80, top: 53 },
    { left: 72, top: 57 },
  ],
  traffic: [
    { left: 17, top: 30 },
    { left: 17.5, top: 38.5 },
    { left: 16.2, top: 46 },
    { left: 20.2, top: 53 },
    { left: 28, top: 57 },
  ],
};

const POPUP_TOP_PERCENT = 15;
const POPUP_HEIGHT_PERCENT = 48;

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

function getYoutubeEmbedUrl(videoId: string) {
  const params = new URLSearchParams({
    autoplay: "1",
    mute: "1",
    playsinline: "1",
    rel: "0",
    modestbranding: "1",
    enablejsapi: "1",
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

      const [
        { data: coursesData, error: coursesError },
        { data: promosData, error: promosError },
      ] = await Promise.all([
        supabase
          .from("courses")
          .select("id,title,title_ar,title_en,slug,course_code")
          .eq("is_active", true),
        supabase
          .from("landing_course_promos")
          .select(
            "course_id,video_source,youtube_url,youtube_video_id,is_active",
          )
          .eq("is_active", true)
          .eq("video_source", "youtube"),
      ]);

      if (coursesError) {
        console.error("Landing courses load error:", coursesError);
      }

      if (promosError) {
        console.error("Landing promos load error:", promosError);
      }

      if (!cancelled) {
        setDbCourses((coursesData ?? []) as DbCourse[]);
        setPromos((promosData ?? []) as PromoRow[]);
      }
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

  const selectedPromo = useMemo(() => {
    if (!selectedCourse) return null;

    const matchedDbCourse = dbCourses.find((dbCourse) =>
      courseMatchesDbCourse(selectedCourse, dbCourse),
    );

    if (!matchedDbCourse) return null;

    return (
      promos.find(
        (promo) =>
          promo.course_id === matchedDbCourse.id &&
          promo.is_active &&
          promo.video_source === "youtube" &&
          promo.youtube_video_id,
      ) ?? null
    );
  }, [selectedCourse, dbCourses, promos]);

  const selectCourse = (
    trackIndex: number,
    courseIndex: number,
  ) => {
    setSelected({
      trackIndex,
      courseIndex,
    });
  };

  const ArrowIcon =
    locale === "ar" ? ArrowLeft : ArrowRight;

  return (
    <main
      dir={locale === "ar" ? "rtl" : "ltr"}
      className="min-h-screen overflow-x-hidden bg-[#07152E] text-white"
    >
      <header className="relative z-50 border-b border-white/10 bg-[#07152E]/95">
        <div className="mx-auto flex min-h-[90px] max-w-[1500px] items-center justify-between gap-3 px-4 sm:px-7 lg:px-10">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-3"
            aria-label="Masar Makers"
          >
            <Image
              src="/images/logo/masar-makers-mark.png"
              alt="Masar Makers"
              width={78}
              height={58}
              priority
              className="h-[54px] w-auto object-contain sm:h-[78px]"
            />

            <div className="hidden md:block">
              <p className="text-[28px] font-black leading-none lg:text-[34px]">
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

              <p className="mt-1 text-[14px] font-bold tracking-[.18em] text-[#F7B548] lg:text-[16px]">
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
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-[#F7B548] px-3 text-[12px] font-black text-[#07152E] shadow-lg transition hover:-translate-y-0.5 sm:px-6 sm:text-[18px]"
            >
              {text.explore}
              <ArrowIcon className="h-5 w-5" />
            </Link>

            <a
              href="https://wa.me/201031885659?text=السلام عليكم، أرغب في الاستفسار عن منصة صناع المسار."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-[#25D366]/60 bg-[#0B502B]/60 px-3 text-[11px] font-black text-white transition hover:bg-[#25D366] sm:px-5 sm:text-[18px]"
            >
              <FaWhatsapp className="h-6 w-6 sm:h-7 sm:w-7" />
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
          min-h-[960px] w-full max-w-[2000px]
          overflow-hidden bg-[#07152E]
          bg-[url('/images/landing/learning-roads-bg.png')]
          bg-[length:100%_100%]
          bg-center bg-no-repeat
          sm:min-h-[800px]
          lg:min-h-[850px]
          xl:min-h-[950px]
        "
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#07152E]/58 via-[#07152E]/5 to-[#07152E]/30" />

        <div className="relative z-20 mx-auto max-w-[1450px] px-2 pt-7 text-center sm:px-4 sm:pt-5 lg:pt-6">
          <h1 className="mx-auto whitespace-nowrap text-[clamp(18px,4vw,50px)] font-black leading-[1.2]">
            <span>{text.heroBefore}</span>{" "}
            <span className="text-[#F7B548]">
              {text.heroAfter}
            </span>
          </h1>

          <p className="mx-auto mt-3 max-w-3xl text-[10px] font-semibold leading-5 text-slate-200 sm:text-[14px] md:text-[18px] lg:text-[20px]">
            {text.heroSubtitle}
          </p>
        </div>

        <div className="absolute left-[3%] top-[20%] z-20 text-center text-[#F7B548] sm:left-[7%] lg:left-[13%]">
          <p className="text-[13px] font-black sm:text-xl lg:text-3xl">
            {tracks[1].title[locale]}
          </p>
          <div className="mx-auto mt-2 h-0.5 w-[clamp(55px,7vw,120px)] bg-[#F7B548]" />
        </div>

        <div className="absolute right-[3%] top-[20%] z-20 text-center text-[#F7B548] sm:right-[7%] lg:right-[10%]">
          <p className="text-[13px] font-black sm:text-xl lg:text-3xl">
            {tracks[0].title[locale]}
          </p>
          <div className="mx-auto mt-2 h-0.5 w-[clamp(55px,7vw,120px)] bg-[#F7B548]" />
        </div>

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
              onSelect={() => selectCourse(1, courseIndex)}
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
              onSelect={() => selectCourse(0, courseIndex)}
              labelSide="outside-right"
            />
          );
        })}

        {selected && selectedCourse && (
          <CourseScreen
            key={`${selected.trackIndex}-${selected.courseIndex}-${selectedPromo?.youtube_video_id ?? "no-video"}`}
            locale={locale}
            selected={selected}
            course={selectedCourse}
            trackTitle={
              tracks[selected.trackIndex].title[locale]
            }
            youtubeVideoId={
              selectedPromo?.youtube_video_id ?? null
            }
            onClose={() => setSelected(null)}
          />
        )}

        <div className="absolute left-1/2 top-[61%] z-20 -translate-x-1/2 text-center">
          <div
            className="
              relative whitespace-nowrap
              px-8 py-4
              text-[14px] font-black
              text-white
              sm:text-2xl
              lg:text-[42px]
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
                bg-[radial-gradient(ellipse,rgba(247,181,72,.42)_0%,rgba(247,181,72,.20)_40%,rgba(247,181,72,.06)_68%,transparent_78%)]
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
            absolute inset-x-[4%] bottom-[3%] z-20
            grid grid-cols-3
            gap-2 sm:gap-5 lg:gap-40
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

      <section className="border-t border-white/10 bg-[#061329] px-4 py-6 text-center sm:py-7">
        <p className="text-[12px] font-black sm:text-2xl lg:text-3xl">
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

function CourseScreen({
  locale,
  selected,
  course,
  trackTitle,
  youtubeVideoId,
  onClose,
}: {
  locale: Locale;
  selected: NonNullable<SelectedCourse>;
  course: Course;
  trackTitle: string;
  youtubeVideoId: string | null;
  onClose: () => void;
}) {
  const text = pageText[locale];

  const stationPositions =
    selected.trackIndex === 0
      ? roadStations.road
      : roadStations.traffic;

  const visualIndex =
    tracks[selected.trackIndex].courses.length -
    1 -
    selected.courseIndex;

  const stationTop =
    stationPositions[visualIndex].top;

  const arrowTop = Math.max(
    7,
    Math.min(
      93,
      ((stationTop - POPUP_TOP_PERCENT) /
        POPUP_HEIGHT_PERCENT) *
        100,
    ),
  );

  const pointsLeft =
    selected.trackIndex === 1;

  return (
    <div
      className="
        absolute left-1/2 top-[15%] z-30
        h-[48%] min-h-[280px]
        w-[86%] max-w-[700px]
        -translate-x-1/2
        overflow-visible
        rounded-[20px]
        border border-[#F7B548]/55
        bg-white/96
        p-2 text-[#07152E]
        shadow-[0_22px_70px_rgba(0,0,0,.42)]
        backdrop-blur-xl
        sm:w-[70%]
        md:w-[56%]
        lg:w-[41.5%]
        lg:rounded-[28px]
      "
    >
      <span
        className="absolute z-[-1] h-0 w-0 transition-[top] duration-200"
        style={{
          top: `${arrowTop}%`,
          transform: "translateY(-50%)",
          ...(pointsLeft
            ? {
                left: "-28px",
                borderTop: "18px solid transparent",
                borderBottom: "18px solid transparent",
                borderRight:
                  "29px solid rgba(255,255,255,.96)",
              }
            : {
                right: "-28px",
                borderTop: "18px solid transparent",
                borderBottom: "18px solid transparent",
                borderLeft:
                  "29px solid rgba(255,255,255,.96)",
              }),
        }}
        aria-hidden="true"
      />

      <button
        type="button"
        onClick={onClose}
        className="absolute left-3 top-3 z-30 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-600 shadow-sm transition hover:bg-white"
        aria-label={text.closeDetails}
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex h-full min-h-0 flex-col gap-3">
        <div
          className={`flex shrink-0 items-center gap-3 px-9 py-0 ${
            locale === "ar" ? "text-right" : "text-left"
          }`}
        >
          <div className="relative h-11 w-11 shrink-0 rounded-xl bg-slate-50 sm:h-15 sm:w-15">
            <Image
              src={course.icon}
              alt={course.title}
              fill
              sizes="48px"
              className="object-contain p-1"
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <p className="shrink-0 text-[9px] font-black text-[#B87908] sm:text-[10px] lg:text-[11px]">
                {trackTitle}
              </p>

              <h2 className="min-w-0 break-words text-[clamp(14px,1.4vw,24px)] font-black leading-[1.1]">
                {course.title}
              </h2>
            </div>

            <p className="mt-1 line-clamp-2 text-[9px] font-semibold leading-4 text-slate-600 sm:text-[11px] lg:text-[12px]">
              {course.description[locale]}
            </p>
          </div>
        </div>

        <div className="relative min-h-0 flex-1 overflow-hidden rounded-[18px] bg-black">
          {youtubeVideoId ? (
            <iframe
              key={youtubeVideoId}
              src={getYoutubeEmbedUrl(youtubeVideoId)}
              title={`${course.title} promo`}
              className="h-full w-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <div className="flex h-full items-center justify-center p-5 text-center text-white">
              <div>
                <Play className="mx-auto h-10 w-10 text-[#F7B548]" />
                <p className="mt-3 text-xs font-bold sm:text-sm">
                  {text.videoUnavailable}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
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
        min-h-[140px]
        rounded-[18px] border
        px-2 pb-3 pt-8 text-center
        backdrop-blur-md
        sm:min-h-[180px]
        sm:rounded-[24px]
        sm:px-5 sm:pb-5 sm:pt-11
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
          sm:h-[68px] sm:w-[68px]
          ${iconClasses}
        `}
      >
        {isProfessional && (
          <CalendarDays className="h-5 w-5 sm:h-8 sm:w-8" />
        )}

        {isOneDay && (
          <Rocket className="h-5 w-5 sm:h-8 sm:w-8" />
        )}

        {!isProfessional && !isOneDay && (
          <Play className="h-5 w-5 fill-current sm:h-8 sm:w-8" />
        )}
      </div>

      <h3
        className={`text-[16px] font-black leading-tight sm:text-xl ${
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

      <p className="mx-auto mt-3 max-w-sm text-[8px] font-semibold leading-4 text-white/95 sm:mt-6 sm:text-[14px] sm:leading-8 lg:text-[18px]">
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
  labelSide,
}: {
  course: Course;
  active: boolean;
  left: number;
  top: number;
  onSelect: () => void;
  labelSide:
    | "outside-left"
    | "outside-right";
}) {
  return (
    <button
      type="button"
      onMouseEnter={onSelect}
      onFocus={onSelect}
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
          h-[46px] w-[38px]
          transition duration-200
          sm:h-[64px] sm:w-[52px]
          lg:h-[70px] lg:w-[60px]
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
          absolute top-[42%]
          -translate-y-1/2
          whitespace-nowrap
          text-[8px] font-black
          drop-shadow-[0_2px_6px_rgba(0,0,0,.9)]
          sm:text-xs
          lg:text-[18px]
          ${
            labelSide === "outside-left"
              ? "right-[calc(100%+7px)]"
              : "left-[calc(100%+7px)]"
          }
          ${active ? "text-[#F7B548]" : "text-white"}
        `}
      >
        {course.title}
      </span>
    </button>
  );
}