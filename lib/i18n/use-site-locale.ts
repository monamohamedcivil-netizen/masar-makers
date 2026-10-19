"use client";

import { useEffect, useState } from "react";

import type { DisplayLocale } from "@/lib/i18n/student-display";

/*
 * لغة الموقع الحالية (نفس آلية بقية الأقسام):
 * تُقرأ من localStorage وتتحدث عند حدث masar:locale-change.
 */
export function useSiteLocale(): DisplayLocale {
  const [locale, setLocale] = useState<DisplayLocale>("ar");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("masar-locale");

      if (saved === "ar" || saved === "en") {
        setLocale(saved);
      }
    } catch {
      // التخزين غير متاح: نبقى على العربية.
    }

    const handleChange = (event: Event) => {
      const next = (event as CustomEvent<{ locale?: string }>).detail
        ?.locale;

      if (next === "ar" || next === "en") {
        setLocale(next);
      }
    };

    window.addEventListener("masar:locale-change", handleChange);

    return () =>
      window.removeEventListener("masar:locale-change", handleChange);
  }, []);

  return locale;
}
