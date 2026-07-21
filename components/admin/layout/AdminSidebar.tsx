"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Award,
  BookOpen,
  ChartNoAxesCombined,
  ChevronLeft,
  CircleDollarSign,
  ClipboardList,
  GraduationCap,
  Route,
  LayoutDashboard,
  Megaphone,
  Settings,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";

interface AdminSidebarProps {
  open: boolean;
  onClose: () => void;
}

interface NavigationItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavigationGroup {
  title: string;
  items: NavigationItem[];
}

const navigationGroups: NavigationGroup[] = [
  {
    title: "الرئيسية",
    items: [
      {
        title: "نظرة عامة",
        href: "/admin/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: "إدارة الطلاب",
    items: [
      {
        title: "طلبات الاشتراك",
        href: "/admin/students/enrollment-requests",
        icon: ClipboardList,
      },
      {
        title: "الطلاب النشطون",
        href: "/admin/students/active",
        icon: Users,
      },
      {
        title: "الطلاب الموقوفون",
        href: "/admin/students/suspended",
        icon: ShieldCheck,
      },
      {
        title: "الشهادات",
        href: "/admin/students/certificates",
        icon: Award,
      },
    ],
  },
  {
    title: "المحتوى التعليمي",
    items: [
      {
        title: "المسارات المهنية",
        href: "/admin/learning/career-paths",
        icon: GraduationCap,
      },
      {
        title: "الكورسات",
        href: "/admin/learning/courses",
        icon: BookOpen,
      },
      {
        title: "الرحلات",
        href: "/admin/learning/journeys",
        icon: Route,
      },
      {
        title: "الدروس والمحتوى",
        href: "/admin/learning/lessons",
        icon: BookOpen,
      },
    ],
  },
  {
    title: "الإدارة",
    items: [
      {
        title: "المدفوعات",
        href: "/admin/finance/payments",
        icon: CircleDollarSign,
      },
      {
        title: "الإعلانات",
        href: "/admin/content/announcements",
        icon: Megaphone,
      },
      {
        title: "التقارير",
        href: "/admin/reports",
        icon: ChartNoAxesCombined,
      },
      {
        title: "الإعدادات",
        href: "/admin/settings",
        icon: Settings,
      },
    ],
  },
];

export default function AdminSidebar({
  open,
  onClose,
}: AdminSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin/dashboard") {
      return pathname === href;
    }

    return pathname.startsWith(href);
  };

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="إغلاق القائمة"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        />
      )}

      <aside
        className={[
          "fixed right-0 top-0 z-50 flex h-screen w-72 flex-col bg-[#07152E] text-white shadow-2xl transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full",
          "lg:translate-x-0",
        ].join(" ")}
      >
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-5">
          <Link
            href="/admin"
            onClick={onClose}
            className="flex items-center gap-3"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F7B548] font-black text-[#07152E]">
              MM
            </div>

            <div>
              <p className="font-bold">Masar Makers</p>
              <p className="text-xs text-white/60">لوحة التحكم</p>
            </div>
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-5">
          <div className="space-y-6">
            {navigationGroups.map((group) => (
              <div key={group.title}>
                <p className="mb-2 px-3 text-xs font-semibold text-white/40">
                  {group.title}
                </p>

                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        className={[
                          "group flex items-center justify-between rounded-xl px-3 py-3 text-sm font-semibold transition",
                          active
                            ? "bg-[#F7B548] text-[#07152E]"
                            : "text-white/75 hover:bg-white/10 hover:text-white",
                        ].join(" ")}
                      >
                        <span className="flex items-center gap-3">
                          <Icon className="h-5 w-5" />
                          {item.title}
                        </span>

                        <ChevronLeft
                          className={[
                            "h-4 w-4 transition",
                            active
                              ? "opacity-100"
                              : "opacity-0 group-hover:opacity-100",
                          ].join(" ")}
                        />
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>

        <div className="border-t border-white/10 p-4">
          <Link
            href="/"
            className="flex items-center justify-center rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            العودة إلى المنصة
          </Link>
        </div>
      </aside>
    </>
  );
}