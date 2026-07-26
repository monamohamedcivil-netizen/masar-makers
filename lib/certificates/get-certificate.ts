import { createClient } from "@/lib/supabase/server";

import type { CertificateViewModel } from "./types";

export async function getCertificate(
  certificateId: string,
): Promise<CertificateViewModel | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("certificates")
    .select("*")
    .eq("id", certificateId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,

    certificateNumber: data.certificate_number,

    studentName: data.student_name,

    studentNameEn: data.student_name_en,

    courseTitle: data.course_title,

    courseTitleEn: data.course_title_en,

    certificateType: data.certificate_type,

    issueDate: data.issue_date,

    verificationCode: data.verification_code,

    pdfUrl: data.pdf_url,

    previewUrl: data.preview_url,

    templateId: data.template_id,

    courseLogo: null,

    sponsorLogos: [],

    metadata: data.metadata ?? {},
  };
}