"use client";

import { ChevronDown, Clock3, Rocket, PlayCircle } from "lucide-react";
import { useMemo, useState } from "react";

import CourseActionButton from "@/components/course/CourseActionButton";
import type { EnrollmentStatus } from "@/lib/actions/enroll";
import type { LectureKind, LecturePath } from "@/lib/journeys/topic-lectures";

const COPY = {
  workshop: {
    title: "رحلات اليوم الواحد",
    subtitle: "محاضرة واحدة مركّزة في موضوع محدد، مرتبة حسب خطوات تصميم المشروع. اختار الخطوة اللي محتاجها وابدأ.",
    action: "اشترك الآن",
    icon: Rocket,
  },
  free: {
    title: "الرحلات المجانية",
    subtitle: "ابدأ مجانًا واتعرف على أسلوب التعلم في صناع المسار. المحاضرات مرتبة حسب خطوات تصميم المشروع.",
    action: "شاهد الآن",
    icon: PlayCircle,
  },
} as const;

function duration(seconds: number) {
  const total = Math.floor(seconds || 0);
  if (!total) return null;
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  if (h && m) return `${h} س ${m} د`;
  if (h) return `${h} س`;
  return `${m || 1} د`;
}

export default function TopicLecturesView({ kind, paths }: { kind: LectureKind; paths: LecturePath[] }) {
  const copy = COPY[kind];
  const Icon = copy.icon;
  const tabs = useMemo(() => paths.filter((p) => p.slug === "road-design" || p.slug === "traffic-engineering" || p.topics.length), [paths]);
  const [active, setActive] = useState(tabs[0]?.id ?? "");
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const path = tabs.find((p) => p.id === active) ?? tabs[0];

  return (
    <main dir="rtl" className="min-h-screen bg-[#F7F8FA] pb-16">
      <section className="bg-[#07152E] px-4 pb-8 pt-8 text-center text-white sm:pt-10">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#F7B548] text-[#F7B548]">
          <Icon className="h-6 w-6" />
        </span>
        <h1 className="mt-3 text-2xl font-black sm:text-3xl">{copy.title}</h1>
        <p className="mx-auto mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-300">{copy.subtitle}</p>

        <div role="tablist" className="mx-auto mt-6 flex max-w-xl justify-center gap-2 rounded-2xl bg-white/5 p-1.5">
          {tabs.map((p) => (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={p.id === path?.id}
              onClick={() => setActive(p.id)}
              className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-black transition ${
                p.id === path?.id ? "bg-[#F7B548] text-[#07152E]" : "text-white/80 hover:bg-white/10"
              }`}
            >
              {p.title}
            </button>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-6 max-w-4xl px-4">
        {!path || path.topics.length === 0 ? (
          <p className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm font-bold text-slate-500">
            المحاضرات في هذا المسار قريبًا.
          </p>
        ) : (
          <ol className="space-y-3">
            {path.topics.map((topic, index) => {
              const key = `${path.id}:${topic.id ?? "other"}`;
              const isOpen = Boolean(open[key]);
              return (
                <li key={key} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpen((prev) => ({ ...prev, [key]: !prev[key] }))}
                    className="flex w-full items-center gap-3 px-4 py-4 text-right hover:bg-slate-50"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#07152E] text-sm font-black text-[#F7B548]">
                      {topic.id ? index + 1 : "•"}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-black text-[#07152E] sm:text-base">{topic.title}</span>
                      <span className="mt-0.5 block text-xs font-bold text-slate-400">{topic.lectures.length} محاضرة</span>
                    </span>
                    <ChevronDown className={`h-5 w-5 shrink-0 text-[#C88712] transition ${isOpen ? "rotate-180" : ""}`} />
                  </button>

                  {isOpen ? (
                    <div className="divide-y divide-slate-100 border-t border-slate-100">
                      {topic.lectures.map((lecture) => {
                        const time = duration(lecture.durationSeconds);
                        return (
                          <article
                            key={`${key}:${lecture.id}`}
                            className="grid gap-3 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_160px] sm:items-center"
                          >
                            <div className="min-w-0">
                              <h3 className="text-sm font-black leading-6 text-[#07152E]" dir="auto">
                                {lecture.title}
                              </h3>
                              <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] font-black">
                                <span className="rounded-full bg-[#07152E]/5 px-2 py-0.5 text-[#07152E]">{lecture.courseCode || lecture.courseTitle}</span>
                                {time ? (
                                  <span className="inline-flex items-center gap-1 text-[#B87508]">
                                    <Clock3 size={12} /> {time}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                            <CourseActionButton
                              courseId={lecture.courseId}
                              label={copy.action}
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
                      })}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </main>
  );
}
