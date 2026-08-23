"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BookOpenCheck,
  Download,
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
    <div className="space-y-3">
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
      <header className="bg-[#07152E] px-6 py-1 text-white">
        <h3 className="text-lg font-black">
          {path.title}
        </h3>

        <p className="mt-1 text-[10px] font-bold text-white/65">
          اختر المحطة لعرض رحلات اليوم الواحد
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
      <div className="absolute left-[9%] right-[9%] top-[24px] h-[6px] bg-[#07152E] sm:left-[11%] sm:right-[11%] sm:top-[32px] sm:h-[8px]">
      <div className="absolute inset-x-0 top-1/2 h-[0.5px] -translate-y-1/2 bg-[#F7B548]" />
</div>
      <div
        className="relative z-10 grid items-start gap-0 sm:gap-1"
        style={{
          gridTemplateColumns: `repeat(${stations.length}, minmax(0, 1fr))`,
        }}
      >
        {stations.map((station) => {
          const hasJourneys =
            station.journeys.length > 0;

          const active =
            hasJourneys &&
            station.id ===
              selectedStationId;

          const stationContent = (
            <>
              <div
                className={`grid h-[38px] w-[38px] place-items-center overflow-hidden rounded-full border-[2px] bg-white transition sm:h-12 sm:w-12 ${
                  !hasJourneys
                    ? "border-[#AAB3C0]"
                    : active
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
                    className={`h-full w-full object-cover ${
                      hasJourneys
                        ? ""
                        : "grayscale opacity-45"
                    }`}
                  />
                ) : (
                  <span
                    className={`text-xs font-black ${
                      hasJourneys
                        ? "text-[#07152E]"
                        : "text-slate-400"
                    }`}
                  >
                    {station.displayOrder}
                  </span>
                )}
              </div>

              <span
                className={`mt-1 line-clamp-2 min-h-[18px] w-full px-0.5 text-center text-[7px] font-black leading-[1.25] sm:mt-1.5 sm:min-h-[26px] sm:px-1 sm:text-[10px] ${
                  !hasJourneys
                    ? "text-slate-400"
                    : active
                      ? "text-[#C88712]"
                      : "text-[#556273]"
                }`}
              >
                {station.shortTitle}
              </span>
            </>
          );

          if (!hasJourneys) {
            return (
              <Link
                key={station.id}
                href={`/course/${station.slug}?journey=one_day`}
                title="اكتشف محاضرات اليوم الواحد"
                className="group flex min-w-0 flex-1 flex-col items-center"
              >
                {stationContent}
              </Link>
            );
          }

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
              {stationContent}
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

  const content = (
    <>
      <span
        className={`relative flex h-[38px] w-[38px] items-center justify-center overflow-hidden rounded-full border-[2px] bg-white transition sm:h-[52px] sm:w-[52px] ${
          hasJourneys
            ? "border-[#F7B548]/70"
            : "border-[#AAB3C0]"
        }`}
      >
        {station.iconUrl ? (
          <Image
            src={station.iconUrl}
            alt=""
            fill
            sizes="52px"
            className={`object-cover ${
              hasJourneys
                ? ""
                : "grayscale opacity-45"
            }`}
          />
        ) : (
          <span
            className={`text-xs font-black ${
              hasJourneys
                ? "text-[#07152E]"
                : "text-slate-400"
            }`}
          >
            {index + 1}
          </span>
        )}
      </span>

      <span
        className={`mt-1 line-clamp-2 min-h-[18px] w-full px-0.5 text-center text-[7px] font-black leading-[1.25] sm:mt-2 sm:min-h-[26px] sm:px-1 sm:text-[10px] ${
          hasJourneys
            ? "text-[#334155]"
            : "text-slate-400"
        }`}
      >
        {station.shortTitle}
      </span>

      <span
        className={`mt-0.5 line-clamp-2 min-h-[16px] w-full px-0.5 text-center text-[6.5px] font-bold leading-[1.2] sm:min-h-[20px] sm:text-[8px] ${
          hasJourneys
            ? "text-[#B87508]"
            : "text-[#B87508]"
        }`}
      >
        {hasJourneys
          ? `${station.journeys.length} محاضرات`
          : "اكتشف المحاضرات"}
      </span>
    </>
  );

  if (!hasJourneys) {
    return (
      <Link
        href={`/course/${station.slug}?tab=one-day`}
        title="اكتشف محاضرات اليوم الواحد"
        className="group relative z-10 flex min-w-0 flex-col items-center px-0.5 py-0.5 sm:px-1 sm:py-1"
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative z-10 flex min-w-0 flex-col items-center px-0.5 py-0.5 sm:px-1 sm:py-1"
    >
      {content}
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
    <div className="grid grid-cols-[34px_minmax(0,1fr)_auto_105px] items-center gap-2 px-3 py-3 sm:gap-3 sm:px-4">
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

      {journey.resources?.length ? (
        <div className="flex items-center justify-end gap-1">
          {journey.resources.map((resource) => (
            <a
              key={resource.id}
              href={resource.downloadUrl}
              title={`تحميل ${resource.title}`}
              aria-label={`تحميل ${resource.title}`}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#F7B548]/55 bg-[#FFF8EA] text-[#B87508] transition hover:border-[#F7B548] hover:bg-[#F7B548] hover:text-[#07152E]"
            >
              <Download size={14} />
            </a>
          ))}
        </div>
      ) : (
        <span />
      )}

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