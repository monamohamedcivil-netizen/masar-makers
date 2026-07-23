import AdminPageHeader from "@/components/admin/layout/AdminPageHeader";
import EnrollmentRequestsTable, {
  type EnrollmentRequestRow,
} from "@/components/admin/table/EnrollmentRequestsTable";

import { getEnrollmentRequests } from "@/lib/actions/admin/enrollments";

export const dynamic = "force-dynamic";

function toTableRow(
  request: Awaited<ReturnType<typeof getEnrollmentRequests>>[number],
): EnrollmentRequestRow {
  return {
    id: request.id,
    studentName: request.student.name,
    studentEmail: request.student.email,
    studentPhone: request.student.phone ?? "",
    courseTitle: request.course.title,
    stationTitle: request.station.title ?? "",
    journeyType: request.journeyType,
    actionKey: request.actionKey ?? "",
    actionTitle: request.actionTitle ?? "",
    status: request.status,
    createdAt: request.createdAt,
  };
}

export default async function EnrollmentRequestsPage() {
  const enrollmentRequests = await getEnrollmentRequests();
  const requests = enrollmentRequests.map(toTableRow);

  const pendingCount = requests.filter(
    (request) => request.status === "pending",
  ).length;

  const approvedCount = requests.filter(
    (request) =>
      request.status === "approved" ||
      request.status === "active",
  ).length;

  const rejectedCount = requests.filter(
    (request) => request.status === "rejected",
  ).length;

  return (
    <div>
      <AdminPageHeader
        title="طلبات الاشتراك"
        description="راجع طلبات اشتراك الطلاب واعتمد الوصول إلى الرحلات والكورسات بعد تأكيد عملية الدفع."
        breadcrumbs={[
          {
            label: "إدارة الطلاب",
            href: "/admin/students",
          },
          {
            label: "طلبات الاشتراك",
          },
        ]}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm font-bold text-amber-700">
            قيد المراجعة
          </p>

          <p className="mt-2 text-3xl font-black text-amber-800">
            {pendingCount}
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-sm font-bold text-emerald-700">
            الطلبات المقبولة
          </p>

          <p className="mt-2 text-3xl font-black text-emerald-800">
            {approvedCount}
          </p>
        </div>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="text-sm font-bold text-red-700">
            الطلبات المرفوضة
          </p>

          <p className="mt-2 text-3xl font-black text-red-800">
            {rejectedCount}
          </p>
        </div>
      </div>

      <EnrollmentRequestsTable requests={requests} />
    </div>
  );
}