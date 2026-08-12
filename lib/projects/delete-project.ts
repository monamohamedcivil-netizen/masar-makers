"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

import {
  deleteProjectImage,
} from "./project-storage";

type ProjectImageRow = {
  storage_path: string | null;
};

export async function deleteProject(
  projectId: string,
) {
  const normalizedProjectId =
    projectId.trim();

  if (!normalizedProjectId) {
    return {
      success: false,
      message:
        "معرّف المشروع غير موجود.",
    };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      message:
        "يجب تسجيل الدخول أولًا.",
    };
  }

  const {
    data: project,
    error: projectError,
  } = await supabase
    .from("student_projects")
    .select("id")
    .eq("id", normalizedProjectId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (
    projectError ||
    !project
  ) {
    return {
      success: false,
      message:
        "المشروع غير موجود أو لا تملكين صلاحية حذفه.",
    };
  }

  const {
    data: projectImagesData,
    error: imagesError,
  } = await supabase
    .from("student_project_images")
    .select("storage_path")
    .eq(
      "project_id",
      normalizedProjectId,
    );

  if (imagesError) {
    return {
      success: false,
      message:
        "تعذر قراءة صور المشروع قبل الحذف.",
    };
  }

  const projectImages =
    (projectImagesData ??
      []) as ProjectImageRow[];

  const storagePaths =
    projectImages
      .map(
        (image) =>
          image.storage_path,
      )
      .filter(
        (
          storagePath,
        ): storagePath is string =>
          Boolean(storagePath),
      );

  if (storagePaths.length > 0) {
    await Promise.all(
      storagePaths.map(
        (storagePath) =>
          deleteProjectImage(
            storagePath,
          ),
      ),
    );
  }

  const {
    error: imageRowsDeleteError,
  } = await supabase
    .from("student_project_images")
    .delete()
    .eq(
      "project_id",
      normalizedProjectId,
    );

  if (imageRowsDeleteError) {
    return {
      success: false,
      message:
        imageRowsDeleteError.message ||
        "تعذر حذف بيانات صور المشروع.",
    };
  }

  const {
    error: projectDeleteError,
  } = await supabase
    .from("student_projects")
    .delete()
    .eq("id", normalizedProjectId)
    .eq("user_id", user.id);

  if (projectDeleteError) {
    return {
      success: false,
      message:
        projectDeleteError.message ||
        "تعذر حذف المشروع.",
    };
  }

  revalidatePath("/dashboard");

  return {
    success: true,
    message:
      "تم حذف المشروع بنجاح.",
  };
}