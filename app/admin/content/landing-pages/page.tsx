import AdminPageHeader from "@/components/admin/layout/AdminPageHeader";
import LandingPagesList from "@/components/admin/landing/LandingPagesList";
import { countLandingLeads } from "@/lib/actions/landing-leads";
import { listLandingPages } from "@/lib/actions/landing-pages";

export const dynamic = "force-dynamic";

export default async function LandingPagesAdminPage() {
  const [pages, leads] = await Promise.all([listLandingPages(), countLandingLeads()]);

  return (
    <div>
      <AdminPageHeader
        title="صفحات هبوط الإعلانات"
        description="صفحة لكل إعلان مدفوع على الرابط masarmakers.com/lp/<الرابط>. أي صفحة جديدة تبدأ نسخة من صفحة موجودة وتعدّلي كلامها وصورها."
        breadcrumbs={[{ label: "المحتوى" }, { label: "صفحات هبوط الإعلانات" }]}
      />
      <LandingPagesList
        pages={pages.map((page) => ({
          id: page.id,
          slug: page.slug,
          title: page.title,
          status: page.status,
          leads: leads[page.id] ?? 0,
          updatedAt: page.updated_at,
        }))}
      />
    </div>
  );
}
