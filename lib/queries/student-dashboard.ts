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
  status: string;
};

type CourseRow = {
  id: string;
  slug: string;
  title: string;
  title_ar: string | null;
  subtitle: string | null;
  image_url: string | null;
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

export async function getStudentDashboardData(): Promise<StudentDashboardData> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("UNAUTHENTICATED");
  }

  const [{ data: profile }, { data: enrollments, error: enrollmentError }] =
    await Promise.all([
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

  if (enrollmentError) {
    throw new Error(enrollmentError.message);
  }

  const enrollmentRows = (enrollments ?? []) as EnrollmentRow[];
  const courseIds = [...new Set(enrollmentRows.map((item) => item.course_id))];


  if (courseIds.length === 0) {
    return {
      studentName:
        profile?.full_name?.trim() ||
        user.user_metadata?.full_name ||
        "مهندس مسار",
      studentEmail: profile?.email || user.email || "",
      activeCourses: [],
      pendingCourses: [],
      completedCourses: [],
      summary: { active: 0, completed: 0, pending: 0, averageProgress: 0 },
    };
  }

  const [coursesResult, progressResult, lessonsResult, journeysResult] =
    await Promise.all([
      supabase
        .from("courses")
        .select("id,slug,title,title_ar,subtitle,image_url")
        .in("id", courseIds),
      supabase
        .from("course_progress")
        .select(
          "course_id,progress_percent,completed_lessons,total_lessons,status,last_lesson_id,last_activity_at"
        )
        .eq("user_id", user.id)
        .in("course_id", courseIds),
      supabase
        .from("lessons")
        .select("id,course_id,title")
        .in("course_id", courseIds)
        .eq("is_published", true),
      supabase
        .from("journeys")
        .select("id,course_id,title,display_order")
        .in("course_id", courseIds)
        .eq("is_active", true)
        .order("display_order", { ascending: true }),
    ]);

  for (const result of [coursesResult, progressResult, lessonsResult, journeysResult]) {
    if (result.error) {
      throw new Error(result.error.message);
    }
  }

  const coursesMap = new Map(
    ((coursesResult.data ?? []) as CourseRow[]).map((course) => [course.id, course])
  );
  const progressMap = new Map(
    ((progressResult.data ?? []) as ProgressRow[]).map((progress) => [
      progress.course_id,
      progress,
    ])
  );
  const journeyMap = new Map<string, string>();
  for (const journey of journeysResult.data ?? []) {
    if (!journeyMap.has(journey.course_id)) {
      journeyMap.set(journey.course_id, journey.title);
    }
  }
  const lessonTitleMap = new Map(
    (lessonsResult.data ?? []).map((lesson) => [lesson.id, lesson.title])
  );
  const lessonCountMap = new Map<string, number>();
  for (const lesson of lessonsResult.data ?? []) {
    lessonCountMap.set(
      lesson.course_id,
      (lessonCountMap.get(lesson.course_id) ?? 0) + 1
    );
  }

  const cards = enrollmentRows
    .map((enrollment): StudentCourseCard | null => {
      const course = coursesMap.get(enrollment.course_id);
      if (!course) return null;

      const progress = progressMap.get(enrollment.course_id);
      const totalLessons =
        progress?.total_lessons || lessonCountMap.get(enrollment.course_id) || 0;
      const progressPercent = Math.max(
        0,
        Math.min(100, Number(progress?.progress_percent ?? 0))
      );

      return {
        enrollmentId: enrollment.id,
        courseId: course.id,
        slug: course.slug,
        title: course.title_ar || course.title,
        subtitle: course.subtitle,
        imageUrl: course.image_url,
        journeyTitle: journeyMap.get(enrollment.course_id) ?? null,
        progressPercent,
        completedLessons: progress?.completed_lessons ?? 0,
        totalLessons,
        status:
          progress?.status ??
          (enrollment.status === "completed" ? "completed" : "not_started"),
        lastLessonId: progress?.last_lesson_id ?? null,
        lastLessonTitle: progress?.last_lesson_id
          ? lessonTitleMap.get(progress.last_lesson_id) ?? null
          : null,
        lastActivityAt: progress?.last_activity_at ?? null,
        enrollmentStatus: enrollment.status,
      };
    })
    .filter((card): card is StudentCourseCard => Boolean(card));

  const normalizeEnrollmentStatus = (status: string) =>
    status.trim().toLowerCase();

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

  const activeCourses = cards.filter((card) =>
    activeStatusValues.has(normalizeEnrollmentStatus(card.enrollmentStatus))
  );
  const pendingCourses = cards.filter((card) =>
    pendingStatusValues.has(normalizeEnrollmentStatus(card.enrollmentStatus))
  );
  const completedCourses = cards.filter(
    (card) =>
      normalizeEnrollmentStatus(card.enrollmentStatus) === "completed" ||
      card.status === "completed"
  );

  const progressBearingCourses = activeCourses.filter(
    (course) => course.progressPercent > 0
  );
  const averageProgress = progressBearingCourses.length
    ? Math.round(
        progressBearingCourses.reduce(
          (sum, course) => sum + course.progressPercent,
          0
        ) / progressBearingCourses.length
      )
    : 0;

  return {
    studentName:
      profile?.full_name?.trim() ||
      user.user_metadata?.full_name ||
      "مهندس مسار",
    studentEmail: profile?.email || user.email || "",
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
