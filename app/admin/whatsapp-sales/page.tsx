import {
  MessageCircle,
} from "lucide-react";

import AdminPageHeader from "@/components/admin/layout/AdminPageHeader";
import WhatsAppSalesManager from "@/components/admin/whatsapp/WhatsAppSalesManager";
import {
  getWhatsAppSalesAdminData,
} from "@/lib/queries/whatsapp-sales";
import { getPriceTableData } from "@/lib/pricing/price-table-data";

export const dynamic =
  "force-dynamic";

export default async function WhatsAppSalesPage() {
  const [data, priceTable] = await Promise.all([
    getWhatsAppSalesAdminData(),
    getPriceTableData(),
  ]);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="قوائم الشات والأسعار"
        description="إدارة قوائم الشات والكورسات والأسعار والعروض والردود التلقائية."
        actions={
          <div className="inline-flex items-center gap-2 rounded-xl bg-[#07152E] px-4 py-3 text-sm font-black text-white">
            <MessageCircle className="h-4 w-4 text-[#F7B548]" />
            Bot V1 — بدون AI
          </div>
        }
      />

      <WhatsAppSalesManager
        {...data}
        priceTable={priceTable}
      />
    </div>
  );
}