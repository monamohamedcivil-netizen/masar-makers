"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient, createClient } from "@/lib/supabase/server";

/*
 * One-time tool: old PNG / JPG images of the course pages (course_screen_contents)
 * are converted to WebP in the admin's browser, uploaded next to the originals,
 * then the page content is pointed to the new files. Originals are NOT deleted.
 */

type AnyRow = Record<string, any>;

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("يجب تسجيل الدخول أولًا.");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!["admin", "super_admin"].includes(String(profile?.role ?? ""))) {
    throw new Error("هذه العملية للإدارة فقط.");
  }
  return user;
}

const IMAGE_URL = /https?:\/\/[^"'\s)]+\/storage\/v1\/object\/public\/course-images\/[^"'\s)?]+\.(?:png|jpe?g)/gi;
const ONE_IMAGE_URL = /^https?:\/\/[^"'\s)]+\/storage\/v1\/object\/public\/course-images\/[^"'\s)?]+\.(?:png|jpe?g)$/i;

export type OldImage = { url: string; uses: number; size: number | null };

/** PNG / JPG images still used in the course pages. */
export async function listOldCourseImages(): Promise<{ ok: true; images: OldImage[] } | { ok: false; error: string }> {
  try {
    await requireAdmin();
    const db = createAdminClient();
    const { data, error } = await db.from("course_screen_contents").select("id,content");
    if (error) throw error;
    const uses = new Map<string, number>();
    for (const row of (data ?? []) as AnyRow[]) {
      for (const url of JSON.stringify(row.content ?? "").match(IMAGE_URL) ?? []) {
        uses.set(url, (uses.get(url) ?? 0) + 1);
      }
    }
    const images = [...uses.entries()].map(([url, n]) => ({ url, uses: n, size: null }));
    return { ok: true, images };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "تعذر تحميل الصور." };
  }
}

/** Points the course pages from the old image to its WebP copy. */
export async function replaceCourseImageUrl(oldUrl: string, newUrl: string): Promise<{ ok: true; rows: number } | { ok: false; error: string }> {
  try {
    await requireAdmin();
    if (!ONE_IMAGE_URL.test(oldUrl)) throw new Error("رابط الصورة القديمة غير صالح.");
    if (!/\/storage\/v1\/object\/public\/course-images\/.+\.webp$/i.test(newUrl)) throw new Error("رابط الصورة الجديدة غير صالح.");
    const db = createAdminClient();
    const { data, error } = await db.from("course_screen_contents").select("id,content");
    if (error) throw error;
    let rows = 0;
    for (const row of (data ?? []) as AnyRow[]) {
      const text = JSON.stringify(row.content ?? null);
      if (!text.includes(oldUrl)) continue;
      const content = JSON.parse(text.split(oldUrl).join(newUrl));
      const { error: updateError } = await db.from("course_screen_contents").update({ content }).eq("id", row.id);
      if (updateError) throw updateError;
      rows += 1;
    }
    revalidatePath("/", "layout");
    return { ok: true, rows };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "تعذر تحديث الصورة." };
  }
}
