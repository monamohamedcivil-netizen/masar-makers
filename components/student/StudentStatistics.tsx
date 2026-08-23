"use client";

import Image from "next/image";
import { useState } from "react";
import {
  Award,
  BarChart3,
  ChevronDown,
  GraduationCap,
} from "lucide-react";
import StatisticGroup from "@/components/student/StatisticGroup";
import type { StudentStatisticsData } from "@/components/student/mockStatistics";

type StudentStatisticsProps = {
  data: StudentStatisticsData;
  currentLevel?: string | null;
  nextLevel?: string | null;
  progressPercent?: number;
  pointsToNextLevel?: number;
};

export default function StudentStatistics({
  data,
  currentLevel,
  nextLevel,
  progressPercent = 0,
  pointsToNextLevel = 0,
}: StudentStatisticsProps) {
  const [statisticsOpen, setStatisticsOpen] =
    useState(false);

  const levelMeta = {
    Explorer: {
      label: "Explorer",
      badge: "/images/badges/explorer.png",
    },
    Professional: {
      label: "Professional",
      badge: "/images/badges/professional.png",
    },
    Expert: {
      label: "Expert",
      badge: "/images/badges/expert.png",
    },
    Mentor: {
      label: "Mentor",
      badge: "/images/badges/mentor.png",
    },
  } as const;

  const resolvedLevel =
    currentLevel && currentLevel in levelMeta
      ? (currentLevel as keyof typeof levelMeta)
      : "Explorer";

  const safeProgress = Math.round(
  Math.max(0, Math.min(100, progressPercent))
);

  return (
    <section className="border-b border-[#DCE2EA] bg-[#CDD8E6] pb-1.5">
      {/* Full-width Level Bar */}
<div className="w-full bg-[#07152E]">
  <div
    dir="rtl"
    className="
      mx-auto
      grid max-w-[1680px]
      grid-cols-[1fr_auto_1fr]
      items-center
      gap-2
      px-3 py-2
      text-white

      sm:gap-5
      sm:px-6 sm:py-1

      lg:gap-8
      lg:px-8
    "
  >
    {/* Current level */}
    <div className="min-w-0 text-right">
      <p className="text-[9px] font-bold text-white/65 sm:text-[11px] lg:text-[12px]">
        مستواك الحالي
      </p>

      <p className="mt-0.5 truncate text-[14px] font-black text-[#F7B548] sm:text-[18px] lg:text-[22px]">
        {levelMeta[resolvedLevel].label}
      </p>

      {nextLevel ? (
        <p className="mt-0.5 text-[8px] font-bold leading-tight text-white/65 sm:text-[10px] lg:text-[12px]">
          المستوى التالي: {nextLevel}
        </p>
      ) : (
        <p className="mt-0.5 text-[8px] font-bold text-emerald-300 sm:text-[10px] lg:text-[12px]">
          وصلت إلى أعلى مستوى
        </p>
      )}
    </div>

    {/* Level badge */}
    <div className="flex items-center justify-center">
      <div
        className="
          relative
          h-[64px] w-[64px]

          sm:h-[85px] sm:w-[85px]

          lg:h-[105px] lg:w-[105px]
          xl:h-[115px] xl:w-[115px]
        "
      >
        <Image
          src={levelMeta[resolvedLevel].badge}
          alt={`شارة مستوى ${levelMeta[resolvedLevel].label}`}
          fill
          sizes="(max-width: 640px) 64px, 115px"
          className="object-contain drop-shadow-[0_6px_10px_rgba(0,0,0,0.24)]"
          priority
        />
      </div>
    </div>

    {/* Progress */}
    <div
      className="
        min-w-0
        w-full
        max-w-[120px]
        justify-self-end

        sm:max-w-[210px]
        lg:w-[300px]
        lg:max-w-none
      "
      dir="rtl"
    >
      <div className="mb-1 flex items-center justify-between gap-1 sm:gap-3">
        <span className="text-[8px] font-black leading-tight text-white/85 sm:text-[10px] lg:text-[12px]">
          التقدم للمستوى التالي
        </span>

        <span className="text-[9px] font-black text-[#F7B548] sm:text-[11px] lg:text-[13px]">
          {safeProgress}%
        </span>
      </div>

      <div className="h-1.5 w-full overflow-hidden bg-white/15 lg:h-2">
        <div
          className="h-full bg-[#F7B548] transition-all duration-500"
          style={{
            width: `${safeProgress}%`,
          }}
        />
      </div>

      <p className="mt-1 text-left text-[7px] font-black text-white/80 sm:text-[9px] lg:mt-1.5 lg:text-[11px]">
        {nextLevel
          ? `${pointsToNextLevel} نقطة متبقية`
          : "استمر في إنجاز المزيد"}
      </p>
    </div>
  </div>
</div>

     {/* One compact toggle for all statistics */}
  
   <div
  className="
    mx-auto
    max-w-[1680px]
    px-3
    sm:px-6
    lg:px-8
  "
  dir="rtl"
>
  <div
    className="
     flex
items-center
justify-start
py-1.5
    "
  >
    <button
      type="button"
      onClick={() =>
        setStatisticsOpen(
          (current) => !current,
        )
      }
      aria-expanded={statisticsOpen}
      className="
        inline-flex
        translate-y-[2px]
        items-center
        gap-2
bg-transparent
px-0
py-0
        text-[#07152E]
        transition-colors
        hover:text-[#D49319]
      "
    >
      <BarChart3
        size={18}
        strokeWidth={2}
        className="
          shrink-0
          text-[#D49319]
          sm:h-[20px]
          sm:w-[20px]
        "
      />

      <span
        className="
          text-[12px]
font-black

sm:text-[14px]
        "
      >
        إحصائيات رحلاتي التعليمية
      </span>

      <ChevronDown
        size={16}
        strokeWidth={2}
        className={[
          "shrink-0 transition-transform duration-300",
          statisticsOpen
            ? "rotate-180"
            : "rotate-0",
        ].join(" ")}
      />
    </button>
  </div>

  <div
    className={[
      "grid transition-all duration-300 ease-in-out",
      statisticsOpen
        ? "mt-2 grid-rows-[1fr] opacity-100"
        : "grid-rows-[0fr] opacity-0",
    ].join(" ")}
  >
        <div
          className={[
            "grid transition-all duration-300 ease-in-out",
            statisticsOpen
              ? "mt-2 grid-rows-[1fr] opacity-100"
              : "grid-rows-[0fr] opacity-0",
          ].join(" ")}
        >
          <div className="overflow-hidden">
            <div className="space-y-1 sm:space-y-1.5">
              <StatisticGroup
                title="إحصائيات رحلاتي التعليمية"
                icon={GraduationCap}
                items={data.learning}
              />

              <StatisticGroup
                title="إحصائيات الإنجاز"
                icon={Award}
                items={data.achievements}
              />
            </div>
          </div>
        </div>
      </div>
       </div>
    </section>
  );
}