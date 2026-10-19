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
      "id,subject,body,button_text,button_url,audience,recipient_count,sent_count,failed_count,created_at",
    )
    .order("created_at", { ascending: false })
    .limit(30);

  if (!full.error) {
    return (full.data ?? []) as EmailCampaignRow[];
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
}): Promise<CustomEmailResult> {
  try {
    const { user: adminUser } = await requireAdmin();

    const subject = input.subject?.trim() ?? "";
    const body = input.body?.trim() ?? "";

    if (!subject || !body) {
      return { success: false, message: "اكتبي عنوان الرسالة ونصها." };
    }

    if (subject.length > 150 || body.length > 8000) {
      return { success: false, message: "العنوان أو النص أطول من المسموح." };
    }

    if (!isAnnouncementEmailConfigured()) {
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
    let recipients: Array<AnnouncementRecipient & { id?: string }> = [];

    if (input.audience === "test") {
      const adminEmail = (adminUser.email ?? "").trim();

      if (!EMAIL_PATTERN.test(adminEmail)) {
        return {
          success: false,
          message: "تعذر معرفة إيميلك لإرسال التجربة.",
        };
      }

      recipients = [{ email: adminEmail, name: null }];
    } else {
      const audience = await loadAudience();

      if (input.audience === "all") {
        recipients = audience.filter((s) => EMAIL_PATTERN.test(s.email));
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

        recipients = audience.filter(
          (s) => ids.has(s.id) && EMAIL_PATTERN.test(s.email),
        );
      }

      if (recipients.length === 0) {
        return { success: false, message: "لا يوجد مستلمون صالحون." };
      }
    }

    // الحد اليومي: لو لم يكفِ نرسل لأكثر الطلاب نشاطًا فقط.
    const quota = await getRemainingDailyEmails(admin);
    let skipped = 0;

    if (quota.remaining <= 0) {
      return {
        success: false,
        message: `وصلنا للحد اليومي للإيميلات (${quota.cap}). حاولي بعد 24 ساعة من آخر إرسال.`,
      };
    }

    if (recipients.length > quota.remaining) {
      const ranked = await rankByActivity(
        admin,
        recipients.map((r, index) => ({ ...r, id: r.id ?? String(index) })),
      );

      skipped = recipients.length - quota.remaining;
      recipients = ranked.slice(0, quota.remaining);
    }

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

    // تسجيل الحملة (لو الجدول غير موجود نتجاهل الخطأ).
    const logRow = {
      subject,
      body,
      audience: input.audience,
      recipient_count: recipients.length,
      sent_count: result.sent,
      failed_count: result.failed,
      created_by: adminUser.id,
    };

    let { error: logError } = await admin
      .from("admin_email_campaigns")
      .insert({
        ...logRow,
        button_text: buttonUrl ? buttonText || null : null,
        button_url: buttonUrl || null,
      });

    if (logError) {
      // أعمدة الزر غير موجودة بعد: نسجّل بدونها.
      ({ error: logError } = await admin
        .from("admin_email_campaigns")
        .insert(logRow));
    }

    if (logError) {
      console.error("EMAIL CAMPAIGN LOG ERROR:", logError.message);
    }

    if (result.failed > 0) {
      console.error("CUSTOM EMAIL ERRORS:", result.errors);
    }

    const parts = [
      result.failed > 0
        ? `وصل الإيميل إلى ${result.sent} وفشل ${result.failed}. (${result.errors[0] ?? ""})`
        : `تم إرسال الإيميل إلى ${result.sent} مستلم.`,
    ];

    if (skipped > 0) {
      parts.push(
        `بسبب الحد اليومي لم يُرسل إلى ${skipped} (أُرسل لأكثر الطلاب نشاطًا).`,
      );
    }

    return {
      success: result.sent > 0 && result.failed === 0,
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
            : "تعذر إرسال الإيميل.",
    };
  }
}
