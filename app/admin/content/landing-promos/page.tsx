import { redirect } from "next/navigation";

/* انتقلت إلى صفحة «الإعلانات» (تبويب إعلانات صفحة البداية). */
export default function LandingPromosPage() {
  redirect("/admin/content/announcements?tab=promos");
}
