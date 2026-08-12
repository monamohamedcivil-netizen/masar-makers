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

  const subtitle =
    kind === "free"
      ? "المحاضرات التي أتاحتها الأكاديمية للمشاهدة المجانية."
      : "محاضرات مركزة يمكنك طلب الاشتراك بها بشكل مستقل.";

  const HeaderIcon =
    kind === "free"
      ? PlayCircle
      : CalendarDays;

  return (
    <section
      dir="rtl"
      className="overflow-hidden rounded-[28px] border border-[#F7B548]/35 bg-white shadow-[0_24px_70px_rgba(7,21,46,0.12)]"
    >
      <header className="flex items-center gap-4 bg-[#07152E] px-5 py-5 text-white sm:px-7">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F7B548]/15 text-[#F7B548]">
          <HeaderIcon size={24} />
        </span>

        <div>
          <h2 className="text-xl font-black sm:text-2xl">
            {title}
          </h2>
          <p className="mt-1 text-xs font-bold text-white/65">
            {subtitle}
          </p>
        </div>
      </header>

      {loading ? (
        <div className="flex min-h-[260px] items-center justify-center text-sm font-black text-slate-500">
          جارٍ تحميل المحاضرات...
        </div>
      ) : error ? (
        <div className="flex min-h-[260px] items-center justify-center px-6 text-center text-sm font-black text-red-600">
          {error}
        </div>
      ) : lessons.length === 0 ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
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
        <div className="grid gap-4 p-4 lg:grid-cols-2 sm:p-5">
          <LessonColumn
            title={partTitle("fundamentals")}
            lessons={grouped.fundamentals}
            kind={kind}
            enrollmentStatuses={
              enrollmentStatuses
            }
          />

          <LessonColumn
            title={partTitle("advanced")}
            lessons={grouped.advanced}
            kind={kind}
            enrollmentStatuses={
              enrollmentStatuses
            }
          />

          {grouped.single.length ? (
            <div className="lg:col-span-2">
              <LessonColumn
                title="محاضرات عامة"
                lessons={grouped.single}
                kind={kind}
                enrollmentStatuses={
                  enrollmentStatuses
                }
              />
            </div>
          ) : null}
        </div>
      ) : (
        <div className="p-4 sm:p-5">
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
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      {!hideHeader ? (
        <div className="bg-[#07152E] px-4 py-3 text-sm font-black text-white">
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
                className="grid gap-4 px-4 py-4 md:grid-cols-[minmax(0,1fr)_185px] md:items-center"
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
                    className="h-12 w-full cursor-not-allowed rounded-xl bg-slate-100 px-4 text-xs font-black text-slate-400"
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