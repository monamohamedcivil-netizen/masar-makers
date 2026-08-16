"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type CourseStatus = "draft" | "published" | "archived";

export interface CourseFormData {
  title: string;
  slug: string;
  course_code?: string;
  level?: "single" | "split";
  difficulty_level?: "fundamentals" | "advanced";
  description?: string;
  image_url?: string;
  icon_url?: string;
  price?: number;
  currency?: string;
  duration_hours?: number;
   status?: CourseStatus;
 
  display_order?: number;
}

async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("يجب تسجيل الدخول أولاً.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || profile?.role !== "admin") {
    throw new Error("ليس لديك صلاحية لتنفيذ هذا الإجراء.");
  }

  return supabase;
}

export async function getAdminCourses() {
  const supabase = await requireAdmin();

  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getAdminCourse(courseId: string) {
  const supabase = await requireAdmin();

  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .eq("id", courseId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function createCourse(formData: CourseFormData) {
  const supabase = await requireAdmin();

  const title = formData.title.trim();
  const slug = formData.slug.trim().toLowerCase();

  if (!title || !slug) {
    return {
      success: false,
      message: "اسم الكورس والرابط المختصر مطلوبان.",
    };
  }

  const { data, error } = await supabase
    .from("courses")
    .insert({
      title,
      slug,
      description: formData.description?.trim() || null,
      image_url: formData.image_url?.trim() || null,
      icon_url: formData.icon_url?.trim() || null,
      price: Number(formData.price ?? 0),
      currency: formData.currency?.trim().toUpperCase() || "SAR",
      duration_hours: Number(formData.duration_hours ?? 0),
      display_order: Number(formData.display_order ?? 1),
           status: formData.status || "draft",
      course_code: formData.course_code?.trim().toUpperCase() || null,
      level: formData.level || "single",
      difficulty_level: formData.difficulty_level || "advanced",
    })
    .select()
    .single();

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  revalidatePath("/admin/learning/courses");

  return {
    success: true,
    message: "تم إنشاء الكورس بنجاح.",
    data,
  };
}

export async function updateCourse(
  courseId: string,
  formData: CourseFormData,
) {
  const supabase = await requireAdmin();

  const title = formData.title.trim();
  const slug = formData.slug.trim().toLowerCase();

  if (!courseId || !title || !slug) {
    return {
      success: false,
      message: "بيانات الكورس غير مكتملة.",
    };
  }

  const { data, error } = await supabase
    .from("courses")
    .update({
      title,
      slug,
      description: formData.description?.trim() || null,
      image_url: formData.image_url?.trim() || null,
      icon_url: formData.icon_url?.trim() || null,
      price: Number(formData.price ?? 0),
      currency: formData.currency?.trim().toUpperCase() || "SAR",
      duration_hours: Number(formData.duration_hours ?? 0),
     display_order: Number(formData.display_order ?? 1),
           status: formData.status || "draft",
      course_code: formData.course_code?.trim().toUpperCase() || null,
      level: formData.level || "single",
      difficulty_level: formData.difficulty_level || "advanced",
      updated_at: new Date().toISOString(),
    })
    .eq("id", courseId)
    .select()
    .single();

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  revalidatePath("/admin/learning/courses");
  revalidatePath(`/admin/learning/courses/${courseId}`);
  revalidatePath(`/admin/learning/courses/${courseId}/edit`);

  return {
    success: true,
    message: "تم تحديث الكورس بنجاح.",
    data,
  };
}
export interface CourseSurveySettingsData {
  survey_enabled: boolean;
  survey_url?: string;
}

export async function updateCourseSurveySettings(
  courseId: string,
  formData: CourseSurveySettingsData,
) {
  const supabase = await requireAdmin();

  if (!courseId) {
    return {
      success: false,
      message: "معرّف الكورس غير موجود.",
    };
  }

  const surveyUrl = formData.survey_url?.trim() || null;

  if (
    surveyUrl &&
    !surveyUrl.startsWith("http://") &&
    !surveyUrl.startsWith("https://")
  ) {
    return {
      success: false,
      message: "يرجى إدخال رابط صحيح يبدأ بـ http:// أو https://",
    };
  }

  const { data, error } = await supabase
    .from("courses")
    .update({
      survey_enabled: formData.survey_enabled,
      survey_url: surveyUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", courseId)
    .select("id, survey_enabled, survey_url")
    .single();

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  revalidatePath("/admin/learning/courses");
  revalidatePath(`/admin/learning/courses/${courseId}`);

  return {
    success: true,
    message: "تم حفظ إعدادات الاستبيان بنجاح.",
    data,
  };
}
export async function deleteCourse(courseId: string) {
  const supabase = await requireAdmin();

  const { error } = await supabase
    .from("courses")
    .delete()
    .eq("id", courseId);

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  revalidatePath("/admin/learning/courses");

  return {
    success: true,
    message: "تم حذف الكورس بنجاح.",
  };
}

export async function updateCourseStatus(
  courseId: string,
  status: CourseStatus,
) {
  const supabase = await requireAdmin();

  const { error } = await supabase
    .from("courses")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", courseId);

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  revalidatePath("/admin/learning/courses");

  return {
    success: true,
    message: "تم تحديث حالة الكورس.",
  };
}