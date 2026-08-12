import {
  getStudentLessonPlayback,
} from "@/lib/actions/student/lesson-video";

import {
  completeLesson,
  startLesson,
  updateLessonProgress,
} from "@/lib/learning/progress";

type Context = {
  params: Promise<{
    lessonId: string;
  }>;
};

export async function GET(
  _request: Request,
  { params }: Context,
) {
  const { lessonId } = await params;

  const result =
    await getStudentLessonPlayback(
      lessonId,
    );

  return Response.json(
    result,
    {
      status: result.success
        ? 200
        : 403,
      headers: {
        "Cache-Control":
          "no-store, max-age=0",
      },
    },
  );
}

export async function POST(
  request: Request,
  { params }: Context,
) {
  try {
    const { lessonId } =
      await params;

    const body =
      (await request.json()) as {
        action?: string;
        progressPercent?: number;
        lastPositionSeconds?: number;
      };

    if (body.action === "start") {
      const data =
        await startLesson(
          lessonId,
        );

      return Response.json({
        success: true,
        data,
        message:
          "تم تسجيل بدء المحاضرة.",
      });
    }

    if (body.action === "update") {
      const data =
        await updateLessonProgress(
          lessonId,
          Number(
            body.progressPercent ??
              0,
          ),
          Number(
            body.lastPositionSeconds ??
              0,
          ),
        );

      return Response.json({
        success: true,
        data,
        message:
          "تم حفظ تقدم المحاضرة.",
      });
    }

    if (body.action === "complete") {
      const data =
        await completeLesson(
          lessonId,
          Number(
            body.lastPositionSeconds ??
              0,
          ),
        );

      return Response.json({
        success: true,
        data,
        message:
          "تم إكمال المحاضرة.",
      });
    }

    return Response.json(
      {
        success: false,
        message:
          "نوع عملية التقدم غير معروف.",
      },
      {
        status: 400,
      },
    );
  } catch (error) {
    return Response.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "تعذر تحديث تقدم المحاضرة.",
      },
      {
        status: 500,
      },
    );
  }
}