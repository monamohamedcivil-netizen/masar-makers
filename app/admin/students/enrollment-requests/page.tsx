import AdminPageHeader from "@/components/admin/layout/AdminPageHeader";
import EnrollmentRequestsTable, {
  type EnrollmentRequestRow,
} from "@/components/admin/table/EnrollmentRequestsTable";

import { getEnrollmentRequests } from "@/lib/actions/admin/enrollments";

export const dynamic = "force-dynamic";

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord {
  if (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  ) {
    return value as UnknownRecord;
  }

  return {};
}

function asString(
  value: unknown,
  fallback = "",
): string {
  return typeof value === "string" ? value : fallback;
}

function extractRequests(result: unknown): unknown[] {
  if (Array.isArray(result)) {
    return result;
  }

  const record = asRecord(result);

  if (Array.isArray(record.data)) {
    return record.data;
  }

  if (Array.isArray(record.enrollments)) {
    return record.enrollments;
  }

  return [];
}

function normalizeRequest(
  value: unknown,
): EnrollmentRequestRow {
  const request = asRecord(value);

  const profile = asRecord(
    request.profile ??
      request.profiles ??
      request.student,
  );

  const course = asRecord(
    request.course ?? request.courses,
  );

  const station = asRecord(
    request.station ?? request.stations,
  );

  return {
    id: asString(request.id),

    studentName:
      asString(request.studentName) ||
      asString(request.student_name) ||
      asString(request.full_name) ||
      asString(profile.full_name) ||
      asString(profile.name) ||
      "طالب بدون اسم",

    studentEmail:
      asString(request.studentEmail) ||
      asString(request.student_email) ||
      asString(request.email) ||
      asString(profile.email),

    studentPhone:
      asString(request.studentPhone) ||
      asString(request.student_phone) ||
      asString(request.phone) ||
      asString(profile.phone) ||
      asString(profile.whatsapp_number),

    courseTitle:
      asString(request.courseTitle) ||
      asString(request.course_title) ||
      asString(course.title_ar) ||
      asString(course.title) ||
      asString(course.name),

    stationTitle:
      asString(request.stationTitle) ||
      asString(request.station_title) ||
      asString(station.title_ar) ||
      asString(station.title) ||
      asString(station.name),

    journeyType:
      asString(request.journeyType) ||
      asString(request.journey_type) ||
      asString(request.type) ||
      "career_path",

    status: asString(request.status, "pending"),

    createdAt:
      asString(request.createdAt) ||
      asString(request.created_at),
  };
}

export default async function EnrollmentRequestsPage() {
  const result = await getEnrollmentRequests();

  const requests = extractRequests(result)
    .map(normalizeRequest)
    .filter((request) => request.id);

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