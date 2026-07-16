"use client";

import { useMemo, useState } from "react";
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

type Testimonial = {
  id: number;
  name: string;
  role: string;
  country: string;
  courseId: Exclude<CourseId, "all">;
  course: string;
  rating: number;
  review: string;
  initials: string;
  approved: boolean;
  featured: boolean;
};

const filters: { id: CourseId; label: string }[] = [
  { id: "all", label: "الكل" },
  { id: "civil3d", label: "Civil 3D" },
  { id: "csd", label: "CSD" },
  { id: "spd", label: "Smart Deliverables" },
  { id: "vehicle-tracking", label: "Vehicle Tracking" },
  { id: "bim-roads", label: "BIM for Roads" },
];

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "م. أحمد محمد",
    role: "مهندس تصميم طرق",
    country: "السعودية",
    courseId: "csd",
    course: "Civil Site Design",
    rating: 5,
    review:
      "الكورس غيّر طريقة تفكيري في إدارة التصميم بالكامل. لم يكن مجرد شرح أوامر، بل منهجية واضحة ساعدتني على تطبيق البرنامج في مشروع حقيقي داخل الشركة.",
    initials: "أم",
    approved: true,
    featured: true,
  },
  {
    id: 2,
    name: "م. ناصر علي",
    role: "مهندس بنية تحتية",
    country: "الإمارات",
    courseId: "bim-roads",
    course: "BIM for Roads",
    rating: 5,
    review:
      "تمكنت بعد الرحلة من تحويل مشروع الطرق إلى نموذج ثلاثي الأبعاد متكامل وإظهار العلامات المرورية والإنارة بصورة احترافية أمام فريق المشروع.",
    initials: "نع",
    approved: true,
    featured: true,
  },
  {
    id: 3,
    name: "م. شوقي عبدو",
    role: "مهندس طرق",
    country: "مصر",
    courseId: "spd",
    course: "Smart Project Deliverables",
    rating: 5,
    review:
      "تعلمت طريقة منظمة وسريعة لاستخراج اللوحات، وتمكنت من إنتاج عدد كبير من الملفات بدون تكرار الخطوات اليدوية التي كانت تستهلك وقتًا طويلًا.",
    initials: "شع",
    approved: true,
    featured: false,
  },
  {
    id: 4,
    name: "م. محمود خالد",
    role: "مهندس نقل ومرور",
    country: "عُمان",
    courseId: "vehicle-tracking",
    course: "Vehicle Tracking",
    rating: 4,
    review:
      "الشرح كان عمليًا ومباشرًا، وساعدني على فهم تحليل حركة المركبات وتطبيقه على الدوارات والمواقف بطريقة أوضح وأكثر دقة.",
    initials: "مخ",
    approved: true,
    featured: false,
  },
  {
    id: 5,
    name: "م. إيمان حسن",
    role: "مهندسة تصميم طرق",
    country: "مصر",
    courseId: "civil3d",
    course: "Civil 3D Fundamentals",
    rating: 5,
    review:
      "أكثر ما أعجبني هو ترتيب خطوات العمل وربط الأدوات بمراحل المشروع الحقيقية. أصبحت أتعامل مع البرنامج بثقة أكبر بعد تنفيذ التطبيقات المطلوبة.",
    initials: "إح",
    approved: true,
    featured: false,
  },
];

export default function Testimonials() {
  const [activeCourse, setActiveCourse] =
    useState<CourseId>("all");

  const [startIndex, setStartIndex] = useState(0);

  const filteredTestimonials = useMemo(() => {
    const approved = testimonials.filter(
      (testimonial) => testimonial.approved
    );

    if (activeCourse === "all") {
      return approved;
    }

    return approved.filter(
      (testimonial) =>
        testimonial.courseId === activeCourse
    );
  }, [activeCourse]);

  const visibleTestimonials = useMemo(() => {
    if (filteredTestimonials.length === 0) {
      return [];
    }

    return Array.from({ length: 3 }, (_, index) => {
      return filteredTestimonials[
        (startIndex + index) %
          filteredTestimonials.length
      ];
    });
  }, [filteredTestimonials, startIndex]);

  const next = () => {
    if (filteredTestimonials.length === 0) return;

    setStartIndex(
      (current) =>
        (current + 1) %
        filteredTestimonials.length
    );
  };

  const previous = () => {
    if (filteredTestimonials.length === 0) return;

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
                filteredTestimonials.length <= 1
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
                filteredTestimonials.length <= 1
              }
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#DCE3EC] bg-white text-[#07152E] shadow-sm transition duration-300 hover:border-[#F7B548] hover:bg-[#F7B548] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={20} />
            </button>
          </div>
        </div>

        {/* Testimonials */}
        {visibleTestimonials.length > 0 ? (
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

                  <blockquote className="relative z-10 mt-5 flex-1 text-[14px] font-medium leading-7 text-slate-600">
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
        {filteredTestimonials.length > 1 && (
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