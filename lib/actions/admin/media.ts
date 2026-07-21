"use server";

import { createClient } from "@/lib/supabase/server";

export interface MediaUploadResult {
  success: boolean;
  url?: string;
  path?: string;
  message?: string;
}

const BUCKET_NAME = "course-media";

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
];

const MAX_FILE_SIZE = 5 * 1024 * 1024;

async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("UNAUTHORIZED");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || profile?.role !== "admin") {
    throw new Error("FORBIDDEN");
  }

  return {
    supabase,
    user,
  };
}

function sanitizeFileName(fileName: string) {
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "webp";

  return {
    extension,
    name: fileName
      .replace(/\.[^/.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9-_]+/g, "-")
      .replace(/^-+|-+$/g, ""),
  };
}

export async function uploadCourseMedia(
  formData: FormData,
): Promise<MediaUploadResult> {
  try {
    const { supabase, user } = await requireAdmin();

    const file = formData.get("file");
    const folderValue = formData.get("folder");

    if (!(file instanceof File)) {
      return {
        success: false,
        message: "يرجى اختيار صورة.",
      };
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return {
        success: false,
        message: "نوع الصورة غير مدعوم.",
      };
    }

    if (file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        message: "حجم الصورة يجب ألا يتجاوز 5 MB.",
      };
    }

    const folder =
      typeof folderValue === "string" && folderValue.trim()
        ? folderValue
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9-_]+/g, "-")
        : "general";

    const sanitized = sanitizeFileName(file.name);

    const uniqueName = [
      Date.now(),
      crypto.randomUUID(),
      sanitized.name || "image",
    ].join("-");

    const filePath =
      `${folder}/${user.id}/${uniqueName}.${sanitized.extension}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      return {
        success: false,
        message: uploadError.message,
      };
    }

    const { data } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return {
      success: true,
      url: data.publicUrl,
      path: filePath,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء رفع الصورة.",
    };
  }
}

export async function deleteCourseMedia(
  filePath: string,
): Promise<MediaUploadResult> {
  try {
    const { supabase } = await requireAdmin();

    if (!filePath.trim()) {
      return {
        success: false,
        message: "مسار الصورة غير موجود.",
      };
    }

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      return {
        success: false,
        message: error.message,
      };
    }

    return {
      success: true,
      path: filePath,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء حذف الصورة.",
    };
  }
}