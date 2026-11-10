"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { isAnnouncementEmailConfigured } from "@/lib/email/announcement-email";
import { INTERNAL_ACCOUNT_EMAILS } from "@/lib/admin/internal-accounts";
import {
  getRemainingDailyEmails,
  loadAudience,
} from "@/lib/admin/student-audience";
import { broadcastAnnouncementCore } from "@/lib/admin/announcement-broadcast-core";

/*
 * إرسال إعلان لكل الطلاب من لوحة الأدمن (إشعار داخل المنصة + إيميل).
 * المنطق نفسه في announcement-broadcast-core.ts (ويستخدمه أيضًا الإرسال المجدول).
 */

type BroadcastResult = {
  success: boolean;
  message: string;
};

export async function getBroadcastAudienceCount(): Promise<{
  count: number;
  teamCount: number;
  emailCap: number;
  emailConfigured: boolean;
}> {
  await requireAdmin();

  const audience = await loadAudience();
  const quota = await getRemainingDailyEmails(createAdminClient());

  const team = new Set(INTERNAL_ACCOUNT_EMAILS);

  return {
    count: audience.length,
    teamCount: audience.filter((a) => team.has(a.email.toLowerCase())).length,
    // الرصيد المتبقي اليوم (الحد اليومي ناقص ما أُرسل في آخر 24 ساعة).
    emailCap: quota.remaining,
    emailConfigured: isAnnouncementEmailConfigured(),
  };
}

export async function broadcastAnnouncement(
  announcementId: string,
  options: { notify: boolean; email: boolean },
): Promise<BroadcastResult> {
  try {
    await requireAdmin();
  } catch {
    return { success: false, message: "ليس لديك صلاحية لإرسال الإعلانات." };
  }

  return broadcastAnnouncementCore(announcementId, options);
}
