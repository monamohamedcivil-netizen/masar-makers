"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

type Locale = "ar" | "en";

type LocalizedText = {
  ar: string;
  en: string;
};

type Partner = {
  name: string;
  logo: string;
  description: LocalizedText;
};

const labels = {
  ar: {
    title: "شراكات تدعم جودة الرحلة",
    description:
      "نتعاون مع جهات تقنية ومهنية تساعدنا على تقديم محتوى أكثر دقة، وتوفير تجربة تعلم مرتبطة بمتطلبات السوق والأدوات المستخدمة في المشاريع الحقيقية.",
    discover: "تعرف على شركائنا",
    tech: "جهات تقنية متخصصة",
    expertise: "محتوى مدعوم بخبرة عملية",
    development: "تطوير مستمر للرحلات",
  },
  en: {
    title: "Partnerships That Support Quality Learning",
    description:
      "We collaborate with technical and professional organizations to deliver more accurate content and provide learning experiences connected to market needs and real engineering practice.",
    discover: "Meet Our Partners",
    tech: "Specialized Technical Partners",
    expertise: "Practice-Driven Content",
    development: "Continuous Journey Development",
  },
} as const;

const partners: Partner[] = [
  {
    name: "Masar Makers",
    logo: "/images/logo/masar-makers-mark.png",
    description: {
      ar: "مجتمع مهني يجمع المهندسين والمدربين والخبراء داخل رحلات تطبيقية متكاملة.",
      en: "A professional community connecting engineers, trainers, and experts through integrated practical learning journeys.",
    },
  },
  {
    name: "Civil Survey Applications",
    logo: "/images/partners/csa.png",
    description: {
      ar: "دعم تقني وتدريبي لرحلات Civil Site Design وتوفير فرص تقييم البرنامج للمتدربين.",
      en: "Technical and training support for Civil Site Design journeys, including software evaluation opportunities for trainees.",
    },
  },
  {
    name: "Australian Design Company",
    logo: "/images/partners/australian.png",
    description: {
      ar: "شركة استشارات هندسية تدعم تبادل الخبرات وربط التدريب بالممارسات المهنية والمشاريع الواقعية.",
      en: "An engineering consultancy supporting knowledge exchange and linking training with professional practice and real projects.",
    },
  },
  {
    name: "Present Trade",
    logo: "/images/partners/present-trade.png",
    description: {
      ar: "دعم المتدربين في الشرق الأوسط وتسهيل الوصول إلى النسخ التجريبية وخيارات الترخيص.",
      en: "Supporting trainees across the Middle East with easier access to trial versions and licensing options.",
    },
  },
];

export default function Partners() {
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
  const DiscoverArrow = isArabic ? ArrowLeft : ArrowRight;

  return (
    <section
      id="partners"
      dir={isArabic ? "rtl" : "ltr"}
      className="w-full bg-[#F7F8FA] px-3 py-3 sm:px-4 lg:px-5"
    >
      <div className="mx-auto max-w-[1680px]">
        {/* 5 columns = Intro + 4 partners */}
        <div className="grid gap-3 xl:grid-cols-[1.45fr_repeat(4,minmax(0,0.8875fr))]">
          {/* Main message */}
          <div className="relative -mx-3 flex min-h-[150px] w-[calc(100%+1.5rem)] flex-col overflow-hidden rounded-none bg-[#07152E] px-5 py-3 text-white shadow-[0_18px_45px_rgba(7,21,46,0.15)] sm:-mx-4 sm:w-[calc(100%+2rem)] sm:min-h-[135px] sm:px-6 sm:py-3 xl:mx-0 xl:min-h-[235px] xl:w-full xl:rounded-[24px] xl:p-5">
            <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-[#F7B548]/16 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 left-8 h-44 w-44 rounded-full bg-white/10 blur-3xl" />

            <div className="relative z-10 flex h-full flex-col">
              <div
  dir={isArabic ? "rtl" : "ltr"}
  className="flex items-center justify-start gap-3"
>
  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#F7B548]/35 bg-[#F7B548]/10 text-[#F7B548] xl:h-12 xl:w-12">
    <ShieldCheck size={22} />
  </div>

  <h3
    className={`font-black leading-tight ${
      isArabic
        ? "text-[22px] xl:text-[23px]"
        : "text-[20px] xl:text-[21px]"
    }`}
  >
    {text.title}
  </h3>
</div>

              <p
                className={`mt-2.5 font-medium text-slate-300 ${
                  isArabic
                    ? "text-[13px] leading-6 xl:text-[13px]"
                    : "text-[12px] leading-[1.65] xl:text-[12px]"
                }`}
              >
                {text.description}
              </p>

              <div
                className={`mt-auto sm:mt-0 flex items-center gap-2 pt-3 ${
                  isArabic ? "justify-end" : "justify-start"
                }`}
              >
                <span className="text-[14px] font-black tracking-wide text-[#F7B548] xl:text-[13px]">
                  {text.discover}
                </span>

                <DiscoverArrow className="h-4 w-4 text-[#F7B548]" />
              </div>
            </div>
          </div>

          {/* Partner cards */}
          <div className="grid grid-cols-4 gap-2 xl:contents">
          {partners.map((partner) => (
            <article
              key={partner.name}
              className="group relative flex min-h-[148px] flex-col overflow-hidden rounded-[16px] border border-[#DCE3EC] bg-white p-2 text-center shadow-[0_10px_24px_rgba(7,21,46,0.05)] transition-all duration-500 hover:-translate-y-1 hover:border-[#F7B548]/65 hover:shadow-[0_16px_34px_rgba(7,21,46,0.09)] sm:min-h-[165px] sm:rounded-[18px] sm:p-2.5 xl:min-h-[225px] xl:rounded-[22px] xl:p-3.5"
            >
              <div className="pointer-events-none absolute -left-12 -top-12 h-28 w-28 rounded-full bg-[#F7B548]/0 blur-3xl transition duration-500 group-hover:bg-[#F7B548]/13" />

              <div className="relative z-10 mx-auto flex h-[58px] w-full items-center justify-center py-1 sm:h-[50px] xl:h-[82px] xl:py-2">
                <Image
                  src={partner.logo}
                  alt={partner.name}
                  width={180}
                  height={90}
                  sizes="180px"
                  className="max-h-[52px] max-w-[92px] object-contain transition-all duration-500 group-hover:-translate-y-1 group-hover:scale-105 sm:max-h-[60px] sm:max-w-[110px] xl:max-h-[72px] xl:max-w-[150px]"
                />
              </div>

              <div className="relative z-10 mt-3">
                <h3 className="line-clamp-2 text-[9px] font-black leading-tight text-[#07152E] sm:text-[12px] xl:text-[15px]">
                  {partner.name}
                </h3>

                <div className="mx-auto mt-1.5 h-[2px] w-6 rounded-full bg-[#F7B548] transition-all duration-500 group-hover:w-10 xl:mt-2 xl:h-[3px] xl:w-9 xl:group-hover:w-14" />

                <p
                  className={`mt-3 font-bold text-slate-600 ${
                    isArabic
                      ? "text-[13px] leading-6 xl:text-[13px]"
                      : "text-[12px] leading-[1.65] xl:text-[12px]"
                  }`}
                >
                  {partner.description[locale]}
                </p>
              </div>
            </article>
          ))}
          </div>
        </div>

        {/* Trust strip */}
        <div className="mt-2.5 grid grid-cols-3 gap-3 rounded-[20px] border border-[#E0E6EE] bg-white px-5 py-2 text-center shadow-[0_8px_24px_rgba(7,21,46,0.04)]">
          <div className="flex items-center justify-center gap-3">
            <Building2 size={23} className="text-[#D49319]" />
            <span
              className={`font-black text-[#07152E] ${
                isArabic
                  ? "text-[15px]"
                  : "text-[13px]"
              }`}
            >
              {text.tech}
            </span>
          </div>

          <div className="flex items-center justify-center gap-3">
            <ShieldCheck size={23} className="text-[#D49319]" />
            <span
              className={`font-black text-[#07152E] ${
                isArabic
                  ? "text-[15px]"
                  : "text-[13px]"
              }`}
            >
              {text.expertise}
            </span>
          </div>

          <div className="flex items-center justify-center gap-3">
            <Sparkles size={23} className="text-[#D49319]" />
            <span
              className={`font-black text-[#07152E] ${
                isArabic
                  ? "text-[15px]"
                  : "text-[13px]"
              }`}
            >
              {text.development}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}