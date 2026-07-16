import Link from "next/link";

import type { Course } from "@/data/types";

type CourseJourneyHeaderProps = {
  courses: Course[];
  currentCourseSlug: string;
  pathTitle: string;
  pathSlug: string;
};

export default function CourseJourneyHeader({
  courses,
  currentCourseSlug,
  pathTitle,
  pathSlug,
}: CourseJourneyHeaderProps) {
  const currentIndex = courses.findIndex(
    (course) => course.slug === currentCourseSlug
  );

  const safeCurrentIndex = Math.max(currentIndex, 0);
  const coursesCount = Math.max(courses.length, 1);

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
      dir="rtl"
      className="border-b border-[#DDE3EB] bg-white px-6 py-4"
    >
      <div className="mx-auto max-w-[1480px]">
        {/* Breadcrumb */}
        <div className="mb-4 flex items-center gap-3 text-[18px] font-bold">
          <Link
            href={`/career-path/${pathSlug}`}
            className="
              font-black text-[#07152E]
              transition hover:text-[#D49319]
            "
          >
            {pathTitle}
          </Link>

          <span className="text-[18px] font-black text-[#D49319]">
            ←
          </span>

          <span className="text-[18px] font-black text-[#D49319]">
            {courses[safeCurrentIndex]?.title}
          </span>
        </div>

        {/* Desktop journey */}
        <div className="relative hidden h-[80px] lg:block">
          {/* Base road: المسار غير المكتمل */}
<div
  className="
    absolute top-[18px]
    h-[20px] rounded-full bg-[#DDE3EB]
  "
  style={{
    right: `${roadInset}%`,
    left: `${roadInset}%`,
  }}
/>

{/* White markings: الجزء غير المكتمل */}
<div
  className="
    absolute top-[27px]
    h-[2px]
    bg-[repeating-linear-gradient(to_left,#FFFFFF_0_16px,transparent_16px_28px)]
  "
  style={{
    right: `${roadInset}%`,
    left: `${roadInset}%`,
  }}
/>

{/* Completed navy road — يظهر مباشرة */}
<div
  className="
    absolute top-[18px]
    h-[20px] overflow-hidden
    rounded-full bg-[#07152E]
  "
  style={{
    right: `${roadInset}%`,
    width: `${roadSpan * progressRatio}%`,
  }}
>
  {/* Gold markings داخل الجزء المكتمل */}
  <div
    className="
      absolute inset-x-0 top-[9px]
      h-[2px]
      bg-[repeating-linear-gradient(to_left,#F7B548_0_16px,transparent_16px_28px)]
    "
  />
</div>

          {/* Stations */}
          <div
            className="
              absolute inset-x-0 top-[5px]
              grid items-start
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
                    flex-col items-center text-center
                  "
                >
                  <div
                    className={`
                      relative z-10 flex h-[40px] w-[40px]
                      items-center justify-center rounded-full
                      border bg-white text-[15px] font-black
                      transition duration-300
                      ${
                        isCurrent
                          ? `
                            scale-110
                            border-[#F7B548]
                            bg-[#FFF7E3]
                            text-[#07152E]
                            ring-2 ring-[#F7B548]
                            shadow-[0_0_25px_rgba(247,181,72,0.38)]
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
                          absolute -bottom-2
                          h-3 w-3 rotate-45
                          border-b border-r border-[#F7B548]
                          bg-[#FFF7E3]
                        "
                      />
                    )}
                  </div>

                  <p
                    className={`
                      mt-4 max-w-[180px]
                      line-clamp-2
                      text-[13px] font-black leading-5
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

        {/* Mobile journey */}
        <div
          className="
            flex gap-3 overflow-x-auto pb-2
            lg:hidden
            [scrollbar-width:none]
            [&::-webkit-scrollbar]:hidden
          "
        >
          {courses.map((course, index) => {
            const isCurrent =
              course.slug === currentCourseSlug;

            return (
              <Link
                key={course.slug}
                href={`/course/${course.slug}`}
                className={`
                  flex min-w-[145px] items-center gap-3
                  rounded-2xl border px-3 py-2.5
                  transition
                  ${
                    isCurrent
                      ? "border-[#F7B548] bg-[#FFF7E3]"
                      : "border-[#DCE3EC] bg-[#F8FAFC]"
                  }
                `}
              >
                <div
                  className={`
                    flex h-9 w-9 shrink-0
                    items-center justify-center
                    rounded-full text-[12px] font-black
                    ${
                      isCurrent
                        ? "bg-[#F7B548] text-[#07152E]"
                        : "bg-white text-slate-500"
                    }
                  `}
                >
                  {index + 1}
                </div>

                <p className="line-clamp-2 text-[11px] font-black leading-4 text-[#07152E]">
                  {course.title}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}