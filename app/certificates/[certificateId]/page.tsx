import { notFound } from "next/navigation";

import CSDTemplate from "@/components/certificates/templates/CSDTemplate";
import { getCertificate } from "@/lib/certificates/get-certificate";
import { createClient } from "@/lib/supabase/server";
type Props = {
  params: Promise<{
    certificateId: string;
  }>;
};

export default async function CertificatePage({
  params,
}: Props) {
  const { certificateId } = await params;

  const certificate = await getCertificate(certificateId);
const supabase = await createClient();

await supabase
  .from("certificates")
  .update({
    is_new: false,
  })
  .eq("id", certificateId)
  .eq("is_new", true);
  if (!certificate) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-100 py-10">
      <div className="mx-auto mb-6 max-w-6xl px-4">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-5">
  <h2 className="text-xl font-black text-emerald-700">
    ✅ Certificate Issued
  </h2>

  <p className="mt-2 text-sm text-slate-600">
    This certificate was issued by Masar Makers.
  </p>

  <a
    href={`/api/certificates/${certificateId}/pdf`}
    className="mt-5 inline-flex items-center justify-center rounded-xl bg-[#07152E] px-6 py-3 text-sm font-black text-white transition hover:bg-[#0D2347]"
  >
    Download PDF
  </a>

  <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
    <Info
      title="Certificate Number"
      value={certificate.certificateNumber}
    />

    <Info
      title="Verification Code"
      value={certificate.verificationCode}
    />

    <Info
      title="Issue Date"
      value={certificate.issueDate}
    />
  </div>

        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4">
        <CSDTemplate certificate={certificate} />
      </div>
    </main>
  );
}

function Info({
  title,
  value,
}: {
  title: string;
  value: string | null;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-xs font-bold text-slate-500">
        {title}
      </p>

      <p className="mt-2 break-all text-lg font-black text-[#07152E]">
        {value || "-"}
      </p>
    </div>
  );
}