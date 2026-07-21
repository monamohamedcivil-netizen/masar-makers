"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Result<T = unknown> = { success: true; data?: T; message: string } | { success: false; message: string };

async function adminClient() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("يجب تسجيل الدخول أولاً.");
  const { data: profile } = await supabase.from("profiles").select("role,is_active").eq("id", user.id).single();
  if (profile?.role !== "admin" || profile?.is_active === false) throw new Error("ليس لديك صلاحية لتنفيذ هذا الإجراء.");
  return supabase;
}

function text(value: unknown) { return typeof value === "string" && value.trim() ? value.trim() : null; }
function num(value: unknown, fallback = 0) { const n = Number(value); return Number.isFinite(n) ? n : fallback; }
function bool(value: unknown, fallback = true) { return typeof value === "boolean" ? value : fallback; }
function slug(value: unknown) { return String(value ?? "").trim().toLowerCase().replace(/\s+/g, "-"); }

export async function saveCareerPath(input: Record<string, unknown>): Promise<Result> {
  try {
    const supabase = await adminClient();
    const id = text(input.id);
    const payload = {
      title: text(input.title), slug: slug(input.slug), short_title: text(input.short_title),
      description: text(input.description), image_url: text(input.image_url), image_path: text(input.image_path),
      is_active: bool(input.is_active), display_order: num(input.display_order, 1), updated_at: new Date().toISOString(),
    };
    if (!payload.title || !payload.slug) return { success: false, message: "اسم المسار والرابط المختصر مطلوبان." };
    const query = id ? supabase.from("career_paths").update(payload).eq("id", id) : supabase.from("career_paths").insert(payload);
    const { data, error } = await query.select().single();
    if (error) return { success: false, message: error.message };
    revalidatePath("/admin/learning/career-paths");
    return { success: true, data, message: id ? "تم تحديث المسار." : "تم إنشاء المسار." };
  } catch (e) { return { success: false, message: e instanceof Error ? e.message : "تعذر حفظ المسار." }; }
}

export async function deleteCareerPath(id: string): Promise<Result> {
  try {
    const supabase = await adminClient();
    const { error } = await supabase.from("career_paths").delete().eq("id", id);
    if (error) return { success: false, message: error.message };
    revalidatePath("/admin/learning/career-paths");
    return { success: true, message: "تم حذف المسار." };
  } catch (e) { return { success: false, message: e instanceof Error ? e.message : "تعذر حذف المسار." }; }
}

export async function reorderCareerPaths(ids: string[]): Promise<Result> {
  try {
    const supabase = await adminClient();
    for (let i = 0; i < ids.length; i++) {
      const { error } = await supabase.from("career_paths").update({ display_order: i + 1, updated_at: new Date().toISOString() }).eq("id", ids[i]);
      if (error) return { success: false, message: error.message };
    }
    revalidatePath("/admin/learning/career-paths");
    return { success: true, message: "تم حفظ ترتيب المسارات." };
  } catch (e) { return { success: false, message: e instanceof Error ? e.message : "تعذر حفظ الترتيب." }; }
}

export async function saveCourse(input: Record<string, unknown>): Promise<Result> {
  try {
    const supabase = await adminClient();
    const id = text(input.id);
    const payload = {
      station_id: text(input.station_id), title: text(input.title), title_ar: text(input.title_ar) || text(input.title),
      slug: slug(input.slug), description: text(input.description), image_url: text(input.image_url), image_path: text(input.image_path),
      icon_url: text(input.icon_url), icon_path: text(input.icon_path), price: num(input.price), currency: text(input.currency) || "SAR",
      duration_hours: num(input.duration_hours), projects_count: num(input.projects_count), level: text(input.level) || "مبتدئ",
      journey_type: text(input.journey_type) || "career_path", status: text(input.status) || "draft", is_active: bool(input.is_active),
      is_featured: bool(input.is_featured, false), display_order: num(input.display_order, 1), updated_at: new Date().toISOString(),
    };
    if (!payload.title || !payload.slug) return { success: false, message: "اسم الكورس والرابط المختصر مطلوبان." };
    const query = id ? supabase.from("courses").update(payload).eq("id", id) : supabase.from("courses").insert(payload);
    const { data, error } = await query.select().single();
    if (error) return { success: false, message: error.message };
    revalidatePath("/admin/learning/courses");
    return { success: true, data, message: id ? "تم تحديث الكورس." : "تم إنشاء الكورس." };
  } catch (e) { return { success: false, message: e instanceof Error ? e.message : "تعذر حفظ الكورس." }; }
}

export async function deleteCatalogCourse(id: string): Promise<Result> {
  try {
    const supabase = await adminClient();
    const { error } = await supabase.from("courses").delete().eq("id", id);
    if (error) return { success: false, message: error.message };
    revalidatePath("/admin/learning/courses");
    return { success: true, message: "تم حذف الكورس." };
  } catch (e) { return { success: false, message: e instanceof Error ? e.message : "تعذر حذف الكورس." }; }
}

export async function reorderCourses(ids: string[]): Promise<Result> {
  try {
    const supabase = await adminClient();
    for (let i = 0; i < ids.length; i++) {
      const { error } = await supabase.from("courses").update({ display_order: i + 1, updated_at: new Date().toISOString() }).eq("id", ids[i]);
      if (error) return { success: false, message: error.message };
    }
    revalidatePath("/admin/learning/courses");
    return { success: true, message: "تم حفظ ترتيب الكورسات." };
  } catch (e) { return { success: false, message: e instanceof Error ? e.message : "تعذر حفظ الترتيب." }; }
}

export async function saveJourney(input: Record<string, unknown>): Promise<Result> {
  try {
    const supabase = await adminClient();
    const id = text(input.id);
    const payload = {
      course_id: text(input.course_id), title: text(input.title), slug: slug(input.slug), journey_type: text(input.journey_type) || "fundamental",
      description: text(input.description), duration_hours: num(input.duration_hours), price: num(input.price), currency: text(input.currency) || "SAR",
      registration_required: bool(input.registration_required), status: text(input.status) || "available", start_date: text(input.start_date),
      end_date: text(input.end_date), is_active: bool(input.is_active), display_order: num(input.display_order, 1), updated_at: new Date().toISOString(),
    };
    if (!payload.course_id || !payload.title || !payload.slug) return { success: false, message: "الكورس واسم الرحلة والرابط المختصر مطلوبة." };
    const query = id ? supabase.from("journeys").update(payload).eq("id", id) : supabase.from("journeys").insert(payload);
    const { data, error } = await query.select().single();
    if (error) return { success: false, message: error.message };
    revalidatePath("/admin/learning/journeys");
    return { success: true, data, message: id ? "تم تحديث الرحلة." : "تم إنشاء الرحلة." };
  } catch (e) { return { success: false, message: e instanceof Error ? e.message : "تعذر حفظ الرحلة." }; }
}

export async function deleteJourney(id: string): Promise<Result> {
  try {
    const supabase = await adminClient();
    const { error } = await supabase.from("journeys").delete().eq("id", id);
    if (error) return { success: false, message: error.message };
    revalidatePath("/admin/learning/journeys");
    return { success: true, message: "تم حذف الرحلة." };
  } catch (e) { return { success: false, message: e instanceof Error ? e.message : "تعذر حذف الرحلة." }; }
}

export async function reorderJourneys(ids: string[]): Promise<Result> {
  try {
    const supabase = await adminClient();
    for (let i = 0; i < ids.length; i++) {
      const { error } = await supabase.from("journeys").update({ display_order: i + 1, updated_at: new Date().toISOString() }).eq("id", ids[i]);
      if (error) return { success: false, message: error.message };
    }
    revalidatePath("/admin/learning/journeys");
    return { success: true, message: "تم حفظ ترتيب الرحلات." };
  } catch (e) { return { success: false, message: e instanceof Error ? e.message : "تعذر حفظ الترتيب." }; }
}
