import AdminPageHeader from "@/components/admin/layout/AdminPageHeader";
import ExcelImportPanel from "@/components/admin/finance/ExcelImportPanel";
import PaymentsManager from "@/components/admin/finance/PaymentsManager";
import { getFinanceData } from "@/lib/finance/queries";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const data = await getFinanceData();

  return (
    <>
      <AdminPageHeader
        title="المدفوعات"
        description="اشتراكات الطلاب والمبالغ المدفوعة والعروض، مقسّمة حسب المسار والكورس."
      />

      <div className="space-y-5">
        <ExcelImportPanel />
        <PaymentsManager
          paths={data.paths}
          payments={data.payments}
          offers={data.offers}
          priceItems={data.priceItems}
          rates={data.rates}
          otherIncome={data.otherIncome}
        />
      </div>
    </>
  );
}
