import { Inbox } from "lucide-react";

import AdminPageHeader from "@/components/admin/layout/AdminPageHeader";
import WhatsAppInbox from "@/components/admin/whatsapp/WhatsAppInbox";
import { getInboxSnapshot } from "@/lib/actions/whatsapp-inbox";

export const dynamic = "force-dynamic";

export default async function WhatsAppInboxPage() {
  const initial = await getInboxSnapshot();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="صندوق واتساب"
        description="كل محادثات رقم صناع المسار لحظيًا: ردود العملاء والبوت وردودك، مع التحكم في تشغيل البوت لكل عميل."
        breadcrumbs={[{ label: "WhatsApp Sales", href: "/admin/whatsapp-sales" }, { label: "صندوق واتساب" }]}
        actions={
          <div className="inline-flex items-center gap-2 rounded-xl bg-[#07152E] px-4 py-3 text-sm font-black text-white">
            <Inbox className="h-4 w-4 text-[#F7B548]" />
            تحديث تلقائي كل 4 ثوانٍ
          </div>
        }
      />
      <WhatsAppInbox initial={initial} />
    </div>
  );
}
