import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCertificate } from "@/lib/certificates/get-certificate";
import { markCertificateAsViewed } from "@/lib/actions/student/certificates";
import { createClient } from "@/lib/supabase/server";

import {
  CertificateDownloadButton,
  CertificateResponsivePreview,
} from "@/components/certificates/CertificatePublicClient";
type Props = {
  params: Promise<{
    certificateId: string;
  }>;
  searchParams: Promise<{
    lang?: string;
  }>;
};

export default async function CertificatePage({
  params,
  searchParams,
}: Props) {
  const { certificateId } = await params;
  const { lang: requestedLang } =
    await searchParams;

  const lang =
    requestedLang === "en" ? "en" : "ar";

  const isArabic = lang === "ar";

  /*
   * على الموبايل قد يفتح Gmail/Outlook الرابط داخل متصفح
   * لا توجد فيه جلسة Masar Makers. نطلب تسجيل الدخول أولًا
   * ثم نعيد الطالب تلقائيًا إلى نفس الشهادة.
   */
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const nextPath =
      `/certificates/${encodeURIComponent(
        certificateId,
      )}?lang=${lang}`;

    redirect(
      `/login?next=${encodeURIComponent(
        nextPath,
      )}`,
    );
  }

  const certificate =
    await getCertificate(certificateId);

  /*
   * بعد وجود جلسة:
   * null يعني أن الشهادة غير موجودة أو أن المستخدم
   * الحالي لا يملك صلاحية الوصول إليها.
   */
  if (!certificate) {
    notFound();
  }

  await markCertificateAsViewed(
    certificateId,
  );
  return (
    <main
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-screen bg-slate-100 py-6 sm:py-10"
    >
      <div className="mx-auto mb-3 flex max-w-6xl justify-end px-4">
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

      <div className="mx-auto mb-6 max-w-6xl px-4">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-5">
          <h2 className="text-xl font-black text-emerald-700">
            {isArabic
              ? "✅ تم إصدار الشهادة"
              : "✅ Certificate Issued"}
          </h2>

          <p className="mt-2 text-sm text-slate-600">
            {isArabic
              ? "تم إصدار هذه الشهادة من منصة Masar Makers."
              : "This certificate was issued by Masar Makers."}
          </p>

          <CertificateDownloadButton
            certificateId={certificateId}
            certificateNumber={
              certificate.certificateNumber
            }
            lang={lang}
          />

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
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
                  ? "كود التحقق"
                  : "Verification Code"
              }
              value={
                certificate.verificationCode
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
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4">
        <CertificateResponsivePreview
          certificateId={certificateId}
        />
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