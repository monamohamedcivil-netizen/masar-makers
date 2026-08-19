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
  ArrowRight,
} from "lucide-react";

type Locale = "ar" | "en";

const labels = {
  ar: { counter: "الإعلان", from: "من", details: "التفاصيل", show: "عرض الإعلان" },
  en: { counter: "Announcement", from: "of", details: "Details", show: "Show announcement" },
} as const;

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
  title_en: string | null;
  description: string | null;
  description_en: string | null;
  button_text: string | null;
  button_text_en: string | null;
  href: string | null;
  is_active: boolean;
  display_order: number;
  starts_at: string | null;
  ends_at: string | null;
};

function getAnnouncementFontSize(
  value: string,
  kind: "title" | "description",
  isArabic: boolean
) {
  const length = value.trim().length;

  if (kind === "title") {
    if (isArabic) {
      if (length > 95) return "10px";
      if (length > 75) return "11px";
      if (length > 55) return "12px";
      return "14px";
    }

    if (length > 100) return "9px";
    if (length > 80) return "10px";
    if (length > 60) return "11px";
    if (length > 45) return "12px";
    return "14px";
  }

  if (isArabic) {
    if (length > 120) return "9px";
    if (length > 95) return "10px";
    if (length > 70) return "11px";
    return "12px";
  }

  if (length > 125) return "8.5px";
  if (length > 100) return "9px";
  if (length > 80) return "10px";
  if (length > 60) return "11px";
  return "12px";
}

export default function AnnouncementBar() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [locale, setLocale] = useState<Locale>("ar");

  useEffect(() => {
    const savedLocale = window.localStorage.getItem("masar-locale") as Locale | null;

    if (savedLocale === "ar" || savedLocale === "en") {
      setLocale(savedLocale);
    }

    const handleLocaleChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ locale?: Locale }>;
      const nextLocale = customEvent.detail?.locale;

      if (nextLocale === "ar" || nextLocale === "en") {
        setLocale(nextLocale);
      }
    };

    window.addEventListener("masar:locale-change", handleLocaleChange);
    return () => window.removeEventListener("masar:locale-change", handleLocaleChange);
  }, []);

  const text = labels[locale];
  const isArabic = locale === "ar";
  const CTAArrow = isArabic ? ArrowLeft : ArrowRight;

  useEffect(() => {
    let cancelled = false;

    async function loadAnnouncements() {
      try {
        const supabase = createClient();

        const { data, error } = await supabase
          .from("platform_announcements")
          .select(
            "id,type,title,title_en,description,description_en,button_text,button_text_en,href,is_active,display_order,starts_at,ends_at"
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

  const title =
    locale === "en"
      ? item?.title_en?.trim() ||
        item?.title ||
        ""
      : item?.title || "";

  const description =
    locale === "en"
      ? item?.description_en?.trim() ||
        item?.description ||
        null
      : item?.description || null;

  const buttonText =
    locale === "en"
      ? item?.button_text_en?.trim() ||
        text.details
      : item?.button_text?.trim() ||
        text.details;

  const isExternalLink =
    /^https?:\/\//i.test(href);

  return (
    <section
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      dir={isArabic ? "rtl" : "ltr"}
      className="relative h-16 border-b border-[#E8EEF8] bg-gradient-to-r from-[#FFFDF7] via-[#FFF8EB] to-[#F8FBFF]"
    >
      <div className="relative mx-auto h-full max-w-7xl px-6">
        {/* Personal Notification Center */}
        <div
          className={`absolute top-1/2 z-20 -translate-y-1/2 ${
            isArabic ? "right-6" : "left-6"
          }`}
        >
          <NotificationCenter />
        </div>

        {/* No active platform announcements */}
        {!loading && !item ? null : item ? (
          <>
            {/* Center - Announcement */}
            <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
              <div className="grid grid-cols-[115px_40px_420px] items-center gap-3">
                {/* Counter */}
                <div className="flex justify-end">
                  <div className="whitespace-nowrap rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 shadow-sm">
                    {text.counter} {current + 1} {text.from}{" "}
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
                <div className={`${isArabic ? "text-right" : "text-left"} leading-tight`}>
                  <h3
                    className="whitespace-nowrap font-extrabold"
                    style={{
                      color: theme.color,
                      fontSize: getAnnouncementFontSize(
                        title,
                        "title",
                        isArabic
                      ),
                    }}
                  >
                    {title}
                  </h3>

                  {description ? (
                    <p
                      className="whitespace-nowrap text-slate-600"
                      style={{
                        fontSize: getAnnouncementFontSize(
                          description,
                          "description",
                          isArabic
                        ),
                      }}
                    >
                      {description}
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
                        aria-label={`${text.show} ${
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
            <div className={`absolute top-1/2 flex -translate-y-1/2 ${isArabic ? "left-6" : "right-6"}`}>
              {isExternalLink ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-full bg-[#F7B548] px-5 py-2 text-sm font-bold text-[#07152E] transition duration-300 hover:scale-105 hover:shadow-lg"
                >
                  {buttonText}
                  <CTAArrow size={15} />
                </a>
              ) : (
                <AuthLink
                  href={href}
                  className="flex items-center gap-2 rounded-full bg-[#F7B548] px-5 py-2 text-sm font-bold text-[#07152E] transition duration-300 hover:scale-105 hover:shadow-lg"
                >
                  {buttonText}
                  <CTAArrow size={15} />
                </AuthLink>
              )}
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}