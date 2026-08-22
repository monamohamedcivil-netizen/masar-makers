import Image from "next/image";
import { Award, GraduationCap } from "lucide-react";

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
      sm:px-6 sm:py-3

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

      {/* Statistics */}
      <div
  className="
    mx-auto
    max-w-[1400px]
    space-y-1
    px-2
    pt-1

    sm:space-y-1.5
    sm:px-6
    sm:pt-1.5

    lg:px-8
  "
>
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
    </section>
  );
}