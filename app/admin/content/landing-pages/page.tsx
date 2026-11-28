import { redirect } from "next/navigation";

/* انتقلت إلى صفحة «الإعلانات» (تبويب صفحات هبوط الإعلانات). */
export default function LandingPagesAdminPage() {
  redirect("/admin/content/announcements?tab=landing");
}
