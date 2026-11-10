"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient, createClient } from "@/lib/supabase/server";

/*
 * أداة لمرة واحدة: صور مشاريع الطلاب القديمة (PNG / JPG) تتحول إلى WebP في متصفح الأدمن،
 * وتُرفع بجانب الأصل (نفس مجلد الطالب)، ثم يتغير مسار الصورة في المشروع.
 * الصور الأصلية لا تُحذف.
 */

const BUCKET = "student-projects";
const OLD_IMAGE = /\.(?:png|jpe?g)$/i;

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
}

export type OldProjectImage = { path: string; projectTitle: string };

/** صور مشاريع الطلاب PNG / JPG المسجّلة في المنصة. */
export async function listOldProjectImages(): Promise<{ ok: true; images: OldProjectImage[] } | { ok: false; error: string }> {
  try {
    await requireAdmin();
    const db = createAdminClient();
    const { data, error } = await db
      .from("student_project_images")
      .select("storage_path, student_projects(project_title)")
      .not("storage_path", "is", null);
    if (error) throw error;
    const images = ((data ?? []) as Array<Record<string, any>>)
      .filter((row) => typeof row.storage_path === "string" && OLD_IMAGE.test(row.storage_path))
      .map((row) => {
        const project = Array.isArray(row.student_projects) ? row.student_projects[0] : row.student_projects;
        return { path: String(row.storage_path), projectTitle: String(project?.project_title ?? "") };
      });
    return { ok: true, images };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "تعذر تحميل الصور." };
  }
}

/** رابط رفع مؤقت لمسار WebP جديد بجانب الصورة القديمة. */
export async function prepareProjectImageUpload(
  oldPath: string,
): Promise<{ ok: true; newPath: string; token: string } | { ok: false; error: string }> {
  try {
    await requireAdmin();
    if (!OLD_IMAGE.test(oldPath)) throw new Error("مسار الصورة غير صالح.");
    const db = createAdminClient();
    const { data: row } = await db.from("student_project_images").select("id").eq("storage_path", oldPath).limit(1).maybeSingle();
    if (!row) throw new Error("الصورة غير مسجّلة في أي مشروع.");
    const folder = oldPath.split("/").slice(0, -1).join("/");
    const newPath = `${folder}/${crypto.randomUUID()}.webp`;
    const { data, error } = await db.storage.from(BUCKET).createSignedUploadUrl(newPath);
    if (error || !data) throw error ?? new Error("تعذر تجهيز الرفع.");
    return { ok: true, newPath, token: data.token };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "تعذر تجهيز الرفع." };
  }
}

/** بعد رفع WebP: نقل المشروع إلى المسار الجديد (الصورة، وصورة الغلاف إن كانت نفسها). */
export async function finalizeProjectImage(
  oldPath: string,
  newPath: string,
  sizes?: { oldSize?: number; newSize?: number },
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireAdmin();
    const folder = oldPath.split("/").slice(0, -1).join("/");
    if (!OLD_IMAGE.test(oldPath) || !newPath.startsWith(`${folder}/`) || !/\.webp$/i.test(newPath)) {
      throw new Error("المسار غير صالح.");
    }
    const db = createAdminClient();
    const { data: exists } = await db.storage.from(BUCKET).list(folder, { search: newPath.split("/").pop() });
    if (!exists?.some((file) => `${folder}/${file.name}` === newPath)) throw new Error("ملف WebP لم يُرفع.");

    const { error } = await db.from("student_project_images").update({ storage_path: newPath }).eq("storage_path", oldPath);
    if (error) throw error;
    const { error: coverError } = await db.from("student_projects").update({ cover_image: newPath }).eq("cover_image", oldPath);
    if (coverError) throw coverError;

    await db.from("webp_conversions").upsert(
      {
        bucket: BUCKET,
        old_path: oldPath,
        new_path: newPath,
        old_size: sizes?.oldSize ?? null,
        new_size: sizes?.newSize ?? null,
        converted_at: new Date().toISOString(),
        original_deleted_at: null,
      },
      { onConflict: "bucket,old_path" },
    );
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "تعذر تحديث الصورة." };
  }
}
