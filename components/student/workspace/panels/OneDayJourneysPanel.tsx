"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  BookOpenCheck,
  CheckCircle2,
  PlayCircle,
} from "lucide-react";

import type {
  StudentJourneyStationGroup,
  StudentOneDayJourney,
  StudentOneDayJourneyGroup,
} from "@/lib/queries/student-dashboard";

import JourneyTabs from "../components/JourneyTabs";
import BunnyVideoPlayer from "@/components/student/player/BunnyVideoPlayer";
type Props = {
  groups: StudentOneDayJourneyGroup[];
};

export default function OneDayJourneysPanel({
  groups,
}: Props) {
  if (!groups.length) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
        <span className="flex h-18 w-18 items-center justify-center rounded-full bg-[#FFF4DF] text-[#C88712]">
          <BookOpenCheck size={31} />
        </span>

        <h3 className="mt-4 text-xl font-black text-[#07152E]">
          لا توجد رحلات يوم واحد بعد
        </h3>

        <p className="mt-2 max-w-sm text-sm font-semibold text-slate-500">
          ستظهر هنا رحلات اليوم الواحد المتاحة لك.
        </p>
      </div>
    );
  }

  return (
  <JourneyTabs
    ariaLabel="مسارات رحلات اليوم الواحد"
    tabs={groups.map((path) => {
      const allJourneys =
        path.stations.flatMap(
          (station) => station.journeys,
        );

      const journeyCount =
        allJourneys.length;

      const completedCount =
        allJourneys.filter(
          (journey) =>
            journey.status === "completed" ||
            journey.progressPercent >= 100,
        ).length;

      const pathProgress =
        journeyCount > 0
          ? Math.round(
              allJourneys.reduce(
                (total, journey) =>
                  total +
                  journey.progressPercent,
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

        content: (
          <OneDayPathView
            key={path.id}
            path={path}
          />
        ),
      };
    })}
  />
);
}
function OneDayPathView({
  path,
}: {
  path: StudentOneDayJourneyGroup;
}) {
  const [selectedStationId, setSelectedStationId] =
    useState<string | null>(null);

  const selectedStation =
    path.stations.find(
      (station) =>
        station.id === selectedStationId,
    ) ?? null;

  return (
    <div className="space-y-4">
      {selectedStation ? (
        <>
          <CompactStationRoad
            stations={path.stations}
            selectedStationId={
              selectedStation.id
            }
            onSelectStation={
              setSelectedStationId
            }
          />

          <StationOneDayLessons
            station={selectedStation}
          />
        </>
      ) : (
        <FullStationRoad
          path={path}
          onSelectStation={
            setSelectedStationId
          }
        />
      )}
    </div>
  );
}
function FullStationRoad({
  path,
  onSelectStation,
}: {
  path: StudentOneDayJourneyGroup;
  onSelectStation: (stationId: string) => void;
}) {
  return (
    <article className="overflow-hidden rounded-b-[24px] border-b border-[#C9D2DE] bg-white shadow-[0_22px_55px_rgba(7,21,46,0.14)]">
      <header className="bg-[#07152E] px-6 py-3 text-white">
        <h3 className="text-lg font-black">
          {path.title}
        </h3>

        <p className="mt-1 text-[10px] font-bold text-white/65">
          اختر المحطة لعرض رحلات اليوم الواحد
        </p>
      </header>

      <div className="bg-[#F8FAFC] px-4 py-5">
        <div className="overflow-x-auto">
          <div className="relative mx-auto flex min-w-[760px] items-start justify-between gap-2 px-5 pt-3">
            <div className="absolute left-[11%] right-[11%] top-[42px] h-[16px] rounded-full border-y border-[#F7B548] bg-[#07152E]" />

            {path.stations.map(
              (station, index) => (
                <StationButton
                  key={station.id}
                  station={station}
                  index={index}
                  onClick={() =>
                    onSelectStation(
                      station.id,
                    )
                  }
                />
              ),
            )}
          </div>
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
    <div className="relative px-3 py-3">
      <div className="absolute left-[11%] right-[11%] top-[32px] h-[8px] bg-[#07152E]">
      <div className="absolute inset-x-0 top-1/2 h-[0.5px] -translate-y-1/2 bg-[#F7B548]" />
</div>
      <div className="relative z-10 flex items-start justify-between gap-2">
        {stations.map((station) => {
          const active =
            station.id ===
            selectedStationId;

          return (
            <button
              key={station.id}
              type="button"
              onClick={() =>
                onSelectStation(
                  station.id,
                )
              }
              className="group flex min-w-0 flex-1 flex-col items-center"
            >
              <div
                className={`grid h-12 w-12 place-items-center overflow-hidden rounded-full border-[2px] bg-white transition ${
                  active
                    ? "scale-110 border-[#F7B548] shadow-[0_6px_18px_rgba(247,181,72,0.28)]"
                    : "border-[#D5DCE6] group-hover:border-[#F7B548]"
                }`}
              >
                {station.iconUrl ? (
                  <Image
                    src={station.iconUrl}
                    alt={station.shortTitle}
                    width={48}
                    height={48}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-black text-[#07152E]">
                    {station.displayOrder}
                  </span>
                )}
              </div>

              <span
                className={`mt-1.5 max-w-[110px] truncate text-[10px] font-black ${
                  active
                    ? "text-[#C88712]"
                    : "text-[#556273]"
                }`}
              >
                {station.shortTitle}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
function StationButton({
  station,
  index,
  onClick,
}: {
  station: StudentJourneyStationGroup;
  index: number;
  onClick: () => void;
}) {
  const hasJourneys =
    station.journeys.length > 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative z-10 flex w-[150px] shrink-0 flex-col items-center px-2 py-1"
    >
      <span
        className={`relative flex h-[62px] w-[62px] items-center justify-center overflow-hidden rounded-full border-[3px] ring-2 ring-offset-2 ring-offset-[#F8FAFC] ${
          hasJourneys
            ? "border-[#F7B548] ring-[#F7B548]/60"
            : "border-[#AAB3C0] ring-[#CBD2DC]"
        }`}
      >
        {station.iconUrl ? (
          <Image
            src={station.iconUrl}
            alt=""
            fill
            sizes="62px"
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

      <span className="mt-3 max-w-[140px] text-center text-[14px] font-black text-[#07152E]">
        {station.shortTitle}
      </span>

      <span
        className={`mt-1 text-[9px] font-bold ${
          hasJourneys
            ? "text-[#B87508]"
            : "text-slate-400"
        }`}
      >
        {hasJourneys
          ? `${station.journeys.length} محاضرات`
          : "لا توجد رحلات"}
      </span>
    </button>
  );
}
function StationOneDayLessons({
  station,
}: {
  station: StudentJourneyStationGroup;
}) {
  const [selectedLessonId, setSelectedLessonId] =
    useState<string | null>(null);
useEffect(() => {
  setSelectedLessonId(null);
}, [station.id]);
  if (!station.journeys.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-10 text-center">
        <BookOpenCheck className="mx-auto h-8 w-8 text-slate-400" />

        <p className="mt-3 text-sm font-black text-[#07152E]">
          لا توجد رحلات يوم واحد في هذه المحطة
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {selectedLessonId ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-3">
          <BunnyVideoPlayer
            lessonId={selectedLessonId}
          />
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="divide-y divide-slate-100">
          {station.journeys.map(
            (journey, index) => (
              <OneDayLessonRow
                key={journey.enrollmentId}
                journey={journey}
                index={index}
                onPlay={() => {
                  if (journey.lessonId) {
                    setSelectedLessonId(
                      journey.lessonId,
                    );
                  }
                }}
              />
            ),
          )}
        </div>
      </div>

    </div>
  );
}

function OneDayLessonRow({
  journey,
  index,
  onPlay,
}: {
  journey: StudentOneDayJourney;
  index: number;
  onPlay: () => void;
}) {
  const completed =
    journey.status === "completed";

  return (
    <div className="grid grid-cols-[34px_minmax(0,1fr)_105px] items-center gap-3 px-4 py-3">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FFF4DF] text-[10px] font-black text-[#B87508]">
        {index + 1}
      </span>

      <div className="min-w-0">
        <p
          className="truncate text-xs font-black text-[#07152E]"
          title={journey.title}
        >
          {journey.title}
        </p>

        <div className="mt-1 flex items-center gap-2">
          <span className="text-[10px] font-black text-slate-500">
            {Math.round(
              journey.progressPercent,
            )}
            %
          </span>

          <div className="h-1.5 min-w-[45px] max-w-[90px] flex-1 overflow-hidden rounded-full bg-slate-200">
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
  onClick={onPlay}
  disabled={!journey.lessonId}
  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#07152E] px-3 text-[10px] font-black text-white transition hover:bg-[#102A50] disabled:cursor-not-allowed disabled:opacity-50"
>
  <PlayCircle size={14} />

  {journey.status === "completed"
    ? "مشاهدة"
    : journey.progressPercent > 0
      ? "استكمل"
      : "ابدأ الآن"}
</button>
    </div>
  );
}