"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export interface LessonFormData {
  course_id: string;
  title: string;
  description: string;
  video_url: string;
  lesson_order: number;
  duration_minutes: number;
  is_preview: boolean;
  is_published: boolean;
}

async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || profile?.role !== "admin") {
    redirect("/");
  }

  return supabase;
}

export async function getLessons() {
  const supabase = await requireAdmin();

  const { data, error } = await supabase
    .from("lessons")
    .select(`
      id,
      course_id,
      title,
      description,
      video_url,
      lesson_order,
      duration_minutes,
      is_preview,
      is_published,
      created_at,
      courses (
        id,
        title,
        title_ar,
        name
      )
    `)
    .order("lesson_order", {
      ascending: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getLesson(id: string) {
  const supabase = await requireAdmin();

  const { data, error } = await supabase
    .from("lessons")
    .select(`
      id,
      course_id,
      title,
      description,
      video_url,
      lesson_order,
      duration_minutes,
      is_preview,
      is_published
    `)
    .eq("id", id)
    .single();

  if (error) {
    return null;
  }

  return data;
}

export async function createLesson(formData: LessonFormData) {
  const supabase = await requireAdmin();

  const { error } = await supabase
    .from("lessons")
    .insert({
      course_id: formData.course_id,
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      video_url: formData.video_url.trim() || null,
      lesson_order: formData.lesson_order,
      duration_minutes: formData.duration_minutes,
      is_preview: formData.is_preview,
      is_published: formData.is_published,
    });

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  revalidatePath("/admin/learning/lessons");

  return {
    success: true,
    message: "تمت إضافة الدرس بنجاح.",
  };
}

export async function updateLesson(
  id: string,
  formData: LessonFormData,
) {
  const supabase = await requireAdmin();

  const { error } = await supabase
    .from("lessons")
    .update({
      course_id: formData.course_id,
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      video_url: formData.video_url.trim() || null,
      lesson_order: formData.lesson_order,
      duration_minutes: formData.duration_minutes,
      is_preview: formData.is_preview,
      is_published: formData.is_published,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  revalidatePath("/admin/learning/lessons");
  revalidatePath(`/admin/learning/lessons/${id}/edit`);

  return {
    success: true,
    message: "تم تحديث الدرس بنجاح.",
  };
}

export async function deleteLesson(id: string) {
  const supabase = await requireAdmin();

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
    message: "تم حذف الدرس بنجاح.",
  };
}

export async function toggleLessonPublished(
  id: string,
  isPublished: boolean,
) {
  const supabase = await requireAdmin();

  const { error } = await supabase
    .from("lessons")
    .update({
      is_published: isPublished,
      updated_at: new Date().toISOString(),
    })
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
    message: isPublished
      ? "تم نشر الدرس."
      : "تم إخفاء الدرس.",
  };
}

export async function getCoursesForLessons() {
  const supabase = await requireAdmin();

  const { data, error } = await supabase
    .from("courses")
    .select(`
      id,
      title,
      title_ar,
      name
    `)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}