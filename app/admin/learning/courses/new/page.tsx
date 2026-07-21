import AdminPageHeader from "@/components/admin/layout/AdminPageHeader";
import CourseForm from "../../../../../components/admin/courses/CourseForm";

export default function NewCoursePage() {
  return (
    <>
      <AdminPageHeader
        title="إضافة كورس جديد"
        description="إضافة كورس جديد إلى منصة Masar Makers."
      />

      <CourseForm />
    </>
  );
}