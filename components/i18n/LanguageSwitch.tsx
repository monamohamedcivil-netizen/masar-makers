"use client";

import { Languages } from "lucide-react";
import { useEffect, useState } from "react";

import type { MasarLocale } from "@/lib/i18n/ui-translations";

type LanguageSwitchProps = {
  className?: string;
  floating?: boolean;
  compact?: boolean;
  light?: boolean;
};

function applyLocale(locale: MasarLocale) {
  document.documentElement.lang = locale;
  document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";

  window.localStorage.setItem("masar-locale", locale);
  document.cookie = `masar-locale=${locale}; path=/; max-age=31536000; samesite=lax`;

  window.dispatchEvent(
    new CustomEvent("masar:locale-change", {
      detail: { locale },
    }),
  );
}

export default function LanguageSwitch({
  className = "",
  floating = false,
  compact = false,
  light = false,
}: LanguageSwitchProps) {
  const [locale, setLocale] = useState<MasarLocale>("ar");

  useEffect(() => {
    const savedLocale = window.localStorage.getItem("masar-locale");

    if (savedLocale === "ar" || savedLocale === "en") {
      setLocale(savedLocale);
      applyLocale(savedLocale);
    }

    const handleLocaleChange = (event: Event) => {
      const customEvent = event as CustomEvent<{
        locale?: MasarLocale;
      }>;

      if (
        customEvent.detail?.locale === "ar" ||
        customEvent.detail?.locale === "en"
      ) {
        setLocale(customEvent.detail.locale);
      }
    };

    window.addEventListener("masar:locale-change", handleLocaleChange);

    return () => {
      window.removeEventListener("masar:locale-change", handleLocaleChange);
    };
  }, []);

  const toggleLanguage = () => {
    const nextLocale: MasarLocale = locale === "ar" ? "en" : "ar";
    setLocale(nextLocale);
    applyLocale(nextLocale);
  };

  const buttonLabel = locale === "ar" ? "English" : "العربية";
  // الزر العائم دائري صغير بكود اللغة فقط حتى لا يغطي نصًا في الصفحة.
  const shortLabel = locale === "ar" ? "EN" : "ع";
  const ariaLabel =
    locale === "ar" ? "Switch to English" : "التبديل إلى العربية";

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      aria-label={ariaLabel}
      title={buttonLabel}
      className={[
        "inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap border font-black transition",
        floating
          ? "h-10 min-w-10 rounded-full px-2.5 text-[11px] opacity-80 hover:opacity-100 focus-visible:opacity-100"
          : compact
            ? "h-8 rounded-xl px-2 text-[10px] sm:px-2.5 sm:text-[11px]"
            : "h-9 rounded-xl px-3 text-[11px] sm:text-[12px]",
        light
          ? "border-[#07152E]/15 bg-white text-[#07152E] shadow-sm hover:border-[#F7B548] hover:bg-[#FFF8E8]"
          : floating
            ? "border-white/25 bg-[#07152E]/85 text-white hover:border-[#F7B548]/70 hover:text-[#F7B548]"
            : "border-white/20 bg-white/10 text-white hover:border-[#F7B548]/70 hover:bg-white/15 hover:text-[#F7B548]",
        floating ? "shadow-lg backdrop-blur-md" : "",
        className,
      ].join(" ")}
    >
      <Languages size={compact ? 14 : 15} className="shrink-0" />
      <span>{floating ? shortLabel : buttonLabel}</span>
    </button>
  );
}
