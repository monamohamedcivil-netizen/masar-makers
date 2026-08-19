"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  FolderKanban,
  Route,
} from "lucide-react";

type Locale = "ar" | "en";

const content = {
  ar: {
    badge: "منهجية تعلم مختلفة",
    title: "دوراتنا ليست مجرد شرح أدوات",
    titleAccent: "بل رحلة لبناء مهندس محترف",
    description:
      "في صناع المسار نربط المعرفة بالتطبيق، ونرتب المهارات داخل رحلة واضحة تساعدك على تنفيذ مشاريع حقيقية وبناء مسيرتك المهنية بثقة.",
    button: "تعرف علينا أكثر",
    features: [
      {
        number: "01",
        title: "رحلة واضحة ومتكاملة",
        description:
          "تتعلم من خلال مسار مهني مرتب يقودك خطوة بخطوة من الأساسيات إلى مستوى احترافي واضح.",
        icon: Route,
      },
      {
        number: "02",
        title: "تطبيق عملي حقيقي",
        description:
          "لا تكتفي بمشاهدة الشرح، بل تطبق المهارات على تمارين ومشاريع تحاكي متطلبات العمل الفعلية.",
        icon: FolderKanban,
      },
      {
        number: "03",
        title: "منهجية احترافية",
        description:
          "تتعلم طريقة التفكير وإدارة خطوات التصميم، وليس مجرد استخدام أدوات وأوامر البرامج الهندسية.",
        icon: ChartNoAxesCombined,
      },
      {
        number: "04",
        title: "بناء مسيرتك المهنية",
        description:
          "تجمع مشاريعك وشهاداتك وإنجازاتك في رحلة واحدة تساعدك على إظهار تطورك ومستواك المهني.",
        icon: BriefcaseBusiness,
      },
    ],
  },
  en: {
    badge: "A Different Learning Methodology",
    title: "Our courses are more than software tools",
    titleAccent: "they are a journey to build a professional engineer",
    description:
      "At Masar Makers, we connect knowledge with real application and organize skills into a clear learning journey that helps you deliver real projects and build your professional career with confidence.",
    button: "Learn More About Us",
    features: [
      {
        number: "01",
        title: "A Clear, Integrated Journey",
        description:
          "Learn through a structured professional path that guides you step by step from the fundamentals to a clear professional level.",
        icon: Route,
      },
      {
        number: "02",
        title: "Real Practical Application",
        description:
          "Go beyond watching explanations by applying your skills through exercises and projects that reflect real work requirements.",
        icon: FolderKanban,
      },
      {
        number: "03",
        title: "Professional Methodology",
        description:
          "Learn how to think and manage the design process, not just how to use engineering software tools and commands.",
        icon: ChartNoAxesCombined,
      },
      {
        number: "04",
        title: "Build Your Professional Career",
        description:
          "Bring your projects, certificates, and achievements together in one journey that demonstrates your growth and professional level.",
        icon: BriefcaseBusiness,
      },
    ],
  },
} as const;

export default function WhyMasar() {
  const [locale, setLocale] = useState<Locale>("ar");

  const text = content[locale];
  const isArabic = locale === "ar";
  const ButtonArrow = isArabic ? ArrowLeft : ArrowRight;

  useEffect(() => {
    const savedLocale = window.localStorage.getItem(
      "masar-locale"
    ) as Locale | null;

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

    return () => {
      window.removeEventListener("masar:locale-change", handleLocaleChange);
    };
  }, []);

  return (
   <section
  id="why-masar"
  dir={isArabic ? "rtl" : "ltr"}
  className="w-full bg-[#F7F8FA] pb-2 sm:pb-2.5 lg:pb-3"
>
      {/* Main statement - full width */}
      <div className="relative mt-0 mb-2.5 w-full overflow-hidden bg-[#07152E] py-4 text-white shadow-[0_18px_45px_rgba(7,21,46,0.16)] lg:mb-3">
        {/* Decorative lighting */}
        <div className="pointer-events-none absolute -right-14 -top-20 h-48 w-48 rounded-full bg-[#F7B548]/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-20 h-52 w-52 rounded-full bg-white/10 blur-3xl" />

        {/* Inner content aligned exactly with cards */}
        <div className="relative z-10 mx-auto max-w-[1580px] px-3 sm:px-4 md:px-5 lg:px-6">
          <div className="flex items-center justify-between gap-3 sm:gap-4 lg:gap-8">
            <div
              className={`min-w-0 flex-1 max-w-[980px] ${
                isArabic ? "text-right" : "text-left"
              }`}
            >
              <span className="inline-flex rounded-full border border-[#F7B548]/40 bg-[#F7B548]/10 px-3 py-1 text-[10px] font-black text-[#F7B548] sm:px-4 sm:py-1.5 sm:text-[11px] lg:text-[12px]">
                {text.badge}
              </span>

              <h3
                className={`mt-1.5 font-black ${
                  isArabic
                    ? "text-[17px] leading-[1.3] sm:text-[19px] md:text-[21px] lg:text-[23px] xl:text-[25px]"
                    : "text-[14px] leading-[1.3] sm:text-[16px] md:text-[18px] lg:text-[20px] xl:text-[22px]"
                }`}
              >
                {text.title}
                <span
                  className={`text-[#F7B548] ${
                    isArabic ? "mr-2" : "ml-2"
                  }`}
                >
                  {text.titleAccent}
                </span>
              </h3>

              <p
                className={`mt-1 max-w-[900px] font-medium text-slate-300 ${
                  isArabic
                    ? "text-[11px] leading-[1.55] sm:text-[12px] lg:text-[13px]"
                    : "text-[9.5px] leading-[1.5] sm:text-[10.5px] md:text-[11px] lg:text-[12px] xl:text-[13px]"
                }`}
              >
                {text.description}
              </p>
            </div>

            <Link
              href="/about"
              className="flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#F7B548] px-3 py-2 text-[9.5px] font-black text-[#07152E] shadow-[0_10px_24px_rgba(247,181,72,0.2)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_14px_30px_rgba(247,181,72,0.3)] sm:gap-2 sm:px-4 sm:py-2.5 sm:text-[10.5px] md:text-[11px] lg:rounded-2xl lg:px-5 lg:text-[13px] xl:px-6 xl:text-[14px]"
            >
              {text.button}
              <ButtonArrow className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-[17px] lg:w-[17px]" />
            </Link>
          </div>
        </div>
      </div>

      {/* Feature cards */}
      <div className="mx-auto max-w-[1580px] px-3 sm:px-4 md:px-5 lg:px-6">
<div className="grid grid-cols-2 gap-2 sm:gap-2 lg:gap-2.5 xl:grid-cols-4 xl:gap-3">          {text.features.map((feature) => {
            const Icon = feature.icon;

            return (
              <article
                key={feature.number}
                className={`group relative flex min-h-[118px] flex-col overflow-hidden rounded-[18px] border border-[#DCE3EC] bg-white p-3 shadow-[0_12px_32px_rgba(7,21,46,0.06)] transition-all duration-500 hover:-translate-y-1 hover:border-[#F7B548]/60 hover:shadow-[0_18px_42px_rgba(7,21,46,0.11)] sm:min-h-[120px] sm:rounded-[20px] sm:p-3.5 md:min-h-[124px] lg:min-h-[128px] lg:p-3.5 xl:min-h-[132px] xl:rounded-[22px] ${
                  isArabic ? "text-right" : "text-left"
                }`}
              >
                {/* Hover glow */}
                <div className="pointer-events-none absolute -left-14 -top-14 h-32 w-32 rounded-full bg-[#F7B548]/0 blur-3xl transition duration-500 group-hover:bg-[#F7B548]/16" />

                {/* Icon + title + number in one row */}
                <div className="relative z-10 flex items-center justify-between gap-2.5">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#F7B548]/35 bg-[#FFF8E8] text-[#D49319] transition duration-500 group-hover:scale-110 group-hover:bg-[#F7B548] group-hover:text-[#07152E] sm:h-10 sm:w-10">
                      <Icon
                        className="h-[18px] w-[18px] sm:h-5 sm:w-5"
                        strokeWidth={2}
                      />
                    </div>

                    <h3 className="min-w-0 text-[14px] font-black leading-snug text-[#07152E] sm:text-[15px] lg:text-[16px] xl:text-[17px]">
                      {feature.title}
                    </h3>
                  </div>

                  <span className="shrink-0 text-[24px] font-black leading-none text-[#07152E]/7 transition duration-500 group-hover:text-[#F7B548]/30 sm:text-[26px] xl:text-[28px]">
                    {feature.number}
                  </span>
                </div>

                <div className="relative z-10 mt-1.5">
                  <div className="h-[2.5px] w-9 rounded-full bg-[#F7B548] transition-all duration-500 group-hover:w-14" />

                  <p className="mt-1.5 text-[10.5px] font-medium leading-[1.5] text-slate-600 sm:text-[11px] lg:text-[11.5px] xl:text-[12px]">
                    {feature.description}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}