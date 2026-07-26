import { notFound } from "next/navigation";

import AdminPageHeader from "@/components/admin/layout/AdminPageHeader";
import CourseManagementTabs from "@/components/admin/courses/CourseManagementTabs";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface CourseManagementPageProps {
  params: Promise<{
    courseId: string;
  }>;
}

export default async function CourseManagementPage({
  params,
}: CourseManagementPageProps) {
  const { courseId } = await params;
  const supabase = await createClient();

  const { data: course, error } = await supabase
    .from("courses")
    .select("*")
    .eq("id", courseId)
    .maybeSingle();

  if (error) {
    throw new Error(`تعذر تحميل بيانات الكورس: ${error.message}`);
  }

  if (!course) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={`إدارة الكورس: ${course.title}`}
        description="إدارة بيانات الكورس والمحتوى والأسعار والشهادات والطلاب والإحصائيات من مكان واحد."
      />

      <CourseManagementTabs course={course} />
    </div>
  );
}