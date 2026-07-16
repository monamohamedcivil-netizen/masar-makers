"use client";

import Image from "next/image";
import { useState } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FolderKanban,
  Star,
  Users,
} from "lucide-react";
import AuthLink from "@/components/AuthLink";

type Course = {
  title: string;
  subtitle: string;
  description: string;
  image: string;
  category: string;
  duration: string;
  projects: string;
  students: string;
  rating: string;
  badge: string;
};

const courses: Course[] = [
  {
    title: "Civil Site Design",
    subtitle: "من الأساس إلى الاحتراف",
    description:
      "رحلة عملية متكاملة لتصميم الطرق والتقاطعات وإدارة المشروع باستخدام Civil Site Design.",
    image: "/images/courses/course-csd.jpg",
    category: "تصميم الطرق",
    duration: "36 ساعة",
    projects: "6 مشاريع",
    students: "+150 متدرب",
    rating: "4.9",
    badge: "الأكثر طلبًا",
  },
  {
    title: "Smart Project Deliverables",
    subtitle: "إخراج اللوحات بسرعة فائقة",
    description:
      "تعلم منهجية احترافية لاستخراج اللوحات وتنظيم ملفات المشروع وتسليمها بسرعة ودقة.",
    image: "/images/courses/course-spd.jpg",
    category: "إخراج المشاريع",
    duration: "18 ساعة",
    projects: "500+ لوحة",
    students: "+120 متدرب",
    rating: "4.9",
    badge: "الأكثر تطبيقًا",
  },
  {
    title: "BIM for Roads",
    subtitle: "حوّل تصميمك إلى نموذج ثلاثي الأبعاد",
    description:
      "أنشئ نموذج BIM متكاملًا للطرق يشمل العلامات المرورية والإنارة وعناصر الطريق المختلفة.",
    image: "/images/courses/course-bim.jpg",
    category: "BIM للطرق",
    duration: "20 ساعة",
    projects: "4 مشاريع",
    students: "+100 متدرب",
    rating: "4.8",
    badge: "الأحدث",
  },
  {
    title: "Civil 3D Fundamentals",
    subtitle: "ابدأ رحلة تصميم الطرق",
    description:
      "تعلم الأساسيات والمنهجية الصحيحة لبناء مشروع طرق متكامل باستخدام Civil 3D.",
    image: "/images/courses/course-civil3d.jpg",
    category: "تصميم الطرق",
    duration: "30 ساعة",
    projects: "5 مشاريع",
    students: "+180 متدرب",
    rating: "4.9",
    badge: "الأكثر مشاهدة",
  },
  {
    title: "Vehicle Tracking",
    subtitle: "تحليل حركة المركبات",
    description:
      "تعلم فحص مسارات المركبات وتصميم الدوارات والمواقف ومناطق الحركة بأمان وكفاءة.",
    image: "/images/courses/course-vt.jpg",
    category: "تحليل الحركة",
    duration: "12 ساعة",
    projects: "3 مشاريع",
    students: "+80 متدرب",
    rating: "4.8",
    badge: "مهارة مطلوبة",
  },
];

export default function PopularCourses() {
  const [startIndex, setStartIndex] = useState(0);

  const visibleCourses = Array.from({ length: 3 }, (_, index) => {
    return courses[(startIndex + index) % courses.length];
  });

  const nextCourses = () => {
    setStartIndex((current) => (current + 1) % courses.length);
  };

  const previousCourses = () => {
    setStartIndex(
      (current) => (current - 1 + courses.length) % courses.length
    );
  };

  return (
    <section
      id="popular-courses"
      dir="rtl"
      className="w-full bg-[#F7F8FA] px-6 py-1"
    >
      <div className="mx-auto max-w-[1580px]">
        {/* Controls */}
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            className="group flex items-center gap-2 text-[14px] font-black text-[#07152E] transition hover:text-[#D49319]"
          >
            عرض جميع الرحلات
            <ArrowLeft
              size={17}
              className="transition-transform duration-300 group-hover:-translate-x-1"
            />
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={previousCourses}
              aria-label="عرض الرحلات السابقة"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#DCE3EC] bg-white text-[#07152E] shadow-sm transition duration-300 hover:border-[#F7B548] hover:bg-[#F7B548]"
            >
              <ChevronRight size={20} />
            </button>

            <button
              type="button"
              onClick={nextCourses}
              aria-label="عرض الرحلات التالية"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#DCE3EC] bg-white text-[#07152E] shadow-sm transition duration-300 hover:border-[#F7B548] hover:bg-[#F7B548]"
            >
              <ChevronLeft size={20} />
            </button>
          </div>
        </div>

        {/* Course cards */}
        <div className="grid gap-5 lg:grid-cols-3">
          {visibleCourses.map((course, index) => (
            <article
              key={`${course.title}-${startIndex}-${index}`}
              className="
                group flex h-[365px] flex-col overflow-hidden
                rounded-[28px] border border-[#DCE3EC] bg-white
                shadow-[0_14px_36px_rgba(7,21,46,0.07)]
                transition-all duration-500
                hover:-translate-y-1.5
                hover:border-[#F7B548]/70
                hover:shadow-[0_22px_50px_rgba(7,21,46,0.13)]text-[22px]
              "
            >
              {/* Image */}
              <div className="relative h-[155px] shrink-0 overflow-hidden bg-[#07152E]">
                <Image
                  src={course.image}
                  alt={course.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-[#07152E]/55 via-transparent to-black/10" />

                {/* Category */}
                <span className="absolute right-4 top-4 rounded-full border border-white/25 bg-[#07152E]/75 px-4 py-1.5 text-[11px] font-black text-white backdrop-blur-md">
                  {course.category}
                </span>

                {/* Badge */}
                <span className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-[#F7B548] px-4 py-1.5 text-[11px] font-black text-[#07152E] shadow-md">
                  <Star size={13} fill="currentColor" />
                  {course.badge}
                </span>
              </div>

              {/* Content */}
              <div className="flex flex-1 flex-col justify-between px-5 pb-4 pt-2 text-right">
                <div>
                  <h3 className="text-[19px] font-black leading-tight text-[#07152E]">
                    {course.title}
                  </h3>

                  <p className="mt-1 text-[13px] font-black text-[#D49319]">
                    {course.subtitle}
                  </p>

                  <p className="mt-1 min-h-[38px] text-[12px] font-medium leading-5 text-slate-600">
                    {course.description}
                  </p>
                </div>

                {/* Stats */}
                <div className="mt-0 grid grid-cols-4 gap-2 border-y border-[#E9EDF3] py-2 text-center">
  <div>
    <Clock3
      size={19}
      className="mx-auto mb-1 text-[#D49319]"
    />
    <p className="text-[12px] font-black text-slate-700">
      {course.duration}
    </p>
  </div>

  <div>
    <FolderKanban
      size={19}
      className="mx-auto mb-1 text-[#D49319]"
    />
    <p className="text-[12px] font-black text-slate-700">
      {course.projects}
    </p>
  </div>

  <div>
    <Users
      size={19}
      className="mx-auto mb-1 text-[#D49319]"
    />
    <p className="text-[12px] font-black text-slate-700">
      {course.students}
    </p>
  </div>

  <div>
    <Star
      size={19}
      fill="currentColor"
      className="mx-auto mb-1 text-[#F7B548]"
    />
    <p className="text-[12px] font-black text-slate-700">
      {course.rating}
    </p>
  </div>
</div>

                {/* Button */}
      <AuthLink href="/career-path/road">       
                <button
  className="
    mt-0
    flex h-[42px] w-full items-center justify-center gap-2
    rounded-xl
    bg-[#07152E]
    text-[13px]
    font-black
    text-white
    transition
    hover:bg-[#F7B548]
    hover:text-[#07152E]
  "

                >
                  استكشف الرحلة
                  <ArrowLeft size={17} />
                </button>
                </AuthLink>  
              </div>
            </article>
          ))}
        </div>

        {/* Indicators */}
        <div className="mt-4 flex justify-center gap-2">
          {courses.map((course, index) => (
            <button
              key={course.title}
              type="button"
              onClick={() => setStartIndex(index)}
              aria-label={`عرض رحلة ${course.title}`}
              className={`h-[6px] rounded-full transition-all duration-500 ${
                index === startIndex
                  ? "w-9 bg-[#F7B548]"
                  : "w-[6px] bg-slate-300 hover:bg-slate-400"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}