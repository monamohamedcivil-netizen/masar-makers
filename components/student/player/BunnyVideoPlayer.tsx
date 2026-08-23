"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { useRouter } from "next/navigation";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type StudentLessonResource = {
  id: string;
  title: string;
  type: string | null;
  scope: "lesson" | "section";
  downloadUrl: string;
};

type StudentLessonPlayback = {
  lessonId: string;
  courseId: string;
  title: string;
  description: string | null;
  embedUrl: string;
  tokenExpiresAt: number;
  initialPositionSeconds: number;
  initialProgressPercent: number;
  alreadyCompleted: boolean;
  lessonResources: StudentLessonResource[];
  sectionResources: StudentLessonResource[];
  watermark: {
    name: string;
    email: string;
    sessionCode: string;
  };
};

type ApiResult<T = unknown> =
  | { success: true; data: T; message: string }
  | { success: false; message: string };

async function getStudentLessonPlayback(
  lessonId: string,
): Promise<ApiResult<StudentLessonPlayback>> {
  const response = await fetch(
    `/api/student/lessons/${encodeURIComponent(lessonId)}`,
    {
      method: "GET",
      cache: "no-store",
    },
  );

  return response.json();
}

async function postLessonProgress(
  lessonId: string,
  body: Record<string, unknown>,
) {
  const response = await fetch(
    `/api/student/lessons/${encodeURIComponent(lessonId)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );

  const result = await response.json();

  if (!response.ok || result?.success === false) {
    throw new Error(
      result?.message || "تعذر حفظ تقدم المحاضرة.",
    );
  }

  return result;
}

async function startLesson(lessonId: string) {
  return postLessonProgress(lessonId, {
    action: "start",
  });
}

async function updateLessonProgress(
  lessonId: string,
  progressPercent: number,
  lastPositionSeconds: number,
) {
  return postLessonProgress(lessonId, {
    action: "update",
    progressPercent,
    lastPositionSeconds,
  });
}

async function completeLesson(
  lessonId: string,
  lastPositionSeconds: number,
) {
  return postLessonProgress(lessonId, {
    action: "complete",
    lastPositionSeconds,
  });
}

declare global {
  interface Window {
    playerjs?: {
      Player: new (
        element:
          | HTMLIFrameElement
          | string,
      ) => {
        on: (
          event: string,
          callback: (
            data?: any,
          ) => void,
        ) => void;
        off: (
          event: string,
          callback?: (
            data?: any,
          ) => void,
        ) => void;
        setCurrentTime: (
          seconds: number,
        ) => void;
        getCurrentTime: (
          callback: (
            seconds: number,
          ) => void,
        ) => void;
        getDuration: (
          callback: (
            duration: number,
          ) => void,
        ) => void;
      };
    };
  }
}

type Props = {
  lessonId: string;
  completionThreshold?: number;
};

const WATERMARK_POSITIONS = [
  "right-[6%] top-[8%]",
  "left-[7%] top-[12%]",
  "right-[10%] bottom-[18%]",
  "left-[8%] bottom-[20%]",
  "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
];

const FULLSCREEN_WATERMARK_POSITIONS = [
  "right-[6%] top-[8%]",
  "left-[7%] top-[12%]",
  "right-[10%] bottom-[18%]",
  "left-[8%] bottom-[20%]",
  "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
];

function loadPlayerJs() {
  return new Promise<void>(
    (resolve, reject) => {
      if (
        typeof window ===
          "undefined" ||
        window.playerjs
      ) {
        resolve();
        return;
      }

      const existing =
        document.querySelector<HTMLScriptElement>(
          'script[data-masar-playerjs="1"]',
        );

      if (existing) {
        existing.addEventListener(
          "load",
          () => resolve(),
          { once: true },
        );

        existing.addEventListener(
          "error",
          () =>
            reject(
              new Error(
                "PLAYERJS_LOAD_FAILED",
              ),
            ),
          { once: true },
        );

        return;
      }

      const script =
        document.createElement(
          "script",
        );

      script.src =
        "https://assets.mediadelivery.net/playerjs/playerjs-latest.min.js";

      script.async = true;

      script.dataset.masarPlayerjs =
        "1";

      script.onload = () =>
        resolve();

      script.onerror = () =>
        reject(
          new Error(
            "PLAYERJS_LOAD_FAILED",
          ),
        );

      document.head.appendChild(
        script,
      );
    },
  );
}

export default function BunnyVideoPlayer({
  lessonId,
  completionThreshold = 90,
}: Props) {
  const iframeRef =
    useRef<HTMLIFrameElement | null>(
      null,
    );

  const playerContainerRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  const playerRef =
    useRef<any>(null);

  const router = useRouter();

  const lastDashboardRefreshPercentRef =
    useRef(-1);

  const startedRef =
    useRef(false);

  const completedRef =
    useRef(false);

  const savingRef =
    useRef(false);

  const lastSavedSecondRef =
    useRef(0);

  const [playback, setPlayback] =
    useState<StudentLessonPlayback | null>(
      null,
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [
    completed,
    setCompleted,
  ] = useState(false);

  const [
    watermarkIndex,
    setWatermarkIndex,
  ] = useState(0);

  const [
    currentPercent,
    setCurrentPercent,
  ] = useState(0);

  const [
    isProtectedFullscreen,
    setIsProtectedFullscreen,
  ] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");

      const result =
        await getStudentLessonPlayback(
          lessonId,
        );

      if (!active) return;

      if (!result.success) {
        setError(
          result.message,
        );
        setLoading(false);
        return;
      }

      setPlayback(
        result.data,
      );

      setCompleted(
        result.data
          .alreadyCompleted,
      );

      completedRef.current =
        result.data
          .alreadyCompleted;

      lastSavedSecondRef.current =
        result.data
          .initialPositionSeconds;

      setCurrentPercent(
        result.data
          .initialProgressPercent,
      );

      lastDashboardRefreshPercentRef.current =
        Math.floor(
          result.data.initialProgressPercent,
        );

      setLoading(false);
    }

    void load();

    return () => {
      active = false;
    };
  }, [lessonId]);

  useEffect(() => {
    if (!playback) return;

    const timer =
      window.setInterval(
        () => {
          setWatermarkIndex(
            (current) =>
              (current + 1) %
              WATERMARK_POSITIONS.length,
          );
        },
        17000,
      );

    return () =>
      window.clearInterval(
        timer,
      );
  }, [playback]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsProtectedFullscreen(false);
      }
    };

    const handleEscape = (
      event: KeyboardEvent,
    ) => {
      if (
        event.key === "Escape" &&
        isProtectedFullscreen &&
        !document.fullscreenElement
      ) {
        setIsProtectedFullscreen(false);
      }
    };

    document.addEventListener(
      "fullscreenchange",
      handleFullscreenChange,
    );
    window.addEventListener(
      "keydown",
      handleEscape,
    );

    return () => {
      document.removeEventListener(
        "fullscreenchange",
        handleFullscreenChange,
      );
      window.removeEventListener(
        "keydown",
        handleEscape,
      );
    };
  }, [isProtectedFullscreen]);

  const toggleProtectedFullscreen =
    useCallback(async () => {
      const container =
        playerContainerRef.current;

      if (!container) return;

      if (isProtectedFullscreen) {
        if (document.fullscreenElement) {
          try {
            await document.exitFullscreen();
          } catch {
            // CSS fallback below will still close.
          }
        }

        setIsProtectedFullscreen(false);
        return;
      }

      /*
       * First switch to our full-viewport protected layout.
       * Then use the browser Fullscreen API when available.
       * If the browser blocks it, the CSS layout is still a safe fallback.
       */
      setIsProtectedFullscreen(true);

      try {
        if (
          !document.fullscreenElement &&
          container.requestFullscreen
        ) {
          await container.requestFullscreen();
        }
      } catch {
        // Keep CSS full-viewport fallback active.
      }
    }, [isProtectedFullscreen]);

  const saveProgress =
    useCallback(
      async (
        seconds: number,
        duration: number,
        force = false,
      ) => {
        if (
          savingRef.current ||
          !Number.isFinite(
            duration,
          ) ||
          duration <= 0
        ) {
          return;
        }

        const currentSecond =
          Math.max(
            0,
            Math.floor(
              seconds,
            ),
          );

        if (
          !force &&
          currentSecond -
            lastSavedSecondRef.current <
            10
        ) {
          return;
        }

        const percent =
          Math.max(
            0,
            Math.min(
              100,
              Math.round(
                (seconds /
                  duration) *
                  100,
              ),
            ),
          );

        setCurrentPercent(
          percent,
        );

        savingRef.current =
          true;

        try {
          if (
            percent >=
              completionThreshold &&
            !completedRef.current
          ) {
            await completeLesson(
              lessonId,
              currentSecond,
            );

            completedRef.current =
              true;

            setCompleted(
              true,
            );

            setCurrentPercent(
              100,
            );
          } else if (
            !completedRef.current
          ) {
            await updateLessonProgress(
              lessonId,
              percent,
              currentSecond,
            );
          }

          lastSavedSecondRef.current =
            currentSecond;

          const refreshPercent =
            completedRef.current
              ? 100
              : Math.floor(percent);

          if (
            refreshPercent >
            lastDashboardRefreshPercentRef.current
          ) {
            lastDashboardRefreshPercentRef.current =
              refreshPercent;

            router.refresh();
          }
        } catch (saveError) {
          console.error(
            "SAVE BUNNY VIDEO PROGRESS ERROR",
            saveError,
          );
        } finally {
          savingRef.current =
            false;
        }
      },
      [
        completionThreshold,
        lessonId,
        router,
      ],
    );

  useEffect(() => {
    if (
      !playback ||
      !iframeRef.current
    ) {
      return;
    }

    let disposed = false;

    let player: any = null;

    const onTimeUpdate = (
      data?: {
        seconds?: number;
        duration?: number;
      },
    ) => {
      const seconds =
        Number(
          data?.seconds ??
            0,
        );

      const duration =
        Number(
          data?.duration ??
            0,
        );

      void saveProgress(
        seconds,
        duration,
      );
    };

    const saveCurrentPosition =
      () => {
        if (!player) return;

        player.getCurrentTime(
          (seconds: number) => {
            player.getDuration(
              (
                duration: number,
              ) => {
                void saveProgress(
                  seconds,
                  duration,
                  true,
                );
              },
            );
          },
        );
      };

    const initialize =
      async () => {
        try {
          await loadPlayerJs();

          if (
            disposed ||
            !iframeRef.current ||
            !window.playerjs
          ) {
            return;
          }

          player =
            new window.playerjs.Player(
              iframeRef.current,
            );

          playerRef.current =
            player;

          player.on(
            "ready",
            () => {
              if (
                playback.initialPositionSeconds >
                0
              ) {
                player.setCurrentTime(
                  playback.initialPositionSeconds,
                );
              }
            },
          );

          player.on(
            "play",
            () => {
              if (
                startedRef.current
              ) {
                return;
              }

              startedRef.current =
                true;

              void startLesson(
                lessonId,
              ).catch(
                (
                  startError,
                ) => {
                  console.error(
                    "START LESSON ERROR",
                    startError,
                  );
                },
              );
            },
          );

          player.on(
            "timeupdate",
            onTimeUpdate,
          );

          player.on(
            "pause",
            saveCurrentPosition,
          );

          player.on(
            "ended",
            () => {
              player.getDuration(
                (
                  duration: number,
                ) => {
                  void saveProgress(
                    duration,
                    duration,
                    true,
                  );
                },
              );
            },
          );
        } catch (playerError) {
          console.error(
            "BUNNY PLAYER INITIALIZATION ERROR",
            playerError,
          );

          if (!disposed) {
            setError(
              "تعذر تحميل مشغل الفيديو.",
            );
          }
        }
      };

    void initialize();

    return () => {
      disposed = true;

      try {
        if (player) {
          player.off(
            "timeupdate",
            onTimeUpdate,
          );

          player.off(
            "pause",
            saveCurrentPosition,
          );
        }
      } catch {
        // Player is being destroyed with iframe.
      }

      playerRef.current =
        null;
    };
  }, [
    lessonId,
    playback,
    saveProgress,
  ]);

  const watermarkText =
    useMemo(() => {
      if (!playback) {
        return null;
      }

      return (
        <div className={isProtectedFullscreen ? "space-y-0.5" : "space-y-0"}>
          <p
            className={
              isProtectedFullscreen
                ? "text-[20px] font-black leading-8"
                : "text-[9px] font-black leading-3"
            }
          >
            {
              playback
                .watermark
                .name
            }
          </p>

          <p
            className={
              isProtectedFullscreen
                ? "text-[20px] leading-6"
                : "text-[8px] leading-3"
            }
          >
            {
              playback
                .watermark
                .email
            }
          </p>

          <p
            className={
              isProtectedFullscreen
                ? "text-[20px] leading-6"
                : "text-[8px] leading-3"
            }
          >
            Masar Makers •{" "}
            {
              playback
                .watermark
                .sessionCode
            }
          </p>
        </div>
      );
    }, [playback, isProtectedFullscreen]);

  if (loading) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-3xl bg-[#07152E] text-white">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#F7B548]" />

          <p className="mt-3 font-black">
            جاري تجهيز الدرس...
          </p>
        </div>
      </div>
    );
  }

  if (
    error ||
    !playback
  ) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center">
        <div>
          <AlertTriangle className="mx-auto h-10 w-10 text-amber-600" />

          <p className="mt-3 font-black text-amber-800">
            {error ||
              "تعذر تشغيل الدرس."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <section
      dir="rtl"
      className="space-y-4"
    >
      <div
        ref={playerContainerRef}
        onContextMenu={(event) =>
          event.preventDefault()
        }
        className={[
          "relative overflow-hidden bg-black shadow-2xl",
          isProtectedFullscreen
            ? "fixed inset-0 z-[9999] flex h-[100dvh] w-screen items-center justify-center rounded-none"
            : "rounded-3xl",
        ].join(" ")}
      >
        <div
          className={[
            "relative overflow-hidden bg-black",
            isProtectedFullscreen
              ? "aspect-video w-full max-h-[100dvh] max-w-[177.7778vh]"
              : "aspect-video w-full",
          ].join(" ")}
        >
          <iframe
            ref={iframeRef}
            src={
              playback.embedUrl
            }
            title={
              playback.title
            }
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
            className="absolute inset-0 h-full w-full border-0"
          />

          {/* ثابت: شعار Masar Makers — مربوط بمساحة الفيديو نفسها */}
          <img
            src="/images/branding/masar-makers-video-logo.png"
            alt=""
            aria-hidden="true"
            draggable={false}
            className={[
              "pointer-events-none absolute right-3 z-30 select-none object-contain drop-shadow-xl sm:right-4",
              isProtectedFullscreen
                ? "bottom-4 w-16 sm:bottom-5 sm:w-20 md:w-24"
                : "bottom-10 w-14 sm:bottom-12 sm:w-16 md:w-20",
            ].join(" ")}
          />

          {/* متحرك: Watermark خاص بالطالب — يتحرك داخل الفيديو فقط */}
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute z-20 select-none rounded-md bg-black/15 text-white/40 shadow-sm backdrop-blur-[1px] transition-all duration-700 ${
              isProtectedFullscreen
                ? "max-w-[44%] px-2 py-1 sm:max-w-[42%] sm:px-3 sm:py-2"
                : "max-w-[34%] px-2 py-1"
            } ${
              (isProtectedFullscreen
                ? FULLSCREEN_WATERMARK_POSITIONS
                : WATERMARK_POSITIONS)[watermarkIndex]
            }`}
          >
            {watermarkText}
          </div>

          {/*
           * هذا الزر يغطي زر Full Screen الداخلي في Bunny.
           * بالتالي يتم تكبير الفيديو + اللوجو + Watermark معًا.
           */}
          <button
            type="button"
            onClick={toggleProtectedFullscreen}
            aria-label={
              isProtectedFullscreen
                ? "الخروج من ملء الشاشة"
                : "ملء الشاشة"
            }
            title={
              isProtectedFullscreen
                ? "الخروج من ملء الشاشة"
                : "ملء الشاشة"
            }
            className="absolute bottom-2 right-2 z-50 flex h-9 w-9 items-center justify-center rounded-lg bg-black/75 text-white shadow-lg backdrop-blur-sm transition hover:bg-black sm:h-10 sm:w-10"
          >
            {isProtectedFullscreen ? (
              <Minimize2 className="h-5 w-5" />
            ) : (
              <Maximize2 className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-[#07152E]">
              {
                playback.title
              }
            </h2>

            {playback.description ? (
              <p className="mt-1 text-sm font-bold text-slate-500">
                {
                  playback.description
                }
              </p>
            ) : null}
          </div>

          {completed ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              تم إكمال الدرس
            </span>
          ) : (
            <span className="rounded-full bg-[#FFF5DD] px-4 py-2 text-xs font-black text-[#C88712]">
              {currentPercent}%
            </span>
          )}
        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-[#F7B548] transition-all"
            style={{
              width: `${Math.min(
                100,
                completed
                  ? 100
                  : currentPercent,
              )}%`,
            }}
          />
        </div>

        <p className="mt-2 text-[10px] font-bold text-slate-400">
          يتم حفظ آخر نقطة
          مشاهدة تلقائيًا.
        </p>
      </div>
    </section>
  );
}