import { notFound } from "next/navigation";

import AdminPageHeader from "@/components/admin/layout/AdminPageHeader";
import LandingPageEditor from "@/components/admin/landing/LandingPageEditor";
import LandingLeadsTable from "@/components/admin/landing/LandingLeadsTable";
import { listLandingLeads } from "@/lib/actions/landing-leads";
import { getLandingPageForAdmin } from "@/lib/actions/landing-pages";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function LandingPageEditPage({ params }: PageProps) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const page = await getLandingPageForAdmin(id);
  if (!page) notFound();

  const leads = await listLandingLeads(page.id);

  return (
    <div>
      <AdminPageHeader
        title={page.title}
        description="عدّلي أي نص أو صورة، واضغطي «حفظ». التعديل يظهر على الصفحة فورًا بعد الحفظ."
        breadcrumbs={[
          { label: "صفحات هبوط الإعلانات", href: "/admin/content/landing-pages" },
          { label: page.title },
        ]}
      />
      <LandingLeadsTable leads={leads} />
      <LandingPageEditor page={page} />
    </div>
  );
}
