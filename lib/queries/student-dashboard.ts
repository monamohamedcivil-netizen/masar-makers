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
};

export type StudentDashboardData = {
  studentName: string;
  studentEmail: string;
  activeCourses: StudentCourseCard[];
  pendingCourses: StudentCourseCard[];
  completedCourses: StudentCourseCard[];
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
};

type CourseRow = {
  id: string;
  slug: string;
  title: string;
  title_ar: string | null;
  subtitle: string | null;
  image_url: string | null;
  station_id: string | null;
};

type StationRow = {
  id: string;
  career_path_id: string | null;
};

type CareerPathRow = {
  id: string;
  title: string | null;
  title_ar: string | null;
};

type ProgressRow = {
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
};

function normalizeStatus(status: string | null | undefined) {
  return (status ?? "").trim().toLowerCase();
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
    summary: {
      active: 0,
      completed: 0,
      pending: 0,
      averageProgress: 0,
    },
  };
}

async function loadProgressRows(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  courseIds: string[],
): Promise<ProgressRow[]> {
  const columns =
    "course_id,progress_percent,completed_lessons,total_lessons,status,last_lesson_id,last_activity_at";

  const primary = await supabase
    .from("student_course_progress")
    .select(columns)
    .eq("user_id", userId)
    .in("course_id", courseIds);

  if (!primary.error) {
    return (primary.data ?? []) as ProgressRow[];
  }

  const fallback = await supabase
    .from("course_progress")
    .select(columns)
    .eq("user_id", userId)
    .in("course_id", courseIds);

  if (!fallback.error) {
    return (fallback.data ?? []) as ProgressRow[];
  }

  return [];
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
      .select("id,course_id,status")
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

  const [progressRows, lessonsResult, stationsResult] = await Promise.all([
    loadProgressRows(supabase, user.id, courseIds),
    supabase
      .from("lessons")
      .select("id,course_id,title")
      .in("course_id", courseIds)
      .eq("is_published", true),
    stationIds.length
      ? supabase
          .from("course_stations")
          .select("id,career_path_id")
          .in("id", stationIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const lessonRows = lessonsResult.error
    ? []
    : ((lessonsResult.data ?? []) as LessonRow[]);

  const stationRows = stationsResult.error
    ? []
    : ((stationsResult.data ?? []) as StationRow[]);

  const careerPathIds = [
    ...new Set(
      stationRows
        .map((station) => station.career_path_id)
        .filter((pathId): pathId is string => Boolean(pathId)),
    ),
  ];

  const careerPathsResult = careerPathIds.length
    ? await supabase
        .from("career_paths")
        .select("id,title,title_ar")
        .in("id", careerPathIds)
    : { data: [], error: null };

  const careerPathRows = careerPathsResult.error
    ? []
    : ((careerPathsResult.data ?? []) as CareerPathRow[]);

  const coursesMap = new Map(courseRows.map((course) => [course.id, course]));
  const progressMap = new Map(
    progressRows.map((progress) => [progress.course_id, progress]),
  );
  const lessonTitleMap = new Map(
    lessonRows.map((lesson) => [lesson.id, lesson.title]),
  );

  const lessonCountMap = new Map<string, number>();
  for (const lesson of lessonRows) {
    lessonCountMap.set(
      lesson.course_id,
      (lessonCountMap.get(lesson.course_id) ?? 0) + 1,
    );
  }

  const stationMap = new Map(stationRows.map((station) => [station.id, station]));
  const careerPathMap = new Map(
    careerPathRows.map((path) => [
      path.id,
      path.title_ar?.trim() || path.title?.trim() || null,
    ]),
  );

  const cards = enrollmentRows
    .map((enrollment): StudentCourseCard | null => {
      const course = coursesMap.get(enrollment.course_id);
      if (!course) return null;

      const progress = progressMap.get(course.id);
      const totalLessons =
        progress?.total_lessons ?? lessonCountMap.get(course.id) ?? 0;
      const completedLessons = Math.max(
        0,
        Math.min(progress?.completed_lessons ?? 0, totalLessons || Infinity),
      );

      const calculatedProgress =
        totalLessons > 0
          ? Math.round((completedLessons / totalLessons) * 100)
          : 0;

      const progressPercent = Math.max(
        0,
        Math.min(
          100,
          Number(progress?.progress_percent ?? calculatedProgress ?? 0),
        ),
      );

      const station = course.station_id
        ? stationMap.get(course.station_id)
        : undefined;

      const journeyTitle = station?.career_path_id
        ? careerPathMap.get(station.career_path_id) ?? null
        : null;

      const enrollmentStatus = enrollment.status ?? "active";

      const derivedStatus: StudentCourseCard["status"] =
        progress?.status ??
        (normalizeStatus(enrollmentStatus) === "completed" ||
        progressPercent >= 100
          ? "completed"
          : progressPercent > 0
            ? "in_progress"
            : "not_started");

      return {
        enrollmentId: enrollment.id,
        courseId: course.id,
        slug: course.slug,
        title: course.title_ar || course.title,
        subtitle: course.subtitle,
        imageUrl: course.image_url,
        journeyTitle,
        progressPercent,
        completedLessons,
        totalLessons,
        status: derivedStatus,
        lastLessonId: progress?.last_lesson_id ?? null,
        lastLessonTitle: progress?.last_lesson_id
          ? lessonTitleMap.get(progress.last_lesson_id) ?? null
          : null,
        lastActivityAt: progress?.last_activity_at ?? null,
        enrollmentStatus,
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
      pendingStatusValues.has(normalizeStatus(card.enrollmentStatus)),
  );

  const pendingIds = new Set(
    pendingCourses.map((course) => course.enrollmentId),
  );

  const activeCourses = cards.filter(
    (card) =>
      !completedIds.has(card.enrollmentId) &&
      !pendingIds.has(card.enrollmentId) &&
      (activeStatusValues.has(normalizeStatus(card.enrollmentStatus)) ||
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

  return {
    studentName,
    studentEmail,
    activeCourses,
    pendingCourses,
    completedCourses,
    summary: {
      active: activeCourses.length,
      completed: completedCourses.length,
      pending: pendingCourses.length,
      averageProgress,
    },
  };
}
