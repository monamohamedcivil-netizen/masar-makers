export type CertificateViewModel = {
  id: string;

  certificateNumber: string;

  studentName: string;

  studentNameEn: string | null;

  courseTitle: string;

  courseTitleEn: string | null;

  certificateType: string;

  issueDate: string;

  verificationCode: string;

  pdfUrl: string | null;

  previewUrl: string | null;

  templateId: string | null;

  courseLogo: string | null;

  sponsorLogos: string[];

  metadata: Record<string, unknown>;
};