"use client";

import {
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  FileUp,
  Gift,
  Plane,
  PlayCircle,
  RotateCcw,
  Sparkles,
  Star,
  Trophy,
  UserPlus,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  getPublicMonthlyDrawState,
  type PublicMonthlyDrawState,
} from "@/lib/public/monthly-draws";

const LIVE_POLL_MS = 1000;
const COMPLETED_POLL_MS = 60 * 1000;

function resultSeenKey(drawId: string) {
  return `masar-monthly-draw-result-seen:${drawId}`;
}

function liveDismissedKey(drawId: string) {
  return `masar-monthly-draw-live-dismissed:${drawId}`;
}

function safeGetItem(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(
  key: string,
  value: string,
) {
  try {
    window.localStorage.setItem(
      key,
      value,
    );
  } catch {
    // Ignore storage restrictions.
  }
}

export default function MonthlyDrawOverlay() {
  const [draw, setDraw] =
    useState<PublicMonthlyDrawState | null>(
      null,
    );

  const [open, setOpen] =
    useState(false);

  const [remaining, setRemaining] =
    useState<number | null>(null);

  const [spinning, setSpinning] =
    useState(false);

  const [spinIndex, setSpinIndex] =
    useState(0);

  const [showWinner, setShowWinner] =
    useState(false);

  const [showPointsModal, setShowPointsModal] =
    useState(false);

  const [
    nextDrawRemaining,
    setNextDrawRemaining,
  ] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
  });


  const loadDraw =
    useCallback(async () => {
      try {
        const next =
          await getPublicMonthlyDrawState();

        setDraw(next);

        if (!next) {
          setOpen(false);
          return;
        }

        if (
          next.phase === "completed"
        ) {
          const alreadySeen =
            safeGetItem(
              resultSeenKey(
                next.drawId,
              ),
            ) === "1";

          if (
            next.resultPopupActive &&
            !alreadySeen
          ) {
            setOpen(true);
          }

          return;
        }

        const dismissed =
          safeGetItem(
            liveDismissedKey(
              next.drawId,
            ),
          ) === "1";

        if (!dismissed) {
          setOpen(true);
        }
      } catch (error) {
        console.error(
          "Failed to load public monthly draw:",
          error,
        );
      }
    }, []);

  useEffect(() => {
    let cancelled = false;
    let timer:
      | number
      | undefined;

    async function poll() {
      if (cancelled) return;

      await loadDraw();

      if (cancelled) return;

      timer =
        window.setTimeout(
          poll,
          draw?.phase ===
            "completed"
            ? COMPLETED_POLL_MS
            : LIVE_POLL_MS,
        );
    }

    void poll();

    return () => {
      cancelled = true;

      if (timer) {
        window.clearTimeout(
          timer,
        );
      }
    };
  }, [
    loadDraw,
    draw?.phase,
  ]);

  useEffect(() => {
    function handleOpenMonthlyDraw() {
      setOpen(true);

      if (
        draw?.phase ===
        "completed"
      ) {
        setShowWinner(true);
      }
    }

    window.addEventListener(
      "masar:open-monthly-draw",
      handleOpenMonthlyDraw,
    );

    return () => {
      window.removeEventListener(
        "masar:open-monthly-draw",
        handleOpenMonthlyDraw,
      );
    };
  }, [draw?.phase]);

  /*
   * أثناء عرض نتيجة السحب السابق يكون الـ polling بطيئًا.
   * لذلك عندما يصبح موعد السحب القادم على بُعد أقل من دقيقة،
   * نضبط Timer ليوقظ الـ Overlay بالضبط عند الموعد.
   *
   * هذا يمنع أن تبدأ مرحلة countdown على السيرفر بينما
   * الواجهة ما زالت نائمة على نتيجة الشهر السابق.
   */
  useEffect(() => {
    if (
      !draw ||
      draw.phase !== "completed" ||
      !draw.nextDrawAt
    ) {
      return;
    }

    const target =
      new Date(
        draw.nextDrawAt,
      ).getTime();

    if (
      Number.isNaN(target)
    ) {
      return;
    }

    const diff =
      target - Date.now();

    if (diff <= 0) {
      void loadDraw();
      return;
    }

    /*
     * عندما يصبح الموعد داخل آخر دقيقة،
     * استيقظ بالضبط عند موعد السحب.
     * قبل ذلك يكفي الـ polling العادي.
     */
    if (diff > 65_000) {
      return;
    }

    const timer =
      window.setTimeout(
        () => {
          void loadDraw();
        },
        diff + 150,
      );

    return () => {
      window.clearTimeout(
        timer,
      );
    };
  }, [
    draw?.drawId,
    draw?.phase,
    draw?.nextDrawAt,
    loadDraw,
  ]);

  useEffect(() => {
    const countdownEndsAt =
      draw?.countdownEndsAt;

    if (
      draw?.phase !==
        "countdown" ||
      typeof countdownEndsAt !==
        "string" ||
      !countdownEndsAt
    ) {
      setRemaining(null);
      return;
    }

    const countdownEndTimestamp =
      new Date(
        countdownEndsAt,
      ).getTime();

    if (
      Number.isNaN(
        countdownEndTimestamp,
      )
    ) {
      setRemaining(null);
      return;
    }

    function update() {
      const diff =
        countdownEndTimestamp -
        Date.now();

      setRemaining(
        Math.max(
          0,
          Math.ceil(
            diff / 1000,
          ),
        ),
      );
    }

    update();

    const timer =
      window.setInterval(
        update,
        200,
      );

    return () => {
      window.clearInterval(
        timer,
      );
    };
  }, [
    draw?.drawId,
    draw?.phase,
    draw?.countdownEndsAt,
  ]);

  useEffect(() => {
    const nextDrawAt =
      draw?.nextDrawAt;

    if (
      typeof nextDrawAt !==
        "string" ||
      !nextDrawAt
    ) {
      setNextDrawRemaining({
        days: 0,
        hours: 0,
        minutes: 0,
      });
      return;
    }

    const target =
      new Date(
        nextDrawAt,
      ).getTime();

    if (
      Number.isNaN(target)
    ) {
      return;
    }

    function update() {
      const diff =
        Math.max(
          0,
          target - Date.now(),
        );

      const totalMinutes =
        Math.floor(
          diff / 60_000,
        );

      setNextDrawRemaining({
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
      window.clearInterval(
        timer,
      );
    };
  }, [
    draw?.nextDrawAt,
  ]);

  const weightedNames =
    useMemo(() => {
      if (!draw) {
        return [];
      }

      const names: string[] = [];

      for (
        const participant of
        draw.participants
      ) {
        const repetitions =
          Math.max(
            1,
            Math.min(
              100,
              participant.entriesCount,
            ),
          );

        for (
          let index = 0;
          index < repetitions;
          index += 1
        ) {
          names.push(
            participant.studentName,
          );
        }
      }

      return names;
    }, [draw]);

  /*
   * Real wheel animation while the server-side draw phase is "running".
   * تبدأ بسرعة ثم تتباطأ تدريجيًا كلما اقتربنا من نهاية زمن الدوران.
   */
  useEffect(() => {
    if (
      !draw ||
      draw.phase !== "running" ||
      !open ||
      weightedNames.length === 0
    ) {
      return;
    }

    setShowWinner(false);
    setSpinning(true);

    let cancelled = false;
    let timer: number | undefined;

    const startedAt = Date.now();

    const runningEndsAt =
      typeof draw.runningEndsAt === "string" &&
      draw.runningEndsAt
        ? new Date(
            draw.runningEndsAt,
          ).getTime()
        : startedAt + 10_000;

    const duration = Math.max(
      1_500,
      runningEndsAt - startedAt,
    );

    function step() {
      if (cancelled) return;

      const elapsed =
        Date.now() - startedAt;

      const progress =
        Math.min(
          1,
          elapsed / duration,
        );

      setSpinIndex((current) =>
        (current + 1) %
        weightedNames.length,
      );

      /*
       * أول 60% سريع جدًا، ثم يبدأ التباطؤ بشكل واضح.
       * قرب النهاية تصبح الخطوات أبطأ لتعطي إحساس توقف العجلة.
       */
      const delay =
        progress < 0.6
          ? 55
          : Math.round(
              55 +
                Math.pow(
                  (progress - 0.6) /
                    0.4,
                  2.4,
                ) *
                  330,
            );

      timer =
        window.setTimeout(
          step,
          delay,
        );
    }

    step();

    return () => {
      cancelled = true;

      if (timer) {
        window.clearTimeout(
          timer,
        );
      }
    };
  }, [
    draw?.drawId,
    draw?.phase,
    draw?.runningEndsAt,
    open,
    weightedNames,
  ]);

  /*
   * عند اكتمال السحب لا نقفز مباشرة إلى اسم الفائز.
   * نعمل مرحلة تباطؤ نهائية قصيرة، ثم نتوقف بدقة على الفائز.
   */
  useEffect(() => {
    if (
      !draw ||
      draw.phase !== "completed" ||
      !draw.winnerName ||
      !open ||
      weightedNames.length === 0
    ) {
      return;
    }

    const winnerIndex =
      Math.max(
        0,
        weightedNames.findIndex(
          (name) =>
            name === draw.winnerName,
        ),
      );

    const completedAt =
      draw.completedAt
        ? new Date(
            draw.completedAt,
          ).getTime()
        : 0;

    const fresh =
      completedAt > 0 &&
      Date.now() - completedAt < 30_000;

    /*
     * لو المستخدم فتح نتيجة قديمة يدويًا:
     * لا نعيد الحركة؛ نثبت الفائز فورًا.
     */
    if (!fresh) {
      setSpinning(false);
      setSpinIndex(winnerIndex);
      setShowWinner(true);
      return;
    }

    setShowWinner(false);
    setSpinning(true);

    let cancelled = false;
    let timer: number | undefined;

    /*
     * نكمل عدة لفات إضافية قبل الوصول للفائز،
     * حتى يبدو التوقف طبيعيًا وليس قفزة مباشرة.
     */
    const currentIndex =
      spinIndex %
      weightedNames.length;

    const forwardDistance =
      (winnerIndex -
        currentIndex +
        weightedNames.length) %
      weightedNames.length;

    const extraLoops = 2;

    const totalSteps =
      extraLoops *
        weightedNames.length +
      forwardDistance;

    let step = 0;

    function finalStep() {
      if (cancelled) return;

      step += 1;

      if (step >= totalSteps) {
        setSpinIndex(winnerIndex);
        setSpinning(false);

        timer =
          window.setTimeout(
            () => {
              if (!cancelled) {
                setShowWinner(true);
              }
            },
            550,
          );

        return;
      }

      setSpinIndex((current) =>
        (current + 1) %
        weightedNames.length,
      );

      const progress =
        step /
        Math.max(
          1,
          totalSteps,
        );

      /*
       * سرعة عالية أولًا، ثم تباطؤ تدريجي،
       * وآخر 20% تصبح الخطوات واضحة وبطيئة.
       */
      const delay =
        progress < 0.55
          ? 60
          : progress < 0.8
            ? Math.round(
                85 +
                  Math.pow(
                    (progress -
                      0.55) /
                      0.25,
                    1.7,
                  ) *
                    110,
              )
            : Math.round(
                190 +
                  Math.pow(
                    (progress -
                      0.8) /
                      0.2,
                    2.2,
                  ) *
                    330,
              );

      timer =
        window.setTimeout(
          finalStep,
          delay,
        );
    }

    finalStep();

    return () => {
      cancelled = true;

      if (timer) {
        window.clearTimeout(
          timer,
        );
      }
    };
  }, [
    draw?.drawId,
    draw?.phase,
    draw?.winnerName,
    draw?.completedAt,
    open,
    weightedNames,
  ]);

  if (!draw) {
    return null;
  }

  const currentDraw = draw;

  function closeOverlay() {
    setOpen(false);

    if (
      currentDraw.phase ===
      "completed"
    ) {
      safeSetItem(
        resultSeenKey(
          currentDraw.drawId,
        ),
        "1",
      );
    } else {
      safeSetItem(
        liveDismissedKey(
          currentDraw.drawId,
        ),
        "1",
      );
    }
  }

  function reopenLiveDraw() {
    setOpen(true);

    try {
      window.localStorage.removeItem(
        liveDismissedKey(
          currentDraw.drawId,
        ),
      );
    } catch {
      // Ignore storage restrictions.
    }
  }

  const showLiveLauncher =
    !open &&
    currentDraw.phase !==
      "completed";

  const isCompleted =
    currentDraw.phase ===
    "completed";

  const showResultPanel =
    isCompleted &&
    showWinner;

  return (
    <>
      {showLiveLauncher ? (
        <button
          type="button"
          onClick={reopenLiveDraw}
          className="fixed bottom-5 left-5 z-[390] inline-flex items-center gap-2 rounded-full border border-[#F7B548]/50 bg-[#07152E] px-4 py-3 text-[11px] font-black text-white shadow-[0_16px_40px_rgba(7,21,46,0.28)] transition hover:-translate-y-0.5 hover:bg-[#0B2146]"
        >
          <RotateCcw
            size={16}
            className="text-[#F7B548]"
          />
          متابعة السحب
        </button>
      ) : null}

      {open ? (
        <div
          dir="rtl"
          className="fixed inset-0 z-[400] flex items-start justify-center overflow-y-auto bg-[#020817]/88 p-2 backdrop-blur-md sm:p-4 lg:items-center"
        >
          <div className="relative my-2 w-[94vw] max-w-[430px] overflow-hidden rounded-[20px] sm:w-[92vw] sm:max-w-[620px] lg:w-full lg:max-w-[1040px] lg:rounded-[30px] border border-[#F7B548]/35 bg-[#061127] shadow-[0_30px_90px_rgba(0,0,0,0.58)] sm:rounded-[26px] lg:my-0 lg:rounded-[30px]">
            <button
              type="button"
              onClick={closeOverlay}
              aria-label="إغلاق شاشة السحب"
              className="absolute left-3 top-3 z-[90] flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-[#07152E]/80 text-white shadow-md transition hover:bg-[#07152E] sm:h-9 sm:w-9 lg:left-4 lg:top-4 lg:h-10 lg:w-10"
            >
              <X size={20} />
            </button>

            <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-[#F7B548]/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-[#F7B548]/8 blur-3xl" />


            {/* Mobile layout */}
            <div className="lg:hidden">
              <section className="relative overflow-hidden bg-[#061127] px-2.5 pb-2.5 pt-3.5">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#F7B548]/8 to-transparent" />

                <div className="relative z-10 flex items-center justify-center gap-2 pr-10">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F7B548] text-[#07152E] shadow-[0_0_20px_rgba(247,181,72,.18)]">
                    <Gift size={18} />
                  </span>

                  <div className="text-center">
                    <h2 className="text-[22px] font-black leading-none text-white">
                      السحب الشهري
                    </h2>

                    <p className="mt-1 text-[10px] font-black text-[#F7B548]">
                      {currentDraw.phase === "countdown"
                        ? "استعدوا... السحب يبدأ الآن"
                        : spinning
                          ? "جاري اختيار الفائز"
                          : showResultPanel
                            ? "تم اختيار الفائز"
                            : "جاري السحب الآن..."}
                    </p>
                  </div>
                </div>

                {currentDraw.phase === "countdown" ? (
                  <div className="mt-3">
                    <Countdown
                      remaining={
                        remaining ??
                        currentDraw.countdownSeconds
                      }
                    />
                  </div>
                ) : (
                  <div className="mt-1">
                    <DrumReel
                      names={weightedNames}
                      index={spinIndex}
                      spinning={spinning}
                      winnerName={
                        showResultPanel
                          ? currentDraw.winnerName
                          : null
                      }
                    />
                  </div>
                )}

                <p className="mt-1 text-center text-[10px] font-black text-white/80">
                  ✨ كلما زادت نقاطك زادت فرصتك في الفوز ✨
                </p>
              </section>

              <aside className="relative bg-[#FFF6DF] px-2.5 py-2.5">
                <div className="pointer-events-none absolute inset-2 rounded-[18px] border border-[#E7B54E]/40" />

                <div className="relative z-10 space-y-2">
                  {showResultPanel ? (
                    <WinnerSummary
                      name={
                        currentDraw.winnerName ??
                        "فائز Masar Makers"
                      }
                      monthKey={currentDraw.monthKey}
                    />
                  ) : (
                    <div className="rounded-[14px] border border-[#E7C36E] bg-white/85 px-3 py-2.5 text-center shadow-sm">
                      <p className="text-[10px] font-black text-[#C88712]">
                        بانتظار إعلان الفائز
                      </p>
                      <p className="mt-1 text-[9px] font-semibold leading-4 text-[#07152E]/60">
                        تابع السحب حتى النهاية لمعرفة اسم الفائز.
                      </p>
                    </div>
                  )}

                  {currentDraw.prizeTitle ? (
                    <div className="rounded-[14px] border border-[#E5BE62] bg-white/90 px-3 py-2.5 shadow-sm">
                      <div className="flex items-center gap-2">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F7B548] text-[#07152E]">
                          <Gift size={18} />
                        </span>

                        <div className="min-w-0">
                          <p className="text-[9px] font-black text-[#C88712]">
                            الجائزة لهذا الشهر
                          </p>
                          <p className="mt-0.5 line-clamp-2 text-[13px] font-black leading-5 text-[#07152E]">
                            {currentDraw.prizeTitle}
                          </p>
                        </div>
                      </div>

                      {currentDraw.prizeDescription ? (
                        <p className="mt-1.5 line-clamp-2 text-[9px] font-semibold leading-4 text-[#07152E]/60">
                          {currentDraw.prizeDescription}
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="rounded-[14px] border border-[#E5BE62] bg-[#FFFDF8] px-3 py-2.5 shadow-sm">
                    <div className="mb-2 flex items-center justify-center gap-1.5">
                      <CalendarClock size={14} className="text-[#C88712]" />
                      <p className="text-[10px] font-black text-[#C88712]">
                        السحب القادم بعد
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5">
                      <TimeBox value={nextDrawRemaining.days} label="يوم" />
                      <TimeBox value={nextDrawRemaining.hours} label="ساعة" />
                      <TimeBox value={nextDrawRemaining.minutes} label="دقيقة" />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowPointsModal(true)}
                    className="flex h-9 w-full items-center justify-center rounded-xl bg-[#F7B548] text-[12px] font-black text-[#07152E] shadow-sm transition hover:bg-[#ffc45d]"
                  >
                    كيف أزيد نقاطي؟
                  </button>
                </div>
              </aside>
            </div>

            <div className="hidden min-h-[560px] lg:grid lg:grid-cols-[1.48fr_.92fr]">
              <section className="relative flex min-h-[560px] flex-col items-center justify-center overflow-hidden border-b border-white/10 bg-[#061127] px-5 py-6 lg:border-b-0 lg:border-l lg:px-7">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-[#F7B548]/8 to-transparent" />

                <div className="relative z-10 flex items-center justify-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F7B548] text-[#07152E] shadow-[0_0_24px_rgba(247,181,72,.18)]">
                    <Gift size={22} />
                  </span>

                  <div className="text-center">
                    <h2 className="text-[30px] font-black leading-none text-white">
                      السحب الشهري
                    </h2>

                    <p className="mt-1.5 text-[14px] font-black text-[#F7B548]">
                      {currentDraw.phase ===
                      "countdown"
                        ? "استعدوا... السحب يبدأ الآن"
                        : spinning
                          ? "حان وقت الحظ... جاري اختيار الفائز"
                          : showResultPanel
                            ? "تم اختيار الفائز"
                            : "جاري السحب الآن..."}
                    </p>
                  </div>
                </div>

                {currentDraw.phase ===
                "countdown" ? (
                  <div className="mt-10">
                    <Countdown
                      remaining={
                        remaining ??
                        currentDraw.countdownSeconds
                      }
                    />
                  </div>
                ) : (
                  <div className="mt-3 w-full">
                    <DrumReel
                      names={
                        weightedNames
                      }
                      index={
                        spinIndex
                      }
                      spinning={
                        spinning
                      }
                      winnerName={
                        showResultPanel
                          ? currentDraw.winnerName
                          : null
                      }
                    />
                  </div>
                )}

                <p className="mt-3 text-center text-[14px] font-black text-white/90">
                  ✨ كلما زادت نقاطك... زادت فرصتك في الفوز ✨
                </p>
              </section>

              <aside className="relative flex min-h-[560px] flex-col justify-center bg-[#FFF6DF] px-5 py-6 sm:px-6">
                <div className="pointer-events-none absolute inset-3 rounded-[24px] border border-[#E7B54E]/45" />

                <div className="relative z-10">
                  <div className="flex items-center gap-3">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#E2A62F] bg-white text-[#C88712] shadow-sm">
                      <Trophy size={27} />
                    </span>

                    <div>
                      <p className="text-[12px] font-black text-[#07152E]/70">
                        سحب مكافآت
                      </p>
                      <p className="mt-1 text-[22px] font-black text-[#07152E]">
                        الشهري{" "}
                        <span className="text-[#F7B548]">
                          Masar Makers
                        </span>
                      </p>
                    </div>
                  </div>

                  {showResultPanel ? (
                    <WinnerSummary
                      name={
                        currentDraw.winnerName ??
                        "فائز Masar Makers"
                      }
                      monthKey={
                        currentDraw.monthKey
                      }
                    />
                  ) : (
                    <div className="mt-5 rounded-[18px] border border-[#E7C36E] bg-white/80 px-4 py-4 text-center shadow-sm">
                      <p className="text-[12px] font-black text-[#F7B548]">
                        بانتظار إعلان الفائز
                      </p>
                      <p className="mt-2 text-[12px] font-semibold leading-6 text-[#07152E]/65">
                        تابع السحب حتى النهاية لمعرفة اسم الفائز لهذا الشهر.
                      </p>
                    </div>
                  )}

                  {currentDraw.prizeTitle ? (
                    <div className="mt-4 rounded-[20px] border border-[#E5BE62] bg-white/85 px-4 py-4 shadow-sm">
                      <div className="flex items-center gap-3">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F7B548] text-[#07152E]">
                          <Gift size={24} />
                        </span>

                        <div>
                          <p className="text-[13px] font-black text-[#C88712]">
                            الجائزة لهذا الشهر
                          </p>

                          <p className="mt-1 text-[18px] font-black leading-7 text-[#07152E]">
                            {currentDraw.prizeTitle}
                          </p>
                        </div>
                      </div>

                      {currentDraw.prizeDescription ? (
                        <p className="mt-2 text-[11px] font-semibold leading-6 text-[#07152E]/65">
                          {currentDraw.prizeDescription}
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="mt-4 rounded-[20px] border border-[#E5BE62] bg-[#FFFDF8] px-4 py-4 shadow-sm">
                    <div className="flex items-center justify-center gap-2">
                      <CalendarClock
                        size={17}
                        className="text-[#F7B548]"
                      />
                      <p className="text-[15px] font-black text-[#F7B548]">
                        السحب القادم بعد
                      </p>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2">
                      <TimeBox
                        value={
                          nextDrawRemaining.days
                        }
                        label="يوم"
                      />
                      <TimeBox
                        value={
                          nextDrawRemaining.hours
                        }
                        label="ساعة"
                      />
                      <TimeBox
                        value={
                          nextDrawRemaining.minutes
                        }
                        label="دقيقة"
                      />
                    </div>
                  </div>

                  <div className="mt-5">
                    <button
                      type="button"
                      onClick={() =>
                        setShowPointsModal(true)
                      }
                      className="flex h-10 w-full items-center justify-center rounded-xl bg-[#F7B548] text-[14px] font-black text-[#07152E] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#ffc45d]"
                    >
                      كيف أزيد نقاطي؟
                    </button>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      ) : null}

      {showPointsModal ? (
        <div
          dir="rtl"
          className="fixed inset-0 z-[520] flex items-center justify-center bg-[#020817]/70 p-2 backdrop-blur-sm sm:p-4"
        >
          <div className="relative max-h-[88vh] w-[90vw] max-w-[360px] overflow-y-auto rounded-[18px] border border-[#F7B548]/55 bg-white shadow-[0_24px_70px_rgba(0,0,0,.42)] sm:max-h-[92vh] sm:w-full sm:max-w-[700px] sm:rounded-[26px] lg:max-w-[900px] lg:rounded-[30px]">
            <button
              type="button"
              onClick={() =>
                setShowPointsModal(false)
              }
              aria-label="إغلاق طرق زيادة النقاط"
              className="absolute left-2.5 top-2.5 z-30 flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-[#07152E] shadow-sm transition hover:bg-slate-50 sm:left-4 sm:top-4 sm:h-9 sm:w-9 lg:left-5 lg:top-5 lg:h-10 lg:w-10"
            >
              <X size={18} />
            </button>

            <div className="border-b border-[#F7B548]/30 bg-gradient-to-l from-[#FFF6DF] via-white to-white px-3 py-3 sm:px-5 sm:py-4 lg:px-7 lg:py-5">
              <div className="flex items-center justify-center gap-2 sm:gap-3">
                <span className="h-px w-8 bg-[#F7B548] sm:w-14 lg:w-20" />

                <div className="text-center">
                  <p className="text-[16px] font-black text-[#07152E] sm:text-[20px] lg:text-[24px]">
                    طرق زيادة النقاط
                  </p>

                  <p className="mx-auto mt-0.5 max-w-[250px] text-[8px] font-bold leading-4 text-slate-500 sm:mt-1 sm:max-w-none sm:text-[10px] lg:text-[11px]">
                    اجمع النقاط من رحلاتك وتفاعلك على المنصة لزيادة فرصك في السحب الشهري
                  </p>
                </div>

                <span className="h-px w-8 bg-[#F7B548] sm:w-14 lg:w-20" />
              </div>
            </div>

            <div className="space-y-3 p-3 sm:space-y-4 sm:p-5 lg:space-y-5 lg:p-7">
              <PointsSection
                title="الرحلات وأنواعها"
                icon={<BookOpen size={19} />}
              >
                <PointsRule
                  points="+50"
                  title="الاشتراك في رحلة"
                  icon={<BookOpen size={18} />}
                />

                <PointsRule
                  points="+20"
                  title="إكمال رحلة"
                  icon={<CheckCircle2 size={18} />}
                />

                <PointsRule
                  points="+20"
                  title="الاشتراك في رحلة اليوم الواحد"
                  icon={<Plane size={18} />}
                />

                <PointsRule
                  points="+5"
                  title="مشاهدة رحلة مجانية"
                  icon={<PlayCircle size={18} />}
                />
              </PointsSection>

              <div className="border-t border-dashed border-[#F7B548]/45" />

              <PointsSection
                title="التفاعل والمشاركة"
                icon={<UserPlus size={19} />}
              >
                <PointsRule
                  points="+20"
                  title="إكمال التقييم"
                  icon={<ClipboardCheck size={18} />}
                />

                <PointsRule
                  points="+50"
                  title="رفع مشروع"
                  icon={<FileUp size={18} />}
                />

                <PointsRule
                  points="+20"
                  title="مشروع مميز"
                  icon={<Star size={18} />}
                />

                <PointsRule
                  points="+50"
                  title="دعوة صديق"
                  icon={<UserPlus size={18} />}
                />
              </PointsSection>

              <div className="rounded-xl border border-[#F7B548]/40 bg-[#FFF8E8] px-2.5 py-2 text-center sm:rounded-2xl sm:px-4 sm:py-3 lg:px-5 lg:py-4">
                <p className="text-[10px] font-black text-[#C88712] sm:text-[12px] lg:text-[14px]">
                  كل 100 نقطة = فرصة إضافية في السحب الشهري
                </p>

                <p className="mt-0.5 text-[7.5px] font-bold text-slate-500 sm:mt-1 sm:text-[9px] lg:text-[10px]">
                  كلما زادت نقاطك زادت فرصك في الفوز
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function Countdown({
  remaining,
}: {
  remaining: number;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full sm:h-36 sm:w-36 lg:h-48 lg:w-48 border border-[#F7B548]/45 bg-white/[0.04] shadow-[inset_0_0_55px_rgba(247,181,72,0.09),0_0_50px_rgba(247,181,72,.10)]">
        <span
          key={remaining}
          className="animate-pulse text-5xl font-black text-white sm:text-6xl lg:text-8xl"
        >
          {Math.max(
            0,
            remaining,
          )}
        </span>
      </div>

      <p className="mt-6 text-[14px] font-bold text-white/60">
        كل فرصة إضافية تزيد احتمالية الفوز
      </p>
    </div>
  );
}

function DrumReel({
  names,
  index,
  spinning,
  winnerName,
}: {
  names: string[];
  index: number;
  spinning: boolean;
  winnerName: string | null;
}) {
  const fallback =
    names.length > 0
      ? names
      : ["Masar Makers"];

  const offsets = [-4, -3, -2, -1, 0, 1, 2, 3, 4];

  function getName(offset: number) {
    if (
      offset === 0 &&
      winnerName
    ) {
      return winnerName;
    }

    const position =
      (index +
        offset +
        fallback.length) %
      fallback.length;

    return fallback[position];
  }

  return (
    <div className="mx-auto w-full max-w-[680px]">
      <div className="relative mx-auto h-[205px] w-full max-w-[350px] sm:h-[275px] sm:max-w-[465px] lg:h-[385px] lg:max-w-[640px]">

        {/* صورة جسم العجلة فقط */}
        <img
          src="/images/monthly-draw/draw-wheel.png"
          alt="Masar Makers Monthly Draw Wheel"
          draggable={false}
          className="pointer-events-none absolute inset-0 z-10 h-full w-full select-none object-contain"
        />

        {/* منطقة الأسماء داخل قلب العجلة */}
        <div
          className="
            absolute
            left-[16.5%]
            right-[20.5%]
            top-[48.5%]
            z-30
            -translate-y-1/2
            overflow-hidden
          "
          style={{
            height: "clamp(148px, 38vw, 278px)",
            perspective: "850px",
          }}
        >
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2">
            {offsets.map((offset) => {
              const distance =
                Math.abs(offset);

              const isWinner =
                offset === 0;

              const opacity =
                isWinner
                  ? 1
                  : distance === 1
                    ? 0.34
                    : distance === 2
                      ? 0.18
                      : distance === 3
                        ? 0.09
                        : 0.035;

              const scale =
                isWinner
                  ? 1
                  : distance === 1
                    ? 0.95
                    : distance === 2
                      ? 0.88
                      : 0.80;

              const rotateX =
                offset < 0
                  ? Math.min(
                      distance * 6,
                      22,
                    )
                  : -Math.min(
                      distance * 6,
                      22,
                    );

              return (
                <div
                  key={offset}
                  className="
                    flex
                    h-[29px]
                    sm:h-[36px]
                    lg:h-[44px]
                    items-center
                    justify-center
                    border-b
                    border-white/[0.07]
                    px-3
                    transition-all
                    duration-100
                  "
                  style={{
                    opacity,
                    transform: `
                      perspective(700px)
                      rotateX(${rotateX}deg)
                      scale(${scale})
                    `,
                  }}
                >
                  <span
                    className={`
                      max-w-[94%]
                      truncate
                      text-center
                      font-black
                      text-white
                      ${
                        isWinner
                          ? "text-[17px] sm:text-[23px] lg:text-[30px] drop-shadow-[0_0_10px_rgba(255,255,255,.45)]"
                          : distance === 1
                            ? "text-[12px] sm:text-[16px] lg:text-[21px]"
                            : distance === 2
                              ? "text-[10px] sm:text-[14px] lg:text-[18px]"
                              : "text-[9px] sm:text-[12px] lg:text-[16px]"
                      }
                    `}
                  >
                    {getName(offset)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* تلاشي أعلى وأسفل الأسماء */}
          <div className="pointer-events-none absolute inset-x-0 top-0 z-40 h-[44px] sm:h-[60px] lg:h-[78px] bg-gradient-to-b from-[#07152E]/95 via-[#07152E]/70 to-transparent" />

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 h-[44px] sm:h-[60px] lg:h-[78px] bg-gradient-to-t from-[#07152E]/95 via-[#07152E]/70 to-transparent" />
        </div>

        {/* إطار الفائز نضيفه بالكود وليس داخل الصورة */}
        <div
          className={`
            pointer-events-none
            absolute
            left-[15.2%]
            right-[22.5%]
            top-[48.5%]
            z-50
            h-[34px]
            sm:h-[42px]
            lg:h-[50px]
            -translate-y-1/2
            rounded-[9px]
            border-2
            border-[#F7B548]
            bg-[#061127]/16
            transition-all
            duration-500
            ${
              winnerName
                ? "shadow-[0_0_34px_rgba(247,181,72,.72),inset_0_0_20px_rgba(247,181,72,.14)]"
                : "shadow-[0_0_24px_rgba(247,181,72,.38),inset_0_0_14px_rgba(247,181,72,.08)]"
            }
          `}
        />

        {/* لمعان خفيف على الاسم الفائز */}
        <div
          className="
            pointer-events-none
            absolute
            left-[14.5%]
            right-[22.5%]
            top-[48.5%]
            z-[45]
            h-[58px]
            -translate-y-1/2
            rounded-xl
            bg-gradient-to-r
            from-transparent
           
            to-transparent
          "
        />
      </div>

      <p className="mt-0 text-center text-[10px] font-black text-white sm:mt-0.5 sm:text-[12px] lg:text-[14px]">
        {spinning
          ? "جاري اختيار الفائز..."
          : winnerName
            ? "تم اختيار الفائز"
            : "لحظات ويظهر الفائز"}
      </p>
    </div>
  );
}

function PointsSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="mb-1.5 flex items-center gap-1.5 text-[#C88712] sm:mb-2.5 sm:gap-2 lg:mb-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FFF5DD] sm:h-9 sm:w-9 sm:rounded-xl lg:h-10 lg:w-10">
          {icon}
        </span>

        <h4 className="text-[11px] font-black text-[#07152E] sm:text-[13px] lg:text-[15px]">
          {title}
        </h4>
      </div>

      <div className="grid grid-cols-2 gap-1.5 sm:gap-2.5 lg:grid-cols-4 lg:gap-3">
        {children}
      </div>
    </section>
  );
}

function PointsRule({
  points,
  title,
  icon,
}: {
  points: string;
  title: string;
  icon: ReactNode;
}) {
  return (
    <div className="flex min-h-[54px] items-center gap-1.5 rounded-xl border border-[#E9C673] bg-white px-2 py-1.5 shadow-[0_5px_14px_rgba(7,21,46,.04)] sm:min-h-[68px] sm:gap-2.5 sm:rounded-2xl sm:px-3 sm:py-2.5 lg:min-h-[82px] lg:gap-3 lg:px-4 lg:py-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#FFF5DD] text-[#C88712] sm:h-9 sm:w-9 sm:rounded-xl lg:h-10 lg:w-10">
        {icon}
      </span>

      <div className="min-w-0">
        <p className="text-[8px] font-black leading-3.5 text-[#07152E] sm:text-[10px] sm:leading-4 lg:text-[12px] lg:leading-5">
          {title}
        </p>

        <p className="mt-0.5 text-[8px] font-black text-[#C88712] sm:text-[10px] lg:mt-1 lg:text-[12px]">
          {points} نقطة
        </p>
      </div>
    </div>
  );
}

function WinnerSummary({
  name,
  monthKey,
}: {
  name: string;
  monthKey: string;
}) {
  const [year, month] =
    monthKey.split("-");

  const monthLabel =
    year && month
      ? new Intl.DateTimeFormat(
          "ar-SA",
          {
            month: "long",
            year: "numeric",
            timeZone:
              "Asia/Riyadh",
          },
        ).format(
          new Date(
            `${year}-${month}-01T12:00:00+03:00`,
          ),
        )
      : monthKey;

  return (
    <div className="mt-0 rounded-[14px] border border-[#E5BE62] bg-white/90 px-3 py-2.5 text-center shadow-sm sm:rounded-[18px] lg:mt-5 lg:rounded-[20px] lg:px-4 lg:py-4">
      <div className="flex items-center justify-center gap-2 text-[#F7B548]">
        <Sparkles size={15} />
        <p className="text-[15px] font-black">
          الفائز في سحب {monthLabel}
        </p>
        <Sparkles size={15} />
      </div>

      <h3 className="mt-1 text-[22px] font-black leading-tight text-[#07152E] sm:text-[26px] lg:mt-2 lg:text-[30px]">
        {name}
      </h3>
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
    <div className="rounded-xl border border-[#E6C575] bg-white px-1 py-1.5 text-center shadow-sm sm:px-2 sm:py-2 lg:py-2.5">
      <p className="text-[18px] font-black leading-none text-[#07152E] sm:text-[21px] lg:text-[24px]">
        {String(value).padStart(
          2,
          "0",
        )}
      </p>

      <p className="mt-1 text-[10px] font-black text-[#C88712] sm:text-[12px] lg:mt-2 lg:text-[14px]">
        {label}
      </p>
    </div>
  );
}