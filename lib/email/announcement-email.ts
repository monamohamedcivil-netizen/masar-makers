/*
 * إيميل الإعلانات لكل الطلاب — بنفس تصميم إيميل الشهادات
 * (هيدر كحلي، بطاقة بيضاء، زر ذهبي، فوتر).
 *
 * الإرسال عبر Brevo (باقة مجانية) وليس Resend، حتى لا تستهلك الإعلانات
 * حصة إيميلات التفعيل والشهادات. لا يوجد أي رجوع تلقائي إلى Resend.
 */

export type AnnouncementEmailInput = {
  type: string;
  title: string;
  titleEn?: string | null;
  description?: string | null;
  descriptionEn?: string | null;
  buttonText?: string | null;
  href?: string | null;
};

export type AnnouncementRecipient = {
  email: string;
  name?: string | null;
};

const FROM = "Masar Makers <notifications@masarmakers.com>";

const TYPE_EMOJI: Record<string, string> = {
  offer: "🎁",
  course: "🚀",
  news: "📢",
  achievement: "🏆",
  alert: "⚠️",
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function multiline(value: string) {
  return escapeHtml(value).replace(/\r?\n/g, "<br />");
}

export function getAppUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "https://masarmakers.com"
  );
}

/** يحوّل رابط الإعلان إلى رابط كامل صالح للإيميل. */
export function resolveAnnouncementUrl(href?: string | null) {
  const value = href?.trim() ?? "";
  const appUrl = getAppUrl();

  if (!value || value === "#") {
    return appUrl;
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  if (value.startsWith("/")) {
    return `${appUrl}${value}`;
  }

  return appUrl;
}

export function buildAnnouncementEmailHtml(
  announcement: AnnouncementEmailInput,
  studentName?: string | null,
) {
  const emoji = TYPE_EMOJI[announcement.type] ?? "📢";
  const url = escapeHtml(resolveAnnouncementUrl(announcement.href));
  const name = studentName?.trim();

  const greeting = name
    ? `أهلًا ${escapeHtml(name)}`
    : "أهلًا بك في Masar Makers";

  const description = announcement.description?.trim()
    ? `<p style="color:#475569;font-size:16px;line-height:1.9;margin:0 0 24px;">${multiline(
        announcement.description.trim(),
      )}</p>`
    : "";

  const english =
    announcement.titleEn?.trim() || announcement.descriptionEn?.trim()
      ? `<div dir="ltr" style="border-top:1px solid #e6e9ee;margin:8px 0 26px;padding-top:20px;color:#64748b;font-size:14px;line-height:1.8;text-align:center;">
          ${
            announcement.titleEn?.trim()
              ? `<p style="margin:0 0 6px;font-weight:bold;color:#07152E;">${escapeHtml(
                  announcement.titleEn.trim(),
                )}</p>`
              : ""
          }
          ${
            announcement.descriptionEn?.trim()
              ? `<p style="margin:0;">${multiline(
                  announcement.descriptionEn.trim(),
                )}</p>`
              : ""
          }
        </div>`
      : "";

  const buttonText = escapeHtml(
    announcement.buttonText?.trim() || "التفاصيل",
  );

  return `
    <div dir="rtl" style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,Tahoma,sans-serif;">
      <div style="max-width:600px;margin:0 auto;padding:35px 20px;">

        <div style="background:#07152E;border-radius:18px 18px 0 0;padding:28px;text-align:center;">
          <img src="${getAppUrl()}/images/branding/masar-makers-email-logo.png" alt="Masar Makers" width="84" height="84" style="display:block;margin:0 auto 12px;width:84px;height:auto;border:0;" />
          <h1 style="margin:0;color:#ffffff;font-size:28px;">
            Masar <span style="color:#F7B548;">Makers</span>
          </h1>
          <p style="margin:8px 0 0;color:#F7B548;font-size:14px;">
            لا تتعلم كورس فقط... ابنِ مسيرتك المهنية
          </p>
        </div>

        <div style="background:#ffffff;padding:38px 30px;text-align:center;border:1px solid #e6e9ee;border-top:none;">
          <div style="font-size:42px;margin-bottom:14px;">${emoji}</div>

          <p style="color:#64748b;font-size:15px;margin:0 0 10px;">${greeting}</p>

          <h2 style="color:#07152E;margin:0 0 18px;font-size:24px;line-height:1.6;">
            ${escapeHtml(announcement.title)}
          </h2>

          ${description}
          ${english}

          <a href="${url}" style="display:inline-block;background:#F7B548;color:#07152E;text-decoration:none;font-size:16px;font-weight:bold;padding:14px 34px;border-radius:10px;">
            ${buttonText}
          </a>
        </div>

        <div style="text-align:center;padding:20px;color:#64748b;font-size:12px;">
          © Masar Makers<br />
          Professional Learning Journeys
        </div>

      </div>
    </div>
  `;
}

const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";
const CONCURRENCY = 5;

/** الحد اليومي لباقة Brevo المجانية (300) مع هامش أمان. يمكن تغييره من إعدادات الاستضافة. */
export const ANNOUNCEMENT_EMAIL_DAILY_CAP =
  Number(process.env.ANNOUNCEMENT_EMAIL_DAILY_CAP) || 280;

export function isAnnouncementEmailConfigured() {
  return Boolean(process.env.BREVO_API_KEY?.trim());
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getSender() {
  const match = FROM.match(/^(.*)<(.+)>$/);

  return {
    name: match?.[1]?.trim() || "Masar Makers",
    email:
      process.env.ANNOUNCEMENT_EMAIL_FROM?.trim() ||
      match?.[2]?.trim() ||
      "notifications@masarmakers.com",
  };
}

async function sendOne(
  apiKey: string,
  subject: string,
  recipient: AnnouncementRecipient,
  htmlContent: string,
): Promise<{ ok: boolean; error?: string }> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(BREVO_ENDPOINT, {
        method: "POST",
        headers: {
          accept: "application/json",
          "api-key": apiKey,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          sender: getSender(),
          to: [
            recipient.name?.trim()
              ? { email: recipient.email, name: recipient.name.trim() }
              : { email: recipient.email },
          ],
          subject,
          htmlContent,
        }),
      });

      if (response.ok) {
        return { ok: true };
      }

      // ضغط مؤقت أو عطل عابر: نعيد المحاولة بعد انتظار قصير.
      if (response.status === 429 || response.status >= 500) {
        await sleep(1000 * (attempt + 1));
        continue;
      }

      const detail = await response.text().catch(() => "");

      return {
        ok: false,
        error: `${response.status} ${detail.slice(0, 200)}`,
      };
    } catch (error) {
      if (attempt === 2) {
        return {
          ok: false,
          error:
            error instanceof Error ? error.message : "NETWORK_ERROR",
        };
      }

      await sleep(1000 * (attempt + 1));
    }
  }

  return { ok: false, error: "RETRY_EXHAUSTED" };
}

/**
 * يرسل الإعلان لكل المستلمين عبر Brevo، كل مستلم برسالة منفصلة باسمه،
 * بخمس طلبات متوازية كحد أقصى.
 */
export async function sendAnnouncementEmails(
  announcement: AnnouncementEmailInput,
  recipients: AnnouncementRecipient[],
) {
  const apiKey = process.env.BREVO_API_KEY?.trim();

  if (!apiKey) {
    return {
      sent: 0,
      failed: recipients.length,
      errors: ["BREVO_API_KEY غير مضاف."],
    };
  }

  const subject = `${TYPE_EMOJI[announcement.type] ?? "📢"} ${announcement.title} | Masar Makers`;

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];
  let cursor = 0;

  async function worker() {
    while (cursor < recipients.length) {
      const recipient = recipients[cursor];
      cursor += 1;

      const result = await sendOne(
        apiKey!,
        subject,
        recipient,
        buildAnnouncementEmailHtml(announcement, recipient.name),
      );

      if (result.ok) {
        sent += 1;
      } else {
        failed += 1;

        if (errors.length < 3 && result.error) {
          errors.push(result.error);
        }
      }
    }
  }

  await Promise.all(
    Array.from(
      { length: Math.min(CONCURRENCY, recipients.length) },
      () => worker(),
    ),
  );

  return { sent, failed, errors };
}
