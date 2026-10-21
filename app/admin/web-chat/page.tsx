import { Bot } from "lucide-react";

import AdminPageHeader from "@/components/admin/layout/AdminPageHeader";
import WebChatAdmin from "@/components/admin/webchat/WebChatAdmin";
import { getWebChatAdmin } from "@/lib/actions/webchat-admin";

export const dynamic = "force-dynamic";

export default async function WebChatAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string }>;
}) {
  const data = await getWebChatAdmin();
  const { session } = await searchParams;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="شات المنصة"
        description="كل من ضغط زرًا في المنصة: بياناته، العملة الخاصة به، الأسعار التي ظهرت له، التحويل لواتساب، والمتابعة كل 3 أيام."
        breadcrumbs={[{ label: "WhatsApp Sales", href: "/admin/whatsapp-sales" }, { label: "شات المنصة" }]}
        actions={
          <div className="inline-flex items-center gap-2 rounded-xl bg-[#07152E] px-4 py-3 text-sm font-black text-white">
            <Bot className="h-4 w-4 text-[#F7B548]" />
            مساعد Masar Makers
          </div>
        }
      />
      <WebChatAdmin data={data} focusId={session ?? null} />
    </div>
  );
}
