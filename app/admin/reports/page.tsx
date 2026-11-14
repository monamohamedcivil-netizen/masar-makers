import AdminPageHeader from "@/components/admin/layout/AdminPageHeader";
import ReportsDashboard from "@/components/admin/finance/ReportsDashboard";
import { getFinanceData } from "@/lib/finance/queries";
import { getRegisteredStudentsCount } from "@/lib/queries/admin-dashboard";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const [data, registeredStudents] = await Promise.all([
    getFinanceData(),
    getRegisteredStudentsCount().catch(() => 0),
  ]);

  return (
    <>
      <AdminPageHeader
        title="التقارير"
        description="لوحة الدخل والمصروفات والاشتراكات، وجدول متابعة الدفعات."
      />
      <ReportsDashboard data={data} registeredStudents={registeredStudents} />
    </>
  );
}
