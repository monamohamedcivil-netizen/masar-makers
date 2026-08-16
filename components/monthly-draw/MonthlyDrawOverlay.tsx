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
          className="fixed inset-0 z-[400] flex items-center justify-center bg-[#020817]/88 p-3 backdrop-blur-md sm:p-5"
        >
          <div className="relative w-full max-w-[1180px] overflow-hidden rounded-[34px] border border-[#F7B548]/25 bg-[#061127] shadow-[0_35px_120px_rgba(0,0,0,0.68)]">
            <button
              type="button"
              onClick={closeOverlay}
              aria-label="إغلاق شاشة السحب"
              className="absolute left-5 top-5 z-[90] flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/8 text-white transition hover:bg-white/15"
            >
              <X size={20} />
            </button>

            <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-[#F7B548]/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-[#F7B548]/8 blur-3xl" />

            <div className="grid min-h-[650px] lg:grid-cols-[1.55fr_.92fr]">
              <section className="relative flex min-h-[650px] flex-col items-center justify-center overflow-hidden border-b border-white/10 px-6 py-8 lg:border-b-0 lg:border-l lg:px-8">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-[#F7B548]/8 to-transparent" />

                <div className="relative z-10 flex items-center justify-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F7B548] text-[#07152E] shadow-[0_0_30px_rgba(247,181,72,.20)]">
                    <Gift size={22} />
                  </span>

                  <div className="text-center">
                    <h2 className="text-[34px] font-black leading-none text-white">
                      السحب الشهري
                    </h2>

                    <p className="mt-2 text-[16px] font-black text-[#F7B548]">
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
                  <div className="mt-5 w-full">
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

                <p className="mt-5 text-center text-[16px] font-black text-white">
                  ✨ كلما زادت نقاطك... زادت فرصتك في الفوز ✨
                </p>
              </section>

              <aside className="relative flex min-h-[650px] flex-col justify-center bg-[#07152E]/78 px-6 py-8 sm:px-8">
                <div className="pointer-events-none absolute inset-4 rounded-[26px] border border-[#F7B548]/25" />

                <div className="relative z-10">
                  <div className="flex items-center gap-3">
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[#F7B548] bg-[#061127] text-[#F7B548]">
                      <Trophy size={27} />
                    </span>

                    <div>
                      <p className="text-[13px] font-black text-white">
                        سحب مكافآت
                      </p>
                      <p className="mt-1 text-[25px] font-black text-white">
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
                    <div className="mt-6 rounded-[20px] border border-[#F7B548]/20 bg-white/[0.035] px-4 py-5 text-center">
                      <p className="text-[12px] font-black text-[#F7B548]">
                        بانتظار إعلان الفائز
                      </p>
                      <p className="mt-2 text-[13px] font-semibold leading-7 text-white/65">
                        تابع السحب حتى النهاية لمعرفة اسم الفائز لهذا الشهر.
                      </p>
                    </div>
                  )}

                  {currentDraw.prizeTitle ? (
                    <div className="mt-5 rounded-[22px] border border-[#F7B548]/30 bg-[#061127]/70 px-5 py-5">
                      <div className="flex items-center gap-3">
                        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#F7B548] text-[#07152E]">
                          <Gift size={24} />
                        </span>

                        <div>
                          <p className="text-[15px] font-black text-[#F7B548]">
                            الجائزة لهذا الشهر
                          </p>

                          <p className="mt-1 text-[22px] font-black leading-8 text-white">
                            {currentDraw.prizeTitle}
                          </p>
                        </div>
                      </div>

                      {currentDraw.prizeDescription ? (
                        <p className="mt-3 text-[13px] font-semibold leading-7 text-white/70">
                          {currentDraw.prizeDescription}
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="mt-5 rounded-[22px] border border-[#F7B548]/30 bg-[#061127]/65 px-4 py-5">
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
                      className="flex h-12 w-full items-center justify-center rounded-xl bg-[#F7B548] text-[16px] font-black text-[#07152E] transition hover:-translate-y-0.5 hover:bg-[#ffc45d]"
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
          className="fixed inset-0 z-[520] flex items-center justify-center bg-[#020817]/70 p-4 backdrop-blur-sm"
        >
          <div className="relative w-full max-w-[900px] overflow-hidden rounded-[30px] border border-[#F7B548]/55 bg-white shadow-[0_30px_90px_rgba(0,0,0,.48)]">
            <button
              type="button"
              onClick={() =>
                setShowPointsModal(false)
              }
              aria-label="إغلاق طرق زيادة النقاط"
              className="absolute left-5 top-5 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-[#07152E] shadow-sm transition hover:bg-slate-50"
            >
              <X size={18} />
            </button>

            <div className="border-b border-[#F7B548]/30 bg-gradient-to-l from-[#FFF6DF] via-white to-white px-7 py-5">
              <div className="flex items-center justify-center gap-3">
                <span className="h-px w-20 bg-[#F7B548]" />

                <div className="text-center">
                  <p className="text-[24px] font-black text-[#07152E]">
                    طرق زيادة النقاط
                  </p>

                  <p className="mt-1 text-[11px] font-bold text-slate-500">
                    اجمع النقاط من رحلاتك وتفاعلك على المنصة لزيادة فرصك في السحب الشهري
                  </p>
                </div>

                <span className="h-px w-20 bg-[#F7B548]" />
              </div>
            </div>

            <div className="space-y-5 p-6 sm:p-7">
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

              <div className="rounded-2xl border border-[#F7B548]/40 bg-[#FFF8E8] px-5 py-4 text-center">
                <p className="text-[14px] font-black text-[#C88712]">
                  كل 100 نقطة = فرصة إضافية في السحب الشهري
                </p>

                <p className="mt-1 text-[10px] font-bold text-slate-500">
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
      <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-full border border-[#F7B548]/45 bg-white/[0.04] shadow-[inset_0_0_55px_rgba(247,181,72,0.09),0_0_50px_rgba(247,181,72,.10)]">
        <span
          key={remaining}
          className="animate-pulse text-8xl font-black text-white"
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
    <div className="mx-auto w-full max-w-[760px]">
      <div className="relative mx-auto h-[455px] w-full max-w-[720px]">

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
            height: "330px",
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
                    h-[44px]
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
                          ? "text-[30px] drop-shadow-[0_0_10px_rgba(255,255,255,.45)]"
                          : distance === 1
                            ? "text-[21px]"
                            : distance === 2
                              ? "text-[18px]"
                              : "text-[16px]"
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
          <div className="pointer-events-none absolute inset-x-0 top-0 z-40 h-[78px] bg-gradient-to-b from-[#07152E]/95 via-[#07152E]/70 to-transparent" />

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 h-[78px] bg-gradient-to-t from-[#07152E]/95 via-[#07152E]/70 to-transparent" />
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
            h-[67px]
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
            via-[#F7B548]/[0.055]
            to-transparent
          "
        />
      </div>

      <p className="mt-1 text-center text-[16px] font-black text-white">
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
      <div className="mb-3 flex items-center gap-2 text-[#C88712]">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF5DD]">
          {icon}
        </span>

        <h4 className="text-[15px] font-black text-[#07152E]">
          {title}
        </h4>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
    <div className="flex min-h-[82px] items-center gap-3 rounded-2xl border border-[#E9C673] bg-white px-4 py-3 shadow-[0_7px_22px_rgba(7,21,46,.04)]">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF5DD] text-[#C88712]">
        {icon}
      </span>

      <div className="min-w-0">
        <p className="text-[12px] font-black leading-5 text-[#07152E]">
          {title}
        </p>

        <p className="mt-1 text-[12px] font-black text-[#C88712]">
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
    <div className="mt-6 rounded-[22px] border border-[#F7B548]/30 bg-white/[0.035] px-5 py-5 text-center">
      <div className="flex items-center justify-center gap-2 text-[#F7B548]">
        <Sparkles size={15} />
        <p className="text-[15px] font-black">
          الفائز في سحب {monthLabel}
        </p>
        <Sparkles size={15} />
      </div>

      <h3 className="mt-3 text-[38px] font-black leading-tight text-white">
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
    <div className="rounded-xl border border-[#F7B548]/18 bg-[#061127] px-2 py-3 text-center">
      <p className="text-[28px] font-black leading-none text-white">
        {String(value).padStart(
          2,
          "0",
        )}
      </p>

      <p className="mt-2 text-[14px] font-black text-[#F7B548]">
        {label}
      </p>
    </div>
  );
}