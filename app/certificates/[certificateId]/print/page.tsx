import { notFound } from "next/navigation";

import CertificateRenderer from "@/components/certificates/CertificateRenderer";
import {
  getCertificate,
  getCertificateByVerificationCode,
} from "@/lib/certificates/get-certificate";

export const dynamic = "force-dynamic";

type PrintCertificatePageProps = {
  params: Promise<{
    certificateId: string;
  }>;

  searchParams: Promise<{
    embed?: string;
    verify?: string;
  }>;
};

export default async function PrintCertificatePage({
  params,
  searchParams,
}: PrintCertificatePageProps) {
  const { certificateId } = await params;
  const { embed, verify } = await searchParams;

  const certificate = verify
    ? await getCertificateByVerificationCode(
        verify,
      )
    : await getCertificate(certificateId);

  if (
    !certificate ||
    certificate.id !== certificateId
  ) {
    notFound();
  }

  return (
    <main className="certificate-print-page">
  <div
    id="certificate-pdf-content"
    className="certificate-print-content"
  >
   <CertificateRenderer certificate={certificate} />
  </div>
</main>
  );
}