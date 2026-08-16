import { createAdminClient } from "@/lib/supabase/server";

export type MasarLevel =
  | "Explorer"
  | "Professional"
  | "Expert"
  | "Mentor";

export type RewardCourseType =
  | "fundamentals"
  | "advanced"
  | "single";

export type RewardItem = {
  key: string;
  courseId: string;
  courseName: string;
  courseType: RewardCourseType;
  courseTypeLabel: string | null;
};
export type BonusPointHistoryItem = {
  id: string;
  points: number;
  reason: string;
  pointType: "referral" | "bonus" | "adjustment";
  createdAt: string;
};
export interface MasarPassportData {
  totalPoints: number;
bonusPoints: number;
bonusPointsHistory: BonusPointHistoryItem[];
  currentLevel: MasarLevel;
  nextLevel: MasarLevel | null;

  currentLevelPoints: number;
  nextLevelPoints: number | null;

  progressPercent: number;
  pointsToNextLevel: number;

  drawEntries: number;

  rewardCourses: number;
  rewardItems: RewardItem[];

  earnedRewards: number;
  redeemedRewards: number;
  availableRewards: number;
  rewardBalance: number;
  rewardProgress: number;

  lastRewardCourseId: string | null;
  lastRewardCourseTitle: string | null;
  lastRewardRedeemedAt: string | null;

  enrolledCourses: number;
  completedCourses: number;

  professionalEnrollments: number;
  professionalCompletions: number;
  oneDayEnrollments: number;
  viewedFreeJourneys: number;
professionalEnrollmentsCount: number;
professionalCompletionsCount: number;
oneDayEnrollmentsCount: number;
freeJourneyViewsCount: number;

surveyCount: number;
projectCount: number;
featuredProjectCount: number;
referralCount: number;
  professionalEnrollmentPoints: number;
  professionalCompletionPoints: number;
  oneDayEnrollmentPoints: number;
  freeJourneyPoints: number;

  surveyPoints: number;
  projectPoints: number;
  featuredProjectPoints: number;
  referralPoints: number;

  coursePoints: number;
  completionPoints: number;
}

type EnrollmentRow = {
  course_id: string;
  journey_type: string | null;
  action_key: string | null;
  status: string | null;
  courses:
    | {
        id: string;
        slug: string | null;
        title: string | null;
        title_ar: string | null;
        course_code: string | null;
      }
    | {
        id: string;
        slug: string | null;
        title: string | null;
        title_ar: string | null;
        course_code: string | null;
      }[]
    | null;
};

type ProgressRow = {
  course_id: string;
  progress_percent: number | string | null;
  status?: string | null;
};

const LEVELS = [
  {
    name: "Explorer" as MasarLevel,
    min: 0,
    max: 499,
  },
  {
    name: "Professional" as MasarLevel,
    min: 500,
    max: 1499,
  },
  {
    name: "Expert" as MasarLevel,
    min: 1500,
    max: 2999,
  },
  {
    name: "Mentor" as MasarLevel,
    min: 3000,
    max: Infinity,
  },
];

const ONE_DAY_TYPES = new Set([
  "workshop",
  "one_day",
  "one-day",
  "one_day_workshop",
  "one-day-workshop",
]);

const FREE_TYPES = new Set([
  "free",
  "free_session",
  "free-session",
]);

function normalize(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function isApprovedEnrollment(status: string | null) {
  return [
    "approved",
    "active",
    "enrolled",
    "confirmed",
    "completed",
  ].includes(normalize(status));
}

function isCompletedProgress(progress: ProgressRow | undefined) {
  if (!progress) return false;

  return (
    normalize(progress.status) === "completed" ||
    Number(progress.progress_percent ?? 0) >= 100
  );
}

function isViewedProgress(progress: ProgressRow | undefined) {
  if (!progress) return false;

  return (
    Number(progress.progress_percent ?? 0) > 0 ||
    normalize(progress.status) === "completed"
  );
}

export async function getMasarPassport(
  userId: string,
): Promise<MasarPassportData> {
  const supabase = createAdminClient();

  const enrollmentResult = await supabase
    .from("enrollments")
    .select(`
      course_id,
      journey_type,
      action_key,
      status,
      courses (
        id,
        slug,
        title,
        title_ar,
        course_code
      )
    `)
    .eq("user_id", userId);

  if (enrollmentResult.error) {
    console.error(
      "Failed to load Masar Passport enrollments:",
      enrollmentResult.error.message,
    );
  }

  const enrollments = (
    enrollmentResult.data ?? []
  ) as EnrollmentRow[];

  const approvedEnrollments = enrollments.filter(
    (enrollment) =>
      isApprovedEnrollment(enrollment.status),
  );

  const enrolledCourseIds = [
    ...new Set(
      approvedEnrollments
        .map((enrollment) => enrollment.course_id)
        .filter(Boolean),
    ),
  ];

  let progressRows: ProgressRow[] = [];

  if (enrolledCourseIds.length > 0) {
    const progressResult = await supabase
      .from("student_course_progress")
      .select(
  "course_id,progress_percent",
)
      .eq("user_id", userId)
      .in("course_id", enrolledCourseIds);

    if (progressResult.error) {
      console.error(
        "Failed to load Masar Passport progress:",
        progressResult.error.message,
      );
    } else {
      progressRows =
        (progressResult.data ?? []) as ProgressRow[];
    }
  }

  const progressByCourseId = new Map(
    progressRows.map((progress) => [
      progress.course_id,
      progress,
    ]),
  );

  let professionalEnrollments = 0;
  let professionalCompletions = 0;
  let oneDayEnrollments = 0;
  let viewedFreeJourneys = 0;

  const rewardItems: RewardItem[] = [];

  approvedEnrollments.forEach(
    (enrollment, index) => {
      const journeyType = normalize(
        enrollment.journey_type,
      );

      const isOneDay =
        ONE_DAY_TYPES.has(journeyType);

      const isFree =
        FREE_TYPES.has(journeyType);

      const isProfessional =
        !isOneDay && !isFree;

      const progress = progressByCourseId.get(
        enrollment.course_id,
      );

      if (isProfessional) {
        professionalEnrollments += 1;

        if (isCompletedProgress(progress)) {
          professionalCompletions += 1;
        }
      }

      if (isOneDay) {
        oneDayEnrollments += 1;
      }

      if (
        isFree &&
        isViewedProgress(progress)
      ) {
        viewedFreeJourneys += 1;
      }

      if (!isProfessional) {
        return;
      }

      const course = Array.isArray(
        enrollment.courses,
      )
        ? enrollment.courses[0]
        : enrollment.courses;

      const rawType = normalize(
        [
          enrollment.action_key,
          course?.slug,
          course?.course_code,
          course?.title,
          course?.title_ar,
        ]
          .filter(Boolean)
          .join(" "),
      );

      const courseId =
        enrollment.course_id ||
        course?.id ||
        `course-${index}`;

      const courseName =
        course?.course_code?.trim() ||
        course?.title_ar?.trim() ||
        course?.title?.trim() ||
        "رحلة احتراف";

      const isIntegrated =
        rawType.includes("integrated") ||
        rawType.includes("متكامل");

      const isFundamentals =
        rawType.includes("fundamental") ||
        rawType.includes("foundation") ||
        rawType.includes("basic") ||
        rawType.includes("أساسيات");

      const isAdvanced =
        rawType.includes("advanced") ||
        rawType.includes("متقدم");

      if (isIntegrated) {
        rewardItems.push(
          {
            key: `${courseId}-fundamentals`,
            courseId,
            courseName,
            courseType: "fundamentals",
            courseTypeLabel: "أساسيات",
          },
          {
            key: `${courseId}-advanced`,
            courseId,
            courseName,
            courseType: "advanced",
            courseTypeLabel: "متقدم",
          },
        );

        return;
      }

      if (isFundamentals) {
        rewardItems.push({
          key: `${courseId}-fundamentals`,
          courseId,
          courseName,
          courseType: "fundamentals",
          courseTypeLabel: "أساسيات",
        });

        return;
      }

      if (isAdvanced) {
        rewardItems.push({
          key: `${courseId}-advanced`,
          courseId,
          courseName,
          courseType: "advanced",
          courseTypeLabel: "متقدم",
        });

        return;
      }

      rewardItems.push({
        key: `${courseId}-single`,
        courseId,
        courseName,
        courseType: "single",
        courseTypeLabel: null,
      });
    },
  );

  const rewardCourses = rewardItems.length;

  const rewardProfileResult = await supabase
    .from("profiles")
    .select(`
      redeemed_rewards,
      last_reward_course_id,
      last_reward_course_title,
      last_reward_redeemed_at
    `)
    .eq("id", userId)
    .maybeSingle();

  if (rewardProfileResult.error) {
    console.error(
      "Failed to load Masar Passport reward data:",
      rewardProfileResult.error.message,
    );
  }

  const redeemedRewards = Math.max(
    0,
    Number(
      rewardProfileResult.data?.redeemed_rewards ?? 0,
    ) || 0,
  );

  const earnedRewards = Math.floor(
    rewardCourses / 10,
  );

  const availableRewards = Math.max(
    0,
    earnedRewards - redeemedRewards,
  );

  const rewardBalance = Math.max(
    0,
    rewardCourses - redeemedRewards * 10,
  );

  const rewardProgress =
    availableRewards > 0
      ? 10
      : rewardBalance % 10;

  const lastRewardCourseId =
    rewardProfileResult.data?.last_reward_course_id ??
    null;

  const lastRewardCourseTitle =
    rewardProfileResult.data?.last_reward_course_title
      ?.trim() || null;

  const lastRewardRedeemedAt =
    rewardProfileResult.data?.last_reward_redeemed_at ??
    null;

  const surveysResult = await supabase
    .from("student_surveys")
    .select("id,submitted_at")
    .eq("user_id", userId)
    .not("submitted_at", "is", null);

  if (surveysResult.error) {
    console.error(
      "Failed to load Masar Passport surveys:",
      surveysResult.error.message,
    );
  }

  const surveys =
    surveysResult.data ?? [];

  const projectsResult = await supabase
    .from("student_projects")
    .select(`
      id,
      show_on_home,
      show_on_course
    `)
    .eq("user_id", userId)
    .eq("status", "approved");

  if (projectsResult.error) {
    console.error(
      "Failed to load Masar Passport projects:",
      projectsResult.error.message,
    );
  }

  const projects =
    projectsResult.data ?? [];

const bonusPointsResult = await supabase
  .from("student_bonus_points")
  .select("id,points,reason,point_type,created_at")
  .eq("user_id", userId)
  .order("created_at", {
    ascending: false,
  });
if (bonusPointsResult.error) {
  console.error(
    "Failed to load bonus points:",
    bonusPointsResult.error.message,
  );
}

const bonusPointsRows =
  bonusPointsResult.data ?? [];

const referralRows = bonusPointsRows.filter(
  (item) =>
    String(item.point_type ?? "bonus")
      .trim()
      .toLowerCase() === "referral",
);

const nonReferralBonusRows =
  bonusPointsRows.filter(
    (item) =>
      String(item.point_type ?? "bonus")
        .trim()
        .toLowerCase() !== "referral",
  );

const bonusPoints =
  nonReferralBonusRows.reduce(
    (sum, item) =>
      sum + Number(item.points ?? 0),
    0,
  );

const referralPoints =
  referralRows.reduce(
    (sum, item) =>
      sum + Number(item.points ?? 0),
    0,
  );

const bonusPointsHistory: BonusPointHistoryItem[] =
  bonusPointsRows.map((item) => {
    const rawPointType = String(
      item.point_type ?? "bonus",
    )
      .trim()
      .toLowerCase();

    const pointType:
      | "referral"
      | "bonus"
      | "adjustment" =
      rawPointType === "referral"
        ? "referral"
        : rawPointType === "adjustment"
          ? "adjustment"
          : "bonus";

    return {
      id: String(item.id),
      points: Number(item.points ?? 0),
      reason:
        String(item.reason ?? "").trim() ||
        (pointType === "referral"
          ? "دعوة صديق"
          : pointType === "adjustment"
            ? "تصحيح نقاط"
            : "نقاط إضافية"),
      pointType,
      createdAt:
        String(item.created_at ?? ""),
    };
  });

const referralCount =
  referralRows.length;

  const professionalEnrollmentPoints =
    professionalEnrollments * 50;

  const professionalCompletionPoints =
    professionalCompletions * 20;

  const oneDayEnrollmentPoints =
    oneDayEnrollments * 20;

  const freeJourneyPoints =
    viewedFreeJourneys * 5;

  const surveyPoints =
    surveys.length * 20;

  const projectPoints =
    projects.length * 50;

  const featuredProjectPoints =
    projects.filter(
      (project) =>
        Boolean(project.show_on_home) ||
        Boolean(project.show_on_course),
    ).length * 20;

  const coursePoints =
    professionalEnrollmentPoints +
    oneDayEnrollmentPoints +
    freeJourneyPoints;

  const completionPoints =
    professionalCompletionPoints;

  const totalPoints =
  professionalEnrollmentPoints +
  professionalCompletionPoints +
  oneDayEnrollmentPoints +
  freeJourneyPoints +
  surveyPoints +
  projectPoints +
  featuredProjectPoints +
  referralPoints +
  bonusPoints;

  const drawEntries = Math.floor(
    totalPoints / 100,
  );

  const current =
    LEVELS.find(
      (level) =>
        totalPoints >= level.min &&
        totalPoints <= level.max,
    ) ?? LEVELS[0];

  const currentIndex =
    LEVELS.indexOf(current);

  const next =
    LEVELS[currentIndex + 1] ?? null;

  let progressPercent = 100;
  let pointsToNextLevel = 0;

  if (next) {
    progressPercent = Math.min(
      100,
      Math.max(
        0,
        ((totalPoints - current.min) /
          (next.min - current.min)) *
          100,
      ),
    );

    pointsToNextLevel = Math.max(
      0,
      next.min - totalPoints,
    );
  }

  return {
    totalPoints,
bonusPoints,
  bonusPointsHistory,

    currentLevel: current.name,
    nextLevel: next?.name ?? null,

    currentLevelPoints: current.min,
    nextLevelPoints: next?.min ?? null,

    progressPercent,
    pointsToNextLevel,

    drawEntries,

    rewardCourses,
    rewardItems,

    earnedRewards,
    redeemedRewards,
    availableRewards,
    rewardBalance,
    rewardProgress,

    lastRewardCourseId,
    lastRewardCourseTitle,
    lastRewardRedeemedAt,

    enrolledCourses:
      approvedEnrollments.length,

    completedCourses:
      professionalCompletions,

    professionalEnrollments,
    professionalCompletions,
    oneDayEnrollments,
    viewedFreeJourneys,
professionalEnrollmentsCount:
  professionalEnrollments,

professionalCompletionsCount:
  professionalCompletions,

oneDayEnrollmentsCount:
  oneDayEnrollments,

freeJourneyViewsCount:
  viewedFreeJourneys,

surveyCount:
  surveys.length,

projectCount:
  projects.length,

featuredProjectCount:
  projects.filter(
    p =>
      p.show_on_home ||
      p.show_on_course
  ).length,

referralCount,
    professionalEnrollmentPoints,
    professionalCompletionPoints,
    oneDayEnrollmentPoints,
    freeJourneyPoints,

    surveyPoints,
    projectPoints,
    featuredProjectPoints,
    referralPoints,

    coursePoints,
    completionPoints,
  };
}