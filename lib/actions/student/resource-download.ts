"use server";

import {
  resourceDownloadFileName,
  verifyResourceDownloadToken,
} from "@/lib/lesson-resources/download-token";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export type ResourceDownloadResult =
  | { ok: true; url: string }
  | { ok: false; message: string };

/**
 * Called only when the student presses «تحميل المرفق»:
 * checks the ticket issued by the page (access already verified there),
 * then creates a 10-minute Supabase link for this one file.
 */
export async function getLessonResourceDownloadUrl(
  token: string,
): Promise<ResourceDownloadResult> {
  try {
    const ticket = verifyResourceDownloadToken(token);

    if (!ticket) {
      return {
        ok: false,
        message: "انتهت صلاحية رابط التحميل. حدّث الصفحة ثم حاول مرة أخرى.",
      };
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== ticket.userId) {
      return {
        ok: false,
        message: "سجّل الدخول بنفس الحساب لتحميل المرفق.",
      };
    }

    const admin = createAdminClient();
    const { data: resource } = await admin
      .from("lesson_resources")
      .select("id,title,file_path,is_active")
      .eq("id", ticket.resourceId)
      .maybeSingle();

    const filePath =
      typeof resource?.file_path === "string" ? resource.file_path.trim() : "";

    if (!resource || resource.is_active === false || !filePath) {
      return { ok: false, message: "هذا المرفق لم يعد متاحًا." };
    }

    const { data: signed, error } = await admin.storage
      .from("lesson-resources")
      .createSignedUrl(filePath, 10 * 60, {
        download: resourceDownloadFileName(resource.title, filePath),
      });

    if (error || !signed?.signedUrl) {
      console.error("SIGN LESSON RESOURCE ERROR", error);
      return { ok: false, message: "تعذّر تجهيز الملف، حاول مرة أخرى." };
    }

    return { ok: true, url: signed.signedUrl };
  } catch (error) {
    console.error("LESSON RESOURCE DOWNLOAD ERROR", error);
    return { ok: false, message: "تعذّر تجهيز الملف، حاول مرة أخرى." };
  }
}
