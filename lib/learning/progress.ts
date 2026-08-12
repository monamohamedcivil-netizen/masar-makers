"use server";

import { createClient } from "@/lib/supabase/server";
import { handleLessonStarted } from "@/lib/services/student-journey";
export type LessonProgressData = {
  lessonId: string;
  completed: boolean;
  progressPercent: number;
  lastPositionSeconds: number;
  startedAt: string | null;
  completedAt: string | null;
  lastWatchedAt: string | null;
};

export type CourseProgressData = {
  courseId: string;
  totalLessons: number;
  completedLessons: number;
  progressPercent: number;
  status: "not_started" | "in_progress" | "completed";
};

export type NextLessonData = {
  id: string;
  courseId: string;
  title: string;
  titleAr: string | null;
  videoUrl: string | null;
  durationMinutes: number;
  sortOrder: number;
  progressPercent: number;
  lastPositionSeconds: number;
} | null;

type LessonRow = {
  id: string;
  course_id: string;
  title: string;
  title_ar: string | null;
  video_url: string | null;
  duration_minutes: number | null;
  sort_order: number;
  status: string;
};

type LessonProgressRow = {
  lesson_id: string;
  completed: boolean;
  progress_percent: number | string | null;
  last_position_seconds: number | null;
  started_at: string | null;
  completed_at: string | null;
  last_watched_at: string | null;
};

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0;

  return Math.min(100, Math.max(0, Math.round(value)));
}

function normalizePosition(value: number) {
  if (!Number.isFinite(value)) return 0;

  return Math.max(0, Math.floor(value));
}

async function getAuthenticatedUser() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("UNAUTHENTICATED");
  }

  return {
    supabase,
    user,
  };
}

async function getPublishedLesson(
  lessonId: string,
): Promise<LessonRow | null> {
  const { supabase } = await getAuthenticatedUser();

  const { data, error } = await supabase
    .from("lessons")
    .select(
      `
        id,
        course_id,
        title,
        title_ar,
        video_url,
        duration_minutes,
        sort_order,
        status
      `,
    )
    .eq("id", lessonId)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    console.error("Failed to load lesson:", error.message);
    throw new Error("LESSON_LOAD_FAILED");
  }

  return (data as LessonRow | null) ?? null;
}

/**
 * يسجل أن الطالب بدأ المحاضرة.
 * إذا كان هناك سجل سابق فلن ينشئ سجلًا مكررًا.
 */
export async function startLesson(
  lessonId: string,
): Promise<LessonProgressData> {
  if (!lessonId?.trim()) {
    throw new Error("LESSON_ID_REQUIRED");
  }

  const { supabase, user } = await getAuthenticatedUser();
  const lesson = await getPublishedLesson(lessonId);

  if (!lesson) {
    throw new Error("LESSON_NOT_FOUND");
  }

  const now = new Date().toISOString();

  const { data: existing, error: existingError } = await supabase
    .from("lesson_progress")
    .select(
      `
        lesson_id,
        completed,
        progress_percent,
        last_position_seconds,
        started_at,
        completed_at,
        last_watched_at
      `,
    )
    .eq("user_id", user.id)
    .eq("lesson_id", lessonId)
    .maybeSingle();

  if (existingError) {
    console.error(
      "Failed to check lesson progress:",
      existingError.message,
    );
    throw new Error("PROGRESS_LOAD_FAILED");
  }

  if (existing) {
    const { data, error } = await supabase
      .from("lesson_progress")
      .update({
        started_at: existing.started_at ?? now,
        last_watched_at: now,
      })
      .eq("user_id", user.id)
      .eq("lesson_id", lessonId)
      .select(
        `
          lesson_id,
          completed,
          progress_percent,
          last_position_seconds,
          started_at,
          completed_at,
          last_watched_at
        `,
      )
      .single();

    if (error) {
      console.error("Failed to restart lesson:", error.message);
      throw new Error("PROGRESS_UPDATE_FAILED");
    }

    const lessonProgress = mapLessonProgress(
  data as LessonProgressRow,
);

const journeyResult = await handleLessonStarted(
  user.id,
  lesson.course_id,
  lessonId,
);

console.info(
  "[Student Journey] Lesson Started",
  journeyResult,
);

return lessonProgress;
  }

  const { data, error } = await supabase
    .from("lesson_progress")
    .insert({
      user_id: user.id,
      lesson_id: lessonId,
      completed: false,
      progress_percent: 0,
      last_position_seconds: 0,
      started_at: now,
      last_watched_at: now,
    })
    .select(
      `
        lesson_id,
        completed,
        progress_percent,
        last_position_seconds,
        started_at,
        completed_at,
        last_watched_at
      `,
    )
    .single();

  if (error) {
    console.error("Failed to start lesson:", error.message);
    throw new Error("PROGRESS_INSERT_FAILED");
  }

  const lessonProgress = mapLessonProgress(
  data as LessonProgressRow,
);

const journeyResult = await handleLessonStarted(
  user.id,
  lesson.course_id,
  lessonId,
);

console.info(
  "[Student Journey] Lesson Started",
  journeyResult,
);

return lessonProgress;
}

/**
 * يحفظ آخر ثانية وصل إليها الطالب ونسبة مشاهدة المحاضرة.
 */
export async function updateLessonProgress(
  lessonId: string,
  progressPercent: number,
  lastPositionSeconds: number,
): Promise<LessonProgressData> {
  if (!lessonId?.trim()) {
    throw new Error("LESSON_ID_REQUIRED");
  }

  const { supabase, user } = await getAuthenticatedUser();
  const lesson = await getPublishedLesson(lessonId);

  if (!lesson) {
    throw new Error("LESSON_NOT_FOUND");
  }

  const normalizedPercent = clampPercent(progressPercent);
  const normalizedPosition = normalizePosition(lastPositionSeconds);
  const now = new Date().toISOString();
  const isCompleted = normalizedPercent >= 100;

  const { data, error } = await supabase
    .from("lesson_progress")
    .upsert(
      {
        user_id: user.id,
        lesson_id: lessonId,
        completed: isCompleted,
        progress_percent: normalizedPercent,
        last_position_seconds: normalizedPosition,
        started_at: now,
        last_watched_at: now,
        completed_at: isCompleted ? now : null,
      },
      {
        onConflict: "user_id,lesson_id",
      },
    )
    .select(
      `
        lesson_id,
        completed,
        progress_percent,
        last_position_seconds,
        started_at,
        completed_at,
        last_watched_at
      `,
    )
    .single();

  if (error) {
    console.error("Failed to update lesson progress:", error.message);
    throw new Error("PROGRESS_UPDATE_FAILED");
  }

  return mapLessonProgress(data as LessonProgressRow);
}

/**
 * يضع المحاضرة كمكتملة مباشرة.
 */
export async function completeLesson(
  lessonId: string,
  lastPositionSeconds = 0,
): Promise<LessonProgressData> {
  if (!lessonId?.trim()) {
    throw new Error("LESSON_ID_REQUIRED");
  }

  const { supabase, user } = await getAuthenticatedUser();
  const lesson = await getPublishedLesson(lessonId);

  if (!lesson) {
    throw new Error("LESSON_NOT_FOUND");
  }

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("lesson_progress")
    .upsert(
      {
        user_id: user.id,
        lesson_id: lessonId,
        completed: true,
        progress_percent: 100,
        last_position_seconds: normalizePosition(lastPositionSeconds),
        started_at: now,
        last_watched_at: now,
        completed_at: now,
      },
      {
        onConflict: "user_id,lesson_id",
      },
    )
    .select(
      `
        lesson_id,
        completed,
        progress_percent,
        last_position_seconds,
        started_at,
        completed_at,
        last_watched_at
      `,
    )
    .single();

  if (error) {
    console.error("Failed to complete lesson:", error.message);
    throw new Error("LESSON_COMPLETE_FAILED");
  }

  return mapLessonProgress(data as LessonProgressRow);
}

/**
 * يجلب تقدم الطالب في محاضرة واحدة.
 */
export async function getLessonProgress(
  lessonId: string,
): Promise<LessonProgressData | null> {
  if (!lessonId?.trim()) {
    return null;
  }

  const { supabase, user } = await getAuthenticatedUser();

  const { data, error } = await supabase
    .from("lesson_progress")
    .select(
      `
        lesson_id,
        completed,
        progress_percent,
        last_position_seconds,
        started_at,
        completed_at,
        last_watched_at
      `,
    )
    .eq("user_id", user.id)
    .eq("lesson_id", lessonId)
    .maybeSingle();

  if (error) {
    console.error("Failed to load lesson progress:", error.message);
    throw new Error("PROGRESS_LOAD_FAILED");
  }

  return data
    ? mapLessonProgress(data as LessonProgressRow)
    : null;
}

/**
 * يحسب تقدم الكورس من المحاضرات المنشورة فقط.
 */
export async function getCourseProgress(
  courseId: string,
): Promise<CourseProgressData> {
  if (!courseId?.trim()) {
    throw new Error("COURSE_ID_REQUIRED");
  }

  const { supabase, user } = await getAuthenticatedUser();

  const { data: lessons, error: lessonsError } = await supabase
    .from("lessons")
    .select("id")
    .eq("course_id", courseId)
    .eq("status", "published");

  if (lessonsError) {
    console.error(
      "Failed to load course lessons:",
      lessonsError.message,
    );
    throw new Error("LESSONS_LOAD_FAILED");
  }

  const lessonIds = (lessons ?? []).map((lesson) => lesson.id);
  const totalLessons = lessonIds.length;

  if (totalLessons === 0) {
    return {
      courseId,
      totalLessons: 0,
      completedLessons: 0,
      progressPercent: 0,
      status: "not_started",
    };
  }

  const { data: progressRows, error: progressError } = await supabase
    .from("lesson_progress")
    .select("lesson_id,completed,progress_percent")
    .eq("user_id", user.id)
    .in("lesson_id", lessonIds);

  if (progressError) {
    console.error(
      "Failed to load course progress:",
      progressError.message,
    );
    throw new Error("COURSE_PROGRESS_LOAD_FAILED");
  }

  const progressMap = new Map(
    (progressRows ?? []).map((row) => [
      row.lesson_id,
      {
        completed: Boolean(row.completed),
        progressPercent: clampPercent(
          Number(row.progress_percent ?? 0),
        ),
      },
    ]),
  );

  let completedLessons = 0;
  let accumulatedProgress = 0;

  for (const lessonId of lessonIds) {
    const progress = progressMap.get(lessonId);
    const completed =
      Boolean(progress?.completed) ||
      Number(progress?.progressPercent ?? 0) >= 100;

    if (completed) {
      completedLessons += 1;
      accumulatedProgress += 100;
    } else {
      accumulatedProgress += Number(
        progress?.progressPercent ?? 0,
      );
    }
  }

  const progressPercent = clampPercent(
    accumulatedProgress / totalLessons,
  );

  return {
    courseId,
    totalLessons,
    completedLessons,
    progressPercent,
    status:
      completedLessons >= totalLessons
        ? "completed"
        : progressPercent > 0
          ? "in_progress"
          : "not_started",
  };
}

/**
 * يجلب أول محاضرة منشورة لم يكملها الطالب.
 */
export async function getNextLesson(
  courseId: string,
): Promise<NextLessonData> {
  if (!courseId?.trim()) {
    return null;
  }

  const { supabase, user } = await getAuthenticatedUser();

  const { data: lessons, error: lessonsError } = await supabase
    .from("lessons")
    .select(
      `
        id,
        course_id,
        title,
        title_ar,
        video_url,
        duration_minutes,
        sort_order,
        status
      `,
    )
    .eq("course_id", courseId)
    .eq("status", "published")
    .order("sort_order", { ascending: true });

  if (lessonsError) {
    console.error(
      "Failed to load next lesson candidates:",
      lessonsError.message,
    );
    throw new Error("LESSONS_LOAD_FAILED");
  }

  if (!lessons?.length) {
    return null;
  }

  const lessonIds = lessons.map((lesson) => lesson.id);

  const { data: progressRows, error: progressError } = await supabase
    .from("lesson_progress")
    .select(
      "lesson_id,completed,progress_percent,last_position_seconds",
    )
    .eq("user_id", user.id)
    .in("lesson_id", lessonIds);

  if (progressError) {
    console.error(
      "Failed to load next lesson progress:",
      progressError.message,
    );
    throw new Error("PROGRESS_LOAD_FAILED");
  }

  const progressMap = new Map(
    (progressRows ?? []).map((row) => [row.lesson_id, row]),
  );

  for (const lesson of lessons as LessonRow[]) {
    const progress = progressMap.get(lesson.id);
    const progressPercent = clampPercent(
      Number(progress?.progress_percent ?? 0),
    );

    const completed =
      Boolean(progress?.completed) || progressPercent >= 100;

    if (!completed) {
      return {
        id: lesson.id,
        courseId: lesson.course_id,
        title: lesson.title,
        titleAr: lesson.title_ar,
        videoUrl: lesson.video_url,
        durationMinutes: Number(lesson.duration_minutes ?? 0),
        sortOrder: lesson.sort_order,
        progressPercent,
        lastPositionSeconds: normalizePosition(
          Number(progress?.last_position_seconds ?? 0),
        ),
      };
    }
  }

  return null;
}

function mapLessonProgress(
  row: LessonProgressRow,
): LessonProgressData {
  return {
    lessonId: row.lesson_id,
    completed: Boolean(row.completed),
    progressPercent: clampPercent(
      Number(row.progress_percent ?? 0),
    ),
    lastPositionSeconds: normalizePosition(
      Number(row.last_position_seconds ?? 0),
    ),
    startedAt: row.started_at,
    completedAt: row.completed_at,
    lastWatchedAt: row.last_watched_at,
  };
}