"use client";

import { BookOpenCheck, Gift } from "lucide-react";

interface RewardItem {
  key: string;
  courseName: string;
  courseTypeLabel?: string | null;
}

interface Props {
  rewardProgress: number;
  rewardTarget: number;
  rewardPercent: number;

  earnedRewards: number;
  redeemedRewards: number;
  availableRewards: number;

  visibleRewardItems: RewardItem[];
}

export default function RewardsCard({
  rewardProgress,
rewardTarget,
rewardPercent,

earnedRewards,
redeemedRewards,
availableRewards,

visibleRewardItems,
}: Props) {
  return (
    <section className="overflow-hidden rounded-[26px] border border-[#DCE3EB] bg-white shadow-[0_14px_38px_rgba(7,21,46,0.08)]">

      <div className="grid lg:grid-cols-[290px_minmax(0,1fr)]">

        <div className="flex min-h-[180px] flex-col items-center justify-center bg-gradient-to-br from-[#07152E] to-[#12345F] p-6 text-center text-white">

          <span className="flex h-16 w-16 items-center justify-center rounded-full border border-[#F7B548]/50 bg-white/10 text-[#F7B548]">
            <Gift size={31} />
          </span>

          <p className="mt-4 text-[11px] font-black text-[#F7B548]">
            Masar Rewards Card
          </p>

          <h3 className="mt-1 text-[20px] font-black">
            بطاقة المكافآت
          </h3>

          <p className="mt-2 max-w-[220px] text-[10px] font-bold leading-5 text-white/65">
            أكمل عشر رحلات تعليمية احترافية واحصل على مكافأة خاصة.
          </p>
<div className="mt-6 border-t border-white/15 pt-5">

    <div className="grid grid-cols-3 gap-2 text-center">

        <div>
            <div className="text-xl font-black text-green-400">
                {earnedRewards}
            </div>

            <div className="mt-1 text-[10px] text-white/70">
                المكتسبة
            </div>
        </div>

        <div>
            <div className="text-xl font-black text-[#F7B548]">
                {redeemedRewards}
            </div>

            <div className="mt-1 text-[10px] text-white/70">
                المستخدمة
            </div>
        </div>

        <div>
            <div className="text-xl font-black text-blue-300">
                {availableRewards}
            </div>

            <div className="mt-1 text-[10px] text-white/70">
                المتاحة
            </div>
        </div>

    </div>

</div>
        </div>

        <div className="flex min-h-[180px] flex-col justify-center p-3 sm:p-7">

          <div className="flex flex-wrap items-start justify-between gap-4">

            <div>

              <p className="text-[10px] font-black text-[#C88712]">
                المكافأة القادمة
              </p>

              <h3 className="mt-1 text-[20px] font-black text-[#07152E]">
                رحلة مجانية من اختيارك
              </h3>

              <p className="mt-1 text-[10px] font-bold text-slate-500">
                من رحلات اليوم الواحد في منصة Masar Makers.
              </p>

            </div>

            <div className="rounded-2xl bg-[#FFF5DD] px-5 py-3 text-center">

              <p className="text-[23px] font-black text-[#07152E]">
                {rewardProgress}
                <span className="text-[13px] text-slate-400">
                  /{rewardTarget}
                </span>
              </p>

              <p className="text-[9px] font-black text-[#C88712]">
                رحلات احترافية
              </p>

            </div>


          </div>

          <div className="mt-5 grid grid-cols-5 gap-2 sm:grid-cols-10">

  {Array.from({ length: rewardTarget }).map((_, index) => {

    const completed = index < rewardProgress;

    return (

      <div
        key={index}
        className={`h-[54px] rounded-lg border transition-all ${
          completed
            ? "border-[#F7B548] bg-[#FFF8E9]"
            : "border-[#DCE3EB] bg-[#F3F5F8]"
        }`}
      />

    );

  })}

</div>

          <div className="mt-3 flex items-center justify-between gap-3">

            <p className="text-[10px] font-bold text-slate-500">

              {rewardProgress >= rewardTarget
                ? "تهانينا! أصبحت المكافأة متاحة."
                : `متبقي ${Math.max(
                    0,
                    rewardTarget - rewardProgress,
                  )} رحلات احترافية للحصول على المكافأة.`}

            </p>

            <span className="text-[11px] font-black text-[#C88712]">
              {rewardPercent}%
            </span>

          </div>

          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">

            <div
              className="h-full rounded-full bg-[#F7B548]"
              style={{
                width: `${rewardPercent}%`,
              }}
            />

          </div>
        </div>
      </div>
    </section>
  );
}