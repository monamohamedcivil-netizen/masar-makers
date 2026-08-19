"use client";
import CertificatesPanel from "./CertificatesPanel";
import ProjectsPanel from "./ProjectsPanel";
import SurveysPanel from "./SurveysPanel";
import Image from "next/image";
import { useState } from "react";
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
};

export default function WorkspacePanelContent({
  panel,
  data,
  initialLessonId,
}: Props) {
  console.log("Certificates:", data.certificates);
  switch (panel.kind) {
    case "course-list":
      return (
        <CareerPathsPanel
          paths={data.careerPaths ?? []}
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
              "لا يوجد محتوى متاح حاليًا.",
          )}
          href={String(
            panel.settings?.href ??
              "/career-path/road-design",
          )}
        />
      );

    case "next-step":
      return <NextStepPanel data={data} />;

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
    />
  );

    case "surveys":
      return (
        <SurveysPanel
          data={data}
        />
      );

  case "projects":
  return (
    <ProjectsPanel
      data={data}
    />
  );

    default:
      return null;
  }
}

function CareerPathsPanel({
  paths,
}: {
  paths: StudentCareerPathProgress[];
}) {
  if (!paths.length) {
    return (
      <EmptyPanel
        icon={BookOpenCheck}
        title="رحلتك الأولى في انتظارك"
        text="اشترك في إحدى الرحلات لتظهر خريطة تقدمك المهنية هنا."
        href="/career-path/road-design"
      />
    );
  }

  return (
    <JourneyTabs
      ariaLabel="المسارات المهنية المشترك بها"
      tabs={paths.map((path) => ({
        id: path.pathId,
        title: path.title,
        subtitle: `${path.enrolledStations} من ${path.totalStations} رحلات`,
        badge: `${path.progressPercent}%`,
        progressPercent: path.progressPercent,
        statusLabel: `${path.completedStations} مكتملة`,
        content: (
          <CareerPathProgressCard
            key={path.pathId}
            path={path}
          />
        ),
      }))}
    />
  );
}

function CareerPathProgressCard({
  path,
}: {
  path: StudentCareerPathProgress;
}) {
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
      />

      <StationLearningView
        station={selectedStation}
        onBack={() => setSelectedStationId(null)}
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
              مشترك في {path.enrolledStations} من{" "}
              {path.totalStations} رحلات
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
                التقدم العام في المسار
              </p>
              <p className="mt-1 text-xs font-black text-[#FFE0A6]">
                {path.completedStations} رحلات مكتملة
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="bg-[#F8FAFC] px-3 py-5 sm:px-4">
          <div
            className="relative mx-auto grid w-full grid-cols-5 items-start gap-1 px-2 pt-3 sm:px-4"
            dir="rtl"
          >
            <div className="absolute left-[11%] right-[11%] top-[42px] h-[16px] rounded-full border-y border-[#F7B548] bg-[#07152E]" />

            {path.stations.map((station, index) => (
              <PathStation
                key={station.stationId}
                station={station}
                index={index}
                onOpen={() => setSelectedStationId(station.stationId)}
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
}: {
  station: StudentPathStationProgress;
  index: number;
  onOpen: () => void;
}) {
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

  const content = (
    <>
      <div className="relative z-10 flex flex-col items-center">
        <span
          className={`relative flex h-[52px] w-[52px] items-center justify-center overflow-hidden rounded-full border-[2px] bg-white text-xs font-black transition duration-300 ${statusClasses[station.status]}`}
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
            <Check size={25} strokeWidth={3} />
          ) : station.status === "pending" ? (
            <Clock3 size={22} />
          ) : station.status === "in_progress" ? (
            <span>{Math.round(station.progressPercent)}%</span>
          ) : (
            <span>{index + 1}</span>
          )}
        </span>

        <span className="mt-2 w-full truncate text-center text-[9px] font-black text-[#334155] sm:text-[10px]">
          {station.shortTitle}
        </span>

        <span
          className={`mt-0.5 min-h-4 text-center text-[8px] font-bold ${
            station.status === "completed"
              ? "text-[#589638]"
              : station.status === "in_progress"
                ? "text-[#B87508]"
                : station.status === "pending"
                  ? "text-amber-700"
                  : station.status === "not_enrolled"
                    ? "text-slate-400"
                    : "text-[#07152E]"
          }`}
        >
          {getStationCaption(station)}
        </span>
      </div>
    </>
  );

  if (!station.isEnrolled) {
    return (
      <Link
        href={station.courseHref}
        title="استكشف الرحلة واطلب الاشتراك"
        className="group relative z-10 flex min-w-0 flex-col items-center px-1 py-1 transition"
      >
        {content}
        <span className="mt-2 rounded-full bg-slate-200 px-3 py-1 text-[9px] font-black text-slate-600 transition group-hover:bg-[#07152E] group-hover:text-[#F7B548]">
          استكشف الرحلة
        </span>
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      title={
        station.status === "not_started"
          ? "ابدأ الرحلة"
          : "متابعة الرحلة"
      }
      className="group relative z-10 flex min-w-0 flex-col items-center px-1 py-1 transition"
    >
      {content}
      <span className="mt-2 rounded-full bg-[#07152E] px-3 py-1 text-[9px] font-black text-[#F7B548] transition group-hover:bg-[#F7B548] group-hover:text-[#07152E]">
        {station.status === "not_started" ? "ابدأ الرحلة" : "متابعة الرحلة"}
      </span>
    </button>
  );
}

function formatLessonDuration(totalSeconds: number) {
  const total = Math.max(0, Math.floor(Number(totalSeconds || 0)));
  if (!total) return "المدة غير محددة";

  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;

  return [
    hours ? `${hours} س` : "",
    minutes ? `${minutes} د` : "",
    `${seconds} ث`,
  ]
    .filter(Boolean)
    .join(" ");
}
function CompactPathStations({
  path,
  selectedStationId,
  onSelectStation,
}: {
  path: StudentCareerPathProgress;
  selectedStationId: string;
  onSelectStation: (stationId: string) => void;
}) {
  return (
    <div className="relative px-3 py-3">
<div className="absolute left-[11%] right-[11%] top-[32px] h-[8px] bg-[#07152E]">       
        <div className="absolute inset-x-0 top-1/2 h-[0.5px] -translate-y-1/2 bg-[#F7B548]" />
      </div>

      <div className="relative z-10 flex items-start justify-between gap-2">
        {path.stations.map((station) => {
          const active =
            station.stationId === selectedStationId;

          return (
            <button
              key={station.stationId}
              type="button"
              onClick={() =>
                onSelectStation(station.stationId)
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
function StationLearningView({
  station,
  onBack,
}: {
  station: StudentPathStationProgress;
  onBack: () => void;
}) {
  const [selectedLessonId, setSelectedLessonId] =
    useState<string | null>(null);

  const partTitle = {
    single: "محاضرات الكورس",
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
    single: "رحلة الاحتراف المتكاملة",
    fundamentals: "رحلة الأساسيات",
    advanced: "الرحلة المتقدمة",
  } as const;

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <p className="text-xs font-black text-[#C88712]">
            رحلة الاحتراف المتكاملة
          </p>
          <h3 className="mt-1 text-xl font-black text-[#07152E]">
            {station.title}
          </h3>
          <p className="mt-1 text-xs font-bold text-slate-500">
            {station.completedLessons} من {station.totalLessons || 0} محاضرات مكتملة
          </p>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-[#07152E] transition hover:border-[#F7B548]"
        >
          <ChevronLeft className="h-4 w-4 rotate-180" />
          العودة إلى خريطة المسار
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
                <h4 className="font-black">{partTitle[part.part]}</h4>
                <p className="mt-1 text-[10px] font-bold text-white/65">
                  {part.lessons.length} محاضرات
                </p>
              </div>
              {part.access === "active" ? (
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-[10px] font-black text-emerald-200">
                  متاح
                </span>
              ) : part.access === "pending" ? (
                <span className="rounded-full bg-amber-400/15 px-3 py-1 text-[10px] font-black text-amber-200">
                  طلبك قيد المراجعة
                </span>
              ) : (
                <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-black text-white/70">
                  غير مشترك
                </span>
              )}
            </header>

            {part.access === "active" ? (
              part.lessons.length ? (
                <div className="divide-y divide-slate-100">
                  {part.lessons.map((lesson, index) => (
                    <div
                      key={lesson.lessonId}
className="grid grid-cols-[34px_minmax(0,1fr)_105px] items-center gap-3 px-4 py-3"                    >
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
        {formatLessonDuration(lesson.durationSeconds)}
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

                      <button
                        type="button"
                        onClick={() => setSelectedLessonId(lesson.lessonId)}
                        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#07152E] px-3 text-[10px] font-black text-white transition hover:bg-[#102A50]"
                      >
                        <PlayCircle size={14} />
                        {lesson.completed
                          ? "مشاهدة"
                          : lesson.progressPercent > 0
                            ? "استكمل"
                            : "ابدأ الآن"}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-8 text-center text-xs font-bold text-slate-500">
                  لا توجد محاضرات منشورة في هذا القسم حاليًا.
                </div>
              )
            ) : (
              <div className="flex min-h-[180px] flex-col items-center justify-center px-5 py-6 text-center">
                <BookOpenCheck className="h-8 w-8 text-[#C88712]" />
                <p className="mt-3 text-sm font-black text-[#07152E]">
                  {part.part === "fundamentals"
                    ? "اشترك في رحلة الأساسيات"
                    : part.part === "advanced"
                      ? "اشترك في الرحلة المتقدمة"
                      : "اشترك في الرحلة"}
                </p>

                {part.access === "pending" ? (
                  <p className="mt-2 text-xs font-bold text-amber-700">
                    طلب الاشتراك قيد المراجعة.
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
                      label="اشترك الآن"
                    />
                  </div>
                ) : (
                  <p className="mt-2 text-xs font-bold text-slate-500">
                    لم يتم تجهيز هذا القسم للاشتراك بعد.
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
) {
  switch (station.status) {
    case "completed":
      return "رحلة مكتملة";
    case "in_progress":
      return `${station.completedLessons} من ${
        station.totalLessons || "—"
      } دروس`;
    case "not_started":
      return "جاهزة للبدء";
    case "pending":
      return "بانتظار الاعتماد";
    default:
      return "غير مشترك";
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
}: {
  data: StudentDashboardData;
}) {
  const sections = data.nextStepSections ?? [];

  const tabMeta = {
    professional: {
      title: "رحلة الاحتراف",
      badgeLabel: "احتراف",
    },
    one_day: {
      title: "رحلة اليوم الواحد",
      badgeLabel: "يوم واحد",
    },
    free: {
      title: "الرحلات المجانية",
      badgeLabel: "مجانية",
    },
  } as const;

  return (
    <div className="mx-auto max-w-5xl">
      <JourneyTabs
        ariaLabel="الخطوة التالية حسب نوع الرحلة"
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
                ? `${totalItems} محاضرات تحتاج متابعة`
                : "لا توجد محاضرات معلقة",

            badge: `${averageProgress}%`,

            progressPercent:
              averageProgress,

            statusLabel:
              tabMeta[section.kind].badgeLabel,

            content: (
              <NextStepSectionContent
                key={section.kind}
                section={section}
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
}: {
  section: NonNullable<
    StudentDashboardData["nextStepSections"]
  >[number];
}) {
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

        لا توجد محاضرات تحتاج للاستكمال في هذا النوع
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
              إغلاق الفيديو
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
                {group.items.length} محاضرات
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
                          ? `متبقي ${item.remainingMinutes} د`
                          : item.progressPercent > 0
                            ? "الوقت غير محدد"
                            : "لم تبدأ بعد"}
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
}: {
  icon: typeof Compass;
  title: string;
  text: string;
  href: string;
}) {
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
        استكشف الآن
        <ChevronLeft size={17} />
      </Link>
    </div>
  );
}