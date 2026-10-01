"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  BookOpen,
  Clock3,
  FolderKanban,
  GraduationCap,
} from "lucide-react";

import PathSwitcher from "@/components/career-paths/PathSwitcher";
import PathRoadmap from "@/components/career-paths/PathRoadmap";
import type { Course } from "@/data/types";

type Locale = "ar" | "en";

type CareerPathClientContentProps = {
  activeSlug: string;
  pathTitle: string;
  pathDescription?: string | null;
  heroImage: string;
  roadmapCoursesAr: Course[];
  roadmapCoursesEn: Course[];
  totalStations: number;
  totalJourneys: number;
  totalTrainingHours: number;
};

const labels = {
  ar: {
    stations: "محطات تعليمية",
    journeys: "رحلات تدريبية",
    trainingContent: "محتوى تدريبي",
    level: "المستوى",
    professional: "احترافي",
    hours: "ساعة",
    heroFallback: "رحلة تعليمية متكاملة تقودك إلى مستوى احترافي.",
  },
  en: {
    stations: "Learning Stations",
    journeys: "Training Journeys",
    trainingContent: "Training Content",
    level: "Level",
    professional: "Professional",
    hours: "Hours",
    heroFallback:
      "An integrated learning journey that leads you to a professional level.",
  },
} as const;

export default function CareerPathClientContent({
  activeSlug,
  pathTitle,
  pathDescription,
  heroImage,
  roadmapCoursesAr,
  roadmapCoursesEn,
  totalStations,
  totalJourneys,
  totalTrainingHours,
}: CareerPathClientContentProps) {
  const [locale, setLocale] = useState<Locale>("ar");

  useEffect(() => {
    const readLocale = () => {
      const savedLocale = window.localStorage.getItem("masar-locale");
      setLocale(savedLocale === "en" ? "en" : "ar");
    };

    readLocale();

    const handleLocaleChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ locale?: Locale }>;
      if (
        customEvent.detail?.locale === "ar" ||
        customEvent.detail?.locale === "en"
      ) {
        setLocale(customEvent.detail.locale);
        return;
      }
      readLocale();
    };

    window.addEventListener("masar:locale-change", handleLocaleChange);
    window.addEventListener("storage", readLocale);

    return () => {
      window.removeEventListener("masar:locale-change", handleLocaleChange);
      window.removeEventListener("storage", readLocale);
    };
  }, []);

  const isArabic = locale === "ar";
  const text = labels[locale];
  const roadmapCourses =
    locale === "en" ? roadmapCoursesEn : roadmapCoursesAr;

  return (
    <div dir={isArabic ? "rtl" : "ltr"}>
      <PathSwitcher activeSlug={activeSlug} locale={locale} />

      <section
        className="
          relative
          min-h-[118px]
          overflow-hidden
          bg-[#07152E]
          sm:min-h-[135px]
          lg:h-[140px]
          lg:min-h-0
        "
      >
        <Image
          src={heroImage}
          alt={pathTitle}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />

        <div
          className={`
            absolute inset-0
            ${
              isArabic
                ? "bg-gradient-to-l from-[#07152E]/95 via-[#07152E]/70 to-[#07152E]/30"
                : "bg-gradient-to-r from-[#07152E]/95 via-[#07152E]/70 to-[#07152E]/30"
            }
          `}
        />

        <div
          className="
            relative z-10
            mx-auto
            grid min-h-[118px]
            max-w-[1480px]
            grid-cols-[1.02fr_0.98fr]
            items-center
            gap-2
            px-3 py-2.5

            sm:min-h-[135px]
            sm:grid-cols-[1.08fr_0.92fr]
            sm:gap-4
            sm:px-5
            sm:py-3

            lg:h-full
            lg:min-h-0
            lg:grid-cols-[1.18fr_0.82fr]
            lg:gap-8
            lg:px-10
            lg:py-0
          "
        >
          <div className="min-w-0 text-start text-white">
            <h1
              className="
                text-[15px]
                font-black
                leading-[1.2]
                sm:text-[20px]
                lg:text-[34px]
              "
            >
              {pathTitle}
            </h1>

            <p
              className="
                mt-1
                line-clamp-2
                max-w-[700px]
                text-[7px]
                font-medium
                leading-3
                text-slate-200
                sm:text-[9px]
                sm:leading-4
                lg:mt-1.5
                lg:text-[12px]
                lg:leading-5
              "
            >
              {pathDescription ?? text.heroFallback}
            </p>
          </div>

          <div
            className="
              grid
              min-w-0
              grid-cols-2
              gap-x-1.5
              gap-y-2
              ps-1.5
              sm:gap-x-4
              sm:gap-y-3
              sm:ps-4
              lg:gap-x-8
              lg:gap-y-3
              lg:border-s
              lg:border-white/20
              lg:ps-6
            "
          >
            <PathStat
              icon={BookOpen}
              value={totalStations}
              label={text.stations}
            />
            <PathStat
              icon={FolderKanban}
              value={totalJourneys}
              label={text.journeys}
            />
            <PathStat
              icon={Clock3}
              value={totalTrainingHours > 0 ? `${totalTrainingHours}` : "—"}
              label={text.trainingContent}
              suffix={totalTrainingHours > 0 ? text.hours : undefined}
            />
            <PathStat
              icon={GraduationCap}
              value={text.professional}
              label={text.level}
              compactValue
            />
          </div>
        </div>
      </section>

      <section
        className="
          mx-auto
          max-w-[1480px]
          px-2.5
          py-2.5
          sm:px-4
          sm:py-3
          lg:px-10
          lg:py-4
        "
      >
        <PathRoadmap courses={roadmapCourses} locale={locale} />
      </section>
    </div>
  );
}

function PathStat({
  icon: Icon,
  value,
  label,
  suffix,
  compactValue = false,
}: {
  icon: typeof BookOpen;
  value: string | number;
  label: string;
  suffix?: string;
  compactValue?: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center gap-1 sm:gap-2 lg:gap-3">
      <Icon
        size={15}
        className="
          shrink-0
          text-[#F7B548]
          sm:h-[18px]
          sm:w-[18px]
          lg:h-[21px]
          lg:w-[21px]
        "
      />

      <div className="min-w-0">
        <p
          className={`
            truncate
            font-black
            leading-none
            text-white
            ${
              compactValue
                ? "text-[9px] sm:text-[12px] lg:text-[16px]"
                : "text-[11px] sm:text-[14px] lg:text-[16px]"
            }
          `}
        >
          {value}
          {suffix ? (
            <span className="ms-0.5 text-[6.5px] sm:text-[8px] lg:text-[10px]">
              {suffix}
            </span>
          ) : null}
        </p>

        <p
          className="
            mt-0.5
            line-clamp-2
            text-[5.5px]
            font-bold
            leading-[1.15]
            text-slate-200
            sm:text-[8px]
            sm:leading-3
            lg:mt-1
            lg:text-[11px]
          "
        >
          {label}
        </p>
      </div>
    </div>
  );
}
