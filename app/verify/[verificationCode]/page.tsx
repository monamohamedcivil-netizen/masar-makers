import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{
    verificationCode: string;
  }>;
};

export default async function VerifyCertificatePage({
  params,
}: Props) {
  const { verificationCode } = await params;

  const supabase = await createClient();

  const { data: certificate } = await supabase
    .from("certificates")
    .select(`
      certificate_number,
      student_name,
      student_name_en,
      course_title,
      course_title_en,
      issue_date,
      status,
      verification_code
    `)
    .eq("verification_code", verificationCode)
    .maybeSingle();

  if (!certificate) {
    notFound();
  }

  const verified = certificate.status === "issued";

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-8">

      <div className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl overflow-hidden">

        <div className="bg-[#07152E] px-10 py-8 text-center">

          <h1 className="text-4xl font-black text-white">
            Masar Makers
          </h1>

          <p className="mt-3 text-slate-300">
            Certificate Verification
          </p>

        </div>

        <div className="p-10">

          <div
            className={`mb-8 rounded-xl p-5 text-center ${
              verified
                ? "bg-emerald-50 border border-emerald-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            <h2
              className={`text-3xl font-black ${
                verified
                  ? "text-emerald-700"
                  : "text-red-700"
              }`}
            >
              {verified
                ? "✅ Certificate Verified"
                : "❌ Certificate Revoked"}
            </h2>

            <p className="mt-2 text-slate-600">
              {verified
                ? "This certificate has been successfully verified."
                : "This certificate is no longer valid."}
            </p>

          </div>

          <Info
            title="Student Name"
            value={
              certificate.student_name_en ||
              certificate.student_name
            }
          />

          <Info
            title="Course"
            value={
              certificate.course_title_en ||
              certificate.course_title
            }
          />

          <Info
            title="Certificate Number"
            value={certificate.certificate_number}
          />

          <Info
            title="Issue Date"
            value={certificate.issue_date}
          />

          <Info
            title="Verification Code"
            value={certificate.verification_code}
          />

        </div>

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
    <div className="mb-5 rounded-xl border border-slate-200 p-5">

      <div className="text-sm font-bold text-slate-500">
        {title}
      </div>

      <div className="mt-2 text-lg font-black text-[#07152E] break-all">
        {value ?? "-"}
      </div>

    </div>
  );
}