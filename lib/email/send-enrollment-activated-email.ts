import { resend } from "./resend";

/*
 * إيميل تهنئة عند تفعيل الاشتراك في رحلة (يُرسل مرة واحدة عند اعتماد الأدمن).
 * يُرسل عبر Resend مع إيميلات التفعيل والشهادات (وليس Brevo الخاص بالإعلانات).
 */

type Input = {
  email: string;
  studentName?: string | null;
  journeyType?: string | null;
  journeyTitle?: string | null;
  courseTitle?: string | null;
  stationTitle?: string | null;
  actionTitle?: string | null;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function journeyLabel(input: Input) {
  const custom = input.journeyTitle?.trim();
  if (custom) return custom;

  switch ((input.journeyType ?? "").trim().toLowerCase()) {
    case "fundamental":
    case "fundamentals":
      return "رحلة الأساسيات";
    case "advanced":
      return "الرحلة المتقدمة";
    case "integrated":
    case "professional":
    case "career_path":
      return "رحلة الاحتراف المتكاملة";
    case "workshop":
      return "رحلة اليوم الواحد";
    case "free":
      return "الرحلة المجانية";
    default:
      return input.actionTitle?.trim() || "الرحلة التعليمية";
  }
}

function dashboardPath(journeyType?: string | null) {
  switch ((journeyType ?? "").trim().toLowerCase()) {
    case "workshop":
      return "/dashboard?panel=one-day";
    case "free":
      return "/dashboard?panel=free";
    default:
      return "/dashboard?panel=career";
  }
}

export async function sendEnrollmentActivatedEmail(input: Input) {
  const email = input.email?.trim();

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return { skipped: true as const };
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "https://masarmakers.com";

  const buttonUrl = `${appUrl}${dashboardPath(input.journeyType)}`;
  const journey = journeyLabel(input);
  const program =
    input.courseTitle?.trim() || input.stationTitle?.trim() || "";

  const name = input.studentName?.trim() || "شريك النجاح";
  const headline = program
    ? `مبروك! تم تفعيل ${journey} في برنامج ${program}`
    : `مبروك! تم تفعيل ${journey}`;

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,Tahoma,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:35px 20px;">
    <div style="background:#07152E;border-radius:18px 18px 0 0;padding:28px;text-align:center;">
      <h1 style="margin:0;color:#ffffff;font-size:26px;">صناع <span style="color:#F7B548;">المسار</span></h1>
      <p style="margin:6px 0 0;color:#F7B548;font-size:13px;letter-spacing:1px;">Masar Makers</p>
    </div>
    <div style="background:#ffffff;border-radius:0 0 18px 18px;padding:34px 28px;text-align:center;border:1px solid #e5e9f0;border-top:0;">
      <div style="font-size:44px;line-height:1;">🎉</div>
      <p style="margin:14px 0 4px;color:#64748b;font-size:14px;">أهلًا ${escapeHtml(name)}،</p>
      <h2 style="margin:0 0 14px;color:#07152E;font-size:22px;line-height:1.6;">${escapeHtml(headline)}</h2>
      <p style="margin:0 0 26px;color:#475569;font-size:15px;line-height:1.9;">
        تم اعتماد اشتراكك ويمكنك الآن الدخول إلى المنصة وبدء رحلتك التعليمية.
      </p>
      <a href="${escapeHtml(buttonUrl)}" style="display:inline-block;background:#F7B548;color:#07152E;text-decoration:none;font-weight:bold;font-size:16px;padding:14px 38px;border-radius:999px;">
        ابدأ الرحلة
      </a>
      <p style="margin:26px 0 0;color:#94a3b8;font-size:12px;line-height:1.8;">
        رحلتك تبدأ بخطوة... وما بعدها نصنعه معًا.
      </p>
    </div>
  </div>
</body>
</html>`;

  return resend.emails.send({
    from: "Masar Makers <notifications@masarmakers.com>",
    to: email,
    subject: program
      ? `مبروك! تم تفعيل رحلتك في ${program} 🎉`
      : "مبروك! تم تفعيل رحلتك 🎉",
    html,
  });
}
