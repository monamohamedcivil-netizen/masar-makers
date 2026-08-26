import {
  createClient,
  createAdminClient,
} from "@/lib/supabase/server";
import { getMasarPassport } from "@/lib/dashboard/masar-passport";
import type { EnrollmentStatus } from "@/lib/actions/enroll";

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

export type StudentDownloadResource = {
  id: string;
  title: string;
  resourceType: string | null;
  downloadUrl: string;
};

export type StudentStationLesson = {
  lessonId: string;
  courseId: string;
  title: string;
  coursePart: "single" | "fundamentals" | "advanced";
  durationSeconds: number;
  sortOrder: number;
  progressPercent: number;
  completed: boolean;
  resources: StudentDownloadResource[];
};

export type StudentStationPart = {
  part: "single" | "fundamentals" | "advanced";
  courseId: string;
  access: "active" | "pending" | "locked";
  enrollmentStatus: EnrollmentStatus | null;
  progressPercent: number;
  lessons: StudentStationLesson[];
  resources: StudentDownloadResource[];
};

export type StudentPathStationProgress = {
  stationId: string;
  enrollmentId: string;
  courseId: string;
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
  learningLayout: "single" | "split";
  learningParts: StudentStationPart[];
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

  stationId: string;
  stationTitle: string;

  progressPercent: number;
  status: "not_started" | "in_progress" | "completed";

  lessonId: string | null;
  coursePart: "single" | "fundamentals" | "advanced";
  resources: StudentDownloadResource[];
  href: string;
};

export type StudentJourneyStationGroup = {
  id: string;
  slug: string;
  title: string;
  shortTitle: string;
  iconUrl: string | null;
  displayOrder: number;
  journeys: StudentOneDayJourney[];
};

export type StudentOneDayJourneyGroup = {
  id: string;
  slug: string;
  title: string;
  shortTitle: string;
  displayOrder: number;
  stations: StudentJourneyStationGroup[];
};

export type StudentFreeJourney = StudentOneDayJourney;

export type StudentFreeJourneyGroup = StudentOneDayJourneyGroup;

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

export type StudentCertificate = {
  id: string;
  certificateNumber: string;
  courseTitle: string;
  issuedAt: string;
  previewUrl: string | null;
  pdfUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  isNew: boolean;
};


export type StudentSurvey = {
  id: string;
  userId: string;
  courseId: string;
  surveyTemplateId: string | null;
  rating: number;
  comment: string | null;
  submittedAt: string | null;
  showOnHome: boolean;
  showOnCourse: boolean;
  surveyUrl: string | null;
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
  certificates: StudentCertificate[];
  surveys: StudentSurvey[];
 passport: Awaited<
  ReturnType<typeof getMasarPassport>
>;
  summary: {
    active: number;
    completed: number;
    pending: number;
    averageProgress: number;
  };
};


type StudentSurveyRow = {
  id: string;
  user_id: string;
  course_id: string;
  survey_template_id: string | null;
  rating: number | string | null;
  comment: string | null;
  submitted_at: string | null;
  show_on_home: boolean | null;
  show_on_course: boolean | null;
 courses:
  | {
      survey_url?: string | null;
      survey_enabled?: boolean | null;
    }
  | {
      survey_url?: string | null;
      survey_enabled?: boolean | null;
    }[]
  | null;
};

type CertificateRow = {
  id: string;
  certificate_number: string;
  course_title: string;
  issued_at: string;
  preview_url: string | null;
  pdf_url: string | null;
  file_url: string | null;
  is_new: boolean | null;
};

type EnrollmentRow = {
  id: string;
  course_id: string;
  status: EnrollmentStatus | null;
  journey_type: string | null;
  action_key: string | null;
  action_title: string | null;

  /*
   * progress_percent = التقدم النهائي المخزن على enrollment.
   * imported_progress_percent = خط الأساس التاريخي القادم من الاستيراد.
   *
   * لا نعتمد على progress_percent وحده لحساب صفحة الطالب؛
   * التقدم النهائي في الواجهة = MAX(
   *   التقدم الحقيقي من lesson_progress,
   *   التقدم المستورد,
   *   الملخص المخزن
   * ).
   */
  source: string | null;
  progress_percent: number | string | null;
  imported_progress_percent: number | string | null;
  split_progress: unknown;
  imported_split_progress: unknown;
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
  current_lesson_id: string | null;
  last_activity_at: string | null;
};

type LessonRow = {
  id: string;
  course_id: string;
  title: string;
  title_ar: string | null;
  status: string | null;
  sort_order: number;
  course_part?: string | null;
  video_duration_seconds?: number | null;
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

function getJourneyKind(
  journeyType: string | null | undefined,
): StudentNextStepKind {
  const value = normalizeStatus(journeyType);

  if (
    value === "workshop" ||
    value === "one_day" ||
    value === "one-day" ||
    value === "one_day_workshop" ||
    value === "one-day-workshop"
  ) {
    return "one_day";
  }

  if (
    value === "free" ||
    value === "free_session" ||
    value === "free-session"
  ) {
    return "free";
  }

  return "professional";
}

function clampPercent(value: number | string | null | undefined) {
  const numericValue = Number(value ?? 0);

  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  return Math.max(0, Math.min(100, numericValue));
}

function getEnrollmentImportedProgress(
  enrollment: EnrollmentRow | null | undefined,
) {
  if (!enrollment) return 0;

  return clampPercent(
    enrollment.imported_progress_percent,
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
    result[key.trim().toLowerCase()] = clampPercent(
      typeof item === "number" || typeof item === "string"
        ? item
        : 0,
    );
  }

  return result;
}

function getEnrollmentImportedPartProgress(
  enrollment: EnrollmentRow | null | undefined,
  part: "single" | "fundamentals" | "advanced",
) {
  if (!enrollment) return 0;

  if (part === "single") {
    return getEnrollmentImportedProgress(enrollment);
  }

  const split = parseProgressObject(
    enrollment.imported_split_progress,
  );

  const key =
    part === "fundamentals"
      ? "fundamentals"
      : "advanced";

  if (Object.prototype.hasOwnProperty.call(split, key)) {
    return clampPercent(split[key]);
  }

  return getEnrollmentImportedProgress(enrollment);
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
    certificates: [],
    surveys: [],
    nextStepSections: createEmptyNextStepSections(),
   passport: {
  totalPoints: 0,

  bonusPoints: 0,
  bonusPointsHistory: [],

  currentLevel: "Explorer",

   nextLevel: "Professional",

  currentLevelPoints: 0,
  nextLevelPoints: 500,

  progressPercent: 0,
  pointsToNextLevel: 500,

  drawEntries: 0,
drawWins: 0,
availableDrawEntries: 0,

drawRewardsEarned: 0,
drawRewardsRedeemed: 0,
drawRewardsAvailable: 0,
  rewardCourses: 0,
  rewardItems: [],

  earnedRewards: 0,
  redeemedRewards: 0,
  availableRewards: 0,
  rewardBalance: 0,
  rewardProgress: 0,

  lastRewardCourseId: null,
  lastRewardCourseTitle: null,
  lastRewardRedeemedAt: null,

  enrolledCourses: 0,
  completedCourses: 0,

  professionalEnrollments: 0,
  professionalCompletions: 0,
  oneDayEnrollments: 0,
  viewedFreeJourneys: 0,
professionalEnrollmentsCount: 0,
professionalCompletionsCount: 0,
oneDayEnrollmentsCount: 0,
freeJourneyViewsCount: 0,

surveyCount: 0,
projectCount: 0,
featuredProjectCount: 0,
referralCount: 0,
  professionalEnrollmentPoints: 0,
  professionalCompletionPoints: 0,
  oneDayEnrollmentPoints: 0,
  freeJourneyPoints: 0,

  surveyPoints: 0,
  projectPoints: 0,
  featuredProjectPoints: 0,
  referralPoints: 0,

  coursePoints: 0,
  completionPoints: 0,
},
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
  "course_id,progress_percent,completed_lessons,total_lessons,current_lesson_id,last_activity_at";
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
  importedBaselinePercent = 0,
): CalculatedCourseProgress {
  const totalLessons = courseLessons.length;

  /*
   * If the course has no published lessons yet, keep the stored summary
   * as a fallback so existing dashboard data does not disappear.
   */
  if (totalLessons === 0) {
    const progressPercent = Math.max(
      clampPercent(storedProgress?.progress_percent),
      clampPercent(importedBaselinePercent),
    );

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
  progressPercent >= 100
    ? "completed"
    : progressPercent > 0
      ? "in_progress"
      : "not_started",
     lastLessonId: storedProgress?.current_lesson_id ?? null,
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

  /*
   * التقدم الفعلي الناتج من مشاهدة المحاضرات.
   */
  const lessonBasedProgressPercent = clampPercent(
    Math.round(accumulatedProgress / totalLessons),
  );

  /*
   * student_course_progress قد يحتوي على تقدم تاريخي
   * لطالب مستورد من النظام السابق.
   *
   * هذا التقدم يمثل Baseline لا يجوز أن تنخفض عنه
   * نسبة الطالب بمجرد فتح محاضرة على المنصة الجديدة.
   *
   * لذلك:
   * - إذا كان التقدم التاريخي أعلى → نحافظ عليه.
   * - إذا أصبح تقدم المحاضرات أعلى → نستخدم تقدم المحاضرات.
   */
  const storedProgressPercent = clampPercent(
    storedProgress?.progress_percent,
  );

  const importedProgressPercent = clampPercent(
    importedBaselinePercent,
  );

  /*
   * القاعدة النهائية الموحدة:
   *
   * 1) Lesson progress = التقدم الحقيقي الجديد.
   * 2) Imported progress = التاريخ السابق للطالب.
   * 3) Stored summary = ملخص قاعدة البيانات بعد الـ trigger.
   *
   * لا يسمح لأي نشاط جديد أن يخفض التقدم التاريخي.
   */
  const progressPercent = Math.max(
    lessonBasedProgressPercent,
    importedProgressPercent,
    storedProgressPercent,
  );

  /*
   * إذا كانت النسبة النهائية 100% فالكورس مكتمل،
   * حتى لو لم توجد lesson_progress تاريخية لكل المحاضرات.
   *
   * وهذا مهم خصوصًا للطلاب المستوردين الذين أكملوا
   * الكورس قبل تشغيل نظام تتبع المحاضرات الحالي.
   */
  const status: StudentCourseCard["status"] =
    progressPercent >= 100
      ? "completed"
      : progressPercent > 0
        ? "in_progress"
        : "not_started";

  /*
   * completedLessons المعروضة لا يجب أن تعيد طالبًا
   * مستوردًا مكتملًا إلى 0 محاضرات مكتملة.
   */
  const finalCompletedLessons =
    progressPercent >= 100
      ? Math.max(
          completedLessons,
          totalLessons,
          Number(storedProgress?.completed_lessons ?? 0),
        )
      : Math.max(
          completedLessons,
          Number(storedProgress?.completed_lessons ?? 0),
        );

  return {
    progressPercent,
    completedLessons: finalCompletedLessons,
    totalLessons,
    status,
    lastLessonId:
      lastLessonId ??
      storedProgress?.current_lesson_id ??
      null,
    lastLessonTitle,
    lastActivityAt:
      lastActivityAt ??
      storedProgress?.last_activity_at ??
      null,
  };
}

export async function getStudentDashboardData(
  targetUserId?: string,
): Promise<StudentDashboardData> {
  const supabase = await createClient();
const adminSupabase = createAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("UNAUTHENTICATED");
  }

  const userId =
  targetUserId?.trim() || user.id;

if (userId !== user.id) {
  const { data: currentUserProfile, error: currentUserProfileError } =
    await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

  const currentUserRole = String(
    currentUserProfile?.role ?? "",
  ).toLowerCase();

  if (
    currentUserProfileError ||
    !["admin", "super_admin"].includes(currentUserRole)
  ) {
    throw new Error("FORBIDDEN");
  }
}

  const [
    { data: profile },
    enrollmentResult,
    certificatesResult,
    surveysResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name,email")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("enrollments")
      .select("id,course_id,status,journey_type,action_key,action_title,source,progress_percent,imported_progress_percent,split_progress,imported_split_progress")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase
  .from("certificates")
  .select(
    "id,certificate_number,course_title,issued_at,preview_url,pdf_url,file_url,is_new",
  )
      .eq("user_id", userId)
      .eq("status", "issued")
      .order("issued_at", { ascending: false }),
    supabase
      .from("student_surveys")
.select(`
    id,
    user_id,
    course_id,
    survey_template_id,
    rating,
    comment,
    submitted_at,
    show_on_home,
    show_on_course,
    courses(
        survey_url,
        survey_enabled
    )
`)
      .eq("user_id", userId)
      .order("submitted_at", { ascending: false }),
  ]);

  if (enrollmentResult.error) {
    throw new Error(enrollmentResult.error.message);
  }

  if (certificatesResult.error) {
    console.error(
      "Failed to load certificates:",
      certificatesResult.error.message,
    );
  }

  if (surveysResult.error) {
    console.error(
      "Failed to load student surveys:",
      surveysResult.error.message,
    );
  }

  const studentName =
  profile?.full_name?.trim() ||
  (userId === user.id
    ? user.user_metadata?.full_name
    : null) ||
  "مهندس مسار";

const studentEmail =
  profile?.email ||
  (userId === user.id
    ? user.email
    : "") ||
  "";
const passport =
  await getMasarPassport(userId);
  const certificateRows = certificatesResult.error
    ? []
    : ((certificatesResult.data ?? []) as CertificateRow[]);

const certificates: StudentCertificate[] = certificateRows.map(
  (certificate) => ({
    id: certificate.id,
    certificateNumber: certificate.certificate_number,
    courseTitle: certificate.course_title,
    issuedAt: certificate.issued_at,

   previewUrl:
  certificate.preview_url ??
  certificate.file_url ??
  null,

pdfUrl:
  certificate.pdf_url ??
  certificate.file_url ??
  `/api/certificates/${certificate.id}/pdf`,

    primaryColor: "#F7B548",
    secondaryColor: "#07152E",

    isNew: Boolean(certificate.is_new),
  }),
);


  const surveyRows = surveysResult.error
    ? []
    : ((surveysResult.data ?? []) as StudentSurveyRow[]);

  const surveys: StudentSurvey[] = surveyRows.map((survey) => {
  const course = Array.isArray(survey.courses)
    ? survey.courses[0]
    : survey.courses;

  const surveyUrl =
    course?.survey_enabled === false
      ? null
      : course?.survey_url?.trim() || null;

  return {
    id: survey.id,
    userId: survey.user_id,
    courseId: survey.course_id,
    surveyTemplateId: survey.survey_template_id,
    rating: Math.max(
      0,
      Math.min(5, Number(survey.rating ?? 0)),
    ),
    comment: survey.comment,
    submittedAt: survey.submitted_at,
    showOnHome: Boolean(survey.show_on_home),
    showOnCourse: Boolean(survey.show_on_course),
    surveyUrl,
  };
});

  const enrollmentRows = (enrollmentResult.data ?? []) as EnrollmentRow[];

  const courseIds = [
    ...new Set(
      enrollmentRows
        .map((item) => item.course_id)
        .filter((courseId): courseId is string => Boolean(courseId)),
    ),
  ];

  if (courseIds.length === 0) {
    return {
    ...emptyDashboard(studentName, studentEmail),
    certificates,
    surveys,
    passport,
};
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
      loadStoredCourseProgressRows(supabase, userId, courseIds),
      supabase
        .from("lessons")
        .select(
          "id,course_id,title,title_ar,status,sort_order,course_part,video_duration_seconds",
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
  userId,
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

  /*
   * محتوى شاشة التعلم داخل صفحة الطالب.
   * لا نعتمد على اسم الكورس إطلاقًا لتحديد Single/Fundamentals/Advanced.
   * المصدر الوحيد هو lessons.course_part من قاعدة البيانات.
   */
  const allPathCourseIds = [
  ...new Set([
    ...allPathCourseRows.map((course) => course.id),
    ...courseIds,
  ]),
];

  const stationLearningLessonsResult = allPathCourseIds.length
    ? await supabase
        .from("lessons")
        .select(
          "id,course_id,title,title_ar,status,sort_order,course_part,video_duration_seconds",
        )
        .in("course_id", allPathCourseIds)
        .eq("status", "published")
        .order("sort_order", { ascending: true })
    : { data: [], error: null };

  const stationLearningLessonRows = stationLearningLessonsResult.error
    ? []
    : ((stationLearningLessonsResult.data ?? []) as LessonRow[]);

  /*
   * مرفقات شاشة الطالب.
   * lesson  = تظهر فقط بجوار المحاضرة المرتبطة بها.
   * section = تظهر مرة واحدة في هيدر Fundamentals / Advanced / Single.
   * ننشئ Signed URL مؤقتًا لأن bucket المرفقات خاص.
   */
  type ResourceRow = {
    id: string;
    lesson_id: string | null;
    course_id: string | null;
    course_part: string | null;
    resource_scope: string | null;
    title: string | null;
    resource_type: string | null;
    file_path: string | null;
  };

  const stationLearningLessonIds =
    stationLearningLessonRows.map((lesson) => lesson.id);

  const lessonResourcesResult =
    stationLearningLessonIds.length
      ? await adminSupabase
          .from("lesson_resources")
          .select(
            "id,lesson_id,course_id,course_part,resource_scope,title,resource_type,file_path",
          )
          .eq("is_active", true)
          .eq("resource_scope", "lesson")
          .in("lesson_id", stationLearningLessonIds)
          .not("file_path", "is", null)
          .order("display_order", { ascending: true })
      : { data: [], error: null };

  const sectionResourcesResult =
    allPathCourseIds.length
      ? await adminSupabase
          .from("lesson_resources")
          .select(
            "id,lesson_id,course_id,course_part,resource_scope,title,resource_type,file_path",
          )
          .eq("is_active", true)
          .eq("resource_scope", "section")
          .in("course_id", allPathCourseIds)
          .not("file_path", "is", null)
          .order("display_order", { ascending: true })
      : { data: [], error: null };

  const resourceRows = [
    ...((lessonResourcesResult.data ?? []) as ResourceRow[]),
    ...((sectionResourcesResult.data ?? []) as ResourceRow[]),
  ];

  const signedResourceRows = await Promise.all(
    resourceRows.map(async (row) => {
      const filePath = row.file_path?.trim();
      if (!filePath) return null;

      const { data: signedData, error: signedError } =
        await adminSupabase.storage
          .from("lesson-resources")
          .createSignedUrl(filePath, 10 * 60, {
            download: true,
          });

      if (signedError || !signedData?.signedUrl) {
        console.error(
          "Failed to sign lesson resource:",
          row.id,
          signedError?.message,
        );
        return null;
      }

      return {
        row,
        resource: {
          id: row.id,
          title: row.title?.trim() || "مرفق",
          resourceType: row.resource_type ?? null,
          downloadUrl: signedData.signedUrl,
        } satisfies StudentDownloadResource,
      };
    }),
  );

  const lessonResourcesMap =
    new Map<string, StudentDownloadResource[]>();

  const sectionResourcesMap =
    new Map<string, StudentDownloadResource[]>();

  for (const item of signedResourceRows) {
    if (!item) continue;

    const { row, resource } = item;

    if (row.resource_scope === "lesson" && row.lesson_id) {
      const current =
        lessonResourcesMap.get(row.lesson_id) ?? [];
      current.push(resource);
      lessonResourcesMap.set(row.lesson_id, current);
      continue;
    }

    if (row.resource_scope === "section" && row.course_id) {
      const normalizedPart =
        normalizeStatus(row.course_part) || "single";
      const key = `${row.course_id}:${normalizedPart}`;
      const current =
        sectionResourcesMap.get(key) ?? [];
      current.push(resource);
      sectionResourcesMap.set(key, current);
    }
  }

  /*
   * مصدر الحقيقة لنوع الرحلة هو:
   * journeys.journey_type + lesson_journeys.
   * لا نستنتج نوع المحاضرة من وجود اشتراك آخر على نفس الكورس.
   */
  const allJourneysResult = allPathCourseIds.length
  ? await adminSupabase
      .from("journeys")
        .select("id,course_id,journey_type")
        .in("course_id", allPathCourseIds)
        .eq("is_active", true)
    : { data: [], error: null };

  const allJourneyRows = allJourneysResult.error
    ? []
    : (allJourneysResult.data ?? []);

  const journeyById = new Map(
    allJourneyRows.map((journey) => [journey.id, journey]),
  );

  const allJourneyIds = allJourneyRows
    .map((journey) => journey.id)
    .filter((id): id is string => Boolean(id));

  const allLessonJourneyLinksResult = allJourneyIds.length
  ? await adminSupabase
      .from("lesson_journeys")
        .select("lesson_id,journey_id")
        .in("journey_id", allJourneyIds)
    : { data: [], error: null };

  const lessonJourneyKinds = new Map<
    string,
    Set<StudentNextStepKind>
  >();

  for (const link of allLessonJourneyLinksResult.data ?? []) {
    const journey = journeyById.get(link.journey_id);
    if (!journey?.journey_type || !link.lesson_id) continue;

    const kinds =
      lessonJourneyKinds.get(link.lesson_id) ??
      new Set<StudentNextStepKind>();

    kinds.add(getJourneyKind(journey.journey_type));
    lessonJourneyKinds.set(link.lesson_id, kinds);
  }

  const lessonBelongsToJourney = (
    lessonId: string,
    kind: StudentNextStepKind,
  ) => lessonJourneyKinds.get(lessonId)?.has(kind) ?? false;

  /*
   * محاضرات رحلة الاحتراف:
   *
   * المصدر الأساسي يظل lesson_journeys + journeys.
   *
   * لكن بعض كورسات Single القديمة/المستوردة (مثل SPD) قد تكون
   * المحاضرات الاحترافية صحيحة في قاعدة البيانات، بينما لا تصل
   * روابط lesson_journeys إلى هذا الاستعلام في سياق الطالب.
   *
   * لذلك نستخدم fallback آمن فقط للكورسات التي لدى الطالب عليها
   * اشتراك احترافي فعلي وغير مرفوض/ملغي/موقوف:
   * إذا لم نستطع اكتشاف أي Professional lesson للكورس من روابط
   * الرحلات، نستخدم محاضراته المنشورة نفسها.
   *
   * لا يطبق هذا الـ fallback على Free أو One Day.
   */
  const professionalEnrolledCourseIds = new Set(
    enrollmentRows
      .filter((enrollment) => {
        const kind = getJourneyKind(
          enrollment.journey_type,
        );

        const status = normalizeStatus(
          enrollment.status,
        );

        return (
          kind === "professional" &&
          ![
            "rejected",
            "suspended",
            "expired",
            "cancelled",
          ].includes(status)
        );
      })
      .map((enrollment) => enrollment.course_id),
  );

  const coursesWithDetectedProfessionalLessons = new Set(
    stationLearningLessonRows
      .filter((lesson) =>
        lessonBelongsToJourney(
          lesson.id,
          "professional",
        ),
      )
      .map((lesson) => lesson.course_id),
  );

  const studentLearningLessonRows =
    stationLearningLessonRows.filter(
      (lesson) => {
        if (
          lessonBelongsToJourney(
            lesson.id,
            "professional",
          )
        ) {
          return true;
        }

        return (
          professionalEnrolledCourseIds.has(
            lesson.course_id,
          ) &&
          !coursesWithDetectedProfessionalLessons.has(
            lesson.course_id,
          )
        );
      },
    );

  /*
   * نحمّل تقدم جميع المحاضرات المرتبطة بأنواع الرحلات الثلاثة مرة واحدة،
   * حتى تستخدم الاحتراف/اليوم الواحد/المجاني نفس سجل lesson_progress.
   */
  const allJourneyLessonIds = stationLearningLessonRows
    .filter((lesson) => lessonJourneyKinds.has(lesson.id))
    .map((lesson) => lesson.id);

  const stationLearningProgressRows = await loadLessonProgressRows(
    supabase,
    userId,
    allJourneyLessonIds,
  );

  const stationLearningProgressMap = new Map(
    stationLearningProgressRows.map((progress) => [
      progress.lesson_id,
      progress,
    ]),
  );

  const coursesMap = new Map(
    courseRows.map((course) => [course.id, course]),
  );

  /*
   * قد يوجد أكثر من Enrollment لنفس الكورس
   * (احتراف / يوم واحد / مجاني).
   * الـ View قد يعيد أكثر من صف لنفس course_id،
   * لذلك نحفظ أعلى ملخص فقط بدل الاعتماد على ترتيب النتائج.
   */
  const storedProgressMap = new Map<
    string,
    StoredCourseProgressRow
  >();

  for (const progress of storedProgressRows) {
    const existing = storedProgressMap.get(
      progress.course_id,
    );

    if (
      !existing ||
      clampPercent(progress.progress_percent) >
        clampPercent(existing.progress_percent)
    ) {
      storedProgressMap.set(
        progress.course_id,
        progress,
      );
    }
  }

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
        getEnrollmentImportedProgress(enrollment),
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

  let averageProgress = activeCourses.length
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

  /*
   * مهم: خريطة رحلة الاحتراف يجب أن تعتمد فقط على اشتراكات الاحتراف.
   * لا يجوز أن تجعل رحلة مجانية أو رحلة يوم واحد المحطة تبدو كمحطة
   * احترافية مشترك بها.
   */
  const professionalCardsByCourseId = new Map(
    cards
      .filter(
        (card) =>
          getJourneyKind(card.journeyType) ===
          "professional",
      )
      .map((card) => [
        card.courseId,
        card,
      ]),
  );

  const pendingStatusSet = new Set([
    "pending",
    "requested",
    "waiting",
    "under_review",
  ]);

  const activeEnrollmentStatusSet = new Set([
    "active",
    "approved",
    "enrolled",
    "confirmed",
    "completed",
  ]);

  const enrollmentRowsByCourse = new Map<string, EnrollmentRow[]>();
  for (const enrollment of enrollmentRows) {
    const current = enrollmentRowsByCourse.get(enrollment.course_id) ?? [];
    current.push(enrollment);
    enrollmentRowsByCourse.set(enrollment.course_id, current);
  }

  const normalizeCoursePart = (
    value: string | null | undefined,
  ): "single" | "fundamentals" | "advanced" => {
    const part = normalizeStatus(value);
    if (part === "fundamentals" || part === "fundamental") {
      return "fundamentals";
    }
    if (part === "advanced") {
      return "advanced";
    }
    return "single";
  };

  const coursePartAccess = (
    courseIds: string[],
    part: "single" | "fundamentals" | "advanced",
  ) => {
    const enrollments = courseIds.flatMap(
      (courseId) => enrollmentRowsByCourse.get(courseId) ?? [],
    );

    let hasPending = false;
    let suspendedStatus:
      | EnrollmentStatus
      | null = null;

    for (const enrollment of enrollments) {
      const status = normalizeStatus(enrollment.status);
      const journeyType = normalizeStatus(enrollment.journey_type);

      const isOneDay =
        journeyType === "workshop" ||
        journeyType === "one_day" ||
        journeyType === "one-day" ||
        journeyType === "one_day_workshop" ||
        journeyType === "one-day-workshop";

      const isFree =
        journeyType === "free" ||
        journeyType === "free_session" ||
        journeyType === "free-session";

      /*
       * أي اشتراك ليس يومًا واحدًا أو مجانيًا يعتبر اشتراكًا احترافيًا.
       * بالنسبة لكورس Single فهذا يكفي لإتاحة المحتوى.
       * أما Fundamentals/Advanced فنحترم الجزء المحدد،
       * بينما Integrated/Professional/Legacy generic يمنح الجزأين.
       */
      const isProfessionalEnrollment = !isOneDay && !isFree;

      const grantsAll =
        journeyType === "integrated" ||
        journeyType === "professional" ||
        journeyType === "career_path" ||
        journeyType === "";

      const grantsPart =
        part === "single"
          ? isProfessionalEnrollment
          : grantsAll ||
            (part === "fundamentals" &&
              (journeyType === "fundamental" ||
                journeyType === "fundamentals")) ||
            (part === "advanced" && journeyType === "advanced");

      if (!grantsPart) continue;

      if (activeEnrollmentStatusSet.has(status) || status === "") {
        return {
          access: "active" as const,
          enrollmentStatus:
            enrollment.status ?? "active",
        };
      }

      if (pendingStatusSet.has(status)) {
        hasPending = true;
      }

      if (status === "suspended") {
        suspendedStatus =
          enrollment.status;
      }
    }

    return {
      access: hasPending
        ? ("pending" as const)
        : ("locked" as const),
      enrollmentStatus: hasPending
        ? "pending"
        : suspendedStatus,
    };
  };


  const getActiveProfessionalEnrollmentForPart = (
    courseIds: string[],
    part: "single" | "fundamentals" | "advanced",
  ): EnrollmentRow | null => {
    const enrollments = courseIds.flatMap(
      (courseId) => enrollmentRowsByCourse.get(courseId) ?? [],
    );

    for (const enrollment of enrollments) {
      const status = normalizeStatus(enrollment.status);
      const journeyType = normalizeStatus(enrollment.journey_type);

      if (getJourneyKind(journeyType) !== "professional") {
        continue;
      }

      if (
        !activeEnrollmentStatusSet.has(status) &&
        status !== ""
      ) {
        continue;
      }

      const grantsAll =
        journeyType === "integrated" ||
        journeyType === "professional" ||
        journeyType === "career_path" ||
        journeyType === "";

      const grantsPart =
        part === "single"
          ? true
          : grantsAll ||
            (part === "fundamentals" &&
              (journeyType === "fundamental" ||
                journeyType === "fundamentals")) ||
            (part === "advanced" &&
              journeyType === "advanced");

      if (grantsPart) {
        return enrollment;
      }
    }

    return null;
  };

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
            .map((course) =>
              professionalCardsByCourseId.get(
                course.id,
              ),
            )
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

          let stationStatus: StudentPathStationProgress["status"] =
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

          const stationCourseIds = stationCourses.map((course) => course.id);
          const stationLessons = studentLearningLessonRows
            .filter((lesson) => stationCourseIds.includes(lesson.course_id))
            .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0));

          const detectedParts = [
            ...new Set(
              stationLessons.map((lesson) =>
                normalizeCoursePart(lesson.course_part),
              ),
            ),
          ];

          const learningLayout: "single" | "split" =
            detectedParts.includes("fundamentals") ||
            detectedParts.includes("advanced")
              ? "split"
              : "single";

          const partsToBuild: Array<
            "single" | "fundamentals" | "advanced"
          > =
            learningLayout === "split"
              ? ["fundamentals", "advanced"]
              : ["single"];

          const learningParts: StudentStationPart[] = partsToBuild.map((part) => {
            const partLessons = stationLessons.filter(
              (lesson) => normalizeCoursePart(lesson.course_part) === part,
            );

            /*
             * نحدد courseId الخاص بالجزء من الدروس نفسها، وليس من اسم الكورس.
             * إذا لم توجد محاضرات للجزء بعد نستخدم الكورس الرئيسي للمحطة كـ fallback.
             */
            const partCourseId =
              partLessons[0]?.course_id ??
              representativeCourse?.id ??
              stationCourses[0]?.id ??
              "";

            const accessState = stationCourseIds.length
              ? coursePartAccess(stationCourseIds, part)
              : { access: "locked" as const, enrollmentStatus: null };

            const sectionResources = partLessons
              .map(
                (lesson) =>
                  `${lesson.course_id}:${part}`,
              )
              .filter(
                (key, index, keys) =>
                  keys.indexOf(key) === index,
              )
              .flatMap(
                (key) =>
                  sectionResourcesMap.get(key) ?? [],
              )
              .filter(
                (resource, index, resources) =>
                  resources.findIndex(
                    (candidate) =>
                      candidate.id === resource.id,
                  ) === index,
              );

            /*
             * إذا كان القسم لا يحتوي محاضرات منشورة بعد، نسمح أيضًا
             * بمرفقات section المرتبطة مباشرة بالكورس الممثل لهذا الجزء.
             */
            if (!sectionResources.length && partCourseId) {
              sectionResources.push(
                ...(sectionResourcesMap.get(
                  `${partCourseId}:${part}`,
                ) ?? []),
              );
            }

            const partLessonRows = partLessons.map((lesson) => {
              const progress = stationLearningProgressMap.get(lesson.id);
              const progressPercent = clampPercent(
                progress?.progress_percent,
              );

              return {
                lessonId: lesson.id,
                courseId: lesson.course_id,
                title:
                  lesson.title_ar?.trim() ||
                  lesson.title.trim() ||
                  "محاضرة",
                coursePart: normalizeCoursePart(lesson.course_part),
                durationSeconds: Math.max(
                  0,
                  Number(lesson.video_duration_seconds ?? 0),
                ),
                sortOrder: Number(lesson.sort_order ?? 0),
                progressPercent,
                completed:
                  Boolean(progress?.completed) ||
                  progressPercent >= 100,
                resources:
                  lessonResourcesMap.get(lesson.id) ?? [],
              };
            });

            const realPartProgressPercent = partLessonRows.length
              ? Math.round(
                  partLessonRows.reduce(
                    (sum, lesson) => sum + lesson.progressPercent,
                    0,
                  ) / partLessonRows.length,
                )
              : 0;

            const partEnrollment =
              accessState.access === "active"
                ? getActiveProfessionalEnrollmentForPart(
                    stationCourseIds,
                    part,
                  )
                : null;

            const importedPartProgressPercent =
              getEnrollmentImportedPartProgress(
                partEnrollment,
                part,
              );

            const partProgressPercent =
              accessState.access === "active"
                ? Math.max(
                    clampPercent(realPartProgressPercent),
                    clampPercent(importedPartProgressPercent),
                  )
                : 0;

            return {
              part,
              courseId: partCourseId,
              access: accessState.access,
              enrollmentStatus: accessState.enrollmentStatus,
              progressPercent: partProgressPercent,
              resources: sectionResources,
              lessons: partLessonRows,
            };
          });

          /*
           * تقدم محطة الاحتراف يجب أن يعتمد فقط على الأجزاء التي يملك
           * الطالب صلاحية احترافية فعالة عليها.
           *
           * مثال مهم: مشاهدة Workshop من Fundamentals لا يجب أن تغيّر
           * تقدم محطة الاحتراف لطالب مشترك في Advanced فقط.
           */
          const activeProfessionalParts = learningParts.filter(
            (part) => part.access === "active",
          );

          const accessibleProfessionalLessons =
            activeProfessionalParts.flatMap((part) => part.lessons);

          const lessonBasedStationProgressPercent =
            accessibleProfessionalLessons.length
              ? Math.round(
                  accessibleProfessionalLessons.reduce(
                    (sum, lesson) => sum + lesson.progressPercent,
                    0,
                  ) / accessibleProfessionalLessons.length,
                )
              : 0;

          /*
           * للطلاب المستوردين نحافظ على الـ baseline التاريخي الخاص
           * بنفس اشتراك الاحتراف، ولا نستخدم student_course_progress
           * العام لأنه قد يجمع نشاط One-Day / Free على نفس course_id.
           */
          const enrolledEnrollment = enrolledCard
            ? enrollmentRows.find(
                (enrollment) =>
                  enrollment.id === enrolledCard.enrollmentId,
              ) ?? null
            : null;

          const normalizedProfessionalJourneyType =
            normalizeStatus(enrolledEnrollment?.journey_type);

          const stationImportedBaseline =
            normalizedProfessionalJourneyType === "advanced"
              ? getEnrollmentImportedPartProgress(
                  enrolledEnrollment,
                  "advanced",
                )
              : normalizedProfessionalJourneyType === "fundamental" ||
                  normalizedProfessionalJourneyType === "fundamentals"
                ? getEnrollmentImportedPartProgress(
                    enrolledEnrollment,
                    "fundamentals",
                  )
                : getEnrollmentImportedProgress(
                    enrolledEnrollment,
                  );

          const stationProgressPercent = Math.max(
            clampPercent(lessonBasedStationProgressPercent),
            clampPercent(stationImportedBaseline),
          );

          const lessonBasedCompletedLessons =
            accessibleProfessionalLessons.filter(
              (lesson) => lesson.completed,
            ).length;

          const stationCompletedLessons =
            stationProgressPercent >= 100
              ? Math.max(
                  lessonBasedCompletedLessons,
                  accessibleProfessionalLessons.length,
                )
              : lessonBasedCompletedLessons;

          const stationTotalLessons =
            accessibleProfessionalLessons.length;

          stationStatus =
            !isEnrolled
              ? "not_enrolled"
              : pendingStatusSet.has(normalizedEnrollmentStatus)
                ? "pending"
                : stationProgressPercent >= 100
                  ? "completed"
                  : stationProgressPercent > 0
                    ? "in_progress"
                    : "not_started";

          return {
  stationId: station.id,

  enrollmentId:
    enrolledCard?.enrollmentId ?? "",

  courseId:
    enrolledCard?.courseId ??
    representativeCourse?.id ??
    "",

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
            progressPercent: stationProgressPercent,
            completedLessons: stationCompletedLessons,
            totalLessons: stationTotalLessons,
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
            learningLayout,
            learningParts,
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

  /*
   * نظام اليوم الواحد الجديد:
   * لا نظهر أي اشتراك Workshop قديم عام على مستوى الكورس.
   * يظهر فقط الاشتراك الذي أنشئ من زر "اشترك الآن" بجوار محاضرة
   * في صفحة الكورس، ويكون مفتاحه:
   * workshop:lesson:LESSON_ID
   */
  const activeOneDayCards = cards.filter((card) => {
    const enrollmentStatus =
      normalizeStatus(
        card.enrollmentStatus,
      );

    const isLessonSpecific =
      Boolean(
        card.actionKey?.startsWith(
          "workshop:lesson:",
        ),
      );

    return (
      getJourneyKind(
        card.journeyType,
      ) === "one_day" &&
      isLessonSpecific &&
      !pendingStatusValues.has(
        enrollmentStatus,
      ) &&
      enrollmentStatus !== "rejected" &&
      enrollmentStatus !== "suspended" &&
      enrollmentStatus !== "expired" &&
      enrollmentStatus !== "cancelled"
    );
  });

  const oneDayJourneysByStation = new Map<
  string,
  StudentOneDayJourney[]
>();

const oneDayPathIds = new Set<string>();

for (const card of activeOneDayCards) {
  const course = coursesMap.get(card.courseId);
  if (!course) continue;

  const station = course.station_id
    ? stationMap.get(course.station_id)
    : undefined;

  if (!station) continue;

  const pathId = station.career_path_id;
  if (!pathId) continue;

  const requestedLessonId =
    card.actionKey?.startsWith("workshop:lesson:")
      ? card.actionKey.slice(
          "workshop:lesson:".length,
        )
      : null;

  const assignedLessons = stationLearningLessonRows
    .filter(
      (lesson) =>
        lesson.course_id === card.courseId &&
        lessonBelongsToJourney(
          lesson.id,
          "one_day",
        ) &&
        (!requestedLessonId ||
          lesson.id === requestedLessonId),
    )
    .sort(
      (a, b) =>
        Number(a.sort_order ?? 0) -
        Number(b.sort_order ?? 0),
    );

  /*
   * لا يظهر أي درس إلا إذا كان مربوطًا فعليًا
   * برحلة اليوم الواحد.
   */
  if (!assignedLessons.length) continue;

  oneDayPathIds.add(pathId);

  const stationJourneys =
    oneDayJourneysByStation.get(station.id) ?? [];

  for (const lesson of assignedLessons) {
    const progress =
      stationLearningProgressMap.get(lesson.id);

    const progressPercent = clampPercent(
      progress?.progress_percent,
    );

    const completed =
      Boolean(progress?.completed) ||
      progressPercent >= 100;

    stationJourneys.push({
      enrollmentId: `${card.enrollmentId}:${lesson.id}`,
      courseId: card.courseId,
      slug: card.slug,

      title:
        lesson.title_ar?.trim() ||
        lesson.title.trim() ||
        card.actionTitle?.trim() ||
        card.title,

      stationId: station.id,

      stationTitle:
        station.title?.trim() ||
        course.title_ar?.trim() ||
        course.title?.trim() ||
        "محطة تعليمية",

      progressPercent,

      status: completed
        ? "completed"
        : progressPercent > 0
          ? "in_progress"
          : "not_started",

      lessonId: lesson.id,

      coursePart: normalizeCoursePart(
        lesson.course_part,
      ),

      /*
       * رحلة اليوم الواحد تعرض مرفقات المحاضرة فقط.
       * لا نضيف مرفقات section / المرفقات العامة هنا.
       */
      resources:
        lessonResourcesMap.get(
          lesson.id,
        ) ?? [],

      href: "/dashboard",
    });
  }

  oneDayJourneysByStation.set(
    station.id,
    stationJourneys,
  );
}

const oneDayJourneyGroups: StudentOneDayJourneyGroup[] =
  careerPathRows
    .map((path) => {
      const pathStations = stationRows
        .filter(
          (station) =>
            station.career_path_id === path.id,
        )
        .sort(
          (a, b) =>
            Number(a.display_order ?? 0) -
            Number(b.display_order ?? 0),
        );

      const stations: StudentJourneyStationGroup[] =
        pathStations.map((station) => ({
          id: station.id,

          slug:
            station.slug?.trim() ||
            station.id,

          title:
            station.title?.trim() ||
            "محطة تعليمية",

          shortTitle:
            station.short_title?.trim() ||
            station.title?.trim() ||
            "محطة",

          iconUrl:
            station.icon_url ?? null,

          displayOrder:
            Number(station.display_order ?? 0),

          journeys: [
            ...(oneDayJourneysByStation.get(
              station.id,
            ) ?? []),
          ].sort((a, b) => {
            const order = {
              single: 0,
              fundamentals: 1,
              advanced: 2,
            } as const;

            return (
              order[a.coursePart] -
                order[b.coursePart] ||
              a.title.localeCompare(
                b.title,
                "ar",
              )
            );
          }),
        }));

      return {
        id: path.id,

        slug:
          path.slug ?? path.id,

        title:
          path.title_ar?.trim() ||
          path.title?.trim() ||
          "مسار مهني",

        shortTitle:
          path.short_title?.trim() ||
          path.title_ar?.trim() ||
          path.title?.trim() ||
          "مسار مهني",

        displayOrder:
          Number(path.display_order ?? 0),

        stations,
      };
    })
    .sort(
      (a, b) =>
        a.displayOrder - b.displayOrder ||
        a.title.localeCompare(b.title, "ar"),
    );

  /*
   * المحاضرة المجانية لا تظهر في صفحة الطالب بمجرد نشرها.
   * تظهر فقط بعد ضغط الطالب "شاهد الآن" في صفحة الكورس،
   * لأن startFreeJourney ينشئ Enrollment فعالًا بمفتاح:
   * free:lesson:LESSON_ID
   */
  const freeJourneysByStation = new Map<
  string,
  StudentFreeJourney[]
>();

const freePathIds = new Set<string>();
  const allPathCoursesMap = new Map(
    allPathCourseRows.map((course) => [course.id, course]),
  );

  const activeFreeCards = cards.filter(
    (card) => {
      const status =
        normalizeStatus(
          card.enrollmentStatus,
        );

      return (
        getJourneyKind(
          card.journeyType,
        ) === "free" &&
        (
          activeStatusValues.has(
            status,
          ) ||
          status === "completed"
        )
      );
    },
  );

  const freeEnrollmentByLessonId =
    new Map<
      string,
      StudentCourseCard
    >();

  const legacyFreeCourseIds =
    new Set<string>();

  for (const card of activeFreeCards) {
    if (
      card.actionKey?.startsWith(
        "free:lesson:",
      )
    ) {
      const lessonId =
        card.actionKey.slice(
          "free:lesson:".length,
        );

      if (lessonId) {
        freeEnrollmentByLessonId.set(
          lessonId,
          card,
        );
      }

      continue;
    }

    /*
     * دعم التسجيلات المجانية القديمة قبل اعتماد مفتاح lesson.
     */
    legacyFreeCourseIds.add(
      card.courseId,
    );
  }

  const freeLessons = stationLearningLessonRows
    .filter(
      (lesson) =>
        lessonBelongsToJourney(
          lesson.id,
          "free",
        ) &&
        (
          freeEnrollmentByLessonId.has(
            lesson.id,
          ) ||
          legacyFreeCourseIds.has(
            lesson.course_id,
          )
        ),
    )
    .sort(
      (a, b) =>
        a.sort_order - b.sort_order,
    );

  for (const lesson of freeLessons) {
    const course = allPathCoursesMap.get(lesson.course_id);
    if (!course) continue;

    const station = course.station_id
      ? stationMap.get(course.station_id)
      : undefined;
if (!station) continue;

const pathId = station.career_path_id;
if (!pathId) continue;

freePathIds.add(pathId);
   
 const progress =
  stationLearningProgressMap.get(lesson.id);

const progressPercent = clampPercent(
  progress?.progress_percent,
);

const completed =
  Boolean(progress?.completed) ||
  progressPercent >= 100;

const freeEnrollment =
  freeEnrollmentByLessonId.get(
    lesson.id,
  );

const stationJourneys =
  freeJourneysByStation.get(station.id) ?? [];

stationJourneys.push({
  enrollmentId:
    freeEnrollment?.enrollmentId ??
    `free:${lesson.id}`,

  courseId: course.id,
  slug: course.slug,

  title:
    lesson.title_ar?.trim() ||
    lesson.title.trim() ||
    course.title_ar?.trim() ||
    course.title.trim(),

  stationId: station.id,

  stationTitle:
    station.title?.trim() ||
    course.title_ar?.trim() ||
    course.title?.trim() ||
    "محطة تعليمية",

  progressPercent,

  status: completed
    ? "completed"
    : progressPercent > 0
      ? "in_progress"
      : "not_started",

  lessonId: lesson.id,

  coursePart: normalizeCoursePart(
    lesson.course_part,
  ),

  /*
   * الرحلات المجانية لا تعرض أي مرفقات.
   */
  resources: [],

  href: "/dashboard",
});

freeJourneysByStation.set(
  station.id,
  stationJourneys,
);
      
  }

  const freeJourneyGroups: StudentFreeJourneyGroup[] =
  careerPathRows
    .map((path) => {
      const pathStations = stationRows
        .filter(
          (station) =>
            station.career_path_id === path.id,
        )
        .sort(
          (a, b) =>
            Number(a.display_order ?? 0) -
            Number(b.display_order ?? 0),
        );

      const stations: StudentJourneyStationGroup[] =
        pathStations.map((station) => ({
          id: station.id,

          slug:
            station.slug?.trim() ||
            station.id,

          title:
            station.title?.trim() ||
            "محطة تعليمية",

          shortTitle:
            station.short_title?.trim() ||
            station.title?.trim() ||
            "محطة",

          iconUrl:
            station.icon_url ?? null,

          displayOrder:
            Number(station.display_order ?? 0),

          journeys: [
            ...(freeJourneysByStation.get(
              station.id,
            ) ?? []),
          ].sort((a, b) => {
            const order = {
              single: 0,
              fundamentals: 1,
              advanced: 2,
            } as const;

            return (
              order[a.coursePart] -
                order[b.coursePart] ||
              a.title.localeCompare(
                b.title,
                "ar",
              )
            );
          }),
        }));

      return {
        id: path.id,

        slug:
          path.slug ?? path.id,

        title:
          path.title_ar?.trim() ||
          path.title?.trim() ||
          "مسار مهني",

        shortTitle:
          path.short_title?.trim() ||
          path.title_ar?.trim() ||
          path.title?.trim() ||
          "مسار مهني",

        displayOrder:
          Number(path.display_order ?? 0),

        stations,
      };
    })
    .sort(
      (a, b) =>
        a.displayOrder - b.displayOrder ||
        a.title.localeCompare(b.title, "ar"),
    );
        
  /*
   * الإحصائية العامة للتقدم يجب أن تعتمد على نفس مصدر التقدم الحقيقي
   * المستخدم في شاشة التعلم: lesson_progress.
   *
   * - رحلة الاحتراف: نحسب فقط المحطات المشترك بها الطالب.
   * - اليوم الواحد / المجانية: تستخدم progressPercent المحسوب من الدروس.
   * - لا ندخل المحطات غير المشترك بها في المتوسط حتى لا تخفض النسبة صناعيًا.
   */
  const dashboardJourneyProgressValues = [
    ...careerPaths.flatMap((path) =>
      path.stations
        .filter((station) => station.isEnrolled && station.status !== "pending")
        .map((station) => station.progressPercent),
    ),
...oneDayJourneyGroups.flatMap((path) =>
  path.stations.flatMap((station) =>
    station.journeys.map(
      (journey) => journey.progressPercent,
    ),
  ),
),

...freeJourneyGroups.flatMap((path) =>
  path.stations.flatMap((station) =>
    station.journeys.map(
      (journey) => journey.progressPercent,
    ),
  ),
),
  ];

  averageProgress = dashboardJourneyProgressValues.length
    ? Math.round(
        dashboardJourneyProgressValues.reduce((sum, value) => sum + value, 0) /
          dashboardJourneyProgressValues.length,
      )
    : 0;

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

  /*
   * رحلة الاحتراف في "الخطوة التالية" تعتمد مباشرة على learningParts الخاصة بالمحطة،
   * وهي نفسها مبنية من lessons + lesson_progress. بذلك لا نعتمد على ملخص course قديم
   * ولا على اسم الكورس أو نوع مكتوب يدويًا.
   */
  const professionalGroups = nextStepGroupsMap.get("professional");

  if (professionalGroups) {
    for (const path of careerPaths) {
      for (const station of path.stations) {
        if (!station.isEnrolled || station.status === "pending" || station.status === "completed") {
          continue;
        }

        const accessibleLessons = station.learningParts
          .filter((part) => part.access === "active")
          .flatMap((part) => part.lessons)
          .sort((a, b) => a.sortOrder - b.sortOrder);

        const nextLesson =
          accessibleLessons.find(
            (lesson) => lesson.progressPercent > 0 && !lesson.completed,
          ) ??
          accessibleLessons.find((lesson) => !lesson.completed);

        if (!nextLesson) continue;

        const part = station.learningParts.find((candidate) =>
          candidate.lessons.some((lesson) => lesson.lessonId === nextLesson.lessonId),
        );

        const matchingCard =
          professionalCardsByCourseId.get(
            nextLesson.courseId,
          );
        const enrollmentId =
          matchingCard?.enrollmentId || station.enrollmentId || `station:${station.stationId}`;

        const stationGroup = professionalGroups.get(station.stationId) ?? {
          id: station.stationId,
          title: station.shortTitle || station.title,
          displayOrder: station.displayOrder,
          items: [],
        };

        stationGroup.items.push({
          id: `${enrollmentId}:${nextLesson.lessonId}`,
          enrollmentId,
          courseId: nextLesson.courseId,
          lessonId: nextLesson.lessonId,
          lessonTitle: nextLesson.title,
          progressPercent: nextLesson.progressPercent,
          remainingMinutes: null,
          actionLabel: nextLesson.progressPercent > 0 ? "استكمل" : "ابدأ",
          href: matchingCard
            ? `/course/${matchingCard.slug}?lesson=${nextLesson.lessonId}`
            : station.courseHref,
          courseOrder: station.displayOrder,
          lessonOrder: nextLesson.sortOrder,
        });

        professionalGroups.set(station.stationId, stationGroup);
      }
    }
  }

  const appendJourneyGroupToNextStep = (
  kind: "one_day" | "free",
  groups:
    | StudentOneDayJourneyGroup[]
    | StudentFreeJourneyGroup[],
) => {
  const target = nextStepGroupsMap.get(kind);
  if (!target) return;

  for (const path of groups) {
    for (const station of path.stations) {
      const nextJourney =
        station.journeys.find(
          (journey) =>
            journey.progressPercent > 0 &&
            journey.status !== "completed" &&
            Boolean(journey.lessonId),
        ) ??
        station.journeys.find(
          (journey) =>
            journey.status !== "completed" &&
            Boolean(journey.lessonId),
        );

      if (!nextJourney?.lessonId) continue;

      const lessonProgress =
        stationLearningProgressMap.get(
          nextJourney.lessonId,
        ) ??
        lessonProgressMap.get(
          nextJourney.lessonId,
        );

      const stationGroup =
        target.get(station.id) ?? {
          id: station.id,
          title:
            station.shortTitle ||
            station.title,
          displayOrder:
            station.displayOrder,
          items: [],
        };

      stationGroup.items.push({
        id: `${kind}:${nextJourney.lessonId}`,
        enrollmentId:
          nextJourney.enrollmentId,
        courseId:
          nextJourney.courseId,
        lessonId:
          nextJourney.lessonId,
        lessonTitle:
          nextJourney.title,
        progressPercent:
          nextJourney.progressPercent,

        remainingMinutes:
          estimateRemainingMinutes(
            nextJourney.progressPercent,
            lessonProgress?.last_position_seconds,
          ),

        actionLabel:
          nextJourney.progressPercent > 0
            ? "استكمل"
            : "ابدأ",

        href: "/dashboard",

        courseOrder:
          station.displayOrder,

        lessonOrder: 0,
      });

      target.set(
        station.id,
        stationGroup,
      );
    }
  }
};

     appendJourneyGroupToNextStep(
    "one_day",
    oneDayJourneyGroups,
  );

  appendJourneyGroupToNextStep(
    "free",
    freeJourneyGroups,
  );

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
    certificates,
    surveys,
    passport,
    summary: {
      active: activeCourses.length,
      completed: completedCourses.length,
      pending: pendingCourses.length,
      averageProgress,
    },
  };
}