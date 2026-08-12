import { createClient } from "@/lib/supabase/server";

import type { CertificateViewModel } from "./types";

function getCertificateFileCode(
  certificateType: string | null | undefined,
) {
  return certificateType === "fundamental" ? "F" : "A";
}

function formatCertificateDate(
  value: string | null | undefined,
) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

export async function getCertificate(
  certificateId: string,
): Promise<CertificateViewModel | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("certificates")
    .select(`
      *,
      courses(
        slug,
        course_code
      )
    `)
    .eq("id", certificateId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const courseCode =
    data.courses?.course_code?.trim().toLowerCase() ||
    data.courses?.slug?.trim().toLowerCase() ||
    "default";

  const certificateFileCode = getCertificateFileCode(
    data.certificate_type,
  );

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";

  const verificationUrl =
  `${appUrl}/certificates/verify/${data.verification_code}`;

  return {
    id: data.id,

    certificateNumber: data.certificate_number,

    studentName: data.student_name,

    studentNameEn: data.student_name_en,

    courseTitle: data.course_title,

    courseTitleEn: data.course_title_en,

    courseSlug: data.courses?.slug ?? "default",

    certificateType: data.certificate_type,

    issueDate: formatCertificateDate(
      data.issue_date ?? data.issued_at,
    ),

    verificationCode: data.verification_code,

    pdfUrl: data.pdf_url,

    previewUrl: data.preview_url,

    templateImage:
      `/certificates/templates/${courseCode}/${certificateFileCode}.png`,

    verificationUrl,

    qrValue: verificationUrl,

    metadata: data.metadata ?? {},
  };
}