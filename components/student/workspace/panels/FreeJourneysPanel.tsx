"use client";

import Image from "next/image";
import { PlayCircle, Sparkles, X } from "lucide-react";
import { useState } from "react";

import BunnyVideoPlayer from "@/components/student/player/BunnyVideoPlayer";
import JourneyTabs from "../components/JourneyTabs";

import type {
  StudentFreeJourney,
  StudentFreeJourneyGroup,
  StudentJourneyStationGroup,
} from "@/lib/queries/student-dashboard";

type Props = {
  groups: StudentFreeJourneyGroup[];
  initialLessonId?: string;
};

const BUTTON =
  "inline-flex h-9 items-center justify-center gap-2 rounded-[10px] bg-[#07152E] px-4 text-[10px] font-black text-white transition hover:-translate-y-0.5 hover:bg-[#102747] disabled:cursor-not-allowed disabled:opacity-50";

export default function FreeJourneysPanel({
  groups,
  initialLessonId,
}: Props) {
  if (!groups.length) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
        <span className="flex h-18 w-18 items-center justify-center rounded-full bg-[#EAF7F1] text-[#14835F]">
          <Sparkles size={31} />
        </span>

        <h3 className="mt-4 text-xl font-black text-[#07152E]">
          لا توجد رحلات مجانية بعد
        </h3>

        <p className="mt-2 max-w-sm text-sm font-semibold text-slate-500">
          ستظهر هنا المحاضرات التي حددتها الإدارة كرحلات مجانية.
        </p>
      </div>
    );
  }

  return (
    <JourneyTabs
      ariaLabel="مسارات الرحلات المجانية"
      tabs={groups.map((path) => {
        const allJourneys = path.stations.flatMap(
          (station) => station.journeys,
        );

        const journeyCount = allJourneys.length;

        const completedCount = allJourneys.filter(
          (journey) =>
            journey.status === "completed" ||
            journey.progressPercent >= 100,
        ).length;

        const pathProgress =
          journeyCount > 0
            ? Math.round(
                allJourneys.reduce(
                  (total, journey) =>
                    total + journey.progressPercent,
                  0,
                ) / journeyCount,
              )
            : 0;

        return {
          id: path.id,
          title: path.title,
          subtitle: `${completedCount} من ${journeyCount} محاضرات مكتملة`,
          badge: `${pathProgress}%`,
          progressPercent: pathProgress,
          statusLabel: `${completedCount} مكتملة`,
          content: (
            <FreePathView
              key={path.id}
              path={path}
              initialLessonId={initialLessonId}
            />
          ),
        };
      })}
    />
  );
}

function FreePathView({
  path,
  initialLessonId,
}: {
  path: StudentFreeJourneyGroup;
  initialLessonId?: string;
}) {
  const initialStation = initialLessonId
    ? path.stations.find((station) =>
        station.journeys.some(
          (journey) =>
            journey.lessonId === initialLessonId,
        ),
      ) ?? null
    : null;

  const [selectedStationId, setSelectedStationId] =
    useState<string | null>(
      initialStation?.id ?? null,
    );

  const selectedStation = selectedStationId
    ? path.stations.find(
        (station) => station.id === selectedStationId,
      ) ?? null
    : null;

  const handleSelectStation = (stationId: string) => {
    setSelectedStationId(stationId);
  };

  if (selectedStation) {
    return (
      <div className="space-y-3">
        <CompactStationRoad
          stations={path.stations}
          selectedStationId={selectedStation.id}
          onSelectStation={handleSelectStation}
        />

        <StationFreeLessons
          key={`${selectedStation.id}-${initialLessonId ?? "manual"}`}
          station={selectedStation}
          initialLessonId={
            selectedStation.journeys.some(
              (journey) =>
                journey.lessonId === initialLessonId,
            )
              ? initialLessonId
              : undefined
          }
        />
      </div>
    );
  }

  return (
    <FullStationRoad
      path={path}
      onSelectStation={handleSelectStation}
    />
  );
}

function FullStationRoad({
  path,
  onSelectStation,
}: {
  path: StudentFreeJourneyGroup;
  onSelectStation: (stationId: string) => void;
}) {
  return (
    <article className="overflow-hidden rounded-b-[24px] border-b border-[#C9D2DE] bg-white shadow-[0_22px_55px_rgba(7,21,46,0.14)]">
      <header className="bg-[#07152E] px-6 py-1 text-white">
        <h3 className="text-lg font-black">
          {path.title}
        </h3>

        <p className="mt-1 text-[10px] font-bold text-white/65">
          اختر المحطة لعرض الرحلات المجانية
        </p>
      </header>

      <div className="bg-[#F8FAFC] px-1.5 py-3 sm:px-4 sm:py-5">
          <div
            className="relative mx-auto grid w-full items-start gap-0 px-0 pt-1 sm:gap-1 sm:px-4 sm:pt-3"
            style={{
              gridTemplateColumns: `repeat(${path.stations.length}, minmax(0, 1fr))`,
            }}
          >
            <div className="absolute left-[9%] right-[9%] top-[25px] h-[7px] border-y border-[#F7B548] bg-[#07152E] sm:left-[11%] sm:right-[11%] sm:top-[42px] sm:h-[16px] sm:rounded-full" />

            {path.stations.map((station, index) => (
              <StationButton
                key={station.id}
                station={station}
                index={index}
                selected={false}
                onClick={() =>
                  onSelectStation(station.id)
                }
              />
            ))}
          </div>
      </div>
    </article>
  );
}

function CompactStationRoad({
  stations,
  selectedStationId,
  onSelectStation,
}: {
  stations: StudentJourneyStationGroup[];
  selectedStationId: string;
  onSelectStation: (stationId: string) => void;
}) {
  return (
    <div className="relative px-1.5 py-2 sm:px-3 sm:py-3">
        <div
          className="relative mx-auto grid w-full items-start gap-0 px-0 pt-0.5 sm:gap-1 sm:px-4 sm:pt-1"
          style={{
            gridTemplateColumns: `repeat(${stations.length}, minmax(0, 1fr))`,
          }}
        >
          <div className="absolute left-[9%] right-[9%] top-[24px] h-[6px] bg-[#07152E] sm:left-[11%] sm:right-[11%] sm:top-[32px] sm:h-[8px]">
            <div className="absolute inset-x-0 top-1/2 h-[0.5px] -translate-y-1/2 bg-[#F7B548]" />
          </div>

          {stations.map((station, index) => (
            <StationButton
              key={station.id}
              station={station}
              index={index}
              selected={
                station.id === selectedStationId
              }
              onClick={() =>
                onSelectStation(station.id)
              }
            />
          ))}
        </div>
    </div>
  );
}

function StationButton({
  station,
  index,
  selected,
  onClick,
}: {
  station: StudentJourneyStationGroup;
  index: number;
  selected: boolean;
  onClick: () => void;
}) {
  const hasJourneys =
    station.journeys.length > 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative z-10 flex min-w-0 flex-col items-center px-0.5 py-0.5 sm:px-1 sm:py-1"
    >
      <span
        className={`relative flex h-[38px] w-[38px] sm:h-[52px] sm:w-[52px] items-center justify-center overflow-hidden rounded-full border-[2px] bg-white transition ${
          selected
            ? "scale-110 border-[#F7B548] shadow-[0_6px_18px_rgba(247,181,72,0.28)]"
            : hasJourneys
              ? "border-[#F7B548]/70"
              : "border-[#AAB3C0]"
        }`}
      >
        {station.iconUrl ? (
          <Image
            src={station.iconUrl}
            alt={station.shortTitle}
            fill
            sizes="52px"
            className={`object-cover ${
              hasJourneys
                ? ""
                : "grayscale opacity-60"
            }`}
          />
        ) : (
          <span className="text-xs font-black text-[#07152E]">
            {index + 1}
          </span>
        )}
      </span>

      <span
        className={`mt-1 w-full truncate px-0.5 text-center text-[7px] font-black leading-tight sm:mt-2 sm:text-[10px] ${
          selected
            ? "text-[#C88712]"
            : "text-[#334155]"
        }`}
        title={station.shortTitle}
      >
        {station.shortTitle}
      </span>

      {!hasJourneys ? (
        <span className="mt-0.5 max-w-full truncate px-0.5 text-[6.5px] font-bold leading-tight sm:text-[8px] text-slate-400">
          لا توجد محاضرات
        </span>
      ) : null}
    </button>
  );
}

function StationFreeLessons({
  station,
  initialLessonId,
}: {
  station: StudentJourneyStationGroup;
  initialLessonId?: string;
}) {
  const [selectedLessonId, setSelectedLessonId] =
    useState<string | null>(
      initialLessonId ?? null,
    );

  const fundamentals = station.journeys.filter(
    (journey) =>
      journey.coursePart === "fundamentals",
  );

  const advanced = station.journeys.filter(
    (journey) =>
      journey.coursePart === "advanced",
  );

  const single = station.journeys.filter(
    (journey) =>
      journey.coursePart === "single",
  );

  const split =
    fundamentals.length > 0 ||
    advanced.length > 0;

  if (!station.journeys.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-10 text-center">
        <Sparkles className="mx-auto h-8 w-8 text-slate-400" />

        <p className="mt-3 text-sm font-black text-[#07152E]">
          لا توجد رحلات مجانية في هذه المحطة
        </p>
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-b-[22px] border border-[#DCE2EA] bg-white shadow-[0_12px_32px_rgba(7,21,46,0.07)]">
      <header className="flex items-center justify-between border-b border-[#E5EAF0] bg-[#F7F9FC] px-5 py-3">
        <div>
          <p className="text-[10px] font-black text-[#C88712]">
            الرحلات المجانية
          </p>

          <h3 className="mt-1 text-[17px] font-black text-[#07152E]">
            {station.title}
          </h3>
        </div>

        <span className="rounded-full bg-[#FFF3D8] px-3 py-1 text-[10px] font-black text-[#B36B00]">
          {station.journeys.length} محاضرات
        </span>
      </header>

      {selectedLessonId ? (
        <div className="border-b border-slate-200 p-3">
          <div className="mb-2 flex justify-end">
            <button
              type="button"
              onClick={() =>
                setSelectedLessonId(null)
              }
              className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-3 text-[10px] font-black text-[#07152E]"
            >
              <X size={13} />
              إغلاق الفيديو
            </button>
          </div>

          <div className="overflow-hidden rounded-[18px] border border-slate-200 bg-white">
            <BunnyVideoPlayer
              lessonId={selectedLessonId}
            />
          </div>
        </div>
      ) : null}

      {split ? (
        <div className="grid gap-4 p-4 lg:grid-cols-2">
          <PartColumn
            title="Fundamentals — الأساسيات"
            journeys={fundamentals}
            onOpen={setSelectedLessonId}
          />

          <PartColumn
            title="Advanced — المتقدم"
            journeys={advanced}
            onOpen={setSelectedLessonId}
          />

          {single.length ? (
            <div className="lg:col-span-2">
              <PartColumn
                title="محاضرات عامة"
                journeys={single}
                onOpen={setSelectedLessonId}
              />
            </div>
          ) : null}
        </div>
      ) : (
        <div className="p-4">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {single.map((journey) => (
              <LessonRow
                key={journey.enrollmentId}
                journey={journey}
                onOpen={setSelectedLessonId}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function PartColumn({
  title,
  journeys,
  onOpen,
}: {
  title: string;
  journeys: StudentFreeJourney[];
  onOpen: (lessonId: string) => void;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="bg-[#07152E] px-4 py-3 text-sm font-black text-white">
        {title}
      </div>

      {journeys.length ? (
        journeys.map((journey) => (
          <LessonRow
            key={journey.enrollmentId}
            journey={journey}
            onOpen={onOpen}
          />
        ))
      ) : (
        <p className="px-4 py-8 text-center text-xs font-bold text-slate-400">
          لا توجد محاضرات في هذا القسم.
        </p>
      )}
    </section>
  );
}

function LessonRow({
  journey,
  onOpen,
}: {
  journey: StudentFreeJourney;
  onOpen: (lessonId: string) => void;
}) {
  const actionLabel =
    journey.status === "completed"
      ? "شاهد مرة أخرى"
      : journey.progressPercent > 0
        ? "استكمل"
        : "ابدأ الآن";

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-[#E5EAF0] px-4 py-3 last:border-b-0">
      <div className="min-w-0">
        <p
          className="truncate text-sm font-black text-[#07152E]"
          title={journey.title}
        >
          {journey.title}
        </p>

        <div className="mt-1 flex items-center gap-3">
          <span className="shrink-0 text-[10px] font-bold text-slate-500">
            {Math.round(
              journey.progressPercent,
            )}
            %
          </span>

          <div className="h-1.5 min-w-[70px] max-w-[130px] flex-1 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-[#F7B548]"
              style={{
                width: `${journey.progressPercent}%`,
              }}
            />
          </div>
        </div>
      </div>

      <button
        type="button"
        disabled={!journey.lessonId}
        onClick={() =>
          journey.lessonId &&
          onOpen(journey.lessonId)
        }
        className={BUTTON}
      >
        {actionLabel}
        <PlayCircle size={15} />
      </button>
    </div>
  );
}