"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

import {
  ALLOWED_PROJECT_IMAGE_TYPES,
  MAX_PROJECT_IMAGES,
  MAX_PROJECT_IMAGE_SIZE,
} from "./constants";

import {
  deleteProjectImage,
  uploadProjectImage,
} from "./project-storage";

type ExistingImageRow = {
  id: string;
  storage_path: string | null;
};

type ImageOrderItem =
  | {
      kind: "existing";
      id: string;
    }
  | {
      kind: "new";
      clientId: string;
    };

function getTextValue(
  formData: FormData,
  key: string,
) {
  const value = formData.get(key);

  return typeof value === "string"
    ? value.trim()
    : "";
}

function parseStringArray(
  formData: FormData,
  key: string,
) {
  const rawValue =
    getTextValue(formData, key);

  if (!rawValue) {
    return [] as string[];
  }

  try {
    const parsedValue: unknown =
      JSON.parse(rawValue);

    return Array.isArray(parsedValue)
      ? parsedValue.filter(
          (
            value,
          ): value is string =>
            typeof value === "string",
        )
      : [];
  } catch {
    return [];
  }
}

function parseImageOrder(
  formData: FormData,
) {
  const rawValue =
    getTextValue(
      formData,
      "imageOrder",
    );

  if (!rawValue) {
    return [] as ImageOrderItem[];
  }

  try {
    const parsedValue: unknown =
      JSON.parse(rawValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue.filter(
      (
        value,
      ): value is ImageOrderItem => {
        if (
          typeof value !== "object" ||
          value === null ||
          !("kind" in value)
        ) {
          return false;
        }

        if (
          value.kind === "existing"
        ) {
          return (
            "id" in value &&
            typeof value.id ===
              "string"
          );
        }

        if (value.kind === "new") {
          return (
            "clientId" in value &&
            typeof value.clientId ===
              "string"
          );
        }

        return false;
      },
    );
  } catch {
    return [];
  }
}

function getSafeExtension(file: File) {
  const extensions: Record<
    string,
    string
  > = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };

  return extensions[file.type] ?? "jpg";
}

export async function updateProject(
  formData: FormData,
) {
  const supabase =
    await createClient();

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

  const projectId =
    getTextValue(
      formData,
      "projectId",
    );

  const projectTitle =
    getTextValue(
      formData,
      "projectTitle",
    );

  const projectDescription =
    getTextValue(
      formData,
      "projectDescription",
    );

  const projectLink =
    getTextValue(
      formData,
      "projectLink",
    );

  const keptImageIds =
    parseStringArray(
      formData,
      "keptImageIds",
    );

  const requestedImageOrder =
    parseImageOrder(formData);

  const newImageClientIds =
    parseStringArray(
      formData,
      "newImageClientIds",
    );

  const newFiles = formData
    .getAll("images")
    .filter(
      (item): item is File =>
        item instanceof File &&
        item.size > 0,
    );

  if (!projectId) {
    return {
      success: false,
      message:
        "معرّف المشروع غير موجود.",
    };
  }

  if (!projectTitle) {
    return {
      success: false,
      message:
        "يرجى كتابة عنوان المشروع.",
    };
  }

  if (projectTitle.length > 150) {
    return {
      success: false,
      message:
        "عنوان المشروع طويل جدًا.",
    };
  }

  if (
    projectDescription.length >
    1500
  ) {
    return {
      success: false,
      message:
        "وصف المشروع طويل جدًا.",
    };
  }

  if (
    newFiles.length !==
    newImageClientIds.length
  ) {
    return {
      success: false,
      message:
        "تعذر مطابقة الصور الجديدة. أعيدي المحاولة.",
    };
  }

  for (const image of newFiles) {
    if (
      !ALLOWED_PROJECT_IMAGE_TYPES.includes(
        image.type as
          (typeof ALLOWED_PROJECT_IMAGE_TYPES)[number],
      )
    ) {
      return {
        success: false,
        message:
          "نوع إحدى الصور غير مدعوم. استخدمي JPG أو PNG أو WEBP.",
      };
    }

    if (
      image.size >
      MAX_PROJECT_IMAGE_SIZE
    ) {
      return {
        success: false,
        message:
          "حجم إحدى الصور أكبر من 8 MB.",
      };
    }
  }

  const {
    data: project,
    error: projectError,
  } = await supabase
    .from("student_projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (
    projectError ||
    !project
  ) {
    return {
      success: false,
      message:
        "المشروع غير موجود أو لا تملكين صلاحية تعديله.",
    };
  }

  const {
    data: existingImagesData,
    error: existingImagesError,
  } = await supabase
    .from(
      "student_project_images",
    )
    .select("id, storage_path")
    .eq("project_id", projectId);

  if (existingImagesError) {
    return {
      success: false,
      message:
        "تعذر قراءة صور المشروع الحالية.",
    };
  }

  const existingImages =
    (existingImagesData ??
      []) as ExistingImageRow[];

  const existingById = new Map(
    existingImages.map((image) => [
      image.id,
      image,
    ]),
  );

  const validKeptIds =
    keptImageIds.filter((id) =>
      existingById.has(id),
    );

  const validKeptSet = new Set(
    validKeptIds,
  );

  const removedImages =
    existingImages.filter(
      (image) =>
        !validKeptSet.has(image.id),
    );

  const finalImageCount =
    validKeptIds.length +
    newFiles.length;

  if (finalImageCount === 0) {
    return {
      success: false,
      message:
        "يجب أن يحتوي المشروع على صورة واحدة على الأقل.",
    };
  }

  if (
    finalImageCount >
    MAX_PROJECT_IMAGES
  ) {
    return {
      success: false,
      message:
        `يمكن الاحتفاظ ورفع ${MAX_PROJECT_IMAGES} صور كحد أقصى.`,
    };
  }

  const newFilesByClientId =
    new Map(
      newImageClientIds.map(
        (clientId, index) => [
          clientId,
          newFiles[index],
        ],
      ),
    );

  const safeImageOrder =
    requestedImageOrder.filter(
      (item) =>
        item.kind === "existing"
          ? validKeptSet.has(item.id)
          : newFilesByClientId.has(
              item.clientId,
            ),
    );

  const orderedExistingIds =
    safeImageOrder
      .filter(
        (
          item,
        ): item is Extract<
          ImageOrderItem,
          { kind: "existing" }
        > =>
          item.kind === "existing",
      )
      .map((item) => item.id);

  validKeptIds.forEach((id) => {
    if (
      !orderedExistingIds.includes(id)
    ) {
      safeImageOrder.push({
        kind: "existing",
        id,
      });
    }
  });

  newImageClientIds.forEach(
    (clientId) => {
      const alreadyIncluded =
        safeImageOrder.some(
          (item) =>
            item.kind === "new" &&
            item.clientId ===
              clientId,
        );

      if (!alreadyIncluded) {
        safeImageOrder.push({
          kind: "new",
          clientId,
        });
      }
    },
  );

  const uploadedPaths: string[] = [];
  const insertedImageIds: string[] = [];
  const insertedByClientId =
    new Map<string, string>();

  try {
    const {
      error: updateError,
    } = await supabase
      .from("student_projects")
      .update({
        project_title:
          projectTitle,
        project_description:
          projectDescription || null,
        project_link:
          projectLink || null,
        status: "submitted",
        admin_notes: null,
        reviewed_at: null,
        reviewed_by: null,
        updated_at:
          new Date().toISOString(),
      })
      .eq("id", projectId)
      .eq("user_id", user.id);

    if (updateError) {
      throw updateError;
    }

    for (const item of safeImageOrder) {
      if (item.kind !== "new") {
        continue;
      }

      const file =
        newFilesByClientId.get(
          item.clientId,
        );

      if (!file) {
        continue;
      }

      const extension =
        getSafeExtension(file);

      const storagePath = [
        user.id,
        projectId,
        `${crypto.randomUUID()}.${extension}`,
      ].join("/");

      await uploadProjectImage(
        storagePath,
        file,
      );

      uploadedPaths.push(
        storagePath,
      );

      const {
        data: insertedImage,
        error: imageInsertError,
      } = await supabase
        .from(
          "student_project_images",
        )
        .insert({
          project_id: projectId,
          image_url: "",
          storage_path:
            storagePath,
          is_cover: false,
          show_in_course: false,
          sort_order: 999,
        })
        .select("id")
        .single();

      if (
        imageInsertError ||
        !insertedImage
      ) {
        throw (
          imageInsertError ??
          new Error(
            "تعذر حفظ الصورة الجديدة.",
          )
        );
      }

      const insertedId =
        insertedImage.id as string;

      insertedImageIds.push(
        insertedId,
      );

      insertedByClientId.set(
        item.clientId,
        insertedId,
      );
    }

    for (
      let index = 0;
      index <
      safeImageOrder.length;
      index++
    ) {
      const item =
        safeImageOrder[index];

      const imageId =
        item.kind === "existing"
          ? item.id
          : insertedByClientId.get(
              item.clientId,
            );

      if (!imageId) {
        continue;
      }

      const {
        error: reorderError,
      } = await supabase
        .from(
          "student_project_images",
        )
        .update({
          sort_order: index,
          is_cover: index === 0,
        })
        .eq("id", imageId)
        .eq("project_id", projectId);

      if (reorderError) {
        throw reorderError;
      }
    }

    if (removedImages.length > 0) {
      const removedImageIds =
        removedImages.map(
          (image) => image.id,
        );

      const {
        error: deleteRowsError,
      } = await supabase
        .from(
          "student_project_images",
        )
        .delete()
        .in("id", removedImageIds)
        .eq("project_id", projectId);

      if (deleteRowsError) {
        throw deleteRowsError;
      }

      await Promise.all(
        removedImages
          .map(
            (image) =>
              image.storage_path,
          )
          .filter(
            (
              storagePath,
            ): storagePath is string =>
              Boolean(storagePath),
          )
          .map((storagePath) =>
            deleteProjectImage(
              storagePath,
            ),
          ),
      );
    }
  } catch (error) {
    if (
      insertedImageIds.length > 0
    ) {
      await supabase
        .from(
          "student_project_images",
        )
        .delete()
        .in("id", insertedImageIds)
        .eq("project_id", projectId);
    }

    await Promise.all(
      uploadedPaths.map(
        (storagePath) =>
          deleteProjectImage(
            storagePath,
          ),
      ),
    );

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "تعذر تحديث المشروع.",
    };
  }

  revalidatePath("/dashboard");

  return {
    success: true,
    message:
      "تم تحديث المشروع بنجاح.",
    projectId,
  };
}