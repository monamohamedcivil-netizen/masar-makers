"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  isAnnouncementEmailConfigured,
  sendAnnouncementEmails,
  type AnnouncementRecipient,
} from "@/lib/email/announcement-email";
import {
  getRemainingDailyEmails,
  loadAudience,
  rankByActivity,
} from "@/lib/admin/student-audience";

/*
 * إيميل مخصص يكتبه الأدمن ويرسله لكل الطلاب أو لطلاب محددين (أو لنفسه كتجربة).
 * يستخدم نفس تصميم إيميلات المنصة ونفس خدمة Brevo وحدها اليومي.
 */

export type EmailPickerStudent = {
  id: string;
  name: string;
  email: string;
};

export type EmailCampaignRow = {
  id: string;
  subject: string;
  body: string;
  button_text: string | null;
  button_url: string | null;
  audience: string;
  channels?: string | null;
  recipient_count: number;
  sent_count: number;
  failed_count: number;
  created_at: string;
};

export type CustomEmailResult = {
  success: boolean;
  message: string;
};

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;
const MAX_SELECTED = 5000;

export async function listEmailPickerStudents(): Promise<
  EmailPickerStudent[]
> {
  await requireAdmin();

  const audience = await loadAudience();

  return audience
    .filter((student) => EMAIL_PATTERN.test(student.email))
    .map((student) => ({
      id: student.id,
      name: student.name?.trim() || "بدون اسم",
      email: student.email,
    }));
}

export async function listRecentEmailCampaigns(): Promise<
  EmailCampaignRow[]
> {
  await requireAdmin();

  const admin = createAdminClient();

  const full = await admin
    .from("admin_email_campaigns")
    .select(
      "id,subject,body,button_text,button_url,audience,channels,recipient_count,sent_count,failed_count,created_at",
    )
    .order("created_at", { ascending: false })
    .limit(30);

  if (!full.error) {
    return (full.data ?? []) as EmailCampaignRow[];
  }

  const noChannels = await admin
    .from("admin_email_campaigns")
    .select(
      "id,subject,body,button_text,button_url,audience,recipient_count,sent_count,failed_count,created_at",
    )
    .order("created_at", { ascending: false })
    .limit(30);

  if (!noChannels.error) {
    return (noChannels.data ?? []) as EmailCampaignRow[];
  }

  // أعمدة الزر قد لا تكون مضافة بعد: نقرأ الأعمدة الأساسية فقط.
  const { data, error } = await admin
    .from("admin_email_campaigns")
    .select(
      "id,subject,body,audience,recipient_count,sent_count,failed_count,created_at",
    )
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    return [];
  }

  return ((data ?? []) as Omit<
    EmailCampaignRow,
    "button_text" | "button_url"
  >[]).map((row) => ({
    ...row,
    button_text: null,
    button_url: null,
  }));

}

export async function getEmailQuota() {
  await requireAdmin();

  const quota = await getRemainingDailyEmails(createAdminClient());

  return {
    ...quota,
    configured: isAnnouncementEmailConfigured(),
  };
}

export async function sendCustomEmail(input: {
  subject: string;
  body: string;
  audience: "all" | "selected" | "test";
  studentIds?: string[];
  buttonText?: string;
  buttonUrl?: string;
  /** قنوات الإرسال: إيميل و/أو إشعار داخل المنصة (الافتراضي: إيميل فقط). */
  channels?: { email: boolean; notify: boolean };
}): Promise<CustomEmailResult> {
  try {
    const { user: adminUser } = await requireAdmin();

    const wantEmail = input.channels ? input.channels.email : true;
    const wantNotify = input.channels ? input.channels.notify : false;

    if (!wantEmail && !wantNotify) {
      return { success: false, message: "اختاري قناة إرسال واحدة على الأقل (إيميل أو إشعار)." };
    }

    const subject = input.subject?.trim() ?? "";
    const body = input.body?.trim() ?? "";

    if (!subject || !body) {
      return { success: false, message: "اكتبي عنوان الرسالة ونصها." };
    }

    if (subject.length > 150 || body.length > 8000) {
      return { success: false, message: "العنوان أو النص أطول من المسموح." };
    }

    const emailConfigured = isAnnouncementEmailConfigured();

    if (wantEmail && !wantNotify && !emailConfigured) {
      return {
        success: false,
        message:
          "خدمة Brevo غير مفعّلة بعد (المفتاح BREVO_API_KEY غير مضاف في إعدادات الاستضافة).",
      };
    }

    const buttonUrl = input.buttonUrl?.trim() ?? "";
    const buttonText = input.buttonText?.trim() ?? "";

    if (
      buttonUrl &&
      !(buttonUrl.startsWith("/") || /^https?:\/\//i.test(buttonUrl))
    ) {
      return {
        success: false,
        message: "رابط الزر يجب أن يبدأ بـ https:// أو بـ /",
      };
    }

    const admin = createAdminClient();

    // المستهدفون (قبل أي تصفية حسب القناة).
    let targets: Array<AnnouncementRecipient & { id: string }> = [];

    if (input.audience === "test") {
      const adminEmail = (adminUser.email ?? "").trim();

      if (wantEmail && !EMAIL_PATTERN.test(adminEmail)) {
        return {
          success: false,
          message: "تعذر معرفة إيميلك لإرسال التجربة.",
        };
      }

      targets = [{ id: adminUser.id, email: adminEmail, name: null }];
    } else {
      const audience = await loadAudience();

      if (input.audience === "all") {
        targets = audience;
      } else {
        const ids = new Set((input.studentIds ?? []).slice(0, MAX_SELECTED + 1));

        if (ids.size === 0) {
          return { success: false, message: "اختاري طالبًا واحدًا على الأقل." };
        }

        if (ids.size > MAX_SELECTED) {
          return {
            success: false,
            message: `عدد المختارين أكبر من المسموح (${MAX_SELECTED}).`,
          };
        }

        targets = audience.filter((s) => ids.has(s.id));
      }

      if (targets.length === 0) {
        return { success: false, message: "لا يوجد مستلمون صالحون." };
      }
    }

    const parts: string[] = [];
    let anyFailed = false;
    let anySuccess = false;
    let notifiedCount = 0;

    /* ---------- إشعار داخل المنصة ---------- */
    if (wantNotify) {
      const { data: notification, error: notificationError } = await admin
        .from("notifications")
        .insert({
          title: subject,
          body,
          type: "announcement",
          action_url: buttonUrl || null,
        })
        .select("id")
        .single();

      let recipientsError: string | null = null;

      if (!notificationError && notification) {
        const rows = targets.map((t) => ({
          notification_id: notification.id as string,
          user_id: t.id,
        }));

        for (let i = 0; i < rows.length; i += 500) {
          const { error } = await admin
            .from("notification_recipients")
            .insert(rows.slice(i, i + 500));

          if (error) {
            recipientsError = error.message;
            break;
          }

          notifiedCount += Math.min(500, rows.length - i);
        }
      }

      if (notificationError || !notification || recipientsError) {
        anyFailed = true;
        parts.push(
          `تعذر إرسال الإشعار داخل المنصة: ${
            notificationError?.message || recipientsError
          }`,
        );
      } else {
        anySuccess = true;
        parts.push(`تم إرسال الإشعار داخل المنصة إلى ${notifiedCount} مستلم.`);
      }
    }

    /* ---------- إيميل ---------- */
    let emailSent = 0;
    let emailFailed = 0;
    let emailRecipientCount = 0;

    if (wantEmail && !emailConfigured) {
      anyFailed = true;
      parts.push("لم يُرسل الإيميل: خدمة Brevo غير مفعّلة بعد.");
    } else if (wantEmail) {
      let recipients = targets.filter((t) => EMAIL_PATTERN.test(t.email));

      if (recipients.length === 0) {
        anyFailed = true;
        parts.push("لم يُرسل الإيميل: لا توجد إيميلات صالحة.");
      } else {
        const quota = await getRemainingDailyEmails(admin);
        let skipped = 0;

        if (quota.remaining <= 0) {
          anyFailed = true;
          parts.push(
            `لم يُرسل الإيميل: وصلنا للحد اليومي (${quota.cap}). حاولي بعد 24 ساعة من آخر إرسال.`,
          );
          recipients = [];
        } else if (recipients.length > quota.remaining) {
          const ranked = await rankByActivity(admin, recipients);

          skipped = recipients.length - quota.remaining;
          recipients = ranked.slice(0, quota.remaining);
        }

        if (recipients.length > 0) {
          const result = await sendAnnouncementEmails(
            {
              type: "news",
              title: subject,
              description: body,
              subject,
              showButton: Boolean(buttonUrl),
              buttonText: buttonText || "فتح الرابط",
              href: buttonUrl || null,
            },
            recipients.map((r) => ({ email: r.email, name: r.name })),
          );

          emailSent = result.sent;
          emailFailed = result.failed;
          emailRecipientCount = recipients.length;

          if (result.failed > 0) {
            console.error("CUSTOM EMAIL ERRORS:", result.errors);
            anyFailed = true;
          }

          if (result.sent > 0) anySuccess = true;

          parts.push(
            result.failed > 0
              ? `وصل الإيميل إلى ${result.sent} وفشل ${result.failed}. (${result.errors[0] ?? ""})`
              : `تم إرسال الإيميل إلى ${result.sent} مستلم.`,
          );

          if (skipped > 0) {
            parts.push(
              `بسبب الحد اليومي لم يُرسل الإيميل إلى ${skipped} (أُرسل لأكثر الطلاب نشاطًا).`,
            );
          }
        }
      }
    }

    // تسجيل الرسالة في السجل (لو الأعمدة الجديدة غير موجودة نسجّل بدونها).
    if (anySuccess) {
      const channelsValue =
        wantEmail && wantNotify ? "both" : wantNotify ? "notify" : "email";

      const logRow = {
        subject,
        body,
        audience: input.audience,
        recipient_count: wantEmail ? emailRecipientCount : notifiedCount,
        sent_count: wantEmail ? emailSent : notifiedCount,
        failed_count: wantEmail ? emailFailed : 0,
        created_by: adminUser.id,
      };

      const buttonFields = {
        button_text: buttonUrl ? buttonText || null : null,
        button_url: buttonUrl || null,
      };

      const attempts = [
        { ...logRow, ...buttonFields, channels: channelsValue },
        { ...logRow, ...buttonFields },
        logRow,
      ];

      let logError: { message: string } | null = null;

      for (const row of attempts) {
        const { error } = await admin
          .from("admin_email_campaigns")
          .insert(row);

        logError = error;

        if (!error) break;
      }

      if (logError) {
        console.error("EMAIL CAMPAIGN LOG ERROR:", logError.message);
      }
    }

    return {
      success: anySuccess && !anyFailed,
      message: parts.join(" "),
    };
  } catch (error) {
    console.error("SEND CUSTOM EMAIL ERROR", error);

    return {
      success: false,
      message:
        error instanceof Error && error.message === "FORBIDDEN"
          ? "ليس لديك صلاحية."
          : error instanceof Error
            ? error.message
            : "تعذر إرسال الرسالة.",
    };
  }
}
