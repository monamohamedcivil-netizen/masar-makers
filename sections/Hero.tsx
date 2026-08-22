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
    titleOne:
      "لا تتعلم كورس فقط ... ابنِ مسيرتك المهنية باحتراف",
    description:
      "رحلات تعليمية عملية تنقلك من التصميم إلى الإبهار، ومن المعرفة إلى الاحتراف",
    start: "ابدأ رحلتك",
    explore: "استكشف المسارات",
  },

  en: {
    titleOne:
      "Don't just take a course ... Build your professional journey professionally",
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
        "masar-locale",
      );

    if (
      savedLocale === "ar" ||
      savedLocale === "en"
    ) {
      setLocale(savedLocale);
    }

    const handleLocaleChange = (
      event: Event,
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
          customEvent.detail.locale,
        );
      }
    };

    window.addEventListener(
      "masar:locale-change",
      handleLocaleChange,
    );

    return () => {
      window.removeEventListener(
        "masar:locale-change",
        handleLocaleChange,
      );
    };
  }, []);

  const text =
    heroText[locale];

  return (
    <section
      className="
        relative
        h-[270px]
        overflow-hidden

        sm:h-[220px]
        lg:h-[200px]
      "
    >
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
          className="
            object-cover
            object-center
            scale-[1.18]

            sm:scale-[1.08]
            lg:scale-100
          "
        />

        <div
          className="absolute inset-0"
          style={{
            background:
              locale === "ar"
                ? "linear-gradient(to left, rgba(7,21,46,.95) 0%, rgba(7,21,46,.84) 24%, rgba(7,21,46,.48) 46%, rgba(7,21,46,.12) 72%, transparent 100%)"
                : "linear-gradient(to right, rgba(7,21,46,.95) 0%, rgba(7,21,46,.84) 24%, rgba(7,21,46,.48) 46%, rgba(7,21,46,.12) 72%, transparent 100%)",
          }}
        />

        <HeroWelcome />

        <HomeMonthlyDrawStatus />

        <div className="absolute inset-0 z-10">
          <div
            className={`
              mx-auto
              flex
              h-full
              max-w-7xl
              items-center

              ${
                locale === "ar"
                  ? `
                    pl-[142px]
                    pr-3

                    sm:pl-6
                    sm:pr-[190px]

                    lg:pl-8
                    lg:pr-[160px]
                  `
                  : `
                    pl-3
                    pr-[142px]

                    sm:pl-[190px]
                    sm:pr-5

                    lg:pl-[100px]
                    lg:pr-8
                  `
              }
            `}
          >
            <div
              dir={
                locale === "ar"
                  ? "rtl"
                  : "ltr"
              }
              className={`
                relative
                w-full
                min-w-0
                max-w-[760px]
                text-white

                ${
                  locale === "ar"
                    ? "ml-auto text-right"
                    : "mr-auto text-left"
                }
              `}
            >
              <h1
                className="
                  max-w-[230px]
                  text-[15px]
                  font-black
                  leading-[1.45]
                  text-white

                  sm:max-w-none
                  sm:whitespace-nowrap
                  sm:text-[14px]
                  sm:leading-tight

                  lg:text-[18px]
                  xl:text-[28px]
                "
              >
                {locale === "ar" ? (
                  <>
                    لا تتعلم كورس فقط ...{" "}
                    <span className="text-[#F7B548]">
                      ابنِ مسيرتك المهنية باحتراف
                    </span>
                  </>
                ) : (
                  <>
                    Don&apos;t just take a course ...{" "}
                    <span className="text-[#F7B548]">
                      Build your professional journey with confidence
                    </span>
                  </>
                )}
              </h1>

              <p
                className="
                  mt-2
                  max-w-[215px]
                  text-[10px]
                  font-bold
                  leading-[16px]
                  text-white/90

                  sm:mt-1
                  sm:max-w-[610px]
                  sm:text-[9px]
                  sm:leading-5

                  lg:text-[14px]
                "
              >
                {text.description}
              </p>

              <div
                className="
                  mt-3
                  flex
                  flex-wrap
                  gap-1.5

                  sm:mt-4
                  sm:gap-2
                "
              >
                <AuthLink href="/dashboard">
                  <button
                    className="
                      flex
                      items-center
                      gap-1
                      rounded-xl
                      bg-[#F7B548]
                      px-3
                      py-1.5
                      text-[9px]
                      font-bold
                      text-[#07152E]
                      transition
                      duration-300
                      hover:scale-105
                      hover:shadow-[0_0_30px_rgba(247,181,72,.45)]

                      sm:rounded-2xl
                      sm:px-2
                      sm:text-[11px]

                      lg:text-[12px]
                    "
                  >
                    {text.start}

                    <ArrowLeft
                      size={13}
                      className="
                        sm:h-[15px]
                        sm:w-[15px]
                      "
                    />
                  </button>
                </AuthLink>

                <AuthLink href="/career-path/road-design">
                  <button
                    className="
                      flex
                      items-center
                      gap-1.5
                      rounded-xl
                      border
                      border-white/30
                      bg-white/10
                      px-3
                      py-1.5
                      text-[9px]
                      font-bold
                      text-white
                      backdrop-blur
                      transition
                      duration-300
                      hover:bg-white
                      hover:text-[#07152E]

                      sm:rounded-2xl
                      sm:px-2
                      sm:text-[11px]

                      lg:text-[12px]
                    "
                  >
                    {text.explore}

                    <Compass
                      size={13}
                      className="
                        sm:h-[15px]
                        sm:w-[15px]
                      "
                    />
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