"use client";

import { useEffect, useState } from "react";

/** لغة الواجهة الحالية (ar/en) من localStorage مع الاستماع لتغييرها. */
export default function useMasarLocale(): "ar" | "en" {
  const [locale, setLocale] = useState<"ar" | "en">("ar");
  useEffect(() => {
    const read = () => setLocale(window.localStorage.getItem("masar-locale") === "en" ? "en" : "ar");
    read();
    const onChange = (event: Event) => {
      const next = (event as CustomEvent<{ locale?: string }>).detail?.locale;
      if (next === "ar" || next === "en") setLocale(next);
      else read();
    };
    window.addEventListener("masar:locale-change", onChange);
    return () => window.removeEventListener("masar:locale-change", onChange);
  }, []);
  return locale;
}
