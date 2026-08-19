import {
  notFound,
  redirect,
} from "next/navigation";

import AdminPageHeader from "@/components/admin/layout/AdminPageHeader";
import ImportedStudentAdminWorkspace from "@/components/admin/students/ImportedStudentAdminWorkspace";

import {
  getImportedStudentPreview,
} from "@/lib/actions/admin/student-import";

export const dynamic =
  "force-dynamic";

interface ImportedStudentPageProps {
  params: Promise<{
    registryId: string;
  }>;
}

export default async function ImportedStudentPage({
  params,
}: ImportedStudentPageProps) {
  const { registryId } =
    await params;

  if (!registryId?.trim()) {
    notFound();
  }

  let data;

  try {
  data =
    await getImportedStudentPreview(
      registryId,
    );
} catch (error) {
  console.error(
    "Imported student preview error:",
    error,
  );

  throw error;
}

  if (data.userId) {
    redirect(
      `/admin/students/${data.userId}`,
    );
  }

  return (
    <div>
      <AdminPageHeader
        title={data.studentName}
        description="معاينة بيانات الطالب المستوردة قبل تسجيل الحساب."
        breadcrumbs={[
          {
            label: "استيراد البيانات",
            href: "/admin/student-import",
          },
          {
            label:
              data.studentName,
          },
        ]}
      />

      <ImportedStudentAdminWorkspace
        data={data}
      />
    </div>
  );
}