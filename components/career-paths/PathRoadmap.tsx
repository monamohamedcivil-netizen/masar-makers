"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Clock3,
  Layers3,
  Route,
} from "lucide-react";

import type { Course } from "@/data/courses";

type PathRoadmapProps = {
  courses: Course[];
};

export default function PathRoadmap({
  courses,
}: PathRoadmapProps) {
  if (courses.length === 0) {
    return (
      <div
        dir="rtl"
        className="
          flex min-h-[180px] items-center justify-center
          rounded-[26px] border border-dashed
          border-[#DCE3EC] bg-white
        "
      >
        <p className="text-[13px] font-bold text-slate-500">
          سيتم إضافة كورسات هذا المسار قريبًا.
        </p>
      </div>
    );
  }

  return (
    <section
      dir="rtl"
      className="
        relative overflow-visible rounded-[28px]
        border border-[#DCE3EC] bg-white
        px-6 py-4
        shadow-[0_14px_38px_rgba(7,21,46,0.06)]
      "
    >
      <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-[#F7B548]/8 blur-3xl" />

      <div className="relative z-10">
        {/* Header */}
        <div className="mb-1 flex items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2">
              <Route
                size={17}
                className="text-[#D49319]"
              />

              <span className="mt-1 text-[23px] font-black text-[#07152E]">
              خريطة رحلة المسار
              </span>
            </div>

            

            <p className="mt-1 text-[12px] font-medium text-slate-500">
              اضغط على أيقونة الكورس للانتقال إلى تفاصيله.
            </p>
          </div>

          <div
            className="
              hidden rounded-full border border-[#E0E6EE]
              bg-[#F8FAFC] px-4 py-2
              text-[15px] font-black text-[#07152E]
              md:block
            "
          >
            {courses.length} محطات تعليمية
          </div>
        </div>

        {/* Desktop */}
        <div className="relative h-[185px] sm:h-[205px] lg:h-[230px]">
          {/* Road body */}
          <div
  className="
    absolute left-[7%] right-[7%] top-1/2
    h-[14px] sm:left-[9%] sm:right-[9%] sm:h-[16px] lg:left-[10%] lg:right-[10%] lg:h-[20px] -translate-y-1/2
    rounded-full bg-[#07152E]
    shadow-[0_12px_28px_rgba(7,21,46,0.18)]
  "
/>

          {/* Road edge */}
         <div
  className="
    absolute left-[7.5%] right-[7.5%]
    top-[calc(50%-7px)] sm:left-[9.5%] sm:right-[9.5%] sm:top-[calc(50%-8px)] lg:left-[10.5%] lg:right-[10.5%] lg:top-[calc(50%-10px)]
    h-px rounded-full bg-[#F7B548]/80
  "
/>

<div
  className="
    absolute left-[7.5%] right-[7.5%]
    top-[calc(50%+6px)] sm:left-[9.5%] sm:right-[9.5%] sm:top-[calc(50%+7px)] lg:left-[10.5%] lg:right-[10.5%] lg:top-[calc(50%+9px)]
    h-px rounded-full bg-[#F7B548]/80
  "
/>

          {/* Center markings */}
          <div
  className="
    path-road-flow absolute left-[9%] right-[9%] sm:left-[11%] sm:right-[11%] lg:left-[12%] lg:right-[12%]
    top-1/2 h-[2px] -translate-y-1/2
  "
/>

          {/* Start */}
          <div
            className="
              absolute right-[6%] top-1/2 z-10
              flex h-5 w-5 sm:right-[8%] sm:h-6 sm:w-6 lg:right-[9%] lg:h-7 lg:w-7 -translate-y-1/2
              items-center justify-center rounded-full
              border-[4px] border-[#07152E]
              bg-[#F7B548]
            "
          >
            <span className="h-2 w-2 rounded-full bg-[#07152E]" />
          </div>

          {/* End */}
          <div
            className="
              absolute left-[5.5%] top-1/2 z-10
              flex h-6 w-6 sm:left-[7.5%] sm:h-7 sm:w-7 lg:left-[8.5%] lg:h-8 lg:w-8 -translate-y-1/2
              items-center justify-center rounded-full
              border-[4px] border-[#07152E]
              bg-[#F7B548] text-[#07152E]
            "
          >
            <Route size={15} />
          </div>

          {/* Stations */}
          <div
            className="
              absolute inset-x-[10%] top-1/2 sm:inset-x-[12%] lg:inset-x-[13%]
              flex -translate-y-1/2
              items-center justify-between
            "
          >
            {courses.map((course, index) => {
              const showAbove = index % 2 === 0;

              return (
                <div
                  key={course.slug}
                  className="group relative flex w-[64px] justify-center sm:w-[84px] lg:w-[115px]"
                >
                  {/* Correct connector */}
                  <div
  className={`
    absolute left-1/2 w-px
    -translate-x-1/2
    bg-[#F7B548]/75
    transition duration-300
    ${
      showAbove
        ? "bottom-[24px] h-[20px] sm:bottom-[27px] sm:h-[23px] lg:bottom-[30px] lg:h-[26px]"
        : "top-[24px] h-[20px] sm:top-[27px] sm:h-[23px] lg:top-[30px] lg:h-[26px]"
    }
  `}
/>

                  {/* Hover shows details; click opens the course directly */}
                  <Link
                    href={`/course/${course.slug}`}
                    aria-label={`استكشف كورس ${course.title}`}
                    className="
                      relative z-20 flex h-[44px] w-[44px]
                      items-center justify-center overflow-hidden
                      rounded-full border border-white bg-white p-2
                      ring-1 ring-[#F7B548]
                      shadow-[0_8px_18px_rgba(7,21,46,0.14)]
                      transition-all duration-300
                      group-hover:scale-105
                      group-hover:ring-2
                      group-hover:ring-[#F7B548]/55
                      group-hover:shadow-[0_0_20px_rgba(247,181,72,0.25)]
                      sm:h-[52px] sm:w-[52px]
                      lg:h-[60px] lg:w-[60px]
                    "
                  >
                    <Image
                      src={course.icon}
                      alt={course.title}
                      width={42}
                      height={42}
                      className="h-full w-full object-contain"
                    />
                  </Link>

                  {/* Course name */}
                  <div
                    className={`
                      pointer-events-none absolute left-1/2
                      w-[92px] -translate-x-1/2 sm:w-[130px] lg:w-[180px]
                      text-center
                      ${
                        showAbove
                          ? "bottom-[56px] sm:bottom-[64px] lg:bottom-[74px]"
                          : "top-[56px] sm:top-[64px] lg:top-[74px]"
                      }
                    `}
                  >
                    <span className="text-[9px] font-black text-[#D49319] sm:text-[11px] lg:text-[15px]">
                      المحطة {index + 1}
                    </span>

                    <h3 className="mt-1 line-clamp-2 text-[9px] font-black leading-3 text-[#07152E] sm:text-[11px] sm:leading-4 lg:text-[15px] lg:leading-5">
                      {course.title}
                    </h3>
                  </div>

                  {/* Compact hover card */}
                  <div
                    className={`
                      pointer-events-none absolute left-1/2 z-40
                      w-[185px] -translate-x-1/2
                      sm:w-[195px] lg:w-[205px]
                      scale-95 rounded-[17px]
                      border border-[#F7B548]/55
                      bg-white p-3 text-right
                      opacity-0
                      shadow-[0_16px_38px_rgba(7,21,46,0.16)]
                      transition-all duration-300
                      group-hover:scale-100
                      group-hover:opacity-100
                      ${
                        showAbove
                          ? "bottom-[88px] sm:bottom-[96px] lg:bottom-[105px]"
                          : "top-[88px] sm:top-[96px] lg:top-[105px]"
                      }
                    `}
                  >
                    <h4 className="text-[12px] font-black leading-4 text-[#07152E] sm:text-[13px] lg:text-[14px] lg:leading-5">
                      {course.title}
                    </h4>

                    <p className="mt-1.5 line-clamp-2 text-[9px] font-medium leading-4 text-slate-500 sm:text-[10px]">
                      {course.description}
                    </p>

                    <div className="mt-2 grid grid-cols-2 gap-2 border-t border-[#E9EDF3] pt-2">
                      <div className="flex items-center gap-1 text-[9px] font-bold text-slate-600">
                        <Clock3
                          size={12}
                          className="text-[#D49319]"
                        />
                        {course.duration}
                      </div>

                      <div className="flex items-center gap-1 text-[9px] font-bold text-slate-600">
                        <Layers3
                          size={12}
                          className="text-[#D49319]"
                        />
                        {course.projects}
                      </div>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}