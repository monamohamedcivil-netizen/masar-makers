import AdminPageHeader from "@/components/admin/layout/AdminPageHeader";
import ExpensesManager from "@/components/admin/finance/ExpensesManager";
import { getFinanceData } from "@/lib/finance/queries";

export const dynamic = "force-dynamic";

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const initialTab =
    tab === "ads" || tab === "platform" || tab === "other" ? tab : "all";
  const data = await getFinanceData();

  return (
    <>
      <AdminPageHeader
        title="المصروفات"
        description="مصروفات المنصة: الاشتراكات والخدمات والإعلانات والرواتب."
      />
      <ExpensesManager
        initial={data.expenses}
        services={data.services}
        initialTab={initialTab}
      />
    </>
  );
}
