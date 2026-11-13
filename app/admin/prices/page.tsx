import AdminPageHeader from "@/components/admin/layout/AdminPageHeader";
import PriceTable from "@/components/admin/pricing/PriceTable";
import { getPriceTableData } from "@/lib/pricing/price-table-data";

export const dynamic = "force-dynamic";

export default async function PricesPage() {
  const data = await getPriceTableData();
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="جدول الأسعار"
        description="كل أسعار الكورسات ورحلات اليوم الواحد في مكان واحد. التعديل هنا ينتقل تلقائيًا للشات والمدفوعات وباقي الجداول."
        breadcrumbs={[{ label: "لوحة التحكم", href: "/admin/dashboard" }, { label: "جدول الأسعار" }]}
      />
      <PriceTable data={data} kind="course" kindSwitch />
    </div>
  );
}
