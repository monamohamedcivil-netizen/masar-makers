import AdminPageHeader from "@/components/admin/layout/AdminPageHeader";
import ProjectsDashboard from "@/components/admin/projects/ProjectsDashboard";

import {
  getProjectsDashboard,
} from "@/lib/actions/admin/projects-dashboard";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const result = await getProjectsDashboard();

  if (!result.success || !result.data) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="المشاريع"
          description="إدارة مشاريع جميع الطلاب والكورسات من شاشة واحدة."
        />

        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center font-black text-red-700">
          {result.message}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="المشاريع"
        description="مراجعة واعتماد وعرض مشاريع الطلاب من شاشة واحدة."
      />

      <ProjectsDashboard
        initialData={result.data}
      />
    </div>
  );
}