import { createAdminClient } from "@/lib/supabase/server";

type Context = {
  params: Promise<{
    stationId: string;
  }>;
};

type JourneyKind = "free" | "workshop";

function normalize(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function matchesKind(
  value: string | null | undefined,
  kind: JourneyKind,
) {
  const normalized = normalize(value);

  if (kind === "free") {
    return (
      normalized === "free" ||
      normalized === "free_session" ||
      normalized === "free-session"
    );
  }

  return (
    normalized === "workshop" ||
    normalized === "one_day" ||
    normalized === "one-day" ||
    normalized === "one_day_workshop" ||
    normalized === "one-day-workshop"
  );
}

function normalizeCoursePart(
  value: string | null | undefined,
): "single" | "fundamentals" | "advanced" {
  const normalized = normalize(value);

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

export async function GET(
  request: Request,
  { params }: Context,
) {
  try {
    const { stationId } = await params;

    const url = new URL(request.url);
    const rawKind =
      url.searchParams.get("kind");

    const kind: JourneyKind =
      rawKind === "workshop"
        ? "workshop"
        : "free";

    const supabase =
  createAdminClient();

    const {
      data: courses,
      error: coursesError,
    } = await supabase
      .from("courses")
      .select("id")
      .eq("station_id", stationId)
      .eq("is_active", true);

    if (coursesError) {
      throw new Error(
        coursesError.message,
      );
    }

    const courseIds = (
      courses ?? []
    )
      .map((course) => course.id)
      .filter(
        (id): id is string =>
          Boolean(id),
      );

    if (!courseIds.length) {
      return Response.json({
        success: true,
        lessons: [],
      });
    }

    const {
      data: journeys,
      error: journeysError,
    } = await supabase
      .from("journeys")
      .select(
        "id,course_id,journey_type,is_active",
      )
      .in("course_id", courseIds)
      .eq("is_active", true);

    if (journeysError) {
      throw new Error(
        journeysError.message,
      );
    }

    const journeyIds = (
      journeys ?? []
    )
      .filter((journey) =>
        matchesKind(
          journey.journey_type,
          kind,
        ),
      )
      .map((journey) => journey.id)
      .filter(
        (id): id is string =>
          Boolean(id),
      );

    if (!journeyIds.length) {
      return Response.json({
        success: true,
        lessons: [],
      });
    }

    const {
      data: links,
      error: linksError,
    } = await supabase
      .from("lesson_journeys")
      .select("lesson_id,journey_id")
      .in("journey_id", journeyIds);

    if (linksError) {
      throw new Error(
        linksError.message,
      );
    }

    const lessonIds = [
      ...new Set(
        (links ?? [])
          .map(
            (link) =>
              link.lesson_id,
          )
          .filter(
            (id): id is string =>
              Boolean(id),
          ),
      ),
    ];

    if (!lessonIds.length) {
      return Response.json({
        success: true,
        lessons: [],
      });
    }

    const {
      data: lessons,
      error: lessonsError,
    } = await supabase
      .from("lessons")
      .select(`
        id,
        course_id,
        title,
        title_ar,
        description,
        course_part,
        sort_order,
        video_duration_seconds,
        video_status,
        status
      `)
      .in("id", lessonIds)
      .eq("status", "published");

    if (lessonsError) {
      throw new Error(
        lessonsError.message,
      );
    }

    const partOrder = {
      single: 0,
      fundamentals: 1,
      advanced: 2,
    } as const;

    const result = (lessons ?? [])
      .map((lesson) => {
        const coursePart =
          normalizeCoursePart(
            lesson.course_part,
          );

        return {
          id: lesson.id,
          courseId:
            lesson.course_id,
          title:
            lesson.title_ar?.trim() ||
            lesson.title?.trim() ||
            "محاضرة",
          description:
            lesson.description ?? null,
          coursePart,
          sortOrder: Number(
            lesson.sort_order ?? 0,
          ),
          durationSeconds:
            Math.max(
              0,
              Number(
                lesson.video_duration_seconds ??
                  0,
              ),
            ),
          videoStatus:
            lesson.video_status ?? null,
        };
      })
      .sort((a, b) => {
        const partDifference =
          partOrder[a.coursePart] -
          partOrder[b.coursePart];

        if (partDifference) {
          return partDifference;
        }

        return (
          a.sortOrder -
          b.sortOrder
        );
      });

    return Response.json(
      {
        success: true,
        lessons: result,
      },
      {
        headers: {
          "Cache-Control":
            "no-store, max-age=0",
        },
      },
    );
  } catch (error) {
    return Response.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "تعذر تحميل محاضرات الرحلة.",
      },
      {
        status: 500,
      },
    );
  }
}