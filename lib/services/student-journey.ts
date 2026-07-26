import "server-only";

import { createClient } from "@/lib/supabase/server";

/* =========================================================
   Student Journey Service — V1

   مسؤول حاليًا عن:
   1) قراءة المحاضرة المفتوحة.
   2) تحديد اشتراكات الطالب النشطة في الكورس.
   3) تحديد آخر محاضرة المؤهلة لكل نوع رحلة.
   4) اكتشاف هل المحاضرة المفتوحة هي محاضرة تشغيل الشهادة.

   لا يقوم هذا الإصدار بتعديل:
   - certificate_status
   - survey_status
   - notifications
   - emails
========================================================= */

const CERTIFICATE_JOURNEY_TYPES = [
  "fundamental",
  "advanced",
  "integrated",
] as const;

type CertificateJourneyType =
  (typeof CERTIFICATE_JOURNEY_TYPES)[number];

type ActiveEnrollmentRow = {
  id: string;
  user_id: string;
  course_id: string;
  journey_id: string | null;
  journey_type: string;
  action_key: string | null;
  action_title: string | null;
  journey_title: string | null;
  course_title: string | null;
  status: string;
  certificate_status: string | null;
  survey_status: string | null;
};

type LessonRow = {
  id: string;
  course_id: string;
  journey_id: string | null;
  journey_type: string | null;
  title: string;
  title_ar: string | null;
  sort_order: number;
  status: string;
};

export type CertificateTriggerResult = {
  triggered: boolean;
  enrollmentId: string | null;
  journeyType: CertificateJourneyType | null;
  targetLessonId: string | null;
  currentLessonId: string;
  courseId: string;
  reason:
    | "trigger_lesson"
    | "not_trigger_lesson"
    | "unsupported_journey_type"
    | "no_active_enrollment"
    | "lesson_not_found"
    | "target_lesson_not_found";
};

export type LessonStartedJourneyResult = {
  certificateTriggered: boolean;
  triggers: CertificateTriggerResult[];
};

/**
 * يتحقق من أن قيمة journey_type من الأنواع المؤهلة للشهادة.
 */
function isCertificateJourneyType(
  value: string | null | undefined,
): value is CertificateJourneyType {
  return CERTIFICATE_JOURNEY_TYPES.includes(
    value as CertificateJourneyType,
  );
}

/**
 * يرتب المحاضرات تصاعديًا حسب sort_order.
 * وعند تساوي الترتيب يستخدم id لضمان نتيجة ثابتة.
 */
function sortLessonsAscending(
  lessons: LessonRow[],
): LessonRow[] {
  return [...lessons].sort((first, second) => {
    if (first.sort_order !== second.sort_order) {
      return first.sort_order - second.sort_order;
    }

    return first.id.localeCompare(second.id);
  });
}

/**
 * يعيد آخر محاضرة من القائمة.
 */
function getLastLesson(
  lessons: LessonRow[],
): LessonRow | null {
  const sortedLessons = sortLessonsAscending(lessons);

  return sortedLessons.length > 0
    ? sortedLessons[sortedLessons.length - 1]
    : null;
}

/**
 * يفضل المحاضرات المرتبطة بنفس journey_id الخاص بالاشتراك.
 *
 * إذا لم توجد محاضرات مطابقة لـ journey_id،
 * يرجع جميع محاضرات النوع المطلوب داخل الكورس.
 *
 * هذا يسمح للنظام بالعمل الآن، وكذلك بعد ربط الرحلات
 * والمحاضرات فعليًا في لوحة الإدارة.
 */
function filterLessonsForEnrollment(
  lessons: LessonRow[],
  enrollment: ActiveEnrollmentRow,
  lessonJourneyType: string,
): LessonRow[] {
  const lessonsOfRequiredType = lessons.filter(
    (lesson) => lesson.journey_type === lessonJourneyType,
  );

  if (!enrollment.journey_id) {
    return lessonsOfRequiredType;
  }

  const sameJourneyLessons = lessonsOfRequiredType.filter(
    (lesson) => lesson.journey_id === enrollment.journey_id,
  );

  return sameJourneyLessons.length > 0
    ? sameJourneyLessons
    : lessonsOfRequiredType;
}

/**
 * يجلب المحاضرة المنشورة التي فتحها الطالب.
 */
async function getStartedLesson(
  lessonId: string,
): Promise<LessonRow | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("lessons")
    .select(
      `
        id,
        course_id,
        journey_id,
        journey_type,
        title,
        title_ar,
        sort_order,
        status
      `,
    )
    .eq("id", lessonId)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    console.error(
      "Failed to load the started lesson:",
      error.message,
    );

    throw new Error("STARTED_LESSON_LOAD_FAILED");
  }

  return (data as LessonRow | null) ?? null;
}

/**
 * يجلب الاشتراكات النشطة المؤهلة للشهادة
 * للطالب داخل الكورس المحدد.
 *
 * قد يرجع أكثر من اشتراك صحيح، مثل:
 * - fundamental
 * - advanced
 *
 * لأن الطالب يمكن أن يحصل على شهادتين منفصلتين
 * عند الاشتراك في الأساسيات ثم المتقدم.
 */
async function getActiveCertificateEnrollments(
  userId: string,
  courseId: string,
): Promise<ActiveEnrollmentRow[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("enrollments")
    .select(
      `
        id,
        user_id,
        course_id,
        journey_id,
        journey_type,
        action_key,
        action_title,
        journey_title,
        course_title,
        status,
        certificate_status,
        survey_status
      `,
    )
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .eq("status", "active")
    .in("journey_type", [...CERTIFICATE_JOURNEY_TYPES])
    .order("created_at", { ascending: true });

  if (error) {
    console.error(
      "Failed to load active certificate enrollments:",
      error.message,
    );

    throw new Error("ACTIVE_ENROLLMENTS_LOAD_FAILED");
  }

  return (data as ActiveEnrollmentRow[] | null) ?? [];
}

/**
 * يجلب جميع المحاضرات المنشورة داخل الكورس.
 *
 * نحمّلها مرة واحدة فقط عند فتح المحاضرة،
 * ثم نستخدمها مع كل اشتراك نشط للطالب.
 */
async function getPublishedCourseLessons(
  courseId: string,
): Promise<LessonRow[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("lessons")
    .select(
      `
        id,
        course_id,
        journey_id,
        journey_type,
        title,
        title_ar,
        sort_order,
        status
      `,
    )
    .eq("course_id", courseId)
    .eq("status", "published")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error(
      "Failed to load published course lessons:",
      error.message,
    );

    throw new Error("COURSE_LESSONS_LOAD_FAILED");
  }

  return (data as LessonRow[] | null) ?? [];
}

/**
 * يحدد المحاضرة التي تشغّل الشهادة للاشتراك.
 *
 * القواعد:
 *
 * fundamental:
 * آخر محاضرة fundamental.
 *
 * advanced:
 * آخر محاضرة advanced.
 *
 * integrated:
 * 1) آخر محاضرة advanced إن وُجدت.
 * 2) وإلا آخر محاضرة integrated إن وُجدت.
 * 3) وإلا آخر محاضرة منشورة في الكورس.
 *
 * الخيار الثالث يدعم الكورسات القديمة أو غير المصنفة بعد.
 */
function getCertificateTargetLesson(
  enrollment: ActiveEnrollmentRow,
  publishedLessons: LessonRow[],
): LessonRow | null {
  if (!isCertificateJourneyType(enrollment.journey_type)) {
    return null;
  }

  if (enrollment.journey_type === "fundamental") {
    const fundamentalLessons = filterLessonsForEnrollment(
      publishedLessons,
      enrollment,
      "fundamental",
    );

    return getLastLesson(fundamentalLessons);
  }

  if (enrollment.journey_type === "advanced") {
    const advancedLessons = filterLessonsForEnrollment(
      publishedLessons,
      enrollment,
      "advanced",
    );

    return getLastLesson(advancedLessons);
  }

  /*
   * integrated يمكن أن يمثل:
   *
   * 1) كورسًا مقسمًا إلى fundamental + advanced.
   *    وفي هذه الحالة تكون آخر advanced هي المحاضرة المستهدفة.
   *
   * 2) كورسًا واحدًا غير مقسم.
   *    وفي هذه الحالة تكون آخر integrated هي المحاضرة المستهدفة.
   */

  const advancedLessons = filterLessonsForEnrollment(
    publishedLessons,
    enrollment,
    "advanced",
  );

  const lastAdvancedLesson = getLastLesson(advancedLessons);

  if (lastAdvancedLesson) {
    return lastAdvancedLesson;
  }

  const integratedLessons = filterLessonsForEnrollment(
    publishedLessons,
    enrollment,
    "integrated",
  );

  const lastIntegratedLesson = getLastLesson(
    integratedLessons,
  );

  if (lastIntegratedLesson) {
    return lastIntegratedLesson;
  }

  /*
   * Fallback للكورسات التي لم تُصنف محاضراتها بعد.
   *
   * إذا كان للاشتراك journey_id، نفضل محاضرات نفس الرحلة.
   * وإذا لم نجدها، نستخدم آخر محاضرة منشورة في الكورس كله.
   */

  if (enrollment.journey_id) {
    const sameJourneyLessons = publishedLessons.filter(
      (lesson) =>
        lesson.journey_id === enrollment.journey_id,
    );

    const lastSameJourneyLesson = getLastLesson(
      sameJourneyLessons,
    );

    if (lastSameJourneyLesson) {
      return lastSameJourneyLesson;
    }
  }

  return getLastLesson(publishedLessons);
}

/**
 * يفحص اشتراكًا واحدًا ويحدد هل المحاضرة المفتوحة
 * هي المحاضرة التي تشغل تجهيز الشهادة.
 */
function evaluateEnrollmentTrigger(
  enrollment: ActiveEnrollmentRow,
  currentLesson: LessonRow,
  publishedLessons: LessonRow[],
): CertificateTriggerResult {
  if (!isCertificateJourneyType(enrollment.journey_type)) {
    return {
      triggered: false,
      enrollmentId: enrollment.id,
      journeyType: null,
      targetLessonId: null,
      currentLessonId: currentLesson.id,
      courseId: currentLesson.course_id,
      reason: "unsupported_journey_type",
    };
  }

  const targetLesson = getCertificateTargetLesson(
    enrollment,
    publishedLessons,
  );

  if (!targetLesson) {
    return {
      triggered: false,
      enrollmentId: enrollment.id,
      journeyType: enrollment.journey_type,
      targetLessonId: null,
      currentLessonId: currentLesson.id,
      courseId: currentLesson.course_id,
      reason: "target_lesson_not_found",
    };
  }

  const triggered = targetLesson.id === currentLesson.id;

  return {
    triggered,
    enrollmentId: enrollment.id,
    journeyType: enrollment.journey_type,
    targetLessonId: targetLesson.id,
    currentLessonId: currentLesson.id,
    courseId: currentLesson.course_id,
    reason: triggered
      ? "trigger_lesson"
      : "not_trigger_lesson",
  };
}

/**
 * الدالة الرئيسية التي يستدعيها progress.ts
 * بعد تسجيل فتح الطالب للمحاضرة.
 *
 * الإصدار V1 لا يعدل قاعدة البيانات.
 * فقط يعيد نتيجة اكتشاف محاضرة تشغيل الشهادة.
 */
export async function handleLessonStarted(
  userId: string,
  courseId: string,
  lessonId: string,
): Promise<LessonStartedJourneyResult> {
  if (!userId?.trim()) {
    throw new Error("USER_ID_REQUIRED");
  }

  if (!courseId?.trim()) {
    throw new Error("COURSE_ID_REQUIRED");
  }

  if (!lessonId?.trim()) {
    throw new Error("LESSON_ID_REQUIRED");
  }

  const currentLesson = await getStartedLesson(lessonId);

  if (!currentLesson) {
    return {
      certificateTriggered: false,
      triggers: [
        {
          triggered: false,
          enrollmentId: null,
          journeyType: null,
          targetLessonId: null,
          currentLessonId: lessonId,
          courseId,
          reason: "lesson_not_found",
        },
      ],
    };
  }

  /*
   * حماية من استدعاء الدالة باستخدام courseId
   * لا يطابق الكورس الحقيقي للمحاضرة.
   */
  if (currentLesson.course_id !== courseId) {
    throw new Error("LESSON_COURSE_MISMATCH");
  }

  const activeEnrollments =
    await getActiveCertificateEnrollments(
      userId,
      courseId,
    );

  if (activeEnrollments.length === 0) {
    return {
      certificateTriggered: false,
      triggers: [
        {
          triggered: false,
          enrollmentId: null,
          journeyType: null,
          targetLessonId: null,
          currentLessonId: lessonId,
          courseId,
          reason: "no_active_enrollment",
        },
      ],
    };
  }

  const publishedLessons =
    await getPublishedCourseLessons(courseId);

  const triggers = activeEnrollments.map((enrollment) =>
    evaluateEnrollmentTrigger(
      enrollment,
      currentLesson,
      publishedLessons,
    ),
  );

  return {
    certificateTriggered: triggers.some(
      (trigger) => trigger.triggered,
    ),
    triggers,
  };
}