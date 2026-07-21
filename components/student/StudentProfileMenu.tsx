"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Award,
  BookOpen,
  ChevronDown,
  CircleUserRound,
  Compass,
  GraduationCap,
  LogOut,
  Sparkles,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

type Props = {
  name: string;
  email?: string;
};

const links = [
  { label: "حسابي", href: "/account", icon: CircleUserRound },
  { label: "المسارات المهنية", href: "/career-path", icon: Compass },
  { label: "رحلات اليوم الواحد", href: "/journeys/one-day", icon: Zap },
  { label: "الرحلات المجانية", href: "/journeys/free", icon: Sparkles },
  { label: "رحلتي التعليمية", href: "/dashboard", icon: BookOpen },
  { label: "إنجازاتي", href: "/achievements", icon: Award },
];

export default function StudentProfileMenu({ name, email }: Props) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "MM";

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  };

  return (
    <div ref={wrapperRef} className="relative z-[80]">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-full border border-[#F7B548]/25 bg-[#07152E] px-2 py-1.5 text-white shadow-lg transition hover:border-[#F7B548]/60"
        aria-expanded={open}
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F7B548] text-xs font-black text-[#07152E]">
          {initials}
        </span>
        <span className="hidden max-w-28 truncate text-xs font-black sm:block">{name.split(" ")[0]}</span>
        <ChevronDown size={15} className={`transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 mt-3 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_70px_rgba(7,21,46,.22)]">
          <div className="border-b border-slate-100 bg-[#F8FAFC] px-4 py-3">
            <p className="truncate text-sm font-black text-[#07152E]">{name}</p>
            {email && <p className="mt-1 truncate text-[11px] font-semibold text-slate-500">{email}</p>}
          </div>
          <div className="p-2">
            {links.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-black text-[#07152E] transition hover:bg-[#FFF7E7] hover:text-[#B97800]"
              >
                <item.icon size={17} />
                {item.label}
              </Link>
            ))}
          </div>
          <div className="border-t border-slate-100 p-2">
            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-black text-red-600 transition hover:bg-red-50"
            >
              <LogOut size={17} />
              تسجيل الخروج
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
