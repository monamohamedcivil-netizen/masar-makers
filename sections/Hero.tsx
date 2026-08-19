"use client";

import Image from "next/image";
import {
  ArrowLeft,
  Compass,
} from "lucide-react";
import {
  useEffect,
  useState,
} from "react";

import AuthLink from "@/components/AuthLink";
import HeroWelcome from "@/components/auth/HeroWelcome";
import HomeMonthlyDrawStatus from "@/components/monthly-draw/HomeMonthlyDrawStatus";

type Locale = "ar" | "en";

const heroText = {
  ar: {
    titleOne: "لا تتعلم كورس فقط ... ابنِ مسيرتك المهنية باحتراف",
    description:
      "رحلات تعليمية عملية تنقلك من التصميم إلى الإبهار، ومن المعرفة إلى الاحتراف",
    start: "ابدأ رحلتك",
    explore: "استكشف المسارات",
  },
  en: {
    titleOne: "Don't just take a course ... Build your professional journey professionally",
    description:
      "Practical learning journeys that take you from design to distinction, and from knowledge to professional mastery.",
    start: "Start Your Journey",
    explore: "Explore Career Paths",
  },
} as const;

export default function Hero() {
  const [locale, setLocale] =
    useState<Locale>("ar");

  useEffect(() => {
    const savedLocale =
      window.localStorage.getItem(
        "masar-locale"
      );

    if (
      savedLocale === "ar" ||
      savedLocale === "en"
    ) {
      setLocale(savedLocale);
    }

    const handleLocaleChange = (
      event: Event
    ) => {
      const customEvent =
        event as CustomEvent<{
          locale?: Locale;
        }>;

      if (
        customEvent.detail?.locale === "ar" ||
        customEvent.detail?.locale === "en"
      ) {
        setLocale(
          customEvent.detail.locale
        );
      }
    };

    window.addEventListener(
      "masar:locale-change",
      handleLocaleChange
    );

    return () => {
      window.removeEventListener(
        "masar:locale-change",
        handleLocaleChange
      );
    };
  }, []);

  const text = heroText[locale];

  return (
    <section className="relative h-[190px] overflow-hidden sm:h-[180px] lg:h-[200px]">
      <div className="absolute inset-0 overflow-hidden">
        <Image
          src={
            locale === "ar"
              ? "/images/hero-road-v4.jpg"
              : "/images/hero-road-eng.jpg"
          }
          alt="Masar Makers"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />

        <div
          className="absolute inset-0"
          style={{
            background:
              locale === "ar"
                ? "linear-gradient(to left, rgba(7,21,46,.95) 0%, rgba(7,21,46,.88) 18%, rgba(7,21,46,.55) 38%, rgba(7,21,46,.18) 62%, transparent 100%)"
                : "linear-gradient(to right, rgba(7,21,46,.95) 0%, rgba(7,21,46,.88) 18%, rgba(7,21,46,.55) 38%, rgba(7,21,46,.18) 62%, transparent 100%)",
          }}
        />

        <HeroWelcome />
       <HomeMonthlyDrawStatus />

        <div className="absolute inset-0 z-10">
          <div
            className={`mx-auto flex h-full max-w-7xl items-center ${
              locale === "ar"
                ? "pl-3 pr-[158px] sm:pl-6 sm:pr-[190px] lg:pl-8 lg:pr-[160px]"
                : "pl-[168px] pr-3 sm:pl-[190px] sm:pr-5 lg:pl-[100px] lg:pr-8"
            }`}
          >
            <div
              dir={locale === "ar" ? "rtl" : "ltr"}
              className={`relative w-full max-w-[760px] text-white ${
  locale === "ar"
    ? "ml-auto text-right"
    : "mr-auto text-left"
}`}
                
            >
              
              <div className="mb-0">

                <h1 className="whitespace-nowrap text-[15px] font-black leading-tight text-white sm:text-[14px] lg:text-[18px] xl:text-[28px]">
                  {locale === "ar" ? (
                    <>
                      لا تتعلم كورس فقط ...{" "}
                      <span className="text-[#F7B548]">ابنِ مسيرتك المهنية باحتراف</span>
                    </>
                  ) : (
                    <>
                      Don&apos;t just take a course ...{" "}
                      <span className="text-[#F7B548]">Build your professional journey with confidence</span>
                    </>
                  )}
                </h1>
              </div>

              <p className="mt-1 max-w-[610px] text-[10px] font-bold leading-4 text-white/90 sm:text-[9px] sm:leading-5 lg:text-[14px]">
                {text.description}
              </p>

              <div className={`mt-4 flex flex-wrap gap-2 ${locale === "ar" ? "justify-start" : "justify-start"}`}>
                <AuthLink href="/dashboard">
                  <button className="flex items-center gap-1 rounded-2xl bg-[#F7B548] px-4 py-1.5 text-[10px] font-bold text-[#07152E] transition duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(247,181,72,.45)] sm:px-2 sm:text-[11px] lg:text-[12px]">
                    {text.start}
                    <ArrowLeft size={15} />
                  </button>
                </AuthLink>

                <AuthLink href="/career-path/road-design">
                  <button className="flex items-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-4 py-1.5 text-[10px] font-bold text-white backdrop-blur transition duration-300 hover:bg-white hover:text-[#07152E] sm:px-2 sm:text-[11px] lg:text-[12px]">
                    {text.explore}
                    <Compass size={15} />
                  </button>
                </AuthLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}