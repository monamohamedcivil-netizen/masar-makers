"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { deleteBunnyVideo } from "@/lib/bunny/stream";

type Result<T = unknown> =
  | { success: true; data?: T; message: string }
  | { success: false; message: string };

async function adminClient() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("يجب تسجيل الدخول أولاً.");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role,is_active")
    .eq("id", user.id)
    .single();

  if (
    !profile ||
    !["admin", "super_admin"].includes(
      String(profile.role),
    ) ||
    profile.is_active === false
  ) {
    throw new Error(
      "ليس لديك صلاحية لتنفيذ هذا الإجراء.",
    );
  }

  return { supabase, user };
}

const clean = (value: unknown) =>
  typeof value === "string" && value.trim()
    ? value.trim()
    : null;

const numberValue = (
  value: unknown,
  fallback = 0,
) =>
  Number.isFinite(Number(value))
    ? Number(value)
    : fallback;

const booleanValue = (
  value: unknown,
  fallback = false,
) =>
  typeof value === "boolean"
    ? value
    : fallback;

function slugify(value: string) {
  const base = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${base || "lesson"}-${Date.now().toString(36)}`;
}

export async function saveLesson(
  input: Record<string, unknown>,
): Promise<Result> {
  try {
    const { supabase } = await adminClient();

    const id = clean(input.id);
    const courseId = clean(input.course_id);
    const title = clean(input.title);
    const requestedJourneyTypes = Array.isArray(input.journey_types)
      ? input.journey_types
          .map((value) => clean(value))
          .filter((value): value is string => Boolean(value))
      : [];

    const allowedJourneyTypes = new Set(["professional", "one_day", "free"]);

    if (!courseId || !title) {
      return { success: false, message: "المحطة واسم الدرس مطلوبان." };
    }

    if (requestedJourneyTypes.length === 0) {
      return { success: false, message: "اختاري نوع رحلة واحدًا على الأقل للدرس." };
    }

    if (requestedJourneyTypes.some((type) => !allowedJourneyTypes.has(type))) {
      return { success: false, message: "نوع الرحلة المختار غير صحيح." };
    }

    const journeyTitles: Record<string, string> = {
      professional: "رحلة الاحتراف المتكاملة",
      one_day: "رحلة اليوم الواحد",
      free: "رحلة مجانية",
    };

    const { data: existingJourneys, error: existingJourneysError } = await supabase
      .from("journeys")
      .select("id,course_id,journey_type,title")
      .eq("course_id", courseId);

    if (existingJourneysError) {
      return { success: false, message: existingJourneysError.message };
    }

    const normalizeJourneyType = (value: unknown) => {
      const type = String(value || "").toLowerCase();
      if (type.includes("free")) return "free";
      if (type.includes("day") || type.includes("one") || type.includes("workshop")) {
        return "one_day";
      }
      return "professional";
    };

    const selectedJourneys: Array<Record<string, any>> = [];

    for (const requestedType of requestedJourneyTypes) {
      let journey = (existingJourneys ?? []).find(
        (item) => normalizeJourneyType(item.journey_type) === requestedType,
      );

      if (!journey) {
        const { data: createdJourney, error: createJourneyError } = await supabase
          .from("journeys")
          .insert({
            course_id: courseId,
            slug: slugify(`${journeyTitles[requestedType]}-${courseId}`),
            title: journeyTitles[requestedType],
            journey_type: requestedType,
            description: null,
            duration_hours: 0,
            price: 0,
            currency: "SAR",
            registration_required: requestedType !== "free",
            status: "draft",
            is_active: true,
            display_order:
              requestedType === "professional"
                ? 1
                : requestedType === "one_day"
                  ? 2
                  : 3,
            updated_at: new Date().toISOString(),
          })
          .select("id,course_id,journey_type,title")
          .single();

        if (createJourneyError || !createdJourney) {
          return {
            success: false,
            message:
              createJourneyError?.message ||
              `تعذر إنشاء ${journeyTitles[requestedType]}.`,
          };
        }

        journey = createdJourney;
      }

      selectedJourneys.push(journey);
    }

    const requestedJourneyIds = selectedJourneys.map(
      (journey) => journey.id as string,
    );

    const isPublished =
      booleanValue(input.is_published) || clean(input.status) === "published";

    const requestedCoursePart = clean(input.course_part) || "single";
    const allowedCourseParts = new Set(["single", "fundamentals", "advanced"]);

    if (!allowedCourseParts.has(requestedCoursePart)) {
      return {
        success: false,
        message: "قسم الكورس غير صحيح.",
      };
    }

    const primaryJourney = selectedJourneys[0];
    const payload: Record<string, unknown> = {
      course_id: courseId,
      course_part: requestedCoursePart,
      // الحقول القديمة تبقى للتوافق فقط؛ lesson_journeys هو المصدر الحقيقي للربط المتعدد.
      journey_id: primaryJourney.id,
      journey_type: primaryJourney.journey_type,
      title,
      description: clean(input.description),
      video_provider: clean(input.video_provider) || "bunny",
      sort_order: Math.max(
        1,
        numberValue(input.sort_order ?? input.lesson_order, 1),
      ),
      duration_minutes: Math.max(0, numberValue(input.duration_minutes, 0)),
      is_preview: booleanValue(input.is_preview),
      status: isPublished ? "published" : "draft",
      published_at: isPublished ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    };

    if (!id) {
      payload.slug = slugify(title);
    }

    const query = id
      ? supabase.from("lessons").update(payload).eq("id", id)
      : supabase.from("lessons").insert(payload);

    const { data, error } = await query.select().single();

    if (error) {
      return { success: false, message: error.message };
    }

    const lessonId = data.id as string;

    const { error: deleteLinksError } = await supabase
      .from("lesson_journeys")
      .delete()
      .eq("lesson_id", lessonId);

    if (deleteLinksError) {
      return { success: false, message: deleteLinksError.message };
    }

    const { error: linkError } = await supabase.from("lesson_journeys").insert(
      requestedJourneyIds.map((journeyId) => ({
        lesson_id: lessonId,
        journey_id: journeyId,
      })),
    );

    if (linkError) {
      return { success: false, message: linkError.message };
    }

    revalidatePath("/admin/learning/lessons");

    return {
      success: true,
      data: {
        ...data,
        journey_ids: requestedJourneyIds,
        lesson_order: data.sort_order,
        is_published: String(data.status).toLowerCase() === "published",
      },
      message: id ? "تم تحديث الدرس." : "تم إنشاء الدرس.",
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "تعذر حفظ الدرس.",
    };
  }
}

export async function deleteLessonContent(
  id: string,
): Promise<Result> {
  try {
    const { supabase } = await adminClient();

    const { data: lesson } = await supabase
      .from("lessons")
      .select(
        "video_provider,video_asset_id",
      )
      .eq("id", id)
      .maybeSingle();

    if (
      lesson?.video_provider === "bunny" &&
      lesson.video_asset_id
    ) {
      try {
        await deleteBunnyVideo(
          lesson.video_asset_id,
        );
      } catch (error) {
        console.error(
          "DELETE BUNNY VIDEO WITH LESSON ERROR",
          error,
        );
      }
    }

    const { data: resources } = await supabase
      .from("lesson_resources")
      .select("file_path")
      .eq("lesson_id", id);

    const paths = (resources ?? [])
      .map(
        (item: {
          file_path: string | null;
        }) => item.file_path,
      )
      .filter(Boolean) as string[];

    if (paths.length) {
      await supabase.storage
        .from("lesson-resources")
        .remove(paths);
    }

    const { error } = await supabase
      .from("lessons")
      .delete()
      .eq("id", id);

    if (error) {
      return {
        success: false,
        message: error.message,
      };
    }

    revalidatePath("/admin/learning/lessons");

    return {
      success: true,
      message:
        "تم حذف الدرس والفيديو والمرفقات.",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "تعذر حذف الدرس.",
    };
  }
}

export async function reorderLessons(
  ids: string[],
): Promise<Result> {
  try {
    const { supabase } = await adminClient();

    for (
      let index = 0;
      index < ids.length;
      index += 1
    ) {
      const { error } = await supabase
        .from("lessons")
        .update({
          sort_order: index + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", ids[index]);

      if (error) {
        return {
          success: false,
          message: error.message,
        };
      }
    }

    revalidatePath("/admin/learning/lessons");

    return {
      success: true,
      message: "تم حفظ ترتيب الدروس.",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "تعذر حفظ الترتيب.",
    };
  }
}

function safeName(name: string) {
  const parts = name.split(".");

  const extension =
    parts.length > 1
      ? parts
          .pop()!
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "")
      : "bin";

  const base =
    parts
      .join(".")
      .toLowerCase()
      .replace(/[^a-z0-9-_]+/g, "-")
      .replace(/^-+|-+$/g, "") ||
    "file";

  return `${Date.now()}-${crypto.randomUUID()}-${base}.${extension}`;
}

export async function uploadLessonAsset(
  formData: FormData,
): Promise<
  Result<{
    path: string;
    name: string;
    type: string;
    size: number;
  }>
> {
  try {
    const { supabase, user } =
      await adminClient();

    const file = formData.get("file");
    const lessonId = clean(
      formData.get("lessonId"),
    );

    if (!(file instanceof File) || !lessonId) {
      return {
        success: false,
        message:
          "الملف أو رقم الدرس غير موجود.",
      };
    }

    const maximum =
      100 * 1024 * 1024;

    if (file.size > maximum) {
      return {
        success: false,
        message:
          "حجم المرفق يتجاوز 100 MB.",
      };
    }

    const path =
      `resources/${lessonId}/${user.id}/` +
      safeName(file.name);

    const { error } = await supabase.storage
      .from("lesson-resources")
      .upload(path, file, {
        upsert: false,
        contentType:
          file.type || undefined,
      });

    if (error) {
      return {
        success: false,
        message: error.message,
      };
    }

    return {
      success: true,
      data: {
        path,
        name: file.name,
        type: file.type,
        size: file.size,
      },
      message: "تم رفع الملف.",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "تعذر رفع الملف.",
    };
  }
}

export async function createAssetPreview(
  path: string,
): Promise<Result<{ url: string }>> {
  try {
    const { supabase } =
      await adminClient();

    const { data, error } =
      await supabase.storage
        .from("lesson-resources")
        .createSignedUrl(
          path,
          60 * 30,
        );

    if (error || !data?.signedUrl) {
      return {
        success: false,
        message:
          error?.message ||
          "تعذر إنشاء رابط المعاينة.",
      };
    }

    return {
      success: true,
      data: {
        url: data.signedUrl,
      },
      message:
        "تم إنشاء رابط المعاينة.",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "تعذر فتح الملف.",
    };
  }
}

export async function saveLessonResource(
  input: Record<string, unknown>,
): Promise<Result> {
  try {
    const { supabase } =
      await adminClient();

    const lessonId = clean(
      input.lesson_id,
    );
    const title = clean(input.title);

    if (!lessonId || !title) {
      return {
        success: false,
        message:
          "اسم الملف والدرس مطلوبان.",
      };
    }

    const payload = {
      lesson_id: lessonId,
      title,
      resource_type:
        clean(input.resource_type) ||
        "file",
      file_url: clean(input.file_url),
      file_path: clean(input.file_path),
      external_url:
        clean(input.external_url),
      display_order: Math.max(
        1,
        numberValue(
          input.display_order,
          1,
        ),
      ),
      is_active: booleanValue(
        input.is_active,
        true,
      ),
      updated_at:
        new Date().toISOString(),
    };

    const { data, error } =
      await supabase
        .from("lesson_resources")
        .insert(payload)
        .select()
        .single();

    if (error) {
      return {
        success: false,
        message: error.message,
      };
    }

    revalidatePath(
      "/admin/learning/lessons",
    );

    return {
      success: true,
      data,
      message:
        "تمت إضافة المرفق.",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "تعذر إضافة المرفق.",
    };
  }
}

export async function deleteLessonResource(
  id: string,
): Promise<Result> {
  try {
    const { supabase } =
      await adminClient();

    const { data } = await supabase
      .from("lesson_resources")
      .select("file_path")
      .eq("id", id)
      .maybeSingle();

    if (data?.file_path) {
      await supabase.storage
        .from("lesson-resources")
        .remove([data.file_path]);
    }

    const { error } = await supabase
      .from("lesson_resources")
      .delete()
      .eq("id", id);

    if (error) {
      return {
        success: false,
        message: error.message,
      };
    }

    revalidatePath(
      "/admin/learning/lessons",
    );

    return {
      success: true,
      message:
        "تم حذف المرفق.",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "تعذر حذف المرفق.",
    };
  }
}