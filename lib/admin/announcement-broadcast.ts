"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  isAnnouncementEmailConfigured,
  sendAnnouncementEmails,
  type AnnouncementRecipient,
} from "@/lib/email/announcement-email";
import { INTERNAL_ACCOUNT_EMAILS } from "@/lib/admin/internal-accounts";
import {
  getRemainingDailyEmails,
  loadAudience,
  rankByActivity,
} from "@/lib/admin/student-audience";

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
    if (options.email && !isAnnouncementEmailConfigured()) {
      anyFailed = true;
      messages.push(
        "لم يُرسل الإيميل: خدمة Brevo غير مفعّلة بعد (المفتاح BREVO_API_KEY غير مضاف في إعدادات الاستضافة).",
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
        let eligible = audience.filter((student) =>
          /^\S+@\S+\.\S+$/.test(student.email),
        );

        let skippedByCap = 0;

        // الرصيد المتبقي اليوم؛ لو لم يكفِ: الإيميل لأكثر الطلاب نشاطًا فقط.
        const quota = await getRemainingDailyEmails(admin);

        if (eligible.length > quota.remaining) {
          eligible = (await rankByActivity(admin, eligible)).slice(
            0,
            quota.remaining,
          );

          skippedByCap =
            audience.filter((student) =>
              /^\S+@\S+\.\S+$/.test(student.email),
            ).length - eligible.length;
        }

        const recipients: AnnouncementRecipient[] = eligible.map(
          (student) => ({
            email: student.email,
            name: student.name,
          }),
        );

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

        if (skippedByCap > 0) {
          messages.push(
            `بسبب الحد اليومي (المتبقي اليوم ${quota.remaining}) أُرسل الإيميل لأكثر الطلاب نشاطًا، ولم يُرسل إلى ${skippedByCap} طالب (وصلهم الإشعار داخل المنصة).`,
          );
        }
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
