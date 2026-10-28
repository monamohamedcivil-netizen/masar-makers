import Link from "next/link";
import {
  BookOpen,
  Bot,
  CircleDollarSign,
  ClipboardList,
  FileImage,
  Gift,
  ImageDown,
  Megaphone,
  MessageCircle,
  Receipt,
  Video,
} from "lucide-react";

import AdminPageHeader from "@/components/admin/layout/AdminPageHeader";

/* صفحة الإعدادات: اختصارات لأدوات المنصة في 4 صفوف (ترتيب منى 28/10). */

type Tool = {
  href: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
};

const rows: { title: string; tools: Tool[] }[] = [
  {
    title: "الاشتراكات والمالية",
    tools: [
      { href: "/admin/students/enrollment-requests", title: "طلبات الاشتراك", description: "مراجعة طلبات الاشتراك الجديدة وتفعيلها.", icon: ClipboardList },
      { href: "/admin/finance/payments", title: "المدفوعات", description: "الدفعات والتحصيل والمتابعات.", icon: CircleDollarSign },
      { href: "/admin/finance/expenses", title: "المصروفات", description: "مصروفات المنصة وتصنيفاتها.", icon: Receipt },
    ],
  },
  {
    title: "الشات",
    tools: [
      { href: "/admin/web-chat", title: "شات المنصة", description: "رسائل الترحيب، أسئلة الشات، المتابعة التلقائية، وعملة كل طالب.", icon: Bot },
      { href: "/admin/whatsapp-sales", title: "قوائم الشات والأسعار", description: "الكورسات والمستويات والأسعار والعروض اللي بتظهر في الشات.", icon: MessageCircle },
      { href: "/admin/students/enrollment-requests", title: "طلبات الاشتراك", description: "الطلبات اللي بتوصل من الشات وصفحات الحجز.", icon: ClipboardList },
    ],
  },
  {
    title: "المحتوى والصور",
    tools: [
      { href: "/admin/content/monthly-draw", title: "السحب الشهري", description: "إعدادات السحب والفائزين.", icon: Gift },
      { href: "/admin/learning/courses", title: "الكورسات", description: "بيانات الكورسات وصورها.", icon: BookOpen },
      { href: "/admin/settings/webp-images", title: "تحويل الصور إلى WebP", description: "تحويل صور الكورسات القديمة (PNG/JPG) لتقليل استهلاك Supabase.", icon: ImageDown },
    ],
  },
  {
    title: "الإعلانات",
    tools: [
      { href: "/admin/content/announcements", title: "الإعلانات", description: "إعلانات المنصة للطلاب.", icon: Megaphone },
      { href: "/admin/content/landing-promos", title: "إعلانات صفحة البداية", description: "فيديوهات الكورسات في صفحة البداية.", icon: Video },
      { href: "/admin/content/landing-pages", title: "صفحات هبوط الإعلانات", description: "صفحات الإعلانات المدفوعة (/lp/…) وإنشاء صفحة لإعلان جديد.", icon: FileImage },
    ],
  },
];

export default function SettingsPage() {
  return (
    <>
      <AdminPageHeader title="الإعدادات" description="اختصارات لأدوات وإعدادات المنصة." />

      <div className="space-y-6">
        {rows.map((row) => (
          <section key={row.title}>
            <h2 className="mb-3 text-sm font-bold text-slate-500">{row.title}</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {row.tools.map((tool) => (
                <Link
                  key={`${row.title}-${tool.title}`}
                  href={tool.href}
                  className="group flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-[#F7B548] hover:shadow-sm"
                >
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#07152E] text-[#F7B548]">
                    <tool.icon className="h-6 w-6" />
                  </span>
                  <span className="grid gap-1">
                    <span className="text-base font-bold text-[#07152E] group-hover:text-[#A86A12]">{tool.title}</span>
                    <span className="text-sm leading-6 text-slate-500">{tool.description}</span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
