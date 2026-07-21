import { createClient } from "@/lib/supabase/server";

export type StudentProfile = {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  role: string;
};

export type StudentCourseCard = {
  enrollmentId: string;
  courseId: string;
  slug: string;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  journeyTitle: string | null;
  journeyType: string;
  progressPercent: number;
  completedLessons: number;
  totalLessons: number;
  status: "not_started" | "in_progress" | "completed";
  lastLessonId: string | null;
  lastLessonTitle: string | null;
  lastActivityAt: string | null;
  enrollmentStatus: string;
};

export type StudentSurvey = {
  id: string;
  title: string;
  formUrl: string | null;
  completed: boolean;
  completedAt: string | null;
};

export type StudentCertificate = {
  id: string;
  certificateNumber: string;
  courseTitle: string;
  issuedAt: string;
  fileUrl: string | null;
};

export type StudentProject = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  projectUrl: string | null;
  createdAt: string;
};

export type StudentDashboardData = {
  profile: StudentProfile;
  studentName: string;
  studentEmail: string;
  activeCourses: StudentCourseCard[];
  pendingCourses: StudentCourseCard[];
  completedCourses: StudentCourseCard[];
  careerCourses: StudentCourseCard[];
  oneDayCourses: StudentCourseCard[];
  freeCourses: StudentCourseCard[];
  surveys: StudentSurvey[];
  certificates: StudentCertificate[];
  projects: StudentProject[];
  summary: {
    active: number;
    completed: number;
    pending: number;
    averageProgress: number;
    careerPaths: number;
    oneDay: number;
    free: number;
    surveysCompleted: number;
    surveysPending: number;
    certificates: number;
    projectsApproved: number;
  };
};

type EnrollmentRow = {
  id: string;
  course_id: string;
  journey_id: string | null;
  journey_type: string | null;
  status: string;
};

type CourseRow = {
  id: string;
  slug: string;
  title: string;
  title_ar: string | null;
  subtitle: string | null;
  image_url: string | null;
  station_id: string | null;
  journey_type: string | null;
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

const normalize = (value?: string | null) => (value ?? "").trim().toLowerCase();
const activeStatuses = new Set(["active", "approved", "enrolled", "confirmed"]);
const pendingStatuses = new Set(["pending", "requested", "waiting", "under_review"]);

export async function getStudentDashboardData(): Promise<StudentDashboardData> {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) throw new Error("UNAUTHENTICATED");

  const user = authData.user;
  const [{ data: profile }, { data: enrollments, error: enrollmentError }] = await Promise.all([
    supabase.from("profiles").select("id,full_name,email,avatar_url,role").eq("id", user.id).maybeSingle(),
    supabase.from("enrollments").select("id,course_id,journey_id,journey_type,status").eq("user_id", user.id).order("created_at", { ascending: false }),
  ]);

  if (enrollmentError) throw new Error(enrollmentError.message);

  const enrollmentRows = (enrollments ?? []) as EnrollmentRow[];
  const courseIds = [...new Set(enrollmentRows.map((item) => item.course_id))];
  const emptyArray = Promise.resolve({ data: [], error: null });

  const [coursesResult, progressResult, lessonsResult, journeysResult, surveyResult, certificateResult, projectResult] = await Promise.all([
    courseIds.length ? supabase.from("courses").select("id,slug,title,title_ar,subtitle,image_url,station_id,journey_type").in("id", courseIds) : emptyArray,
    courseIds.length ? supabase.from("course_progress").select("course_id,progress_percent,completed_lessons,total_lessons,status,last_lesson_id,last_activity_at").eq("user_id", user.id).in("course_id", courseIds) : emptyArray,
    courseIds.length ? supabase.from("lessons").select("id,course_id,title").in("course_id", courseIds).eq("is_published", true) : emptyArray,
    courseIds.length ? supabase.from("journeys").select("id,course_id,title,journey_type,display_order").in("course_id", courseIds).eq("is_active", true).order("display_order", { ascending: true }) : emptyArray,
    supabase.from("survey_assignments").select("id,completed_status,completed_at,surveys(id,title,google_form_url)").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("certificates").select("id,certificate_number,issued_at,file_url,courses(title,title_ar)").eq("user_id", user.id).eq("is_revoked", false).order("issued_at", { ascending: false }),
    supabase.from("student_achievements").select("id,title,description,status,project_url,created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
  ]);

  for (const result of [coursesResult, progressResult, lessonsResult, journeysResult]) {
    if (result.error) throw new Error(result.error.message);
  }

  const coursesMap = new Map(((coursesResult.data ?? []) as CourseRow[]).map((course) => [course.id, course]));
  const progressMap = new Map(((progressResult.data ?? []) as ProgressRow[]).map((progress) => [progress.course_id, progress]));
  const journeyMap = new Map<string, { title: string; type: string }>();
  for (const journey of journeysResult.data ?? []) {
    if (!journeyMap.has(journey.course_id)) journeyMap.set(journey.course_id, { title: journey.title, type: journey.journey_type });
  }
  const lessonTitleMap = new Map((lessonsResult.data ?? []).map((lesson) => [lesson.id, lesson.title]));
  const lessonCountMap = new Map<string, number>();
  for (const lesson of lessonsResult.data ?? []) lessonCountMap.set(lesson.course_id, (lessonCountMap.get(lesson.course_id) ?? 0) + 1);

  const cards = enrollmentRows.map((enrollment): StudentCourseCard | null => {
    const course = coursesMap.get(enrollment.course_id);
    if (!course) return null;
    const progress = progressMap.get(enrollment.course_id);
    const journey = journeyMap.get(enrollment.course_id);
    const progressPercent = Math.max(0, Math.min(100, Number(progress?.progress_percent ?? 0)));
    const journeyType = normalize(enrollment.journey_type || journey?.type || course.journey_type || "career_path");
    return {
      enrollmentId: enrollment.id,
      courseId: course.id,
      slug: course.slug,
      title: course.title_ar || course.title,
      subtitle: course.subtitle,
      imageUrl: course.image_url,
      journeyTitle: journey?.title ?? null,
      journeyType,
      progressPercent,
      completedLessons: progress?.completed_lessons ?? 0,
      totalLessons: progress?.total_lessons || lessonCountMap.get(enrollment.course_id) || 0,
      status: progress?.status ?? (enrollment.status === "completed" ? "completed" : "not_started"),
      lastLessonId: progress?.last_lesson_id ?? null,
      lastLessonTitle: progress?.last_lesson_id ? lessonTitleMap.get(progress.last_lesson_id) ?? null : null,
      lastActivityAt: progress?.last_activity_at ?? null,
      enrollmentStatus: enrollment.status,
    };
  }).filter((card): card is StudentCourseCard => Boolean(card));

  const activeCourses = cards.filter((card) => activeStatuses.has(normalize(card.enrollmentStatus)));
  const pendingCourses = cards.filter((card) => pendingStatuses.has(normalize(card.enrollmentStatus)));
  const completedCourses = cards.filter((card) => normalize(card.enrollmentStatus) === "completed" || card.status === "completed");
  const acceptedCourses = [...activeCourses, ...completedCourses.filter((item) => !activeCourses.some((active) => active.enrollmentId === item.enrollmentId))];
  const isOneDay = (type: string) => ["one_day", "one-day", "workshop", "single_day"].includes(type);
  const isFree = (type: string) => ["free", "free_session", "preview"].includes(type);
  const oneDayCourses = acceptedCourses.filter((course) => isOneDay(course.journeyType));
  const freeCourses = acceptedCourses.filter((course) => isFree(course.journeyType));
  const careerCourses = acceptedCourses.filter((course) => !isOneDay(course.journeyType) && !isFree(course.journeyType));

  const surveys: StudentSurvey[] = surveyResult.error ? [] : (surveyResult.data ?? []).map((row: any) => ({
    id: row.surveys?.id ?? row.id,
    title: row.surveys?.title ?? "استبيان",
    formUrl: row.surveys?.google_form_url ?? null,
    completed: Boolean(row.completed_status),
    completedAt: row.completed_at ?? null,
  }));
  const certificates: StudentCertificate[] = certificateResult.error ? [] : (certificateResult.data ?? []).map((row: any) => ({
    id: row.id,
    certificateNumber: row.certificate_number,
    courseTitle: row.courses?.title_ar || row.courses?.title || "شهادة إتمام",
    issuedAt: row.issued_at,
    fileUrl: row.file_url,
  }));
  const projects: StudentProject[] = projectResult.error ? [] : (projectResult.data ?? []).map((row: any) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    projectUrl: row.project_url,
    createdAt: row.created_at,
  }));

  const progressBearing = activeCourses.filter((course) => course.progressPercent > 0);
  const averageProgress = progressBearing.length ? Math.round(progressBearing.reduce((sum, course) => sum + course.progressPercent, 0) / progressBearing.length) : 0;
  const pathKeys = new Set(careerCourses.map((course) => course.journeyTitle || course.courseId));
  const fullName = profile?.full_name?.trim() || user.user_metadata?.full_name || "مهندس مسار";
  const email = profile?.email || user.email || "";

  return {
    profile: { id: user.id, fullName, email, avatarUrl: profile?.avatar_url ?? null, role: profile?.role ?? "student" },
    studentName: fullName,
    studentEmail: email,
    activeCourses,
    pendingCourses,
    completedCourses,
    careerCourses,
    oneDayCourses,
    freeCourses,
    surveys,
    certificates,
    projects,
    summary: {
      active: activeCourses.length,
      completed: completedCourses.length,
      pending: pendingCourses.length,
      averageProgress,
      careerPaths: pathKeys.size,
      oneDay: oneDayCourses.length,
      free: freeCourses.length,
      surveysCompleted: surveys.filter((item) => item.completed).length,
      surveysPending: surveys.filter((item) => !item.completed).length,
      certificates: certificates.length,
      projectsApproved: projects.filter((item) => item.status === "approved").length,
    },
  };
}
