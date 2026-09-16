import Link from "next/link";
import { notFound } from "next/navigation";

import { CertificateResponsivePreview } from "@/components/certificates/CertificatePublicClient";
import { getCertificateByVerificationCode } from "@/lib/certificates/get-certificate";
import { createAdminClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{
    verificationCode: string;
  }>;
  searchParams: Promise<{
    lang?: string;
  }>;
};

export default async function VerifyCertificatePage({
  params,
  searchParams,
}: Props) {
  const { verificationCode } = await params;
  const { lang: requestedLang } =
    await searchParams;

  const lang =
    requestedLang === "en" ? "en" : "ar";

  const isArabic = lang === "ar";

  const certificate =
    await getCertificateByVerificationCode(
      verificationCode,
    );

  if (!certificate) {
    notFound();
  }

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
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 sm:py-10"
    >
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-3 flex justify-end">
          <div className="inline-flex overflow-hidden rounded-lg border border-slate-200 bg-white text-xs font-black shadow-sm">
            <Link
              href={`?lang=ar`}
              className={`px-3 py-2 transition ${
                isArabic
                  ? "bg-[#07152E] text-white"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              عربي
            </Link>

            <Link
              href={`?lang=en`}
              className={`px-3 py-2 transition ${
                !isArabic
                  ? "bg-[#07152E] text-white"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              English
            </Link>
          </div>
        </div>

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
              ? isArabic
                ? "✅ شهادة موثقة من Masar Makers"
                : "✅ Verified Certificate from Masar Makers"
              : isArabic
                ? "❌ هذه الشهادة غير سارية"
                : "❌ This Certificate Is Not Valid"}
          </h1>

          <p className="mx-auto mt-3 max-w-3xl text-sm font-bold leading-7 text-slate-600 sm:text-base">
            {verified
              ? isArabic
                ? "تم التحقق من صحة هذه الشهادة وإصدارها من منصة Masar Makers للتعلم المهني الهندسي."
                : "This certificate has been verified and was issued by Masar Makers for professional engineering learning."
              : isArabic
                ? "تم العثور على الشهادة، ولكن حالتها الحالية ليست صادرة أو تم إلغاؤها."
                : "The certificate was found, but it is no longer issued or has been revoked."}
          </p>

          <Link
            href="/"
            className="mt-5 inline-flex min-h-12 items-center justify-center rounded-xl bg-[#F7B548] px-6 py-3 text-sm font-black text-[#07152E] shadow-sm transition hover:brightness-95 sm:text-base"
          >
            {isArabic
              ? "استكشف رحلات منصة Masar Makers"
              : "Explore Masar Makers Journeys"}
          </Link>
        </section>

        <section className="overflow-hidden rounded-2xl">
          <CertificateResponsivePreview
            certificateId={certificate.id}
            verificationCode={
              certificate.verificationCode
            }
          />
        </section>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <div className="grid gap-4 md:grid-cols-2">
            <Info
              title={
                isArabic
                  ? "اسم المتدرب"
                  : "Student Name"
              }
              value={
                certificate.studentNameEn ||
                certificate.studentName
              }
            />

            <Info
              title={
                isArabic
                  ? "الكورس"
                  : "Course"
              }
              value={
                isArabic
                  ? certificate.courseTitle ||
                    certificate.courseTitleEn
                  : certificate.courseTitleEn ||
                    certificate.courseTitle
              }
            />

            <Info
              title={
                isArabic
                  ? "نوع الشهادة"
                  : "Certificate Type"
              }
              value={
                certificate.certificateType ===
                "fundamental"
                  ? isArabic
                    ? "الأساسيات"
                    : "Fundamentals"
                  : isArabic
                    ? "المتقدم"
                    : "Advanced"
              }
            />

            <Info
              title={
                isArabic
                  ? "رقم الشهادة"
                  : "Certificate Number"
              }
              value={
                certificate.certificateNumber
              }
            />

            <Info
              title={
                isArabic
                  ? "تاريخ الإصدار"
                  : "Issue Date"
              }
              value={certificate.issueDate}
            />

            <Info
              title={
                isArabic
                  ? "كود التحقق"
                  : "Verification Code"
              }
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