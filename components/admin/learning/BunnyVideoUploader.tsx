"use client";

import * as tus from "tus-js-client";
import {
  CheckCircle2,
  Loader2,
  RefreshCw,
  Trash2,
  UploadCloud,
  Video,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  attachExistingBunnyVideo,
  createBunnyUploadSession,
  finalizeBunnyVideoUpload,
  getBunnyLibraryVideos,
  removeLessonBunnyVideo,
  syncBunnyVideoMetadata,
  type BunnyLibraryVideo,
} from "@/lib/actions/admin/bunny-videos";

type Props = {
  lessonId: string;
  lessonTitle: string;
  currentVideoId?: string | null;
  currentStatus?: string | null;
  onChanged?: (data: {
    videoId: string | null;
    status: string | null;
    durationSeconds: number;
  }) => void;
};

function statusLabel(status?: string | null) {
  switch (status) {
    case "queued":
      return "في قائمة الانتظار";
    case "processing":
      return "جارٍ التجهيز";
    case "encoding":
      return "جارٍ التحويل";
    case "playable":
      return "قابل للتشغيل";
    case "ready":
      return "جاهز";
    case "uploading":
      return "جارٍ الرفع";
    case "uploaded":
      return "تم الرفع";
    case "failed":
    case "upload_failed":
      return "فشل";
    default:
      return "غير مرفوع";
  }
}

export default function BunnyVideoUploader({
  lessonId,
  lessonTitle,
  currentVideoId = null,
  currentStatus = null,
  onChanged,
}: Props) {
  const inputRef =
    useRef<HTMLInputElement | null>(null);

  const uploadRef =
    useRef<tus.Upload | null>(null);

  const [fileName, setFileName] =
    useState("");

  const [videoId, setVideoId] =
    useState<string | null>(
      currentVideoId,
    );

  const [status, setStatus] =
    useState<string | null>(
      currentStatus,
    );

  const [durationSeconds, setDurationSeconds] =
    useState(0);

  const [progress, setProgress] =
    useState(0);

  const [busy, setBusy] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [libraryOpen, setLibraryOpen] =
    useState(false);

  const [libraryLoading, setLibraryLoading] =
    useState(false);

  const [libraryVideos, setLibraryVideos] =
    useState<BunnyLibraryVideo[]>([]);

  useEffect(() => {
    setVideoId(currentVideoId);
    setStatus(currentStatus);
    setDurationSeconds(0);
  }, [
    currentVideoId,
    currentStatus,
  ]);

  useEffect(() => {
    return () => {
      uploadRef.current?.abort();
    };
  }, []);

  useEffect(() => {
  if (!videoId) return;

  const normalizedStatus =
    status?.trim().toLowerCase() ?? "";

  const failed =
    normalizedStatus === "failed" ||
    normalizedStatus === "upload_failed";

  const metadataComplete =
    (normalizedStatus === "ready" ||
      normalizedStatus === "playable") &&
    durationSeconds > 0;

  if (failed || metadataComplete) return;

  let cancelled = false;
  let syncing = false;

  async function checkBunnyStatus() {
    if (cancelled || syncing) return;

    syncing = true;

    try {
      const result =
        await syncBunnyVideoMetadata(
          lessonId,
        );

      if (
        cancelled ||
        !result.success
      ) {
        return;
      }

      setStatus(
        result.data.status,
      );
      setDurationSeconds(
        Number(result.data.durationSeconds || 0),
      );

      onChanged?.({
        videoId,
        status:
          result.data.status,
        durationSeconds:
          Number(
            result.data.durationSeconds || 0,
          ),
      });

      if (
        result.data.status === "ready" ||
        result.data.status === "playable"
      ) {
        setProgress(100);
        setMessage(
          "تم تجهيز الفيديو تلقائيًا وأصبح جاهزًا للمشاهدة.",
        );
      }
    } catch (error) {
      console.error(
        "AUTO SYNC BUNNY VIDEO ERROR",
        error,
      );
    } finally {
      syncing = false;
    }
  }

  void checkBunnyStatus();

  const timer =
    window.setInterval(
      () => {
        void checkBunnyStatus();
      },
      30000,
    );

  return () => {
    cancelled = true;
    window.clearInterval(timer);
  };
}, [
  lessonId,
  videoId,
  status,
  durationSeconds,
  onChanged,
]);

  async function uploadFile(
    file: File,
  ) {
    if (!lessonId) {
      setMessage(
        "احفظي الدرس أولًا قبل رفع الفيديو.",
      );
      return;
    }

    if (
      !file.type.startsWith("video/")
    ) {
      setMessage(
        "اختاري ملف فيديو صالحًا.",
      );
      return;
    }

    setBusy(true);
    setProgress(0);
    setMessage("");
    setFileName(file.name);
    setStatus("uploading");

    const session =
      await createBunnyUploadSession(
        lessonId,
        `${lessonTitle} - ${file.name}`,
      );

    if (!session.success) {
      setBusy(false);
      setStatus(currentStatus);
      setMessage(session.message);
      return;
    }

    const {
      videoId: newVideoId,
      libraryId,
      expirationTime,
      signature,
      endpoint,
      previousVideoId,
    } = session.data;

    const upload = new tus.Upload(
      file,
      {
        endpoint,
        retryDelays: [
          0,
          3000,
          5000,
          10000,
          20000,
          60000,
        ],
        headers: {
          AuthorizationSignature:
            signature,
          AuthorizationExpire:
            String(expirationTime),
          VideoId: newVideoId,
          LibraryId: libraryId,
        },
        metadata: {
          filetype:
            file.type ||
            "video/mp4",
          title:
            `${lessonTitle} - ${file.name}`,
        },
        removeFingerprintOnSuccess:
          true,
        onError(error) {
          console.error(
            "BUNNY TUS UPLOAD ERROR",
            error,
          );

          setBusy(false);
          setStatus("upload_failed");
          setMessage(
            "فشل رفع الفيديو. يمكنك اختيار الملف نفسه مرة أخرى لاستكمال المحاولة.",
          );
        },
        onProgress(
          bytesUploaded,
          bytesTotal,
        ) {
          const value =
            bytesTotal > 0
              ? Math.round(
                  (bytesUploaded /
                    bytesTotal) *
                    100,
                )
              : 0;

          setProgress(value);
        },
        async onSuccess() {
          const result =
            await finalizeBunnyVideoUpload(
              lessonId,
              newVideoId,
              previousVideoId,
            );

          setBusy(false);

          if (!result.success) {
            setStatus("uploaded");
            setMessage(
              result.message,
            );
            return;
          }

          setVideoId(
            result.data.videoId,
          );
          setStatus(
            result.data.status,
          );
          setDurationSeconds(
            Number(result.data.durationSeconds || 0),
          );
          setProgress(100);
          setMessage(
            "تم رفع الفيديو. Bunny يقوم الآن بتحويله للجودات المطلوبة.",
          );

          onChanged?.({
            videoId:
              result.data.videoId,
            status:
              result.data.status,
            durationSeconds:
              Number(result.data.durationSeconds || 0),
          });
        },
      },
    );

    uploadRef.current = upload;

    upload.start();
  }

  async function openLibrary() {
    if (!lessonId || busy) return;

    setLibraryOpen(true);
    setLibraryLoading(true);
    setMessage("");

    const result = await getBunnyLibraryVideos();

    setLibraryLoading(false);

    if (!result.success) {
      setMessage(result.message);
      return;
    }

    setLibraryVideos(result.data);
  }

  async function chooseExistingVideo(item: BunnyLibraryVideo) {
    if (busy) return;

    setBusy(true);
    setMessage("");

    const result = await attachExistingBunnyVideo(
      lessonId,
      item.videoId,
    );

    setBusy(false);

    if (!result.success) {
      setMessage(result.message);
      return;
    }

    setVideoId(result.data.videoId);
    setStatus(result.data.status);
    setDurationSeconds(
      Number(result.data.durationSeconds || 0),
    );
    setProgress(100);
    setLibraryOpen(false);

    onChanged?.({
      videoId: result.data.videoId,
      status: result.data.status,
      durationSeconds: Number(result.data.durationSeconds || 0),
    });

    setMessage("تم ربط الفيديو الموجود بالدرس بنجاح.");
  }

  async function syncStatus() {
    if (!videoId || busy) return;

    setBusy(true);
    setMessage("");

    const result =
      await syncBunnyVideoMetadata(
        lessonId,
      );

    setBusy(false);

    if (!result.success) {
      setMessage(result.message);
      return;
    }

    setStatus(result.data.status);
    setDurationSeconds(
      Number(result.data.durationSeconds || 0),
    );

    setMessage(
      result.data.status === "ready"
        ? "الفيديو جاهز للتشغيل."
        : `الحالة: ${statusLabel(
            result.data.status,
          )} — التحويل ${result.data.encodeProgress}%`,
    );

    onChanged?.({
      videoId,
      status:
        result.data.status,
      durationSeconds:
        Number(result.data.durationSeconds || 0),
    });
  }

  async function removeVideo() {
    if (
      !videoId ||
      !confirm(
        "هل تريدين فك ربط الفيديو من هذا الدرس؟ سيبقى الفيديو محفوظًا في مكتبة Bunny.",
      )
    ) {
      return;
    }

    setBusy(true);
    setMessage("");

    const result =
      await removeLessonBunnyVideo(
        lessonId,
      );

    setBusy(false);

    if (!result.success) {
      setMessage(result.message);
      return;
    }

    setVideoId(null);
    setStatus(null);
    setDurationSeconds(0);
    setProgress(0);
    setFileName("");

    onChanged?.({
      videoId: null,
      status: null,
      durationSeconds: 0,
    });

    setMessage(
      "تم فك ربط الفيديو من الدرس، وما زال محفوظًا في مكتبة Bunny.",
    );
  }

  const isReady =
    status === "ready" ||
    status === "playable";

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#07152E] text-[#F7B548]">
            <Video className="h-5 w-5" />
          </div>

          <div>
            <p className="font-black text-[#07152E]">
              فيديو الدرس — Bunny Stream
            </p>

            <p className="mt-1 text-xs font-bold text-slate-500">
              {videoId
                ? `Video ID: ${videoId}`
                : "لم يتم رفع فيديو بعد"}
            </p>
          </div>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-black ${
            isReady
              ? "bg-emerald-100 text-emerald-700"
              : status
                ? "bg-amber-100 text-amber-700"
                : "bg-slate-200 text-slate-600"
          }`}
        >
          {statusLabel(status)}
        </span>
      </div>

      {busy && progress > 0 ? (
        <div>
          <div className="mb-2 flex items-center justify-between text-xs font-black text-slate-600">
            <span>
              {fileName ||
                "جارٍ رفع الفيديو"}
            </span>
            <span>{progress}%</span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-[#F7B548] transition-all"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>
        </div>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(event) => {
          const file =
            event.target.files?.[0];

          if (file) {
            void uploadFile(file);
          }

          event.currentTarget.value =
            "";
        }}
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            inputRef.current?.click()
          }
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#F7B548] px-4 text-sm font-black text-[#07152E] disabled:opacity-50"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <UploadCloud className="h-4 w-4" />
          )}

          {videoId
            ? "استبدال الفيديو"
            : "رفع الفيديو"}
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={() => void openLibrary()}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#F7B548] bg-white px-4 text-sm font-black text-[#07152E] disabled:opacity-50"
        >
          <Video className="h-4 w-4" />
          اختيار فيديو موجود
        </button>

        {videoId ? (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={syncStatus}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-black text-slate-700 disabled:opacity-50"
            >
              <RefreshCw className="h-4 w-4" />
              تحديث الحالة
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={removeVideo}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-sm font-black text-red-600 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              فك ربط الفيديو
            </button>
          </>
        ) : null}
      </div>

      {libraryOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div
            dir="rtl"
            className="max-h-[80vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-200 p-5">
              <div>
                <h3 className="text-lg font-black text-[#07152E]">
                  اختيار فيديو من مكتبة Bunny
                </h3>
                <p className="mt-1 text-xs font-bold text-slate-500">
                  لن يتم رفع نسخة جديدة من الفيديو.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLibraryOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-black"
              >
                إغلاق
              </button>
            </div>

            <div className="max-h-[65vh] overflow-y-auto p-5">
              {libraryLoading ? (
                <div className="flex items-center justify-center gap-2 py-12 font-black text-slate-600">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  جارٍ تحميل مكتبة Bunny...
                </div>
              ) : libraryVideos.length === 0 ? (
                <p className="py-12 text-center font-bold text-slate-500">
                  لا توجد فيديوهات في المكتبة.
                </p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {libraryVideos.map((item) => {
                    const hours = Math.floor(item.durationSeconds / 3600);
                    const minutes = Math.floor((item.durationSeconds % 3600) / 60);
                    const seconds = Math.floor(item.durationSeconds % 60);
                    const duration = [
                      hours ? `${hours} س` : "",
                      minutes ? `${minutes} د` : "",
                      `${seconds} ث`,
                    ].filter(Boolean).join(" ");

                    return (
                      <button
                        key={item.videoId}
                        type="button"
                        disabled={busy}
                        onClick={() => void chooseExistingVideo(item)}
                        className="overflow-hidden rounded-2xl border border-slate-200 bg-white text-right transition hover:border-[#F7B548] hover:shadow-md disabled:opacity-50"
                      >
                        {item.thumbnailUrl ? (
                          <img
                            src={item.thumbnailUrl}
                            alt=""
                            className="aspect-video w-full bg-slate-100 object-cover"
                          />
                        ) : (
                          <div className="flex aspect-video w-full items-center justify-center bg-slate-100">
                            <Video className="h-10 w-10 text-slate-400" />
                          </div>
                        )}

                        <div className="space-y-2 p-4">
                          <p className="line-clamp-2 font-black text-[#07152E]">
                            {item.title}
                          </p>
                          <div className="flex flex-wrap gap-2 text-xs font-bold text-slate-500">
                            <span>{duration}</span>
                            <span>•</span>
                            <span>{statusLabel(item.status)}</span>
                            <span>•</span>
                            <span>
                              {(item.storageSize / 1024 / 1024 / 1024).toFixed(2)} GB
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {isReady ? (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">
          <CheckCircle2 className="h-5 w-5" />
          الفيديو جاهز للمشاهدة.
        </div>
      ) : null}

      {message ? (
        <p className="text-xs font-bold leading-6 text-slate-600">
          {message}
        </p>
      ) : null}
    </div>
  );
}