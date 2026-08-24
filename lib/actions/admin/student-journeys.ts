"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type StudentJourneySource = "paid" | "reward" | "free";

type CoursePart = "single" | "fundamentals" | "advanced";

export interface StudentJourneyRow {
  id: string;
  courseId: string;
  courseTitle: string;
  courseCode: string | null;
  stationTitle: string | null;
  journeyType: string;
  enrollmentSource: StudentJourneySource;
  status: string;

  /* التقدم الناتج من مشاهدة المحاضرات على المنصة */
  realProgressPercent: number;

  /* التقدم التاريخي المحفوظ من الاستيراد */
  importedProgressPercent: number;

  /*
   * التقدم النهائي المستخدم في النظام:
   * MAX(realProgressPercent, importedProgressPercent)
   */
  progressPercent: number;

  enrolledAt: string;
  updatedAt: string | null;
}

export interface StudentJourneysResult {
  success: boolean;
  message?: string;
  journeys: StudentJourneyRow[];
  statistics: {
    total: number;
    paid: number;
    reward: number;
    active: number;
    completed: number;
    pending: number;
    professional: number;
    oneDay: number;
    free: number;
    averageProgress: number;
  };
}

type EnrollmentRow = {
  id: string;
  course_id: string;
  journey_type: string | null;
  enrollment_source: string | null;
  action_key: string | null;
  status: string | null;

  progress_percent: number | string | null;
  imported_progress_percent: number | string | null;
  split_progress: unknown;
  imported_split_progress: unknown;

  created_at: string;
  updated_at: string | null;
};

type CourseRow = {
  id: string;
  title: string | null;
  title_ar: string | null;
  course_code: string | null;
  station_id: string | null;
};

type StationRow = {
  id: string;
  title: string | null;
  title_ar: string | null;
  name: string | null;
};

type LessonRow = {
  id: string;
  course_id: string;
  course_part: string | null;
  status: string | null;
};

type LessonProgressRow = {
  lesson_id: string;
  completed: boolean | null;
  progress_percent: number | string | null;
};

async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (
    profileError ||
    !profile ||
    !["admin", "super_admin"].includes(String(profile.role))
  ) {
    throw new Error("FORBIDDEN");
  }

  return supabase;
}

function normalizeSource(
  value: string | null,
  journeyType?: string | null,
): StudentJourneySource {
  const normalizedJourneyType =
    normalizeStatus(journeyType);

  if (
    normalizedJourneyType === "free" ||
    normalizedJourneyType === "free_session" ||
    normalizedJourneyType === "free_journey"
  ) {
    return "free";
  }

  return value === "reward" ? "reward" : "paid";
}

function normalizeProgress(
  value: number | string | null | undefined,
) {
  const parsed = Number(value ?? 0);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(100, Math.round(parsed)),
  );
}

function parseProgressObject(
  value: unknown,
): Record<string, number> {
  if (!value) return {};

  let raw: unknown = value;

  if (typeof value === "string") {
    try {
      raw = JSON.parse(value);
    } catch {
      return {};
    }
  }

  if (
    typeof raw !== "object" ||
    raw === null ||
    Array.isArray(raw)
  ) {
    return {};
  }

  const result: Record<string, number> = {};

  for (const [key, item] of Object.entries(
    raw as Record<string, unknown>,
  )) {
    result[key.trim().toLowerCase()] =
      normalizeProgress(
        typeof item === "number" ||
          typeof item === "string"
          ? item
          : 0,
      );
  }

  return result;
}

function getImportedPartProgress(
  enrollment: EnrollmentRow,
  part: CoursePart,
) {
  if (part === "single") {
    return normalizeProgress(
      enrollment.imported_progress_percent,
    );
  }

  const split = parseProgressObject(
    enrollment.imported_split_progress,
  );

  const key =
    part === "fundamentals"
      ? "fundamentals"
      : "advanced";

  if (
    Object.prototype.hasOwnProperty.call(
      split,
      key,
    )
  ) {
    return normalizeProgress(
      split[key],
    );
  }

  return normalizeProgress(
    enrollment.imported_progress_percent,
  );
}

function buildProgressValues(
  realProgressPercent: number,
  importedProgressPercent: number,
) {
  const real = normalizeProgress(
    realProgressPercent,
  );

  const imported = normalizeProgress(
    importedProgressPercent,
  );

  return {
    realProgressPercent: real,
    importedProgressPercent: imported,
    progressPercent: Math.max(
      real,
      imported,
    ),
  };
}

function normalizeStatus(
  value: string | null | undefined,
) {
  return (value ?? "pending").trim().toLowerCase();
}

function normalizeCoursePart(
  value: string | null | undefined,
): CoursePart {
  const normalized = normalizeStatus(value);

  if (
    normalized === "fundamental" ||
    normalized === "fundamentals"
  ) {
    return "fundamentals";
  }

  if (normalized === "advanced") {
    return "advanced";
  }

  return "single";
}

function getCourseTitle(
  course: CourseRow | undefined,
) {
  return (
    course?.title_ar?.trim() ||
    course?.title?.trim() ||
    "كورس غير معروف"
  );
}

function getStationTitle(
  station: StationRow | undefined,
) {
  return (
    station?.title_ar?.trim() ||
    station?.title?.trim() ||
    station?.name?.trim() ||
    null
  );
}

function getPartTitle(
  baseTitle: string,
  part: CoursePart,
) {
  if (part === "fundamentals") {
    return `${baseTitle} - Fundamentals`;
  }

  if (part === "advanced") {
    return `${baseTitle} - Advanced`;
  }

  return baseTitle;
}

function getPartJourneyType(
  part: CoursePart,
  originalJourneyType: string,
) {
  if (part === "fundamentals") {
    return "fundamentals";
  }

  if (part === "advanced") {
    return "advanced";
  }

  return originalJourneyType;
}

function calculatePartProgress(
  lessons: LessonRow[],
  lessonProgressMap: Map<string, LessonProgressRow>,
) {
  if (lessons.length === 0) {
    return 0;
  }

  let accumulatedProgress = 0;

  for (const lesson of lessons) {
    const progress =
      lessonProgressMap.get(lesson.id);

    const percent = normalizeProgress(
      progress?.progress_percent,
    );

    const completed =
      Boolean(progress?.completed) ||
      percent >= 100;

    accumulatedProgress += completed
      ? 100
      : percent;
  }

  return normalizeProgress(
    accumulatedProgress / lessons.length,
  );
}

function enrollmentAllowsPart(
  journeyType: string,
  part: CoursePart,
) {
  const normalized =
    normalizeStatus(journeyType);

  const grantsAll =
    normalized === "integrated" ||
    normalized === "professional" ||
    normalized === "career_path" ||
    normalized === "";

  if (part === "single") {
    return true;
  }

  if (part === "fundamentals") {
    return (
      grantsAll ||
      normalized === "fundamental" ||
      normalized === "fundamentals"
    );
  }

  if (part === "advanced") {
    return (
      grantsAll ||
      normalized === "advanced"
    );
  }

  return false;
}

export async function getStudentJourneys(
  userId: string,
): Promise<StudentJourneysResult> {
  const emptyStatistics = {
    total: 0,
    paid: 0,
    reward: 0,
    active: 0,
    completed: 0,
    pending: 0,
    professional: 0,
    oneDay: 0,
    free: 0,
    averageProgress: 0,
  };

  if (!userId?.trim()) {
    return {
      success: false,
      message: "رقم الطالب غير موجود.",
      journeys: [],
      statistics: emptyStatistics,
    };
  }

  const supabase = await requireAdmin();

  const {
    data: enrollmentData,
    error: enrollmentError,
  } = await supabase
    .from("enrollments")
    .select(
      "id,course_id,journey_type,enrollment_source,action_key,status,progress_percent,imported_progress_percent,split_progress,imported_split_progress,created_at,updated_at",
    )
    .eq("user_id", userId)
    .order("created_at", {
      ascending: false,
    });

  if (enrollmentError) {
    return {
      success: false,
      message: enrollmentError.message,
      journeys: [],
      statistics: emptyStatistics,
    };
  }

  const enrollments =
    (enrollmentData ?? []) as EnrollmentRow[];

  if (enrollments.length === 0) {
    return {
      success: true,
      journeys: [],
      statistics: emptyStatistics,
    };
  }

  const courseIds = Array.from(
    new Set(
      enrollments
        .map((item) => item.course_id)
        .filter(Boolean),
    ),
  );

  /*
   * نحمل بيانات الكورسات + المحاضرات المنشورة.
   * lessons.course_part هو مصدر الحقيقة لتحديد:
   * single / fundamentals / advanced
   */
  const [
    {
      data: courseData,
      error: courseError,
    },
    {
      data: lessonData,
      error: lessonError,
    },
  ] = await Promise.all([
    supabase
      .from("courses")
      .select(
        "id,title,title_ar,course_code,station_id",
      )
      .in("id", courseIds),

    supabase
      .from("lessons")
      .select(
        "id,course_id,course_part,status",
      )
      .in("course_id", courseIds)
      .eq("status", "published"),
  ]);

  if (courseError) {
    return {
      success: false,
      message: courseError.message,
      journeys: [],
      statistics: emptyStatistics,
    };
  }

  if (lessonError) {
    return {
      success: false,
      message: lessonError.message,
      journeys: [],
      statistics: emptyStatistics,
    };
  }

  const courses =
    (courseData ?? []) as CourseRow[];

  const lessons =
    (lessonData ?? []) as LessonRow[];

  const lessonIds = lessons.map(
    (lesson) => lesson.id,
  );

  /*
   * نقرأ التقدم الحقيقي لكل محاضرة.
   */
  let lessonProgressRows: LessonProgressRow[] =
    [];

  if (lessonIds.length > 0) {
    const {
      data: lessonProgressData,
      error: lessonProgressError,
    } = await supabase
      .from("lesson_progress")
      .select(
        "lesson_id,completed,progress_percent",
      )
      .eq("user_id", userId)
      .in("lesson_id", lessonIds);

    if (lessonProgressError) {
      console.error(
        "Failed to load lesson progress:",
        lessonProgressError.message,
      );
    } else {
      lessonProgressRows =
        (lessonProgressData ??
          []) as LessonProgressRow[];
    }
  }

  const stationIds = Array.from(
    new Set(
      courses
        .map((course) => course.station_id)
        .filter(Boolean),
    ),
  ) as string[];

  let stations: StationRow[] = [];

  if (stationIds.length > 0) {
    const {
      data: stationData,
      error: stationError,
    } = await supabase
      .from("course_stations")
      .select(
        "id,title,title_ar,name",
      )
      .in("id", stationIds);

    if (stationError) {
      console.error(
        "Failed to load course stations:",
        stationError.message,
      );
    } else {
      stations =
        (stationData ?? []) as StationRow[];
    }
  }

  const courseMap = new Map(
    courses.map((course) => [
      course.id,
      course,
    ]),
  );

  const stationMap = new Map(
    stations.map((station) => [
      station.id,
      station,
    ]),
  );

  const lessonProgressMap = new Map(
    lessonProgressRows.map((progress) => [
      progress.lesson_id,
      progress,
    ]),
  );

  /*
   * نجمع المحاضرات حسب الكورس ثم حسب الجزء.
   */
  const lessonsByCourse = new Map<
    string,
    LessonRow[]
  >();

  for (const lesson of lessons) {
    const current =
      lessonsByCourse.get(
        lesson.course_id,
      ) ?? [];

    current.push(lesson);

    lessonsByCourse.set(
      lesson.course_id,
      current,
    );
  }

  const journeys: StudentJourneyRow[] =
    [];

  for (const enrollment of enrollments) {
    const course =
      courseMap.get(enrollment.course_id);

    const station = course?.station_id
      ? stationMap.get(
          course.station_id,
        )
      : undefined;

    const baseCourseTitle =
      getCourseTitle(course);

    const originalJourneyType =
      enrollment.journey_type?.trim() ||
      "career_path";

    const courseLessons =
      lessonsByCourse.get(
        enrollment.course_id,
      ) ?? [];

    /*
     * نحدد الأجزاء الموجودة فعليًا من lessons.course_part.
     */
    const fundamentalsLessons =
      courseLessons.filter(
        (lesson) =>
          normalizeCoursePart(
            lesson.course_part,
          ) === "fundamentals",
      );

    const advancedLessons =
      courseLessons.filter(
        (lesson) =>
          normalizeCoursePart(
            lesson.course_part,
          ) === "advanced",
      );

    const singleLessons =
      courseLessons.filter(
        (lesson) =>
          normalizeCoursePart(
            lesson.course_part,
          ) === "single",
      );

    const isSplitCourse =
      fundamentalsLessons.length > 0 ||
      advancedLessons.length > 0;

    const isFreeEnrollment =
      [
        "free",
        "free_session",
        "free_journey",
      ].includes(
        normalizeStatus(
          originalJourneyType,
        ),
      );

    /*
     * الرحلة المجانية تظل رحلة واحدة كما سُجلت،
     * حتى إذا كان الكورس نفسه مقسمًا.
     */
    if (isFreeEnrollment) {
      /*
       * الرحلة المجانية الجديدة مرتبطة بمحاضرة محددة:
       * free:lesson:LESSON_ID
       *
       * لذلك تقدمها يجب أن يُحسب من هذه المحاضرة فقط،
       * وليس من جميع محاضرات الكورس.
       */
      const requestedLessonId =
        enrollment.action_key?.startsWith(
          "free:lesson:",
        )
          ? enrollment.action_key.slice(
              "free:lesson:".length,
            )
          : null;

      const freeJourneyLessons =
        requestedLessonId
          ? courseLessons.filter(
              (lesson) =>
                lesson.id ===
                requestedLessonId,
            )
          : courseLessons;

      journeys.push({
        id: enrollment.id,
        courseId:
          enrollment.course_id,
        courseTitle:
          baseCourseTitle,
        courseCode:
          course?.course_code?.trim() ||
          null,
        stationTitle:
          getStationTitle(station),
        journeyType:
          originalJourneyType,
        enrollmentSource: "free",
        status:
          normalizeStatus(
            enrollment.status,
          ),
        ...buildProgressValues(
          calculatePartProgress(
            freeJourneyLessons,
            lessonProgressMap,
          ),
          normalizeProgress(
            enrollment.imported_progress_percent,
          ),
        ),
        enrolledAt:
          enrollment.created_at,
        updatedAt:
          enrollment.updated_at,
      });

      continue;
    }

    /*
     * رحلة اليوم الواحد الجديدة مرتبطة بمحاضرة محددة:
     * workshop:lesson:LESSON_ID
     *
     * مهم جدًا: لا نحسب تقدم رحلة اليوم الواحد من تقدم الكورس كله
     * أو من رحلة الاحتراف الموجودة على نفس الكورس.
     * كل Workshop له تقدمه المستقل من lesson_progress للمحاضرة المطلوبة فقط.
     */
    const normalizedJourneyType =
      normalizeStatus(originalJourneyType);

    const isOneDayEnrollment =
      [
        "workshop",
        "one_day",
        "one-day",
        "one_day_journey",
        "one_day_workshop",
        "one-day-workshop",
      ].includes(normalizedJourneyType);

    if (isOneDayEnrollment) {
      const requestedLessonId =
        enrollment.action_key?.startsWith(
          "workshop:lesson:",
        )
          ? enrollment.action_key.slice(
              "workshop:lesson:".length,
            )
          : null;

      /*
       * التسجيلات الجديدة يجب أن تكون مرتبطة بمحاضرة واحدة.
       * نحتفظ بدعم التسجيلات القديمة كـ fallback فقط.
       */
      const oneDayJourneyLessons =
        requestedLessonId
          ? courseLessons.filter(
              (lesson) =>
                lesson.id === requestedLessonId,
            )
          : courseLessons;

      journeys.push({
        id: enrollment.id,
        courseId:
          enrollment.course_id,
        courseTitle:
          baseCourseTitle,
        courseCode:
          course?.course_code?.trim() ||
          null,
        stationTitle:
          getStationTitle(station),
        journeyType:
          originalJourneyType,
        enrollmentSource:
          normalizeSource(
            enrollment.enrollment_source,
            enrollment.journey_type,
          ),
        status:
          normalizeStatus(
            enrollment.status,
          ),
        ...buildProgressValues(
          calculatePartProgress(
            oneDayJourneyLessons,
            lessonProgressMap,
          ),
          normalizeProgress(
            enrollment.imported_progress_percent,
          ),
        ),
        enrolledAt:
          enrollment.created_at,
        updatedAt:
          enrollment.updated_at,
      });

      continue;
    }

    /*
     * الكورس المقسم:
     * Integrated = Fundamentals + Advanced.
     *
     * Fundamentals فقط = صف واحد.
     * Advanced فقط = صف واحد.
     */
    if (isSplitCourse) {
      if (
        fundamentalsLessons.length > 0 &&
        enrollmentAllowsPart(
          originalJourneyType,
          "fundamentals",
        )
      ) {
        journeys.push({
          id: `${enrollment.id}:fundamentals`,
          courseId:
            enrollment.course_id,
          courseTitle:
            getPartTitle(
              baseCourseTitle,
              "fundamentals",
            ),
          courseCode:
            course?.course_code?.trim() ||
            null,
          stationTitle:
            getStationTitle(station),
          journeyType:
            getPartJourneyType(
              "fundamentals",
              originalJourneyType,
            ),
          enrollmentSource:
            normalizeSource(
              enrollment.enrollment_source,
              enrollment.journey_type,
            ),
          status:
            normalizeStatus(
              enrollment.status,
            ),
          ...buildProgressValues(
            calculatePartProgress(
              fundamentalsLessons,
              lessonProgressMap,
            ),
            getImportedPartProgress(
              enrollment,
              "fundamentals",
            ),
          ),
          enrolledAt:
            enrollment.created_at,
          updatedAt:
            enrollment.updated_at,
        });
      }

      if (
        advancedLessons.length > 0 &&
        enrollmentAllowsPart(
          originalJourneyType,
          "advanced",
        )
      ) {
        journeys.push({
          id: `${enrollment.id}:advanced`,
          courseId:
            enrollment.course_id,
          courseTitle:
            getPartTitle(
              baseCourseTitle,
              "advanced",
            ),
          courseCode:
            course?.course_code?.trim() ||
            null,
          stationTitle:
            getStationTitle(station),
          journeyType:
            getPartJourneyType(
              "advanced",
              originalJourneyType,
            ),
          enrollmentSource:
            normalizeSource(
              enrollment.enrollment_source,
              enrollment.journey_type,
            ),
          status:
            normalizeStatus(
              enrollment.status,
            ),
          ...buildProgressValues(
            calculatePartProgress(
              advancedLessons,
              lessonProgressMap,
            ),
            getImportedPartProgress(
              enrollment,
              "advanced",
            ),
          ),
          enrolledAt:
            enrollment.created_at,
          updatedAt:
            enrollment.updated_at,
        });
      }

      /*
       * إذا كان الكورس معرفًا كمقسم ولكن لا توجد محاضرات
       * للجزء الذي يسمح به الاشتراك، لا ننشئ صفًا وهميًا.
       */
      continue;
    }

    /*
     * الكورس غير المقسم يظل صفًا واحدًا.
     */
    journeys.push({
      id: enrollment.id,
      courseId:
        enrollment.course_id,
      courseTitle:
        baseCourseTitle,
      courseCode:
        course?.course_code?.trim() ||
        null,
      stationTitle:
        getStationTitle(station),
      journeyType:
        originalJourneyType,
      enrollmentSource:
        normalizeSource(
          enrollment.enrollment_source,
          enrollment.journey_type,
        ),
      status:
        normalizeStatus(
          enrollment.status,
        ),
      ...buildProgressValues(
        calculatePartProgress(
          singleLessons,
          lessonProgressMap,
        ),
        getImportedPartProgress(
          enrollment,
          "single",
        ),
      ),
      enrolledAt:
        enrollment.created_at,
      updatedAt:
        enrollment.updated_at,
    });
  }

  /*
   * الإحصائيات تحسب الرحلات التعليمية الناتجة،
   * وليس عدد صفوف enrollments الخام.
   *
   * لذلك Integrated المقسم إلى Fundamentals + Advanced
   * يحسب رحلتين.
   */
  const statistics = journeys.reduce(
    (result, journey) => {
      result.total += 1;

      const journeyKind = normalizeStatus(
        journey.journeyType,
      );

      if (
        [
          "workshop",
          "one_day",
          "one-day",
          "one_day_journey",
          "one_day_workshop",
          "one-day-workshop",
        ].includes(journeyKind)
      ) {
        result.oneDay += 1;
      } else if (
        [
          "free",
          "free_session",
          "free-session",
          "free_journey",
        ].includes(journeyKind)
      ) {
        result.free += 1;
      } else {
        result.professional += 1;
      }

      if (
        journey.enrollmentSource ===
        "reward"
      ) {
        result.reward += 1;
      } else if (
        journey.enrollmentSource ===
        "paid"
      ) {
        result.paid += 1;
      }

      const isCompleted =
        journey.status === "completed" ||
        journey.progressPercent >= 100;

      const isPending =
        journey.status === "pending";

      const isActiveStatus = [
        "active",
        "approved",
        "enrolled",
        "confirmed",
      ].includes(journey.status);

      /*
       * الرحلة المكتملة لا تُحسب مرة ثانية كرحلة نشطة.
       * هذا يجعل الإحصائيات متطابقة مع صفحة الطالب:
       * active = فعالة وغير مكتملة.
       */
      if (
        isActiveStatus &&
        !isCompleted
      ) {
        result.active += 1;
      }

      if (isCompleted) {
        result.completed += 1;
      }

      if (isPending) {
        result.pending += 1;
      }

      return result;
    },
    { ...emptyStatistics },
  );

  /*
   * متوسط التقدم الرسمي يعتمد فقط على progressPercent النهائي،
   * ويستبعد الرحلات المعلقة لأنها لم تُفعّل بعد.
   */
  const progressJourneys = journeys.filter(
    (journey) => journey.status !== "pending",
  );

  statistics.averageProgress =
    progressJourneys.length > 0
      ? Math.round(
          progressJourneys.reduce(
            (sum, journey) =>
              sum + journey.progressPercent,
            0,
          ) / progressJourneys.length,
        )
      : 0;

  return {
    success: true,
    journeys,
    statistics,
  };
}