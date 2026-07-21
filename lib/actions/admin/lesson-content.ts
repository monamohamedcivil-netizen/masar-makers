"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Result<T = unknown> =
  | { success: true; data?: T; message: string }
  | { success: false; message: string };

async function adminClient() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("يجب تسجيل الدخول أولاً.");
  const { data: profile } = await supabase.from("profiles").select("role,is_active").eq("id", user.id).single();
  if (profile?.role !== "admin" || profile?.is_active === false) throw new Error("ليس لديك صلاحية لتنفيذ هذا الإجراء.");
  return { supabase, user };
}

const clean = (value: unknown) => typeof value === "string" && value.trim() ? value.trim() : null;
const numberValue = (value: unknown, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const booleanValue = (value: unknown, fallback = false) => typeof value === "boolean" ? value : fallback;

export async function saveLesson(input: Record<string, unknown>): Promise<Result> {
  try {
    const { supabase } = await adminClient();
    const id = clean(input.id);
    const courseId = clean(input.course_id);
    const title = clean(input.title);
    if (!courseId || !title) return { success: false, message: "الكورس واسم الدرس مطلوبان." };

    const payload = {
      course_id: courseId,
      journey_id: clean(input.journey_id),
      title,
      description: clean(input.description),
      video_url: clean(input.video_url),
      video_provider: clean(input.video_provider) || "external",
      video_asset_id: clean(input.video_asset_id),
      lesson_order: Math.max(1, numberValue(input.lesson_order, 1)),
      duration_minutes: Math.max(0, numberValue(input.duration_minutes, 0)),
      is_preview: booleanValue(input.is_preview),
      is_published: booleanValue(input.is_published),
      updated_at: new Date().toISOString(),
    };

    const query = id
      ? supabase.from("lessons").update(payload).eq("id", id)
      : supabase.from("lessons").insert(payload);
    const { data, error } = await query.select().single();
    if (error) return { success: false, message: error.message };
    revalidatePath("/admin/learning/lessons");
    return { success: true, data, message: id ? "تم تحديث الدرس." : "تم إنشاء الدرس." };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "تعذر حفظ الدرس." };
  }
}

export async function deleteLessonContent(id: string): Promise<Result> {
  try {
    const { supabase } = await adminClient();
    const { data: lesson } = await supabase.from("lessons").select("video_provider,video_asset_id").eq("id", id).single();
    const { data: resources } = await supabase.from("lesson_resources").select("file_path").eq("lesson_id", id);
    const paths = (resources ?? []).map((item: { file_path: string | null }) => item.file_path).filter(Boolean) as string[];
    if (lesson?.video_provider === "supabase" && lesson.video_asset_id) paths.push(lesson.video_asset_id);
    if (paths.length) await supabase.storage.from("lesson-resources").remove(paths);
    const { error } = await supabase.from("lessons").delete().eq("id", id);
    if (error) return { success: false, message: error.message };
    revalidatePath("/admin/learning/lessons");
    return { success: true, message: "تم حذف الدرس ومحتواه." };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "تعذر حذف الدرس." };
  }
}

export async function reorderLessons(ids: string[]): Promise<Result> {
  try {
    const { supabase } = await adminClient();
    for (let index = 0; index < ids.length; index += 1) {
      const { error } = await supabase.from("lessons").update({ lesson_order: index + 1, updated_at: new Date().toISOString() }).eq("id", ids[index]);
      if (error) return { success: false, message: error.message };
    }
    revalidatePath("/admin/learning/lessons");
    return { success: true, message: "تم حفظ ترتيب الدروس." };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "تعذر حفظ الترتيب." };
  }
}

function safeName(name: string) {
  const parts = name.split(".");
  const extension = parts.length > 1 ? parts.pop()!.toLowerCase().replace(/[^a-z0-9]/g, "") : "bin";
  const base = parts.join(".").toLowerCase().replace(/[^a-z0-9-_]+/g, "-").replace(/^-+|-+$/g, "") || "file";
  return `${Date.now()}-${crypto.randomUUID()}-${base}.${extension}`;
}

export async function uploadLessonAsset(formData: FormData): Promise<Result<{ path: string; name: string; type: string; size: number }>> {
  try {
    const { supabase, user } = await adminClient();
    const file = formData.get("file");
    const lessonId = clean(formData.get("lessonId"));
    const category = clean(formData.get("category")) || "resources";
    if (!(file instanceof File) || !lessonId) return { success: false, message: "الملف أو رقم الدرس غير موجود." };
    const maximum = category === "videos" ? 1024 * 1024 * 1024 : 100 * 1024 * 1024;
    if (file.size > maximum) return { success: false, message: category === "videos" ? "حجم الفيديو يتجاوز 1 GB." : "حجم الملف يتجاوز 100 MB." };
    const path = `${category}/${lessonId}/${user.id}/${safeName(file.name)}`;
    const { error } = await supabase.storage.from("lesson-resources").upload(path, file, { upsert: false, contentType: file.type || undefined });
    if (error) return { success: false, message: error.message };
    return { success: true, data: { path, name: file.name, type: file.type, size: file.size }, message: "تم رفع الملف." };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "تعذر رفع الملف." };
  }
}

export async function attachUploadedVideo(lessonId: string, path: string): Promise<Result> {
  try {
    const { supabase } = await adminClient();
    const { data: old } = await supabase.from("lessons").select("video_provider,video_asset_id").eq("id", lessonId).single();
    const { error } = await supabase.from("lessons").update({ video_provider: "supabase", video_asset_id: path, video_url: null, updated_at: new Date().toISOString() }).eq("id", lessonId);
    if (error) return { success: false, message: error.message };
    if (old?.video_provider === "supabase" && old.video_asset_id && old.video_asset_id !== path) await supabase.storage.from("lesson-resources").remove([old.video_asset_id]);
    revalidatePath("/admin/learning/lessons");
    return { success: true, message: "تم ربط الفيديو بالدرس." };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "تعذر ربط الفيديو." };
  }
}

export async function createAssetPreview(path: string): Promise<Result<{ url: string }>> {
  try {
    const { supabase } = await adminClient();
    const { data, error } = await supabase.storage.from("lesson-resources").createSignedUrl(path, 60 * 30);
    if (error || !data?.signedUrl) return { success: false, message: error?.message || "تعذر إنشاء رابط المعاينة." };
    return { success: true, data: { url: data.signedUrl }, message: "تم إنشاء رابط المعاينة." };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "تعذر فتح الملف." };
  }
}

export async function saveLessonResource(input: Record<string, unknown>): Promise<Result> {
  try {
    const { supabase } = await adminClient();
    const lessonId = clean(input.lesson_id);
    const title = clean(input.title);
    if (!lessonId || !title) return { success: false, message: "اسم الملف والدرس مطلوبان." };
    const payload = {
      lesson_id: lessonId,
      title,
      resource_type: clean(input.resource_type) || "file",
      file_url: clean(input.file_url),
      file_path: clean(input.file_path),
      external_url: clean(input.external_url),
      display_order: Math.max(1, numberValue(input.display_order, 1)),
      is_active: booleanValue(input.is_active, true),
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase.from("lesson_resources").insert(payload).select().single();
    if (error) return { success: false, message: error.message };
    revalidatePath("/admin/learning/lessons");
    return { success: true, data, message: "تمت إضافة المرفق." };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "تعذر إضافة المرفق." };
  }
}

export async function deleteLessonResource(id: string): Promise<Result> {
  try {
    const { supabase } = await adminClient();
    const { data } = await supabase.from("lesson_resources").select("file_path").eq("id", id).single();
    if (data?.file_path) await supabase.storage.from("lesson-resources").remove([data.file_path]);
    const { error } = await supabase.from("lesson_resources").delete().eq("id", id);
    if (error) return { success: false, message: error.message };
    revalidatePath("/admin/learning/lessons");
    return { success: true, message: "تم حذف المرفق." };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "تعذر حذف المرفق." };
  }
}
