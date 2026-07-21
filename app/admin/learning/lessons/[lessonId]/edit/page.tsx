import { notFound } from "next/navigation";

import AdminPageHeader from "@/components/admin/layout/AdminPageHeader";
import LessonForm from "@/components/admin/lessons/LessonForm";
import {
  getCoursesForLessons,
  getLesson,
} from "@/lib/actions/admin/lessons";

export const dynamic = "force-dynamic";

interface EditLessonPageProps {
  params: Promise<{
    lessonId: string;
  }>;
}

export default async function EditLessonPage({
  params,
}: EditLessonPageProps) {
  const { lessonId } = await params;

  const [lesson, coursesResult] = await Promise.all([
    getLesson(lessonId),
    getCoursesForLessons(),
  ]);

  if (!lesson) {
    notFound();
  }

  const courses = coursesResult.map((course: any) => ({
    id: String(course.id),
    title:
      course.title ??
      course.title_ar ??
      course.name ??
      "",
  }));

  return (
    <>
      <AdminPageHeader
        title="تعديل الدرس"
        description="تعديل بيانات الدرس ورابط الفيديو وإعدادات النشر."
      />

      <LessonForm
        courses={courses}
        initialData={{
          id: String(lesson.id),
          course_id: String(lesson.course_id ?? ""),
          title: lesson.title ?? "",
          description: lesson.description ?? "",
          video_url: lesson.video_url ?? "",
          lesson_order: Number(
            lesson.lesson_order ?? 1,
          ),
          duration_minutes: Number(
            lesson.duration_minutes ?? 30,
          ),
          is_preview: Boolean(
            lesson.is_preview,
          ),
          is_published: Boolean(
            lesson.is_published,
          ),
        }}
      />
    </>
  );
}