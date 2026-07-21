import AdminPageHeader from "@/components/admin/layout/AdminPageHeader";

export default function PaymentsPage() {
  return (
    <>
      <AdminPageHeader
        title="المدفوعات"
        description="إدارة عمليات الدفع."
      />

      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-20 text-center text-slate-500">
        قريباً...
      </div>
    </>
  );
}