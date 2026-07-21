"use client";

import {
  ImageIcon,
  Link2,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react";

import {
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";

import { createClient } from "@/lib/supabase/client";

import type {
  ProfessionalContentBlock,
  ProfessionalImageBlock,
} from "./ProfessionalPanelTypes";

const STORAGE_BUCKET = "course-images";
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

type ProfessionalImageEditorProps = {
  block: ProfessionalImageBlock;
  onChange: (block: ProfessionalContentBlock) => void;
};

export default function ProfessionalImageEditor({
  block,
  onChange,
}: ProfessionalImageEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isUploading, setIsUploading] =
    useState(false);

  const [uploadError, setUploadError] =
    useState("");

  const handleImageUpload = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    // يسمح باختيار نفس الملف مرة أخرى.
    event.target.value = "";

    if (!file) {
      return;
    }

    setUploadError("");

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setUploadError(
        "نوع الصورة غير مدعوم. استخدمي JPG أو PNG أو WEBP أو GIF."
      );
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setUploadError(
        "حجم الصورة أكبر من 5 ميجابايت. اختاري صورة أصغر."
      );
      return;
    }

    setIsUploading(true);

    try {
      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error(
          "يجب تسجيل الدخول قبل رفع الصورة."
        );
      }

      const extension =
        getSafeFileExtension(file);

      const fileName =
        `${crypto.randomUUID()}.${extension}`;

      /*
       * كل مستخدم يرفع ملفاته داخل مجلد يحمل معرفه.
       * نضيف معرف البلوك لتسهيل تنظيم الصور.
       */
      const filePath = [
        user.id,
        "professional-panel",
        block.id,
        fileName,
      ].join("/");

      const { error: uploadError } =
        await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(filePath, file, {
            cacheControl: "3600",
            contentType: file.type,
            upsert: false,
          });

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } =
        supabase.storage
          .from(STORAGE_BUCKET)
          .getPublicUrl(filePath);

      if (!publicUrlData.publicUrl) {
        throw new Error(
          "تم رفع الصورة، لكن تعذر إنشاء رابط العرض."
        );
      }

      onChange({
        ...block,
        imageUrl: publicUrlData.publicUrl,
        altText:
          block.altText.trim() ||
          removeFileExtension(file.name),
      });
    } catch (error) {
      console.error(
        "Failed to upload course image:",
        error
      );

      setUploadError(
        getUploadErrorMessage(error)
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    onChange({
      ...block,
      imageUrl: "",
    });

    setUploadError("");
  };

  const hasImage =
    block.imageUrl.trim().length > 0;

  return (
    <section className="space-y-5 rounded-2xl border border-[#DCE3EB] bg-white p-4 sm:p-5">
      {/* ==================================================
          رفع الصورة
      ================================================== */}

      <div>
        <span className="mb-2 block text-xs font-black text-[#07152E]">
          صورة المحتوى
        </span>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleImageUpload}
          className="hidden"
        />

        <button
          type="button"
          disabled={isUploading}
          onClick={() =>
            fileInputRef.current?.click()
          }
          className="
            flex min-h-12 w-full
            items-center justify-center gap-2
            rounded-xl border-2 border-dashed
            border-[#F7B548]/70
            bg-[#FFF9EB] px-4 py-3
            text-sm font-black text-[#07152E]
            transition

            hover:border-[#F7B548]
            hover:bg-[#FFF4D5]

            disabled:cursor-not-allowed
            disabled:opacity-60
          "
        >
          {isUploading ? (
            <>
              <Loader2
                size={18}
                className="animate-spin"
              />
              جارٍ رفع الصورة...
            </>
          ) : (
            <>
              <Upload size={18} />
              اختر صورة من الجهاز
            </>
          )}
        </button>

        <p className="mt-2 text-[11px] font-bold text-slate-400">
          الصيغ المتاحة: JPG، PNG، WEBP وGIF —
          الحد الأقصى 5 ميجابايت.
        </p>

        {uploadError && (
          <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-700">
            {uploadError}
          </p>
        )}
      </div>

      {/* ==================================================
          الفاصل
      ================================================== */}

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-[#E2E7ED]" />

        <span className="text-[11px] font-black text-slate-400">
          أو استخدمي رابطًا
        </span>

        <span className="h-px flex-1 bg-[#E2E7ED]" />
      </div>

      {/* ==================================================
          رابط خارجي
      ================================================== */}

      <EditorField label="رابط الصورة">
        <div className="relative">
          <Link2
            size={17}
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="url"
            value={block.imageUrl}
            disabled={isUploading}
            onChange={(event) => {
              setUploadError("");

              onChange({
                ...block,
                imageUrl: event.target.value,
              });
            }}
            placeholder="/images/example.jpg أو https://..."
            className={`${inputClassName} pr-11`}
          />
        </div>
      </EditorField>

      {/* ==================================================
          المعاينة
      ================================================== */}

      {hasImage ? (
        <div className="overflow-hidden rounded-2xl border border-[#DCE3EB] bg-[#F8FAFC]">
          <div className="relative min-h-[180px] bg-[#EFF3F7]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={block.imageUrl}
              alt={
                block.altText ||
                block.title ||
                "معاينة الصورة"
              }
              className="max-h-[420px] w-full object-contain"
              onError={() =>
                setUploadError(
                  "تعذر عرض الصورة. تحققي من صحة الرابط أو ارفعي صورة أخرى."
                )
              }
              onLoad={() =>
                setUploadError("")
              }
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#DCE3EB] bg-white px-4 py-3">
            <div className="flex items-center gap-2 text-xs font-black text-[#07152E]">
              <ImageIcon
                size={16}
                className="text-[#D49319]"
              />
              معاينة الصورة
            </div>

            <button
              type="button"
              disabled={isUploading}
              onClick={handleRemoveImage}
              className="
                inline-flex items-center gap-2
                rounded-lg border border-red-200
                bg-red-50 px-3 py-2
                text-xs font-black text-red-700
                transition hover:bg-red-100

                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              <Trash2 size={15} />
              إزالة الصورة
            </button>
          </div>
        </div>
      ) : (
        <div className="flex min-h-[170px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#DCE3EB] bg-[#F8FAFC] px-5 text-center">
          <ImageIcon
            size={34}
            className="text-slate-300"
          />

          <p className="mt-3 text-sm font-black text-[#07152E]">
            لا توجد صورة حاليًا
          </p>

          <p className="mt-1 text-xs font-bold text-slate-400">
            ارفعي صورة من الجهاز أو أضيفي رابطًا.
          </p>
        </div>
      )}

      {/* ==================================================
          بيانات الصورة
      ================================================== */}

      <EditorField label="النص البديل للصورة">
        <input
          value={block.altText}
          onChange={(event) =>
            onChange({
              ...block,
              altText: event.target.value,
            })
          }
          placeholder="وصف مختصر وواضح للصورة"
          className={inputClassName}
        />
      </EditorField>

      <EditorField
        label="تعليق أسفل الصورة"
        optional
      >
        <textarea
          value={block.caption}
          onChange={(event) =>
            onChange({
              ...block,
              caption: event.target.value,
            })
          }
          placeholder="يمكن كتابة وصف أو توضيح يظهر أسفل الصورة."
          rows={3}
          className={`${inputClassName} resize-y`}
        />
      </EditorField>
    </section>
  );
}

/* ==================================================
   Helpers
================================================== */

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

function getSafeFileExtension(
  file: File
): string {
  const extensionFromName =
    file.name
      .split(".")
      .pop()
      ?.toLowerCase()
      .replace(/[^a-z0-9]/g, "");

  if (extensionFromName) {
    return extensionFromName === "jpeg"
      ? "jpg"
      : extensionFromName;
  }

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

function removeFileExtension(
  fileName: string
): string {
  return fileName.replace(/\.[^/.]+$/, "");
}

function getUploadErrorMessage(
  error: unknown
): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "حدث خطأ أثناء رفع الصورة. حاولي مرة أخرى.";
}

const inputClassName =
  "w-full rounded-xl border border-[#D8E0E9] bg-white px-4 py-3 text-sm font-bold text-[#07152E] outline-none transition placeholder:text-slate-400 focus:border-[#F7B548] focus:ring-4 focus:ring-[#F7B548]/15 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-70";