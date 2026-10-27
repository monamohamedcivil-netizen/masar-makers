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

const BUCKET = "course-images";
const pathOf = (url: string) => decodeURIComponent(url.split(`/public/${BUCKET}/`)[1] ?? "");

/** Every text in the course pages (to make sure an original is no longer used). */
async function usedText(db: ReturnType<typeof createAdminClient>) {
  const { data, error } = await db.from("course_screen_contents").select("content");
  if (error) throw error;
  return ((data ?? []) as AnyRow[]).map((r) => JSON.stringify(r.content ?? "")).join("\n");
}

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
export async function replaceCourseImageUrl(
  oldUrl: string,
  newUrl: string,
  sizes?: { oldSize?: number; newSize?: number },
): Promise<{ ok: true; rows: number } | { ok: false; error: string }> {
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
    // Remember old → new so the original can be deleted later.
    await db.from("webp_conversions").upsert(
      {
        bucket: BUCKET,
        old_path: pathOf(oldUrl),
        new_path: pathOf(newUrl),
        old_size: sizes?.oldSize ?? null,
        new_size: sizes?.newSize ?? null,
        converted_at: new Date().toISOString(),
        original_deleted_at: null,
      },
      { onConflict: "bucket,old_path" },
    );
    revalidatePath("/", "layout");
    return { ok: true, rows };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "تعذر تحديث الصورة." };
  }
}

export type ConvertedOriginal = { oldPath: string; newPath: string; oldSize: number | null; newSize: number | null; stillUsed: boolean };

/** Converted originals that still exist in storage (not deleted yet). */
export async function listConvertedOriginals(): Promise<{ ok: true; items: ConvertedOriginal[] } | { ok: false; error: string }> {
  try {
    await requireAdmin();
    const db = createAdminClient();
    const { data, error } = await db
      .from("webp_conversions")
      .select("old_path,new_path,old_size,new_size")
      .eq("bucket", BUCKET)
      .is("original_deleted_at", null)
      .order("converted_at");
    if (error) throw error;
    const text = await usedText(db);
    const items = ((data ?? []) as AnyRow[]).map((r) => ({
      oldPath: String(r.old_path),
      newPath: String(r.new_path),
      oldSize: r.old_size == null ? null : Number(r.old_size),
      newSize: r.new_size == null ? null : Number(r.new_size),
      stillUsed: text.includes(`/${BUCKET}/${r.old_path}`) || text.includes(`/${BUCKET}/${encodeURI(String(r.old_path))}`),
    }));
    return { ok: true, items };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "تعذر تحميل الصور المحوّلة." };
  }
}

/**
 * Deletes the original PNG / JPG files that were converted — only those no longer used
 * in any course page (checked again here). Permanent.
 */
export async function deleteConvertedOriginals(): Promise<{ ok: true; deleted: number; kept: number; freed: number } | { ok: false; error: string }> {
  try {
    await requireAdmin();
    const db = createAdminClient();
    const listed = await listConvertedOriginals();
    if (!listed.ok) throw new Error(listed.error);
    const safe = listed.items.filter((i) => !i.stillUsed && i.oldPath && /\.(png|jpe?g)$/i.test(i.oldPath));
    let deleted = 0;
    let freed = 0;
    for (let i = 0; i < safe.length; i += 50) {
      const chunk = safe.slice(i, i + 50);
      const { error } = await db.storage.from(BUCKET).remove(chunk.map((c) => c.oldPath));
      if (error) throw error;
      await db
        .from("webp_conversions")
        .update({ original_deleted_at: new Date().toISOString() })
        .eq("bucket", BUCKET)
        .in("old_path", chunk.map((c) => c.oldPath));
      deleted += chunk.length;
      freed += chunk.reduce((t, c) => t + (c.oldSize ?? 0), 0);
    }
    return { ok: true, deleted, kept: listed.items.length - safe.length, freed };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "تعذر حذف الصور الأصلية." };
  }
}
