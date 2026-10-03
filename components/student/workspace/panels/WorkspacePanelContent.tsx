"use client";
import CertificatesPanel from "./CertificatesPanel";
import ProjectsPanel from "./ProjectsPanel";
import SurveysPanel from "./SurveysPanel";
import Image from "next/image";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Award,
  BookOpenCheck,
  Check,
  ChevronLeft,
  ClipboardList,
  Clock3,
  Compass,
  FileUp,
  Download,
  PlayCircle,
  Sparkles,
  Target,
} from "lucide-react";

import type {
  StudentCareerPathProgress,
  StudentDashboardData,
  StudentPathStationProgress,
} from "@/lib/queries/student-dashboard";
import type { WorkspacePanelDefinition } from "../types";
import JourneyTabs from "../components/JourneyTabs";
import OneDayJourneysPanel from "./OneDayJourneysPanel";
import FreeJourneysPanel from "./FreeJourneysPanel";
import MasarPassportPanel from "./MasarPassportPanel";
import BunnyVideoPlayer from "@/components/student/player/BunnyVideoPlayer";
import CourseActionButton from "@/components/course/CourseActionButton";

type Props = {
  panel: WorkspacePanelDefinition;
  data: StudentDashboardData;
  initialLessonId?: string;
  previewUserId?: string;
  readOnly?: boolean;
};

type Locale = "ar" | "en";

function useMasarLocale(): Locale {
  const [locale, setLocale] = useState<Locale>("ar");

  useEffect(() => {
    const readLocale = () => {
      const savedLocale =
        window.localStorage.getItem("masar-locale");

      setLocale(savedLocale === "en" ? "en" : "ar");
    };

    readLocale();

    const handleLocaleChange = (event: Event) => {
      const customEvent =
        event as CustomEvent<{ locale?: Locale }>;

      if (
        customEvent.detail?.locale === "ar" ||
        customEvent.detail?.locale === "en"
      ) {
        setLocale(customEvent.detail.locale);
        return;
      }

      readLocale();
    };

    window.addEventListener(
      "masar:locale-change",
      handleLocaleChange,
    );
    window.addEventListener("storage", readLocale);

    return () => {
      window.removeEventListener(
        "masar:locale-change",
        handleLocaleChange,
      );
      window.removeEventListener("storage", readLocale);
    };
  }, []);

  return locale;
}

export default function WorkspacePanelContent({
  panel,
  data,
  initialLessonId,
  previewUserId,
  readOnly = false,
}: Props) {
  const locale = useMasarLocale();
  const isArabic = locale === "ar";
  console.log("Certificates:", data.certificates);
  switch (panel.kind) {
    case "course-list":
      return (
        <CareerPathsPanel
          paths={data.careerPaths ?? []}
          locale={locale}
        />
      );

    case "empty-journey":
      if (panel.id === "one-day") {
        return (
          <OneDayJourneysPanel
            groups={data.oneDayJourneyGroups ?? []}
          />
        );
      }

      if (panel.id === "free") {
        return (
          <FreeJourneysPanel
            groups={data.freeJourneyGroups ?? []}
            initialLessonId={initialLessonId}
          />
        );
      }

      return (
        <EmptyPanel
  icon={
    panel.settings?.accent === "free"
      ? Sparkles
      : panel.icon
  }
  title={panel.title}
  text={String(
    panel.settings?.description ??
      (isArabic
        ? "لا يوجد محتوى متاح حاليًا."
        : "No content is currently available."),
  )}
  href={String(
    panel.settings?.href ??
      "/career-path/road-design",
  )}
  locale={locale}
/>
      );

    case "next-step":
      return <NextStepPanel data={data} locale={locale} />;

  case "certificates":
  return (
    <CertificatesPanel
      certificates={data.certificates}
    />
  );

    case "achievement-card":
  return (
    <MasarPassportPanel
      data={data}
      locale={locale}
    />
  );

    case "surveys":
      return (
        <SurveysPanel
          data={data}
          locale={locale}
        />
      );

  case "projects":
  return (
    <ProjectsPanel
      data={data}
      previewUserId={previewUserId}
      readOnly={readOnly}
    />
  );

    default:
      return null;
  }
}

function CareerPathsPanel({
  paths,
  locale,
}: {
  paths: StudentCareerPathProgress[];
  locale: Locale;
}) {
  const isArabic = locale === "ar";
  if (!paths.length) {
    return (
      <EmptyPanel
        icon={BookOpenCheck}
        title={isArabic ? "رحلتك الأولى في انتظارك" : "Your first journey is waiting"}
        text={isArabic ? "اشترك في إحدى الرحلات لتظهر خريطة تقدمك المهنية هنا." : "Enroll in a journey to see your professional progress map here."}
        href="/career-path/road-design"
          locale={locale}
      />
    );
  }

  return (
    <JourneyTabs
      ariaLabel={isArabic ? "المسارات المهنية المشترك بها" : "Enrolled career paths"}
      tabs={paths.map((path) => ({
        id: path.pathId,
        title: path.title,
        subtitle: isArabic ? `${path.enrolledStations} من ${path.totalStations} رحلات` : `${path.enrolledStations} of ${path.totalStations} journeys`,
        badge: `${path.progressPercent}%`,
        progressPercent: path.progressPercent,
        statusLabel: isArabic ? `${path.completedStations} مكتملة` : `${path.completedStations} completed`,
        content: (
          <CareerPathProgressCard
            key={path.pathId}
            path={path}
            locale={locale}
          />
        ),
      }))}
    />
  );
}

function CareerPathProgressCard({
  path,
  locale,
}: {
  path: StudentCareerPathProgress;
  locale: Locale;
}) {
  const isArabic = locale === "ar";
  const [selectedStationId, setSelectedStationId] =
    useState<string | null>(null);

  const selectedStation = selectedStationId
    ? path.stations.find(
        (station) => station.stationId === selectedStationId,
      ) ?? null
    : null;

  if (selectedStation) {
  return (
    <div className="space-y-3">
      <CompactPathStations
        path={path}
        selectedStationId={selectedStation.stationId}
        onSelectStation={setSelectedStationId}
        locale={locale}
      />

      <StationLearningView
        station={selectedStation}
        onBack={() => setSelectedStationId(null)}
        locale={locale}
      />
    </div>
  );
}

  return (
<article className="relative -mt-[1px] overflow-hidden rounded-t-none rounded-b-[24px] border-x-0 border-y-1 border-b border-[#C9D2DE] bg-white shadow-[0_22px_55px_rgba(7,21,46,0.16),0_4px_12px_rgba(7,21,46,0.08)]">     
   <header className="bg-[#07152E] px-5 py-1 text-white sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black sm:text-xl">
              {path.title}
            </h3>
            <p className="mt-0.5 text-[11px] font-bold text-white/75">
              {isArabic
                ? `مشترك في ${path.enrolledStations} من ${path.totalStations} رحلات`
                : `${path.enrolledStations} of ${path.totalStations} journeys enrolled`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div
             className="relative flex h-10 w-10 items-center justify-center rounded-full"
              style={{
                background: `conic-gradient(#F7B548 ${path.progressPercent * 3.6}deg, rgba(255,255,255,.18) 0deg)`,
              }}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#07152E] text-[10px] font-black text-[#F7B548]">
                {path.progressPercent}%
              </div>
            </div>

            <div className="hidden sm:block">
              <p className="text-[10px] font-bold text-white/70">
                {isArabic ? "التقدم العام في المسار" : "Overall path progress"}
              </p>
              <p className="mt-1 text-xs font-black text-[#FFE0A6]">
                {isArabic
                  ? `${path.completedStations} رحلات مكتملة`
                  : `${path.completedStations} journeys completed`}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="bg-[#F8FAFC] px-1.5 py-3 sm:px-4 sm:py-5">
  <div
    className="relative mx-auto grid w-full grid-cols-5 items-start gap-0 px-0 pt-1 sm:gap-1 sm:px-4 sm:pt-3"
    dir="rtl"
  >
    <div className="absolute left-[9%] right-[9%] top-[25px] h-[7px] border-y border-[#F7B548] bg-[#07152E] sm:left-[11%] sm:right-[11%] sm:top-[42px] sm:h-[16px] sm:rounded-full" />
            {path.stations.map((station, index) => (
              <PathStation
                key={station.stationId}
                station={station}
                index={index}
                onOpen={() => setSelectedStationId(station.stationId)}
                locale={locale}
              />
            ))}
          </div>

      </div>
    </article>
  );
}

function PathStation({
  station,
  index,
  onOpen,
  locale,
}: {
  station: StudentPathStationProgress;
  index: number;
  onOpen: () => void;
  locale: Locale;
}) {
  const isArabic = locale === "ar";

  const statusClasses = {
    completed:
      "border-[#70B64A] bg-[#70B64A] text-white shadow-[0_0_22px_rgba(112,182,74,.52)]",
    in_progress:
      "border-[#F7B548] bg-[#F7B548] text-[#07152E] shadow-[0_0_22px_rgba(247,181,72,.58)]",
    not_started:
      "border-[#F7B548] bg-[#07152E] text-[#F7B548] shadow-[0_0_18px_rgba(247,181,72,.28)]",
    pending:
      "border-amber-400 bg-amber-50 text-amber-700",
    not_enrolled:
      "border-[#AAB3C0] bg-[#E4E8ED] text-[#657080]",
  } as const;

  const actionLabel = !station.isEnrolled
    ? isArabic
      ? "استكشف"
      : "Explore"
    : station.status === "not_started"
      ? isArabic
        ? "ابدأ"
        : "Start"
      : isArabic
        ? "استكمل"
        : "Continue";

  const content = (
    <>
      {/* Station icon */}
      <span
        className={`
          relative
          flex
          h-[38px]
          w-[38px]
          shrink-0
          items-center
          justify-center
          overflow-hidden
          rounded-full
          border-[2px]
          bg-white
          text-xs
          font-black
          transition
          duration-300

          sm:h-[52px]
          sm:w-[52px]

          ${statusClasses[station.status]}
        `}
      >
        {station.iconUrl ? (
          <Image
            src={station.iconUrl}
            alt=""
            fill
            sizes="52px"
            className={`object-cover ${
              station.status === "not_enrolled"
                ? "grayscale opacity-65"
                : ""
            }`}
          />
        ) : station.status === "completed" ? (
          <Check
            size={22}
            strokeWidth={3}
          />
        ) : station.status === "pending" ? (
          <Clock3 size={19} />
        ) : station.status === "in_progress" ? (
          <span className="text-[8px] sm:text-xs">
            {Math.round(
              station.progressPercent,
            )}
            %
          </span>
        ) : (
          <span>{index + 1}</span>
        )}
      </span>

      {/* Station name */}
      <span
        className="
          mt-1
          line-clamp-2
          min-h-[18px]
          w-full
          px-0.5
          text-center
          text-[7px]
          font-black
          leading-[1.25]
          text-[#334155]

          sm:mt-2
          sm:min-h-[26px]
          sm:px-1
          sm:text-[10px]
        "
      >
        {station.shortTitle}
      </span>

      {/* Status */}
      <span
        className={`mt-0.5 line-clamp-2 min-h-[16px] w-full px-0.5 text-center text-[6.5px] font-bold leading-[1.2] sm:min-h-[20px] sm:text-[8px] ${
          station.status === "completed"
            ? "text-[#589638]"
            : station.status === "in_progress"
              ? "text-[#B87508]"
              : station.status === "pending"
                ? "text-amber-700"
                : station.status ===
                    "not_enrolled"
                  ? "text-slate-400"
                  : "text-[#07152E]"
        }`}
      >
        {getStationCaption(
          station,
          locale,
        )}
      </span>

      {/* Compact action */}
      <span
        className={`
          mt-1
          max-w-full
          truncate
          px-0.5
          text-center
          text-[6.5px]
          font-black
          leading-tight

          sm:mt-2
          sm:rounded-full
          sm:px-3
          sm:py-1
          sm:text-[9px]

          ${
            station.isEnrolled
              ? "text-[#B87508] sm:bg-[#07152E] sm:text-[#F7B548]"
              : "text-slate-500 sm:bg-slate-200 sm:text-slate-600"
          }
        `}
      >
        {actionLabel}
      </span>
    </>
  );

  if (!station.isEnrolled) {
    return (
      <Link
        href={station.courseHref}
        title={
          isArabic
            ? "استكشف الرحلة واطلب الاشتراك"
            : "Explore the journey and request enrollment"
        }
        className="
          group
          relative
          z-10
          flex
          min-w-0
          flex-col
          items-center
          px-0.5
          py-0.5

          sm:px-1
          sm:py-1
        "
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      title={
        station.status ===
        "not_started"
          ? isArabic
            ? "ابدأ الرحلة"
            : "Start Journey"
          : isArabic
            ? "متابعة الرحلة"
            : "Continue Journey"
      }
      className="
        group
        relative
        z-10
        flex
        min-w-0
        flex-col
        items-center
        px-0.5
        py-0.5

        sm:px-1
        sm:py-1
      "
    >
      {content}
    </button>
  );
}

function formatLessonDuration(totalSeconds: number, locale: Locale) {
  const total = Math.max(0, Math.floor(Number(totalSeconds || 0)));
  if (!total) return locale === "ar" ? "المدة غير محددة" : "Duration unavailable";

  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;

  return [
    hours ? `${hours} ${locale === "ar" ? "س" : "h"}` : "",
    minutes ? `${minutes} ${locale === "ar" ? "د" : "m"}` : "",
    `${seconds} ${locale === "ar" ? "ث" : "s"}`,
  ]
    .filter(Boolean)
    .join(" ");
}
function CompactPathStations({
  path,
  selectedStationId,
  onSelectStation,
  locale,
}: {
  path: StudentCareerPathProgress;
  selectedStationId: string;
  onSelectStation: (stationId: string) => void;
  locale: Locale;
}) {
  return (
    <div className="relative px-1.5 py-2 sm:px-3 sm:py-3">
      <div
        className="
          relative
          mx-auto
          grid
          w-full
          items-start
          gap-0
          px-0
          pt-0.5

          sm:gap-1
          sm:px-4
          sm:pt-1
        "
        style={{
          gridTemplateColumns: `repeat(${path.stations.length}, minmax(0, 1fr))`,
        }}
      >
        {/* الطريق */}
        <div
          className="
            absolute
            left-[9%]
            right-[9%]
            top-[24px]
            h-[6px]
            bg-[#07152E]

            sm:left-[11%]
            sm:right-[11%]
            sm:top-[32px]
            sm:h-[8px]
          "
        >
          <div
            className="
              absolute
              inset-x-0
              top-1/2
              h-[0.5px]
              -translate-y-1/2
              bg-[#F7B548]
            "
          />
        </div>

        {path.stations.map((station, index) => {
          const enrolled =
            station.isEnrolled &&
            station.status !== "pending";

          const active =
            enrolled &&
            station.stationId === selectedStationId;

          return (
            <button
              key={station.stationId}
              type="button"
              onClick={() =>
                onSelectStation(station.stationId)
              }
              title={station.shortTitle}
              className="
                group
                relative
                z-10
                flex
                min-w-0
                flex-col
                items-center
                px-0.5
                py-0.5

                sm:px-1
                sm:py-1
              "
            >
              {/* أيقونة المحطة */}
              <span
                className={`
                  relative
                  flex
                  h-[38px]
                  w-[38px]
                  shrink-0
                  items-center
                  justify-center
                  overflow-hidden
                  rounded-full
                  border-[2px]
                  bg-white
                  transition

                  sm:h-[52px]
                  sm:w-[52px]

                  ${
                    !enrolled
                      ? "border-[#AAB3C0]"
                      : active
                        ? "scale-110 border-[#F7B548] shadow-[0_6px_18px_rgba(247,181,72,0.28)]"
                        : "border-[#D5DCE6] group-hover:border-[#F7B548]"
                  }
                `}
              >
                {station.iconUrl ? (
                  <Image
                    src={station.iconUrl}
                    alt={station.shortTitle}
                    fill
                    sizes="52px"
                    className={`
                      object-cover
                      ${
                        enrolled
                          ? ""
                          : "grayscale opacity-45"
                      }
                    `}
                  />
                ) : (
                  <span
                    className={`
                      text-xs
                      font-black

                      ${
                        enrolled
                          ? "text-[#07152E]"
                          : "text-slate-400"
                      }
                    `}
                  >
                    {index + 1}
                  </span>
                )}
              </span>

              {/* اسم المحطة */}
              <span
                className={`
                  mt-1
                  w-full
                  px-0.5
                  text-center
                  text-[7px]
                  font-black
                  leading-[1.15]

                  sm:mt-2
                  sm:text-[10px]
                  sm:leading-tight

                  ${
                    !enrolled
                      ? "text-slate-400"
                      : active
                        ? "text-[#C88712]"
                        : "text-[#556273]"
                  }
                `}
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
function StationLearningView({
  station,
  onBack,
  locale,
}: {
  station: StudentPathStationProgress;
  onBack: () => void;
  locale: Locale;
}) {
  const isArabic = locale === "ar";
  const [selectedLessonId, setSelectedLessonId] =
    useState<string | null>(null);

  const partTitle = {
    single: isArabic ? "محاضرات الكورس" : "Course Lessons",
    fundamentals: "Fundamentals",
    advanced: "Advanced",
  } as const;

  const partJourneyType = {
    single: "professional",
    fundamentals: "fundamentals",
    advanced: "advanced",
  } as const;

  const partActionKey = {
    single: "professional:screen",
    fundamentals:
      "professional:column:fundamental",
    advanced:
      "professional:column:advanced",
  } as const;

  const partActionTitle = {
    single: isArabic ? "رحلة الاحتراف المتكاملة" : "Integrated Professional Journey",
    fundamentals: isArabic ? "رحلة الأساسيات" : "Fundamentals Journey",
    advanced: isArabic ? "الرحلة المتقدمة" : "Advanced Journey",
  } as const;

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <p className="text-xs font-black text-[#C88712]">
            {isArabic ? "رحلة الاحتراف المتكاملة" : "Integrated Professional Journey"}
          </p>
          <h3 className="mt-1 text-xl font-black text-[#07152E]">
            {station.title}
          </h3>
          <p className="mt-1 text-xs font-bold text-slate-500">
            {isArabic
              ? `${station.completedLessons} من ${station.totalLessons || 0} محاضرات مكتملة`
              : `${station.completedLessons} of ${station.totalLessons || 0} lessons completed`}
          </p>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-[#07152E] transition hover:border-[#F7B548]"
        >
          <ChevronLeft className="h-4 w-4 rotate-180" />
          {isArabic ? "العودة إلى خريطة المسار" : "Back to Path Map"}
        </button>
      </div>

      {selectedLessonId ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-3">
          <BunnyVideoPlayer lessonId={selectedLessonId} />
        </div>
      ) : null}

      <div
        className={
          station.learningLayout === "split"
            ? "grid gap-4 lg:grid-cols-2"
            : "grid gap-4"
        }
      >
        {station.learningParts.map((part) => (
          <section
            key={part.part}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
          >
            <header className="flex items-center justify-between gap-3 bg-[#07152E] px-4 py-3 text-white">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-black">{partTitle[part.part]}</h4>

                  {part.access === "active" ? (
                    <span className="rounded-full bg-[#F7B548] px-2.5 py-0.5 text-[10px] font-black text-[#07152E]">
                      {Math.round(part.progressPercent)}%
                    </span>
                  ) : null}
                </div>

                <p className="mt-1 text-[10px] font-bold text-white/65">
                  {isArabic
                    ? `${part.lessons.length} محاضرات`
                    : `${part.lessons.length} lessons`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {part.access === "active" && part.resources.length ? (
                  <div className="flex items-center gap-1.5">
                    {part.resources.map((resource) => (
                      <a
                        key={resource.id}
                        href={resource.downloadUrl}
                        title={isArabic ? `تحميل ${resource.title}` : `Download ${resource.title}`}
                        aria-label={isArabic ? `تحميل ${resource.title}` : `Download ${resource.title}`}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#F7B548] px-2.5 text-[9px] font-black text-[#07152E] transition hover:bg-[#FFD078]"
                      >
                        <Download size={13} />
                        <span className="hidden sm:inline">
                          {resource.title}
                        </span>
                      </a>
                    ))}
                  </div>
                ) : null}

                {part.access === "active" ? (
                  <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-[10px] font-black text-emerald-200">
                    {isArabic ? "متاح" : "Available"}
                  </span>
                ) : part.access === "pending" ? (
                  <span className="rounded-full bg-amber-400/15 px-3 py-1 text-[10px] font-black text-amber-200">
                    {isArabic ? "طلبك قيد المراجعة" : "Pending review"}
                  </span>
                ) : (
                  <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-black text-white/70">
                    {isArabic ? "غير مشترك" : "Not enrolled"}
                  </span>
                )}
              </div>
            </header>

            {part.access === "active" ? (
              part.lessons.length ? (
                <div className="divide-y divide-slate-100">
                  {part.lessons.map((lesson, index) => (
                    <div
                      key={lesson.lessonId}
className="grid grid-cols-[34px_minmax(0,1fr)_auto_105px] items-center gap-3 px-4 py-3"                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FFF4DF] text-[10px] font-black text-[#B87508]">
                        {index + 1}
                      </span>

                     <div className="min-w-0">
  {/* الصف الأول: اسم المحاضرة */}
  <p
    className="truncate text-xs font-black text-[#07152E]"
    title={lesson.title}
  >
    {lesson.title}
  </p>

  {/* الصف الثاني: الوقت + نسبة الإنجاز + Progress Bar */}
  <div className="mt-1 flex items-center gap-2">
    <div className="flex shrink-0 items-center gap-1 text-[10px] font-bold text-slate-500">
      <Clock3 size={12} />
      <span>
        {formatLessonDuration(lesson.durationSeconds, locale)}
      </span>
    </div>

    {lesson.progressPercent > 0 ? (
      <>
        <span className="shrink-0 text-[10px] font-black text-slate-500">
          {Math.round(lesson.progressPercent)}%
        </span>

        <div className="h-1.5 min-w-[45px] max-w-[90px] flex-1 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-[#F7B548]"
            style={{
              width: `${lesson.progressPercent}%`,
            }}
          />
        </div>
      </>
    ) : null}
  </div>
</div>

                      {lesson.resources.length ? (
                        <div className="flex items-center justify-end gap-1">
                          {lesson.resources.map((resource) => (
                            <a
                              key={resource.id}
                              href={resource.downloadUrl}
                              title={isArabic ? `تحميل ${resource.title}` : `Download ${resource.title}`}
                              aria-label={isArabic ? `تحميل ${resource.title}` : `Download ${resource.title}`}
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
                        onClick={() => setSelectedLessonId(lesson.lessonId)}
                        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#07152E] px-3 text-[10px] font-black text-white transition hover:bg-[#102A50]"
                      >
                        <PlayCircle size={14} />
                        {lesson.completed
                          ? isArabic ? "مشاهدة" : "Watch"
                          : lesson.progressPercent > 0
                            ? isArabic ? "استكمل" : "Continue"
                            : isArabic ? "ابدأ الآن" : "Start Now"}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-8 text-center text-xs font-bold text-slate-500">
                  {isArabic ? "لا توجد محاضرات منشورة في هذا القسم حاليًا." : "No lessons are published in this section yet."}
                </div>
              )
            ) : (
              <div className="flex min-h-[180px] flex-col items-center justify-center px-5 py-6 text-center">
                <BookOpenCheck className="h-8 w-8 text-[#C88712]" />
                <p className="mt-3 text-sm font-black text-[#07152E]">
                  {part.part === "fundamentals"
                    ? isArabic ? "اشترك في رحلة الأساسيات" : "Enroll in Fundamentals"
                    : part.part === "advanced"
                      ? isArabic ? "اشترك في الرحلة المتقدمة" : "Enroll in Advanced"
                      : isArabic ? "اشترك في الرحلة" : "Enroll in Journey"}
                </p>

                {part.access === "pending" ? (
                  <p className="mt-2 text-xs font-bold text-amber-700">
                    {isArabic ? "طلب الاشتراك قيد المراجعة." : "Enrollment request is under review."}
                  </p>
                ) : part.courseId ? (
                  <div className="mt-4">
                    <CourseActionButton
                      courseId={part.courseId}
                      stationId={station.stationId}
                      journeyType={
                        partJourneyType[
                          part.part
                        ]
                      }
                      actionKey={
                        partActionKey[
                          part.part
                        ]
                      }
                      actionTitle={
                        partActionTitle[
                          part.part
                        ]
                      }
                      enrollmentStatus={
                        part.enrollmentStatus
                      }
                      label={isArabic ? "اشترك الآن" : "Enroll Now"}
                    />
                  </div>
                ) : (
                  <p className="mt-2 text-xs font-bold text-slate-500">
                    {isArabic ? "لم يتم تجهيز هذا القسم للاشتراك بعد." : "Enrollment is not available for this section yet."}
                  </p>
                )}
              </div>
            )}
          </section>
        ))}
      </div>
    </section>
  );
}

function getStationCaption(
  station: StudentPathStationProgress,
  locale: Locale,
) {
  const isArabic = locale === "ar";
  switch (station.status) {
    case "completed":
      return isArabic ? "رحلة مكتملة" : "Completed";
    case "in_progress":
      return isArabic
        ? `${station.completedLessons} من ${station.totalLessons || "—"} دروس`
        : `${station.completedLessons} of ${station.totalLessons || "—"} lessons`;
    case "not_started":
      return isArabic ? "جاهزة للبدء" : "Ready to start";
    case "pending":
      return isArabic ? "بانتظار الاعتماد" : "Pending approval";
    default:
      return isArabic ? "غير مشترك" : "Not enrolled";
  }
}

function LegendDot({
  className,
  label,
}: {
  className: string;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`h-2.5 w-2.5 rounded-full ${className}`}
      />
      {label}
    </span>
  );
}

function NextStepPanel({
  data,
  locale,
}: {
  data: StudentDashboardData;
  locale: Locale;
}) {
  const isArabic = locale === "ar";
  const sections = data.nextStepSections ?? [];

  const tabMeta = {
    professional: {
      title: isArabic ? "رحلة الاحتراف" : "Professional Journey",
      badgeLabel: isArabic ? "احتراف" : "Professional",
    },
    one_day: {
      title: isArabic ? "رحلة اليوم الواحد" : "One-Day Journey",
      badgeLabel: isArabic ? "يوم واحد" : "One Day",
    },
    free: {
      title: isArabic ? "الرحلات المجانية" : "Free Journeys",
      badgeLabel: isArabic ? "مجانية" : "Free",
    },
  } as const;

  return (
    <div className="mx-auto max-w-5xl">
      <JourneyTabs
        ariaLabel={isArabic ? "الخطوة التالية حسب نوع الرحلة" : "Next step by journey type"}
        tabs={sections.map((section) => {
          const activeItems = section.groups.flatMap(
            (group) => group.items,
          );

          const totalItems = activeItems.length;

          const averageProgress =
            totalItems > 0
              ? Math.round(
                  activeItems.reduce(
                    (sum, item) =>
                      sum + item.progressPercent,
                    0,
                  ) / totalItems,
                )
              : 0;

          return {
            id: section.kind,

            title:
              tabMeta[section.kind].title,

            subtitle:
              totalItems > 0
                ? isArabic
                  ? `${totalItems} محاضرات تحتاج متابعة`
                  : `${totalItems} lessons need attention`
                : isArabic
                  ? "لا توجد محاضرات معلقة"
                  : "No pending lessons",

            badge: `${averageProgress}%`,

            progressPercent:
              averageProgress,

            statusLabel:
              tabMeta[section.kind].badgeLabel,

            content: (
              <NextStepSectionContent
                key={section.kind}
                section={section}
                locale={locale}
              />
            ),
          };
        })}
      />
    </div>
  );
}

function NextStepSectionContent({
  section,
  locale,
}: {
  section: NonNullable<
    StudentDashboardData["nextStepSections"]
  >[number];
  locale: Locale;
}) {
  const isArabic = locale === "ar";
  const [selectedLessonId, setSelectedLessonId] =
    useState<string | null>(null);

  const hasItems = section.groups.some(
    (group) => group.items.length > 0,
  );

  if (!hasItems) {
    return (
      <div className="flex min-h-[260px] items-center justify-center gap-2 px-5 py-8 text-center text-xs font-bold text-slate-500">
        <Check
          size={18}
          className="text-[#70B64A]"
        />

        {isArabic ? "لا توجد محاضرات تحتاج للاستكمال في هذا النوع" : "No lessons need completion in this category"}
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">

      {/* تشغيل الفيديو داخل شاشة الخطوة التالية */}
      {selectedLessonId ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(7,21,46,0.08)]">
          <div className="flex justify-end border-b border-slate-100 px-3 py-2">
            <button
              type="button"
              onClick={() =>
                setSelectedLessonId(null)
              }
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-[10px] font-black text-[#07152E] transition hover:bg-slate-50"
            >
              {isArabic ? "إغلاق الفيديو" : "Close video"}
            </button>
          </div>

          <div className="p-3">
            <BunnyVideoPlayer
              lessonId={selectedLessonId}
            />
          </div>
        </div>
      ) : null}

      {/* المحطات والمحاضرات */}
      {section.groups.map((group) =>
        group.items.length ? (
          <section
            key={group.id}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
          >
            <header className="flex items-center justify-between bg-[#07152E] px-4 py-3 text-white">
              <h4 className="text-sm font-black">
                {group.title}
              </h4>

              <span className="rounded-full bg-[#F7B548]/15 px-3 py-1 text-[10px] font-black text-[#F7B548]">
                {isArabic ? `${group.items.length} محاضرات` : `${group.items.length} lessons`}
              </span>
            </header>

            <div className="divide-y divide-slate-100">
              {group.items.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p
                      className="truncate text-xs font-black text-[#07152E]"
                      title={item.lessonTitle}
                    >
                      {item.lessonTitle}
                    </p>

                    <div className="mt-1.5 flex items-center gap-3">
                      <div className="flex shrink-0 items-center gap-1 text-[10px] font-bold text-slate-500">
                        <Clock3 size={13} />

                        {item.remainingMinutes
                          ? isArabic
                            ? `متبقي ${item.remainingMinutes} د`
                            : `${item.remainingMinutes} min remaining`
                          : item.progressPercent > 0
                            ? isArabic ? "الوقت غير محدد" : "Time unavailable"
                            : isArabic ? "لم تبدأ بعد" : "Not started yet"}
                      </div>

                      <span className="shrink-0 text-[10px] font-black text-slate-500">
                        {Math.round(
                          item.progressPercent,
                        )}
                        %
                      </span>

                      <div className="h-1.5 min-w-[55px] max-w-[120px] flex-1 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-[#F7B548]"
                          style={{
                            width: `${Math.max(
                              0,
                              Math.min(
                                100,
                                item.progressPercent,
                              ),
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setSelectedLessonId(
                        item.lessonId,
                      )
                    }
                    disabled={!item.lessonId}
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#07152E] px-4 text-[10px] font-black text-white transition hover:-translate-y-0.5 hover:bg-[#102A50] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <PlayCircle size={14} />
                    {item.actionLabel}
                  </button>
                </div>
              ))}
            </div>
          </section>
        ) : null,
      )}

    </div>
  );
}
function EmptyPanel({
  icon: Icon,
  title,
  text,
  href,
  locale,
}: {
  icon: typeof Compass;
  title: string;
  text: string;
  href: string;
  locale: Locale;
}) {
  const isArabic = locale === "ar";
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
      <span className="flex h-18 w-18 items-center justify-center rounded-full bg-[#FFF4DF] text-[#C88712]">
        <Icon size={31} />
      </span>

      <h3 className="mt-4 text-xl font-black">
        {title}
      </h3>

      <p className="mt-2 max-w-sm text-sm font-semibold text-slate-500">
        {text}
      </p>

      <Link
        href={href}
        className="mt-5 inline-flex h-11 items-center gap-2 bg-[#07152E] px-5 text-xs font-black text-white"
      >
        {isArabic ? "استكشف الآن" : "Explore Now"}
        <ChevronLeft size={17} />
      </Link>
    </div>
  );
}