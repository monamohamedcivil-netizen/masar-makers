import { createClient } from "@/lib/supabase/server";

export type StudentCourseCard = {
  enrollmentId: string;
  courseId: string;
  slug: string;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  journeyTitle: string | null;
  progressPercent: number;
  completedLessons: number;
  totalLessons: number;
  status: "not_started" | "in_progress" | "completed";
  lastLessonId: string | null;
  lastLessonTitle: string | null;
  lastActivityAt: string | null;
  enrollmentStatus: string;
  journeyType: string | null;
  actionKey: string | null;
  actionTitle: string | null;
};

export type StudentPathStationProgress = {
  stationId: string;
  stationSlug: string;
  title: string;
  shortTitle: string;
  iconUrl: string | null;
  displayOrder: number;
  progressPercent: number;
  completedLessons: number;
  totalLessons: number;
  enrollmentStatus: string | null;
  status:
    | "not_enrolled"
    | "pending"
    | "not_started"
    | "in_progress"
    | "completed";
  isEnrolled: boolean;
  courseSlug: string;
  courseHref: string;
};

export type StudentCareerPathProgress = {
  pathId: string;
  slug: string;
  title: string;
  shortTitle: string;
  progressPercent: number;
  totalStations: number;
  enrolledStations: number;
  completedStations: number;
  stations: StudentPathStationProgress[];
};

export type StudentOneDayJourney = {
  enrollmentId: string;
  courseId: string;
  slug: string;
  title: string;
  categoryId: string;
  categoryTitle: string;
  progressPercent: number;
  status: "not_started" | "in_progress" | "completed";
  lessonId: string | null;
  href: string;
};

export type StudentOneDayJourneyGroup = {
  id: string;
  title: string;
  displayOrder: number;
  journeys: StudentOneDayJourney[];
};

export type StudentFreeJourney = StudentOneDayJourney;

export type StudentFreeJourneyGroup = {
  id: string;
  title: string;
  displayOrder: number;
  journeys: StudentFreeJourney[];
};

export type StudentNextStepKind =
  | "professional"
  | "one_day"
  | "free";

export type StudentNextStepItem = {
  id: string;
  enrollmentId: string;
  courseId: string;
  lessonId: string;
  lessonTitle: string;
  progressPercent: number;
  remainingMinutes: number | null;
  actionLabel: "ابدأ" | "استكمل";
  href: string;
  courseOrder: number;
  lessonOrder: number;
};

export type StudentNextStepStationGroup = {
  id: string;
  title: string;
  displayOrder: number;
  items: StudentNextStepItem[];
};

export type StudentNextStepSection = {
  kind: StudentNextStepKind;
  title: string;
  groups: StudentNextStepStationGroup[];
};

export type StudentDashboardData = {
  studentName: string;
  studentEmail: string;
  activeCourses: StudentCourseCard[];
  pendingCourses: StudentCourseCard[];
  completedCourses: StudentCourseCard[];
  careerPaths: StudentCareerPathProgress[];
  oneDayJourneyGroups: StudentOneDayJourneyGroup[];
  freeJourneyGroups: StudentFreeJourneyGroup[];
  nextStepSections: StudentNextStepSection[];
  summary: {
    active: number;
    completed: number;
    pending: number;
    averageProgress: number;
  };
};

type EnrollmentRow = {
  id: string;
  course_id: string;
  status: string | null;
  journey_type: string | null;
  action_key: string | null;
  action_title: string | null;
};

type CourseRow = {
  id: string;
  slug: string;
  title: string;
  title_ar: string | null;
  subtitle: string | null;
  image_url: string | null;
  station_id: string | null;
  is_featured?: boolean;
  is_active?: boolean;
  display_order?: number;
};

type StationRow = {
  id: string;
  career_path_id: string | null;
  slug?: string;
  title?: string;
  short_title?: string | null;
  icon_url?: string | null;
  display_order?: number;
  is_active?: boolean;
};

type CareerPathRow = {
  id: string;
  slug?: string;
  title: string | null;
  title_ar: string | null;
  short_title?: string | null;
  display_order?: number;
  is_active?: boolean;
};

type StoredCourseProgressRow = {
  course_id: string;
  progress_percent: number | string | null;
  completed_lessons: number | null;
  total_lessons: number | null;
  status: "not_started" | "in_progress" | "completed" | null;
  last_lesson_id: string | null;
  last_activity_at: string | null;
};

type LessonRow = {
  id: string;
  course_id: string;
  title: string;
  title_ar: string | null;
  status: string | null;
  sort_order: number;
};

type LessonProgressRow = {
  lesson_id: string;
  completed: boolean;
  progress_percent: number | string | null;
  last_position_seconds: number | null;
  started_at: string | null;
  completed_at: string | null;
  last_watched_at: string | null;
  updated_at: string | null;
};

type CalculatedCourseProgress = {
  progressPercent: number;
  completedLessons: number;
  totalLessons: number;
  status: StudentCourseCard["status"];
  lastLessonId: string | null;
  lastLessonTitle: string | null;
  lastActivityAt: string | null;
};

function normalizeStatus(status: string | null | undefined) {
  return (status ?? "").trim().toLowerCase();
}

function clampPercent(value: number | string | null | undefined) {
  const numericValue = Number(value ?? 0);

  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  return Math.max(0, Math.min(100, numericValue));
}

function parseTimestamp(value: string | null | undefined) {
  if (!value) return 0;

  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function latestActivityDate(progress: LessonProgressRow) {
  return (
    progress.last_watched_at ??
    progress.completed_at ??
    progress.updated_at ??
    progress.started_at ??
    null
  );
}

function createEmptyNextStepSections(): StudentNextStepSection[] {
  return [
    {
      kind: "professional",
      title: "رحلة الاحتراف",
      groups: [],
    },
    {
      kind: "one_day",
      title: "رحلة اليوم الواحد",
      groups: [],
    },
    {
      kind: "free",
      title: "الرحلات المجانية",
      groups: [],
    },
  ];
}

function estimateRemainingMinutes(
  progressPercent: number,
  lastPositionSeconds: number | null | undefined,
) {
  const watchedSeconds = Math.max(0, Number(lastPositionSeconds ?? 0));

  if (
    watchedSeconds <= 0 ||
    progressPercent <= 0 ||
    progressPercent >= 100
  ) {
    return null;
  }

  const estimatedDurationSeconds =
    watchedSeconds / (progressPercent / 100);
  const remainingSeconds = Math.max(
    0,
    estimatedDurationSeconds - watchedSeconds,
  );

  return Math.max(1, Math.ceil(remainingSeconds / 60));
}

function emptyDashboard(
  studentName: string,
  studentEmail: string,
): StudentDashboardData {
  return {
    studentName,
    studentEmail,
    activeCourses: [],
    pendingCourses: [],
    completedCourses: [],
    careerPaths: [],
    oneDayJourneyGroups: [],
    freeJourneyGroups: [],
    nextStepSections: createEmptyNextStepSections(),
    summary: {
      active: 0,
      completed: 0,
      pending: 0,
      averageProgress: 0,
    },
  };
}

/*
 * student_course_progress remains a useful cached/summary source.
 * The real lesson rows below take priority whenever lessons exist.
 */
async function loadStoredCourseProgressRows(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  courseIds: string[],
): Promise<StoredCourseProgressRow[]> {
  const columns =
    "course_id,progress_percent,completed_lessons,total_lessons,status,last_lesson_id,last_activity_at";

  const result = await supabase
    .from("student_course_progress")
    .select(columns)
    .eq("user_id", userId)
    .in("course_id", courseIds);

  if (result.error) {
    console.error(
      "Failed to load student_course_progress:",
      result.error.message,
    );
    return [];
  }

  return (result.data ?? []) as StoredCourseProgressRow[];
}

async function loadLessonProgressRows(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  lessonIds: string[],
): Promise<LessonProgressRow[]> {
  if (lessonIds.length === 0) {
    return [];
  }

  const result = await supabase
    .from("lesson_progress")
    .select(
      "lesson_id,completed,progress_percent,last_position_seconds,started_at,completed_at,last_watched_at,updated_at",
    )
    .eq("user_id", userId)
    .in("lesson_id", lessonIds);

  if (result.error) {
    console.error("Failed to load lesson_progress:", result.error.message);
    return [];
  }

  return (result.data ?? []) as LessonProgressRow[];
}

function calculateCourseProgress(
  courseId: string,
  courseLessons: LessonRow[],
  lessonProgressMap: Map<string, LessonProgressRow>,
  storedProgress: StoredCourseProgressRow | undefined,
): CalculatedCourseProgress {
  const totalLessons = courseLessons.length;

  /*
   * If the course has no published lessons yet, keep the stored summary
   * as a fallback so existing dashboard data does not disappear.
   */
  if (totalLessons === 0) {
    const progressPercent = clampPercent(storedProgress?.progress_percent);
    const completedLessons = Math.max(
      0,
      Number(storedProgress?.completed_lessons ?? 0),
    );

    return {
      progressPercent,
      completedLessons,
      totalLessons: Math.max(
        0,
        Number(storedProgress?.total_lessons ?? 0),
      ),
      status:
        storedProgress?.status ??
        (progressPercent >= 100
          ? "completed"
          : progressPercent > 0
            ? "in_progress"
            : "not_started"),
      lastLessonId: storedProgress?.last_lesson_id ?? null,
      lastLessonTitle: null,
      lastActivityAt: storedProgress?.last_activity_at ?? null,
    };
  }

  let completedLessons = 0;
  let accumulatedProgress = 0;
  let lastLessonId: string | null = null;
  let lastLessonTitle: string | null = null;
  let lastActivityAt: string | null = null;
  let lastActivityTimestamp = 0;

  for (const lesson of courseLessons) {
    const lessonProgress = lessonProgressMap.get(lesson.id);
    const lessonPercent = lessonProgress
      ? clampPercent(lessonProgress.progress_percent)
      : 0;

    const completed =
      Boolean(lessonProgress?.completed) || lessonPercent >= 100;

    if (completed) {
      completedLessons += 1;
    }

    accumulatedProgress += completed ? 100 : lessonPercent;

    if (lessonProgress) {
      const activityDate = latestActivityDate(lessonProgress);
      const activityTimestamp = parseTimestamp(activityDate);

      if (activityTimestamp > lastActivityTimestamp) {
        lastActivityTimestamp = activityTimestamp;
        lastActivityAt = activityDate;
        lastLessonId = lesson.id;
        lastLessonTitle =
          lesson.title_ar?.trim() || lesson.title.trim() || null;
      }
    }
  }

  const progressPercent = Math.round(
    accumulatedProgress / totalLessons,
  );

  const status: StudentCourseCard["status"] =
    completedLessons >= totalLessons
      ? "completed"
      : progressPercent > 0
        ? "in_progress"
        : "not_started";

  return {
    progressPercent: clampPercent(progressPercent),
    completedLessons,
    totalLessons,
    status,
    lastLessonId,
    lastLessonTitle,
    lastActivityAt,
  };
}

export async function getStudentDashboardData(): Promise<StudentDashboardData> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("UNAUTHENTICATED");
  }

  const [{ data: profile }, enrollmentResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name,email")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("enrollments")
      .select("id,course_id,status,journey_type,action_key,action_title")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  if (enrollmentResult.error) {
    throw new Error(enrollmentResult.error.message);
  }

  const studentName =
    profile?.full_name?.trim() ||
    user.user_metadata?.full_name ||
    "مهندس مسار";

  const studentEmail = profile?.email || user.email || "";

  const enrollmentRows = (enrollmentResult.data ?? []) as EnrollmentRow[];

  const courseIds = [
    ...new Set(
      enrollmentRows
        .map((item) => item.course_id)
        .filter((courseId): courseId is string => Boolean(courseId)),
    ),
  ];

  if (courseIds.length === 0) {
    return emptyDashboard(studentName, studentEmail);
  }

  const coursesResult = await supabase
    .from("courses")
    .select("id,slug,title,title_ar,subtitle,image_url,station_id")
    .in("id", courseIds);

  if (coursesResult.error) {
    throw new Error(coursesResult.error.message);
  }

  const courseRows = (coursesResult.data ?? []) as CourseRow[];

  const stationIds = [
    ...new Set(
      courseRows
        .map((course) => course.station_id)
        .filter((stationId): stationId is string => Boolean(stationId)),
    ),
  ];

  /*
   * lessons does not contain is_published.
   * Published lessons are identified through the status enum.
   */
  const [storedProgressRows, lessonsResult, stationsResult] =
    await Promise.all([
      loadStoredCourseProgressRows(supabase, user.id, courseIds),
      supabase
        .from("lessons")
        .select(
          "id,course_id,title,title_ar,status,sort_order",
        )
        .in("course_id", courseIds)
        .eq("status", "published")
        .order("sort_order", { ascending: true }),
      stationIds.length
        ? supabase
            .from("course_stations")
            .select("id,career_path_id")
            .in("id", stationIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

  if (lessonsResult.error) {
    console.error("Failed to load lessons:", lessonsResult.error.message);
  }

  const lessonRows = lessonsResult.error
    ? []
    : ((lessonsResult.data ?? []) as LessonRow[]);

  const lessonIds = lessonRows.map((lesson) => lesson.id);

  const lessonProgressRows = await loadLessonProgressRows(
    supabase,
    user.id,
    lessonIds,
  );

  const enrolledStationRows = stationsResult.error
    ? []
    : ((stationsResult.data ?? []) as StationRow[]);

  const careerPathIds = [
    ...new Set(
      enrolledStationRows
        .map((station) => station.career_path_id)
        .filter((pathId): pathId is string => Boolean(pathId)),
    ),
  ];

  /*
   * نحمّل جميع محطات المسارات التي اشترك الطالب في محطة واحدة منها على الأقل.
   * لا نحمّل مسارات أخرى لا تخص اشتراكاته الحالية.
   */
  const [careerPathsResult, allStationsResult] = await Promise.all([
    careerPathIds.length
      ? supabase
          .from("career_paths")
          .select(
            "id,slug,title,title_ar,short_title,display_order,is_active",
          )
          .in("id", careerPathIds)
          .eq("is_active", true)
          .order("display_order", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
    careerPathIds.length
      ? supabase
          .from("course_stations")
          .select(
            "id,career_path_id,slug,title,short_title,icon_url,display_order,is_active",
          )
          .in("career_path_id", careerPathIds)
          .eq("is_active", true)
          .order("display_order", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
  ]);

  const careerPathRows = careerPathsResult.error
    ? []
    : ((careerPathsResult.data ?? []) as CareerPathRow[]);

  const stationRows = allStationsResult.error
    ? enrolledStationRows
    : ((allStationsResult.data ?? []) as StationRow[]);

  const allStationIds = stationRows.map((station) => station.id);

  const allPathCoursesResult = allStationIds.length
    ? await supabase
        .from("courses")
        .select(
          "id,slug,title,title_ar,subtitle,image_url,station_id,is_featured,is_active,display_order",
        )
        .in("station_id", allStationIds)
        .eq("is_active", true)
        .order("display_order", { ascending: true })
    : { data: [], error: null };

  const allPathCourseRows = allPathCoursesResult.error
    ? courseRows
    : ((allPathCoursesResult.data ?? []) as CourseRow[]);

  const coursesMap = new Map(
    courseRows.map((course) => [course.id, course]),
  );

  const storedProgressMap = new Map(
    storedProgressRows.map((progress) => [
      progress.course_id,
      progress,
    ]),
  );

  const lessonProgressMap = new Map(
    lessonProgressRows.map((progress) => [
      progress.lesson_id,
      progress,
    ]),
  );

  const lessonsByCourse = new Map<string, LessonRow[]>();

  for (const lesson of lessonRows) {
    const existing = lessonsByCourse.get(lesson.course_id) ?? [];
    existing.push(lesson);
    lessonsByCourse.set(lesson.course_id, existing);
  }

  const stationMap = new Map(
    stationRows.map((station) => [station.id, station]),
  );

  const careerPathMap = new Map(
    careerPathRows.map((path) => [
      path.id,
      path.title_ar?.trim() || path.title?.trim() || null,
    ]),
  );

  const allCoursesByStation = new Map<string, CourseRow[]>();

  for (const course of allPathCourseRows) {
    if (!course.station_id) continue;

    const current = allCoursesByStation.get(course.station_id) ?? [];
    current.push(course);
    allCoursesByStation.set(course.station_id, current);
  }

  const cards = enrollmentRows
    .map((enrollment): StudentCourseCard | null => {
      const course = coursesMap.get(enrollment.course_id);

      if (!course) {
        return null;
      }

      const calculatedProgress = calculateCourseProgress(
        course.id,
        lessonsByCourse.get(course.id) ?? [],
        lessonProgressMap,
        storedProgressMap.get(course.id),
      );

      const station = course.station_id
        ? stationMap.get(course.station_id)
        : undefined;

      const journeyTitle = station?.career_path_id
        ? careerPathMap.get(station.career_path_id) ?? null
        : null;

      const enrollmentStatus = enrollment.status ?? "active";

      const derivedStatus: StudentCourseCard["status"] =
        normalizeStatus(enrollmentStatus) === "completed"
          ? "completed"
          : calculatedProgress.status;

      return {
        enrollmentId: enrollment.id,
        courseId: course.id,
        slug: course.slug,
        title: course.title_ar || course.title,
        subtitle: course.subtitle,
        imageUrl: course.image_url,
        journeyTitle,
        progressPercent: calculatedProgress.progressPercent,
        completedLessons: calculatedProgress.completedLessons,
        totalLessons: calculatedProgress.totalLessons,
        status: derivedStatus,
        lastLessonId: calculatedProgress.lastLessonId,
        lastLessonTitle: calculatedProgress.lastLessonTitle,
        lastActivityAt: calculatedProgress.lastActivityAt,
        enrollmentStatus,
        journeyType: enrollment.journey_type,
        actionKey: enrollment.action_key,
        actionTitle: enrollment.action_title,
      };
    })
    .filter((card): card is StudentCourseCard => Boolean(card));

  const activeStatusValues = new Set([
    "active",
    "approved",
    "enrolled",
    "confirmed",
  ]);

  const pendingStatusValues = new Set([
    "pending",
    "requested",
    "waiting",
    "under_review",
  ]);

  const completedCourses = cards.filter(
    (card) =>
      normalizeStatus(card.enrollmentStatus) === "completed" ||
      card.status === "completed",
  );

  const completedIds = new Set(
    completedCourses.map((course) => course.enrollmentId),
  );

  const pendingCourses = cards.filter(
    (card) =>
      !completedIds.has(card.enrollmentId) &&
      pendingStatusValues.has(
        normalizeStatus(card.enrollmentStatus),
      ),
  );

  const pendingIds = new Set(
    pendingCourses.map((course) => course.enrollmentId),
  );

  const activeCourses = cards.filter(
    (card) =>
      !completedIds.has(card.enrollmentId) &&
      !pendingIds.has(card.enrollmentId) &&
      (activeStatusValues.has(
        normalizeStatus(card.enrollmentStatus),
      ) ||
        !normalizeStatus(card.enrollmentStatus)),
  );

  const averageProgress = activeCourses.length
    ? Math.round(
        activeCourses.reduce(
          (sum, course) => sum + course.progressPercent,
          0,
        ) / activeCourses.length,
      )
    : 0;

  const cardsByCourseId = new Map(
    cards.map((card) => [card.courseId, card]),
  );

  const pendingStatusSet = new Set([
    "pending",
    "requested",
    "waiting",
    "under_review",
  ]);

  const careerPaths: StudentCareerPathProgress[] = careerPathRows
    .map((path) => {
      const pathStations = stationRows
        .filter((station) => station.career_path_id === path.id)
        .sort(
          (a, b) =>
            Number(a.display_order ?? 0) -
            Number(b.display_order ?? 0),
        );

      const stations: StudentPathStationProgress[] = pathStations.map(
        (station) => {
          const stationCourses = (
            allCoursesByStation.get(station.id) ?? []
          ).sort((a, b) => {
            if (Boolean(a.is_featured) !== Boolean(b.is_featured)) {
              return a.is_featured ? -1 : 1;
            }

            const aIntegrated = a.slug.includes("integrated") ? 0 : 1;
            const bIntegrated = b.slug.includes("integrated") ? 0 : 1;

            return (
              aIntegrated - bIntegrated ||
              Number(a.display_order ?? 0) -
                Number(b.display_order ?? 0)
            );
          });

          const enrolledCards = stationCourses
            .map((course) => cardsByCourseId.get(course.id))
            .filter(
              (card): card is StudentCourseCard => Boolean(card),
            )
            .sort(
              (a, b) =>
                b.progressPercent - a.progressPercent ||
                Number(
                  new Date(b.lastActivityAt ?? 0).getTime(),
                ) -
                  Number(
                    new Date(a.lastActivityAt ?? 0).getTime(),
                  ),
            );

          const enrolledCard = enrolledCards[0];
          const representativeCourse =
            stationCourses.find((course) => course.is_featured) ??
            stationCourses.find((course) =>
              course.slug.includes("integrated"),
            ) ??
            stationCourses[0];

          const isEnrolled = Boolean(enrolledCard);
          const normalizedEnrollmentStatus = normalizeStatus(
            enrolledCard?.enrollmentStatus,
          );

          const stationStatus: StudentPathStationProgress["status"] =
            !isEnrolled
              ? "not_enrolled"
              : pendingStatusSet.has(normalizedEnrollmentStatus)
                ? "pending"
                : enrolledCard.status === "completed" ||
                    enrolledCard.progressPercent >= 100
                  ? "completed"
                  : enrolledCard.progressPercent > 0
                    ? "in_progress"
                    : "not_started";

          const stationSlug =
            station.slug ??
            representativeCourse?.slug ??
            station.id;

          return {
            stationId: station.id,
            stationSlug,
            title:
              station.title ??
              representativeCourse?.title_ar ??
              representativeCourse?.title ??
              "رحلة تعليمية",
            shortTitle:
              station.short_title?.trim() ||
              station.title?.trim() ||
              representativeCourse?.title_ar?.trim() ||
              representativeCourse?.title?.trim() ||
              "رحلة",
            iconUrl: station.icon_url ?? null,
            displayOrder: Number(station.display_order ?? 0),
            progressPercent: enrolledCard?.progressPercent ?? 0,
            completedLessons: enrolledCard?.completedLessons ?? 0,
            totalLessons: enrolledCard?.totalLessons ?? 0,
            enrollmentStatus:
              enrolledCard?.enrollmentStatus ?? null,
            status: stationStatus,
            isEnrolled,
            courseSlug:
              enrolledCard?.slug ??
              representativeCourse?.slug ??
              stationSlug,
            /*
             * صفحة الكورس العامة تقبل Slug المحطة،
             * وهي الصفحة المستخدمة لطلب الاشتراك.
             */
            courseHref: `/course/${stationSlug}`,
          };
        },
      );

      const enrolledStations = stations.filter(
        (station) => station.isEnrolled,
      ).length;

      /*
       * لا يظهر المسار إلا إذا كان الطالب مسجلًا في محطة واحدة منه على الأقل.
       */
      if (enrolledStations === 0) {
        return null;
      }

      const totalStations = stations.length;
      const progressPercent = totalStations
        ? Math.round(
            stations.reduce(
              (sum, station) =>
                sum + station.progressPercent,
              0,
            ) / totalStations,
          )
        : 0;

      return {
        pathId: path.id,
        slug: path.slug ?? path.id,
        title:
          path.title_ar?.trim() ||
          path.title?.trim() ||
          "مسار مهني",
        shortTitle:
          path.short_title?.trim() ||
          path.title_ar?.trim() ||
          path.title?.trim() ||
          "مسار مهني",
        progressPercent,
        totalStations,
        enrolledStations,
        completedStations: stations.filter(
          (station) => station.status === "completed",
        ).length,
        stations,
      } satisfies StudentCareerPathProgress;
    })
    .filter(
      (
        path,
      ): path is StudentCareerPathProgress => Boolean(path),
    );

  const oneDayJourneyTypeValues = new Set([
    "workshop",
    "one_day",
    "one-day",
    "one_day_workshop",
    "one-day-workshop",
  ]);

  const accessibleOneDayCards = cards.filter((card) => {
    const journeyType = normalizeStatus(card.journeyType);
    const enrollmentStatus = normalizeStatus(card.enrollmentStatus);

    return (
      oneDayJourneyTypeValues.has(journeyType) &&
      !pendingStatusValues.has(enrollmentStatus)
    );
  });

  const oneDayGroupsMap = new Map<
    string,
    StudentOneDayJourneyGroup
  >();

  for (const card of accessibleOneDayCards) {
    const course = coursesMap.get(card.courseId);
    const station = course?.station_id
      ? stationMap.get(course.station_id)
      : undefined;

    const categoryId =
      station?.id ??
      course?.station_id ??
      `course:${card.courseId}`;

    const categoryTitle =
      station?.title?.trim() ||
      course?.title_ar?.trim() ||
      course?.title?.trim() ||
      "محطة تعليمية";

    const categoryDisplayOrder = Number(
      station?.display_order ?? course?.display_order ?? 9999,
    );

    const firstLesson =
      lessonsByCourse.get(card.courseId)?.[0] ?? null;

    const lessonId =
      card.lastLessonId ??
      firstLesson?.id ??
      null;

    const href = lessonId
      ? `/course/${card.slug}?lesson=${lessonId}`
      : `/course/${card.slug}`;

    const group =
      oneDayGroupsMap.get(categoryId) ?? {
        id: categoryId,
        title: categoryTitle,
        displayOrder: categoryDisplayOrder,
        journeys: [],
      };

    group.journeys.push({
      enrollmentId: card.enrollmentId,
      courseId: card.courseId,
      slug: card.slug,
      title: card.actionTitle?.trim() || card.title,
      categoryId,
      categoryTitle,
      progressPercent: card.progressPercent,
      status: card.status,
      lessonId,
      href,
    });

    oneDayGroupsMap.set(categoryId, group);
  }

  const oneDayJourneyGroups = [...oneDayGroupsMap.values()]
    .map((group) => ({
      ...group,
      journeys: [...group.journeys].sort((a, b) =>
        a.title.localeCompare(b.title, "ar"),
      ),
    }))
    .sort(
      (a, b) =>
        a.displayOrder - b.displayOrder ||
        a.title.localeCompare(b.title, "ar"),
    );

  const accessibleFreeCards = cards.filter((card) => {
    const journeyType = normalizeStatus(card.journeyType);
    const enrollmentStatus = normalizeStatus(card.enrollmentStatus);

    return (
      (journeyType === "free" || journeyType === "free_session") &&
      !pendingStatusValues.has(enrollmentStatus) &&
      enrollmentStatus !== "rejected" &&
      enrollmentStatus !== "suspended" &&
      enrollmentStatus !== "expired" &&
      enrollmentStatus !== "cancelled"
    );
  });

  const freeGroupsMap = new Map<string, StudentFreeJourneyGroup>();

  for (const card of accessibleFreeCards) {
    const course = coursesMap.get(card.courseId);
    const station = course?.station_id
      ? stationMap.get(course.station_id)
      : undefined;

    const categoryId =
      station?.id ??
      course?.station_id ??
      `course:${card.courseId}`;

    const categoryTitle =
      station?.title?.trim() ||
      course?.title_ar?.trim() ||
      course?.title?.trim() ||
      "محطة تعليمية";

    const categoryDisplayOrder = Number(
      station?.display_order ?? course?.display_order ?? 9999,
    );

    const firstLesson =
      lessonsByCourse.get(card.courseId)?.[0] ?? null;

    const lessonId =
      card.lastLessonId ??
      firstLesson?.id ??
      null;

    const href = lessonId
      ? `/course/${card.slug}?lesson=${lessonId}`
      : `/course/${card.slug}`;

    const group =
      freeGroupsMap.get(categoryId) ?? {
        id: categoryId,
        title: categoryTitle,
        displayOrder: categoryDisplayOrder,
        journeys: [],
      };

    group.journeys.push({
      enrollmentId: card.enrollmentId,
      courseId: card.courseId,
      slug: card.slug,
      title: card.actionTitle?.trim() || card.title,
      categoryId,
      categoryTitle,
      progressPercent: card.progressPercent,
      status: card.status,
      lessonId,
      href,
    });

    freeGroupsMap.set(categoryId, group);
  }

  const freeJourneyGroups = [...freeGroupsMap.values()]
    .map((group) => ({
      ...group,
      journeys: [...group.journeys].sort((a, b) =>
        a.title.localeCompare(b.title, "ar"),
      ),
    }))
    .sort(
      (a, b) =>
        a.displayOrder - b.displayOrder ||
        a.title.localeCompare(b.title, "ar"),
    );

  /*
   * بيانات مستقلة تمامًا لبطاقة "الخطوة التالية".
   * لا تغيّر activeCourses أو careerPaths أو مجموعات اليوم الواحد والمجانية.
   */
  const nextStepSectionMap = new Map<
    StudentNextStepKind,
    StudentNextStepSection
  >(
    createEmptyNextStepSections().map((section) => [
      section.kind,
      section,
    ]),
  );

  const nextStepGroupsMap = new Map<
    StudentNextStepKind,
    Map<string, StudentNextStepStationGroup>
  >([
    ["professional", new Map()],
    ["one_day", new Map()],
    ["free", new Map()],
  ]);

  for (const card of activeCourses) {
    if (card.status === "completed" || card.progressPercent >= 100) {
      continue;
    }

    const course = coursesMap.get(card.courseId);
    if (!course) continue;

    const courseLessons = [
      ...(lessonsByCourse.get(card.courseId) ?? []),
    ].sort((a, b) => a.sort_order - b.sort_order);

    const nextLesson =
      courseLessons.find((lesson) => {
        const progress = lessonProgressMap.get(lesson.id);
        const percent = clampPercent(progress?.progress_percent);
        const started =
          percent > 0 || Number(progress?.last_position_seconds ?? 0) > 0;
        const completed = Boolean(progress?.completed) || percent >= 100;

        return started && !completed;
      }) ??
      courseLessons.find((lesson) => {
        const progress = lessonProgressMap.get(lesson.id);
        const percent = clampPercent(progress?.progress_percent);
        return !Boolean(progress?.completed) && percent < 100;
      });

    if (!nextLesson) continue;

    const lessonProgress = lessonProgressMap.get(nextLesson.id);
    const lessonPercent = clampPercent(
      lessonProgress?.progress_percent,
    );
    const hasStarted =
      lessonPercent > 0 ||
      Number(lessonProgress?.last_position_seconds ?? 0) > 0;

    const journeyType = normalizeStatus(card.journeyType);
    const sectionKind: StudentNextStepKind =
      journeyType === "free" || journeyType === "free_session"
        ? "free"
        : oneDayJourneyTypeValues.has(journeyType)
          ? "one_day"
          : "professional";

    const station = course.station_id
      ? stationMap.get(course.station_id)
      : undefined;
    const stationId =
      station?.id ?? course.station_id ?? `course:${course.id}`;
    const stationTitle =
      station?.title?.trim() ||
      course.title_ar?.trim() ||
      course.title.trim() ||
      "محطة تعليمية";
    const stationDisplayOrder = Number(
      station?.display_order ?? course.display_order ?? 9999,
    );

    const sectionGroups = nextStepGroupsMap.get(sectionKind);
    if (!sectionGroups) continue;

    const stationGroup = sectionGroups.get(stationId) ?? {
      id: stationId,
      title: stationTitle,
      displayOrder: stationDisplayOrder,
      items: [],
    };

    stationGroup.items.push({
      id: `${card.enrollmentId}:${nextLesson.id}`,
      enrollmentId: card.enrollmentId,
      courseId: card.courseId,
      lessonId: nextLesson.id,
      lessonTitle:
        nextLesson.title_ar?.trim() ||
        nextLesson.title.trim() ||
        card.actionTitle?.trim() ||
        card.title,
      progressPercent: lessonPercent,
      remainingMinutes: estimateRemainingMinutes(
        lessonPercent,
        lessonProgress?.last_position_seconds,
      ),
      actionLabel: hasStarted ? "استكمل" : "ابدأ",
      href: `/course/${card.slug}?lesson=${nextLesson.id}`,
      courseOrder: Number(course.display_order ?? 9999),
      lessonOrder: Number(nextLesson.sort_order ?? 9999),
    });

    sectionGroups.set(stationId, stationGroup);
  }

  for (const [kind, groupsMap] of nextStepGroupsMap) {
    const section = nextStepSectionMap.get(kind);
    if (!section) continue;

    section.groups = [...groupsMap.values()]
      .map((group) => ({
        ...group,
        items: [...group.items].sort(
          (a, b) =>
            a.courseOrder - b.courseOrder ||
            a.lessonOrder - b.lessonOrder ||
            a.lessonTitle.localeCompare(b.lessonTitle, "ar"),
        ),
      }))
      .sort(
        (a, b) =>
          a.displayOrder - b.displayOrder ||
          a.title.localeCompare(b.title, "ar"),
      );
  }

  const nextStepSections = createEmptyNextStepSections().map(
    (emptySection) =>
      nextStepSectionMap.get(emptySection.kind) ?? emptySection,
  );

  return {
    studentName,
    studentEmail,
    activeCourses,
    pendingCourses,
    completedCourses,
    careerPaths,
    oneDayJourneyGroups,
    freeJourneyGroups,
    nextStepSections,
    summary: {
      active: activeCourses.length,
      completed: completedCourses.length,
      pending: pendingCourses.length,
      averageProgress,
    },
  };
}