import AdminPageHeader from "@/components/admin/layout/AdminPageHeader";
import ExpensesManager from "@/components/admin/finance/ExpensesManager";
import { getFinanceData } from "@/lib/finance/queries";

export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
  const data = await getFinanceData();

  return (
    <>
      <AdminPageHeader
        title="المصروفات"
        description="مصروفات المنصة: الاشتراكات والخدمات والإعلانات والرواتب."
      />
      <ExpensesManager initial={data.expenses} services={data.services} />
    </>
  );
}
