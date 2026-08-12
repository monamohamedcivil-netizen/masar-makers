"use client";

import {
  Award,
  ChevronLeft,
  Sparkles,
  Ticket,
} from "lucide-react";

interface Level {
  name: string;
}

interface MasarPassportCardProps {
  CurrentLevelIcon: React.ComponentType<{
    size?: number;
  }>;

  currentLevel: Level;

  nextLevel: Level | null;

  levelProgress: number;

  remainingPoints: number;

  totalPoints: number;

  monthlyDrawEntries: number;

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
  onShowProgress,
  onShowDraw,
}: MasarPassportCardProps) {
  return (
    <section className="overflow-hidden rounded-[26px] border border-[#DCE3EB] bg-white shadow-[0_14px_38px_rgba(7,21,46,0.08)]">

      <header className="flex flex-wrap items-center justify-between gap-3 bg-[#07152E] px-5 py-2.5 text-white sm:px-6">

        <div>

          <p className="text-[11px] font-black text-[#F7B548]">
            Masar Engineering Passport
          </p>

          <h2 className="mt-1 text-[20px] font-black sm:text-[23px]">
            بطاقة إنجازاتك المهنية
          </h2>

          <p className="mt-1 text-[10px] font-bold text-white/65">
            كل خطوة في مسيرتك المهنية
            تقربك من إنجاز جديد.
          </p>

        </div>

        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F7B548] text-[#07152E]">

          <Award size={25} />

        </span>

      </header>

      <div className="grid md:grid-cols-3">

        <article className="flex min-h-[130px] flex-col items-center justify-center border-b border-[#E2E7EE] p-3 text-center md:border-b-0 md:border-l">

          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFF5DD] text-[#C88712]">

            <CurrentLevelIcon size={21} />

          </span>

          <p className="mt-3 text-[10px] font-black text-slate-400">
            مستواك الحالي
          </p>

          <h3 className="mt-1 text-[21px] font-black text-[#07152E]">
            {currentLevel.name}
          </h3>

          <div className="mt-3 h-2 w-full max-w-[210px] overflow-hidden rounded-full bg-slate-200">

            <div
              className="h-full rounded-full bg-[#F7B548]"
              style={{
                width: `${levelProgress}%`,
              }}
            />

          </div>

          <p className="mt-2 text-[9px] font-bold text-slate-500">
            {nextLevel
              ? `${remainingPoints} نقطة للوصول إلى ${nextLevel.name}`
              : "وصلت إلى أعلى مستوى"}
          </p>

        </article>

        <article className="flex min-h-[130px] flex-col items-center justify-center border-b border-[#E2E7EE] p-3 text-center md:border-b-0 md:border-l">

          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFF5DD] text-[#C88712]">

            <Sparkles size={29} />

          </span>

          <p className="mt-3 text-[10px] font-black text-slate-400">
            نقاطك الحالية
          </p>

          <p className="mt-1 text-[31px] font-black text-[#07152E]">
            {totalPoints.toLocaleString("en-US")}
          </p>

          <button
            type="button"
            onClick={onShowProgress}
            className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-xl bg-[#07152E] px-4 text-[10px] font-black text-white transition hover:bg-[#F7B548] hover:text-[#07152E]"
          >
            عرض تفاصيل تقدمي

            <ChevronLeft size={14} />

          </button>

        </article>

        <article className="flex min-h-[130px] flex-col items-center justify-center p-3 text-center">

          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFF5DD] text-[#C88712]">

            <Ticket size={21} />

          </span>

          <p className="mt-3 text-[10px] font-black text-slate-400">
            فرص السحب الشهري
          </p>

          <p className="mt-1 text-[31px] font-black text-[#07152E]">
            {monthlyDrawEntries}
          </p>

          <p className="text-[9px] font-bold text-slate-500">
            كل 100 نقطة = فرصة واحدة
          </p>

          <button
            type="button"
            onClick={onShowDraw}
            className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-xl bg-[#F7B548] px-4 text-[10px] font-black text-[#07152E] transition hover:bg-[#07152E] hover:text-white"
          >
            عرض السحب الشهري

            <ChevronLeft size={14} />

          </button>

        </article>

      </div>

    </section>
  );
}