"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  MapPinned,
  Route,
  X,
} from "lucide-react";

export type JourneyExplorerType =
  | "integrated"
  | "one_day"
  | "free";

type Locale = "ar" | "en";

type Props = {
  open: boolean;
  journeyType: JourneyExplorerType | null;
  locale: Locale;
  onClose: () => void;
};

const careerPaths = [
  {
    id: "road-design",
    ar: "تصميم الطرق",
    en: "Road Design",
    stations: [
      {
        ar: "Civil 3D",
        en: "Civil 3D",
        slug: "civil-3d",
      },
      {
        ar: "Civil Site Design",
        en: "Civil Site Design",
        slug: "civil-site-design",
      },
      {
        ar: "Smart Project Deliverables",
        en: "Smart Project Deliverables",
        slug: "smart-project-deliverables",
      },
      {
        ar: "Vehicle Tracking",
        en: "Vehicle Tracking",
        slug: "vehicle-tracking",
      },
      {
        ar: "BIM for Roads",
        en: "BIM for Roads",
        slug: "bim-roads",
      },
    ],
  },
  {
    id: "traffic-engineering",
    ar: "هندسة المرور",
    en: "Traffic Engineering",
    stations: [
      {
        ar: "SIDRA",
        en: "SIDRA",
        slug: "sidra",
      },
      {
        ar: "Synchro",
        en: "Synchro",
        slug: "synchro",
      },
      {
        ar: "VISSIM",
        en: "VISSIM",
        slug: "vissim",
      },
      {
        ar: "VISUM",
        en: "VISUM",
        slug: "visum",
      },
      {
        ar: "CUBE",
        en: "CUBE",
        slug: "cube",
      },
    ],
  },
] as const;

const labels = {
  ar: {
    integratedTitle: "استكشف رحلة الاحتراف",
    oneDayTitle: "استكشف رحلات اليوم الواحد",
    freeTitle: "استكشف الرحلات المجانية",
    choosePath: "اختر المسار",
    chooseStation: "اختر المحطة",
    pathPlaceholder: "حدد المسار المهني",
    stationPlaceholder: "حدد المحطة التعليمية",
    continue: "انتقل إلى الرحلة",
    close: "إغلاق",
  },
  en: {
    integratedTitle: "Explore Professional Journey",
    oneDayTitle: "Explore One-Day Journeys",
    freeTitle: "Explore Free Journeys",
    choosePath: "Choose Career Path",
    chooseStation: "Choose Station",
    pathPlaceholder: "Select a career path",
    stationPlaceholder: "Select a learning station",
    continue: "Go to Journey",
    close: "Close",
  },
} as const;

export default function JourneyExplorerModal({
  open,
  journeyType,
  locale,
  onClose,
}: Props) {
  const router = useRouter();
  const [pathId, setPathId] = useState("");
  const [stationSlug, setStationSlug] = useState("");

  useEffect(() => {
    if (!open) return;

    setPathId("");
    setStationSlug("");
  }, [open, journeyType]);

  useEffect(() => {
    if (!open) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);

  const text = labels[locale];

  const selectedPath = useMemo(
    () =>
      careerPaths.find((path) => path.id === pathId) ??
      null,
    [pathId],
  );

  if (!open || !journeyType) {
    return null;
  }

  const title =
    journeyType === "integrated"
      ? text.integratedTitle
      : journeyType === "one_day"
        ? text.oneDayTitle
        : text.freeTitle;

  const canContinue =
    Boolean(pathId) && Boolean(stationSlug);

  const goToJourney = () => {
    if (!canContinue) return;

    router.push(
      `/course/${stationSlug}?journey=${journeyType}`,
    );

    onClose();
  };

  const BackIcon =
    locale === "ar" ? ArrowLeft : ArrowRight;

  return (
    <div
      dir={locale === "ar" ? "rtl" : "ltr"}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#020817]/55 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) {
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-[520px] overflow-hidden rounded-[24px] border border-[#F7B548]/35 bg-white shadow-[0_24px_80px_rgba(7,21,46,0.28)]">
        <div className="bg-[#07152E] px-5 py-4 text-white">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
            style={{
              [locale === "ar" ? "left" : "right"]: "12px",
            }}
            aria-label={text.close}
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F7B548] text-[#07152E]">
              <Route size={22} />
            </div>

            <div>
              <h3 className="text-[20px] font-black">
                {title}
              </h3>

              <p className="mt-1 text-[12px] font-medium text-white/70">
                {locale === "ar"
                  ? "حدد المسار والمحطة وسننقلك مباشرة إلى الرحلة المناسبة."
                  : "Choose a path and station to open the exact journey you want."}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-5 p-5">
          <div>
            <label className="mb-2 flex items-center gap-2 text-[14px] font-black text-[#07152E]">
              <MapPinned size={17} className="text-[#C88712]" />
              {text.choosePath}
            </label>

            <select
              value={pathId}
              onChange={(event) => {
                setPathId(event.target.value);
                setStationSlug("");
              }}
              className="h-12 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 text-[14px] font-bold text-[#07152E] outline-none transition focus:border-[#F7B548]"
            >
              <option value="">
                {text.pathPlaceholder}
              </option>

              {careerPaths.map((path) => (
                <option key={path.id} value={path.id}>
                  {locale === "ar" ? path.ar : path.en}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-[14px] font-black text-[#07152E]">
              <Route size={17} className="text-[#C88712]" />
              {text.chooseStation}
            </label>

            <select
              value={stationSlug}
              disabled={!selectedPath}
              onChange={(event) =>
                setStationSlug(event.target.value)
              }
              className="h-12 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 text-[14px] font-bold text-[#07152E] outline-none transition disabled:cursor-not-allowed disabled:opacity-50 focus:border-[#F7B548]"
            >
              <option value="">
                {text.stationPlaceholder}
              </option>

              {selectedPath?.stations.map((station) => (
                <option
                  key={station.slug}
                  value={station.slug}
                >
                  {locale === "ar"
                    ? station.ar
                    : station.en}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            disabled={!canContinue}
            onClick={goToJourney}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#F7B548] px-5 text-[14px] font-black text-[#07152E] shadow-[0_8px_20px_rgba(247,181,72,0.22)] transition hover:bg-[#ffc158] disabled:cursor-not-allowed disabled:opacity-45"
          >
            {text.continue}
            <BackIcon size={17} />
          </button>
        </div>
      </div>
    </div>
  );
}