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
};

export default async function CertificatePage({
  params,
}: Props) {
  const { certificateId } = await params;

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
      )}`;

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
    <main className="min-h-screen bg-slate-100 py-10">
      <div className="mx-auto mb-6 max-w-6xl px-4">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-5">
  <h2 className="text-xl font-black text-emerald-700">
    ✅ Certificate Issued
  </h2>

  <p className="mt-2 text-sm text-slate-600">
    This certificate was issued by Masar Makers.
  </p>

  <CertificateDownloadButton
    certificateId={certificateId}
    certificateNumber={
      certificate.certificateNumber
    }
  />

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