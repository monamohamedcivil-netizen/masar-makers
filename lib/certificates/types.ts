export type CertificateViewModel = {
  id: string;

  certificateNumber: string;

  studentName: string;

  studentNameEn: string | null;

  courseTitle: string;

  courseTitleEn: string | null;

  courseSlug: string;

  certificateType:
    | "fundamental"
    | "advanced"
    | "integrated";

  issueDate: string;

  verificationCode: string;

  templateImage: string;

  verificationUrl: string;

  qrValue: string;

  pdfUrl: string | null;

  previewUrl: string | null;

  metadata: Record<string, unknown>;
};