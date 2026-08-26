export type SharedCoursePart =
  | "single"
  | "fundamentals"
  | "advanced";

export type SharedJourneySource =
  | "paid"
  | "reward"
  | "free";

export type SharedEnrollmentLike = {
  id: string;
  course_id: string;
  journey_type: string | null;
  action_key?: string | null;
  enrollment_source?: string | null;
  status: string | null;
  progress_percent?: number | string | null;
  imported_progress_percent?: number | string | null;
  split_progress?: unknown;
  imported_split_progress?: unknown;
  created_at?: string;
  updated_at?: string | null;
};

export type SharedCourseLike = {
  id: string;
  title?: string | null;
  title_ar?: string | null;
  course_code?: string | null;
  station_id?: string | null;
};

export type SharedLessonLike = {
  id: string;
  course_id: string;
  course_part?: string | null;
};

export type SharedLessonProgressLike = {
  lesson_id: string;
  completed?: boolean | null;
  progress_percent?: number | string | null;
};

export type SharedJourneyRow = {
  id: string;
  enrollmentId: string;
  courseId: string;
  coursePart: SharedCoursePart;
  journeyType: string;
  source: SharedJourneySource;
  status: string;

  realProgressPercent: number;
  importedProgressPercent: number;
  progressPercent: number;

  isProfessional: boolean;
  isOneDay: boolean;
  isFree: boolean;

  isCompleted: boolean;
  isPending: boolean;
  isActive: boolean;
};

export type SharedJourneyStatistics = {
  total: number;
  paid: number;
  reward: number;
  active: number;
  completed: number;
  pending: number;
  professional: number;
  oneDay: number;
  free: number;
  averageProgress: number;
};

export function normalizeJourneyText(
  value: string | null | undefined,
) {
  return (value ?? "").trim().toLowerCase();
}

export function normalizeJourneyProgress(
  value: number | string | null | undefined,
) {
  const parsed = Number(value ?? 0);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(100, Math.round(parsed)),
  );
}

export function parseJourneyProgressObject(
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
    result[key.trim().toLowerCase()] =
      normalizeJourneyProgress(
        typeof item === "number" ||
          typeof item === "string"
          ? item
          : 0,
      );
  }

  return result;
}

export function normalizeSharedCoursePart(
  value: string | null | undefined,
): SharedCoursePart {
  const normalized = normalizeJourneyText(value);

  if (
    normalized === "fundamental" ||
    normalized === "fundamentals"
  ) {
    return "fundamentals";
  }

  if (normalized === "advanced") {
    return "advanced";
  }

  return "single";
}

export function getSharedJourneyKind(
  journeyType: string | null | undefined,
) {
  const value = normalizeJourneyText(journeyType);

  const isOneDay = [
    "workshop",
    "one_day",
    "one-day",
    "one_day_journey",
    "one_day_workshop",
    "one-day-workshop",
  ].includes(value);

  const isFree = [
    "free",
    "free_session",
    "free-session",
    "free_journey",
    "free-journey",
  ].includes(value);

  return {
    isOneDay,
    isFree,
    isProfessional: !isOneDay && !isFree,
  };
}

export function sharedEnrollmentAllowsPart(
  journeyType: string | null | undefined,
  part: SharedCoursePart,
) {
  const normalized = normalizeJourneyText(journeyType);

  const grantsAll =
    normalized === "integrated" ||
    normalized === "professional" ||
    normalized === "career_path" ||
    normalized === "";

  if (part === "single") {
    return true;
  }

  if (part === "fundamentals") {
    return (
      grantsAll ||
      normalized === "fundamental" ||
      normalized === "fundamentals"
    );
  }

  return grantsAll || normalized === "advanced";
}

export function getSharedImportedPartProgress(
  enrollment: SharedEnrollmentLike,
  part: SharedCoursePart,
) {
  const imported = parseJourneyProgressObject(
    enrollment.imported_split_progress,
  );

  const current = parseJourneyProgressObject(
    enrollment.split_progress,
  );

  if (part === "single") {
    return Math.max(
      normalizeJourneyProgress(
        enrollment.imported_progress_percent,
      ),
      normalizeJourneyProgress(
        enrollment.progress_percent,
      ),
    );
  }

  const keys =
    part === "fundamentals"
      ? ["fundamentals", "fundamental"]
      : ["advanced"];

  const candidates: number[] = [];

  for (const key of keys) {
    if (
      Object.prototype.hasOwnProperty.call(
        imported,
        key,
      )
    ) {
      candidates.push(
        normalizeJourneyProgress(imported[key]),
      );
    }

    if (
      Object.prototype.hasOwnProperty.call(
        current,
        key,
      )
    ) {
      candidates.push(
        normalizeJourneyProgress(current[key]),
      );
    }
  }

  if (candidates.length > 0) {
    return Math.max(...candidates);
  }

  return Math.max(
    normalizeJourneyProgress(
      enrollment.imported_progress_percent,
    ),
    normalizeJourneyProgress(
      enrollment.progress_percent,
    ),
  );
}

export function calculateSharedPartRealProgress(
  lessons: SharedLessonLike[],
  lessonProgressMap: Map<
    string,
    SharedLessonProgressLike
  >,
) {
  if (lessons.length === 0) {
    return 0;
  }

  let accumulated = 0;

  for (const lesson of lessons) {
    const progress =
      lessonProgressMap.get(lesson.id);

    const percent =
      normalizeJourneyProgress(
        progress?.progress_percent,
      );

    const completed =
      Boolean(progress?.completed) ||
      percent >= 100;

    accumulated += completed
      ? 100
      : percent;
  }

  return normalizeJourneyProgress(
    accumulated / lessons.length,
  );
}

function normalizeSource(
  value: string | null | undefined,
  journeyType: string | null | undefined,
): SharedJourneySource {
  const kind =
    getSharedJourneyKind(journeyType);

  if (kind.isFree) {
    return "free";
  }

  return value === "reward"
    ? "reward"
    : "paid";
}

export function buildSharedJourneys(input: {
  enrollments: SharedEnrollmentLike[];
  courses: SharedCourseLike[];
  lessons: SharedLessonLike[];
  lessonProgress: SharedLessonProgressLike[];
}): SharedJourneyRow[] {
  const courseMap = new Map(
    input.courses.map((course) => [
      course.id,
      course,
    ]),
  );

  const lessonProgressMap = new Map(
    input.lessonProgress.map((row) => [
      row.lesson_id,
      row,
    ]),
  );

  const lessonsByCourse = new Map<
    string,
    SharedLessonLike[]
  >();

  for (const lesson of input.lessons) {
    const current =
      lessonsByCourse.get(
        lesson.course_id,
      ) ?? [];

    current.push(lesson);

    lessonsByCourse.set(
      lesson.course_id,
      current,
    );
  }

  const journeys: SharedJourneyRow[] =
    [];

  for (const enrollment of input.enrollments) {
    const course =
      courseMap.get(enrollment.course_id);

    if (!course) {
      continue;
    }

    const journeyType =
      enrollment.journey_type?.trim() ||
      "career_path";

    const status =
      normalizeJourneyText(
        enrollment.status,
      ) || "active";

    const kind =
      getSharedJourneyKind(journeyType);

    const courseLessons =
      lessonsByCourse.get(
        enrollment.course_id,
      ) ?? [];

    const source = normalizeSource(
      enrollment.enrollment_source,
      enrollment.journey_type,
    );

    const pushJourney = (
      id: string,
      part: SharedCoursePart,
      selectedLessons: SharedLessonLike[],
      importedProgressPercent: number,
    ) => {
      const realProgressPercent =
        calculateSharedPartRealProgress(
          selectedLessons,
          lessonProgressMap,
        );

      const progressPercent = Math.max(
        realProgressPercent,
        importedProgressPercent,
      );

      const isPending =
        [
          "pending",
          "requested",
          "waiting",
          "under_review",
        ].includes(status);

      const isCompleted =
        status === "completed" ||
        progressPercent >= 100;

      const isActiveStatus =
        [
          "active",
          "approved",
          "enrolled",
          "confirmed",
          "completed",
        ].includes(status);

      journeys.push({
        id,
        enrollmentId: enrollment.id,
        courseId: enrollment.course_id,
        coursePart: part,
        journeyType:
          part === "fundamentals"
            ? "fundamentals"
            : part === "advanced"
              ? "advanced"
              : journeyType,
        source,
        status,

        realProgressPercent,
        importedProgressPercent,
        progressPercent,

        isProfessional:
          kind.isProfessional,
        isOneDay: kind.isOneDay,
        isFree: kind.isFree,

        isCompleted,
        isPending,
        isActive:
          isActiveStatus &&
          !isPending &&
          !isCompleted,
      });
    };

    if (kind.isFree) {
      const requestedLessonId =
        enrollment.action_key?.startsWith(
          "free:lesson:",
        )
          ? enrollment.action_key.slice(
              "free:lesson:".length,
            )
          : null;

      const selectedLessons =
        requestedLessonId
          ? courseLessons.filter(
              (lesson) =>
                lesson.id ===
                requestedLessonId,
            )
          : courseLessons;

      pushJourney(
        enrollment.id,
        "single",
        selectedLessons,
        normalizeJourneyProgress(
          enrollment.imported_progress_percent,
        ),
      );

      continue;
    }

    if (kind.isOneDay) {
      const requestedLessonId =
        enrollment.action_key?.startsWith(
          "workshop:lesson:",
        )
          ? enrollment.action_key.slice(
              "workshop:lesson:".length,
            )
          : null;

      const selectedLessons =
        requestedLessonId
          ? courseLessons.filter(
              (lesson) =>
                lesson.id ===
                requestedLessonId,
            )
          : courseLessons;

      pushJourney(
        enrollment.id,
        "single",
        selectedLessons,
        normalizeJourneyProgress(
          enrollment.imported_progress_percent,
        ),
      );

      continue;
    }

    const fundamentalsLessons =
      courseLessons.filter(
        (lesson) =>
          normalizeSharedCoursePart(
            lesson.course_part,
          ) === "fundamentals",
      );

    const advancedLessons =
      courseLessons.filter(
        (lesson) =>
          normalizeSharedCoursePart(
            lesson.course_part,
          ) === "advanced",
      );

    const singleLessons =
      courseLessons.filter(
        (lesson) =>
          normalizeSharedCoursePart(
            lesson.course_part,
          ) === "single",
      );

    const isSplitCourse =
      fundamentalsLessons.length > 0 ||
      advancedLessons.length > 0;

    if (isSplitCourse) {
      if (
        fundamentalsLessons.length > 0 &&
        sharedEnrollmentAllowsPart(
          journeyType,
          "fundamentals",
        )
      ) {
        pushJourney(
          `${enrollment.id}:fundamentals`,
          "fundamentals",
          fundamentalsLessons,
          getSharedImportedPartProgress(
            enrollment,
            "fundamentals",
          ),
        );
      }

      if (
        advancedLessons.length > 0 &&
        sharedEnrollmentAllowsPart(
          journeyType,
          "advanced",
        )
      ) {
        pushJourney(
          `${enrollment.id}:advanced`,
          "advanced",
          advancedLessons,
          getSharedImportedPartProgress(
            enrollment,
            "advanced",
          ),
        );
      }

      continue;
    }

    pushJourney(
      enrollment.id,
      "single",
      singleLessons.length > 0
        ? singleLessons
        : courseLessons,
      getSharedImportedPartProgress(
        enrollment,
        "single",
      ),
    );
  }

  return journeys;
}

export function calculateSharedJourneyStatistics(
  journeys: SharedJourneyRow[],
): SharedJourneyStatistics {
  const statistics: SharedJourneyStatistics = {
    total: 0,
    paid: 0,
    reward: 0,
    active: 0,
    completed: 0,
    pending: 0,
    professional: 0,
    oneDay: 0,
    free: 0,
    averageProgress: 0,
  };

  for (const journey of journeys) {
    statistics.total += 1;

    if (journey.isProfessional) {
      statistics.professional += 1;
    }

    if (journey.isOneDay) {
      statistics.oneDay += 1;
    }

    if (journey.isFree) {
      statistics.free += 1;
    }

    if (journey.source === "reward") {
      statistics.reward += 1;
    }

    if (journey.source === "paid") {
      statistics.paid += 1;
    }

    if (journey.isActive) {
      statistics.active += 1;
    }

    if (journey.isCompleted) {
      statistics.completed += 1;
    }

    if (journey.isPending) {
      statistics.pending += 1;
    }
  }

  const progressJourneys =
    journeys.filter(
      (journey) =>
        !journey.isPending,
    );

  statistics.averageProgress =
    progressJourneys.length > 0
      ? Math.round(
          progressJourneys.reduce(
            (sum, journey) =>
              sum +
              journey.progressPercent,
            0,
          ) /
            progressJourneys.length,
        )
      : 0;

  return statistics;
}