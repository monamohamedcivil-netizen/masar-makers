"use client";

import { useEffect, useMemo, useState } from "react";
import AuthLink from "@/components/AuthLink";
import NotificationCenter from "@/components/notifications/NotificationCenter";
import { createClient } from "@/lib/supabase/client";

import {
  Gift,
  CalendarDays,
  Sparkles,
  Trophy,
  TriangleAlert,
  ArrowLeft,
} from "lucide-react";

type AnnouncementType =
  | "offer"
  | "course"
  | "news"
  | "achievement"
  | "alert";

type Announcement = {
  id: string;
  type: AnnouncementType;
  title: string;
  description: string | null;
  button_text: string | null;
  href: string | null;
  is_active: boolean;
  display_order: number;
  starts_at: string | null;
  ends_at: string | null;
};

export default function AnnouncementBar() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadAnnouncements() {
      try {
        const supabase = createClient();

        const { data, error } = await supabase
          .from("platform_announcements")
          .select(
            "id,type,title,description,button_text,href,is_active,display_order,starts_at,ends_at"
          )
          .order("display_order", { ascending: true })
          .order("created_at", { ascending: false });

        if (cancelled) return;

        if (error) {
          console.error(
            "Failed to load platform announcements:",
            error
          );
          setAnnouncements([]);
          return;
        }

        setAnnouncements(
          (data ?? []) as Announcement[]
        );
      } catch (error) {
        if (!cancelled) {
          console.error(
            "Failed to initialize platform announcements:",
            error
          );
          setAnnouncements([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadAnnouncements();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (announcements.length === 0) {
      setCurrent(0);
      return;
    }

    if (current >= announcements.length) {
      setCurrent(0);
    }
  }, [announcements.length, current]);

  useEffect(() => {
    if (
      paused ||
      announcements.length <= 1
    ) {
      return;
    }

    const timer = window.setInterval(() => {
      setCurrent(
        (previous) =>
          (previous + 1) %
          announcements.length
      );
    }, 5000);

    return () =>
      window.clearInterval(timer);
  }, [paused, announcements.length]);

  const item =
    announcements.length > 0
      ? announcements[current]
      : null;

  const theme = useMemo(() => {
    switch (item?.type) {
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
  }, [item?.type]);

  const href = item?.href?.trim() || "#";
  const buttonText =
    item?.button_text?.trim() || "التفاصيل";

  const isExternalLink =
    /^https?:\/\//i.test(href);

  return (
    <section
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="relative h-16 border-b border-[#E8EEF8] bg-gradient-to-r from-[#FFFDF7] via-[#FFF8EB] to-[#F8FBFF]"
    >
      <div className="relative mx-auto h-full max-w-7xl px-6">
        {/* Right - Personal Notification Center */}
        <NotificationCenter />

        {/* No active platform announcements */}
        {!loading && !item ? null : item ? (
          <>
            {/* Center - Announcement */}
            <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
              <div className="grid grid-cols-[115px_40px_420px] items-center gap-3">
                {/* Counter */}
                <div className="flex justify-end">
                  <div className="whitespace-nowrap rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 shadow-sm">
                    الإعلان {current + 1} من{" "}
                    {announcements.length}
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
                    style={{
                      color: theme.color,
                    }}
                  >
                    {item.title}
                  </h3>

                  {item.description ? (
                    <p className="text-xs text-slate-600">
                      {item.description}
                    </p>
                  ) : null}
                </div>
              </div>

              {/* Indicators */}
              {announcements.length > 1 ? (
                <div className="mt-1 flex justify-center gap-2">
                  {announcements.map(
                    (announcement, index) => (
                      <button
                        key={announcement.id}
                        type="button"
                        aria-label={`عرض الإعلان ${
                          index + 1
                        }`}
                        onClick={() =>
                          setCurrent(index)
                        }
                        className={`rounded-full transition-all duration-500 ${
                          current === index
                            ? "h-[6px] w-8 bg-[#F7B548]"
                            : "h-[6px] w-[6px] bg-slate-300 hover:bg-slate-400"
                        }`}
                      />
                    )
                  )}
                </div>
              ) : null}
            </div>

            {/* Left - CTA */}
            <div className="absolute left-6 top-1/2 flex -translate-y-1/2">
              {isExternalLink ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-full bg-[#F7B548] px-5 py-2 text-sm font-bold text-[#07152E] transition duration-300 hover:scale-105 hover:shadow-lg"
                >
                  {buttonText}
                  <ArrowLeft size={15} />
                </a>
              ) : (
                <AuthLink
                  href={href}
                  className="flex items-center gap-2 rounded-full bg-[#F7B548] px-5 py-2 text-sm font-bold text-[#07152E] transition duration-300 hover:scale-105 hover:shadow-lg"
                >
                  {buttonText}
                  <ArrowLeft size={15} />
                </AuthLink>
              )}
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}