"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  ANNOUNCEMENT_EMAIL_DAILY_CAP,
  isAnnouncementEmailConfigured,
  sendAnnouncementEmails,
  type AnnouncementRecipient,
} from "@/lib/email/announcement-email";

/*
 * إرسال إعلان لكل الطلاب:
 *  1) إشعار داخل المنصة (جدولا notifications + notification_recipients).
 *  2) إيميل بتصميم Masar Makers.
 *
 * حماية من التكرار: نسجّل وقت الإرسال في platform_announcements
 * (notified_at / emailed_at) ونرفض أي إرسال ثانٍ لنفس الإعلان.
 */

type BroadcastResult = {
  success: boolean;
  message: string;
};

type Audience = Array<{
  id: string;
  email: string;
  name: string | null;
}>;

async function loadAudience(): Promise<Audience> {
  const admin = createAdminClient();
  const audience: Audience = [];
  const pageSize = 1000;

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await admin
      .from("profiles")
      .select("id,email,full_name")
      .eq("role", "student")
      .or("is_active.is.null,is_active.eq.true")
      .order("created_at", { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) {
      throw new Error(error.message);
    }

    for (const row of data ?? []) {
      audience.push({
        id: row.id as string,
        email: String(row.email ?? "").trim(),
        name: (row.full_name as string | null) ?? null,
      });
    }

    if (!data || data.length < pageSize) {
      break;
    }
  }

  return audience;
}

export async function getBroadcastAudienceCount(): Promise<{
  count: number;
  emailCap: number;
  emailConfigured: boolean;
}> {
  await requireAdmin();

  const audience = await loadAudience();

  return {
    count: audience.length,
    emailCap: ANNOUNCEMENT_EMAIL_DAILY_CAP,
    emailConfigured: isAnnouncementEmailConfigured(),
  };
}

function notificationActionUrl(href: string | null) {
  const value = href?.trim() ?? "";

  if (!value || value === "#") {
    return null;
  }

  if (value.startsWith("/") || /^https?:\/\//i.test(value)) {
    return value;
  }

  return null;
}

export async function broadcastAnnouncement(
  announcementId: string,
  options: { notify: boolean; email: boolean },
): Promise<BroadcastResult> {
  try {
    await requireAdmin();

    if (!announcementId || (!options.notify && !options.email)) {
      return { success: false, message: "لم يتم اختيار قناة إرسال." };
    }

    const admin = createAdminClient();

    const { data: announcement, error: announcementError } =
      await admin
        .from("platform_announcements")
        .select(
          "id,type,title,title_en,description,description_en,button_text,href",
        )
        .eq("id", announcementId)
        .maybeSingle();

    if (announcementError || !announcement) {
      return {
        success: false,
        message:
          announcementError?.message || "الإعلان غير موجود.",
      };
    }

    const audience = await loadAudience();

    if (audience.length === 0) {
      return { success: false, message: "لا يوجد طلاب لإرسال الإعلان إليهم." };
    }

    const messages: string[] = [];
    let anyFailed = false;

    /* ---------- 1) إشعار داخل المنصة ---------- */
    if (options.notify) {
      const { data: claimed } = await admin
        .from("platform_announcements")
        .update({ notified_at: new Date().toISOString() })
        .eq("id", announcementId)
        .is("notified_at", null)
        .select("id");

      if (!claimed || claimed.length === 0) {
        messages.push("الإشعار داخل المنصة أُرسل مسبقًا لهذا الإعلان.");
      } else {
        const { data: notification, error: notificationError } =
          await admin
            .from("notifications")
            .insert({
              title: announcement.title,
              body:
                announcement.description?.trim() ||
                announcement.title,
              type: "announcement",
              action_url: notificationActionUrl(announcement.href),
            })
            .select("id")
            .single();

        let inserted = 0;
        let recipientsError: string | null = null;

        if (!notificationError && notification) {
          const rows = audience.map((student) => ({
            notification_id: notification.id as string,
            user_id: student.id,
          }));

          for (let i = 0; i < rows.length; i += 500) {
            const { error } = await admin
              .from("notification_recipients")
              .insert(rows.slice(i, i + 500));

            if (error) {
              recipientsError = error.message;
              break;
            }

            inserted += Math.min(500, rows.length - i);
          }
        }

        if (notificationError || !notification || recipientsError) {
          anyFailed = true;

          // نسمح بإعادة المحاولة لاحقًا.
          await admin
            .from("platform_announcements")
            .update({ notified_at: null })
            .eq("id", announcementId);

          messages.push(
            `تعذر إرسال الإشعار داخل المنصة: ${
              notificationError?.message || recipientsError
            }`,
          );
        } else {
          messages.push(`تم إرسال الإشعار داخل المنصة إلى ${inserted} طالب.`);
        }
      }
    }

    /* ---------- 2) إيميل ---------- */
    const emailRecipientsCount = audience.filter((student) =>
      /^\S+@\S+\.\S+$/.test(student.email),
    ).length;

    if (options.email && !isAnnouncementEmailConfigured()) {
      anyFailed = true;
      messages.push(
        "لم يُرسل الإيميل: خدمة Brevo غير مفعّلة بعد (المفتاح BREVO_API_KEY غير مضاف في إعدادات الاستضافة).",
      );
    } else if (
      options.email &&
      emailRecipientsCount > ANNOUNCEMENT_EMAIL_DAILY_CAP
    ) {
      anyFailed = true;
      messages.push(
        `لم يُرسل الإيميل: عدد الطلاب (${emailRecipientsCount}) أكبر من الحد اليومي المسموح (${ANNOUNCEMENT_EMAIL_DAILY_CAP}).`,
      );
    } else if (options.email) {
      const { data: claimed } = await admin
        .from("platform_announcements")
        .update({ emailed_at: new Date().toISOString() })
        .eq("id", announcementId)
        .is("emailed_at", null)
        .select("id");

      if (!claimed || claimed.length === 0) {
        messages.push("الإيميل أُرسل مسبقًا لهذا الإعلان.");
      } else {
        const recipients: AnnouncementRecipient[] = audience
          .filter((student) => /^\S+@\S+\.\S+$/.test(student.email))
          .map((student) => ({
            email: student.email,
            name: student.name,
          }));

        const result = await sendAnnouncementEmails(
          {
            type: announcement.type,
            title: announcement.title,
            titleEn: announcement.title_en,
            description: announcement.description,
            descriptionEn: announcement.description_en,
            buttonText: announcement.button_text,
            href: announcement.href,
          },
          recipients,
        );

        await admin
          .from("platform_announcements")
          .update({
            email_sent_count: result.sent,
            email_failed_count: result.failed,
            // لو فشل الكل نسمح بإعادة المحاولة.
            emailed_at: result.sent === 0 ? null : undefined,
          })
          .eq("id", announcementId);

        if (result.failed > 0) {
          anyFailed = true;
          console.error(
            "ANNOUNCEMENT EMAIL ERRORS:",
            result.errors,
          );
        }

        messages.push(
          result.failed > 0
            ? `الإيميل: وصل إلى ${result.sent} وفشل ${result.failed}. (${result.errors[0] ?? ""})`
            : `تم إرسال الإيميل إلى ${result.sent} طالب.`,
        );
      }
    }

    return {
      success: !anyFailed,
      message: messages.join(" "),
    };
  } catch (error) {
    console.error("BROADCAST ANNOUNCEMENT ERROR", error);

    return {
      success: false,
      message:
        error instanceof Error && error.message === "FORBIDDEN"
          ? "ليس لديك صلاحية لإرسال الإعلانات."
          : error instanceof Error
            ? error.message
            : "تعذر إرسال الإعلان.",
    };
  }
}
