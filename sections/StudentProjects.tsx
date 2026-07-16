"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Building2,
  ExternalLink,
  MapPin,
  Play,
  Route,
} from "lucide-react";
import AuthLink from "@/components/AuthLink";

type ProjectCategory =
  | "الكل"
  | "Civil 3D"
  | "CSD"
  | "Deliverables"
  | "Vehicle Tracking"
  | "BIM";

type StudentProject = {
  id: number;
  title: string;
  description: string;
  image: string;
  category: Exclude<ProjectCategory, "الكل">;
  student: string;
  country: string;
  software: string;
  featured?: boolean;
  video?: boolean;
};

const categories: ProjectCategory[] = [
  "الكل",
  "Civil 3D",
  "CSD",
  "Deliverables",
  "Vehicle Tracking",
  "BIM",
];

const projects: StudentProject[] = [
  {
    id: 1,
    title: "تصميم شبكة طرق متكاملة",
    description:
      "تصميم هندسي متكامل لشبكة طرق يشمل المحاور والتقاطعات والقطاعات والكميات.",
    image: "/images/student-projects/project-csd.jpg",
    category: "CSD",
    student: "م. أحمد محمد",
    country: "السعودية",
    software: "Civil Site Design",
    featured: true,
  },
  {
    id: 2,
    title: "نموذج BIM لشبكة الطرق",
    description:
      "نموذج ثلاثي الأبعاد يشمل تخطيط الطريق والعلامات المرورية والإنارة.",
    image: "/images/student-projects/project-bim.jpg",
    category: "BIM",
    student: "م. ناصر علي",
    country: "الإمارات",
    software: "Civil 3D & Navisworks",
    video: true,
  },
  {
    id: 3,
    title: "إخراج حزمة لوحات احترافية",
    description:
      "إنتاج مجموعة متكاملة من لوحات المشروع باستخدام منهجية تسليم سريعة ودقيقة.",
    image: "/images/student-projects/project-deliverables.jpg",
    category: "Deliverables",
    student: "م. شوقي عبدو",
    country: "مصر",
    software: "Civil 3D",
  },
  {
    id: 4,
    title: "تحليل حركة المركبات",
    description:
      "دراسة مسارات المركبات داخل تقاطع ومواقف سيارات لاختبار كفاءة التصميم.",
    image: "/images/student-projects/project-tracking.jpg",
    category: "Vehicle Tracking",
    student: "م. محمود خالد",
    country: "عُمان",
    software: "Vehicle Tracking",
  },
  {
    id: 5,
    title: "تصميم طريق جبلي",
    description:
      "تصميم أفقي ورأسي متكامل لطريق جبلي مع مراجعة الميول والعناصر الهندسية.",
    image: "/images/student-projects/project-civil3d.jpg",
    category: "Civil 3D",
    student: "م. محمد سالم",
    country: "ليبيا",
    software: "Civil 3D",
  },
];

const categoryStyles: Record<
  Exclude<ProjectCategory, "الكل">,
  string
> = {
  "Civil 3D": "bg-[#1E66D0] text-white",
  CSD: "bg-[#7DBB37] text-white",
  Deliverables: "bg-[#F29B2D] text-[#07152E]",
  "Vehicle Tracking": "bg-[#7455C6] text-white",
  BIM: "bg-[#12A4B7] text-white",
};

export default function StudentProjects() {
  const [activeCategory, setActiveCategory] =
    useState<ProjectCategory>("الكل");

  const visibleProjects = useMemo(() => {
    if (activeCategory === "الكل") {
      return projects;
    }

    return projects.filter(
      (project) => project.category === activeCategory
    );
  }, [activeCategory]);

  const displayProjects =
    visibleProjects.length >= 4
      ? visibleProjects.slice(0, 4)
      : [...visibleProjects, ...projects]
          .filter(
            (project, index, array) =>
              array.findIndex((item) => item.id === project.id) ===
              index
          )
          .slice(0, 4);

  return (
    <section
      id="student-projects"
      dir="rtl"
      className="w-full bg-[#F7F8FA] px-6 py-3"
    >
      <div className="mx-auto max-w-[1580px]">
        {/* Filters */}
        <div className="mb-2 flex items-center justify-between gap-6">
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={`rounded-full px-4 py-2 text-[12px] font-black transition duration-300 ${
                  activeCategory === category
                    ? "bg-[#07152E] text-white shadow-md"
                    : "border border-[#DCE3EC] bg-white text-slate-600 hover:border-[#F7B548] hover:text-[#07152E]"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="group hidden shrink-0 items-center gap-2 text-[13px] font-black text-[#07152E] transition hover:text-[#D49319] lg:flex"
          >
            عرض معرض المشاريع
            <ArrowLeft
              size={17}
              className="transition-transform duration-300 group-hover:-translate-x-1"
            />
          </button>
        </div>

        {/* Portfolio Gallery */}
        <div className="grid h-[240px] grid-cols-12 grid-rows-2 gap-3">
          {displayProjects.map((project, index) => {
            const isLarge = index === 0;

            return (
              <article
                key={`${activeCategory}-${project.id}-${index}`}
                className={`group relative overflow-hidden rounded-[26px] bg-[#07152E] shadow-[0_14px_36px_rgba(7,21,46,0.09)] ${
                  isLarge
                    ? "col-span-6 row-span-2"
                    : index === 1
                    ? "col-span-6 row-span-1"
                    : "col-span-3 row-span-1"
                }`}
              >
                <Image
                  src={project.image}
                  alt={project.title}
                  fill
                  sizes={
                    isLarge
                      ? "(max-width: 1024px) 100vw, 50vw"
                      : "(max-width: 1024px) 100vw, 25vw"
                  }
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-[#07152E]/95 via-[#07152E]/25 to-transparent transition duration-500 group-hover:via-[#07152E]/45" />

                {/* Category */}
                <span
                  className={`absolute right-4 top-4 rounded-full px-3 py-1.5 text-[11px] font-black shadow-md ${
                    categoryStyles[project.category]
                  }`}
                >
                  {project.category}
                </span>

                {/* Featured */}
                {project.featured && (
                  <span className="absolute left-4 top-4 rounded-full bg-[#F7B548] px-3 py-1.5 text-[11px] font-black text-[#07152E] shadow-md">
                    مشروع مميز
                  </span>
                )}

                {/* Video icon */}
                {project.video && (
                  <div className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-white/20 text-white backdrop-blur-md transition duration-300 group-hover:scale-110">
                    <Play size={20} fill="currentColor" />
                  </div>
                )}

                {/* Content */}
                <div
                  className={`absolute inset-x-0 bottom-0 z-10 ${
                    isLarge ? "p-6" : "p-4"
                  }`}
                >
                  <div className="translate-y-2 transition-transform duration-500 group-hover:translate-y-0">
                    <h3
                      className={`font-black leading-tight text-white ${
                        isLarge ? "text-[25px]" : "text-[17px]"
                      }`}
                    >
                      {project.title}
                    </h3>

                    <p
                      className={`mt-1 font-bold text-[#F7B548] ${
                        isLarge ? "text-[13px]" : "text-[11px]"
                      }`}
                    >
                      {project.software}
                    </p>

                    <p
                      className={`mt-2 max-w-[620px] font-medium leading-5 text-slate-200 transition duration-500 ${
                        isLarge
                          ? "text-[13px] opacity-100"
                          : "line-clamp-1 text-[11px] opacity-0 group-hover:opacity-100"
                      }`}
                    >
                      {project.description}
                    </p>

                    <div
                      className={`mt-3 flex flex-wrap items-center gap-3 font-bold text-slate-300 ${
                        isLarge ? "text-[12px]" : "text-[10px]"
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <Building2
                          size={isLarge ? 15 : 13}
                          className="text-[#F7B548]"
                        />
                        {project.student}
                      </span>

                      <span className="flex items-center gap-1.5">
                        <MapPin
                          size={isLarge ? 15 : 13}
                          className="text-[#F7B548]"
                        />
                        {project.country}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    aria-label={`عرض مشروع ${project.title}`}
                    className="absolute bottom-4 left-4 flex h-9 w-9 translate-y-3 items-center justify-center rounded-full bg-white text-[#07152E] opacity-0 shadow-lg transition duration-500 group-hover:translate-y-0 group-hover:opacity-100"
                  >
                    <ExternalLink size={16} />
                  </button>
                </div>

                <div className="pointer-events-none absolute inset-0 rounded-[26px] border border-white/15 transition group-hover:border-[#F7B548]/60" />
              </article>
            );
          })}
        </div>

        {/* Bottom message */}
        <div className="mt-1.5 flex h-[55px] items-center justify-between rounded-[18px] border border-[#E0E6EE] bg-white px-5 shadow-[0_8px_24px_rgba(7,21,46,0.04)]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFF6DF] text-[#D49319]">
              <Route size={21} />
            </div>

            <div>
              <p className="text-[14px] font-black text-[#07152E]">
                مشروعك القادم قد يكون هنا
              </p>

              <p className="text-[11px] font-medium text-slate-500">
                طبّق ما تتعلمه، وارفع مشروعك ليصبح جزءًا من معرض صناع المسار.
              </p>
            </div>
          </div>
<AuthLink href="/career-path/road">
          <button
            type="button"
            className="hidden items-center gap-2 rounded-xl bg-[#07152E] px-5 py-2.5 text-[12px] font-black text-white transition hover:bg-[#F7B548] hover:text-[#07152E] md:flex"
          >
            استكشف الرحلات
            <ArrowLeft size={16} />
          </button>
          </AuthLink>
        </div>
      </div>
    </section>
  );
}