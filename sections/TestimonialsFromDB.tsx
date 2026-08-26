"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Quote,
  Star,
} from "lucide-react";

type Locale = "ar" | "en";

type CourseId =
  | "all"
  | "civil3d"
  | "csd"
  | "spd"
  | "vehicle-tracking"
  | "bim-roads";

type ApiTestimonial = {
  id: string;
  studentName: string;
  jobTitle: string | null;
  country: string | null;
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  rating: number;
  review: string;
  initials: string;
};

type Testimonial = {
  id: string;
  name: string;
  role: string;
  country: string;
  courseId: Exclude<CourseId, "all"> | string;
  course: string;
  rating: number;
  review: string;
  initials: string;
};

const labels = {
  ar: {
    all: "الكل",
    previous: "الرأي السابق",
    next: "الرأي التالي",
    loadingError: "تعذر تحميل آراء المتدربين حاليًا.",
    empty: "لا توجد آراء معتمدة لهذا الكورس حتى الآن.",
    trainee: "متدرب في صناع المسار",
    unknownCountry: "غير محدد",
    journey: "رحلة تدريبية",
    showReview: "عرض رأي",
  },
  en: {
    all: "All",
    previous: "Previous testimonial",
    next: "Next testimonial",
    loadingError: "Unable to load trainee testimonials right now.",
    empty: "No approved testimonials are available for this course yet.",
    trainee: "Masar Makers Trainee",
    unknownCountry: "Not specified",
    journey: "Learning Journey",
    showReview: "Show testimonial",
  },
} as const;

const filters: { id: CourseId; ar: string; en: string }[] = [
  { id: "all", ar: "الكل", en: "All" },
  { id: "civil3d", ar: "Civil 3D", en: "Civil 3D" },
  { id: "csd", ar: "CSD", en: "CSD" },
  { id: "spd", ar: "Smart Deliverables", en: "Smart Deliverables" },
  {
    id: "vehicle-tracking",
    ar: "Vehicle Tracking",
    en: "Vehicle Tracking",
  },
  { id: "bim-roads", ar: "BIM for Roads", en: "BIM for Roads" },
];

function normalizeCourseId(
  courseSlug: string,
  courseTitle: string,
): string {
  const slug = courseSlug.toLowerCase();
  const title = courseTitle.toLowerCase();

  if (
    slug.includes("civil-3d") ||
    slug.includes("civil3d") ||
    title.includes("civil 3d")
  ) {
    return "civil3d";
  }

  if (
    slug.includes("csd") ||
    slug.includes("civil-site-design") ||
    title.includes("civil site design") ||
    title.includes("csd")
  ) {
    return "csd";
  }

  if (
    slug.includes("smart-project-deliverables") ||
    slug.includes("smart-deliverables") ||
    slug.includes("spd") ||
    title.includes("smart project deliverables") ||
    title.includes("smart deliverables")
  ) {
    return "spd";
  }

  if (
    slug.includes("vehicle-tracking") ||
    title.includes("vehicle tracking")
  ) {
    return "vehicle-tracking";
  }

  if (
    slug.includes("bim-roads") ||
    slug.includes("bim-for-roads") ||
    title.includes("bim for roads") ||
    title.includes("bim roads")
  ) {
    return "bim-roads";
  }

  return courseSlug;
}


function getInitialLetters(
  initials: string,
  name: string,
  locale: Locale,
) {
  const cleanName = name?.trim() ?? "";

  /*
   * نأخذ الحروف من الاسم نفسه دائمًا حتى نحافظ
   * على ترتيب الاسم الصحيح:
   *
   * ناصر علي     => ن ع
   * Nasser Ali   => N A
   */

  if (cleanName) {
    const nameParts = cleanName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2);

    const letters = nameParts
      .map((part) => part[0] ?? "")
      .filter(Boolean);

    const hasArabic = /[\u0600-\u06FF]/.test(
      cleanName,
    );

    if (hasArabic) {
      return letters;
    }

    return letters.map((letter) =>
      letter.toUpperCase(),
    );
  }

  /*
   * fallback فقط إذا لم يوجد اسم.
   */
  const fallbackLetters = Array.from(
    (initials ?? "").replace(/\s+/g, ""),
  )
    .filter(Boolean)
    .slice(0, 2);

  return locale === "en"
    ? fallbackLetters.map((letter) =>
        letter.toUpperCase(),
      )
    : fallbackLetters;
}

export default function TestimonialsFromDB() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [activeCourse, setActiveCourse] = useState<CourseId>("all");
  const [startIndex, setStartIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(2);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [locale, setLocale] = useState<Locale>("ar");

  useEffect(() => {
    const savedLocale = window.localStorage.getItem(
      "masar-locale",
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
    const updateVisibleCount = () => {
      setVisibleCount(window.innerWidth >= 1024 ? 3 : 2);
    };

    updateVisibleCount();
    window.addEventListener("resize", updateVisibleCount);

    return () => {
      window.removeEventListener("resize", updateVisibleCount);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadTestimonials = async () => {
      try {
        setIsLoading(true);
        setHasError(false);

        const response = await fetch("/api/testimonials", {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to load testimonials.");
        }

        const data =
          (await response.json()) as ApiTestimonial[];

        if (!isMounted) return;

        const formattedTestimonials =
          data.map((testimonial) => ({
            id: testimonial.id,
            name:
              testimonial.studentName ||
              labels.ar.trainee,
            role:
              testimonial.jobTitle ||
              labels.ar.trainee,
            country:
              testimonial.country ||
              labels.ar.unknownCountry,
            courseId: normalizeCourseId(
              testimonial.courseSlug || "",
              testimonial.courseTitle || "",
            ),
            course:
              testimonial.courseTitle ||
              labels.ar.journey,
            rating: Math.max(
              0,
              Math.min(
                5,
                Number(testimonial.rating) || 0,
              ),
            ),
            review: testimonial.review || "",
            initials:
              testimonial.initials ||
              testimonial.studentName
                ?.split(" ")
                .slice(0, 2)
                .map((part) => part[0])
                .join("") ||
              "م",
          }));

        setTestimonials(formattedTestimonials);
      } catch (error) {
        console.error(error);

        if (isMounted) {
          setHasError(true);
          setTestimonials([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadTestimonials();

    return () => {
      isMounted = false;
    };
  }, []);

  const text = labels[locale];
  const isArabic = locale === "ar";

  const filteredTestimonials = useMemo(() => {
    if (activeCourse === "all") {
      return testimonials;
    }

    return testimonials.filter(
      (testimonial) =>
        testimonial.courseId === activeCourse,
    );
  }, [activeCourse, testimonials]);

  const visibleTestimonials = useMemo(() => {
    if (filteredTestimonials.length === 0) {
      return [];
    }

    const count = Math.min(
      visibleCount,
      filteredTestimonials.length,
    );

    return Array.from(
      { length: count },
      (_, index) =>
        filteredTestimonials[
          (startIndex + index) %
            filteredTestimonials.length
        ],
    );
  }, [
    filteredTestimonials,
    startIndex,
    visibleCount,
  ]);

  const next = () => {
    if (filteredTestimonials.length <= 1) return;

    setStartIndex(
      (current) =>
        (current + 1) %
        filteredTestimonials.length,
    );
  };

  const previous = () => {
    if (filteredTestimonials.length <= 1) return;

    setStartIndex(
      (current) =>
        (current -
          1 +
          filteredTestimonials.length) %
        filteredTestimonials.length,
    );
  };

  const changeFilter = (courseId: CourseId) => {
    setActiveCourse(courseId);
    setStartIndex(0);
  };

  return (
    <section
      id="testimonials"
      dir={isArabic ? "rtl" : "ltr"}
      className="w-full bg-[#F7F8FA] py-2 sm:py-2.5 lg:py-3"
    >
      <div className="mx-auto w-full max-w-[1580px] px-3 sm:px-4 md:px-5 lg:px-6">
        {/* Filters and controls */}
        <div className="mb-2 flex items-center justify-between gap-2 sm:mb-2.5 lg:mb-3">
          <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-2">
            {filters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() =>
                  changeFilter(filter.id)
                }
                className={`shrink-0 rounded-full px-2.5 py-1.5 text-[9px] font-black transition duration-300 sm:px-3 sm:text-[10px] lg:px-3.5 lg:text-[11px] ${
                  activeCourse === filter.id
                    ? "bg-[#07152E] text-white shadow-md"
                    : "border border-[#DCE3EC] bg-white text-slate-600 hover:border-[#F7B548] hover:text-[#07152E]"
                }`}
              >
                {isArabic
                  ? filter.ar
                  : filter.en}
              </button>
            ))}
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={previous}
              aria-label={text.previous}
              disabled={
                filteredTestimonials.length <= 1 ||
                isLoading
              }
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[#DCE3EC] bg-white text-[#07152E] shadow-sm transition duration-300 hover:border-[#F7B548] hover:bg-[#F7B548] disabled:cursor-not-allowed disabled:opacity-40 sm:h-9 sm:w-9"
            >
              {isArabic ? (
                <ChevronRight className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
              ) : (
                <ChevronLeft className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
              )}
            </button>

            <button
              type="button"
              onClick={next}
              aria-label={text.next}
              disabled={
                filteredTestimonials.length <= 1 ||
                isLoading
              }
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[#DCE3EC] bg-white text-[#07152E] shadow-sm transition duration-300 hover:border-[#F7B548] hover:bg-[#F7B548] disabled:cursor-not-allowed disabled:opacity-40 sm:h-9 sm:w-9"
            >
              {isArabic ? (
                <ChevronLeft className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
              ) : (
                <ChevronRight className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
              )}
            </button>
          </div>
        </div>

        {/* Loading */}
        {isLoading ? (
          <div
            className={`grid gap-2.5 sm:gap-3 lg:gap-3.5 ${
              visibleCount === 3
                ? "grid-cols-3"
                : "grid-cols-2"
            }`}
          >
            {Array.from({
              length: visibleCount,
            }).map((_, index) => (
              <div
                key={index}
                className="h-[190px] animate-pulse rounded-[18px] border border-[#DCE3EC] bg-white sm:h-[200px] sm:rounded-[20px] lg:h-[210px]"
              />
            ))}
          </div>
        ) : hasError ? (
          <div className="flex h-[190px] items-center justify-center rounded-[20px] border border-dashed border-[#DCE3EC] bg-white sm:h-[200px]">
            <p className="px-4 text-center text-[10px] font-bold text-slate-500 sm:text-[11px] lg:text-[12px]">
              {text.loadingError}
            </p>
          </div>
        ) : visibleTestimonials.length > 0 ? (
          <div
            className={`mx-auto grid gap-2.5 sm:gap-3 lg:gap-3.5 ${
              visibleTestimonials.length === 1
                ? "max-w-[430px] grid-cols-1"
                : visibleTestimonials.length === 2
                  ? "max-w-[900px] grid-cols-2"
                  : "grid-cols-3"
            }`}
          >
            {visibleTestimonials.map(
              (testimonial, index) => (
                <article
                  key={`${testimonial.id}-${activeCourse}-${startIndex}-${index}`}
                  className="group relative flex h-[190px] flex-col overflow-hidden rounded-[18px] border border-[#DCE3EC] bg-white p-3 shadow-[0_12px_30px_rgba(7,21,46,0.06)] transition-all duration-500 hover:-translate-y-1 hover:border-[#F7B548]/65 hover:shadow-[0_18px_40px_rgba(7,21,46,0.11)] sm:h-[200px] sm:rounded-[20px] sm:p-3.5 lg:h-[210px] lg:p-4"
                >
                  <Quote
                    className={`pointer-events-none absolute -top-2 h-12 w-12 text-[#F7B548]/10 transition duration-500 group-hover:text-[#F7B548]/20 ${
                      isArabic
                        ? "-left-2 rotate-180"
                        : "-right-2"
                    }`}
                    fill="currentColor"
                  />

                  <div className="relative z-10 flex items-start justify-between gap-2">
                    <span className="max-w-[62%] truncate rounded-full bg-[#FFF7E3] px-2.5 py-1 text-[8px] font-black text-[#C88712] sm:text-[11px] lg:text-[12px]">
                      {testimonial.course}
                    </span>

                    <div className="flex shrink-0 gap-0.5">
                      {Array.from({
                        length: 5,
                      }).map((_, starIndex) => {
                        const isFilled =
                          starIndex <
                          testimonial.rating;

                        return (
                          <Star
                            key={starIndex}
                            fill={
                              isFilled
                                ? "currentColor"
                                : "none"
                            }
                            className={
                              isFilled
                                ? "h-3 w-3 text-[#F7B548] sm:h-3.5 sm:w-3.5"
                                : "h-3 w-3 text-slate-300 sm:h-3.5 sm:w-3.5"
                            }
                          />
                        );
                      })}
                    </div>
                  </div>

                  <blockquote
                    className={`relative z-10 mt-2.5 flex-1 overflow-hidden line-clamp-4 font-medium text-slate-600 ${
                      isArabic
                        ? "text-[9.5px] leading-[1.65] sm:text-[14px] lg:text-[16px]"
                        : "text-[8.8px] leading-[1.55] sm:text-[14px] lg:text-[16px]"
                    }`}
                  >
                    “{testimonial.review}”
                  </blockquote>

                  <div className="relative z-10 mt-2.5 flex items-center gap-2.5 border-t border-[#E9EDF3] pt-2.5">
                    <div
  dir={
    /[\u0600-\u06FF]/.test(testimonial.name)
      ? "rtl"
      : "ltr"
  }
  className="flex h-9 min-w-9 shrink-0 items-center justify-center gap-1 rounded-xl bg-[#07152E] px-2 text-[10px] font-black text-[#F7B548] shadow-md sm:h-10 sm:min-w-10 sm:text-[11px]"
>
                      {getInitialLetters(
                        testimonial.initials,
                        testimonial.name,
                        locale,
                      ).map((letter, letterIndex) => (
                        <span
                          key={`${testimonial.id}-initial-${letterIndex}`}
                          className="inline-block leading-none"
                        >
                          {letter}
                        </span>
                      ))}
                    </div>

                    <div
                      className={`min-w-0 ${
                        isArabic
                          ? "text-right"
                          : "text-left"
                      }`}
                    >
                      <h3 className="truncate text-[10.5px] font-black text-[#07152E] sm:text-[11.5px] lg:text-[12px]">
                        {testimonial.name}
                      </h3>

                      <p className="mt-0.5 truncate text-[8px] font-bold text-slate-500 sm:text-[8.5px] lg:text-[9px]">
                        {testimonial.role}
                        {testimonial.country
                          ? ` · ${testimonial.country}`
                          : ""}
                      </p>
                    </div>
                  </div>
                </article>
              ),
            )}
          </div>
        ) : (
          <div className="flex h-[190px] items-center justify-center rounded-[20px] border border-dashed border-[#DCE3EC] bg-white sm:h-[200px]">
            <p className="px-4 text-center text-[10px] font-bold text-slate-500 sm:text-[11px] lg:text-[12px]">
              {text.empty}
            </p>
          </div>
        )}

        {/* Indicators */}
        {!isLoading &&
          filteredTestimonials.length > 1 && (
            <div className="mt-2.5 flex justify-center gap-1.5 sm:mt-3">
              {filteredTestimonials.map(
                (testimonial, index) => (
                  <button
                    key={testimonial.id}
                    type="button"
                    onClick={() =>
                      setStartIndex(index)
                    }
                    aria-label={`${text.showReview} ${testimonial.name}`}
                    className={`h-[5px] rounded-full transition-all duration-500 ${
                      index === startIndex
                        ? "w-7 bg-[#F7B548]"
                        : "w-[5px] bg-slate-300 hover:bg-slate-400"
                    }`}
                  />
                ),
              )}
            </div>
          )}
      </div>
    </section>
  );
}