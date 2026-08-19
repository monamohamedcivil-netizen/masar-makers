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

  const certificateFileCode =
    getCertificateFileCode(
      data.certificate_type,
    );

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";

  const verificationUrl =
    `${appUrl}/certificates/verify/${data.verification_code}`;

  /*
   * الاسم النهائي الذي سيظهر على الشهادة.
   *
   * الأولوية:
   * 1) الاسم المحفوظ خصيصًا للشهادة.
   * 2) الاسم الإنجليزي للطالب.
   * 3) الاسم العادي كـ fallback للشهادات القديمة.
   */
  const certificateStudentName =
    data.student_name_on_certificate?.trim() ||
    data.student_name_en?.trim() ||
    data.student_name?.trim() ||
    "Student";

  return {
    id: data.id,

    certificateNumber:
      data.certificate_number,

    /*
     * مهم:
     * studentName هو الاسم الذي تستخدمه
     * واجهة رسم الشهادة حاليًا.
     *
     * لذلك نرسل إليها الاسم الإنجليزي النهائي
     * بدل student_name العربي.
     */
    studentName:
      certificateStudentName,

    studentNameEn:
      data.student_name_en?.trim() ||
      certificateStudentName,

    courseTitle:
      data.course_title,

    courseTitleEn:
      data.course_title_en,

    courseSlug:
      data.courses?.slug ??
      "default",

    certificateType:
      data.certificate_type,

    issueDate:
      formatCertificateDate(
        data.issue_date ??
        data.issued_at,
      ),

    verificationCode:
      data.verification_code,

    pdfUrl:
      data.pdf_url,

    previewUrl:
      data.preview_url,

    templateImage:
      `/certificates/templates/${courseCode}/${certificateFileCode}.png`,

    verificationUrl,

    qrValue:
      verificationUrl,

    metadata:
      data.metadata ?? {},
  };
}