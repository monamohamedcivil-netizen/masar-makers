import AdminPageHeader from "@/components/admin/layout/AdminPageHeader";
import ReportsDashboard from "@/components/admin/finance/ReportsDashboard";
import { getFinanceData } from "@/lib/finance/queries";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const data = await getFinanceData();

  return (
    <>
      <AdminPageHeader
        title="التقارير"
        description="لوحة الدخل والمصروفات والاشتراكات، وجدول متابعة الدفعات."
      />
      <ReportsDashboard data={data} />
    </>
  );
}
