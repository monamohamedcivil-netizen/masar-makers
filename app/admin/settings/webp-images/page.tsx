import AdminPageHeader from "@/components/admin/layout/AdminPageHeader";
import WebpImagesTool from "@/components/admin/settings/WebpImagesTool";

export const dynamic = "force-dynamic";

export default function WebpImagesPage() {
  return (
    <div>
      <AdminPageHeader
        title="تحويل الصور إلى WebP"
        description="أداة لمرة واحدة: تحويل صور صفحات الكورسات القديمة لتقليل استهلاك Supabase."
        breadcrumbs={[{ label: "الإعدادات", href: "/admin/settings" }, { label: "تحويل الصور إلى WebP" }]}
      />
      <WebpImagesTool />
    </div>
  );
}
