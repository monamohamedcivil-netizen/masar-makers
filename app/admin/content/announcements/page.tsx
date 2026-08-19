import AdminPageHeader from "@/components/admin/layout/AdminPageHeader";
import AnnouncementsManager from "@/components/admin/announcements/AnnouncementsManager";
import { getAdminPlatformAnnouncements } from "@/lib/admin/platform-announcements";

export default async function AnnouncementsPage() {
  const announcements =
    await getAdminPlatformAnnouncements();

  return (
    <>
      <AdminPageHeader
        title="الإعلانات"
        description="إدارة إعلانات المنصة."
      />

      <AnnouncementsManager
        initialAnnouncements={announcements}
      />
    </>
  );
}