import { notFound } from "next/navigation";

import CSDTemplate from "@/components/certificates/templates/CSDTemplate";
import { getCertificate } from "@/lib/certificates/get-certificate";

export const dynamic = "force-dynamic";

type PrintCertificatePageProps = {
  params: Promise<{
    certificateId: string;
  }>;
};

export default async function PrintCertificatePage({
  params,
}: PrintCertificatePageProps) {
  const { certificateId } = await params;

  const certificate = await getCertificate(certificateId);

  if (!certificate) {
    notFound();
  }

  return (
    <main className="certificate-print-page">
      <div
        id="certificate-pdf-content"
        className="certificate-print-content"
      >
        <CSDTemplate certificate={certificate} />
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            html,
            body {
              margin: 0 !important;
              padding: 0 !important;
              width: 100% !important;
              min-height: 100% !important;
              overflow: hidden !important;
              background: #ffffff !important;
            }

            * {
              box-sizing: border-box;
            }

            .certificate-print-page {
              margin: 0;
              padding: 0;
              width: 1123px;
              height: 794px;
              overflow: hidden;
              background: #ffffff;
            }

            .certificate-print-content {
              position: relative;
              width: 1123px;
              height: 794px;
              margin: 0;
              padding: 0;
              overflow: hidden;
            }

            .certificate-print-content > * {
              width: 1123px !important;
              height: 794px !important;
              max-width: none !important;
              margin: 0 !important;
              border-radius: 0 !important;
              box-shadow: none !important;
            }

            @page {
              size: 1123px 794px;
              margin: 0;
            }

            @media print {
              html,
              body {
                width: 1123px !important;
                height: 794px !important;
                margin: 0 !important;
                padding: 0 !important;
              }

              .certificate-print-page,
              .certificate-print-content {
                width: 1123px !important;
                height: 794px !important;
              }
            }
          `,
        }}
      />
    </main>
  );
}