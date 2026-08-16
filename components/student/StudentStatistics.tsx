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

  const safeProgress = Math.max(
    0,
    Math.min(100, progressPercent),
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
            items-center gap-8
            px-8 py-3
            text-white
          "
        >
          {/* Current level */}
          <div className="min-w-0 text-right">
            <p className="text-[12px] font-bold text-white/65">
              مستواك الحالي
            </p>

            <p className="mt-0.5 text-[22px] font-black text-[#F7B548]">
              {levelMeta[resolvedLevel].label}
            </p>

            {nextLevel ? (
              <p className="mt-0.5 text-[12px] font-bold text-white/65">
                المستوى التالي: {nextLevel}
              </p>
            ) : (
              <p className="mt-0.5 text-[12px] font-bold text-emerald-300">
                وصلت إلى أعلى مستوى
              </p>
            )}
          </div>

          {/* Level badge */}
          <div className="flex min-w-[150px] flex-col items-center justify-center">
            <div className="relative h-[105px] w-[105px] sm:h-[115px] sm:w-[115px]">
              <Image
                src={levelMeta[resolvedLevel].badge}
                alt={`شارة مستوى ${levelMeta[resolvedLevel].label}`}
                fill
                sizes="115px"
                className="object-contain drop-shadow-[0_8px_12px_rgba(0,0,0,0.24)]"
                priority
              />
            </div>
          </div>

          {/* Progress */}
          <div
            className="w-[300px] justify-self-end"
            dir="rtl"
          >
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <span className="text-[12px] font-black text-white/85">
                التقدم للمستوى التالي
              </span>

              <span className="text-[13px] font-black text-[#F7B548]">
                {safeProgress}%
              </span>
            </div>

            <div className="h-2 w-full overflow-hidden bg-white/15">
              <div
                className="h-full bg-[#F7B548] transition-all duration-500"
                style={{
                  width: `${safeProgress}%`,
                }}
              />
            </div>

            <p className="mt-1.5 text-left text-[11px] font-black text-white/80">
              {nextLevel
                ? `${pointsToNextLevel} نقطة متبقية`
                : "استمر في إنجاز المزيد"}
            </p>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="mx-auto max-w-[1400px] space-y-1.5 px-3 pt-1.5 sm:px-6 lg:px-8">
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