"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BookOpenCheck,
  CalendarDays,
  Clock3,
  PlayCircle,
} from "lucide-react";

import CourseActionButton from "./CourseActionButton";

import type {
  EnrollmentStatusMap,
} from "@/lib/actions/enroll";

export type CourseJourneyLesson = {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  coursePart:
    | "single"
    | "fundamentals"
    | "advanced";
  sortOrder: number;
  durationSeconds: number;
  videoStatus: string | null;
};

type Props = {
  stationId: string;
  kind: "free" | "workshop";
  enrollmentStatuses?: EnrollmentStatusMap;
};

type ApiResponse =
  | {
      success: true;
      lessons: CourseJourneyLesson[];
    }
  | {
      success: false;
      message: string;
    };

function formatDuration(seconds: number) {
  const total = Math.max(
    0,
    Math.floor(Number(seconds || 0)),
  );

  if (!total) return "المدة تُقرأ من الفيديو";

  const hours = Math.floor(total / 3600);
  const minutes = Math.floor(
    (total % 3600) / 60,
  );

  if (hours && minutes) {
    return `${hours} س ${minutes} د`;
  }

  if (hours) return `${hours} س`;
  return `${minutes || 1} د`;
}

function partTitle(
  part:
    | "single"
    | "fundamentals"
    | "advanced",
) {
  if (part === "fundamentals") {
    return "Fundamentals — الأساسيات";
  }

  if (part === "advanced") {
    return "Advanced — المتقدم";
  }

  return "محاضرات الكورس";
}

function lessonActionKey(
  kind: "free" | "workshop",
  lessonId: string,
) {
  return `${kind}:lesson:${lessonId}`;
}

export default function CourseJourneyLessonsPanel({
  stationId,
  kind,
  enrollmentStatuses,
}: Props) {
  const [lessons, setLessons] = useState<
    CourseJourneyLesson[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [mobilePart, setMobilePart] =
    useState<"fundamentals" | "advanced">(
      "fundamentals",
    );

  useEffect(() => {
    let cancelled = false;

    async function loadLessons() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `/api/course/stations/${encodeURIComponent(
            stationId,
          )}/journey-lessons?kind=${kind}`,
          {
            cache: "no-store",
          },
        );

        const result =
          (await response.json()) as ApiResponse;

        if (cancelled) return;

        if (
          !response.ok ||
          !result.success
        ) {
          setLessons([]);
          setError(
            result.success
              ? "تعذر تحميل المحاضرات."
              : result.message,
          );
          return;
        }

        setLessons(result.lessons);
      } catch (loadError) {
        if (cancelled) return;

        setLessons([]);
        setError(
          loadError instanceof Error
            ? loadError.message
            : "تعذر تحميل المحاضرات.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadLessons();

    return () => {
      cancelled = true;
    };
  }, [stationId, kind]);

  useEffect(() => {
    setMobilePart("fundamentals");
  }, [stationId, kind]);

  const grouped = useMemo(
    () => ({
      single: lessons.filter(
        (lesson) =>
          lesson.coursePart === "single",
      ),
      fundamentals: lessons.filter(
        (lesson) =>
          lesson.coursePart ===
          "fundamentals",
      ),
      advanced: lessons.filter(
        (lesson) =>
          lesson.coursePart === "advanced",
      ),
    }),
    [lessons],
  );

  const isSplit =
    grouped.fundamentals.length > 0 ||
    grouped.advanced.length > 0;

  const title =
    kind === "free"
      ? "الرحلات المجانية"
      : "رحلات اليوم الواحد";

  const HeaderIcon =
    kind === "free"
      ? PlayCircle
      : CalendarDays;

  return (
    <section
      dir="rtl"
      className="min-h-[400px] overflow-hidden rounded-b-[24px] rounded-t-none border border-[#C9D2DE] bg-white shadow-[0_22px_55px_rgba(7,21,46,0.16),0_4px_12px_rgba(7,21,46,0.08)] lg:rounded-[24px]"
    >
      <header className="flex min-h-[64px] items-center gap-2.5 border-b-[3px] border-[#F7B548] bg-[#07152E] px-5 py-2.5 text-white sm:px-6">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F7B548] text-[#07152E]">
          <HeaderIcon size={16} />
        </span>

        <div>
          <h2 className="text-[18px] font-black leading-5 text-white sm:text-[20px]">
            {title}
          </h2>
        </div>
      </header>

      {loading ? (
        <div className="flex min-h-[333px] items-center justify-center text-sm font-black text-slate-500">
          جارٍ تحميل المحاضرات...
        </div>
      ) : error ? (
        <div className="flex min-h-[333px] items-center justify-center px-6 text-center text-sm font-black text-red-600">
          {error}
        </div>
      ) : lessons.length === 0 ? (
        <div className="flex min-h-[333px] flex-col items-center justify-center px-6 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FFF4DF] text-[#C88712]">
            <BookOpenCheck size={28} />
          </span>

          <p className="mt-4 text-lg font-black text-[#07152E]">
            لا توجد محاضرات في هذه الرحلة بعد
          </p>

          <p className="mt-2 text-xs font-bold text-slate-500">
            ستظهر المحاضرات هنا تلقائيًا بمجرد ربطها بهذا النوع من الرحلات من لوحة التحكم.
          </p>
        </div>
      ) : isSplit ? (
        <>
          <div
            className="grid grid-cols-2 border-b border-[#DCE2EA] bg-[#EEF1F5] lg:hidden"
            role="tablist"
            aria-label="أقسام الرحلة"
          >
            <button
              type="button"
              role="tab"
              aria-selected={
                mobilePart ===
                "fundamentals"
              }
              onClick={() =>
                setMobilePart(
                  "fundamentals",
                )
              }
              className={`relative min-h-[46px] px-3 text-[11px] font-black transition ${
                mobilePart ===
                "fundamentals"
                  ? "bg-[#173A61] text-white"
                  : "bg-[#EEF1F5] text-[#4B5563]"
              }`}
            >
              {partTitle(
                "fundamentals",
              )}

              {mobilePart ===
              "fundamentals" ? (
                <span className="absolute inset-x-4 bottom-0 h-[3px] bg-[#F7B548]" />
              ) : null}
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={
                mobilePart === "advanced"
              }
              onClick={() =>
                setMobilePart(
                  "advanced",
                )
              }
              className={`relative min-h-[46px] px-3 text-[11px] font-black transition ${
                mobilePart ===
                "advanced"
                  ? "bg-[#102D50] text-white"
                  : "bg-[#EEF1F5] text-[#4B5563]"
              }`}
            >
              {partTitle("advanced")}

              {mobilePart ===
              "advanced" ? (
                <span className="absolute inset-x-4 bottom-0 h-[3px] bg-[#F7B548]" />
              ) : null}
            </button>
          </div>

          <div className="min-h-[333px] bg-white lg:hidden">
            <LessonColumn
              title={
                mobilePart ===
                "fundamentals"
                  ? partTitle(
                      "fundamentals",
                    )
                  : partTitle(
                      "advanced",
                    )
              }
              lessons={
                mobilePart ===
                "fundamentals"
                  ? grouped.fundamentals
                  : grouped.advanced
              }
              kind={kind}
              enrollmentStatuses={
                enrollmentStatuses
              }
              hideHeader
            />
          </div>

          <div className="hidden min-h-[333px] gap-px bg-[#DCE2EA] lg:grid lg:grid-cols-2">
            <LessonColumn
              title={partTitle(
                "fundamentals",
              )}
              lessons={
                grouped.fundamentals
              }
              kind={kind}
              enrollmentStatuses={
                enrollmentStatuses
              }
            />

            <LessonColumn
              title={partTitle(
                "advanced",
              )}
              lessons={
                grouped.advanced
              }
              kind={kind}
              enrollmentStatuses={
                enrollmentStatuses
              }
            />

            {grouped.single.length ? (
              <div className="lg:col-span-2">
                <LessonColumn
                  title="محاضرات عامة"
                  lessons={
                    grouped.single
                  }
                  kind={kind}
                  enrollmentStatuses={
                    enrollmentStatuses
                  }
                />
              </div>
            ) : null}
          </div>
        </>
      ) : (
        <div className="min-h-[333px] bg-white p-3">
          <LessonColumn
            title={partTitle("single")}
            lessons={grouped.single}
            kind={kind}
            enrollmentStatuses={
              enrollmentStatuses
            }
            hideHeader
          />
        </div>
      )}
    </section>
  );
}

function LessonColumn({
  title,
  lessons,
  kind,
  enrollmentStatuses,
  hideHeader = false,
}: {
  title: string;
  lessons: CourseJourneyLesson[];
  kind: "free" | "workshop";
  enrollmentStatuses?: EnrollmentStatusMap;
  hideHeader?: boolean;
}) {
  return (
    <section className="min-h-full overflow-hidden bg-white">
      {!hideHeader ? (
        <div className="flex min-h-[50px] items-center bg-[#102D50] px-4 py-2 text-[13px] font-black text-white">
          {title}
        </div>
      ) : null}

      {lessons.length ? (
        <div className="divide-y divide-slate-100">
          {lessons.map((lesson) => {
            const actionKey =
              lessonActionKey(
                kind,
                lesson.id,
              );

            const ready = true;

            const redirectTo =
              kind === "free"
                ? `/dashboard?panel=free&lesson=${encodeURIComponent(
                    lesson.id,
                  )}`
                : `/dashboard?panel=one-day&lesson=${encodeURIComponent(
                    lesson.id,
                  )}`;

            return (
              <article
                key={`${kind}:${lesson.id}`}
                className="grid gap-3 px-4 py-3 md:grid-cols-[minmax(0,1fr)_150px] md:items-center"
              >
                <div className="min-w-0">
                  <h3 className="text-sm font-black text-[#07152E]">
                    {lesson.title}
                  </h3>

                  {lesson.description ? (
                    <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-slate-500">
                      {lesson.description}
                    </p>
                  ) : null}

                  <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] font-black text-[#B87508]">
                    <span className="inline-flex items-center gap-1">
                      <Clock3 size={12} />
                      {formatDuration(
                        lesson.durationSeconds,
                      )}
                    </span>

                    {!ready ? (
                      <span className="rounded-full bg-amber-50 px-2 py-1 text-amber-700">
                        الفيديو قيد التجهيز
                      </span>
                    ) : null}
                  </div>
                </div>

                {ready ? (
                  <CourseActionButton
                    courseId={lesson.courseId}
                    label={
                      kind === "free"
                        ? "شاهد الآن"
                        : "اشترك الآن"
                    }
                    mode={
                      kind === "free"
                        ? "free"
                        : "enrollment"
                    }
                    stationId={undefined}
                    journeyType={
                      kind === "free"
                        ? "free"
                        : "workshop"
                    }
                    actionKey={actionKey}
                    actionTitle={lesson.title}
                    itemTitle={lesson.title}
                    enrollmentStatus={
                      enrollmentStatuses?.[
                        actionKey
                      ] ?? null
                    }
                    redirectTo={redirectTo}
                  />
                ) : (
                  <button
                    type="button"
                    disabled
                    className="h-9 w-full cursor-not-allowed rounded-full bg-slate-100 px-4 text-[10px] font-black text-slate-400"
                  >
                    قيد التجهيز
                  </button>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="px-4 py-10 text-center text-xs font-bold text-slate-400">
          لا توجد محاضرات في هذا القسم.
        </div>
      )}
    </section>
  );
}