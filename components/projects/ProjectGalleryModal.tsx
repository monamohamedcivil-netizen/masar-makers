"use client";

import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  ImageIcon,
  MapPin,
  X,
} from "lucide-react";
import { createPortal } from "react-dom";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

export type ProjectGalleryData = {
  id: string;
  title: string;
  description?: string | null;
  studentName?: string | null;
  studentCountry?: string | null;
  courseTitle?: string | null;
  images: string[];
  projectLink?: string | null;
};

type Props = {
  project: ProjectGalleryData | null;
  onClose: () => void;
};

export default function ProjectGalleryModal({
  project,
  onClose,
}: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  const images = useMemo(
    () =>
      Array.from(
        new Set(
          (project?.images ?? [])
            .map((image) => image.trim())
            .filter(Boolean),
        ),
      ),
    [project],
  );

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    setActiveIndex(0);
  }, [project?.id]);

  useEffect(() => {
    if (!project) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }

      if (event.key === "ArrowRight" && images.length > 1) {
        setActiveIndex((current) =>
          current === 0 ? images.length - 1 : current - 1,
        );
      }

      if (event.key === "ArrowLeft" && images.length > 1) {
        setActiveIndex((current) =>
          current === images.length - 1 ? 0 : current + 1,
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [images.length, onClose, project]);

  if (!project || !mounted) {
    return null;
  }

  const activeImage = images[activeIndex] ?? null;

  const goPrevious = () => {
    setActiveIndex((current) =>
      current === 0 ? images.length - 1 : current - 1,
    );
  };

  const goNext = () => {
    setActiveIndex((current) =>
      current === images.length - 1 ? 0 : current + 1,
    );
  };

  return createPortal(
    <div
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-label={`عرض مشروع ${project.title}`}
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-[#07152E]/92 p-3 backdrop-blur-sm sm:p-4 lg:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="relative my-auto flex w-full max-w-[1180px] flex-col overflow-hidden rounded-[20px] border border-white/15 bg-white shadow-[0_30px_100px_rgba(0,0,0,0.45)] sm:rounded-[24px] lg:max-h-[88vh] lg:flex-row">
        <button
          type="button"
          onClick={onClose}
          aria-label="إغلاق معرض المشروع"
          className="absolute left-3 top-3 z-40 flex h-9 w-9 items-center justify-center rounded-full bg-[#07152E]/85 text-white shadow-lg backdrop-blur transition hover:bg-[#F7B548] hover:text-[#07152E] sm:left-4 sm:top-4 sm:h-10 sm:w-10"
        >
          <X size={18} />
        </button>

        {/* Image area */}
        <div className="flex min-h-0 flex-1 flex-col bg-[#07152E] lg:min-w-0">
          <div className="relative flex h-[320px] items-center justify-center overflow-hidden bg-[#07152E] p-3 sm:h-[390px] sm:p-4 md:h-[470px] lg:h-auto lg:min-h-[540px] lg:flex-1 lg:p-5">
            {activeImage ? (
              <img
                src={activeImage}
                alt={`${project.title} - الصورة ${activeIndex + 1}`}
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center gap-3 text-slate-400">
                <ImageIcon size={48} />
                <p className="text-sm font-bold">
                  لا توجد صور للمشروع
                </p>
              </div>
            )}

            {images.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={goPrevious}
                  aria-label="الصورة السابقة"
                  className="absolute right-2 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#07152E] shadow-lg transition hover:bg-[#F7B548] sm:right-3 sm:h-10 sm:w-10"
                >
                  <ArrowRight size={18} />
                </button>

                <button
                  type="button"
                  onClick={goNext}
                  aria-label="الصورة التالية"
                  className="absolute left-2 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#07152E] shadow-lg transition hover:bg-[#F7B548] sm:left-3 sm:h-10 sm:w-10"
                >
                  <ArrowLeft size={18} />
                </button>
              </>
            ) : null}

            {images.length > 0 ? (
              <span className="absolute bottom-2 left-2 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-black text-white backdrop-blur sm:bottom-3 sm:left-3 sm:px-3 sm:text-[11px]">
                {activeIndex + 1} / {images.length}
              </span>
            ) : null}
          </div>

          {images.length > 1 ? (
            <div className="flex gap-2 overflow-x-auto border-t border-white/10 bg-[#0B1C38] p-2.5 sm:p-3">
              {images.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={`relative h-[54px] w-[82px] shrink-0 overflow-hidden rounded-lg border-2 transition sm:h-[60px] sm:w-[92px] ${
                    index === activeIndex
                      ? "border-[#F7B548] opacity-100"
                      : "border-transparent opacity-55 hover:opacity-100"
                  }`}
                >
                  <img
                    src={image}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {/* Details */}
        <aside className="w-full shrink-0 overflow-y-auto bg-white p-4 sm:p-5 lg:w-[330px] lg:p-6">
          <span className="inline-flex rounded-full bg-[#FFF7E3] px-2.5 py-1 text-[9px] font-black text-[#B87508] sm:px-3 sm:py-1.5 sm:text-[10px]">
            مشروع تطبيقي
          </span>

          <h2 className="mt-3 text-[18px] font-black leading-7 text-[#07152E] sm:text-[20px] lg:text-[22px] lg:leading-8">
            {project.title}
          </h2>

          {project.courseTitle ? (
            <p className="mt-1.5 text-[10px] font-black text-[#D49319] sm:text-[11px]">
              {project.courseTitle}
            </p>
          ) : null}

          <div className="mt-4 rounded-xl border border-[#E2E7EE] bg-[#F8FAFC] p-3 sm:rounded-2xl sm:p-3.5">
            <p className="text-[9px] font-bold text-slate-400 sm:text-[10px]">
              تنفيذ المتدرب
            </p>

            <div className="mt-2 flex items-center gap-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#07152E] text-[12px] font-black text-[#F7B548] sm:h-9 sm:w-9 sm:text-[13px]">
                {(
                  project.studentName?.trim()?.[0] ??
                  "M"
                ).toUpperCase()}
              </span>

              <div className="min-w-0">
                <p className="truncate text-[11px] font-black text-[#07152E] sm:text-[12px]">
                  {project.studentName ||
                    "أحد متدربي Masar Makers"}
                </p>

                {project.studentCountry ? (
                  <p className="mt-1 flex items-center gap-1 text-[9px] font-bold text-slate-500 sm:text-[10px]">
                    <MapPin
                      size={11}
                      className="text-[#D49319]"
                    />
                    {project.studentCountry}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          {project.description ? (
            <div className="mt-4">
              <h3 className="text-[11px] font-black text-[#07152E] sm:text-[12px]">
                وصف المشروع
              </h3>

              <p className="mt-1.5 whitespace-pre-line text-[10px] font-medium leading-5 text-slate-600 sm:text-[11px]">
                {project.description}
              </p>
            </div>
          ) : null}

          <div className="mt-4 flex items-center justify-between border-y border-[#E5E9EF] py-3">
            <span className="text-[10px] font-bold text-slate-500">
              عدد الصور
            </span>

            <span className="rounded-full bg-[#07152E] px-2.5 py-1 text-[10px] font-black text-white">
              {images.length}
            </span>
          </div>

          {project.projectLink ? (
            <a
              href={project.projectLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#07152E] px-4 text-[11px] font-black text-white transition hover:bg-[#F7B548] hover:text-[#07152E]"
            >
              عرض رابط المشروع
              <ExternalLink size={15} />
            </a>
          ) : null}
        </aside>
      </div>
    </div>,
    document.body,
  );
}