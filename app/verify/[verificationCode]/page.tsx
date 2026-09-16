import Link from "next/link";
import { notFound } from "next/navigation";

import CertificateRenderer from "@/components/certificates/CertificateRenderer";
import { getCertificateByVerificationCode } from "@/lib/certificates/get-certificate";
import { createAdminClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{
    verificationCode: string;
  }>;
};

export default async function VerifyCertificatePage({
  params,
}: Props) {
  const { verificationCode } = await params;

  const certificate =
    await getCertificateByVerificationCode(
      verificationCode,
    );

  if (!certificate) {
    notFound();
  }

  /*
   * نقرأ الحالة فقط لتحديد ما إذا كانت الشهادة
   * ما زالت سارية أم تم إلغاؤها.
   */
  const supabase = createAdminClient();

  const { data: statusRow } = await supabase
    .from("certificates")
    .select("status")
    .eq("id", certificate.id)
    .maybeSingle();

  const verified =
    statusRow?.status === "issued";

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 sm:py-10"
    >
      <div className="mx-auto w-full max-w-6xl">

        {/* أول الصفحة: رسالة التحقق + زر المنصة */}
        <section
          className={`mb-6 rounded-3xl border p-6 text-center shadow-sm sm:p-8 ${
            verified
              ? "border-emerald-200 bg-emerald-50"
              : "border-red-200 bg-red-50"
          }`}
        >
          <h1
            className={`text-2xl font-black sm:text-3xl ${
              verified
                ? "text-emerald-700"
                : "text-red-700"
            }`}
          >
            {verified
              ? "✅ شهادة موثقة من Masar Makers"
              : "❌ هذه الشهادة غير سارية"}
          </h1>

          <p className="mx-auto mt-3 max-w-3xl text-sm font-bold leading-7 text-slate-600 sm:text-base">
            {verified
              ? "تم التحقق من صحة هذه الشهادة وإصدارها من منصة Masar Makers للتعلم المهني الهندسي."
              : "تم العثور على الشهادة، ولكن حالتها الحالية ليست صادرة أو تم إلغاؤها."}
          </p>

          <Link
            href="/"
            className="mt-5 inline-flex min-h-12 items-center justify-center rounded-xl bg-[#F7B548] px-6 py-3 text-sm font-black text-[#07152E] shadow-sm transition hover:brightness-95 sm:text-base"
          >
            استكشف رحلات منصة Masar Makers
          </Link>
        </section>

        {/* الشهادة نفسها */}
        <section className="overflow-hidden rounded-2xl bg-white shadow-2xl">
          <CertificateRenderer
            certificate={certificate}
          />
        </section>

        {/* بيانات التحقق */}
        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <div className="grid gap-4 md:grid-cols-2">
            <Info
              title="اسم المتدرب"
              value={
                certificate.studentNameEn ||
                certificate.studentName
              }
            />

            <Info
              title="الكورس"
              value={
                certificate.courseTitleEn ||
                certificate.courseTitle
              }
            />

            <Info
              title="نوع الشهادة"
              value={
                certificate.certificateType ===
                "fundamental"
                  ? "Fundamentals"
                  : "Advanced"
              }
            />

            <Info
              title="رقم الشهادة"
              value={
                certificate.certificateNumber
              }
            />

            <Info
              title="تاريخ الإصدار"
              value={certificate.issueDate}
            />

            <Info
              title="كود التحقق"
              value={
                certificate.verificationCode
              }
            />
          </div>
        </section>
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
    <div className="rounded-xl border border-slate-200 p-4 sm:p-5">
      <div className="text-xs font-black text-slate-500">
        {title}
      </div>

      <div className="mt-2 break-all text-base font-black text-[#07152E] sm:text-lg">
        {value ?? "-"}
      </div>
    </div>
  );
}
