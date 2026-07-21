import AdminPageHeader from "@/components/admin/layout/AdminPageHeader";
import LessonForm from "@/components/admin/lessons/LessonForm";
import { getCoursesForLessons } from "@/lib/actions/admin/lessons";

export const dynamic = "force-dynamic";

export default async function NewLessonPage() {
  const coursesResult = await getCoursesForLessons();

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
        title="إضافة درس جديد"
        description="إضافة درس جديد وربطه بأحد الكورسات."
      />

      <LessonForm courses={courses} />
    </>
  );
}