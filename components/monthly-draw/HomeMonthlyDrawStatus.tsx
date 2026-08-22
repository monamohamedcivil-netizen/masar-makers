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

type Locale = "ar" | "en";

type Remaining = {
  days: number;
  hours: number;
  minutes: number;
};

type HomeMonthlyDrawStatusProps = {
  compactMobile?: boolean;
};

const drawText = {
  ar: {
    nextPrize: "جائزة السحب القادم",
    nextDrawAfter: "السحب القادم بعد",
    day: "يوم",
    hour: "ساعة",
    minute: "دقيقة",
    previousResult: "نتيجة السحب السابق",
  },

  en: {
    nextPrize: "Next Draw Prize",
    nextDrawAfter: "Next draw in",
    day: "Day",
    hour: "Hour",
    minute: "Min",
    previousResult: "Previous Result",
  },
} as const;

const EMPTY_REMAINING: Remaining = {
  days: 0,
  hours: 0,
  minutes: 0,
};

export default function HomeMonthlyDrawStatus({
  compactMobile = false,
}: HomeMonthlyDrawStatusProps) {
  const [locale, setLocale] =
    useState<Locale>("ar");

  const [draw, setDraw] =
    useState<PublicMonthlyDrawState | null>(
      null,
    );

  const [remaining, setRemaining] =
    useState<Remaining>(
      EMPTY_REMAINING,
    );

  useEffect(() => {
    const savedLocale =
      window.localStorage.getItem(
        "masar-locale",
      );

    if (
      savedLocale === "ar" ||
      savedLocale === "en"
    ) {
      setLocale(savedLocale);
    }

    const handleLocaleChange = (
      event: Event,
    ) => {
      const customEvent =
        event as CustomEvent<{
          locale?: Locale;
        }>;

      if (
        customEvent.detail?.locale === "ar" ||
        customEvent.detail?.locale === "en"
      ) {
        setLocale(
          customEvent.detail.locale,
        );
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

  const text =
    drawText[locale];

  const rawPrizeTitle =
    draw?.nextPrizeTitle?.trim() ||
    draw?.prizeTitle?.trim() ||
    "---";

  const prizeTitle =
    locale === "en"
      ? translatePrizeTitleToEnglish(
          rawPrizeTitle,
        )
      : rawPrizeTitle;

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

    const timer =
      window.setInterval(
        () => {
          void loadDraw();
        },
        5 * 60 * 1000,
      );

    return () => {
      window.clearInterval(timer);
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

    if (Number.isNaN(target)) {
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

    const timer =
      window.setInterval(
        update,
        60_000,
      );

    return () => {
      window.clearInterval(timer);
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

  /*
   * ======================================================
   * MOBILE COMPACT VERSION
   * ======================================================
   */

  if (compactMobile) {
    return (
      <div
        dir={
          locale === "ar"
            ? "rtl"
            : "ltr"
        }
        className="
          w-full
          overflow-hidden
          rounded-[9px]
          border
          border-[#F7B548]/80
          bg-white/95
          shadow-[0_7px_20px_rgba(0,0,0,.25)]
        "
      >
        {/* Prize */}

        <div
          className="
            border-b
            border-[#F7B548]/20
            bg-[#FFF9ED]
            px-1
            py-0.5
            text-center
          "
        >
          <div
            className="
              flex
              items-center
              justify-center
              gap-1
              text-[#B77A0B]
            "
          >
            <Gift size={10} />

            <span
              className="
                text-[7px]
                font-black
                leading-none
              "
            >
              {text.nextPrize}
            </span>
          </div>

          <p
            className="
              mt-0
              line-clamp-1
              text-[6px]
              font-black
              leading-3
              text-[#07152E]
            "
          >
            {prizeTitle}
          </p>
        </div>

        {/* Countdown */}

        <div className="px-1 py-0">
          <div
            className="
              mb-0 
               flex
              items-center
              justify-center
              gap-1
              text-[#B77A0B]
            "
          >
            <CalendarClock size={9} />

            <span className="text-[7px] font-black">
              {text.nextDrawAfter}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1">
            <CompactTimeBox
              value={remaining.days}
              label={text.day}
            />

            <CompactTimeBox
              value={remaining.hours}
              label={text.hour}
            />

            <CompactTimeBox
              value={remaining.minutes}
              label={text.minute}
            />
          </div>
        </div>

        {/* Previous result */}

        <button
          type="button"
          onClick={openResult}
          className="
            flex
            w-full
            items-center
            justify-center
            gap-1
            border-t
            border-[#F7B548]/20
            bg-[#F7B548]
            px-1
            py-1
            text-[6.5px]
            font-black
            text-[#07152E]
          "
        >
          <Trophy size={10} />

          {text.previousResult}
        </button>
      </div>
    );
  }

  /*
   * ======================================================
   * DESKTOP ORIGINAL CARD
   * ======================================================
   */

  return (
    <div
      dir={
        locale === "ar"
          ? "rtl"
          : "ltr"
      }
      className={`absolute top-1/2 z-30 w-[180px] -translate-y-1/2 ${
        locale === "ar"
          ? "right-[max(8px,calc((90vw-1280px)/2+8px))]"
          : "left-[max(8px,calc((80vw-1280px)/2+5px))]"
      }`}
    >
      <div
        className="
          overflow-hidden
          rounded-[14px]
          border
          border-[#F7B548]/80
          bg-white/95
          shadow-[0_8px_22px_rgba(7,21,46,.22)]
          backdrop-blur-xl
        "
      >
        <div
          className="
            border-b
            border-[#F7B548]/25
            bg-[#FFF9ED]
            px-2.5
            py-1
            text-center
          "
        >
          <div
            className="
              flex
              items-center
              justify-center
              gap-2
              text-[#B77A0B]
            "
          >
            <Gift size={15} />

            <span className="text-[12px] font-black">
              {text.nextPrize}
            </span>
          </div>

          <p
            className="
              mt-0
              line-clamp-2
              text-[10px]
              font-black
              leading-3
              text-[#07152E]
            "
          >
            {prizeTitle}
          </p>
        </div>

        <div className="px-2.5 py-1">
          <div
            className="
              mb-1
              flex
              items-center
              justify-center
              gap-1.5
              text-[#B77A0B]
            "
          >
            <CalendarClock size={14} />

            <span className="text-[12px] font-black">
              {text.nextDrawAfter}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1">
            <TimeBox
              value={remaining.days}
              label={text.day}
            />

            <TimeBox
              value={remaining.hours}
              label={text.hour}
            />

            <TimeBox
              value={remaining.minutes}
              label={text.minute}
            />
          </div>
        </div>

        <div
          className="
            mt-1
            border-t
            border-[#F7B548]/20
            p-1
          "
        >
          <button
            type="button"
            onClick={openResult}
            className="
              flex
              w-full
              items-center
              justify-center
              gap-1
              rounded-[10px]
              bg-[#F7B548]
              px-2
              py-1.5
              text-[10px]
              font-black
              text-[#07152E]
            "
          >
            <Trophy size={15} />

            {text.previousResult}
          </button>
        </div>
      </div>
    </div>
  );
}

function translatePrizeTitleToEnglish(
  value: string,
): string {
  const normalized =
    value.trim();

  const translations: Record<
    string,
    string
  > = {
    "رحلة يوم واحد مجانية من اختيار الفائز":
      "One free One-Day Journey of the winner's choice",

    "رحلة مجانية من اختيار الفائز":
      "One free journey of the winner's choice",
  };

  return (
    translations[normalized] ??
    normalized
  );
}

function CompactTimeBox({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  return (
    <div
      className="
        rounded-[6px]
        bg-[#07152E]
        px-0.5
        py-1
        text-center
      "
    >
      <p
        className="
          text-[10px]
          font-black
          leading-none
          text-[#F7B548]
        "
      >
        {String(value).padStart(
          2,
          "0",
        )}
      </p>

      <p
        className="
          mt-0.5
          text-[5.5px]
          font-bold
          leading-none
          text-white
        "
      >
        {label}
      </p>
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
    <div
      className="
        rounded-[9px]
        bg-[#07152E]
        px-1
        py-1.5
        text-center
      "
    >
      <p
        className="
          text-[14px]
          font-black
          leading-none
          text-[#F7B548]
        "
      >
        {String(value).padStart(
          2,
          "0",
        )}
      </p>

      <p
        className="
          mt-1
          text-[8px]
          font-bold
          leading-none
          text-white
        "
      >
        {label}
      </p>
    </div>
  );
}