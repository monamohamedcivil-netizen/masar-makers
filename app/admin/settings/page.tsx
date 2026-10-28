import Link from "next/link";
import { Bot, FileImage, ImageDown, MessageCircle } from "lucide-react";

import AdminPageHeader from "@/components/admin/layout/AdminPageHeader";

/* صفحة الإعدادات: روابط لأدوات وإعدادات المنصة. */

const tools = [
  {
    href: "/admin/settings/webp-images",
    title: "تحويل الصور إلى WebP",
    description: "تحويل صور صفحات الكورسات القديمة (PNG/JPG) إلى WebP لتقليل استهلاك Supabase. تعرض الصور المتبقية وحجمها.",
    icon: ImageDown,
  },
  {
    href: "/admin/content/landing-pages",
    title: "صفحات هبوط الإعلانات",
    description: "تعديل صفحات الإعلانات (/lp/…)، وإنشاء صفحة جديدة لإعلان جديد، ورقم الواتساب و Meta Pixel.",
    icon: FileImage,
  },
  {
    href: "/admin/web-chat",
    title: "شات المنصة",
    description: "رسائل الترحيب، أسئلة الشات، المتابعة التلقائية، وعملة كل طالب.",
    icon: Bot,
  },
  {
    href: "/admin/whatsapp-sales",
    title: "قوائم الشات والأسعار",
    description: "الكورسات والمستويات والأسعار والعروض اللي بتظهر في الشات.",
    icon: MessageCircle,
  },
];

export default function SettingsPage() {
  return (
    <>
      <AdminPageHeader title="الإعدادات" description="أدوات وإعدادات المنصة." />

      <div className="grid gap-4 md:grid-cols-2">
        {tools.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="group flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-[#F7B548] hover:shadow-sm"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#07152E] text-[#F7B548]">
              <tool.icon className="h-6 w-6" />
            </span>
            <span className="grid gap-1">
              <span className="text-base font-black text-[#07152E] group-hover:text-[#A86A12]">{tool.title}</span>
              <span className="text-sm leading-6 text-slate-500">{tool.description}</span>
            </span>
          </Link>
        ))}
      </div>
    </>
  );
}
