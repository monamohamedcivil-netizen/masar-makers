import AdminPageHeader from "@/components/admin/layout/AdminPageHeader";
import EnrollmentRequestsTable, {
  type EnrollmentRequestRow,
} from "@/components/admin/table/EnrollmentRequestsTable";

import { getEnrollmentRequests } from "@/lib/actions/admin/enrollments";
import {
  isFullProfessionalJourney,
  suggestListPrices,
  type ListPriceSuggestion,
} from "@/lib/finance/course-prices";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function toTableRow(
  request: Awaited<ReturnType<typeof getEnrollmentRequests>>[number],
  extra: { twoPrices: boolean; suggestion: ListPriceSuggestion | null },
): EnrollmentRequestRow {
  return {
    twoPrices: extra.twoPrices,
    suggestedListPrice: extra.suggestion?.main ?? {},
    suggestedListPriceAdvanced: extra.suggestion?.advanced ?? {},
    subscriptionPriceAdvanced: request.subscriptionPriceAdvanced,
    id: request.id,
    studentName: request.student.name,
    studentEmail: request.student.email,
    studentPhone: request.student.phone ?? "",
    courseTitle: request.course.title,
    stationTitle: request.station.title ?? "",
    journeyType: request.journeyType,
    actionKey: request.actionKey ?? "",
    actionTitle: request.actionTitle ?? "",
    enrollmentSource:
  request.enrollmentSource ?? "paid",
rewardSource:
  request.rewardSource ?? null,
status: request.status,
    createdAt: request.createdAt,
    subscriptionPrice: request.subscriptionPrice,
    subscriptionCurrency: request.subscriptionCurrency,
    offerLabel: request.offerLabel ?? "",
    paymentDraft: request.paymentDraft,
  };
}

export default async function EnrollmentRequestsPage() {
  const enrollmentRequests = await getEnrollmentRequests();
  const admin = createAdminClient();

  // كورسات بمرحلتين (المتكامل فيها يُسجَّل بسعرين) + السعر الأصلي المقترح من أسعار الكورس.
  const [{ data: courseRows }, suggestions] = await Promise.all([
    admin.from("courses").select("id,level"),
    suggestListPrices(
      admin,
      enrollmentRequests.map((r) => ({
        id: r.id,
        course_id: r.courseId,
        journey_type: r.journeyType,
        action_key: r.actionKey,
        user_id: r.userId,
      })),
    ),
  ]);
  const splitCourses = new Set(
    (courseRows ?? [])
      .filter((c) => String(c.level ?? "").toLowerCase() === "split")
      .map((c) => String(c.id)),
  );

  const requests = enrollmentRequests.map((r) =>
    toTableRow(r, {
      twoPrices:
        splitCourses.has(String(r.courseId)) &&
        r.enrollmentSource !== "reward" &&
        isFullProfessionalJourney(r.journeyType),
      suggestion: suggestions.get(r.id) ?? null,
    }),
  );

  // العروض: قائمة العروض + أي عرض كُتب سابقًا في المدفوعات أو الطلبات.
  const [{ data: offerRows }, { data: paymentOffers }, { data: requestOffers }] =
    await Promise.all([
      admin.from("finance_offers").select("name").eq("is_active", true).order("sort_order"),
      admin.from("finance_payments").select("offer_label").not("offer_label", "is", null),
      admin.from("enrollments").select("offer_label").not("offer_label", "is", null),
    ]);
  const offerNames = [
    ...new Set(
      [
        ...(offerRows ?? []).map((o) => String(o.name)),
        ...(paymentOffers ?? []).map((o) => String(o.offer_label)),
        ...(requestOffers ?? []).map((o) => String(o.offer_label)),
      ]
        .map((name) => name.trim())
        .filter((name) => name && !name.startsWith("مكافأة")),
    ),
  ];

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

      <EnrollmentRequestsTable
        requests={requests}
        offerNames={offerNames}
      />
    </div>
  );
}