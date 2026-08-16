import {
  BarChart3,
  Clock3,
  Layers3,
  PlaySquare,
} from "lucide-react";

import type {
  Course,
} from "@/data/types";

import {
  createClient,
} from "@/lib/supabase/server";

type CourseStatsProps = {
  course: Course;
  catalogCourseId: string;
};

type CourseStructureRow = {
  id: string;
  level: string | null;
  difficulty_level: "fundamentals" | "advanced" | null;
  is_active: boolean | null;
};

/*
 * نفس منطق صفحة المسارات المهنية:
 * 31.2 -> 35
 * 35   -> 35
 * 36   -> 40
 */
function roundHoursUpToFive(
  minutes: number,
) {
  if (minutes <= 0) {
    return 0;
  }

  const hours =
    minutes / 60;

  return (
    Math.ceil(hours / 5) * 5
  );
}

async function getRealCourseStats(
  courseId: string,
) {
  const supabase =
    await createClient();

  /*
   * نقرأ الكورس الحالي فقط.
   * level هو نفس حقل "تقسيم الكورس":
   * single = رحلة واحدة
   * split  = رحلتان
   */
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
    .eq(
      "id",
      courseId,
    )
    .maybeSingle();

  if (courseError) {
    console.error(
      "COURSE STATS / COURSE ERROR:",
      courseError,
    );

    return null;
  }

  const courseRow =
    (courseRowData ??
      null) as CourseStructureRow | null;

  if (!courseRow) {
    return {
      journeyCount: 0,
      lessonCount: 0,
      trainingHours: 0,
      levelLabel: "احترافي",
    };
  }

  const journeyCount =
    courseRow.level === "split"
      ? 2
      : 1;

  const levelLabel =
    courseRow.difficulty_level === "fundamentals"
      ? "أساسيات"
      : "احترافي";

  /*
   * لا نقرأ جدول lessons مباشرة هنا.
   * حساب الطالب قد تمنعه RLS من رؤية صفوف الدروس، لذلك نقرأ
   * الإحصائيات العامة فقط من RPC آمنة.
   */
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
      {
        message: lessonStatsError.message,
        details: lessonStatsError.details,
        hint: lessonStatsError.hint,
        code: lessonStatsError.code,
      },
    );

    return {
      journeyCount,
      lessonCount: 0,
      trainingHours: 0,
      levelLabel,
    };
  }

  const publicLessonStats =
    Array.isArray(lessonStatsData)
      ? lessonStatsData[0]
      : lessonStatsData;

  const lessonCount =
    Math.max(
      0,
      Number(
        publicLessonStats?.lesson_count ??
          0,
      ),
    );

  const totalMinutes =
    Math.max(
      0,
      Number(
        publicLessonStats?.total_minutes ??
          0,
      ),
    );

  const trainingHours =
    roundHoursUpToFive(
      totalMinutes,
    );

  return {
    journeyCount,
    lessonCount,
    trainingHours,
    levelLabel,
  };
}

export default async function CourseStats({
  course,
  catalogCourseId,
}: CourseStatsProps) {
  const realStats =
    await getRealCourseStats(
      catalogCourseId,
    );

  /*
   * Fallback فقط إذا حدث خطأ في القراءة.
   */
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

  const levelLabel =
    realStats?.levelLabel ??
    course.statsLevelLabel ??
    "احترافي";

  const items = [
    {
      id: "journeys",
      icon: Layers3,
      value: journeyCount,
      title: "عدد الرحلات",
    },
    {
      id: "lessons",
      icon: PlaySquare,
      value: lessonCount,
      title: "إجمالي المحاضرات",
    },
    {
      id: "hours",
      icon: Clock3,
      value: trainingHours,
      title: "إجمالي الساعات التدريبية",
    },
  ];

  return (
    <section
      dir="rtl"
      className="
        border-y border-[#E2E7EE]
        bg-[#DCE7F2]
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
            index,
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
                    index !==
                    items.length
                      ? "xl:border-l xl:border-[#D9E0E8]"
                      : ""
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
                    {item.value}
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

                </div>
              </article>
            );
          },
        )}

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