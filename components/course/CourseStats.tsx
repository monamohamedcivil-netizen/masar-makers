import {
  BarChart3,
  Clock3,
  Layers3,
  PlaySquare,
} from "lucide-react";

import type {
  Course,
  CourseVariant,
} from "@/data/types";

type CourseStatsProps = {
  course: Course;
};

function extractNumber(
  value?: string | number | null
) {
  if (typeof value === "number") {
    return value;
  }

  if (!value) {
    return 0;
  }

  const match = String(value)
    .replace(/,/g, ".")
    .match(/\d+(\.\d+)?/);

  return match
    ? Number(match[0])
    : 0;
}

function getActiveVariants(
  course: Course
) {
  return [...(course.variants ?? [])]
    .filter((variant) => variant.active)
    .sort(
      (a, b) => a.order - b.order
    );
}

function getCountedVariants(
  course: Course,
  variants: CourseVariant[]
) {
  if (
    course.journeyLayout ===
    "foundation_advanced"
  ) {
    return variants.filter(
      (variant) =>
        variant.type === "fundamental" ||
        variant.type === "advanced"
    );
  }

  return variants.filter(
    (variant) =>
      variant.type !== "integrated"
  );
}

export default function CourseStats({
  course,
}: CourseStatsProps) {
  const variants =
    getActiveVariants(course);

  const countedVariants =
    getCountedVariants(
      course,
      variants
    );

  const calculatedJourneyCount =
    course.journeyLayout ===
    "foundation_advanced"
      ? countedVariants.length
      : 1;

  const calculatedLessons =
    countedVariants.length > 0
      ? countedVariants.reduce(
          (total, variant) =>
            total +
            (
              variant.curriculum ?? []
            ).length,
          0
        )
      : (
          course.curriculum ?? []
        ).length;

  const calculatedHours =
    countedVariants.length > 0
      ? countedVariants.reduce(
          (total, variant) =>
            total +
            extractNumber(
              variant.duration
            ),
          0
        )
      : extractNumber(
          course.duration
        );

  const journeyCount =
    course.statsJourneyCount ??
    calculatedJourneyCount;

  const lessonCount =
    course.statsLessonCount ??
    calculatedLessons;

  const trainingHours =
    course.statsTrainingHours ??
    calculatedHours;

  const levelLabel =
    course.statsLevelLabel ??
    course.level ??
    "من الأساسيات إلى الاحتراف";

  const hasSplitJourney =
    course.journeyLayout ===
    "foundation_advanced";

  const secondaryText =
    hasSplitJourney
      ? "( الأساسيات + المتقدمة )"
      : "رحلة احترافية واحدة";

  const items = [
    {
      id: "journeys",
      icon: Layers3,
      value: journeyCount,
      title: "عدد الرحلات",
      subtitle: secondaryText,
    },
    {
      id: "lessons",
      icon: PlaySquare,
      value: lessonCount,
      title: "إجمالي المحاضرات",
      subtitle: secondaryText,
    },
    {
      id: "hours",
      icon: Clock3,
      value: trainingHours,
      title: "إجمالي الساعات التدريبية",
      subtitle: secondaryText,
    },
  ];

  return (
    <section
      dir="rtl"
      className="
        border-y border-[#E2E7EE]
        bg-[#F7F8FA]
        px-4 py-4
        sm:px-6
      "
    >
      <div
        className="
          mx-auto grid
          max-w-[1450px]
          overflow-hidden
          rounded-[22px]
          border border-[#DCE3EB]
          bg-white
          shadow-[0_12px_34px_rgba(7,21,46,0.09)]

          sm:grid-cols-2
          xl:grid-cols-4
        "
      >
        {items.map(
          (
            item,
            index
          ) => {
            const Icon =
              item.icon;

            return (
              <article
                key={item.id}
                className={`
                  relative flex
                  min-h-[108px]
                  items-center
                  justify-center
                  gap-4 px-5 py-4

                  ${
  index !== items.length - 1
    ? "xl:border-l xl:border-[#D9E0E8]"
    : "xl:border-l xl:border-[#D9E0E8]"
}

                  ${
                    index < 2
                      ? "sm:border-b sm:border-[#D9E0E8] xl:border-b-0"
                      : ""
                  }
                `}
              >
                <Icon
                  size={30}
                  strokeWidth={2}
                  className="
                    shrink-0
                    text-[#D49319]
                  "
                />

                <div className="text-right">
                  <p
                    className="
                      text-[25px]
                      font-black
                      leading-none
                      text-[#D49319]
                    "
                  >
                    {item.id ===
                    "hours" ? (
                      <span dir="ltr">
                        {item.value}+
                      </span>
                    ) : (
                      item.value
                    )}
                  </p>

                  <h3
                    className="
                      mt-2 text-[13px]
                      font-black
                      text-[#07152E]
                    "
                  >
                    {item.title}
                  </h3>

                  <p className="mt-1 text-[10px] font-bold text-slate-500">
                    {item.subtitle}
                  </p>
                </div>
              </article>
            );
          }
        )}

        {/* مستوى الرحلة */}
        <article
          className="
            relative flex
            min-h-[108px]
            items-center
            justify-center
            gap-4 px-5 py-4
          "
        >
          <BarChart3
            size={30}
            strokeWidth={2}
            className="
              shrink-0
              text-[#D49319]
            "
          />

          <div className="text-right">
            <p
              className="
                text-[19px]
                font-black
                leading-6
                text-[#D49319]
              "
            >
              {levelLabel}
            </p>

            <h3
              className="
                mt-2 text-[13px]
                font-black
                text-[#07152E]
              "
            >
              مستوى الرحلة
            </h3>
          </div>
        </article>
      </div>
    </section>
  );
}