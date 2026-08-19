"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Star,
} from "lucide-react";

import AuthLink from "@/components/AuthLink";

type Locale = "ar" | "en";

type LocalizedText = {
  ar: string;
  en: string;
};

type Course = {
  title: string;
  subtitle: LocalizedText;
  description: LocalizedText;
  image: string;
  href: string;
  category: LocalizedText;
  badge: LocalizedText;
};

const labels = {
  ar: {
    viewAll: "عرض جميع الرحلات",
    explore: "استكشف الرحلة",
    previous: "عرض الرحلات السابقة",
    next: "عرض الرحلات التالية",
    showCourse: "عرض رحلة",
  },
  en: {
    viewAll: "View All Journeys",
    explore: "Explore Journey",
    previous: "View previous journeys",
    next: "View next journeys",
    showCourse: "Show journey",
  },
} as const;

const courses: Course[] = [
  {
    title: "Civil Site Design",
    subtitle: {
      ar: "من الأساس إلى الاحتراف",
      en: "From Fundamentals to Professional Practice",
    },
    description: {
      ar: "رحلة عملية متكاملة لتصميم الطرق والتقاطعات وإدارة المشروع باستخدام Civil Site Design.",
      en: "A complete practical journey for road and intersection design and project management using Civil Site Design.",
    },
    image: "/images/courses/course-csd.jpg",
    href: "/course/civil-site-design",
    category: {
      ar: "تصميم الطرق",
      en: "Road Design",
    },
    badge: {
      ar: "الأكثر طلبًا",
      en: "Most Popular",
    },
  },
  {
    title: "Smart Project Deliverables",
    subtitle: {
      ar: "إخراج اللوحات بسرعة فائقة",
      en: "Faster Project Deliverables",
    },
    description: {
      ar: "تعلم منهجية احترافية لاستخراج اللوحات وتنظيم ملفات المشروع وتسليمها بسرعة ودقة.",
      en: "Learn a professional workflow for producing drawings, organizing project files, and delivering them quickly and accurately.",
    },
    image: "/images/courses/course-spd.jpg",
    href: "/course/smart-project-deliverables",
    category: {
      ar: "إخراج المشاريع",
      en: "Deliverables",
    },
    badge: {
      ar: "الأكثر تطبيقًا",
      en: "Most Practical",
    },
  },
  {
    title: "BIM for Roads",
    subtitle: {
      ar: "حوّل تصميمك إلى نموذج ثلاثي الأبعاد",
      en: "Turn Your Design into a 3D Model",
    },
    description: {
      ar: "أنشئ نموذج BIM متكاملًا للطرق يشمل العلامات المرورية والإنارة وعناصر الطريق المختلفة.",
      en: "Build a complete BIM road model including markings, lighting, and key road furniture elements.",
    },
    image: "/images/courses/course-bim.jpg",
    href: "/course/bim-roads",
    category: {
      ar: "BIM للطرق",
      en: "Road BIM",
    },
    badge: {
      ar: "الأحدث",
      en: "Newest",
    },
  },
  {
    title: "Vehicle Tracking",
    subtitle: {
      ar: "تحليل حركة المركبات",
      en: "Vehicle Movement Analysis",
    },
    description: {
      ar: "تعلم فحص مسارات المركبات وتصميم الدوارات والمواقف ومناطق الحركة بأمان وكفاءة.",
      en: "Learn swept-path analysis and the design of roundabouts, parking areas, and vehicle movement zones.",
    },
    image: "/images/courses/course-vt.jpg",
    href: "/course/vehicle-tracking",
    category: {
      ar: "تحليل الحركة",
      en: "Movement Analysis",
    },
    badge: {
      ar: "مهارة مطلوبة",
      en: "In-Demand Skill",
    },
  },
];

export default function PopularCourses() {
  const [startIndex, setStartIndex] = useState(0);
  const [locale, setLocale] = useState<Locale>("ar");
  const [visibleCount, setVisibleCount] = useState(2);

  useEffect(() => {
    const savedLocale = window.localStorage.getItem(
      "masar-locale"
    ) as Locale | null;

    if (savedLocale === "ar" || savedLocale === "en") {
      setLocale(savedLocale);
    }

    const handleLocaleChange = (event: Event) => {
      const customEvent = event as CustomEvent<{
        locale?: Locale;
      }>;

      const nextLocale = customEvent.detail?.locale;

      if (nextLocale === "ar" || nextLocale === "en") {
        setLocale(nextLocale);
      }
    };

    window.addEventListener(
      "masar:locale-change",
      handleLocaleChange
    );

    return () => {
      window.removeEventListener(
        "masar:locale-change",
        handleLocaleChange
      );
    };
  }, []);

  useEffect(() => {
    const updateVisibleCount = () => {
      setVisibleCount(window.innerWidth >= 1024 ? 3 : 2);
    };

    updateVisibleCount();

    window.addEventListener("resize", updateVisibleCount);

    return () => {
      window.removeEventListener("resize", updateVisibleCount);
    };
  }, []);

  const text = labels[locale];
  const isArabic = locale === "ar";
  const ExploreArrow = isArabic ? ArrowLeft : ArrowRight;

  const visibleCourses = Array.from(
    { length: visibleCount },
    (_, index) => courses[(startIndex + index) % courses.length]
  );

  const nextCourses = () => {
    setStartIndex(
      (current) => (current + 1) % courses.length
    );
  };

  const previousCourses = () => {
    setStartIndex(
      (current) =>
        (current - 1 + courses.length) % courses.length
    );
  };

  return (
    <section
      id="popular-courses"
      dir={isArabic ? "rtl" : "ltr"}
      className="w-full bg-[#F7F8FA] py-2 sm:py-2.5 lg:py-3"
    >
      <div className="mx-auto w-full max-w-[1580px] px-3 sm:px-4 md:px-5 lg:px-6">
        {/* Controls */}
        <div className="mb-2 flex items-center justify-between sm:mb-2.5 lg:mb-3">
          <AuthLink
            href="/career-path/road-design"
            className="group flex items-center gap-1.5 text-[11px] font-black text-[#07152E] transition hover:text-[#D49319] sm:text-[12px] lg:text-[13px]"
          >
            {text.viewAll}

            <ExploreArrow className="h-3.5 w-3.5 transition-transform duration-300 sm:h-4 sm:w-4" />
          </AuthLink>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={previousCourses}
              aria-label={text.previous}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[#DCE3EC] bg-white text-[#07152E] shadow-sm transition duration-300 hover:border-[#F7B548] hover:bg-[#F7B548] sm:h-9 sm:w-9"
            >
              {isArabic ? (
                <ChevronRight className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
              ) : (
                <ChevronLeft className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
              )}
            </button>

            <button
              type="button"
              onClick={nextCourses}
              aria-label={text.next}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[#DCE3EC] bg-white text-[#07152E] shadow-sm transition duration-300 hover:border-[#F7B548] hover:bg-[#F7B548] sm:h-9 sm:w-9"
            >
              {isArabic ? (
                <ChevronLeft className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
              ) : (
                <ChevronRight className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
              )}
            </button>
          </div>
        </div>

        {/* Cards: 2 on mobile/tablet, 3 on desktop */}
        <div
          className={`grid gap-2.5 sm:gap-3 lg:gap-3.5 ${
            visibleCount === 2
              ? "grid-cols-2"
              : "grid-cols-3"
          }`}
        >
          {visibleCourses.map((course, index) => (
            <article
              key={`${course.title}-${startIndex}-${index}`}
              className="group flex h-[270px] flex-col overflow-hidden rounded-[18px] border border-[#DCE3EC] bg-white shadow-[0_12px_30px_rgba(7,21,46,0.07)] transition-all duration-500 hover:-translate-y-1 hover:border-[#F7B548]/70 hover:shadow-[0_18px_40px_rgba(7,21,46,0.12)] sm:h-[280px] sm:rounded-[20px] lg:h-[292px] lg:rounded-[22px]"
            >
              {/* Larger image without increasing card height */}
              <div className="relative h-[132px] shrink-0 overflow-hidden bg-[#07152E] sm:h-[140px] lg:h-[150px]">
                <Image
                  src={course.image}
                  alt={course.title}
                  fill
                  sizes="(max-width: 1023px) 50vw, 33vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-[#07152E]/55 via-transparent to-black/10" />

                <span
                  className={`absolute top-2 rounded-full border border-white/25 bg-[#07152E]/75 px-2 py-1 text-[7.5px] font-black text-white backdrop-blur-md sm:px-2.5 sm:text-[8.5px] lg:text-[9.5px] ${
                    isArabic
                      ? "right-2 sm:right-2.5"
                      : "left-2 sm:left-2.5"
                  }`}
                >
                  {course.category[locale]}
                </span>

                <span
                  className={`absolute top-2 flex items-center gap-1 rounded-full bg-[#F7B548] px-2 py-1 text-[7.5px] font-black text-[#07152E] shadow-md sm:px-2.5 sm:text-[8.5px] lg:text-[9.5px] ${
                    isArabic
                      ? "left-2 sm:left-2.5"
                      : "right-2 sm:right-2.5"
                  }`}
                >
                  <Star
                    className="h-2.5 w-2.5 sm:h-3 sm:w-3"
                    fill="currentColor"
                  />
                  {course.badge[locale]}
                </span>
              </div>

              {/* Compact content */}
              <div
                className={`flex min-h-0 flex-1 flex-col px-2.5 pb-2.5 pt-2 sm:px-3 sm:pb-3 lg:px-4 ${
                  isArabic ? "text-right" : "text-left"
                }`}
              >
                <div className="min-h-0 flex-1">
                  <h3
                    className={`line-clamp-1 font-black leading-tight text-[#07152E] ${
                      isArabic
                        ? "text-[12px] sm:text-[14px] lg:text-[16px]"
                        : "text-[11px] sm:text-[13px] lg:text-[15px]"
                    }`}
                  >
                    {course.title}
                  </h3>

                  <p
                    className={`mt-0.5 line-clamp-1 font-black leading-snug text-[#D49319] ${
                      isArabic
                        ? "text-[8.5px] sm:text-[9.5px] lg:text-[10.5px]"
                        : "text-[7.5px] sm:text-[8.5px] lg:text-[9.5px]"
                    }`}
                  >
                    {course.subtitle[locale]}
                  </p>

                  <p
                    className={`mt-1 line-clamp-2 font-medium text-slate-600 ${
                      isArabic
                        ? "text-[7.8px] leading-[1.45] sm:text-[8.8px] lg:text-[9.8px]"
                        : "text-[7px] leading-[1.4] sm:text-[8px] lg:text-[9px]"
                    }`}
                  >
                    {course.description[locale]}
                  </p>
                </div>

                {/* Direct link to the course station */}
                <AuthLink
                  href={course.href}
                  className="mt-2 flex h-8 w-full shrink-0 items-center justify-center gap-1 rounded-lg bg-[#07152E] px-1.5 text-[8.5px] font-black text-white transition hover:bg-[#F7B548] hover:text-[#07152E] sm:h-9 sm:rounded-xl sm:text-[9.5px] lg:text-[11px]"
                >
                  {text.explore}

                  <ExploreArrow className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4" />
                </AuthLink>
              </div>
            </article>
          ))}
        </div>

        {/* Indicators */}
        <div className="mt-2.5 flex justify-center gap-1.5 sm:mt-3">
          {courses.map((course, index) => (
            <button
              key={course.title}
              type="button"
              onClick={() => setStartIndex(index)}
              aria-label={`${text.showCourse} ${course.title}`}
              className={`h-[5px] rounded-full transition-all duration-500 ${
                index === startIndex
                  ? "w-7 bg-[#F7B548]"
                  : "w-[5px] bg-slate-300 hover:bg-slate-400"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}