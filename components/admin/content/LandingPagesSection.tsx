import LandingPagesList from "@/components/admin/landing/LandingPagesList";
import { countLandingLeads } from "@/lib/actions/landing-leads";
import { listLandingPages } from "@/lib/actions/landing-pages";

export default async function LandingPagesSection() {
  const [pages, leads] = await Promise.all([listLandingPages(), countLandingLeads()]);

  return (
    <div>
      <p className="mb-4 text-sm font-bold text-slate-500">صفحة لكل إعلان مدفوع على الرابط masarmakers.com/lp/&lt;الرابط&gt;. أي صفحة جديدة تبدأ نسخة من صفحة موجودة وتعدّلي كلامها وصورها.</p>
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
