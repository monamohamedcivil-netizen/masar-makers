import { getCourseTemplates } from "@/lib/queries/catalog/templates";

import CourseTemplatesManager from "@/components/admin/CourseTemplatesManager";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  const templates = await getCourseTemplates();

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#F7F8FA] p-6 lg:p-10"
    >
      <CourseTemplatesManager
        templates={templates}
      />
    </main>
  );
}