"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  createLesson,
  updateLesson,
} from "@/lib/actions/admin/lessons";

interface Course {
  id: string;
  title: string;
}

interface LessonData {
  id: string;
  course_id: string;
  title: string;
  description: string;
  video_url: string;
  lesson_order: number;
  duration_minutes: number;
  is_preview: boolean;
  is_published: boolean;
}

interface LessonFormProps {
  courses: Course[];
  initialData?: LessonData;
}

export default function LessonForm({
  courses,
  initialData,
}: LessonFormProps) {
  const router = useRouter();

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const [courseId, setCourseId] = useState(
    initialData?.course_id ?? courses[0]?.id ?? "",
  );

  const [title, setTitle] = useState(
    initialData?.title ?? "",
  );

  const [description, setDescription] = useState(
    initialData?.description ?? "",
  );

  const [videoUrl, setVideoUrl] = useState(
    initialData?.video_url ?? "",
  );

  const [lessonOrder, setLessonOrder] = useState(
    initialData?.lesson_order ?? 1,
  );

  const [durationMinutes, setDurationMinutes] = useState(
    initialData?.duration_minutes ?? 30,
  );

  const [isPreview, setIsPreview] = useState(
    initialData?.is_preview ?? false,
  );

  const [isPublished, setIsPublished] = useState(
    initialData?.is_published ?? false,
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!courseId) {
      setError("يرجى اختيار الكورس.");
      return;
    }

    if (!title.trim()) {
      setError("يرجى إدخال اسم الدرس.");
      return;
    }

    if (lessonOrder < 1) {
      setError("ترتيب الدرس يجب أن يكون 1 أو أكثر.");
      return;
    }

    if (durationMinutes < 0) {
      setError("مدة الدرس لا يمكن أن تكون أقل من صفر.");
      return;
    }

    startTransition(async () => {
      const formData = {
        course_id: courseId,
        title,
        description,
        video_url: videoUrl,
        lesson_order: lessonOrder,
        duration_minutes: durationMinutes,
        is_preview: isPreview,
        is_published: isPublished,
      };

      const result = initialData
        ? await updateLesson(initialData.id, formData)
        : await createLesson(formData);

      if (!result.success) {
        setError(result.message);
        return;
      }

      router.push("/admin/learning/lessons");
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6"
    >
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label
            htmlFor="course_id"
            className="block text-sm font-medium text-slate-700"
          >
            الكورس
          </label>

          <select
            id="course_id"
            value={courseId}
            onChange={(event) =>
              setCourseId(event.target.value)
            }
            disabled={isPending}
            className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[#F7B548]"
          >
            <option value="">اختر الكورس</option>

            {courses.map((course) => (
              <option
                key={course.id}
                value={course.id}
              >
                {course.title}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="title"
            className="block text-sm font-medium text-slate-700"
          >
            اسم الدرس
          </label>

          <input
            id="title"
            type="text"
            value={title}
            onChange={(event) =>
              setTitle(event.target.value)
            }
            disabled={isPending}
            placeholder="مثال: مقدمة في تصميم الطرق"
            className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-[#F7B548]"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="description"
          className="block text-sm font-medium text-slate-700"
        >
          وصف الدرس
        </label>

        <textarea
          id="description"
          value={description}
          onChange={(event) =>
            setDescription(event.target.value)
          }
          disabled={isPending}
          rows={4}
          placeholder="اكتب وصفًا مختصرًا للدرس."
          className="w-full resize-none rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-[#F7B548]"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="video_url"
          className="block text-sm font-medium text-slate-700"
        >
          رابط الفيديو
        </label>

        <input
          id="video_url"
          type="url"
          value={videoUrl}
          onChange={(event) =>
            setVideoUrl(event.target.value)
          }
          disabled={isPending}
          placeholder="https://..."
          dir="ltr"
          className="h-11 w-full rounded-xl border border-slate-300 px-3 text-left text-sm outline-none focus:border-[#F7B548]"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label
            htmlFor="lesson_order"
            className="block text-sm font-medium text-slate-700"
          >
            ترتيب الدرس
          </label>

          <input
            id="lesson_order"
            type="number"
            min={1}
            value={lessonOrder}
            onChange={(event) =>
              setLessonOrder(
                Number(event.target.value),
              )
            }
            disabled={isPending}
            className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-[#F7B548]"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="duration_minutes"
            className="block text-sm font-medium text-slate-700"
          >
            مدة الدرس بالدقائق
          </label>

          <input
            id="duration_minutes"
            type="number"
            min={0}
            value={durationMinutes}
            onChange={(event) =>
              setDurationMinutes(
                Number(event.target.value),
              )
            }
            disabled={isPending}
            className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-[#F7B548]"
          />
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-xl bg-slate-50 p-4 md:flex-row md:items-center md:gap-8">
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={isPreview}
            onChange={(event) =>
              setIsPreview(event.target.checked)
            }
            disabled={isPending}
            className="h-4 w-4 accent-[#F7B548]"
          />

          <span className="text-sm font-medium text-slate-700">
            درس مجاني للمعاينة
          </span>
        </label>

        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(event) =>
              setIsPublished(event.target.checked)
            }
            disabled={isPending}
            className="h-4 w-4 accent-[#F7B548]"
          />

          <span className="text-sm font-medium text-slate-700">
            نشر الدرس
          </span>
        </label>
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() =>
            router.push("/admin/learning/lessons")
          }
          disabled={isPending}
          className="h-11 rounded-xl border border-slate-300 px-6 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          إلغاء
        </button>

        <button
          type="submit"
          disabled={isPending}
          className="h-11 rounded-xl bg-[#07152E] px-6 text-sm font-semibold text-white transition hover:bg-[#10264d] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending
            ? "جاري الحفظ..."
            : initialData
              ? "تحديث الدرس"
              : "حفظ الدرس"}
        </button>
      </div>
    </form>
  );
}