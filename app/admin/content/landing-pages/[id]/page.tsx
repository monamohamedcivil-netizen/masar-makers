import { notFound } from "next/navigation";

import AdminPageHeader from "@/components/admin/layout/AdminPageHeader";
import LandingPageEditor from "@/components/admin/landing/LandingPageEditor";
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
      <LandingPageEditor page={page} />
    </div>
  );
}
