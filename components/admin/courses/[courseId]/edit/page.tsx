import { notFound } from "next/navigation";

import AdminPageHeader from "@/components/admin/layout/AdminPageHeader";
import CourseForm from "@/components/admin/courses/CourseForm";

import { getAdminCourse } from "@/lib/actions/admin/courses";

export const dynamic = "force-dynamic";

interface EditCoursePageProps {
  params: Promise<{
    courseId: string;
  }>;
}

export default async function EditCoursePage({
  params,
}: EditCoursePageProps) {
  const { courseId } = await params;

  const course = await getAdminCourse(courseId);

  if (!course) {
    notFound();
  }

  return (
    <>
      <AdminPageHeader
        title="تعديل الكورس"
        description="تعديل بيانات الكورس وإعدادات النشر."
      />

      <CourseForm
        initialData={{
          id: String(course.id),
          title:
            course.title_ar ??
            course.title ??
            course.name ??
            "",
          slug: course.slug ?? "",
          description: course.description ?? "",
          image_url: course.image_url ?? "",
          icon_url: course.icon_url ?? "",
          duration_hours: Number(
            course.duration_hours ?? 0,
          ),
          price: Number(course.price ?? 0),
          journey_type:
            course.journey_type ?? "career_path",
          status: course.status ?? "draft",
          whatsapp_number:
            course.whatsapp_number ?? "",
        }}
      />
    </>
  );
}