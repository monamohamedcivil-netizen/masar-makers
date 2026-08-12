"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Quote,
  Star,
} from "lucide-react";

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

const filters: { id: CourseId; label: string }[] = [
  { id: "all", label: "الكل" },
  { id: "civil3d", label: "Civil 3D" },
  { id: "csd", label: "CSD" },
  { id: "spd", label: "Smart Deliverables" },
  {
    id: "vehicle-tracking",
    label: "Vehicle Tracking",
  },
  { id: "bim-roads", label: "BIM for Roads" },
];

function normalizeCourseId(
  courseSlug: string,
  courseTitle: string
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

export default function TestimonialsFromDB() {
  const [testimonials, setTestimonials] = useState<
    Testimonial[]
  >([]);

  const [activeCourse, setActiveCourse] =
    useState<CourseId>("all");

  const [startIndex, setStartIndex] = useState(0);

  const [isLoading, setIsLoading] = useState(true);

  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadTestimonials = async () => {
      try {
        setIsLoading(true);
        setHasError(false);

        const response = await fetch(
          "/api/testimonials",
          {
            method: "GET",
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            "Failed to load testimonials."
          );
        }

        const data =
          (await response.json()) as ApiTestimonial[];

        if (!isMounted) return;

        const formattedTestimonials =
          data.map((testimonial) => ({
            id: testimonial.id,

            name:
              testimonial.studentName ||
              "متدرب في صناع المسار",

            role:
  testimonial.jobTitle ||
  "متدرب في صناع المسار",

            country:
              testimonial.country || "غير محدد",

            courseId: normalizeCourseId(
              testimonial.courseSlug || "",
              testimonial.courseTitle || ""
            ),

            course:
              testimonial.courseTitle ||
              "رحلة تدريبية",

            rating: Math.max(
              0,
              Math.min(
                5,
                Number(testimonial.rating) || 0
              )
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

    loadTestimonials();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredTestimonials = useMemo(() => {
    if (activeCourse === "all") {
      return testimonials;
    }

    return testimonials.filter(
      (testimonial) =>
        testimonial.courseId === activeCourse
    );
  }, [activeCourse, testimonials]);

  const visibleTestimonials = useMemo(() => {
    if (filteredTestimonials.length === 0) {
      return [];
    }

    const visibleCount = Math.min(
      3,
      filteredTestimonials.length
    );

    return Array.from(
      { length: visibleCount },
      (_, index) =>
        filteredTestimonials[
          (startIndex + index) %
            filteredTestimonials.length
        ]
    );
  }, [filteredTestimonials, startIndex]);

  const next = () => {
    if (filteredTestimonials.length <= 1) return;

    setStartIndex(
      (current) =>
        (current + 1) %
        filteredTestimonials.length
    );
  };

  const previous = () => {
    if (filteredTestimonials.length <= 1) return;

    setStartIndex(
      (current) =>
        (current -
          1 +
          filteredTestimonials.length) %
        filteredTestimonials.length
    );
  };

  const changeFilter = (courseId: CourseId) => {
    setActiveCourse(courseId);
    setStartIndex(0);
  };

  return (
    <section
      id="testimonials"
      dir="rtl"
      className="w-full bg-[#F7F8FA] px-6 py-4"
    >
      <div className="mx-auto max-w-[1580px]">
        {/* Filters and controls */}

        <div className="mb-4 flex items-center justify-between gap-5">
          <div className="flex flex-wrap items-center gap-2">
            {filters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() =>
                  changeFilter(filter.id)
                }
                className={`rounded-full px-4 py-2 text-[12px] font-black transition duration-300 ${
                  activeCourse === filter.id
                    ? "bg-[#07152E] text-white shadow-md"
                    : "border border-[#DCE3EC] bg-white text-slate-600 hover:border-[#F7B548] hover:text-[#07152E]"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={previous}
              aria-label="الرأي السابق"
              disabled={
                filteredTestimonials.length <= 1 ||
                isLoading
              }
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#DCE3EC] bg-white text-[#07152E] shadow-sm transition duration-300 hover:border-[#F7B548] hover:bg-[#F7B548] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight size={20} />
            </button>

            <button
              type="button"
              onClick={next}
              aria-label="الرأي التالي"
              disabled={
                filteredTestimonials.length <= 1 ||
                isLoading
              }
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#DCE3EC] bg-white text-[#07152E] shadow-sm transition duration-300 hover:border-[#F7B548] hover:bg-[#F7B548] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={20} />
            </button>
          </div>
        </div>

        {/* Loading */}

        {isLoading ? (
          <div className="grid gap-5 lg:grid-cols-3">
            {Array.from({ length: 3 }).map(
              (_, index) => (
                <div
                  key={index}
                  className="h-[250px] animate-pulse rounded-[28px] border border-[#DCE3EC] bg-white"
                />
              )
            )}
          </div>
        ) : hasError ? (
          <div className="flex h-[320px] items-center justify-center rounded-[28px] border border-dashed border-[#DCE3EC] bg-white">
            <p className="text-[14px] font-bold text-slate-500">
              تعذر تحميل آراء المتدربين حاليًا.
            </p>
          </div>
        ) : visibleTestimonials.length > 0 ? (
          <div className="grid gap-5 lg:grid-cols-3">
            {visibleTestimonials.map(
              (testimonial, index) => (
                <article
                  key={`${testimonial.id}-${activeCourse}-${startIndex}-${index}`}
                  className="
                    group relative flex h-[250px] flex-col overflow-hidden
                    rounded-[28px] border border-[#DCE3EC] bg-white p-6
                    shadow-[0_14px_36px_rgba(7,21,46,0.06)]
                    transition-all duration-500
                    hover:-translate-y-1.5
                    hover:border-[#F7B548]/65
                    hover:shadow-[0_22px_50px_rgba(7,21,46,0.11)]
                  "
                >
                  <Quote
                    size={72}
                    className="pointer-events-none absolute -left-3 -top-3 rotate-180 text-[#F7B548]/10 transition duration-500 group-hover:text-[#F7B548]/20"
                    fill="currentColor"
                  />

                  <div className="relative z-10 flex items-start justify-between">
                    <span className="rounded-full bg-[#FFF7E3] px-3 py-1.5 text-[11px] font-black text-[#C88712]">
                      {testimonial.course}
                    </span>

                    <div className="flex gap-1">
                      {Array.from({
                        length: 5,
                      }).map((_, starIndex) => {
                        const isFilled =
                          starIndex <
                          testimonial.rating;

                        return (
                          <Star
                            key={starIndex}
                            size={15}
                            fill={
                              isFilled
                                ? "currentColor"
                                : "none"
                            }
                            className={
                              isFilled
                                ? "text-[#F7B548]"
                                : "text-slate-300"
                            }
                          />
                        );
                      })}
                    </div>
                  </div>

                  <blockquote className="relative z-10 mt-5 flex-1 overflow-hidden text-[14px] font-medium leading-7 text-slate-600">
                    “{testimonial.review}”
                  </blockquote>

                  <div className="relative z-10 mt-5 flex items-center gap-3 border-t border-[#E9EDF3] pt-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#07152E] text-[14px] font-black text-[#F7B548] shadow-md">
                      {testimonial.initials}
                    </div>

                    <div className="text-right">
                      <h3 className="text-[15px] font-black text-[#07152E]">
                        {testimonial.name}
                      </h3>

                      <p className="mt-0.5 text-[11px] font-bold text-slate-500">
                        {testimonial.role} ·{" "}
                        {testimonial.country}
                      </p>
                    </div>
                  </div>
                </article>
              )
            )}
          </div>
        ) : (
          <div className="flex h-[320px] items-center justify-center rounded-[28px] border border-dashed border-[#DCE3EC] bg-white">
            <p className="text-[14px] font-bold text-slate-500">
              لا توجد آراء معتمدة لهذا الكورس حتى الآن.
            </p>
          </div>
        )}

        {/* Indicators */}

        {!isLoading &&
          filteredTestimonials.length > 1 && (
            <div className="mt-4 flex justify-center gap-2">
              {filteredTestimonials.map(
                (testimonial, index) => (
                  <button
                    key={testimonial.id}
                    type="button"
                    onClick={() =>
                      setStartIndex(index)
                    }
                    aria-label={`عرض رأي ${testimonial.name}`}
                    className={`h-[6px] rounded-full transition-all duration-500 ${
                      index === startIndex
                        ? "w-9 bg-[#F7B548]"
                        : "w-[6px] bg-slate-300 hover:bg-slate-400"
                    }`}
                  />
                )
              )}
            </div>
          )}
      </div>
    </section>
  );
}