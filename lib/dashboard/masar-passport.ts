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
  iconUrl: string | null;
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
  drawWins: number;
  availableDrawEntries: number;

  drawRewardsEarned: number;
  drawRewardsRedeemed: number;
  drawRewardsAvailable: number;

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
        station_id: string | null;
        level: string | null;
      }
    | {
        id: string;
        slug: string | null;
        title: string | null;
        title_ar: string | null;
        course_code: string | null;
        station_id: string | null;
        level: string | null;
      }[]
    | null;
};

type ProgressRow = {
  course_id: string;
  progress_percent: number | string | null;
  status?: string | null;
};

type ImportedEnrollmentRow =
  EnrollmentRow & {
    progress_percent:
      | number
      | string
      | null;

    split_progress:
      | Record<string, unknown>
      | null;
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
  "free_journey",
  "free-journey",
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

const getImportedPartProgress = (
  enrollment:
    ImportedEnrollmentRow,
  part:
    | "single"
    | "fundamentals"
    | "advanced",
): ProgressRow => {
  const baseProgress =
    Math.max(
      0,
      Math.min(
        100,
        Number(
          enrollment.progress_percent ??
            0,
        ),
      ),
    );

  if (part === "single") {
    return {
      course_id:
        enrollment.course_id,
      progress_percent:
        baseProgress,
      status:
        baseProgress >= 100
          ? "completed"
          : null,
    };
  }

  const split =
    enrollment.split_progress &&
    typeof enrollment.split_progress ===
      "object" &&
    !Array.isArray(
      enrollment.split_progress,
    )
      ? enrollment.split_progress
      : {};

  const raw =
    split[part] ??
    (
      part ===
      "fundamentals"
        ? split[
            "fundamental"
          ]
        : undefined
    );

  /*
   * دعم السجلات القديمة:
   * إذا لم يتم فصل progress بعد، نستخدم progress_percent
   * القديم كبداية لكلا الجزأين.
   */
  const value =
    raw === undefined ||
    raw === null
      ? baseProgress
      : Math.max(
          0,
          Math.min(
            100,
            Number(raw),
          ),
        );

  return {
    course_id:
      enrollment.course_id,
    progress_percent:
      Number.isFinite(value)
        ? value
        : baseProgress,
    status:
      Number(value) >= 100
        ? "completed"
        : null,
  };
};

async function getMonthlyDrawStats(
  input: {
    userId?: string | null;
    registryId?: string | null;
  },
) {
  const supabase =
    createAdminClient();

  let registryId =
    input.registryId?.trim() ||
    null;

  const userId =
    input.userId?.trim() ||
    null;

  if (!registryId && userId) {
    const {
      data: registryRow,
      error: registryError,
    } = await supabase
      .from("student_registry")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (registryError) {
      console.error(
        "Failed to resolve monthly draw registry:",
        registryError.message,
      );
    } else {
      registryId =
        registryRow?.id ?? null;
    }
  }

  const {
    data: drawRows,
    error: drawError,
  } = await supabase
    .from("monthly_draws")
    .select(
      "winner_user_id,winner_registry_id,reward_enrollment_id",
    )
    .eq("status", "completed");

  if (drawError) {
    console.error(
      "Failed to load monthly draw stats:",
      drawError.message,
    );

    return {
      wins: 0,
      rewardsRedeemed: 0,
      rewardsAvailable: 0,
    };
  }

  const matchingRows =
    (drawRows ?? []).filter(
      (row) => {
        /*
         * registry_id هو الهوية الأساسية متى كان موجودًا.
         * نستخدم user_id فقط للسحوبات القديمة التي لم يكن
         * winner_registry_id محفوظًا فيها.
         */
        if (
          registryId &&
          row.winner_registry_id ===
            registryId
        ) {
          return true;
        }

        return Boolean(
          userId &&
            !row.winner_registry_id &&
            row.winner_user_id ===
              userId,
        );
      },
    );

  const wins =
    matchingRows.length;

  const rewardsRedeemed =
    matchingRows.filter(
      (row) =>
        Boolean(
          row.reward_enrollment_id,
        ),
    ).length;

  return {
    wins,
    rewardsRedeemed,
    rewardsAvailable:
      Math.max(
        0,
        wins - rewardsRedeemed,
      ),
  };
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
  course_code,
  station_id,
  level
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
const stationIds = [
  ...new Set(
    approvedEnrollments
      .map((enrollment) => {
        const course = Array.isArray(enrollment.courses)
          ? enrollment.courses[0]
          : enrollment.courses;

        return course?.station_id ?? null;
      })
      .filter((id): id is string => Boolean(id)),
  ),
];

const stationIconById = new Map<string, string | null>();

if (stationIds.length > 0) {
  const stationsResult = await supabase
    .from("course_stations")
    .select("id,icon_url")
    .in("id", stationIds);

  if (stationsResult.error) {
    console.error(
      "Failed to load reward station icons:",
      stationsResult.error.message,
    );
  } else {
    for (const station of stationsResult.data ?? []) {
      stationIconById.set(
        station.id,
        station.icon_url ?? null,
      );
    }
  }
}
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
/*
 * تقدم الرحلات المجانية مرتبط بالمحاضرة نفسها:
 * action_key = free:lesson:LESSON_ID
 *
 * ولا تحتسب الرحلة في النقاط إلا عند إكمال 90% على الأقل.
 */
const freeLessonIds = [
  ...new Set(
    approvedEnrollments
      .filter((enrollment) =>
        FREE_TYPES.has(
          normalize(
            enrollment.journey_type,
          ),
        ),
      )
      .map(
        (enrollment) =>
          enrollment.action_key?.trim() ??
          "",
      )
      .filter((actionKey) =>
        actionKey.startsWith(
          "free:lesson:",
        ),
      )
      .map((actionKey) =>
        actionKey.slice(
          "free:lesson:".length,
        ),
      )
      .filter(Boolean),
  ),
];

const freeLessonProgressById =
  new Map<string, number>();

/*
 * الرحلة المجانية تُحتسب في النقاط فقط إذا وصل الطالب
 * إلى 90% أو أكثر من المحاضرة المرتبطة بالـ Enrollment.
 *
 * مصدر الحقيقة هنا هو lesson_progress.
 */
let completedFreeJourneyCount = 0;

if (freeLessonIds.length > 0) {
  const {
    data: freeProgressRows,
    error: freeProgressError,
  } = await supabase
    .from("lesson_progress")
    .select(
      "lesson_id,progress_percent,completed",
    )
    .eq("user_id", userId)
    .in(
      "lesson_id",
      freeLessonIds,
    );

  if (freeProgressError) {
    console.error(
      "Failed to load free journey progress:",
      freeProgressError.message,
    );
  } else {
    const completedLessonIds =
      new Set<string>();

    for (
      const row of
        freeProgressRows ?? []
    ) {
      const progressPercent =
        Boolean(row.completed)
          ? 100
          : Math.max(
              0,
              Math.min(
                100,
                Number(
                  row.progress_percent ??
                    0,
                ) || 0,
              ),
            );

      if (
        row.lesson_id &&
        progressPercent >= 90
      ) {
        completedLessonIds.add(
          String(row.lesson_id),
        );
      }
    }

    completedFreeJourneyCount =
      completedLessonIds.size;
      
  }
}
  


  let professionalEnrollments = 0;
  let professionalCompletions = 0;
  let oneDayEnrollments = 0;
  let viewedFreeJourneys =
  completedFreeJourneyCount;

  const rewardItems: RewardItem[] = [];

  approvedEnrollments.forEach(
    (enrollment, index) => {
      const journeyType = normalize(enrollment.journey_type);
      const isOneDay = ONE_DAY_TYPES.has(journeyType);
      const isFree = FREE_TYPES.has(journeyType);
      const isProfessional = !isOneDay && !isFree;

      const progress = progressByCourseId.get(enrollment.course_id);

      if (isOneDay) {
        oneDayEnrollments += 1;
      }

            if (!isProfessional) return;

      const course = Array.isArray(enrollment.courses)
        ? enrollment.courses[0]
        : enrollment.courses;

      const courseId =
        enrollment.course_id ||
        course?.id ||
        `course-${index}`;

      const courseName =
        course?.course_code?.trim() ||
        course?.title_ar?.trim() ||
        course?.title?.trim() ||
        "رحلة احتراف";

      const iconUrl = course?.station_id
        ? stationIconById.get(course.station_id) ?? null
        : null;

      // مصدر الحقيقة: courses.level
      // single = رحلة واحدة
      // split = Fundamentals + Advanced
      const courseLevel =
        normalize(course?.level) === "split"
          ? "split"
          : "single";

      const enrollmentType = normalize(
        [enrollment.journey_type, enrollment.action_key]
          .filter(Boolean)
          .join(" "),
      );

      const isIntegrated =
        enrollmentType.includes("integrated") ||
        enrollmentType.includes("متكامل");

      const isFundamentals =
        enrollmentType.includes("fundamental") ||
        enrollmentType.includes("foundation") ||
        enrollmentType.includes("basic") ||
        enrollmentType.includes("أساسيات");

      const isAdvanced =
        enrollmentType.includes("advanced") ||
        enrollmentType.includes("متقدم");

      // Single = رحلة واحدة دائمًا
      if (courseLevel === "single") {
        professionalEnrollments += 1;

        if (isCompletedProgress(progress)) {
          professionalCompletions += 1;
        }

        rewardItems.push({
          key: `${courseId}-single`,
          courseId,
          courseName,
          courseType: "single",
          courseTypeLabel: null,
          iconUrl,
        });
        return;
      }

      // Split + Integrated = رحلتان
      if (isIntegrated) {
        professionalEnrollments += 2;

        if (isCompletedProgress(progress)) {
          professionalCompletions += 2;
        }

        rewardItems.push(
          {
            key: `${courseId}-fundamentals`,
            courseId,
            courseName,
            courseType: "fundamentals",
            courseTypeLabel: "أساسيات",
            iconUrl,
          },
          {
            key: `${courseId}-advanced`,
            courseId,
            courseName,
            courseType: "advanced",
            courseTypeLabel: "متقدم",
            iconUrl,
          },
        );
        return;
      }

      // Split + Fundamentals = رحلة واحدة
      if (isFundamentals) {
        professionalEnrollments += 1;

        if (isCompletedProgress(progress)) {
          professionalCompletions += 1;
        }

        rewardItems.push({
          key: `${courseId}-fundamentals`,
          courseId,
          courseName,
          courseType: "fundamentals",
          courseTypeLabel: "أساسيات",
          iconUrl,
        });
        return;
      }

      // Split + Advanced = رحلة واحدة
      if (isAdvanced) {
        professionalEnrollments += 1;

        if (isCompletedProgress(progress)) {
          professionalCompletions += 1;
        }

        rewardItems.push({
          key: `${courseId}-advanced`,
          courseId,
          courseName,
          courseType: "advanced",
          courseTypeLabel: "متقدم",
          iconUrl,
        });
        return;
      }

      // Fallback آمن لسجل قديم غير واضح
      professionalEnrollments += 1;

      if (isCompletedProgress(progress)) {
        professionalCompletions += 1;
      }

      rewardItems.push({
        key: `${courseId}-single`,
        courseId,
        courseName,
        courseType: "single",
        courseTypeLabel: null,
        iconUrl,
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

  const monthlyDrawStats =
    await getMonthlyDrawStats({
      userId,
    });

  const drawWins =
    monthlyDrawStats.wins;

  const availableDrawEntries =
    Math.max(
      0,
      drawEntries - drawWins,
    );

  const drawRewardsEarned =
    drawWins;

  const drawRewardsRedeemed =
    monthlyDrawStats.rewardsRedeemed;

  const drawRewardsAvailable =
    monthlyDrawStats.rewardsAvailable;

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
    drawWins,
    availableDrawEntries,

    drawRewardsEarned,
    drawRewardsRedeemed,
    drawRewardsAvailable,

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

/* =========================================================
   IMPORTED / REGISTRY PASSPORT
   ---------------------------------------------------------
   نفس قواعد Masar Passport للطالب الذي تم استيراده قبل
   إنشاء حساب على المنصة.

   - إذا أصبح Registry مرتبطًا بـ user_id:
     نرجع مباشرة إلى getMasarPassport(user_id)، وبالتالي
     يصبح الحساب من نفس مصدر الطالب المسجل بدون أي ازدواجية.

   - إذا لم يسجل الطالب بعد:
     نحسب بياناته من البريد الإلكتروني الموجود في
     student_registry ومن البيانات المستوردة فقط.
========================================================= */

export async function getMasarPassportForRegistry(
  registryId: string,
): Promise<MasarPassportData> {
  const supabase = createAdminClient();

  const normalizedRegistryId =
    registryId?.trim();

  if (!normalizedRegistryId) {
    throw new Error(
      "معرّف الطالب المستورد غير موجود.",
    );
  }

  const {
    data: registry,
    error: registryError,
  } = await supabase
    .from("student_registry")
    .select(
      "id,user_id,email,normalized_email",
    )
    .eq("id", normalizedRegistryId)
    .maybeSingle();

  if (registryError) {
    throw new Error(
      registryError.message,
    );
  }

  if (!registry) {
    throw new Error(
      "تعذر العثور على سجل الطالب المستورد.",
    );
  }

  /*
   * بمجرد ارتباط الطالب بحساب حقيقي يصبح Passport الأصلي
   * هو المصدر الوحيد للحقيقة.
   */
  if (registry.user_id) {
    return getMasarPassport(
      registry.user_id,
    );
  }

  const studentEmail =
    String(
      registry.normalized_email ??
        registry.email ??
        "",
    )
      .trim()
      .toLowerCase();

  if (!studentEmail) {
    throw new Error(
      "البريد الإلكتروني للطالب المستورد غير موجود.",
    );
  }

  const enrollmentResult =
    await supabase
      .from("enrollments")
      .select(`
        course_id,
        journey_type,
        action_key,
        status,
        progress_percent,
        split_progress,
        courses (
          id,
          slug,
          title,
          title_ar,
          course_code,
          station_id,
          level
        )
      `)
      .ilike(
        "student_email",
        studentEmail,
      )
      .eq(
        "source",
        "admin_import",
      );

  if (enrollmentResult.error) {
    console.error(
      "Failed to load imported Masar Passport enrollments:",
      enrollmentResult.error.message,
    );
  }

  const enrollments =
    (enrollmentResult.data ??
      []) as ImportedEnrollmentRow[];

  const approvedEnrollments =
    enrollments.filter(
      (enrollment) =>
        isApprovedEnrollment(
          enrollment.status,
        ),
    );

  const stationIds = [
    ...new Set(
      approvedEnrollments
        .map((enrollment) => {
          const course =
            Array.isArray(
              enrollment.courses,
            )
              ? enrollment.courses[0]
              : enrollment.courses;

          return (
            course?.station_id ??
            null
          );
        })
        .filter(
          (id): id is string =>
            Boolean(id),
        ),
    ),
  ];

  const stationIconById =
    new Map<
      string,
      string | null
    >();

  if (stationIds.length > 0) {
    const stationsResult =
      await supabase
        .from("course_stations")
        .select("id,icon_url")
        .in("id", stationIds);

    if (stationsResult.error) {
      console.error(
        "Failed to load imported reward station icons:",
        stationsResult.error.message,
      );
    } else {
      for (
        const station of
          stationsResult.data ?? []
      ) {
        stationIconById.set(
          station.id,
          station.icon_url ??
            null,
        );
      }
    }
  }

  /*
   * قبل التسجيل لا يوجد student_course_progress مرتبط بـ user_id.
   * لذلك نستخدم progress_percent الموجود على Enrollment المستورد
   * كمصدر احتياطي إن كان موجودًا.
   */
  const importedProgressByCourseId =
    new Map<
      string,
      ProgressRow
    >();

  for (
    const enrollment of
      approvedEnrollments
  ) {
    const existing =
      importedProgressByCourseId.get(
        enrollment.course_id,
      );

    const currentPercent =
      Number(
        enrollment.progress_percent ??
          0,
      );

    const existingPercent =
      Number(
        existing?.progress_percent ??
          0,
      );

    if (
      !existing ||
      currentPercent >
        existingPercent
    ) {
      importedProgressByCourseId.set(
        enrollment.course_id,
        {
          course_id:
            enrollment.course_id,
          progress_percent:
            Number.isFinite(
              currentPercent,
            )
              ? currentPercent
              : 0,
          status:
            currentPercent >= 100
              ? "completed"
              : null,
        },
      );
    }
  }

  let professionalEnrollments = 0;
  let professionalCompletions = 0;
  let oneDayEnrollments = 0;
  let viewedFreeJourneys = 0;

  const rewardItems: RewardItem[] =
    [];

  approvedEnrollments.forEach(
    (enrollment, index) => {
      const journeyType =
        normalize(
          enrollment.journey_type,
        );

      const isOneDay =
        ONE_DAY_TYPES.has(
          journeyType,
        );

      const isFree =
        FREE_TYPES.has(
          journeyType,
        );

      const isProfessional =
        !isOneDay && !isFree;

      const progress =
        importedProgressByCourseId.get(
          enrollment.course_id,
        );

      const singleProgress =
        getImportedPartProgress(
          enrollment,
          "single",
        );

      const fundamentalsProgress =
        getImportedPartProgress(
          enrollment,
          "fundamentals",
        );

      const advancedProgress =
        getImportedPartProgress(
          enrollment,
          "advanced",
        );

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

      const course =
        Array.isArray(
          enrollment.courses,
        )
          ? enrollment.courses[0]
          : enrollment.courses;

      const courseId =
        enrollment.course_id ||
        course?.id ||
        `course-${index}`;

      const courseName =
        course?.course_code?.trim() ||
        course?.title_ar?.trim() ||
        course?.title?.trim() ||
        "رحلة احتراف";

      const iconUrl =
        course?.station_id
          ? stationIconById.get(
              course.station_id,
            ) ?? null
          : null;

      /*
       * نفس مصدر الحقيقة الموجود في getMasarPassport:
       * courses.level.
       */
      const courseLevel =
        normalize(
          course?.level,
        ) === "split"
          ? "split"
          : "single";

      const enrollmentType =
        normalize(
          [
            enrollment.journey_type,
            enrollment.action_key,
          ]
            .filter(Boolean)
            .join(" "),
        );

      const isIntegrated =
        enrollmentType.includes(
          "integrated",
        ) ||
        enrollmentType.includes(
          "متكامل",
        );

      const isFundamentals =
        enrollmentType.includes(
          "fundamental",
        ) ||
        enrollmentType.includes(
          "foundation",
        ) ||
        enrollmentType.includes(
          "basic",
        ) ||
        enrollmentType.includes(
          "أساسيات",
        );

      const isAdvanced =
        enrollmentType.includes(
          "advanced",
        ) ||
        enrollmentType.includes(
          "متقدم",
        );

      if (
        courseLevel ===
        "single"
      ) {
        professionalEnrollments +=
          1;

        if (
          isCompletedProgress(
            singleProgress,
          )
        ) {
          professionalCompletions +=
            1;
        }

        rewardItems.push({
          key:
            `${courseId}-single`,
          courseId,
          courseName,
          courseType:
            "single",
          courseTypeLabel:
            null,
          iconUrl,
        });

        return;
      }

      /*
       * Split + Integrated = رحلتان:
       * Fundamentals + Advanced.
       */
      if (isIntegrated) {
        professionalEnrollments +=
          2;

        if (
          isCompletedProgress(
            fundamentalsProgress,
          )
        ) {
          professionalCompletions +=
            1;
        }

        if (
          isCompletedProgress(
            advancedProgress,
          )
        ) {
          professionalCompletions +=
            1;
        }

        rewardItems.push(
          {
            key:
              `${courseId}-fundamentals`,
            courseId,
            courseName,
            courseType:
              "fundamentals",
            courseTypeLabel:
              "أساسيات",
            iconUrl,
          },
          {
            key:
              `${courseId}-advanced`,
            courseId,
            courseName,
            courseType:
              "advanced",
            courseTypeLabel:
              "متقدم",
            iconUrl,
          },
        );

        return;
      }

      if (isFundamentals) {
        professionalEnrollments +=
          1;

        if (
          isCompletedProgress(
            fundamentalsProgress,
          )
        ) {
          professionalCompletions +=
            1;
        }

        rewardItems.push({
          key:
            `${courseId}-fundamentals`,
          courseId,
          courseName,
          courseType:
            "fundamentals",
          courseTypeLabel:
            "أساسيات",
          iconUrl,
        });

        return;
      }

      if (isAdvanced) {
        professionalEnrollments +=
          1;

        if (
          isCompletedProgress(
            advancedProgress,
          )
        ) {
          professionalCompletions +=
            1;
        }

        rewardItems.push({
          key:
            `${courseId}-advanced`,
          courseId,
          courseName,
          courseType:
            "advanced",
          courseTypeLabel:
            "متقدم",
          iconUrl,
        });

        return;
      }

      professionalEnrollments +=
        1;

      if (
        isCompletedProgress(
          progress,
        )
      ) {
        professionalCompletions +=
          1;
      }

      rewardItems.push({
        key:
          `${courseId}-single`,
        courseId,
        courseName,
        courseType: "single",
        courseTypeLabel:
          null,
        iconUrl,
      });
    },
  );

  const rewardCourses =
    rewardItems.length;

  /*
   * الطالب غير المسجل لا يستطيع استبدال مكافأة من حسابه بعد،
   * لذلك redeemedRewards = 0 حتى يرتبط بحساب فعلي.
   */
  const redeemedRewards = 0;

  const earnedRewards =
    Math.floor(
      rewardCourses / 10,
    );

  const availableRewards =
    Math.max(
      0,
      earnedRewards -
        redeemedRewards,
    );

  const rewardBalance =
    Math.max(
      0,
      rewardCourses -
        redeemedRewards * 10,
    );

  const rewardProgress =
    availableRewards > 0
      ? 10
      : rewardBalance % 10;

  const surveysResult =
    await supabase
      .from(
        "student_surveys",
      )
      .select(
        "id,submitted_at",
      )
      .ilike(
        "student_email",
        studentEmail,
      )
      .eq(
        "source",
        "admin_import",
      )
      .not(
        "submitted_at",
        "is",
        null,
      );

  if (surveysResult.error) {
    console.error(
      "Failed to load imported Masar Passport surveys:",
      surveysResult.error.message,
    );
  }

  const surveys =
    surveysResult.data ?? [];

  const projectsResult =
    await supabase
      .from(
        "student_projects",
      )
      .select(`
        id,
        show_on_home,
        show_on_course
      `)
      .ilike(
        "student_email",
        studentEmail,
      )
      .eq(
        "source",
        "admin_import",
      )
      .eq(
        "status",
        "approved",
      );

  if (projectsResult.error) {
    console.error(
      "Failed to load imported Masar Passport projects:",
      projectsResult.error.message,
    );
  }

  const projects =
    projectsResult.data ?? [];

  /*
   * لا توجد Bonus / Referral points مرتبطة بالطالب قبل user_id.
   * عندما يسجل الطالب ستنتقل الدالة تلقائيًا إلى getMasarPassport
   * وسيتم احتسابها من student_bonus_points.
   */
  const bonusPoints = 0;
  const referralPoints = 0;
  const referralCount = 0;

  const bonusPointsHistory:
    BonusPointHistoryItem[] =
      [];

  const professionalEnrollmentPoints =
    professionalEnrollments *
    50;

  const professionalCompletionPoints =
    professionalCompletions *
    20;

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
        Boolean(
          project.show_on_home,
        ) ||
        Boolean(
          project.show_on_course,
        ),
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

  const drawEntries =
    Math.floor(
      totalPoints / 100,
    );

  const monthlyDrawStats =
    await getMonthlyDrawStats({
      registryId:
        normalizedRegistryId,
    });

  const drawWins =
    monthlyDrawStats.wins;

  const availableDrawEntries =
    Math.max(
      0,
      drawEntries - drawWins,
    );

  const drawRewardsEarned =
    drawWins;

  const drawRewardsRedeemed =
    monthlyDrawStats.rewardsRedeemed;

  const drawRewardsAvailable =
    monthlyDrawStats.rewardsAvailable;

  const current =
    LEVELS.find(
      (level) =>
        totalPoints >=
          level.min &&
        totalPoints <=
          level.max,
    ) ?? LEVELS[0];

  const currentIndex =
    LEVELS.indexOf(
      current,
    );

  const next =
    LEVELS[
      currentIndex + 1
    ] ?? null;

  let progressPercent = 100;
  let pointsToNextLevel = 0;

  if (next) {
    progressPercent =
      Math.min(
        100,
        Math.max(
          0,
          ((totalPoints -
            current.min) /
            (next.min -
              current.min)) *
            100,
        ),
      );

    pointsToNextLevel =
      Math.max(
        0,
        next.min -
          totalPoints,
      );
  }

  return {
    totalPoints,

    bonusPoints,
    bonusPointsHistory,

    currentLevel:
      current.name,

    nextLevel:
      next?.name ?? null,

    currentLevelPoints:
      current.min,

    nextLevelPoints:
      next?.min ?? null,

    progressPercent,
    pointsToNextLevel,

    drawEntries,
    drawWins,
    availableDrawEntries,

    drawRewardsEarned,
    drawRewardsRedeemed,
    drawRewardsAvailable,

    rewardCourses,
    rewardItems,

    earnedRewards,
    redeemedRewards,
    availableRewards,
    rewardBalance,
    rewardProgress,

    lastRewardCourseId:
      null,

    lastRewardCourseTitle:
      null,

    lastRewardRedeemedAt:
      null,

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
        (project) =>
          project.show_on_home ||
          project.show_on_course,
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