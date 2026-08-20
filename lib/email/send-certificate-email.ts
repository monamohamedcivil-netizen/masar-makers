import { resend } from "./resend";

type Input = {
  studentName: string;
  email: string;
  certificateId: string;
  courseTitle: string;
};

export async function sendCertificateEmail({
  studentName,
  email,
  certificateId,
  courseTitle,
}: Input) {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "https://masarmakers.com";

  const previewUrl =
    `${appUrl}/certificates/${certificateId}`;

  return resend.emails.send({
    from: "Masar Makers <certificates@masarmakers.com>",

    to: email,

    subject:
      "تم إصدار شهادتك | Masar Makers 🎓",

    html: `
      <div
        style="
          margin:0;
          padding:0;
          background:#f4f6f9;
          font-family:Arial,Tahoma,sans-serif;
        "
      >
        <div
          style="
            max-width:600px;
            margin:0 auto;
            padding:35px 20px;
          "
        >

          <div
            style="
              background:#07152E;
              border-radius:18px 18px 0 0;
              padding:28px;
              text-align:center;
            "
          >
            <h1
              style="
                margin:0;
                color:#ffffff;
                font-size:28px;
              "
            >
              Masar
              <span style="color:#F7B548;">
                Makers
              </span>
            </h1>

            <p
              style="
                margin:8px 0 0;
                color:#F7B548;
                font-size:14px;
              "
            >
              لا تتعلم كورس فقط... ابنِ مسيرتك المهنية
            </p>
          </div>

          <div
            style="
              background:#ffffff;
              padding:38px 30px;
              text-align:center;
              border:1px solid #e6e9ee;
              border-top:none;
            "
          >

            <div
              style="
                font-size:42px;
                margin-bottom:14px;
              "
            >
              🎓
            </div>

            <h2
              style="
                color:#07152E;
                margin:0 0 18px;
                font-size:24px;
              "
            >
              مبروك ${studentName}
            </h2>

            <p
              style="
                color:#475569;
                font-size:16px;
                line-height:1.9;
                margin:0 0 12px;
              "
            >
              تم إصدار شهادتك بنجاح في
            </p>

            <p
              style="
                color:#07152E;
                font-size:18px;
                font-weight:bold;
                line-height:1.8;
                margin:0 0 28px;
              "
            >
              ${courseTitle}
            </p>

            <p
              style="
                color:#475569;
                font-size:15px;
                line-height:1.9;
                margin:0 0 28px;
              "
            >
              يمكنك الآن عرض شهادتك وتحميلها من منصة
              <strong style="color:#07152E;">
                Masar Makers
              </strong>
            </p>

            <a
              href="${previewUrl}"
              style="
                display:inline-block;
                background:#F7B548;
                color:#07152E;
                text-decoration:none;
                font-size:16px;
                font-weight:bold;
                padding:14px 34px;
                border-radius:10px;
              "
            >
              عرض الشهادة
            </a>

            <p
              style="
                color:#94a3b8;
                font-size:12px;
                line-height:1.7;
                margin:30px 0 0;
              "
            >
              من صفحة الشهادة يمكنك عرضها وتحميل نسخة PDF.
            </p>

          </div>

          <div
            style="
              text-align:center;
              padding:20px;
              color:#64748b;
              font-size:12px;
            "
          >
            © Masar Makers
            <br />
            Professional Learning Journeys
          </div>

        </div>
      </div>
    `,
  });
}