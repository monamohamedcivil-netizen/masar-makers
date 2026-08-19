"use client";

import {
  Award,
  ChevronLeft,
  Sparkles,
  Ticket,
} from "lucide-react";
import Image from "next/image";
interface Level {
  name: string;
}

interface MasarPassportCardProps {
  CurrentLevelIcon: React.ComponentType<{
    size?: number;
    currentLevelName: string;
  }>;

  currentLevel: Level;

  nextLevel: Level | null;

  levelProgress: number;

  remainingPoints: number;

  totalPoints: number;

  monthlyDrawEntries: number;
  monthlyDrawWins: number;
  monthlyDrawAvailableEntries: number;

  onShowProgress: () => void;

  onShowDraw: () => void;
}

export default function MasarPassportCard({
  CurrentLevelIcon,
  currentLevel,
    nextLevel,
  levelProgress,
  remainingPoints,
  totalPoints,
  monthlyDrawEntries,
  monthlyDrawWins,
  monthlyDrawAvailableEntries,
  onShowProgress,
  onShowDraw,
}: MasarPassportCardProps) {
  const levelBadges: Record<string, string> = {
  Explorer: "/images/badges/explorer.png",
  Professional: "/images/badges/professional.png",
  Expert: "/images/badges/expert.png",
  Mentor: "/images/badges/mentor.png",
};

const currentBadge =
  levelBadges[currentLevel.name] ??
  levelBadges.Explorer;
  return (
<section className="relative w-full overflow-hidden rounded-b-[24px] border-x-0 border-y-0 border-b border-[#C9D2DE] bg-white shadow-[0_22px_55px_rgba(7,21,46,0.16),0_4px_12px_rgba(7,21,46,0.08)]">
      {/* Header attached directly to JourneyTabs */}
      <header className="flex items-center justify-between gap-3 bg-[#07152E] px-5 py-2 text-white sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <p className="shrink-0 text-[9px] font-black text-[#F7B548]">
            Masar Engineering Passport
          </p>

          <span className="hidden h-4 w-px bg-white/20 sm:block" />

          <div className="min-w-0">
            <h2 className="truncate text-[17px] font-black sm:text-[19px]">
              بطاقة إنجازاتك المهنية
            </h2>

            <p className="mt-0.5 truncate text-[8px] font-bold text-white/60">
              كل خطوة في مسيرتك المهنية تقربك من إنجاز جديد.
            </p>
          </div>
        </div>

        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F7B548] text-[#07152E]">
          <Award size={17} />
        </span>
      </header>

      <div className="grid md:grid-cols-3">

       {/* Current level */}
<article className="flex min-h-[175px] items-center justify-center border-b border-[#E2E7EE] px-4 py-2 text-center md:border-b-0 md:border-l">
  <div className="flex w-full max-w-[300px] items-center justify-center gap-5">

    {/* Level Badge */}
    <div className="relative h-[105px] w-[105px] shrink-0">
      <Image
        src={currentBadge}
        alt={`شارة مستوى ${currentLevel.name}`}
        fill
        sizes="105px"
        className="object-contain drop-shadow-[0_10px_18px_rgba(7,21,46,0.22)]"
      />
    </div>

    {/* Level Info */}
    <div className="min-w-0 flex-1 text-right">
      <p className="text-[10px] font-black text-slate-400">
        مستواك الحالي
      </p>

      <h3 className="mt-0.5 text-[20px] font-black leading-6 text-[#07152E]">
        {currentLevel.name}
      </h3>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-[#F7B548]"
          style={{
            width: `${levelProgress}%`,
          }}
        />
      </div>

      <p className="mt-1.5 text-[9px] font-bold text-slate-500">
        {nextLevel
          ? `${remainingPoints} نقطة للوصول إلى ${nextLevel.name}`
          : "وصلت إلى أعلى مستوى"}
      </p>
    </div>

  </div>
</article>

        {/* Points */}
        <article className="flex min-h-[175px] items-center justify-center border-b border-[#E2E7EE] px-4 py-2 text-center md:border-b-0 md:border-l">
          <div>
            <div className="flex items-center justify-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FFF5DD] text-[#C88712]">
                <Sparkles size={16} />
              </span>

              <div className="text-right">
                <p className="text-[8px] font-black text-slate-400">
                  نقاطك الحالية
                </p>

                <p className="text-[23px] font-black leading-6 text-[#07152E]">
                  {totalPoints.toLocaleString(
                    "en-US",
                  )}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onShowProgress}
              className="mt-2 inline-flex h-7 items-center gap-1.5 rounded-lg bg-[#07152E] px-3 text-[8px] font-black text-white transition hover:bg-[#F7B548] hover:text-[#07152E]"
            >
              عرض تفاصيل تقدمي
              <ChevronLeft size={11} />
            </button>
          </div>
        </article>

        {/* Monthly draw */}
        <article className="flex min-h-[175px] items-center justify-center px-4 py-2 text-center">
          <div>
            <div className="flex items-center justify-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FFF5DD] text-[#C88712]">
                <Ticket size={15} />
              </span>

              <div className="text-right">
                <p className="text-[8px] font-black text-slate-400">
                  فرص السحب الشهري
                </p>

                <p className="text-[23px] font-black leading-6 text-[#07152E]">
                  {monthlyDrawAvailableEntries}
                </p>
              </div>
            </div>

            <p className="mt-1 text-[8px] font-bold text-slate-500">
              الحالية {monthlyDrawAvailableEntries}
              {" / "}
              مرات الفوز {monthlyDrawWins}
              {" / "}
              إجمالي الفرص {monthlyDrawEntries}
            </p>

            <div className="mt-1.5 flex items-center justify-center gap-2">
              <p className="text-[8px] font-bold text-slate-500">
                كل 100 نقطة = فرصة واحدة
              </p>

              <button
                type="button"
                onClick={onShowDraw}
                className="inline-flex h-7 items-center gap-1.5 rounded-lg bg-[#F7B548] px-3 text-[8px] font-black text-[#07152E] transition hover:bg-[#07152E] hover:text-white"
              >
                عرض السحب
                <ChevronLeft size={11} />
              </button>
            </div>
          </div>
        </article>

      </div>

    </section>
  );
}