"use client";

import { BookOpenCheck, Gift } from "lucide-react";

interface RewardItem {
  key: string;
  courseName: string;
  courseTypeLabel?: string | null;
  iconUrl?: string | null;
}

interface Props {
  rewardProgress: number;
  rewardTarget: number;
  rewardPercent: number;

  earnedRewards: number;
  redeemedRewards: number;
  availableRewards: number;

  drawRewardsEarned: number;
  drawRewardsRedeemed: number;
  drawRewardsAvailable: number;

  visibleRewardItems: RewardItem[];
}

export default function RewardsCard({
  rewardProgress,
rewardTarget,
rewardPercent,

earnedRewards,
redeemedRewards,
availableRewards,

drawRewardsEarned,
drawRewardsRedeemed,
drawRewardsAvailable,

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
<div className="mt-2 border-t border-white/15 pt-1">

  {/* Header */}
  <div className="grid grid-cols-4 items-center text-center text-[10px] font-bold text-white/65">
    <div className="py-1">
      حالة المكافآت
    </div>

    <div className="py-1">
      المكتسبة
    </div>

    <div className="py-1">
      المستخدمة
    </div>

    <div className="py-1">
      المتاحة
    </div>
  </div>

  {/* Rewards Card */}
  <div className="grid grid-cols-4 items-center border-t border-white/10 text-center text-[10px] font-bold">
    <div className="py-0 text-white/80">
      بطاقة المكافآت
    </div>

    <div className="py-0 text-sm text-green-400">
      {earnedRewards}
    </div>

    <div className="py-0 text-sm text-[#F7B548]">
      {redeemedRewards}
    </div>

    <div className="py-0 text-sm text-blue-300">
      {availableRewards}
    </div>
  </div>

  {/* Monthly Draw */}
  <div className="grid grid-cols-4 items-center border-t border-white/10 text-center text-[10px] font-bold">
    <div className="py-0 text-white/80">
      السحب الشهري
    </div>

    <div className="py-0 text-sm text-green-400">
      {drawRewardsEarned}
    </div>

    <div className="py-0 text-sm text-[#F7B548]">
      {drawRewardsRedeemed}
    </div>

    <div className="py-0 text-sm text-blue-300">
      {drawRewardsAvailable}
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
    const rewardItem = visibleRewardItems[index];

    const fallbackLabel =
      rewardItem?.courseName
        ?.trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((word) => word[0])
        .join("")
        .toUpperCase() || `${index + 1}`;

    return (

      <div
        key={rewardItem?.key ?? index}
        title={
          completed && rewardItem
            ? `${rewardItem.courseName}${
                rewardItem.courseTypeLabel
                  ? ` - ${rewardItem.courseTypeLabel}`
                  : ""
              }`
            : undefined
        }
        className={`relative flex h-[54px] items-center justify-center overflow-hidden rounded-lg border transition-all ${
          completed
            ? "border-[#F7B548] bg-[#FFF8E9]"
            : "border-[#DCE3EB] bg-[#F3F5F8]"
        }`}
      >
        {completed && rewardItem ? (
          rewardItem.iconUrl ? (
            <img
  src={rewardItem.iconUrl}
  alt={rewardItem.courseName}
  className="h-full w-full object-contain p-1"
/>
          ) : (
            <span className="px-1 text-center text-[9px] font-black leading-tight text-[#07152E]">
              {fallbackLabel}
            </span>
          )
        ) : null}
      </div>

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