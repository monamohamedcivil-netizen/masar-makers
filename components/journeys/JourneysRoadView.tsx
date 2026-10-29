"use client";

import Image from "next/image";
import Link from "next/link";
import { CalendarDays, PlayCircle, Rocket } from "lucide-react";
import { useMemo, useState } from "react";

import CourseActionButton from "@/components/course/CourseActionButton";
import type { EnrollmentStatus } from "@/lib/actions/enroll";
import { courseIcon } from "@/lib/journeys/course-icons";
import type { ProfessionalPath, ProfessionalStation } from "@/lib/journeys/professional-stations";
import type { LecturePath, TopicLecture } from "@/lib/journeys/topic-lectures";

/* =========================================================
   صفحات طرق التعلم بشكل «مسار طريق»:
   محطات على طريق، والضغط على محطة يعرض محتواها تحتها.
   - اليوم الواحد (أزرق) والمجانية (أخضر): المحطة = قسم، والمحتوى = محاضراته.
   - الاحتراف المتكامل (ذهبي هادي): المحطة = كورس، والمحتوى = مستويات الرحلة.
========================================================= */

type Kind = "workshop" | "free" | "professional";

const THEME = {
  workshop: { accent: "#3B82E6", soft: "#EAF2FE", ring: "ring-[#3B82E6]", text: "text-[#2463C7]", bg: "bg-[#3B82E6]", title: "رحلات اليوم الواحد", subtitle: "محاضرة واحدة مركّزة في موضوع محدد، مرتبة حسب خطوات تصميم المشروع. اختار المحطة اللي محتاجها وابدأ.", action: "اشترك الآن", icon: Rocket },
  free: { accent: "#2FA36B", soft: "#E8F6EF", ring: "ring-[#2FA36B]", text: "text-[#1F8455]", bg: "bg-[#2FA36B]", title: "الرحلات المجانية", subtitle: "ابدأ مجانًا واتعرف على أسلوب التعلم في صناع المسار. المحاضرات مرتبة حسب خطوات تصميم المشروع.", action: "شاهد الآن", icon: PlayCircle },
  professional: { accent: "#D4A24C", soft: "#FBF3E2", ring: "ring-[#D4A24C]", text: "text-[#A9761F]", bg: "bg-[#D4A24C]", title: "رحلات الاحتراف المتكاملة", subtitle: "رحلة متدرجة لكل برنامج، من الأساسيات حتى المخرجات الاحترافية، على مشروع حقيقي. اختار محطتك.", action: "", icon: CalendarDays },
} as const;

type Station = { key: string; title: string; iconCode?: string; comingSoon?: boolean; count?: number };

function CourseLogo({ code, size = 28 }: { code: string; size?: number }) {
  const src = courseIcon(code);
  if (!src) return <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-[#07152E]">{code}</span>;
  return (
    <span className="relative inline-block shrink-0 overflow-hidden rounded-lg bg-white" style={{ width: size, height: size }}>
      <Image src={src} alt={code} fill sizes={`${size}px`} className="object-contain p-0.5" />
    </span>
  );
}

function Road({
  stations,
  active,
  onSelect,
}: {
  stations: Station[];
  active: string;
  onSelect: (key: string) => void;
}) {
  return (
    <div className="relative mx-auto max-w-6xl overflow-x-auto px-2 pb-2 [scrollbar-width:thin]">
      <div className="relative min-w-[720px] px-6 pt-4 sm:min-w-0">
        {/* الطريق */}
        <div className="absolute inset-x-6 top-[52px] h-[18px] rounded-full bg-[#1B2A44] shadow-[inset_0_2px_4px_rgba(0,0,0,.35)]">
          <div className="absolute inset-x-3 top-1/2 h-0 -translate-y-1/2 border-t-2 border-dashed border-[#F7B548]/80" />
        </div>
        <ol className="relative flex items-start justify-between gap-2">
          {stations.map((s, i) => {
            const selected = s.key === active;
            return (
              <li key={s.key} className="flex w-[96px] shrink-0 flex-col items-center text-center sm:w-[118px]">
                <button
                  type="button"
                  onClick={() => onSelect(s.key)}
                  aria-pressed={selected}
                  aria-label={s.comingSoon ? `${s.title} — قريبًا` : s.title}
                  className={`relative flex h-[58px] w-[58px] items-center justify-center overflow-hidden rounded-full border border-white bg-white p-2 shadow-[0_8px_18px_rgba(7,21,46,0.14)] transition-all duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#F7B548]/60 ${
                    selected ? "scale-110 ring-4 ring-[#F7B548]" : "ring-1 ring-[#F7B548] hover:scale-105 hover:ring-2 hover:ring-[#F7B548]/55"
                  } ${s.comingSoon ? "opacity-45 grayscale" : ""}`}
                >
                  {s.iconCode && courseIcon(s.iconCode) ? (
                    <span className="relative h-full w-full">
                      <Image src={courseIcon(s.iconCode)!} alt="" fill sizes="42px" className="object-contain" />
                    </span>
                  ) : (
                    <span className="text-lg font-black text-[#07152E]">{i + 1}</span>
                  )}
                </button>
                <span className={`mt-3 text-[12px] font-black leading-5 sm:text-[13px] ${selected ? "text-[#B87508]" : "text-[#07152E]"}`}>{s.title}</span>
                {s.comingSoon ? (
                  <span className="mt-0.5 text-[11px] font-black text-[#C88712]">قريبًا</span>
                ) : typeof s.count === "number" ? (
                  <span className="mt-0.5 text-[11px] font-bold text-slate-400">{s.count} محاضرة</span>
                ) : null}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

function LectureRow({ lecture, kind }: { lecture: TopicLecture; kind: "workshop" | "free" }) {
  return (
    <article className="grid gap-3 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_170px] sm:items-center">
      <div className="flex min-w-0 items-start gap-3">
        <CourseLogo code={lecture.courseCode} size={34} />
        <div className="min-w-0">
          <h3 className="text-sm font-black leading-6 text-[#07152E]" dir="auto">
            {lecture.title}
          </h3>
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] font-bold text-slate-500">
            <span>{lecture.courseTitle}</span>
          </div>
        </div>
      </div>
      <CourseActionButton
        courseId={lecture.courseId}
        label={THEME[kind].action}
        mode={kind === "free" ? "free" : "enrollment"}
        journeyType={kind === "free" ? "free" : "workshop"}
        actionKey={lecture.actionKey}
        actionTitle={lecture.title}
        itemTitle={lecture.title}
        enrollmentStatus={(lecture.enrollmentStatus as EnrollmentStatus | null) ?? null}
        redirectTo={`/dashboard?panel=${kind === "free" ? "free" : "one-day"}&lesson=${encodeURIComponent(lecture.id)}`}
      />
    </article>
  );
}

function ProfessionalPanel({ station }: { station: ProfessionalStation }) {
  const theme = THEME.professional;
  const enrolled = station.enrollment && ["active", "completed"].includes(station.enrollment.status);
  const pending = station.enrollment?.status === "pending";
  return (
    <div className="p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <CourseLogo code={station.courseCode} size={44} />
        <div className="min-w-0">
          <h2 className="text-lg font-black text-[#07152E]">{station.courseTitle}</h2>
          {station.description ? <p className="mt-0.5 text-sm font-semibold text-slate-500">{station.description}</p> : null}
        </div>
      </div>
      {station.comingSoon ? (
        <p className="mt-4 rounded-xl bg-slate-50 p-4 text-center text-sm font-bold text-slate-500">رحلة هذه المحطة قريبًا.</p>
      ) : (
        <>
          <div className={`mt-4 grid gap-3 ${station.levels.length > 1 ? "sm:grid-cols-3" : ""}`}>
            {station.levels.map((level) => (
              <div key={level.key} className="rounded-2xl border p-4" style={{ borderColor: `${theme.accent}55`, background: theme.soft }}>
                <p className="text-sm font-black text-[#07152E]">{level.title}</p>
                <p className="mt-1 text-xs font-bold text-slate-500">
                  {level.lessons} محاضرة
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {enrolled ? (
              <Link href="/dashboard" className="rounded-xl bg-[#07152E] px-5 py-2.5 text-sm font-black text-white">
                ابدأ الرحلة
              </Link>
            ) : (
              <Link href={`/course/${station.slug}`} className="rounded-xl px-5 py-2.5 text-sm font-black text-[#07152E]" style={{ background: "#F7B548" }}>
                {pending ? "طلب الاشتراك قيد المراجعة — تفاصيل الرحلة" : "تفاصيل الرحلة والاشتراك"}
              </Link>
            )}
            <Link href={`/course/${station.slug}`} className="text-sm font-black text-[#07152E] underline-offset-4 hover:underline">
              صفحة الكورس
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

type Props =
  | { kind: "workshop" | "free"; paths: LecturePath[]; initialPathSlug?: string | null }
  | { kind: "professional"; paths: ProfessionalPath[]; initialPathSlug?: string | null };

export default function JourneysRoadView(props: Props) {
  const { kind } = props;
  const theme = THEME[kind];
  const Icon = theme.icon;
  const paths = props.paths as Array<LecturePath | ProfessionalPath>;
  const initial = paths.find((p) => p.slug === props.initialPathSlug) ?? paths[0];
  const [pathId, setPathId] = useState(initial?.id ?? "");
  const path = paths.find((p) => p.id === pathId) ?? paths[0];

  const stations: Station[] = useMemo(() => {
    if (!path) return [];
    if (kind === "professional") {
      return (path as ProfessionalPath).stations.map((s) => ({ key: s.id, title: s.title, iconCode: s.courseCode, comingSoon: s.comingSoon }));
    }
    return (path as LecturePath).topics.map((t) => ({ key: t.id ?? "other", title: t.title, count: t.lectures.length }));
  }, [path, kind]);

  const [selectedByPath, setSelectedByPath] = useState<Record<string, string>>({});
  const firstOpen = stations.find((s) => !s.comingSoon)?.key ?? stations[0]?.key ?? "";
  const active = (path && selectedByPath[path.id]) || firstOpen;

  return (
    <main dir="rtl" className="min-h-screen bg-[#F7F8FA] pb-16 pt-[55px]">
      <section className="px-4 pb-8 pt-8 text-center text-white sm:pt-10" style={{ background: `linear-gradient(160deg,#07152E 55%,${theme.accent}55)` }}>
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border-2" style={{ borderColor: theme.accent, color: theme.accent }}>
          <Icon className="h-6 w-6" />
        </span>
        <h1 className="mt-3 text-2xl font-black sm:text-3xl">{theme.title}</h1>
        <p className="mx-auto mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-300">{theme.subtitle}</p>

        <div role="tablist" className="mx-auto mt-6 flex max-w-xl justify-center gap-2 rounded-2xl bg-white/5 p-1.5">
          {paths.map((p) => (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={p.id === path?.id}
              onClick={() => setPathId(p.id)}
              className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-black transition ${p.id === path?.id ? "text-[#07152E]" : "text-white/80 hover:bg-white/10"}`}
              style={p.id === path?.id ? { background: "#F7B548" } : undefined}
            >
              {p.title}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-6">
        {stations.length === 0 ? (
          <p className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm font-bold text-slate-500">
            المحاضرات في هذا المسار قريبًا.
          </p>
        ) : (
          <Road stations={stations} active={active} onSelect={(key) => path && setSelectedByPath((prev) => ({ ...prev, [path.id]: key }))} />
        )}
      </section>

      {path && active ? (
        <section className="mx-auto mt-4 max-w-4xl px-4">
          <div className="overflow-hidden rounded-2xl border bg-white shadow-sm" style={{ borderColor: `${theme.accent}66` }}>
            {kind === "professional" ? (
              (() => {
                const station = (path as ProfessionalPath).stations.find((s) => s.id === active);
                return station ? <ProfessionalPanel station={station} /> : null;
              })()
            ) : (
              (() => {
                const topic = (path as LecturePath).topics.find((t) => (t.id ?? "other") === active);
                if (!topic) return null;
                return (
                  <>
                    <div className="flex items-center justify-between gap-3 px-4 py-3" style={{ background: theme.soft }}>
                      <h2 className="text-base font-black text-[#07152E]">{topic.title}</h2>
                      <span className={`text-xs font-black ${theme.text}`}>{topic.lectures.length} محاضرة</span>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {topic.lectures.map((lecture) => (
                        <LectureRow key={`${active}:${lecture.id}`} lecture={lecture} kind={kind as "workshop" | "free"} />
                      ))}
                    </div>
                  </>
                );
              })()
            )}
          </div>
        </section>
      ) : null}
    </main>
  );
}
