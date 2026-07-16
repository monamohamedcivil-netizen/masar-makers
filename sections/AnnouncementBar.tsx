"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AuthLink from "@/components/AuthLink";
import NotificationCenter from "@/components/notifications/NotificationCenter";

import {
  Megaphone,
  Gift,
  CalendarDays,
  Sparkles,
  Trophy,
  TriangleAlert,
  ArrowLeft,
} from "lucide-react";

type NotificationType =
  | "offer"
  | "course"
  | "news"
  | "achievement"
  | "alert";

interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  description: string;
  button: string;
  href: string;
}

const notifications: Notification[] = [
  {
    id: 1,
    type: "offer",
    title: "خصم الصيف 30%",
    description: "احصل على خصم 30% على جميع الرحلات التعليمية لفترة محدودة.",
    button: "استفد الآن",
    href: "#",
  },
  {
    id: 2,
    type: "course",
    title: "بدأ التسجيل في BIM for Roads",
    description: "الدفعة الجديدة تبدأ قريباً والمقاعد محدودة.",
    button: "سجل الآن",
    href: "#",
  },
  {
    id: 3,
    type: "news",
    title: "رحلة تعليمية جديدة",
    description: "تم إضافة رحلة Smart Project Deliverables.",
    button: "اكتشف الجديد",
    href: "#",
  },
  {
    id: 4,
    type: "achievement",
    title: "+500 متدرب",
    description: "انضم أكثر من 500 مهندس من 12 دولة إلى صناع المسار.",
    button: "عرض التفاصيل",
    href: "#",
  },
  {
    id: 5,
    type: "alert",
    title: "تنبيه",
    description: "ينتهي التسجيل الحالي بعد يومين.",
    button: "التفاصيل",
    href: "#",
  },
];

export default function AnnouncementBar() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;

    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % notifications.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [paused]);

  const item = notifications[current];

  const theme = useMemo(() => {
    switch (item.type) {
      case "offer":
        return {
          color: "#D79A15",
          bg: "#FFF8E6",
          icon: <Gift size={18} />,
        };

      case "course":
        return {
          color: "#2563EB",
          bg: "#EEF5FF",
          icon: <CalendarDays size={18} />,
        };

      case "news":
        return {
          color: "#10B981",
          bg: "#ECFDF5",
          icon: <Sparkles size={18} />,
        };

      case "achievement":
        return {
          color: "#7C3AED",
          bg: "#F5F0FF",
          icon: <Trophy size={18} />,
        };

      default:
        return {
          color: "#EF4444",
          bg: "#FEF2F2",
          icon: <TriangleAlert size={18} />,
        };
    }
  }, [item]);

return (
  <section
    onMouseEnter={() => setPaused(true)}
    onMouseLeave={() => setPaused(false)}
    className="relative h-16 border-b border-[#E8EEF8] bg-gradient-to-r from-[#FFFDF7] via-[#FFF8EB] to-[#F8FBFF]"
  >
    <div className="mx-auto relative h-full max-w-7xl px-6">

      {/* Right - Notification Center */}
      <NotificationCenter />

      {/* Center - Fixed Announcement */}
      <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">

        <div className="grid grid-cols-[115px_40px_420px] items-center gap-3">

          {/* Counter */}
          <div className="flex justify-end">
            <div className="whitespace-nowrap rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 shadow-sm">
              الإعلان {current + 1} من {notifications.length}
            </div>
          </div>

          {/* Icon */}
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full"
            style={{
              background: theme.bg,
              color: theme.color,
            }}
          >
            {theme.icon}
          </div>

          {/* Text */}
          <div className="text-right leading-tight">
            <h3
              className="text-sm font-extrabold"
              style={{ color: theme.color }}
            >
              {item.title}
            </h3>

            <p className="text-xs text-slate-600">
              {item.description}
            </p>
          </div>

        </div>

        {/* Indicators */}
        <div className="mt-1 flex justify-center gap-2">
          {notifications.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrent(index)}
              className={`rounded-full transition-all duration-500 ${
                current === index
                  ? "h-[6px] w-8 bg-[#F7B548]"
                  : "h-[6px] w-[6px] bg-slate-300 hover:bg-slate-400"
              }`}
            />
          ))}
        </div>

      </div>

      {/* Left - Button */}
      <div className="absolute left-6 top-1/2 flex -translate-y-1/2">
        <AuthLink
          href={item.href}
          className="flex items-center gap-2 rounded-full bg-[#F7B548] px-5 py-2 text-sm font-bold text-[#07152E] transition duration-300 hover:scale-105 hover:shadow-lg"
        >
          {item.button}
          <ArrowLeft size={15} />
        </AuthLink>
      </div>

    </div>
  </section>
);
}