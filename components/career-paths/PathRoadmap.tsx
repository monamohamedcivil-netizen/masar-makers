"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Clock3,
  FolderKanban,
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
        <div className="relative hidden h-[230px] lg:block">
          {/* Road body */}
          <div
  className="
    absolute left-[10%] right-[10%] top-1/2
    h-[20px] -translate-y-1/2
    rounded-full bg-[#07152E]
    shadow-[0_12px_28px_rgba(7,21,46,0.18)]
  "
/>

          {/* Road edge */}
         <div
  className="
    absolute left-[10.5%] right-[10.5%]
    top-[calc(50%-10px)]
    h-px rounded-full bg-[#F7B548]/80
  "
/>

<div
  className="
    absolute left-[10.5%] right-[10.5%]
    top-[calc(50%+9px)]
    h-px rounded-full bg-[#F7B548]/80
  "
/>

          {/* Center markings */}
          <div
  className="
    path-road-flow absolute left-[12%] right-[12%]
    top-1/2 h-[2px] -translate-y-1/2
  "
/>

          {/* Start */}
          <div
            className="
              absolute right-[9%] top-1/2 z-10
              flex h-7 w-7 -translate-y-1/2
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
              absolute left-[8.5%] top-1/2 z-10
              flex h-8 w-8 -translate-y-1/2
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
              absolute inset-x-[13%] top-1/2
              flex -translate-y-1/2
              items-center justify-between
            "
          >
            {courses.map((course, index) => {
              const showAbove = index % 2 === 0;

              return (
                <div
                  key={course.slug}
                  className="group relative flex w-[115px] justify-center"
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
        ? "bottom-[30px] h-[26px]"
        : "top-[30px] h-[26px]"
    }
  `}
/>

                  {/* Clickable course icon */}
                  <Link
  href={`/course/${course.slug}`}
  aria-label={`استكشف كورس ${course.title}`}
  className="
    relative z-20 flex h-[60px] w-[60px]
    items-center justify-center overflow-hidden
    rounded-full border border-white
    bg-white p-2
    ring-1 ring-[#F7B548]
    shadow-[0_8px_18px_rgba(7,21,46,0.14)]
    transition-all duration-300
    group-hover:scale-105
    group-hover:ring-2
    group-hover:ring-[#F7B548]/55
    group-hover:shadow-[0_0_20px_rgba(247,181,72,0.25)]
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
                      w-[180px] -translate-x-1/2
                      text-center
                      ${
                        showAbove
                          ? "bottom-[74px]"
                          : "top-[74px]"
                      }
                    `}
                  >
                    <span className="text-[15px] font-black text-[#D49319]">
                      المحطة {index + 1}
                    </span>

                    <h3 className="mt-1 line-clamp-2 text-[15px] font-black leading-5 text-[#07152E]">
                      {course.title}
                    </h3>
                  </div>

                  {/* Compact hover card */}
                  <div
                    className={`
                      pointer-events-none absolute left-1/2 z-40
                      w-[205px] -translate-x-1/2
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
                          ? "bottom-[105px]"
                          : "top-[105px]"
                      }
                    `}
                  >
                    <h4 className="text-[14px] font-black leading-5 text-[#07152E]">
                      {course.title}
                    </h4>

                    <p className="mt-2 line-clamp-2 text-[10px] font-medium leading-4 text-slate-500">
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
                        <FolderKanban
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

        {/* Mobile */}
        <div className="relative mt-4 space-y-3 lg:hidden">
          <div className="absolute bottom-6 right-[27px] top-6 w-[3px] rounded-full bg-[#F7B548]/40" />

          {courses.map((course, index) => (
            <Link
              key={course.slug}
              href={`/course/${course.slug}`}
              className="
                group relative z-10 flex items-center gap-4
                rounded-[18px] border border-[#DCE3EC]
                bg-[#F8FAFC] p-3
                transition duration-300
                hover:border-[#F7B548] hover:bg-white
              "
            >
              <div
                className="
                  flex h-[52px] w-[52px] shrink-0
                  items-center justify-center rounded-full
                  border-[3px] border-white bg-white p-2
                  ring-2 ring-[#F7B548]
                "
              >
                <Image
                  src={course.icon}
                  alt={course.title}
                  width={38}
                  height={38}
                  className="h-full w-full object-contain"
                />
              </div>

              <div className="min-w-0 flex-1 text-right">
                <span className="text-[9px] font-black text-[#D49319]">
                  المحطة {index + 1}
                </span>

                <h3 className="mt-0.5 text-[14px] font-black text-[#07152E]">
                  {course.title}
                </h3>

                <div className="mt-1.5 flex items-center gap-4 text-[9px] font-bold text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock3
                      size={11}
                      className="text-[#D49319]"
                    />
                    {course.duration}
                  </span>

                  <span className="flex items-center gap-1">
                    <FolderKanban
                      size={11}
                      className="text-[#D49319]"
                    />
                    {course.projects}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}