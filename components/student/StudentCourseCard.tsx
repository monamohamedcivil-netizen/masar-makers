import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, BookOpen, CheckCircle2, Clock3, Play } from "lucide-react";

import type { StudentCourseCard as CourseCardData } from "@/lib/queries/student-dashboard";

function formatLastActivity(value: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("ar-SA", {
    day: "numeric",
    month: "short",
  }).format(new Date(value));
}

export default function StudentCourseCard({
  course,
  pending = false,
}: {
  course: CourseCardData;
  pending?: boolean;
}) {
  const completed = course.status === "completed" || course.progressPercent >= 100;
  const href = course.lastLessonId
    ? `/course/${course.slug}?lesson=${course.lastLessonId}`
    : `/course/${course.slug}`;

  return (
    <article className="group overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_16px_45px_rgba(7,21,46,0.06)] transition hover:-translate-y-1 hover:shadow-[0_22px_55px_rgba(7,21,46,0.11)]">
      <div className="relative h-44 overflow-hidden bg-[#07152E]">
        {course.imageUrl ? (
          <Image
            src={course.imageUrl}
            alt={course.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top_left,#173568,#07152E_65%)]">
            <BookOpen size={50} className="text-[#F7B548]" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#07152E]/80 via-transparent to-transparent" />
        <span className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[11px] font-black text-[#07152E] backdrop-blur">
          {pending ? "بانتظار الموافقة" : completed ? "مكتمل" : "رحلة نشطة"}
        </span>
      </div>

      <div className="p-5">
        {course.journeyTitle && (
          <p className="mb-2 text-[11px] font-black text-[#C88712]">
            {course.journeyTitle}
          </p>
        )}
        <h3 className="line-clamp-2 min-h-14 text-lg font-black leading-7 text-[#07152E]">
          {course.title}
        </h3>
        {course.subtitle && (
          <p className="mt-1 line-clamp-1 text-xs font-semibold text-slate-500">
            {course.subtitle}
          </p>
        )}

        {!pending && (
          <>
            <div className="mt-5 flex items-center justify-between text-[11px] font-bold text-slate-500">
              <span>التقدم في الرحلة</span>
              <span className="text-[#07152E]">{Math.round(course.progressPercent)}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-l from-[#F7B548] to-[#D79520] transition-all"
                style={{ width: `${course.progressPercent}%` }}
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-3 text-[11px] font-bold text-slate-500">
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 size={14} />
                {course.completedLessons} من {course.totalLessons || "—"} درس
              </span>
              {formatLastActivity(course.lastActivityAt) && (
                <span className="inline-flex items-center gap-1">
                  <Clock3 size={14} />
                  آخر نشاط {formatLastActivity(course.lastActivityAt)}
                </span>
              )}
            </div>
            {course.lastLessonTitle && (
              <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-[11px] font-bold text-slate-600">
                آخر درس: {course.lastLessonTitle}
              </p>
            )}
          </>
        )}

        {pending ? (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-xs font-black text-amber-700">
            سيتم تفعيل الرحلة بعد اعتماد التسجيل
          </div>
        ) : (
          <Link
            href={href}
            className="mt-5 flex h-11 items-center justify-center gap-2 rounded-xl bg-[#07152E] px-4 text-xs font-black text-white transition hover:bg-[#102A54]"
          >
            {completed ? <CheckCircle2 size={16} /> : <Play size={16} />}
            {completed
              ? "مراجعة الرحلة"
              : course.progressPercent > 0
                ? "استكمال التعلم"
                : "ابدأ التعلم"}
            <ArrowLeft size={15} />
          </Link>
        )}
      </div>
    </article>
  );
}
