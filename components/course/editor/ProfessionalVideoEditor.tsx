"use client";

import {
  Film,
  ImageIcon,
  Link2,
  Loader2,
  Play,
  Trash2,
  Upload,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type ReactNode,
} from "react";

import { createClient } from "@/lib/supabase/client";

import type {
  ProfessionalContentBlock,
  ProfessionalVideoBlock,
  ProfessionalVideoProvider,
} from "./ProfessionalPanelTypes";

type ProfessionalVideoEditorProps = {
  block: ProfessionalVideoBlock;
  onChange: (block: ProfessionalContentBlock) => void;
};

const STORAGE_BUCKET = "course-images";
const STORAGE_FOLDER = "video-thumbnails";
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const VIDEO_PROVIDERS: Array<{
  value: ProfessionalVideoProvider;
  label: string;
  description: string;
}> = [
  {
    value: "youtube",
    label: "YouTube",
    description: "فيديو منشور على يوتيوب",
  },
  {
    value: "vimeo",
    label: "Vimeo",
    description: "فيديو منشور على Vimeo",
  },
  {
    value: "mp4",
    label: "MP4",
    description: "رابط مباشر لملف فيديو",
  },
];

export default function ProfessionalVideoEditor({
  block,
  onChange,
}: ProfessionalVideoEditorProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [previewError, setPreviewError] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [useYoutubeThumbnail, setUseYoutubeThumbnail] = useState(
    block.provider === "youtube" &&
      (!block.thumbnail || isYouTubeThumbnail(block.thumbnail))
  );

  const generatedThumbnail = useMemo(() => {
    if (block.provider !== "youtube") return "";

    const youtubeId = extractYouTubeVideoId(block.videoUrl);

    return youtubeId
      ? `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`
      : "";
  }, [block.provider, block.videoUrl]);

  const embedUrl = useMemo(
    () => getVideoEmbedUrl(block.provider, block.videoUrl),
    [block.provider, block.videoUrl]
  );

  const hasVideoUrl = block.videoUrl.trim().length > 0;

  useEffect(() => {
    if (
      block.provider !== "youtube" ||
      !useYoutubeThumbnail ||
      !generatedThumbnail
    ) {
      return;
    }

    if (block.thumbnail !== generatedThumbnail) {
      onChange({
        ...block,
        thumbnail: generatedThumbnail,
      });
    }
  }, [
    block,
    generatedThumbnail,
    onChange,
    useYoutubeThumbnail,
  ]);

  const handleProviderChange = (
    provider: ProfessionalVideoProvider
  ) => {
    setPreviewError("");
    setUploadError("");

    const switchingToYouTube = provider === "youtube";
    setUseYoutubeThumbnail(switchingToYouTube);

    onChange({
      ...block,
      provider,
      thumbnail:
        switchingToYouTube && generatedThumbnail
          ? generatedThumbnail
          : isYouTubeThumbnail(block.thumbnail)
            ? ""
            : block.thumbnail,
    });
  };

  const handleVideoUrlChange = (videoUrl: string) => {
    setPreviewError("");

    let nextThumbnail = block.thumbnail;

    if (block.provider === "youtube") {
      const youtubeId = extractYouTubeVideoId(videoUrl);
      const youtubeThumbnail = youtubeId
        ? `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`
        : "";

      if (useYoutubeThumbnail) {
        nextThumbnail = youtubeThumbnail;
      } else if (isYouTubeThumbnail(nextThumbnail)) {
        nextThumbnail = "";
      }
    }

    onChange({
      ...block,
      videoUrl,
      thumbnail: nextThumbnail,
    });
  };

  const handleYoutubeThumbnailToggle = (checked: boolean) => {
    setUseYoutubeThumbnail(checked);
    setUploadError("");

    if (checked) {
      onChange({
        ...block,
        thumbnail: generatedThumbnail,
      });
      return;
    }

    if (isYouTubeThumbnail(block.thumbnail)) {
      onChange({
        ...block,
        thumbnail: "",
      });
    }
  };

  const handleFileInputChange = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (file) {
      await uploadThumbnail(file);
    }

    event.target.value = "";
  };

  const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];

    if (file) {
      await uploadThumbnail(file);
    }
  };

  const uploadThumbnail = async (file: File) => {
    setUploadError("");

    if (!file.type.startsWith("image/")) {
      setUploadError("الملف المختار ليس صورة صالحة.");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setUploadError("حجم الصورة يجب ألا يزيد عن 5 MB.");
      return;
    }

    setIsUploading(true);

    try {
      const supabase = createClient();
      const extension = getSafeFileExtension(file);
      const filePath = `${STORAGE_FOLDER}/${block.id}/${Date.now()}-${createRandomId()}.${extension}`;

      const { error: uploadStorageError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, file, {
          cacheControl: "3600",
          contentType: file.type,
          upsert: false,
        });

      if (uploadStorageError) {
        throw uploadStorageError;
      }

      const { data } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath);

      if (!data.publicUrl) {
        throw new Error("تعذر إنشاء رابط عام للصورة.");
      }

      setUseYoutubeThumbnail(false);

      onChange({
        ...block,
        thumbnail: data.publicUrl,
      });
    } catch (error) {
      console.error("Video thumbnail upload failed:", error);

      setUploadError(
        error instanceof Error
          ? error.message
          : "تعذر رفع الصورة. حاولي مرة أخرى."
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveThumbnail = () => {
    setUploadError("");
    setUseYoutubeThumbnail(false);

    onChange({
      ...block,
      thumbnail: "",
    });
  };

  return (
    <section className="space-y-5 rounded-2xl border border-[#DCE3EB] bg-white p-4 sm:p-5">
      <div>
        <span className="mb-3 block text-xs font-black text-[#07152E]">
          نوع الفيديو
        </span>

        <div className="grid gap-3 sm:grid-cols-3">
          {VIDEO_PROVIDERS.map((provider) => {
            const isActive = block.provider === provider.value;

            return (
              <button
                key={provider.value}
                type="button"
                onClick={() => handleProviderChange(provider.value)}
                className={`rounded-2xl border px-4 py-4 text-right transition ${
                  isActive
                    ? "border-[#F7B548] bg-[#FFF8E8] shadow-[0_8px_24px_rgba(247,181,72,0.14)]"
                    : "border-[#DCE3EB] bg-white hover:border-[#F7B548]/70 hover:bg-[#FFFDF8]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                      isActive
                        ? "bg-[#F7B548] text-[#07152E]"
                        : "bg-[#EEF2F6] text-slate-500"
                    }`}
                  >
                    {provider.value === "mp4" ? (
                      <Film size={18} />
                    ) : (
                      <Play size={18} />
                    )}
                  </span>

                  <div>
                    <p className="text-sm font-black text-[#07152E]">
                      {provider.label}
                    </p>
                    <p className="mt-1 text-[11px] font-bold leading-5 text-slate-400">
                      {provider.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <EditorField label="عنوان الفيديو">
        <input
          value={block.title}
          onChange={(event) =>
            onChange({
              ...block,
              title: event.target.value,
            })
          }
          placeholder="مثال: تعرف على رحلة الاحتراف"
          className={inputClassName}
        />
      </EditorField>

      <EditorField label={getVideoUrlLabel(block.provider)}>
        <div className="relative">
          <Link2
            size={17}
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="url"
            value={block.videoUrl}
            onChange={(event) =>
              handleVideoUrlChange(event.target.value)
            }
            placeholder={getVideoUrlPlaceholder(block.provider)}
            className={`${inputClassName} pr-11`}
          />
        </div>

        <p className="mt-2 text-[11px] font-bold leading-5 text-slate-400">
          {getVideoHelpText(block.provider)}
        </p>
      </EditorField>

      <div className="space-y-4 rounded-2xl border border-[#DCE3EB] bg-[#F8FAFC] p-4">
        <div>
          <p className="text-xs font-black text-[#07152E]">
            صورة غلاف الفيديو
          </p>
          <p className="mt-1 text-[11px] font-bold leading-5 text-slate-400">
            ارفعي صورة من الجهاز أو أضيفي رابط صورة خارجي.
          </p>
        </div>

        {block.provider === "youtube" && (
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#DCE3EB] bg-white px-4 py-3">
            <input
              type="checkbox"
              checked={useYoutubeThumbnail}
              onChange={(event) =>
                handleYoutubeThumbnailToggle(event.target.checked)
              }
              className="h-4 w-4 accent-[#F7B548]"
            />
            <span className="text-xs font-black text-[#07152E]">
              استخدام صورة YouTube تلقائيًا
            </span>
          </label>
        )}

        <div
          onDragEnter={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={(event) => {
            event.preventDefault();
            setIsDragging(false);
          }}
          onDrop={handleDrop}
          className={`rounded-2xl border-2 border-dashed p-5 text-center transition ${
            isDragging
              ? "border-[#F7B548] bg-[#FFF8E8]"
              : "border-[#CBD5E1] bg-white"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
            onChange={handleFileInputChange}
            className="hidden"
          />

          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#FFF2D0] text-[#C78613]">
            {isUploading ? (
              <Loader2 size={22} className="animate-spin" />
            ) : (
              <Upload size={22} />
            )}
          </span>

          <p className="mt-3 text-sm font-black text-[#07152E]">
            {isUploading
              ? "جارٍ رفع الصورة..."
              : "اسحبي الصورة هنا أو اختاريها من الجهاز"}
          </p>

          <p className="mt-1 text-[11px] font-bold text-slate-400">
            PNG أو JPG أو WEBP — الحد الأقصى 5 MB
          </p>

          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#07152E] px-5 py-2 text-xs font-black text-white transition hover:bg-[#10294E] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Upload size={15} />
            اختر صورة من الجهاز
          </button>
        </div>

        <EditorField label="رابط صورة الغلاف" optional>
          <input
            type="url"
            value={block.thumbnail}
            onChange={(event) => {
              setUseYoutubeThumbnail(false);
              setUploadError("");

              onChange({
                ...block,
                thumbnail: event.target.value,
              });
            }}
            placeholder="https://... أو /images/video-cover.jpg"
            className={inputClassName}
          />
        </EditorField>

        {uploadError && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold leading-6 text-red-700">
            {uploadError}
          </p>
        )}

        {block.thumbnail ? (
          <div className="overflow-hidden rounded-2xl border border-[#DCE3EB] bg-[#07152E]">
            <div className="relative aspect-video">
              <img
                src={block.thumbnail}
                alt={block.title || "صورة غلاف الفيديو"}
                className="absolute inset-0 h-full w-full object-cover"
                onError={() =>
                  setUploadError(
                    "تعذر عرض صورة الغلاف. تحققي من الرابط أو ارفعي صورة أخرى."
                  )
                }
                onLoad={() => setUploadError("")}
              />

              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-gradient-to-t from-black/80 to-transparent p-4 pt-12">
                <span className="inline-flex items-center gap-2 text-xs font-black text-white">
                  <ImageIcon size={15} />
                  معاينة صورة الغلاف
                </span>

                <button
                  type="button"
                  onClick={handleRemoveThumbnail}
                  className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl bg-white/90 px-3 py-2 text-xs font-black text-red-700 transition hover:bg-white"
                >
                  <Trash2 size={14} />
                  حذف الصورة
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex min-h-40 flex-col items-center justify-center rounded-2xl border border-dashed border-[#CBD5E1] bg-white px-5 text-center text-slate-400">
            <ImageIcon size={34} />
            <p className="mt-3 text-xs font-bold">
              لم تتم إضافة صورة غلاف بعد
            </p>
          </div>
        )}
      </div>

      <div>
        <span className="mb-2 block text-xs font-black text-[#07152E]">
          معاينة الفيديو
        </span>

        {!hasVideoUrl ? (
          <EmptyVideoPreview />
        ) : embedUrl ? (
          <div className="overflow-hidden rounded-2xl border border-[#DCE3EB] bg-black">
            <div className="relative aspect-video">
              <iframe
                src={embedUrl}
                title={block.title || "معاينة الفيديو"}
                className="absolute inset-0 h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>
        ) : block.provider === "mp4" ? (
          <div className="overflow-hidden rounded-2xl border border-[#DCE3EB] bg-black">
            <video
              src={block.videoUrl}
              poster={block.thumbnail || undefined}
              controls
              preload="metadata"
              className="aspect-video w-full bg-black object-contain"
              onError={() =>
                setPreviewError(
                  "تعذر تشغيل ملف الفيديو. تأكدي أن الرابط مباشر لملف MP4."
                )
              }
              onLoadedData={() => setPreviewError("")}
            >
              متصفحك لا يدعم تشغيل الفيديو.
            </video>
          </div>
        ) : (
          <InvalidVideoPreview provider={block.provider} />
        )}

        {previewError && (
          <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-700">
            {previewError}
          </p>
        )}
      </div>

      <EditorField label="وصف الفيديو" optional>
        <textarea
          value={block.caption}
          onChange={(event) =>
            onChange({
              ...block,
              caption: event.target.value,
            })
          }
          placeholder="اكتبي وصفًا مختصرًا يظهر أسفل الفيديو."
          rows={3}
          className={`${inputClassName} resize-y`}
        />
      </EditorField>
    </section>
  );
}

function EmptyVideoPreview() {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#DCE3EB] bg-[#F8FAFC] px-5 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FFF2D0] text-[#C78613]">
        <Play size={25} />
      </span>

      <p className="mt-4 text-sm font-black text-[#07152E]">
        لا يوجد فيديو للمعاينة
      </p>

      <p className="mt-1 max-w-sm text-xs font-bold leading-6 text-slate-400">
        اختاري نوع الفيديو ثم أضيفي الرابط ليظهر هنا مباشرة.
      </p>
    </div>
  );
}

function InvalidVideoPreview({
  provider,
}: {
  provider: ProfessionalVideoProvider;
}) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 px-5 text-center">
      <Film size={32} className="text-amber-600" />

      <p className="mt-4 text-sm font-black text-[#07152E]">
        تعذر إنشاء المعاينة
      </p>

      <p className="mt-2 max-w-md text-xs font-bold leading-6 text-amber-700">
        تحققي أن الرابط هو رابط فيديو{" "}
        {provider === "youtube" ? "YouTube" : "Vimeo"} صحيح.
      </p>
    </div>
  );
}

function EditorField({
  label,
  optional = false,
  children,
}: {
  label: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black text-[#07152E]">
        {label}
        {optional && (
          <span className="mr-1 font-bold text-slate-400">
            (اختياري)
          </span>
        )}
      </span>
      {children}
    </label>
  );
}

function isYouTubeThumbnail(value: string) {
  return value.includes("img.youtube.com/vi/");
}

function getSafeFileExtension(file: File) {
  const extensionFromName = file.name
    .split(".")
    .pop()
    ?.toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  if (extensionFromName) return extensionFromName;

  switch (file.type) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return "jpg";
  }
}

function createRandomId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return Math.random().toString(36).slice(2);
}

function extractYouTubeVideoId(value: string): string {
  const normalizedValue = value.trim();

  if (!normalizedValue) return "";

  try {
    const url = new URL(normalizedValue);

    if (
      url.hostname === "youtu.be" ||
      url.hostname === "www.youtu.be"
    ) {
      return url.pathname.replace("/", "").split("/")[0];
    }

    if (url.hostname.includes("youtube.com")) {
      if (url.pathname.startsWith("/shorts/")) {
        return url.pathname.split("/")[2] || "";
      }

      if (url.pathname.startsWith("/embed/")) {
        return url.pathname.split("/")[2] || "";
      }

      return url.searchParams.get("v") || "";
    }
  } catch {
    return normalizedValue.match(/^[a-zA-Z0-9_-]{6,}$/)?.[0] ?? "";
  }

  return "";
}

function extractVimeoVideoId(value: string): string {
  const normalizedValue = value.trim();

  if (!normalizedValue) return "";

  try {
    const url = new URL(normalizedValue);

    if (!url.hostname.includes("vimeo.com")) return "";

    const pathParts = url.pathname.split("/").filter(Boolean);

    return (
      [...pathParts]
        .reverse()
        .find((part) => /^\d+$/.test(part)) || ""
    );
  } catch {
    return /^\d+$/.test(normalizedValue) ? normalizedValue : "";
  }
}

function getVideoEmbedUrl(
  provider: ProfessionalVideoProvider,
  videoUrl: string
): string {
  if (provider === "youtube") {
    const videoId = extractYouTubeVideoId(videoUrl);
    return videoId
      ? `https://www.youtube.com/embed/${videoId}`
      : "";
  }

  if (provider === "vimeo") {
    const videoId = extractVimeoVideoId(videoUrl);
    return videoId
      ? `https://player.vimeo.com/video/${videoId}`
      : "";
  }

  return "";
}

function getVideoUrlLabel(
  provider: ProfessionalVideoProvider
): string {
  switch (provider) {
    case "youtube":
      return "رابط فيديو YouTube";
    case "vimeo":
      return "رابط فيديو Vimeo";
    case "mp4":
      return "رابط ملف MP4";
  }
}

function getVideoUrlPlaceholder(
  provider: ProfessionalVideoProvider
): string {
  switch (provider) {
    case "youtube":
      return "https://www.youtube.com/watch?v=...";
    case "vimeo":
      return "https://vimeo.com/...";
    case "mp4":
      return "https://example.com/video.mp4";
  }
}

function getVideoHelpText(
  provider: ProfessionalVideoProvider
): string {
  switch (provider) {
    case "youtube":
      return "يمكن استخدام رابط الفيديو العادي أو رابط youtu.be أو Shorts.";
    case "vimeo":
      return "استخدمي رابط صفحة الفيديو المنشور على Vimeo.";
    case "mp4":
      return "يجب أن يكون رابطًا مباشرًا ينتهي بملف فيديو مثل .mp4.";
  }
}

const inputClassName =
  "w-full rounded-xl border border-[#D8E0E9] bg-white px-4 py-3 text-sm font-bold text-[#07152E] outline-none transition placeholder:text-slate-400 focus:border-[#F7B548] focus:ring-4 focus:ring-[#F7B548]/15";