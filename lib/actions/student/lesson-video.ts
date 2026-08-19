"use server";

import {
  createClient,
  createAdminClient,
} from "@/lib/supabase/server";
import { createBunnyEmbedUrl } from "@/lib/bunny/stream";

type Result<T = unknown> =
  | { success: true; data: T; message: string }
  | { success: false; message: string };

const ACTIVE_ENROLLMENT_STATUSES =
  new Set([
    "active",
    "approved",
    "enrolled",
    "confirmed",
    "completed",
  ]);

function normalize(
  value: unknown,
) {
  return typeof value === "string"
    ? value.trim().toLowerCase()
    : "";
}

function getDisplayName(
  user: {
    email?: string | null;
    user_metadata?: Record<
      string,
      unknown
    >;
  },
) {
  const metadata =
    user.user_metadata ?? {};

  const candidates = [
    metadata.full_name,
    metadata.name,
    metadata.display_name,
    metadata.english_name,
  ];

  for (const candidate of candidates) {
    if (
      typeof candidate === "string" &&
      candidate.trim()
    ) {
      return candidate.trim();
    }
  }

  return (
    user.email
      ?.split("@")[0]
      ?.trim() ||
    "Masar Makers Student"
  );
}

export type StudentLessonPlayback = {
  lessonId: string;
  courseId: string;
  title: string;
  description: string | null;
  embedUrl: string;
  tokenExpiresAt: number;
  initialPositionSeconds: number;
  initialProgressPercent: number;
  alreadyCompleted: boolean;
  watermark: {
    name: string;
    email: string;
    sessionCode: string;
  };
};

export async function getStudentLessonPlayback(
  lessonId: string,
): Promise<Result<StudentLessonPlayback>> {
  try {
    const normalizedLessonId =
      lessonId?.trim();

    if (!normalizedLessonId) {
      return {
        success: false,
        message:
          "رقم الدرس غير موجود.",
      };
    }

    const supabase =
      await createClient();
const adminSupabase =
  createAdminClient();
    const {
      data: { user },
      error: authError,
    } =
      await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        message:
          "يجب تسجيل الدخول لمشاهدة الدرس.",
      };
    }

    const {
  data: lesson,
  error: lessonError,
} = await adminSupabase
  .from("lessons")
      .select(`
        id,
        course_id,
        title,
        description,
        video_provider,
        video_asset_id,
        video_status,
        course_part,
        is_preview,
        status,
        courses (
          station_id
        )
      `)
      .eq(
        "id",
        normalizedLessonId,
      )
      .maybeSingle();

    if (lessonError) {
      return {
        success: false,
        message:
          lessonError.message,
      };
    }

    if (!lesson) {
      return {
        success: false,
        message:
          "الدرس غير موجود.",
      };
    }

    if (
      normalize(lesson.status) !==
      "published"
    ) {
      return {
        success: false,
        message:
          "هذا الدرس غير منشور حاليًا.",
      };
    }

    if (
      normalize(
        lesson.video_provider,
      ) !== "bunny" ||
      !lesson.video_asset_id
    ) {
      return {
        success: false,
        message:
          "لم تتم إضافة فيديو لهذا الدرس بعد.",
      };
    }

    if (
      ![
        "ready",
        "playable",
      ].includes(
        normalize(
          lesson.video_status,
        ),
      )
    ) {
      return {
        success: false,
        message:
          "الفيديو ما زال قيد التجهيز. حاولي مرة أخرى بعد قليل.",
      };
    }

    let hasAccess =
      Boolean(
        lesson.is_preview,
      );

    if (!hasAccess) {
      const lessonCourse = Array.isArray(lesson.courses)
        ? lesson.courses[0]
        : lesson.courses;

      const stationId =
        lessonCourse?.station_id ?? null;

      let accessCourseIds = [lesson.course_id];

      if (stationId) {
        const {
  data: stationCourses,
  error: stationCoursesError,
} = await adminSupabase
  .from("courses")
          .select("id")
          .eq("station_id", stationId);

        if (stationCoursesError) {
          return {
            success: false,
            message: stationCoursesError.message,
          };
        }

        const stationCourseIds = (stationCourses ?? [])
          .map((course) => course.id)
          .filter((id): id is string => Boolean(id));

        if (stationCourseIds.length) {
          accessCourseIds = stationCourseIds;
        }
      }

      const {
  data: lessonJourneyLinks,
  error: lessonJourneyLinksError,
} = await adminSupabase
  .from("lesson_journeys")
        .select(`
          journey_id,
          journeys (
            journey_type,
            is_active
          )
        `)
        .eq("lesson_id", lesson.id);

      if (lessonJourneyLinksError) {
        return {
          success: false,
          message: lessonJourneyLinksError.message,
        };
      }

      const assignedJourneyTypes = new Set(
        (lessonJourneyLinks ?? [])
          .map((link) => {
            const journey = Array.isArray(link.journeys)
              ? link.journeys[0]
              : link.journeys;

            return journey?.is_active === false
              ? ""
              : normalize(journey?.journey_type);
          })
          .filter(Boolean),
      );

      const isOneDayType = (value: string) =>
        value === "workshop" ||
        value === "one_day" ||
        value === "one-day" ||
        value === "one_day_workshop" ||
        value === "one-day-workshop";

      const isFreeType = (value: string) =>
        value === "free" ||
        value === "free_session" ||
        value === "free-session";

      const lessonIsFree =
        [...assignedJourneyTypes].some(isFreeType);

      const {
        data: enrollments,
        error: enrollmentError,
      } = await supabase
        .from("enrollments")
        .select("status,journey_type,course_id,action_key")
        .eq("user_id", user.id)
        .in("course_id", accessCourseIds);

      if (enrollmentError) {
        return {
          success: false,
          message: enrollmentError.message,
        };
      }

      const coursePart = normalize(lesson.course_part) || "single";

      /*
       * Free and One-Day access is lesson-specific.
       * These keys must match the action_key created by the course buttons:
       *   free:lesson:<lessonId>
       *   workshop:lesson:<lessonId>
       */
      const freeLessonActionKey =
        `free:lesson:${lesson.id}`;
      const oneDayLessonActionKey =
        `workshop:lesson:${lesson.id}`;

      if (!hasAccess) {
        hasAccess = (enrollments ?? []).some((enrollment) => {
        if (
          !ACTIVE_ENROLLMENT_STATUSES.has(
            normalize(enrollment.status),
          )
        ) {
          return false;
        }

        const journeyType = normalize(enrollment.journey_type);
        const enrollmentActionKey =
          typeof enrollment.action_key === "string"
            ? enrollment.action_key.trim()
            : "";

        const isOneDay = isOneDayType(journeyType);
        const isFree = isFreeType(journeyType);
        const isProfessionalEnrollment = !isOneDay && !isFree;

        const lessonAllowsOneDay =
          [...assignedJourneyTypes].some(isOneDayType);

        const lessonAllowsFree = lessonIsFree;

        const lessonAllowsProfessional =
          assignedJourneyTypes.size === 0 ||
          [...assignedJourneyTypes].some(
            (type) => !isOneDayType(type) && !isFreeType(type),
          );

        if (isFree) {
          return (
            lessonAllowsFree &&
            enrollmentActionKey === freeLessonActionKey
          );
        }

        if (isOneDay) {
          return (
            lessonAllowsOneDay &&
            enrollmentActionKey === oneDayLessonActionKey
          );
        }

        if (!isProfessionalEnrollment || !lessonAllowsProfessional) {
          return false;
        }

        const grantsAll =
          journeyType === "integrated" ||
          journeyType === "professional" ||
          journeyType === "career_path" ||
          journeyType === "";

        if (coursePart === "fundamentals") {
          return (
            grantsAll ||
            journeyType === "fundamental" ||
            journeyType === "fundamentals"
          );
        }

        if (coursePart === "advanced") {
          return grantsAll || journeyType === "advanced";
        }

        return true;
      });
      }
    }

    if (!hasAccess) {
      return {
        success: false,
        message:
          "هذا الدرس متاح للمشتركين فقط.",
      };
    }

    const {
      data: progress,
      error: progressError,
    } = await supabase
      .from("lesson_progress")
      .select(`
        completed,
        progress_percent,
        last_position_seconds
      `)
      .eq(
        "user_id",
        user.id,
      )
      .eq(
        "lesson_id",
        lesson.id,
      )
      .maybeSingle();

    if (progressError) {
      console.error(
        "LOAD LESSON PROGRESS ERROR",
        progressError,
      );
    }

    const embed =
      createBunnyEmbedUrl(
        lesson.video_asset_id,
        10 * 60,
      );

    const displayName =
      getDisplayName(user);

    const email =
      user.email?.trim() ||
      "student@masarmakers.com";

    const sessionCode =
      `${user.id.slice(
        0,
        6,
      )}-${lesson.id.slice(
        0,
        6,
      )}`;

    return {
      success: true,
      data: {
        lessonId:
          lesson.id,
        courseId:
          lesson.course_id,
        title:
          lesson.title,
        description:
          lesson.description ??
          null,
        embedUrl:
          embed.url,
        tokenExpiresAt:
          embed.expires,
        initialPositionSeconds:
          Math.max(
            0,
            Number(
              progress?.last_position_seconds ??
                0,
            ),
          ),
        initialProgressPercent:
          Math.max(
            0,
            Math.min(
              100,
              Number(
                progress?.progress_percent ??
                  0,
              ),
            ),
          ),
        alreadyCompleted:
          Boolean(
            progress?.completed,
          ),
        watermark: {
          name:
            displayName,
          email,
          sessionCode,
        },
      },
      message:
        "تم تجهيز الدرس.",
    };
  } catch (error) {
    console.error(
      "GET STUDENT LESSON PLAYBACK ERROR",
      error,
    );

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "تعذر تشغيل الدرس.",
    };
  }
}