import {
  BarChart3,
  Clock3,
  Layers3,
  PlaySquare,
} from "lucide-react";

import type { Course } from "@/data/types";
import { createClient } from "@/lib/supabase/server";
import CourseStatsToggle from "@/components/course/CourseStatsToggle";
type Locale = "ar" | "en";

type CourseStatsProps = {
  course: Course;
  catalogCourseId: string;
  locale?: Locale;
};

type CourseStructureRow = {
  id: string;
  level: string | null;
  difficulty_level: "fundamentals" | "advanced" | null;
  is_active: boolean | null;
};

const labels = {
  ar: {
    journeys: "عدد الرحلات",
    lessons: "إجمالي المحاضرات",
    hours: "إجمالي الساعات",
    level: "مستوى الرحلة",
    professional: "احترافي",
    fundamentals: "أساسيات",
  },
  en: {
    journeys: "Journeys",
    lessons: "Lectures",
    hours: "Training Hours",
    level: "Journey Level",
    professional: "Professional",
    fundamentals: "Fundamentals",
  },
} as const;

function roundHoursUpToFive(minutes: number) {
  if (minutes <= 0) return 0;
  const hours = minutes / 60;
  return Math.ceil(hours / 5) * 5;
}

async function getRealCourseStats(courseId: string) {
  const supabase = await createClient();

  const {
    data: courseRowData,
    error: courseError,
  } = await supabase
    .from("courses")
    .select(`
      id,
      level,
      difficulty_level,
      is_active
    `)
    .eq("id", courseId)
    .maybeSingle();

  if (courseError) {
    console.error(
      "COURSE STATS / COURSE ERROR:",
      courseError,
    );
    return null;
  }

  const courseRow =
    (courseRowData ?? null) as CourseStructureRow | null;

  if (!courseRow) {
    return {
      journeyCount: 0,
      lessonCount: 0,
      trainingHours: 0,
      difficultyLevel: null as
        | "fundamentals"
        | "advanced"
        | null,
    };
  }

  const journeyCount =
    courseRow.level === "split" ? 2 : 1;

  const {
    data: lessonStatsData,
    error: lessonStatsError,
  } = await supabase.rpc(
    "get_course_public_lesson_stats",
    {
      p_course_id: courseId,
    },
  );

  if (lessonStatsError) {
    console.error(
      "COURSE STATS / PUBLIC LESSON STATS ERROR:",
      lessonStatsError,
    );

    return {
      journeyCount,
      lessonCount: 0,
      trainingHours: 0,
      difficultyLevel: courseRow.difficulty_level,
    };
  }

  const publicLessonStats =
    Array.isArray(lessonStatsData)
      ? lessonStatsData[0]
      : lessonStatsData;

  const lessonCount = Math.max(
    0,
    Number(publicLessonStats?.lesson_count ?? 0),
  );

  const totalMinutes = Math.max(
    0,
    Number(publicLessonStats?.total_minutes ?? 0),
  );

  return {
    journeyCount,
    lessonCount,
    trainingHours: roundHoursUpToFive(totalMinutes),
    difficultyLevel: courseRow.difficulty_level,
  };
}

export default async function CourseStats({
  course,
  catalogCourseId,
  locale = "ar",
}: CourseStatsProps) {
  const realStats =
    await getRealCourseStats(catalogCourseId);

  const text = labels[locale];
  const isArabic = locale === "ar";

  const journeyCount =
    realStats?.journeyCount ??
    course.statsJourneyCount ??
    0;

  const lessonCount =
    realStats?.lessonCount ??
    course.statsLessonCount ??
    0;

  const trainingHours =
    realStats?.trainingHours ??
    course.statsTrainingHours ??
    0;

  const difficultyLevel =
    realStats?.difficultyLevel ?? null;

  const levelLabel =
    difficultyLevel === "fundamentals"
      ? text.fundamentals
      : text.professional;

  const items = [
    {
      id: "journeys",
      icon: Layers3,
      value: journeyCount,
      title: text.journeys,
    },
    {
      id: "lessons",
      icon: PlaySquare,
      value: lessonCount,
      title: text.lessons,
    },
    {
      id: "hours",
      icon: Clock3,
      value: trainingHours,
      title: text.hours,
    },
  ];

  return (
  <CourseStatsToggle locale={locale}>
    <section
      dir={isArabic ? "rtl" : "ltr"}
      className="
        border-b border-[#E2E7EE]
        bg-[#DCE7F2]
        px-2 pb-2 pt-1.5
        sm:px-4 sm:pb-3
        lg:px-6 lg:pb-4
      "
    >
      <div
        className="
          mx-auto grid max-w-[1450px]
          grid-cols-4 overflow-hidden
          rounded-[14px]
          border border-[#DCE3EB]
          bg-white
          shadow-[0_8px_22px_rgba(7,21,46,0.07)]
          sm:rounded-[18px]
          lg:rounded-[22px]
        "
      >
        {items.map((item, index) => {
          const Icon = item.icon;

          return (
            <article
              key={item.id}
              className={`
                relative flex min-w-0 min-h-[68px]
                flex-col items-center justify-center
                gap-1 px-1 py-2 text-center
                sm:min-h-[76px] sm:gap-1.5 sm:px-2
                lg:min-h-[108px] lg:flex-row
                lg:gap-4 lg:px-5 lg:py-4
                ${
                  index !== items.length
                    ? "border-l border-[#E6EBF0]"
                    : ""
                }
              `}
            >
              <Icon
                size={17}
                strokeWidth={2}
                className="
                  shrink-0 text-[#D49319]
                  sm:h-[19px] sm:w-[19px]
                  lg:h-[30px] lg:w-[30px]
                "
              />

              <div className="min-w-0 text-center lg:text-right">
                <p
                  className="
                    text-[15px] font-black leading-none
                    text-[#D49319]
                    sm:text-[17px]
                    lg:text-[25px]
                  "
                >
                  {item.value}
                </p>

                <h3
                  className="
                    mt-1 line-clamp-2
                    text-[7px] font-black
                    leading-[1.25] text-[#07152E]
                    sm:text-[8px]
                    lg:mt-2 lg:text-[13px]
                  "
                >
                  {item.title}
                </h3>
              </div>
            </article>
          );
        })}

        <article
          className="
            relative flex min-w-0 min-h-[68px]
            flex-col items-center justify-center
            gap-1 px-1 py-2 text-center
            sm:min-h-[76px] sm:gap-1.5 sm:px-2
            lg:min-h-[108px] lg:flex-row
            lg:gap-4 lg:px-5 lg:py-4
            lg:text-right
          "
        >
          <BarChart3
            size={17}
            strokeWidth={2}
            className="
              shrink-0 text-[#D49319]
              sm:h-[19px] sm:w-[19px]
              lg:h-[30px] lg:w-[30px]
            "
          />

          <div className="min-w-0">
            <p
              className="
                line-clamp-1 text-[11px]
                font-black leading-none
                text-[#D49319]
                sm:text-[12px]
                lg:text-[19px] lg:leading-6
              "
            >
              {levelLabel}
            </p>

            <h3
              className="
                mt-1 line-clamp-2
                text-[7px] font-black
                leading-[1.25] text-[#07152E]
                sm:text-[8px]
                lg:mt-2 lg:text-[13px]
              "
            >
              {text.level}
            </h3>
          </div>
        </article>
      </div>
      </section>
  </CourseStatsToggle>
);
}