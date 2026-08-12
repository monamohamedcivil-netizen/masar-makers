"use client";

import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  ImageIcon,
  MapPin,
  X,
} from "lucide-react";

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
  const [activeIndex, setActiveIndex] =
    useState(0);

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
    setActiveIndex(0);
  }, [project?.id]);

  useEffect(() => {
    if (!project) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (event.key === "Escape") {
        onClose();
      }

      if (
        event.key === "ArrowRight" &&
        images.length > 1
      ) {
        setActiveIndex((current) =>
          current === 0
            ? images.length - 1
            : current - 1,
        );
      }

      if (
        event.key === "ArrowLeft" &&
        images.length > 1
      ) {
        setActiveIndex((current) =>
          current === images.length - 1
            ? 0
            : current + 1,
        );
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [images.length, onClose, project]);

  if (!project) {
    return null;
  }

  const activeImage =
    images[activeIndex] ?? null;

  const goPrevious = () => {
    setActiveIndex((current) =>
      current === 0
        ? images.length - 1
        : current - 1,
    );
  };

  const goNext = () => {
    setActiveIndex((current) =>
      current === images.length - 1
        ? 0
        : current + 1,
    );
  };

  return (
    <div
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-label={`عرض مشروع ${project.title}`}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-[#07152E]/90 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="relative flex max-h-[94vh] w-full max-w-[1250px] flex-col overflow-hidden rounded-[28px] border border-white/15 bg-white shadow-[0_30px_100px_rgba(0,0,0,0.45)] lg:flex-row">
        <button
          type="button"
          onClick={onClose}
          aria-label="إغلاق معرض المشروع"
          className="absolute left-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-[#07152E]/80 text-white shadow-lg backdrop-blur transition hover:bg-[#F7B548] hover:text-[#07152E]"
        >
          <X size={19} />
        </button>

        <div className="flex min-h-[360px] flex-1 flex-col bg-[#07152E] lg:min-h-[650px]">
          <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-[#07152E] p-4 sm:p-7">
            {activeImage ? (
              <img
                src={activeImage}
                alt={`${project.title} - الصورة ${
                  activeIndex + 1
                }`}
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center gap-3 text-slate-400">
                <ImageIcon size={54} />

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
                  className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#07152E] shadow-lg transition hover:bg-[#F7B548]"
                >
                  <ArrowRight size={20} />
                </button>

                <button
                  type="button"
                  onClick={goNext}
                  aria-label="الصورة التالية"
                  className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#07152E] shadow-lg transition hover:bg-[#F7B548]"
                >
                  <ArrowLeft size={20} />
                </button>
              </>
            ) : null}

            {images.length > 0 ? (
              <span className="absolute bottom-4 left-4 rounded-full bg-black/55 px-3 py-1.5 text-[11px] font-black text-white backdrop-blur">
                {activeIndex + 1} / {images.length}
              </span>
            ) : null}
          </div>

          {images.length > 1 ? (
            <div className="flex gap-2 overflow-x-auto border-t border-white/10 bg-[#0B1C38] p-3">
              {images.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() =>
                    setActiveIndex(index)
                  }
                  className={`relative h-[68px] w-[105px] shrink-0 overflow-hidden rounded-xl border-2 transition ${
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

        <aside className="w-full shrink-0 overflow-y-auto bg-white p-6 lg:w-[390px] lg:p-8">
          <span className="inline-flex rounded-full bg-[#FFF7E3] px-3 py-1.5 text-[10px] font-black text-[#B87508]">
            مشروع تطبيقي
          </span>

          <h2 className="mt-4 text-[24px] font-black leading-9 text-[#07152E]">
            {project.title}
          </h2>

          {project.courseTitle ? (
            <p className="mt-2 text-[12px] font-black text-[#D49319]">
              {project.courseTitle}
            </p>
          ) : null}

          <div className="mt-6 rounded-2xl border border-[#E2E7EE] bg-[#F8FAFC] p-4">
            <p className="text-[10px] font-bold text-slate-400">
              تنفيذ المتدرب
            </p>

            <div className="mt-2 flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#07152E] text-[13px] font-black text-[#F7B548]">
                {(
                  project.studentName?.trim()?.[0] ??
                  "M"
                ).toUpperCase()}
              </span>

              <div>
                <p className="text-[13px] font-black text-[#07152E]">
                  {project.studentName ||
                    "أحد متدربي Masar Makers"}
                </p>

                {project.studentCountry ? (
                  <p className="mt-1 flex items-center gap-1 text-[10px] font-bold text-slate-500">
                    <MapPin
                      size={12}
                      className="text-[#D49319]"
                    />

                    {project.studentCountry}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          {project.description ? (
            <div className="mt-6">
              <h3 className="text-[13px] font-black text-[#07152E]">
                وصف المشروع
              </h3>

              <p className="mt-2 whitespace-pre-line text-[12px] font-medium leading-6 text-slate-600">
                {project.description}
              </p>
            </div>
          ) : null}

          <div className="mt-6 flex items-center justify-between border-y border-[#E5E9EF] py-4">
            <span className="text-[11px] font-bold text-slate-500">
              عدد الصور
            </span>

            <span className="rounded-full bg-[#07152E] px-3 py-1 text-[11px] font-black text-white">
              {images.length}
            </span>
          </div>

          {project.projectLink ? (
            <a
              href={project.projectLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#07152E] px-5 text-[12px] font-black text-white transition hover:bg-[#F7B548] hover:text-[#07152E]"
            >
              عرض رابط المشروع
              <ExternalLink size={16} />
            </a>
          ) : null}
        </aside>
      </div>
    </div>
  );
}