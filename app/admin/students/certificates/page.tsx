import AdminPageHeader from "@/components/admin/layout/AdminPageHeader";
import CertificatesDashboard from "@/components/admin/students/certificates/CertificatesDashboard";

import {
  getCertificatesDashboard,
} from "@/lib/actions/admin/certificates-dashboard";

export const dynamic = "force-dynamic";

export default async function CertificatesPage() {
  const result = await getCertificatesDashboard();

  if (!result.success || !result.data) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="الشهادات"
          description="إدارة شهادات جميع الطلاب والكورسات من شاشة واحدة."
          breadcrumbs={[
            {
              label: "إدارة الطلاب",
            },
            {
              label: "الشهادات",
            },
          ]}
        />

        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center font-black text-red-700">
          {result.message}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="الشهادات"
        description="إصدار ومراجعة جميع شهادات الطلاب والكورسات من شاشة واحدة."
        breadcrumbs={[
          {
            label: "إدارة الطلاب",
          },
          {
            label: "الشهادات",
          },
        ]}
      />

      <CertificatesDashboard
        initialData={result.data}
      />
    </div>
  );
}