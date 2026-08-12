import AdminPageHeader from "@/components/admin/layout/AdminPageHeader";
import EnrollmentStatusStudentsTable from "@/components/admin/table/EnrollmentStatusStudentsTable";

import { getEnrollmentRequests } from "@/lib/actions/admin/enrollments";

export const dynamic = "force-dynamic";

export default async function SuspendedStudentsPage() {
  const enrollments =
    await getEnrollmentRequests();

  const suspendedEnrollments =
    enrollments.filter(
      (item) =>
        item.status
          .trim()
          .toLowerCase() ===
        "suspended",
    );

  return (
    <div>
      <AdminPageHeader
        title="الطلاب الموقوفون"
        description="الاشتراكات الموقوفة حاليًا مع إمكانية إعادة تفعيل الوصول إلى الرحلة في أي وقت."
        breadcrumbs={[
          {
            label: "إدارة الطلاب",
            href: "/admin/students",
          },
          {
            label: "الطلاب الموقوفون",
          },
        ]}
      />

      <EnrollmentStatusStudentsTable
        enrollments={suspendedEnrollments}
        mode="suspended"
      />
    </div>
  );
}