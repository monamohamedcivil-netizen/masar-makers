"use server";

import { getMasarPassport } from "@/lib/dashboard/masar-passport";
import { revalidatePath } from "next/cache";

import {
  createClient,
} from "@/lib/supabase/server";

export interface StudentSummary {
  userId: string;

  studentName: string;
  studentEmail: string;
  studentPhone: string | null;
  studentCountry: string | null;

  professionalEnrollments: number;
  oneDayEnrollments: number;
  freeEnrollments: number;

  totalEnrollments: number;
  approvedEnrollments: number;
  pendingEnrollments: number;

  completedCourses: number;

  certificatesCount: number;
  projectsCount: number;
  surveysCount: number;

  totalPoints: number;
  bonusPoints: number;
lastBonusReason: string | null;
  rewardCourses: number;
  drawEntries: number;
  drawWins: number;
  availableDrawEntries: number;

earnedRewards: number;
redeemedRewards: number;
availableRewards: number;
rewardBalance: number;
rewardProgress: number;

lastRewardCourseId: string | null;
lastRewardCourseTitle: string | null;
lastRewardRedeemedAt: string | null;
}

type GenericRow = Record<string, unknown>;

function textValue(
  value: unknown,
): string | null {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const text = String(value).trim();

  return text || null;
}

function normalizeValue(
  value: unknown,
) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replaceAll("-", "_")
    .replaceAll(" ", "_");
}

function getStudentName(
  profile: GenericRow | undefined,
) {
  return (
    textValue(profile?.full_name) ??
    textValue(profile?.name) ??
    textValue(profile?.display_name) ??
    textValue(profile?.username) ??
    "طالب غير معروف"
  );
}

function getStudentEmail(
  profile: GenericRow | undefined,
) {
  return (
    textValue(profile?.email) ??
    textValue(profile?.user_email) ??
    ""
  );
}

function getStudentPhone(
  profile: GenericRow | undefined,
) {
  return (
    textValue(profile?.phone) ??
    textValue(profile?.phone_number) ??
    textValue(profile?.whatsapp) ??
    textValue(
      profile?.whatsapp_number,
    )
  );
}

function getStudentCountry(
  profile: GenericRow | undefined,
) {
  return (
    textValue(profile?.country) ??
    textValue(profile?.country_name) ??
    textValue(profile?.nationality)
  );
}

function isProfessionalJourney(
  journeyType: unknown,
) {
  const type =
    normalizeValue(journeyType);

  return [
    "career_path",
    "career",
    "professional",
    "professional_journey",
    "integrated",
    "fundamental",
    "fundamentals",
    "advanced",
  ].includes(type);
}

function isOneDayJourney(
  journeyType: unknown,
) {
  const type =
    normalizeValue(journeyType);

  return [
    "workshop",
    "one_day",
    "one_day_journey",
    "one_day_workshop",
  ].includes(type);
}

function isFreeJourney(
  journeyType: unknown,
) {
  const type =
    normalizeValue(journeyType);

  return [
    "free",
    "free_session",
    "free_journey",
  ].includes(type);
}

function isApprovedStatus(
  status: unknown,
) {
  const value = normalizeValue(status);

  return [
    "approved",
    "active",
    "enrolled",
    "confirmed",
    "completed",
  ].includes(value);
}

function isPendingStatus(
  status: unknown,
) {
  const value = normalizeValue(status);

  return [
    "pending",
    "requested",
    "waiting",
    "under_review",
  ].includes(value);
}

type CoursePartsInfo = {
  hasFundamentals: boolean;
  hasAdvanced: boolean;
};

function getEnrollmentJourneyCount(
  enrollment: GenericRow,
  coursePartsMap: Map<string, CoursePartsInfo>,
) {
  const journeyType =
    normalizeValue(enrollment.journey_type);

  const courseId =
    textValue(enrollment.course_id);

  if (!courseId) {
    return 1;
  }

  if (
    isOneDayJourney(journeyType) ||
    isFreeJourney(journeyType)
  ) {
    return 1;
  }

  if (!isProfessionalJourney(journeyType)) {
    return 1;
  }

  const parts =
    coursePartsMap.get(courseId);

  if (!parts) {
    return 1;
  }

  const isSplitCourse =
    parts.hasFundamentals ||
    parts.hasAdvanced;

  if (!isSplitCourse) {
    return 1;
  }

  if (
    journeyType === "fundamental" ||
    journeyType === "fundamentals" ||
    journeyType === "advanced"
  ) {
    return 1;
  }

  const grantsAll =
    journeyType === "integrated" ||
    journeyType === "professional" ||
    journeyType === "professional_journey" ||
    journeyType === "career_path" ||
    journeyType === "career";

  if (grantsAll) {
    const count =
      Number(parts.hasFundamentals) +
      Number(parts.hasAdvanced);

    return Math.max(1, count);
  }

  return 1;
}

export async function getStudentsSummary(): Promise<
  StudentSummary[]
> {
  const supabase = await createClient();

  const [
  enrollmentsResult,
  profilesResult,
  certificatesResult,
  bonusPointsResult,
] = await Promise.all([
    supabase
      .from("enrollments")
      .select(
        "user_id,course_id,status,journey_type,action_key",
      ),

    supabase
      .from("profiles")
      .select("*"),

    supabase
      .from("certificates")
      .select("user_id,status"),
      supabase
  .from("student_bonus_points")
  .select(
    "user_id,points,reason,point_type,created_at",
  )
  .order("created_at", {
    ascending: false,
  }),
  ]);

  if (enrollmentsResult.error) {
    throw new Error(
      enrollmentsResult.error.message,
    );
  }

  if (profilesResult.error) {
    throw new Error(
      profilesResult.error.message,
    );
  }

  if (certificatesResult.error) {
    console.error(
      "LOAD ADMIN CERTIFICATES ERROR",
      certificatesResult.error.message,
    );
  }

  const enrollments = (
    enrollmentsResult.data ?? []
  ) as GenericRow[];

  const enrollmentCourseIds = [
    ...new Set(
      enrollments
        .map((enrollment) =>
          textValue(enrollment.course_id),
        )
        .filter(
          (courseId): courseId is string =>
            Boolean(courseId),
        ),
    ),
  ];

  const coursePartsMap =
    new Map<string, CoursePartsInfo>();

  if (enrollmentCourseIds.length > 0) {
    const {
      data: lessonRows,
      error: lessonsError,
    } = await supabase
      .from("lessons")
      .select("course_id,course_part,status")
      .in("course_id", enrollmentCourseIds)
      .eq("status", "published");

    if (lessonsError) {
      console.error(
        "LOAD ADMIN STUDENT COURSE PARTS ERROR",
        lessonsError.message,
      );
    } else {
      for (const lesson of lessonRows ?? []) {
        const courseId =
          textValue(lesson.course_id);

        if (!courseId) {
          continue;
        }

        const current =
          coursePartsMap.get(courseId) ?? {
            hasFundamentals: false,
            hasAdvanced: false,
          };

        const part =
          normalizeValue(lesson.course_part);

        if (
          part === "fundamental" ||
          part === "fundamentals"
        ) {
          current.hasFundamentals = true;
        }

        if (part === "advanced") {
          current.hasAdvanced = true;
        }

        coursePartsMap.set(courseId, current);
      }
    }
  }

  /*
   * الرحلات المجانية الجديدة مرتبطة بمحاضرة محددة
   * عبر action_key = free:lesson:LESSON_ID.
   * نقرأ تقدم هذه المحاضرات حتى يكون عمود "النشط"
   * = الرحلات التي لم تُكمل بعد فقط.
   */
  const freeLessonIds = [
    ...new Set(
      enrollments
        .filter((enrollment) =>
          isFreeJourney(
            enrollment.journey_type,
          ),
        )
        .map((enrollment) =>
          textValue(
            enrollment.action_key,
          ),
        )
        .filter(
          (actionKey): actionKey is string =>
            Boolean(
              actionKey?.startsWith(
                "free:lesson:",
              ),
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

  const freeLessonProgressMap =
    new Map<
      string,
      {
        completed: boolean;
        progressPercent: number;
      }
    >();

  if (freeLessonIds.length > 0) {
    const {
      data: freeProgressRows,
      error: freeProgressError,
    } = await supabase
      .from("lesson_progress")
      .select(
        "lesson_id,completed,progress_percent",
      )
      .in("lesson_id", freeLessonIds);

    if (freeProgressError) {
      console.error(
        "LOAD ADMIN FREE JOURNEY PROGRESS ERROR",
        freeProgressError.message,
      );
    } else {
      for (
        const row of
          freeProgressRows ?? []
      ) {
        const lessonId =
          textValue(row.lesson_id);

        if (!lessonId) {
          continue;
        }

        freeLessonProgressMap.set(
          lessonId,
          {
            completed:
              Boolean(row.completed) ||
              Number(
                row.progress_percent ??
                  0,
              ) >= 100,
            progressPercent:
              Math.max(
                0,
                Math.min(
                  100,
                  Number(
                    row.progress_percent ??
                      0,
                  ) || 0,
                ),
              ),
          },
        );
      }
    }
  }

  const profiles = (
    profilesResult.data ?? []
  ) as GenericRow[];

  const certificates = (
    certificatesResult.data ?? []
  ) as GenericRow[];
if (bonusPointsResult.error) {
  console.error(
    "LOAD ADMIN BONUS POINTS ERROR",
    bonusPointsResult.error.message,
  );
}

const bonusPointRows = (
  bonusPointsResult.data ?? []
) as GenericRow[];

const bonusPointsMap =
  new Map<string, number>();

const lastBonusReasonMap =
  new Map<string, string>();

for (const bonusRow of bonusPointRows) {
  const userId =
    textValue(bonusRow.user_id);

  if (!userId) {
    continue;
  }

  const points =
    Number(bonusRow.points ?? 0);

  bonusPointsMap.set(
    userId,
    (bonusPointsMap.get(userId) ?? 0) +
      points,
  );

  /*
   * البيانات مرتبة من الأحدث للأقدم،
   * لذلك أول سبب نجده هو السبب الأخير.
   */
  if (!lastBonusReasonMap.has(userId)) {
    const reason =
      textValue(bonusRow.reason);

    if (reason) {
      lastBonusReasonMap.set(
        userId,
        reason,
      );
    }
  }
}
  const profileMap = new Map<
    string,
    GenericRow
  >();

  for (const profile of profiles) {
    const profileId =
      textValue(profile.id);

    if (profileId) {
      profileMap.set(
        profileId,
        profile,
      );
    }
  }

  const certificateCountMap =
    new Map<string, number>();

  for (const certificate of certificates) {
    const userId =
      textValue(certificate.user_id);

    if (!userId) continue;

    const status = normalizeValue(
      certificate.status,
    );

    if (
      status &&
      status !== "issued" &&
      status !== "active"
    ) {
      continue;
    }

    certificateCountMap.set(
      userId,
      (certificateCountMap.get(userId) ??
        0) + 1,
    );
  }

  const students = new Map<
    string,
    StudentSummary
  >();

  function ensureStudent(
    userId: string,
  ) {
    const existing =
      students.get(userId);

    if (existing) {
      return existing;
    }

    const profile =
      profileMap.get(userId);

    const student: StudentSummary = {
      userId,

      studentName:
        getStudentName(profile),

      studentEmail:
        getStudentEmail(profile),

      studentPhone:
        getStudentPhone(profile),

      studentCountry:
        getStudentCountry(profile),

      professionalEnrollments: 0,
      oneDayEnrollments: 0,
      freeEnrollments: 0,

      totalEnrollments: 0,
      approvedEnrollments: 0,
      pendingEnrollments: 0,

      completedCourses: 0,

      certificatesCount:
        certificateCountMap.get(
          userId,
        ) ?? 0,

      projectsCount: 0,
      surveysCount: 0,

      totalPoints: 0,
      

bonusPoints:
  bonusPointsMap.get(userId) ?? 0,

lastBonusReason:
  lastBonusReasonMap.get(userId) ??
  null,

rewardCourses: 0,
      
      earnedRewards: 0,
redeemedRewards: 0,
availableRewards: 0,
rewardBalance: 0,
rewardProgress: 0,

lastRewardCourseId: null,
lastRewardCourseTitle: null,
lastRewardRedeemedAt: null,
      drawEntries: 0,
      drawWins: 0,
      availableDrawEntries: 0,
    };

    students.set(userId, student);

    return student;
  }

  for (const enrollment of enrollments) {
    const userId =
      textValue(enrollment.user_id);

    if (!userId) continue;

    const student =
      ensureStudent(userId);

    const journeyCount =
      getEnrollmentJourneyCount(
        enrollment,
        coursePartsMap,
      );

    const isFree =
      isFreeJourney(
        enrollment.journey_type,
      );

    /*
     * الرحلات المجانية رحلات تعليمية فعلية،
     * لكنها ليست اشتراكات مدفوعة.
     */
    if (isFree) {
      student.freeEnrollments +=
        journeyCount;

      const actionKey =
        textValue(
          enrollment.action_key,
        );

      const freeLessonId =
        actionKey?.startsWith(
          "free:lesson:",
        )
          ? actionKey.slice(
              "free:lesson:".length,
            )
          : null;

      const freeProgress =
        freeLessonId
          ? freeLessonProgressMap.get(
              freeLessonId,
            )
          : undefined;

      const freeJourneyCompleted =
        Boolean(
          freeProgress?.completed,
        ) ||
        Number(
          freeProgress?.progressPercent ??
            0,
        ) >= 100;

      /*
       * الرحلة المجانية لا تدخل في إجمالي الاشتراكات،
       * لكن تدخل في "النشط" طالما لم تُكمل بعد.
       */
      if (
        !freeJourneyCompleted &&
        isApprovedStatus(
          enrollment.status,
        )
      ) {
        student.approvedEnrollments +=
          journeyCount;
      }

      if (
        isPendingStatus(
          enrollment.status,
        )
      ) {
        student.pendingEnrollments +=
          journeyCount;
      }

      continue;
    }

    student.totalEnrollments +=
      journeyCount;

    if (
      isProfessionalJourney(
        enrollment.journey_type,
      )
    ) {
      student.professionalEnrollments +=
        journeyCount;
    }

    if (
      isOneDayJourney(
        enrollment.journey_type,
      )
    ) {
      student.oneDayEnrollments +=
        journeyCount;
    }

    if (
      isApprovedStatus(
        enrollment.status,
      )
    ) {
      student.approvedEnrollments +=
        journeyCount;
    }

    if (
      isPendingStatus(
        enrollment.status,
      )
    ) {
      student.pendingEnrollments +=
        journeyCount;
    }
  }

  /*
   * إظهار أي Profile لطالب حتى لو لم يكن
   * لديه اشتراك مسجل حتى الآن.
   */
  for (const profile of profiles) {
    const userId =
      textValue(profile.id);

    if (!userId) continue;

    const role =
      normalizeValue(profile.role);

    if (
      role === "admin" ||
      role === "super_admin"
    ) {
      continue;
    }

    ensureStudent(userId);
  }

  const rows = Array.from(
    students.values(),
  );

  /*
   * الربط السريع مع نفس نظام النقاط
   * المستخدم في Masar Engineering Passport.
   */
  await Promise.all(
    rows.map(async (student) => {
      try {
        const passport =
          await getMasarPassport(
            student.userId,
          );

        student.completedCourses =
          passport.completedCourses;

        student.projectsCount =
          passport.projectCount;

        student.surveysCount =
          passport.surveyCount;

        student.totalPoints =
          passport.totalPoints;

        student.rewardCourses =
          passport.rewardCourses;
student.earnedRewards =
  passport.earnedRewards;

student.redeemedRewards =
  passport.redeemedRewards;

student.availableRewards =
  passport.availableRewards;

student.rewardBalance =
  passport.rewardBalance;

student.rewardProgress =
  passport.rewardProgress;

student.lastRewardCourseId =
  passport.lastRewardCourseId;

student.lastRewardCourseTitle =
  passport.lastRewardCourseTitle;

student.lastRewardRedeemedAt =
  passport.lastRewardRedeemedAt;
        student.drawEntries =
          passport.drawEntries;

        student.drawWins =
          passport.drawWins;

        student.availableDrawEntries =
          passport.availableDrawEntries;
      } catch (error) {
        console.error(
          `LOAD PASSPORT ERROR: ${student.userId}`,
          error,
        );
      }
    }),
  );

  return rows.sort((a, b) =>
    a.studentName.localeCompare(
      b.studentName,
      "ar",
    ),
  );
}

export async function addStudentBonusPoints(
  userId: string,
  points: number,
  reason: string,
  pointType: "referral" | "bonus" | "adjustment",
) {
  const normalizedUserId =
    userId.trim();

  const normalizedReason =
    reason.trim();

  const normalizedPointType =
    pointType.trim().toLowerCase();

  const normalizedPoints =
    Math.trunc(Number(points));

  if (!normalizedUserId) {
    return {
      success: false,
      message: "معرف الطالب غير موجود.",
    };
  }

  if (
    !Number.isFinite(normalizedPoints) ||
    normalizedPoints === 0
  ) {
    return {
      success: false,
      message:
        "يرجى إدخال عدد نقاط صحيح لا يساوي صفر.",
    };
  }

  if (!normalizedReason) {
    return {
      success: false,
      message:
        "يرجى كتابة سبب إضافة النقاط.",
    };
  }

  if (
    ![
      "referral",
      "bonus",
      "adjustment",
    ].includes(normalizedPointType)
  ) {
    return {
      success: false,
      message:
        "يرجى اختيار نوع النقاط.",
    };
  }

  const supabase =
    await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      success: false,
      message:
        "يجب تسجيل الدخول كمسؤول.",
    };
  }

  const {
    data: adminProfile,
    error: adminError,
  } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = String(
    adminProfile?.role ?? "",
  ).toLowerCase();

  if (
    adminError ||
    !["admin", "super_admin"].includes(role)
  ) {
    return {
      success: false,
      message:
        "ليس لديك صلاحية لإضافة نقاط.",
    };
  }

  const { error } = await supabase
    .from("student_bonus_points")
    .insert({
      user_id: normalizedUserId,
      points: normalizedPoints,
      reason: normalizedReason,
      point_type: normalizedPointType,
      created_by: user.id,
    });

  if (error) {
    console.error(
      "ADD STUDENT BONUS POINTS ERROR:",
      error.message,
    );

    return {
      success: false,
      message: error.message,
    };
  }

  revalidatePath("/admin/students");
  revalidatePath(
    `/admin/students/${normalizedUserId}`,
  );
  revalidatePath("/dashboard");

  return {
    success: true,
    message:
      normalizedPoints > 0
        ? `تمت إضافة ${normalizedPoints} نقطة بنجاح.`
        : `تم خصم ${Math.abs(
            normalizedPoints,
          )} نقطة بنجاح.`,
  };
}
export interface StudentBonusPointHistoryItem {
  id: string;
  points: number;
  reason: string;
  pointType:
    | "referral"
    | "bonus"
    | "adjustment";
  createdAt: string;
}

export async function getStudentBonusPointsHistory(
  userId: string,
): Promise<{
  success: boolean;
  items: StudentBonusPointHistoryItem[];
  message?: string;
}> {
  const normalizedUserId = userId.trim();

  if (!normalizedUserId) {
    return {
      success: false,
      items: [],
      message: "معرف الطالب غير موجود.",
    };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      items: [],
      message: "يجب تسجيل الدخول.",
    };
  }

  const { data, error } = await supabase
    .from("student_bonus_points")
    .select(
      "id,points,reason,point_type,created_at",
    )
    .eq("user_id", normalizedUserId)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error(
      "LOAD STUDENT BONUS POINT HISTORY ERROR:",
      error.message,
    );

    return {
      success: false,
      items: [],
      message: "تعذر تحميل سجل النقاط.",
    };
  }

  return {
    success: true,
    items: (data ?? []).map((row) => ({
      id: String(row.id),
      points: Number(row.points ?? 0),
      reason: String(row.reason ?? ""),
      pointType:
        (String(
          row.point_type ?? "bonus",
        ) as
          | "referral"
          | "bonus"
          | "adjustment"),
      createdAt: String(row.created_at ?? ""),
    })),
  };
}