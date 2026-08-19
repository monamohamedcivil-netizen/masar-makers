"use client";

import { useEffect, useState } from "react";
import useCurrentUser from "@/hooks/useCurrentUser";

type Locale = "ar" | "en";

export default function HeroWelcome() {
  const { user, loading } = useCurrentUser();
  const [locale, setLocale] = useState<Locale>("ar");

  useEffect(() => {
    const saved = window.localStorage.getItem("masar-locale");
    if (saved === "ar" || saved === "en") setLocale(saved);

    const handleLocaleChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ locale?: Locale }>;
      if (customEvent.detail?.locale === "ar" || customEvent.detail?.locale === "en") {
        setLocale(customEvent.detail.locale);
      }
    };

    window.addEventListener("masar:locale-change", handleLocaleChange);
    return () => window.removeEventListener("masar:locale-change", handleLocaleChange);
  }, []);

  if (loading || !user) {
    return null;
  }

  const metadata = user.user_metadata ?? {};

  const fullName =
    metadata.full_name ||
    metadata.name ||
    user.email?.split("@")[0] ||
    "مهندس";

  const firstName =
    String(fullName).trim().split(/\s+/)[0] || "مهندس";

  return (
    <div
      className={`absolute top-[40%] z-30 ${
        locale === "ar"
          ? "left-[37%] -translate-x-1/2 max-lg:left-[37%] max-sm:left-[22%]"
          : "right-[32%] translate-x-1/2 max-lg:right-[20%] max-sm:right-[15%]"
      } max-lg:top-[58%] max-sm:top-[68%]`}
    >
      <div
        className="
          rounded-[28px]
          border border-white/55
          bg-white/78
          max-w-[320px]
          px-4 py-2 sm:max-w-[420px] sm:px-3 sm:py-1.5
          text-center
          shadow-[0_8px_24px_rgba(7,21,46,0.12)]
          backdrop-blur-md
        "
        
      >

        
        <p className={`text-[10px] font-bold text-[#07152E] sm:text-[9px] lg:text-[13px] ${
          locale === "ar" ? "whitespace-nowrap" : "leading-5"
        }`}>
          {locale === "ar" ? (
            <>
              أهلًا بعودتك يا{" "}
              <span className="font-black text-[#C88712]">{firstName}</span>
              ، سعداء بوجودك معنا
            </>
          ) : (
            <>
              Welcome back,{" "}
              <span className="font-black text-[#C88712]">{firstName}</span>
              . We&apos;re happy to have you with us.
            </>
          )}
        </p>
      </div>
    </div>
  );
}