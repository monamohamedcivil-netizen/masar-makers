import AdminPageHeader from "@/components/admin/layout/AdminPageHeader";
import EnrollmentStatusStudentsTable from "@/components/admin/table/EnrollmentStatusStudentsTable";

import { getEnrollmentRequests } from "@/lib/actions/admin/enrollments";

export const dynamic = "force-dynamic";

const activeStatuses = new Set([
  "active",
  "approved",
  "enrolled",
  "confirmed",
]);

export default async function ActiveStudentsPage() {
  const enrollments =
    await getEnrollmentRequests();

  const activeEnrollments =
    enrollments.filter((item) =>
      activeStatuses.has(
        item.status
          .trim()
          .toLowerCase(),
      ),
    );

  return (
    <div>
      <AdminPageHeader
        title="الطلاب النشطون"
        description="إدارة اشتراكات الطلاب النشطة وإيقاف الوصول إلى رحلة محددة دون حذف بيانات الطالب أو تقدمه."
        breadcrumbs={[
          {
            label: "إدارة الطلاب",
            href: "/admin/students",
          },
          {
            label: "الطلاب النشطون",
          },
        ]}
      />

      <EnrollmentStatusStudentsTable
        enrollments={activeEnrollments}
        mode="active"
      />
    </div>
  );
}