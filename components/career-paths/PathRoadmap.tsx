"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Clock3,
  Layers3,
  Route,
} from "lucide-react";

import type { Course } from "@/data/courses";

type Locale = "ar" | "en";

type PathRoadmapProps = {
  courses: Course[];
  locale?: Locale;
};

const labels = {
  ar: {
    empty:
      "سيتم إضافة كورسات هذا المسار قريبًا.",
    title: "خريطة رحلة المسار",
    description:
      "اضغط على أيقونة الكورس للانتقال إلى تفاصيله.",
    station: "المحطة",
    learningStations: "محطات تعليمية",
    explore: "استكشف كورس",
  },
  en: {
    empty:
      "Courses for this path will be added soon.",
    title: "Path Journey Map",
    description:
      "Tap a course icon to open its details.",
    station: "Station",
    learningStations: "Learning Stations",
    explore: "Explore course",
  },
} as const;

export default function PathRoadmap({
  courses,
  locale = "ar",
}: PathRoadmapProps) {
  const isArabic = locale === "ar";
  const text = labels[locale];

  if (courses.length === 0) {
    return (
      <div
        dir={isArabic ? "rtl" : "ltr"}
        className="
          flex
          min-h-[120px]
          items-center
          justify-center
          rounded-[18px]
          border
          border-dashed
          border-[#DCE3EC]
          bg-white

          lg:min-h-[180px]
          lg:rounded-[26px]
        "
      >
        <p
          className="
            px-4
            text-center
            text-[10px]
            font-bold
            text-slate-500

            lg:text-[13px]
          "
        >
          {text.empty}
        </p>
      </div>
    );
  }

  return (
    <section
      dir={isArabic ? "rtl" : "ltr"}
      className="
        relative
        overflow-visible
        rounded-[20px]
        border
        border-[#DCE3EC]
        bg-white
        px-3
        py-3
        shadow-[0_10px_28px_rgba(7,21,46,0.05)]

        sm:px-4
        sm:py-3.5

        lg:rounded-[28px]
        lg:px-6
        lg:py-4
        lg:shadow-[0_14px_38px_rgba(7,21,46,0.06)]
      "
    >
      <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-[#F7B548]/8 blur-3xl" />

      <div className="relative z-10">
        {/* Header */}
        <div
          className="
            mb-0.5
            flex
            items-center
            justify-between
            gap-3

            lg:mb-1
            lg:gap-5
          "
        >
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 lg:gap-2">
              <Route
                size={14}
                className="
                  shrink-0
                  text-[#D49319]

                  lg:h-[17px]
                  lg:w-[17px]
                "
              />

              <span
                className="
                  mt-0.5
                  truncate
                  text-[16px]
                  font-black
                  text-[#07152E]

                  sm:text-[18px]
                  lg:mt-1
                  lg:text-[23px]
                "
              >
                {text.title}
              </span>
            </div>

            <p
              className="
                mt-0.5
                line-clamp-1
                text-[7.5px]
                font-medium
                text-slate-500

                sm:text-[9px]
                lg:mt-1
                lg:text-[12px]
              "
            >
              {text.description}
            </p>
          </div>

          <div
            className="
              hidden
              rounded-full
              border
              border-[#E0E6EE]
              bg-[#F8FAFC]
              px-4
              py-2
              text-[15px]
              font-black
              text-[#07152E]
              md:block
            "
          >
            {courses.length} {text.learningStations}
          </div>
        </div>

        {/* Road */}
        <div
          className="
            relative
            h-[122px]

            sm:h-[150px]
            lg:h-[230px]
          "
        >
          {/* Road body */}
          <div
            className="
              absolute
              left-[6%]
              right-[6%]
              top-1/2
              h-[9px]
              -translate-y-1/2
              rounded-full
              bg-[#07152E]
              shadow-[0_8px_18px_rgba(7,21,46,0.14)]

              sm:left-[8%]
              sm:right-[8%]
              sm:h-[12px]

              lg:left-[10%]
              lg:right-[10%]
              lg:h-[20px]
              lg:shadow-[0_12px_28px_rgba(7,21,46,0.18)]
            "
          />

          {/* Road edges */}
          <div
            className="
              absolute
              left-[6.5%]
              right-[6.5%]
              top-[calc(50%-5px)]
              h-px
              rounded-full
              bg-[#F7B548]/80

              sm:left-[8.5%]
              sm:right-[8.5%]
              sm:top-[calc(50%-6px)]

              lg:left-[10.5%]
              lg:right-[10.5%]
              lg:top-[calc(50%-10px)]
            "
          />

          <div
            className="
              absolute
              left-[6.5%]
              right-[6.5%]
              top-[calc(50%+4px)]
              h-px
              rounded-full
              bg-[#F7B548]/80

              sm:left-[8.5%]
              sm:right-[8.5%]
              sm:top-[calc(50%+5px)]

              lg:left-[10.5%]
              lg:right-[10.5%]
              lg:top-[calc(50%+9px)]
            "
          />

          {/* Center markings */}
          <div
            className="
              path-road-flow
              absolute
              left-[8%]
              right-[8%]
              top-1/2
              h-[1px]
              -translate-y-1/2

              sm:left-[10%]
              sm:right-[10%]

              lg:left-[12%]
              lg:right-[12%]
              lg:h-[2px]
            "
          />

          {/* Start */}
          <div
            className={`
              absolute
              top-1/2
              z-10
              flex
              h-4
              w-4
              -translate-y-1/2
              items-center
              justify-center
              rounded-full
              border-[3px]
              border-[#07152E]
              bg-[#F7B548]

              sm:h-5
              sm:w-5

              lg:h-7
              lg:w-7
              lg:border-[4px]

              ${
                isArabic
                  ? "right-[4.5%] sm:right-[6.5%] lg:right-[9%]"
                  : "left-[4.5%] sm:left-[6.5%] lg:left-[9%]"
              }
            `}
          >
            <span
              className="
                h-1.5
                w-1.5
                rounded-full
                bg-[#07152E]

                lg:h-2
                lg:w-2
              "
            />
          </div>

          {/* End */}
          <div
            className={`
              absolute
              top-1/2
              z-10
              flex
              h-[18px]
              w-[18px]
              -translate-y-1/2
              items-center
              justify-center
              rounded-full
              border-[3px]
              border-[#07152E]
              bg-[#F7B548]
              text-[#07152E]

              sm:h-[22px]
              sm:w-[22px]

              lg:h-8
              lg:w-8
              lg:border-[4px]

              ${
                isArabic
                  ? "left-[4%] sm:left-[6%] lg:left-[8.5%]"
                  : "right-[4%] sm:right-[6%] lg:right-[8.5%]"
              }
            `}
          >
            <Route
              size={10}
              className="lg:h-[15px] lg:w-[15px]"
            />
          </div>

          {/* Stations */}
          <div
            className="
              absolute
              inset-x-[8%]
              top-1/2
              flex
              -translate-y-1/2
              items-center
              justify-between

              sm:inset-x-[10%]
              lg:inset-x-[13%]
            "
          >
            {courses.map((course, index) => {
              const showAbove = index % 2 === 0;

              return (
                <div
                  key={course.slug}
                  className="
                    group
                    relative
                    flex
                    w-[48px]
                    justify-center

                    sm:w-[64px]
                    lg:w-[115px]
                  "
                >
                  {/* Connector */}
                  <div
                    className={`
                      absolute
                      left-1/2
                      w-px
                      -translate-x-1/2
                      bg-[#F7B548]/75
                      transition
                      duration-300

                      ${
                        showAbove
                          ? "bottom-[20px] h-[12px] sm:bottom-[23px] sm:h-[16px] lg:bottom-[30px] lg:h-[26px]"
                          : "top-[20px] h-[12px] sm:top-[23px] sm:h-[16px] lg:top-[30px] lg:h-[26px]"
                      }
                    `}
                  />

                  <Link
                    href={`/course/${course.slug}`}
                    aria-label={`${text.explore} ${course.title}`}
                    className="
                      relative
                      z-20
                      flex
                      h-[34px]
                      w-[34px]
                      items-center
                      justify-center
                      overflow-hidden
                      rounded-full
                      border
                      border-white
                      bg-white
                      p-1.5
                      ring-1
                      ring-[#F7B548]
                      shadow-[0_6px_14px_rgba(7,21,46,0.12)]
                      transition-all
                      duration-300

                      group-hover:scale-105
                      group-hover:ring-2
                      group-hover:ring-[#F7B548]/55

                      sm:h-[42px]
                      sm:w-[42px]
                      sm:p-2

                      lg:h-[60px]
                      lg:w-[60px]
                      lg:shadow-[0_8px_18px_rgba(7,21,46,0.14)]
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
                      pointer-events-none
                      absolute
                      left-1/2
                      w-[72px]
                      -translate-x-1/2
                      text-center

                      sm:w-[96px]
                      lg:w-[180px]

                      ${
                        showAbove
                          ? "bottom-[43px] sm:bottom-[52px] lg:bottom-[74px]"
                          : "top-[43px] sm:top-[52px] lg:top-[74px]"
                      }
                    `}
                  >
                    <span
                      className="
                        text-[6px]
                        font-black
                        text-[#D49319]

                        sm:text-[7px]
                        lg:text-[15px]
                      "
                    >
                      {text.station} {index + 1}
                    </span>

                    <h3
                      className="
                        mt-0.5
                        line-clamp-2
                        text-[6.5px]
                        font-black
                        leading-[1.15]
                        text-[#07152E]

                        sm:text-[8px]
                        sm:leading-3

                        lg:mt-1
                        lg:text-[15px]
                        lg:leading-5
                      "
                    >
                      {course.title}
                    </h3>
                  </div>

                  {/* Hover details - desktop only */}
                  <div
                    className={`
                      pointer-events-none
                      absolute
                      left-1/2
                      z-40
                      hidden
                      w-[205px]
                      -translate-x-1/2
                      scale-95
                      rounded-[17px]
                      border
                      border-[#F7B548]/55
                      bg-white
                      p-3
                      text-start
                      opacity-0
                      shadow-[0_16px_38px_rgba(7,21,46,0.16)]
                      transition-all
                      duration-300

                      lg:block
                      group-hover:scale-100
                      group-hover:opacity-100

                      ${
                        showAbove
                          ? "lg:bottom-[105px]"
                          : "lg:top-[105px]"
                      }
                    `}
                  >
                    <h4 className="text-[14px] font-black leading-5 text-[#07152E]">
                      {course.title}
                    </h4>

                    <p className="mt-1.5 line-clamp-2 text-[10px] font-medium leading-4 text-slate-500">
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