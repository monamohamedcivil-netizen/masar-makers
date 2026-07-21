"use client";

import { Bell, LogOut, Menu, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

interface AdminHeaderProps {
  adminName: string;
  adminEmail: string;
  onMenuClick: () => void;
}

export default function AdminHeader({
  adminName,
  adminEmail,
  onMenuClick,
}: AdminHeaderProps) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const firstLetter = adminName.trim().charAt(0) || "A";

  const handleSignOut = async () => {
    if (signingOut) return;

    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex h-20 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="فتح القائمة"
            onClick={onMenuClick}
            className="rounded-xl border border-slate-200 p-2.5 text-slate-700 transition hover:bg-slate-100 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="hidden items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 md:flex">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              type="search"
              placeholder="ابحث في لوحة التحكم..."
              className="w-64 bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            aria-label="الإشعارات"
            className="relative rounded-xl border border-slate-200 p-2.5 text-slate-600 transition hover:bg-slate-100"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute left-2 top-2 h-2 w-2 rounded-full bg-red-500" />
          </button>

          <button
            type="button"
            aria-label="تسجيل الخروج"
            title="تسجيل الخروج"
            disabled={signingOut}
            onClick={handleSignOut}
            className="rounded-xl border border-slate-200 p-2.5 text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
          >
            <LogOut className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-3 border-r border-slate-200 pr-3">
            <div className="hidden text-left sm:block">
              <p className="text-sm font-bold text-[#07152E]">{adminName}</p>
              <p className="max-w-48 truncate text-xs text-slate-500">
                {adminEmail}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#07152E] font-bold text-[#F7B548]">
              {firstLetter}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
