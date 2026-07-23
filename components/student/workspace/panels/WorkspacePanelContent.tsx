"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Award,
  BarChart3,
  BookOpenCheck,
  Check,
  ChevronLeft,
  ClipboardList,
  Clock3,
  Compass,
  FileCheck2,
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

type Props = {
  panel: WorkspacePanelDefinition;
  data: StudentDashboardData;
};

export default function WorkspacePanelContent({
  panel,
  data,
}: Props) {
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
        <EmptyPanel
          icon={FileCheck2}
          title="لا توجد شهادات بعد"
          text="أكمل أول رحلة لتظهر شهادتك هنا."
          href="/career-path/road-design"
        />
      );

    case "achievement-card":
      return (
        <AchievementCard
          completed={data.summary.completed}
          active={data.summary.active}
        />
      );

    case "surveys":
      return (
        <EmptyPanel
          icon={ClipboardList}
          title="لا توجد استبيانات"
          text="ستظهر الاستبيانات المطلوبة هنا تلقائيًا."
          href="/dashboard"
        />
      );

    case "projects":
      return (
        <EmptyPanel
          icon={FileUp}
          title="مشاريعك"
          text="ستظهر هنا المشاريع التي ترفعها ضمن رحلاتك."
          href="/dashboard"
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
  return (
    <article className="overflow-hidden rounded-[26px] border border-[#D9E1EA] bg-white shadow-[0_18px_45px_rgba(7,21,46,0.10)]">
      <header className="bg-[#07152E] px-5 py-4 text-white sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black sm:text-xl">
              {path.title}
            </h3>
            <p className="mt-1 text-[11px] font-bold text-white/75">
              مشترك في {path.enrolledStations} من{" "}
              {path.totalStations} رحلات
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div
              className="relative flex h-14 w-14 items-center justify-center rounded-full"
              style={{
                background: `conic-gradient(#F7B548 ${path.progressPercent * 3.6}deg, rgba(255,255,255,.18) 0deg)`,
              }}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#07152E] text-[11px] font-black text-[#F7B548]">
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

      <div className="bg-[#F8FAFC] px-4 py-5 sm:px-6">
        <div className="overflow-x-auto pb-2">
          <div
            className="relative mx-auto flex min-w-[760px] items-start justify-between gap-2 px-5 pt-3"
            dir="rtl"
          >
            <div className="absolute left-[7%] right-[7%] top-[42px] h-[20px] rounded-full border-y border-[#F7B548] bg-[#07152E] shadow-[0_5px_14px_rgba(7,21,46,0.18)]" />

            {path.stations.map((station, index) => (
              <PathStation
                key={station.stationId}
                station={station}
                index={index}
              />
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-slate-200 pt-4 text-[10px] font-bold text-slate-500">
          <LegendDot className="bg-[#70B64A]" label="مكتملة" />
          <LegendDot className="bg-[#F7B548]" label="قيد التقدم" />
          <LegendDot className="bg-[#07152E]" label="مشترك ولم يبدأ" />
          <LegendDot className="bg-[#AAB3C0]" label="غير مشترك" />
        </div>
      </div>
    </article>
  );
}

function PathStation({
  station,
  index,
}: {
  station: StudentPathStationProgress;
  index: number;
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
          className={`relative flex h-[66px] w-[66px] items-center justify-center overflow-hidden rounded-full border-[3px] ring-2 ring-[#F7B548]/65 ring-offset-2 ring-offset-[#F8FAFC] text-xs font-black transition duration-300 ${statusClasses[station.status]}`}
        >
          {station.iconUrl ? (
            <Image
              src={station.iconUrl}
              alt=""
              fill
              sizes="66px"
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

        <span className="mt-3 max-w-[140px] text-center text-[15px] font-black leading-6 text-[#07152E]">
          {station.shortTitle}
        </span>

        <span
          className={`mt-1 min-h-4 text-center text-[9px] font-bold ${
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
        className="group relative z-10 flex w-[150px] shrink-0 flex-col items-center rounded-2xl px-2 py-1 transition hover:-translate-y-1 hover:bg-white hover:shadow-lg"
      >
        {content}
        <span className="mt-2 rounded-full bg-slate-200 px-3 py-1 text-[9px] font-black text-slate-600 transition group-hover:bg-[#07152E] group-hover:text-[#F7B548]">
          استكشف الرحلة
        </span>
      </Link>
    );
  }

  /*
   * صفحة المحتوى التعليمي لم تُبنَ بعد؛
   * المحطات المشترك بها تعرض التقدم فقط ولا تستخدم رابطًا وهميًا.
   */
  return (
    <div
      title="سيتم تفعيل المحتوى التعليمي قريبًا"
      className="relative z-10 flex w-[150px] shrink-0 cursor-default flex-col items-center rounded-2xl px-2 py-1"
    >
      {content}
      <span className="mt-2 rounded-full bg-[#07152E]/8 px-3 py-1 text-[9px] font-black text-[#07152E]/65">
        المحتوى قريبًا
      </span>
    </div>
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

  const sectionStyles = {
    professional: {
      icon: "🚀",
      border: "border-[#07152E]/15",
      heading: "bg-[#07152E] text-white",
      accent: "bg-[#F7B548]",
      progress: "bg-[#07152E]",
    },
    one_day: {
      icon: "⚡",
      border: "border-[#F7B548]/35",
      heading: "bg-[#FFF7E8] text-[#8A5705]",
      accent: "bg-[#F7B548]",
      progress: "bg-[#F7B548]",
    },
    free: {
      icon: "🎁",
      border: "border-[#70B64A]/30",
      heading: "bg-[#F2F9ED] text-[#477D28]",
      accent: "bg-[#70B64A]",
      progress: "bg-[#70B64A]",
    },
  } as const;

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <p className="text-xs font-black text-[#C88712]">
            خطتك الحالية
          </p>
          <h3 className="mt-1 text-xl font-black text-[#07152E]">
            أكمل من حيث توقفت
          </h3>
        </div>

        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FFF4DF] text-[#C88712]">
          <Target size={23} />
        </span>
      </div>

      {sections.map((section) => {
        const styles = sectionStyles[section.kind];
        const hasItems = section.groups.some(
          (group) => group.items.length > 0,
        );

        return (
          <section
            key={section.kind}
            className={`overflow-hidden rounded-2xl border bg-white ${styles.border}`}
          >
            <header
              className={`flex items-center gap-2 px-4 py-3 text-sm font-black sm:px-5 ${styles.heading}`}
            >
              <span aria-hidden="true">{styles.icon}</span>
              <span>{section.title}</span>
            </header>

            {hasItems ? (
              <div className="divide-y divide-slate-200">
                {section.groups.map((group) =>
                  group.items.length ? (
                    <div key={group.id} className="px-4 py-4 sm:px-5">
                      <div className="mb-3 flex items-center gap-2">
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${styles.accent}`}
                        />
                        <h4 className="text-sm font-black text-[#07152E]">
                          {group.title}
                        </h4>
                      </div>

                      <div className="overflow-x-auto">
                        <div className="min-w-[650px] divide-y divide-slate-100 rounded-xl border border-slate-200">
                          {group.items.map((item) => (
                            <div
                              key={item.id}
                              className="grid grid-cols-[minmax(220px,1fr)_180px_130px_110px] items-center gap-4 px-4 py-3"
                            >
                              <p className="truncate text-xs font-black text-[#07152E]">
                                {item.lessonTitle}
                              </p>

                              <div className="flex items-center gap-2">
                                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                                  <div
                                    className={`h-full rounded-full ${styles.progress}`}
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
                                <span className="w-9 text-left text-[10px] font-black text-slate-600">
                                  {Math.round(item.progressPercent)}%
                                </span>
                              </div>

                              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                                <Clock3 size={14} />
                                {item.remainingMinutes
                                  ? `متبقي ${item.remainingMinutes} د`
                                  : item.progressPercent > 0
                                    ? "الوقت غير محدد"
                                    : "لم تبدأ بعد"}
                              </span>

                              <Link
                                href={item.href}
                                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#07152E] px-3 text-[11px] font-black text-white transition hover:-translate-y-0.5 hover:bg-[#102A50]"
                              >
                                <PlayCircle size={15} />
                                {item.actionLabel}
                              </Link>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : null,
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 px-5 py-7 text-center text-xs font-bold text-slate-500">
                <Check size={18} className="text-[#70B64A]" />
                لا توجد محاضرات تحتاج للاستكمال في هذا القسم
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

function AchievementCard({
  completed,
  active,
}: {
  completed: number;
  active: number;
}) {
  return (
    <div className="mx-auto max-w-3xl border border-[#F7B548]/30 bg-gradient-to-l from-[#07152E] to-[#12345F] p-6 text-white shadow-xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-black text-[#F7B548]">
            بطاقة الإنجازات
          </p>
          <h3 className="mt-2 text-2xl font-black">
            إنجازاتك في مكان واحد
          </h3>
        </div>
        <Award
          size={48}
          className="text-[#F7B548]"
        />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <Metric
          label="رحلات مكتملة"
          value={completed}
          icon={FileCheck2}
        />
        <Metric
          label="رحلات نشطة"
          value={active}
          icon={BarChart3}
        />
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Award;
}) {
  return (
    <div className="bg-white/10 p-4">
      <Icon
        size={18}
        className="text-[#F7B548]"
      />
      <p className="mt-3 text-2xl font-black">
        {value}
      </p>
      <p className="text-[10px] font-bold text-white/65">
        {label}
      </p>
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