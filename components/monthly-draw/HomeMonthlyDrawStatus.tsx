"use client";

import {
  CalendarClock,
  Gift,
  Trophy,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  getPublicMonthlyDrawState,
  type PublicMonthlyDrawState,
} from "@/lib/public/monthly-draws";

type Remaining = {
  days: number;
  hours: number;
  minutes: number;
};

const EMPTY_REMAINING: Remaining = {
  days: 0,
  hours: 0,
  minutes: 0,
};

export default function HomeMonthlyDrawStatus() {
  const [draw, setDraw] =
    useState<PublicMonthlyDrawState | null>(
      null,
    );

  const [remaining, setRemaining] =
    useState<Remaining>(
      EMPTY_REMAINING,
    );

  const loadDraw =
    useCallback(async () => {
      try {
        const result =
          await getPublicMonthlyDrawState();

        setDraw(result);
      } catch (error) {
        console.error(
          "Failed to load homepage monthly draw status:",
          error,
        );
      }
    }, []);

  useEffect(() => {
    void loadDraw();

    /*
     * Result data changes very rarely after a draw is completed.
     * One refresh every five minutes is enough on the homepage.
     */
    const timer =
      window.setInterval(
        () => {
          void loadDraw();
        },
        5 * 60 * 1000,
      );

    return () => {
      window.clearInterval(
        timer,
      );
    };
  }, [loadDraw]);

  useEffect(() => {
    const nextDrawAt =
      draw?.nextDrawAt;

    if (
      draw?.phase !== "completed" ||
      typeof nextDrawAt !== "string" ||
      !nextDrawAt
    ) {
      setRemaining(
        EMPTY_REMAINING,
      );
      return;
    }

    const target =
      new Date(
        nextDrawAt,
      ).getTime();

    if (
      Number.isNaN(
        target,
      )
    ) {
      setRemaining(
        EMPTY_REMAINING,
      );
      return;
    }

    function update() {
      const diff =
        Math.max(
          0,
          target - Date.now(),
        );

      /*
       * نستخدم ceil بدل floor:
       * لو باقي أقل من دقيقة نظهر 1 دقيقة،
       * وأول ما يصل الموعد فعليًا تصبح 0.
       */
      const totalMinutes =
        diff <= 0
          ? 0
          : Math.ceil(
              diff / 60_000,
            );

      setRemaining({
        days: Math.floor(
          totalMinutes /
            (24 * 60),
        ),
        hours: Math.floor(
          (totalMinutes %
            (24 * 60)) /
            60,
        ),
        minutes:
          totalMinutes % 60,
      });
    }

    update();

    /*
     * No seconds are shown, so the component only needs to
     * update once per minute instead of every second.
     */
    const timer =
      window.setInterval(
        update,
        60_000,
      );

    return () => {
      window.clearInterval(
        timer,
      );
    };
  }, [
    draw?.drawId,
    draw?.phase,
    draw?.nextDrawAt,
  ]);

  if (
    !draw ||
    draw.phase !== "completed" ||
    !draw.winnerName
  ) {
    return null;
  }

  function openResult() {
    window.dispatchEvent(
      new CustomEvent(
        "masar:open-monthly-draw",
      ),
    );
  }

  const nextPrizeTitle =
    draw.nextPrizeTitle?.trim() ||
    draw.prizeTitle?.trim() ||
    "رحلة يوم واحد مجانية من اختيار الفائز";

  return (
    <div
      dir="rtl"
      className="absolute left-[34.8%] top-[112px] z-20 w-[350px] max-w-[34vw] -translate-x-1/2"
    >
      <div className="overflow-hidden rounded-[17px] border border-[#F7B548]/55 bg-white/95 shadow-[0_10px_26px_rgba(7,21,46,.20)] backdrop-blur-xl">
        <div className="flex min-h-[70px] items-stretch">
          <button
            type="button"
            onClick={openResult}
            className="group flex w-[43%] shrink-0 items-center gap-2.5 bg-[#F7B548] px-3.5 py-2 text-right transition hover:bg-[#ffc158]"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#07152E] text-[#F7B548] shadow-sm">
              <Trophy size={18} />
            </span>

            <span className="min-w-0">
              <span className="block whitespace-nowrap text-[10px] font-black text-[#07152E]">
                نتيجة السحب الشهري
              </span>
              <span className="mt-0.5 block text-[8px] font-bold text-[#07152E]/65">
                عرض اسم الفائز
              </span>
            </span>
          </button>

          <div className="flex min-w-0 flex-1 flex-col justify-center px-3 py-2">
            <div className="flex items-center justify-center gap-1.5 text-[#B77A0B]">
              <CalendarClock size={11} />
              <span className="text-[9px] font-black">
                السحب القادم بعد
              </span>
            </div>

            <div className="mt-1.5 grid grid-cols-3 gap-1.5">
              <TimeBox
                value={remaining.days}
                label="يوم"
              />
              <TimeBox
                value={remaining.hours}
                label="ساعة"
              />
              <TimeBox
                value={remaining.minutes}
                label="دقيقة"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-1.5 border-t border-[#F7B548]/20 bg-[#FFF9ED] px-3 py-1.5">
          <Gift
            size={11}
            className="shrink-0 text-[#C88712]"
          />
          <p className="truncate text-[9px] font-black text-[#07152E]">
            جائزة السحب القادم:
            <span className="mr-1 text-[#B77A0B]">
              {nextPrizeTitle}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

function TimeBox({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  return (
    <div className="rounded-[9px] bg-[#07152E] px-1 py-1.5 text-center shadow-[0_3px_9px_rgba(7,21,46,.12)]">
      <p className="text-[13px] font-black leading-none text-[#F7B548]">
        {String(value).padStart(
          2,
          "0",
        )}
      </p>

      <p className="mt-1 text-[7px] font-bold leading-none text-white/80">
        {label}
      </p>
    </div>
  );}