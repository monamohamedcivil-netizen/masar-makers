"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Compass,
  Crosshair,
  Sparkles,
} from "lucide-react";

import AuthLink from "@/components/AuthLink";

type Locale = "ar" | "en";

const labels = {
  ar: {
    title: "لا تنتظر الفرصة المناسبة ...",
    titleAccent: "ابنِها بنفسك",
    description:
      "اختر الرحلة التي تناسب هدفك، وابدأ بخطوات واضحة حتى تصل إلى الاحتراف من خلال مشاريع حقيقية وخبرة عملية.",
    start: "ابدأ رحلتك",
    explore: "استكشف المسارات",
    destination: "الوصول إلى الاحتراف",
    freeTitle: "ابدأ مجانًا",
    freeText: "استكشف المحتوى المفتوح أولًا",
    goalTitle: "اختر هدفك",
    goalText: "رحلة كاملة أو ورشة مركزة",
    applyTitle: "طبّق وشارك",
    applyText: "أضف مشروعك إلى إنجازاتك",
    imageAlt: "طريق الاحتراف المؤدي إلى الكأس",
  },
  en: {
    title: "Don't wait for the right opportunity ...",
    titleAccent: "Build it yourself",
    description:
      "Choose the journey that matches your goal and move through clear practical steps toward professional mastery through real projects and hands-on experience.",
    start: "Start Your Journey",
    explore: "Explore Career Paths",
    destination: "Reach Professional Mastery",
    freeTitle: "Start for Free",
    freeText: "Explore open learning content first",
    goalTitle: "Choose Your Goal",
    goalText: "A full journey or a focused workshop",
    applyTitle: "Apply & Share",
    applyText: "Add your project to your achievements",
    imageAlt: "The road to professional mastery",
  },
} as const;

export default function FinalCTA() {
  const [locale, setLocale] = useState<Locale>("ar");

  useEffect(() => {
    const savedLocale = window.localStorage.getItem(
      "masar-locale",
    ) as Locale | null;

    if (savedLocale === "ar" || savedLocale === "en") {
      setLocale(savedLocale);
    }

    const handleLocaleChange = (event: Event) => {
      const customEvent = event as CustomEvent<{
        locale?: Locale;
      }>;

      const nextLocale = customEvent.detail?.locale;

      if (nextLocale === "ar" || nextLocale === "en") {
        setLocale(nextLocale);
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

  const text = labels[locale];
  const isArabic = locale === "ar";
  const MainArrow = isArabic ? ArrowLeft : ArrowRight;

  return (
    <section
      id="final-cta"
      dir={isArabic ? "rtl" : "ltr"}
      className="w-full bg-[#07152E] text-white"
    >
      <div className="relative mx-auto w-full max-w-[1680px] overflow-hidden">
        <div className="grid lg:min-h-[275px] lg:grid-cols-[0.98fr_1.02fr]">
          <div className="relative order-2 h-[170px] overflow-hidden sm:h-[190px] md:h-[210px] lg:order-2 lg:h-auto lg:min-h-[275px]">
            <Image
              src="/images/cta/road-to-trophy.jpg"
              alt={text.imageAlt}
              fill
              priority
              sizes="(max-width: 1023px) 100vw, 51vw"
              className={`object-cover object-[center_35%] lg:object-center ${
                isArabic ? "" : "scale-x-[-1]"
              }`}
            />

            <div className="absolute inset-0 bg-gradient-to-t from-[#07152E]/40 via-transparent to-transparent lg:hidden" />

            <div
              className={`absolute inset-0 hidden lg:block ${
                isArabic
                  ? "bg-gradient-to-l from-[#07152E] via-[#07152E]/22 to-transparent"
                  : "bg-gradient-to-r from-[#07152E] via-[#07152E]/22 to-transparent"
              }`}
            />

            <div
              className={`absolute inset-y-0 hidden w-[38%] lg:block ${
                isArabic
                  ? "right-0 bg-gradient-to-l from-[#07152E] to-transparent"
                  : "left-0 bg-gradient-to-r from-[#07152E] to-transparent"
              }`}
            />

            <div
              className={`absolute bottom-5 hidden h-[48px] w-[48px] rotate-[-45deg] items-center justify-center rounded-full border border-[#F7B548]/45 bg-[#07152E]/90 text-[#F7B548] shadow-[0_0_30px_rgba(247,181,72,0.22)] backdrop-blur-md lg:flex ${
                isArabic ? "right-28" : "left-28"
              }`}
            >
              <Compass size={24} />
            </div>

            {/* Mobile buttons over image */}
            <div
  className={`absolute top-2 z-20 flex flex-col gap-1.5 sm:top-3 lg:hidden ${
    isArabic
      ? "right-3 sm:right-4"
      : "left-3 sm:left-4"
  }`}
>
              <AuthLink href="/dashboard">
                <button
                  type="button"
                  className="flex h-[34px] min-w-[124px] items-center justify-center gap-2 rounded-xl bg-[#F7B548] px-3 text-[10px] font-black text-[#07152E] shadow-[0_8px_20px_rgba(247,181,72,0.22)] transition duration-300 hover:-translate-y-0.5"
                >
                  {text.start}
                  <MainArrow size={14} />
                </button>
              </AuthLink>

              <AuthLink href="/career-path/road-design">
                <button
                  type="button"
                  className="flex h-[34px] min-w-[124px] items-center justify-center gap-2 rounded-xl border border-white/30 bg-[#07152E]/72 px-3 text-[10px] font-black text-white backdrop-blur-md transition duration-300 hover:border-[#F7B548]/70 hover:bg-[#07152E]/90"
                >
                  {text.explore}
                  <Compass size={14} />
                </button>
              </AuthLink>
            </div>

            <div
              className={`absolute top-3 flex items-center gap-1.5 rounded-full border border-[#F7B548]/30 bg-[#07152E]/78 px-3 py-1.5 text-[9px] font-black text-[#F7B548] backdrop-blur-md sm:top-4 sm:text-[10px] lg:top-10 lg:px-4 lg:text-[11px] ${
  isArabic
    ? "left-3 top-2 bottom-auto sm:left-4 sm:top-3 lg:bottom-auto lg:left-5 lg:top-10"
    : "right-3 top-2 bottom-auto sm:right-4 sm:top-3 lg:bottom-auto lg:left-auto lg:right-5 lg:top-10"
}`}
            >
              <Award size={14} />
              {text.destination}
            </div>
          </div>

          <div
            className={`relative z-20 order-1 flex flex-col justify-center px-4 py-3 sm:px-6 sm:py-4 lg:order-1 lg:px-8 lg:py-6 xl:px-10 ${
              isArabic ? "text-right" : "text-left"
            }`}
          >
            <h2
              className={`font-black leading-[1.08] ${
                isArabic
                  ? "text-[29px] sm:text-[34px] lg:text-[35px]"
                  : "text-[25px] sm:text-[30px] lg:text-[33px]"
              }`}
            >
              <span className="text-white">{text.title}</span>
              <span
                className={`text-[#F7B548] ${
                  isArabic ? "mr-2" : "ml-2"
                }`}
              >
                {text.titleAccent}
              </span>
            </h2>

            <p
              className={`mt-2 max-w-[650px] font-medium text-slate-300 ${
                isArabic
                  ? "text-[12px] leading-6 sm:text-[13px] lg:text-[14px]"
                  : "text-[11px] leading-[1.7] sm:text-[12px] lg:text-[13px]"
              }`}
            >
              {text.description}
            </p>

            <div className="mt-8 hidden flex-wrap items-center gap-3 lg:flex">
              <AuthLink href="/dashboard">
                <button
                  type="button"
                  className="flex h-[46px] items-center justify-center gap-2 rounded-xl bg-[#F7B548] px-6 text-[14px] font-black text-[#07152E] shadow-[0_10px_24px_rgba(247,181,72,0.22)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_14px_30px_rgba(247,181,72,0.32)]"
                >
                  {text.start}
                  <MainArrow size={16} />
                </button>
              </AuthLink>

              <AuthLink href="/career-path/road-design">
                <button
                  type="button"
                  className="flex h-[46px] items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/5 px-6 text-[14px] font-black text-white backdrop-blur-sm transition duration-300 hover:border-[#F7B548]/60 hover:bg-white/10"
                >
                  {text.explore}
                  <Compass size={16} />
                </button>
              </AuthLink>
            </div>
          </div>
        </div>

        <div className="relative z-30 grid grid-cols-3 border-t border-white/10 bg-[#06132A]/96">
          <BottomItem
            icon={<Sparkles size={18} />}
            title={text.freeTitle}
            description={text.freeText}
            isArabic={isArabic}
            border
          />
          <BottomItem
            icon={<Crosshair size={18} />}
            title={text.goalTitle}
            description={text.goalText}
            isArabic={isArabic}
            border
          />
          <BottomItem
            icon={<Award size={18} />}
            title={text.applyTitle}
            description={text.applyText}
            isArabic={isArabic}
          />
        </div>

        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[#F7B548]/10 blur-3xl" />
      </div>
    </section>
  );
}

function BottomItem({
  icon,
  title,
  description,
  isArabic,
  border = false,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  isArabic: boolean;
  border?: boolean;
}) {
  return (
    <div
      className={`flex min-h-[58px] items-center justify-center gap-1.5 px-1.5 py-2 sm:min-h-[64px] sm:gap-2.5 sm:px-3 lg:min-h-[70px] lg:gap-3 lg:px-4 ${
        border
          ? isArabic
            ? "border-l border-white/10"
            : "border-r border-white/10"
          : ""
      }`}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#F7B548]/25 bg-[#F7B548]/10 text-[#F7B548] sm:h-9 sm:w-9 lg:h-10 lg:w-10">
        {icon}
      </div>

      <div className={`min-w-0 ${isArabic ? "text-right" : "text-left"}`}>
        <p
          className={`font-black text-white ${
            isArabic
              ? "text-[9px] sm:text-[11px] lg:text-[15px]"
              : "text-[8px] sm:text-[10px] lg:text-[13px]"
          }`}
        >
          {title}
        </p>

        <p
          className={`mt-0.5 line-clamp-2 font-medium text-slate-400 ${
            isArabic
              ? "text-[6.5px] leading-[1.35] sm:text-[8px] lg:text-[11px]"
              : "text-[6px] leading-[1.3] sm:text-[7.5px] lg:text-[10px]"
          }`}
        >
          {description}
        </p>
      </div>
    </div>
  );
}