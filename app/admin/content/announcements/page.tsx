import AdminPageHeader from "@/components/admin/layout/AdminPageHeader";
import AnnouncementsManager from "@/components/admin/announcements/AnnouncementsManager";
import CustomEmailComposer from "@/components/admin/announcements/CustomEmailComposer";
import { getAdminPlatformAnnouncements } from "@/lib/admin/platform-announcements";
import { listRecentEmailCampaigns } from "@/lib/admin/custom-email";

export default async function AnnouncementsPage() {
  const [announcements, campaigns] = await Promise.all([
    getAdminPlatformAnnouncements(),
    listRecentEmailCampaigns(),
  ]);

  return (
    <>
      <AdminPageHeader
        title="الإعلانات"
        description="إدارة إعلانات المنصة."
      />

      <AnnouncementsManager
        initialAnnouncements={announcements}
      />

      <CustomEmailComposer recentCampaigns={campaigns} />
    </>
  );
}
