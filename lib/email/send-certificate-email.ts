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
  const previewUrl =
    `${process.env.NEXT_PUBLIC_APP_URL}/certificates/${certificateId}`;

  const pdfUrl =
    `${process.env.NEXT_PUBLIC_APP_URL}/api/certificates/${certificateId}/pdf`;

  return resend.emails.send({
    from: "Masar Makers <certificates@masarmakers.com>",

    to: email,

    subject: "Your Certificate is Ready 🎉",

    html: `
      <div style="font-family:Arial;padding:30px">

      <h2>Congratulations ${studentName}</h2>

      <p>

      Your certificate for

      <strong>${courseTitle}</strong>

      has been issued successfully.

      </p>

      <p>

      <a href="${previewUrl}">
      View Certificate
      </a>

      </p>

      <p>

      <a href="${pdfUrl}">
      Download PDF
      </a>

      </p>

      <br/>

      <p>

      Masar Makers Team

      </p>

      </div>
    `,
  });
}