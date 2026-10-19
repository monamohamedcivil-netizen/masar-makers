/*
 * محوّل مشغّل YouTube.
 *
 * يجعل مشغّل YouTube (IFrame API) يتصرف بنفس واجهة Player.js المستخدمة مع Bunny:
 *   on / off / setCurrentTime / getCurrentTime / getDuration
 * وبنفس أسماء الأحداث: ready, play, pause, ended, timeupdate.
 *
 * بهذا يبقى منطق حفظ التقدم وإكمال الدرس في BunnyVideoPlayer كما هو بدون تكرار.
 */

type Listener = (data?: unknown) => void;

export type YouTubePlayerAdapter = {
  on: (event: string, callback: Listener) => void;
  off: (event: string, callback?: Listener) => void;
  setCurrentTime: (seconds: number) => void;
  getCurrentTime: (callback: (seconds: number) => void) => void;
  getDuration: (callback: (duration: number) => void) => void;
  destroy: () => void;
};

type YTPlayer = {
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
};

type YTNamespace = {
  Player: new (
    element: HTMLIFrameElement,
    options: {
      events: {
        onReady: () => void;
        onStateChange: (event: { data: number }) => void;
      };
    },
  ) => YTPlayer;
};

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

const STATE_ENDED = 0;
const STATE_PLAYING = 1;
const STATE_PAUSED = 2;

let apiPromise: Promise<void> | null = null;

function loadYouTubeApi(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("NO_WINDOW"));
  }

  if (window.YT?.Player) {
    return Promise.resolve();
  }

  if (apiPromise) {
    return apiPromise;
  }

  apiPromise = new Promise<void>((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady;

    const timeout = window.setTimeout(() => {
      apiPromise = null;
      reject(new Error("YOUTUBE_API_TIMEOUT"));
    }, 20000);

    window.onYouTubeIframeAPIReady = () => {
      window.clearTimeout(timeout);
      previous?.();
      resolve();
    };

    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.onerror = () => {
      window.clearTimeout(timeout);
      apiPromise = null;
      reject(new Error("YOUTUBE_API_LOAD_FAILED"));
    };

    document.head.appendChild(script);
  });

  return apiPromise;
}

export async function createYouTubePlayerAdapter(
  iframe: HTMLIFrameElement,
): Promise<YouTubePlayerAdapter> {
  await loadYouTubeApi();

  const YT = window.YT;

  if (!YT?.Player) {
    throw new Error("YOUTUBE_API_UNAVAILABLE");
  }

  const listeners = new Map<string, Set<Listener>>();
  let pollTimer: number | null = null;
  let isReady = false;
  let destroyed = false;
  let player: YTPlayer | null = null;

  const emit = (event: string, data?: unknown) => {
    listeners.get(event)?.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error("YOUTUBE ADAPTER LISTENER ERROR", error);
      }
    });
  };

  const readTime = () => {
    if (!player || destroyed) return null;

    try {
      return {
        seconds: Number(player.getCurrentTime()) || 0,
        duration: Number(player.getDuration()) || 0,
      };
    } catch {
      return null;
    }
  };

  const emitTimeUpdate = () => {
    const time = readTime();

    if (time && time.duration > 0) {
      emit("timeupdate", time);
    }
  };

  const stopPolling = () => {
    if (pollTimer !== null) {
      window.clearInterval(pollTimer);
      pollTimer = null;
    }
  };

  const startPolling = () => {
    stopPolling();
    pollTimer = window.setInterval(emitTimeUpdate, 1000);
  };

  await new Promise<void>((resolve) => {
    player = new YT.Player(iframe, {
      events: {
        onReady: () => {
          isReady = true;
          emit("ready");
          resolve();
        },
        onStateChange: (event) => {
          if (event.data === STATE_PLAYING) {
            emit("play");
            emitTimeUpdate();
            startPolling();
          } else if (event.data === STATE_PAUSED) {
            stopPolling();
            emitTimeUpdate();
            emit("pause");
          } else if (event.data === STATE_ENDED) {
            stopPolling();
            emitTimeUpdate();
            emit("ended");
          }
        },
      },
    });

    // لا ننتظر للأبد إذا لم يصل onReady (شبكة بطيئة): نكمل ونسمح للأحداث بالوصول لاحقًا.
    window.setTimeout(resolve, 8000);
  });

  return {
    on(event, callback) {
      if (!listeners.has(event)) {
        listeners.set(event, new Set());
      }

      listeners.get(event)!.add(callback);

      if (event === "ready" && isReady) {
        window.setTimeout(() => callback(), 0);
      }
    },

    off(event, callback) {
      if (!callback) {
        listeners.delete(event);
        return;
      }

      listeners.get(event)?.delete(callback);
    },

    setCurrentTime(seconds) {
      // نقطة الاستئناف الأولى تُرسل في رابط التضمين (start=)،
      // فلا نقفز هنا قبل بدء التشغيل حتى لا يبدأ الفيديو وحده.
      if (!player || destroyed || !isReady) return;

      try {
        if (player.getPlayerState() === -1 || player.getPlayerState() === 5) {
          return;
        }

        player.seekTo(Math.max(0, seconds), true);
      } catch {
        // تجاهل: المشغّل لم يجهز بعد.
      }
    },

    getCurrentTime(callback) {
      callback(readTime()?.seconds ?? 0);
    },

    getDuration(callback) {
      callback(readTime()?.duration ?? 0);
    },

    destroy() {
      destroyed = true;
      stopPolling();
      listeners.clear();
    },
  };
}
