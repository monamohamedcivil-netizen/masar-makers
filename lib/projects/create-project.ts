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

type EnrollmentRow = {
  id: string;
  course_id: string;
  course_title: string | null;
};

function getSafeExtension(file: File) {
  const extensions: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };

  return extensions[file.type] ?? "jpg";
}

function getTextValue(
  formData: FormData,
  key: string,
) {
  const value = formData.get(key);

  return typeof value === "string"
    ? value.trim()
    : "";
}

export async function createProject(
  formData: FormData,
) {
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

  const enrollmentId = getTextValue(
    formData,
    "enrollmentId",
  );

  const courseId = getTextValue(
    formData,
    "courseId",
  );

  const projectTitle = getTextValue(
    formData,
    "projectTitle",
  );

  const projectDescription = getTextValue(
    formData,
    "projectDescription",
  );

  const projectLink = getTextValue(
    formData,
    "projectLink",
  );

  const images = formData
    .getAll("images")
    .filter(
      (item): item is File =>
        item instanceof File &&
        item.size > 0,
    );

  if (!enrollmentId || !courseId) {
    return {
      success: false,
      message:
        "يرجى اختيار الكورس المرتبط بالمشروع.",
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
    projectDescription.length > 1500
  ) {
    return {
      success: false,
      message:
        "وصف المشروع طويل جدًا.",
    };
  }

  if (images.length === 0) {
    return {
      success: false,
      message:
        "يجب اختيار صورة واحدة على الأقل.",
    };
  }

  if (
    images.length >
    MAX_PROJECT_IMAGES
  ) {
    return {
      success: false,
      message:
        `يمكن رفع ${MAX_PROJECT_IMAGES} صور كحد أقصى.`,
    };
  }

  for (const image of images) {
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
console.log("enrollmentId =", enrollmentId);
console.log("courseId =", courseId);
  const {
  data: enrollment,
  error: enrollmentError,
} = await supabase
  .from("enrollments")
  .select(
    "id, user_id, course_id, course_title, status, journey_type, journey_title",
  )
  .eq("id", enrollmentId)
  .maybeSingle();

console.log(
  "Project enrollment check:",
  {
    requestedEnrollmentId:
      enrollmentId,
    requestedCourseId:
      courseId,
    authenticatedUserId:
      user.id,
    enrollment,
    enrollmentError,
  },
);

  if (
    enrollmentError ||
    !enrollment
  ) {
    return {
      success: false,
      message:
        "لا يوجد اشتراك مقبول يطابق الكورس المحدد.",
    };
  }

  const enrollmentRow =
    enrollment as EnrollmentRow;

  const {
  data: profile,
  error: profileError,
} = await supabase
  .from("member_profiles")
  .select(
    "user_id, full_name, email, country, job_title",
  )
  .eq("user_id", user.id)
  .maybeSingle();

if (profileError) {
  console.error(
    "PROJECT MEMBER PROFILE ERROR:",
    profileError.message,
  );
}

  const {
    data: project,
    error: projectError,
  } = await supabase
    .from("student_projects")
    .insert({
      user_id: user.id,

      enrollment_id:
        enrollmentRow.id,

      course_id:
        enrollmentRow.course_id,

      course_title:
        enrollmentRow.course_title,

      student_name:
        profile?.full_name ??
        user.user_metadata?.full_name ??
        user.user_metadata?.name ??
        "",

      student_email:
        profile?.email ??
        user.email ??
        "",

        student_country:
  profile?.country?.trim() || null,

student_job_title:
  profile?.job_title?.trim() || null,
  
      project_title:
        projectTitle,

      project_description:
        projectDescription || null,

      project_link:
        projectLink || null,

      status: "submitted",

      submitted_at:
        new Date().toISOString(),

      updated_at:
        new Date().toISOString(),

      featured: false,
    })
    .select("id")
    .single();

  if (
    projectError ||
    !project
  ) {
    return {
      success: false,
      message:
        projectError?.message ??
        "تعذر إنشاء المشروع.",
    };
  }

  const uploadedPaths: string[] = [];

  try {
    for (
      let index = 0;
      index < images.length;
      index++
    ) {
      const image = images[index];

      const extension =
        getSafeExtension(image);

      const storagePath = [
        user.id,
        project.id,
        `${crypto.randomUUID()}.${extension}`,
      ].join("/");

      await uploadProjectImage(
        storagePath,
        image,
      );

      uploadedPaths.push(
        storagePath,
      );

      const {
        error: imageError,
      } = await supabase
        .from(
          "student_project_images",
        )
        .insert({
          project_id:
            project.id,

          image_url: "",

          storage_path:
            storagePath,

          is_cover:
            index === 0,

          show_in_course:
            false,

          sort_order:
            index,
        });

      if (imageError) {
        throw imageError;
      }
    }
  } catch (error) {
    await Promise.all(
      uploadedPaths.map(
        (storagePath) =>
          deleteProjectImage(
            storagePath,
          ),
      ),
    );

    await supabase
      .from("student_projects")
      .delete()
      .eq("id", project.id)
      .eq("user_id", user.id);

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "تعذر رفع صور المشروع.",
    };
  }

  revalidatePath("/dashboard");

  return {
    success: true,
    message:
      "تم رفع المشروع بنجاح.",
    projectId:
      project.id as string,
  };
}