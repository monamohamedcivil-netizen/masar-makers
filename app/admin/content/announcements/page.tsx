import AdminPageHeader from "@/components/admin/layout/AdminPageHeader";
import AnnouncementsManager from "@/components/admin/announcements/AnnouncementsManager";
import CustomEmailComposer from "@/components/admin/announcements/CustomEmailComposer";
import { getAdminPlatformAnnouncements } from "@/lib/admin/platform-announcements";
import { listRecentEmailCampaigns } from "@/lib/admin/custom-email";
import { buildPageOptions } from "@/lib/links/destinations";
import { createAdminClient } from "@/lib/supabase/server";

type Row = Record<string, unknown>;

const text = (value: unknown) => String(value ?? "").trim();

export default async function AnnouncementsPage() {
  const db = createAdminClient();

  const [announcements, campaigns, stationsResult, pathsResult] = await Promise.all([
    getAdminPlatformAnnouncements(),
    listRecentEmailCampaigns(),
    db.from("course_stations").select("slug,title,short_title,display_order").order("display_order"),
    db.from("career_paths").select("slug,title,title_ar,display_order").order("display_order"),
  ]);

  // قائمة الصفحات في «وجهة الزر»: كورسات (محطات) ومسارات مهنية، بالإضافة للصفحات الثابتة.
  const pageOptions = buildPageOptions({
    courses: ((stationsResult.data ?? []) as Row[])
      .filter((row) => text(row.slug))
      .map((row) => ({ slug: text(row.slug), title: text(row.short_title) || text(row.title) || text(row.slug) })),
    careerPaths: ((pathsResult.data ?? []) as Row[])
      .filter((row) => text(row.slug))
      .map((row) => ({ slug: text(row.slug), title: text(row.title_ar) || text(row.title) || text(row.slug) })),
  });

  return (
    <>
      <AdminPageHeader
        title="الإعلانات"
        description="إدارة إعلانات المنصة."
      />

      <AnnouncementsManager
        initialAnnouncements={announcements}
        pageOptions={pageOptions}
      />

      <CustomEmailComposer recentCampaigns={campaigns} />
    </>
  );
}
