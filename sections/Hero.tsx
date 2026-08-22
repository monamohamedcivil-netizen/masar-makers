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

  const text = heroText[locale];

  return (
    <>
      {/* Mobile */}
      <section
        dir={locale === "ar" ? "rtl" : "ltr"}
        className="relative overflow-hidden bg-[#07152E] lg:hidden"
      >
        {/* Top text area */}
        <div className="px-4 pb-4 pt-5 text-white">
          <div
            className={
              locale === "ar"
                ? "text-right"
                : "text-left"
            }
          >
            <h1 className="text-[19px] font-black leading-[1.55]">
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

            <p className="mt-1.5 text-[12px] font-semibold leading-6 text-white/85">
              {text.description}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <AuthLink href="/dashboard">
                <button className="flex items-center gap-1.5 rounded-xl bg-[#F7B548] px-4 py-2 text-[11px] font-black text-[#07152E]">
                  {text.start}
                  <ArrowLeft size={14} />
                </button>
              </AuthLink>

              <AuthLink href="/career-path/road-design">
                <button className="flex items-center gap-1.5 rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-[11px] font-black text-white">
                  {text.explore}
                  <Compass size={14} />
                </button>
              </AuthLink>
            </div>
          </div>
        </div>

        {/* Clean image area */}
        <div className="relative h-[160px] w-full overflow-hidden sm:h-[185px]">
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
        </div>

        {/* Bottom area */}
        <div className="relative min-h-[132px] bg-gradient-to-b from-[#07152E] to-[#102442] px-3 pb-3 pt-2">
          <HomeMonthlyDrawStatus />
          <div className="pt-[84px]">
            <HeroWelcome />
          </div>
        </div>
      </section>

      {/* Desktop / tablet - original design preserved */}
      <section className="relative hidden h-[200px] overflow-hidden lg:block">
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
                <h1 className="whitespace-nowrap text-[18px] font-black leading-tight text-white xl:text-[28px]">
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

                <p className="mt-1 max-w-[610px] text-[14px] font-bold leading-5 text-white/90">
                  {text.description}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <AuthLink href="/dashboard">
                    <button className="flex items-center gap-1 rounded-2xl bg-[#F7B548] px-4 py-1.5 text-[12px] font-bold text-[#07152E] transition duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(247,181,72,.45)]">
                      {text.start}
                      <ArrowLeft size={15} />
                    </button>
                  </AuthLink>

                  <AuthLink href="/career-path/road-design">
                    <button className="flex items-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-4 py-1.5 text-[12px] font-bold text-white backdrop-blur transition duration-300 hover:bg-white hover:text-[#07152E]">
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