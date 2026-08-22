import Link from "next/link";

import type { Course } from "@/data/types";

type Locale = "ar" | "en";

type CourseJourneyHeaderProps = {
  courses: Course[];
  currentCourseSlug: string;
  pathTitle: string;
  pathSlug: string;
  locale?: Locale;
};

export default function CourseJourneyHeader({
  courses,
  currentCourseSlug,
  pathTitle,
  pathSlug,
  locale = "ar",
}: CourseJourneyHeaderProps) {
  const currentIndex = courses.findIndex(
    (course) => course.slug === currentCourseSlug
  );

  const safeCurrentIndex = Math.max(currentIndex, 0);
  const coursesCount = Math.max(courses.length, 1);
  const isArabic = locale === "ar";

  /*
    مراكز المحطات تكون:
    10%، 30%، 50%، 70%، 90%
    عندما يكون عدد الكورسات 5.
  */
  const roadInset = 50 / coursesCount;

  /*
    طول الطريق بين أول وآخر محطة.
    عند 5 كورسات = 80% من العرض.
  */
  const roadSpan = ((coursesCount - 1) / coursesCount) * 100;

  /*
    نسبة الوصول داخل المسافة بين أول وآخر محطة.
  */
  const progressRatio =
    coursesCount > 1
      ? safeCurrentIndex / (coursesCount - 1)
      : 1;

  const gridStyle = {
    gridTemplateColumns: `repeat(${coursesCount}, minmax(0, 1fr))`,
  };

  return (
    <section
      dir={isArabic ? "rtl" : "ltr"}
      className="
        border-b border-[#DDE3EB]
        bg-white
        px-2 py-2
        sm:px-4 sm:py-3
        lg:px-6 lg:py-4
      "
    >
      <div className="mx-auto max-w-[1480px]">
        {/* Breadcrumb */}
        <div
          className={`
            mb-2 flex items-center gap-1.5
            text-[11px] font-bold
            sm:mb-3 sm:gap-2 sm:text-[13px]
            lg:mb-4 lg:gap-3 lg:text-[18px]
          `}
        >
          <Link
            href={`/career-path/${pathSlug}`}
            className="
              max-w-[45%]
              truncate
              font-black text-[#07152E]
              transition hover:text-[#D49319]
              lg:max-w-none
            "
          >
            {pathTitle}
          </Link>

          <span className="shrink-0 font-black text-[#D49319]">
            {isArabic ? "←" : "→"}
          </span>

          <span
            className="
              max-w-[48%]
              truncate
              font-black text-[#D49319]
              lg:max-w-none
            "
          >
            {courses[safeCurrentIndex]?.title}
          </span>
        </div>

        {/* Journey road */}
        <div
          className="
            overflow-x-auto
            pb-1
            [scrollbar-width:none]
            [&::-webkit-scrollbar]:hidden
          "
        >
          <div
            className="
              relative
              h-[58px]
              min-w-full
              sm:h-[66px]
              lg:h-[80px]
            "
          >
            {/* Base road */}
            <div
              className="
                absolute top-[15px]
                h-[10px]
                rounded-full
                bg-[#DDE3EB]

                sm:top-[16px]
                sm:h-[12px]

                lg:top-[18px]
                lg:h-[20px]
              "
              style={{
                right: `${roadInset}%`,
                left: `${roadInset}%`,
              }}
            />

            {/* White markings */}
            <div
              className="
                absolute top-[19px]
                h-[1px]
                bg-[repeating-linear-gradient(to_left,#FFFFFF_0_8px,transparent_8px_14px)]

                sm:top-[21px]
                sm:bg-[repeating-linear-gradient(to_left,#FFFFFF_0_10px,transparent_10px_18px)]

                lg:top-[27px]
                lg:h-[2px]
                lg:bg-[repeating-linear-gradient(to_left,#FFFFFF_0_16px,transparent_16px_28px)]
              "
              style={{
                right: `${roadInset}%`,
                left: `${roadInset}%`,
              }}
            />

            {/* Completed road */}
            <div
              className="
                absolute top-[15px]
                h-[10px]
                overflow-hidden
                rounded-full
                bg-[#07152E]

                sm:top-[16px]
                sm:h-[12px]

                lg:top-[18px]
                lg:h-[20px]
              "
              style={{
                right: `${roadInset}%`,
                width: `${roadSpan * progressRatio}%`,
              }}
            >
              <div
                className="
                  absolute inset-x-0 top-[4px]
                  h-[1px]
                  bg-[repeating-linear-gradient(to_left,#F7B548_0_8px,transparent_8px_14px)]

                  sm:top-[5px]
                  sm:bg-[repeating-linear-gradient(to_left,#F7B548_0_10px,transparent_10px_18px)]

                  lg:top-[9px]
                  lg:h-[2px]
                  lg:bg-[repeating-linear-gradient(to_left,#F7B548_0_16px,transparent_16px_28px)]
                "
              />
            </div>

            {/* Stations */}
            <div
              className="
                absolute inset-x-0 top-[4px]
                grid items-start

                sm:top-[4px]
                lg:top-[5px]
              "
              style={gridStyle}
            >
              {courses.map((course, index) => {
                const isCurrent =
                  course.slug === currentCourseSlug;

                const isCompleted =
                  index < safeCurrentIndex;

                return (
                  <Link
                    key={course.slug}
                    href={`/course/${course.slug}`}
                    className="
                      group flex min-w-0
                      flex-col items-center
                      text-center
                    "
                  >
                    <div
                      className={`
                        relative z-10 flex
                        h-[28px] w-[28px]
                        items-center justify-center
                        rounded-full
                        border bg-white
                        text-[10px] font-black
                        transition duration-300

                        sm:h-[32px] sm:w-[32px]
                        sm:text-[11px]

                        lg:h-[40px] lg:w-[40px]
                        lg:text-[15px]

                        ${
                          isCurrent
                            ? `
                              scale-105
                              border-[#F7B548]
                              bg-[#FFF7E3]
                              text-[#07152E]
                              ring-1 ring-[#F7B548]
                              shadow-[0_0_16px_rgba(247,181,72,0.30)]

                              lg:scale-110
                              lg:ring-2
                              lg:shadow-[0_0_25px_rgba(247,181,72,0.38)]
                            `
                            : isCompleted
                              ? `
                                border-[#07152E]
                                text-[#07152E]
                              `
                              : `
                                border-[#CBD3DF]
                                text-slate-400
                                group-hover:border-[#F7B548]
                              `
                        }
                      `}
                    >
                      {index + 1}

                      {isCurrent && (
                        <span
                          className="
                            absolute -bottom-1
                            h-2 w-2
                            rotate-45
                            border-b border-r
                            border-[#F7B548]
                            bg-[#FFF7E3]

                            lg:-bottom-2
                            lg:h-3 lg:w-3
                          "
                        />
                      )}
                    </div>

                    <p
                      className={`
                        mt-2
                        max-w-[84px]
                        line-clamp-2
                        text-[7px]
                        font-black
                        leading-[1.15]

                        sm:mt-2.5
                        sm:max-w-[110px]
                        sm:text-[8px]

                        lg:mt-4
                        lg:max-w-[180px]
                        lg:text-[13px]
                        lg:leading-5

                        ${
                          isCurrent
                            ? "text-[#D49319]"
                            : "text-[#07152E]"
                        }
                      `}
                    >
                      {course.title}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}