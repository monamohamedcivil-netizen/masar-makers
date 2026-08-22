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
    description:
      "رحلات تعليمية عملية تنقلك من التصميم إلى الإبهار، ومن المعرفة إلى الاحتراف",
    start: "ابدأ رحلتك",
    explore: "استكشف المسارات",
  },

  en: {
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

  const text = heroText[locale];

  return (
    <>
      {/* =====================================================
          MOBILE
      ====================================================== */}

      <section
        dir={locale === "ar" ? "rtl" : "ltr"}
        className="
          relative
          h-[10svh]
          min-h-[100px]
          max-h-[155px]
          w-full
          overflow-hidden
          bg-[#07152E]
          lg:hidden
        "
      >
        {/* Decorative glow */}
        <div
          className="
            pointer-events-none
            absolute
            -left-12
            top-1/2
            h-[150px]
            w-[150px]
            -translate-y-1/2
            rounded-full
            bg-[#F7B548]/10
            blur-3xl
          "
        />

        {/* ================= LOGO ================= */}
<div
  className="
    absolute
    left-10
    top-1/2
    z-20
    flex
    h-[58px]
    w-[58px]
    -translate-y-1/2
    items-center
    justify-center
    overflow-hidden
    rounded-full
    border
    border-[#F7B548]
    bg-[#07152E]
    shadow-[0_0_12px_rgba(247,181,72,.85),0_0_22px_rgba(247,181,72,.40)]
  "
>
  <Image
    src="/images/logo/masar-makers-mark.png"
    alt="Masar Makers"
    width={70}
    height={70}
    className="
      relative
          top-0.5
      z-15
      h-[100px]
      w-[100px]
      max-w-none
      object-contain
    "
  />
</div>

        {/* ================= CENTER CONTENT ================= */}

        <div
          className="
            absolute
            inset-y-0
            left-[140px]
            right-[138px]
            z-20
            flex
            items-center
            justify-center
          "
        >
          <div className="w-full text-center text-white">
            <h1
              className="
                text-[13px]
                font-black
                leading-[1.35]
                sm:text-[14px]
              "
            >
              {locale === "ar" ? (
                <>
                  لا تتعلم كورس فقط ...
                  <br />

                  <span className="text-[#F7B548]">
                    ابنِ مسيرتك المهنية باحتراف
                  </span>
                </>
              ) : (
                <>
                  Don&apos;t just take a course...
                  <br />

                  <span className="text-[#F7B548]">
                    Build your professional journey
                  </span>
                </>
              )}
            </h1>

            <p
              className="
                mx-auto
                mt-0
                line-clamp-1
                max-w-[260px]
                text-[7.5px]
                font-semibold
                leading-3
                text-white/75
              "
            >
              {text.description}
            </p>

            <div
              className="
                mt-1
                flex
                items-center
                justify-center
                gap-1.5
              "
            >
              <AuthLink href="/dashboard">
                <button
                  className="
                    flex
                    items-center
                    gap-1
                    whitespace-nowrap
                    rounded-lg
                    bg-[#F7B548]
                    px-2.5
                    py-1.5
                    text-[8px]
                    font-black
                    text-[#07152E]
                  "
                >
                  {text.start}

                  <ArrowLeft size={10} />
                </button>
              </AuthLink>

              <AuthLink href="/career-path/road-design">
                <button
                  className="
                    flex
                    items-center
                    gap-1
                    whitespace-nowrap
                    rounded-lg
                    border
                    border-white/25
                    bg-white/5
                    px-2.5
                    py-1.5
                    text-[8px]
                    font-black
                    text-white
                  "
                >
                  {text.explore}

                  <Compass size={10} />
                </button>
              </AuthLink>
            </div>
          </div>
        </div>

        {/* ================= DRAW CARD ================= */}

        <div
          className="
            absolute
            right-5
            top-1/2
            z-30
            w-[90px]
                        -translate-y-1/2
          "
        >
          <HomeMonthlyDrawStatus compactMobile />
        </div>

        {/*
          HeroWelcome intentionally hidden on mobile
          to reduce visual crowding.
        */}
      </section>

      {/* =====================================================
          DESKTOP
          Existing layout preserved
      ====================================================== */}

      <section
        className="
          relative
          hidden
          h-[200px]
          overflow-hidden
          lg:block
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
                  ? "pl-8 pr-[160px]"
                  : "pl-[100px] pr-8"
              }`}
            >
              <div
                dir={
                  locale === "ar"
                    ? "rtl"
                    : "ltr"
                }
                className={`relative w-full max-w-[760px] text-white ${
                  locale === "ar"
                    ? "ml-auto text-right"
                    : "mr-auto text-left"
                }`}
              >
                <h1
                  className="
                    whitespace-nowrap
                    text-[18px]
                    font-black
                    leading-tight
                    text-white
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
                    mt-1
                    max-w-[610px]
                    text-[14px]
                    font-bold
                    leading-5
                    text-white/90
                  "
                >
                  {text.description}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <AuthLink href="/dashboard">
                    <button
                      className="
                        flex
                        items-center
                        gap-1
                        rounded-2xl
                        bg-[#F7B548]
                        px-4
                        py-1.5
                        text-[12px]
                        font-bold
                        text-[#07152E]
                      "
                    >
                      {text.start}

                      <ArrowLeft size={15} />
                    </button>
                  </AuthLink>

                  <AuthLink href="/career-path/road-design">
                    <button
                      className="
                        flex
                        items-center
                        gap-2
                        rounded-2xl
                        border
                        border-white/30
                        bg-white/10
                        px-4
                        py-1.5
                        text-[12px]
                        font-bold
                        text-white
                        backdrop-blur
                      "
                    >
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
    </>
  );
}