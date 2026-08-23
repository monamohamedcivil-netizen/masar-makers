"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { deleteBunnyVideo } from "@/lib/bunny/stream";

type Result<T = unknown> =
  | { success: true; data?: T; message: string }
  | { success: false; message: string };

type ResourceScope = "lesson" | "section";
type CoursePart = "single" | "fundamentals" | "advanced";

function resourceScopeValue(value: unknown): ResourceScope {
  return value === "section" ? "section" : "lesson";
}

function coursePartValue(value: unknown): CoursePart {
  const part = String(value || "").trim().toLowerCase();

  if (part === "fundamentals") return "fundamentals";
  if (part === "advanced") return "advanced";

  return "single";
}

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

    /*
     * lessons.journey_type حقل قديم وله CHECK constraint بالقيم:
     * fundamental / advanced / integrated / workshop / free
     *
     * أما journeys.journey_type في النظام الحالي فيستخدم:
     * professional / one_day / free
     *
     * لذلك لا يجوز نسخ primaryJourney.journey_type مباشرة إلى lessons.
     * lesson_journeys يظل المصدر الحقيقي للربط المتعدد.
     */
    const legacyLessonJourneyType =
      requestedJourneyTypes.includes("professional")
        ? requestedCoursePart === "fundamentals"
          ? "fundamental"
          : requestedCoursePart === "advanced"
            ? "advanced"
            : "integrated"
        : requestedJourneyTypes.includes("one_day")
          ? "workshop"
          : "free";

    const payload: Record<string, unknown> = {
      course_id: courseId,
      course_part: requestedCoursePart,
      // الحقول القديمة تبقى للتوافق فقط؛ lesson_journeys هو المصدر الحقيقي للربط المتعدد.
      journey_id: primaryJourney.id,
      journey_type: legacyLessonJourneyType,
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
      .eq("lesson_id", id)
      .eq("resource_scope", "lesson");

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


/*
 * الحد البرمجي المستقبلي للمرفقات.
 * Supabase Free يظل صاحب الحد الفعلي الحالي (50 MB).
 * بعد الترقية يمكن رفع Global/Bucket limit بدون إعادة تصميم الرفع.
 */
const RESOURCE_APP_MAX_BYTES =
  500 * 1024 * 1024;

export async function prepareLessonAssetUpload(
  input: Record<string, unknown>,
): Promise<
  Result<{
    path: string;
    bucket: string;
  }>
> {
  try {
    const { user } =
      await adminClient();

    const resourceScope =
      resourceScopeValue(
        input.resource_scope,
      );

    const lessonId = clean(
      input.lesson_id,
    );

    const courseId = clean(
      input.course_id,
    );

    const coursePart =
      coursePartValue(
        input.course_part,
      );

    const fileName =
      clean(input.file_name);

    const fileSize =
      Math.max(
        0,
        numberValue(
          input.file_size,
          0,
        ),
      );

    if (!fileName) {
      return {
        success: false,
        message:
          "اسم الملف غير موجود.",
      };
    }

    if (
      resourceScope === "lesson" &&
      !lessonId
    ) {
      return {
        success: false,
        message:
          "رقم المحاضرة غير موجود.",
      };
    }

    if (
      resourceScope === "section" &&
      !courseId
    ) {
      return {
        success: false,
        message:
          "المحطة مطلوبة للمرفق العام للقسم.",
      };
    }

    if (
      fileSize >
      RESOURCE_APP_MAX_BYTES
    ) {
      return {
        success: false,
        message:
          "حجم المرفق يتجاوز الحد البرمجي 500 MB.",
      };
    }

    const ownerFolder =
      resourceScope === "section"
        ? `sections/${courseId}/${coursePart}`
        : `lessons/${lessonId}`;

    const path =
      `resources/${ownerFolder}/${user.id}/` +
      safeName(fileName);

    return {
      success: true,
      data: {
        path,
        bucket:
          "lesson-resources",
      },
      message:
        "تم تجهيز مسار الرفع.",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "تعذر تجهيز رفع الملف.",
    };
  }
}

export async function uploadLessonAsset(
  formData: FormData,
): Promise<
  Result<{
    path: string;
    name: string;
    type: string;
    size: number;
    resourceScope: ResourceScope;
    coursePart?: CoursePart;
  }>
> {
  try {
    const { supabase, user } =
      await adminClient();

    const file = formData.get("file");
    const resourceScope =
      resourceScopeValue(
        formData.get("resourceScope"),
      );

    const lessonId = clean(
      formData.get("lessonId"),
    );

    const courseId = clean(
      formData.get("courseId"),
    );

    const coursePart =
      coursePartValue(
        formData.get("coursePart"),
      );

    if (!(file instanceof File)) {
      return {
        success: false,
        message: "اختاري ملفًا صالحًا.",
      };
    }

    if (
      resourceScope === "lesson" &&
      !lessonId
    ) {
      return {
        success: false,
        message:
          "رقم المحاضرة غير موجود.",
      };
    }

    if (
      resourceScope === "section" &&
      !courseId
    ) {
      return {
        success: false,
        message:
          "المحطة مطلوبة للمرفق العام للقسم.",
      };
    }

    const maximum =
      RESOURCE_APP_MAX_BYTES;

    if (file.size > maximum) {
      return {
        success: false,
        message:
          "حجم المرفق يتجاوز الحد البرمجي 500 MB.",
      };
    }

    const ownerFolder =
      resourceScope === "section"
        ? `sections/${courseId}/${coursePart}`
        : `lessons/${lessonId}`;

    const path =
      `resources/${ownerFolder}/${user.id}/` +
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
        resourceScope,
        ...(resourceScope === "section"
          ? { coursePart }
          : {}),
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

    const id = clean(input.id);

    const resourceScope =
      resourceScopeValue(
        input.resource_scope,
      );

    const lessonId = clean(
      input.lesson_id,
    );

    const courseId = clean(
      input.course_id,
    );

    const coursePart =
      coursePartValue(
        input.course_part,
      );

    const title = clean(
      input.title,
    );

    if (!title) {
      return {
        success: false,
        message:
          "اسم المرفق مطلوب.",
      };
    }

    if (
      resourceScope === "lesson" &&
      !lessonId
    ) {
      return {
        success: false,
        message:
          "المحاضرة مطلوبة للمرفق الخاص بالمحاضرة.",
      };
    }

    if (
      resourceScope === "section" &&
      !courseId
    ) {
      return {
        success: false,
        message:
          "المحطة مطلوبة للمرفق العام للقسم.",
      };
    }

    let previousFilePath:
      | string
      | null = null;

    if (id) {
      const {
        data: currentResource,
        error: currentResourceError,
      } = await supabase
        .from("lesson_resources")
        .select("file_path")
        .eq("id", id)
        .maybeSingle();

      if (currentResourceError) {
        return {
          success: false,
          message:
            currentResourceError.message,
        };
      }

      previousFilePath =
        currentResource?.file_path ||
        null;
    }

    const payload = {
      lesson_id:
        resourceScope === "lesson"
          ? lessonId
          : null,

      // journey_id لم يعد مستخدمًا في نظام المرفقات.
      journey_id: null,

      course_id:
        resourceScope === "section"
          ? courseId
          : null,

      course_part:
        resourceScope === "section"
          ? coursePart
          : null,

      resource_scope:
        resourceScope,

      title,

      resource_type:
        clean(input.resource_type) ||
        "file",

      file_url:
        clean(input.file_url),

      file_path:
        clean(input.file_path),

      external_url:
        clean(input.external_url),

      display_order:
        Math.max(
          1,
          numberValue(
            input.display_order,
            1,
          ),
        ),

      is_active:
        booleanValue(
          input.is_active,
          true,
        ),

      updated_at:
        new Date().toISOString(),
    };

    const query = id
      ? supabase
          .from("lesson_resources")
          .update(payload)
          .eq("id", id)
      : supabase
          .from("lesson_resources")
          .insert(payload);

    const { data, error } =
      await query
        .select()
        .single();

    if (error) {
      return {
        success: false,
        message: error.message,
      };
    }

    const nextFilePath =
      clean(input.file_path);

    if (
      id &&
      previousFilePath &&
      previousFilePath !==
        nextFilePath
    ) {
      await supabase.storage
        .from("lesson-resources")
        .remove([
          previousFilePath,
        ]);
    }

    revalidatePath(
      "/admin/learning/lessons",
    );

    return {
      success: true,
      data,
      message: id
        ? "تم تحديث المرفق."
        : resourceScope === "section"
          ? "تمت إضافة مرفق القسم."
          : "تمت إضافة مرفق المحاضرة.",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "تعذر حفظ المرفق.",
    };
  }
}

/**
 * يستبدل الملف الفعلي لمرفق موجود مع الحفاظ على نفس سجل المرفق.
 * المرفقات الخارجية لا تحتاج هذه الدالة؛ يكفي تحديث external_url
 * بواسطة saveLessonResource مع تمرير id.
 */
export async function replaceLessonResourceFile(
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

    const resourceId = clean(
      formData.get("resourceId"),
    );

    const file = formData.get("file");

    if (!resourceId) {
      return {
        success: false,
        message:
          "رقم المرفق غير موجود.",
      };
    }

    if (!(file instanceof File)) {
      return {
        success: false,
        message:
          "اختاري ملفًا صالحًا.",
      };
    }

    const maximum =
      RESOURCE_APP_MAX_BYTES;

    if (file.size > maximum) {
      return {
        success: false,
        message:
          "حجم المرفق يتجاوز الحد البرمجي 500 MB.",
      };
    }

    const { data: current, error: currentError } =
      await supabase
        .from("lesson_resources")
        .select(
          "id,lesson_id,course_id,course_part,resource_scope,file_path",
        )
        .eq("id", resourceId)
        .maybeSingle();

    if (currentError) {
      return {
        success: false,
        message: currentError.message,
      };
    }

    if (!current) {
      return {
        success: false,
        message:
          "المرفق غير موجود.",
      };
    }

    const scope =
      resourceScopeValue(
        current.resource_scope,
      );

    const ownerFolder =
      scope === "section"
        ? `sections/${current.course_id}/${coursePartValue(current.course_part)}`
        : `lessons/${current.lesson_id}`;

    const path =
      `resources/${ownerFolder}/${user.id}/` +
      safeName(file.name);

    const { error: uploadError } =
      await supabase.storage
        .from("lesson-resources")
        .upload(path, file, {
          upsert: false,
          contentType:
            file.type || undefined,
        });

    if (uploadError) {
      return {
        success: false,
        message: uploadError.message,
      };
    }

    const { error: updateError } =
      await supabase
        .from("lesson_resources")
        .update({
          resource_type: "file",
          file_path: path,
          file_url: null,
          external_url: null,
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", resourceId);

    if (updateError) {
      await supabase.storage
        .from("lesson-resources")
        .remove([path]);

      return {
        success: false,
        message: updateError.message,
      };
    }

    if (
      current.file_path &&
      current.file_path !== path
    ) {
      await supabase.storage
        .from("lesson-resources")
        .remove([current.file_path]);
    }

    revalidatePath(
      "/admin/learning/lessons",
    );

    return {
      success: true,
      data: {
        path,
        name: file.name,
        type: file.type,
        size: file.size,
      },
      message:
        "تم استبدال ملف المرفق.",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "تعذر استبدال ملف المرفق.",
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