"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  Eye,
  EyeOff,
  Pencil,
  PlayCircle,
  Plus,
  Trash2,
} from "lucide-react";

import {
  deleteLesson,
  toggleLessonPublished,
} from "@/lib/actions/admin/lessons";

interface Lesson {
  id: string;
  title: string;
  courseTitle: string;
  video_url: string;
  lesson_order: number;
  duration_minutes: number;
  is_preview: boolean;
  is_published: boolean;
}

interface LessonsTableProps {
  lessons: Lesson[];
}

export default function LessonsTable({
  lessons,
}: LessonsTableProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleDelete(id: string) {
    const confirmed = window.confirm(
      "هل أنت متأكد من حذف هذا الدرس؟",
    );

    if (!confirmed) {
      return;
    }

    setError("");

    startTransition(async () => {
      const result = await deleteLesson(id);

      if (!result.success) {
        setError(result.message);
      }
    });
  }

  function handlePublishToggle(
    id: string,
    currentStatus: boolean,
  ) {
    setError("");

    startTransition(async () => {
      const result = await toggleLessonPublished(
        id,
        !currentStatus,
      );

      if (!result.success) {
        setError(result.message);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Link
          href="/admin/learning/lessons/new"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#07152E] px-5 text-sm font-semibold text-white transition hover:bg-[#10264d]"
        >
          <Plus className="h-4 w-4" />
          إضافة درس
        </Link>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {lessons.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 px-6 py-12 text-center">
            <PlayCircle className="h-10 w-10 text-slate-300" />

            <div>
              <h3 className="font-semibold text-slate-800">
                لا توجد دروس
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                ابدأ بإضافة أول درس إلى أحد الكورسات.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-right text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-5 py-4 font-semibold">
                    الترتيب
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    اسم الدرس
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    الكورس
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    المدة
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    الفيديو
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    المعاينة
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    الحالة
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    الإجراءات
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {lessons.map((lesson) => (
                  <tr
                    key={lesson.id}
                    className="transition hover:bg-slate-50/70"
                  >
                    <td className="px-5 py-4 font-semibold text-slate-700">
                      {lesson.lesson_order}
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">
                        {lesson.title}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {lesson.courseTitle}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {lesson.duration_minutes > 0
                        ? `${lesson.duration_minutes} دقيقة`
                        : "—"}
                    </td>

                    <td className="px-5 py-4">
                      {lesson.video_url ? (
                        <a
                          href={lesson.video_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:underline"
                        >
                          <PlayCircle className="h-4 w-4" />
                          فتح
                        </a>
                      ) : (
                        <span className="text-slate-400">
                          غير مضاف
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={
                          lesson.is_preview
                            ? "inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700"
                            : "inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500"
                        }
                      >
                        {lesson.is_preview
                          ? "مجاني"
                          : "للمشتركين"}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={
                          lesson.is_published
                            ? "inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                            : "inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500"
                        }
                      >
                        {lesson.is_published
                          ? "منشور"
                          : "مخفي"}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            handlePublishToggle(
                              lesson.id,
                              lesson.is_published,
                            )
                          }
                          disabled={isPending}
                          title={
                            lesson.is_published
                              ? "إخفاء الدرس"
                              : "نشر الدرس"
                          }
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {lesson.is_published ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>

                        <Link
                          href={`/admin/learning/lessons/${lesson.id}/edit`}
                          title="تعديل الدرس"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>

                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(lesson.id)
                          }
                          disabled={isPending}
                          title="حذف الدرس"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}