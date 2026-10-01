import { notFound } from "next/navigation";

import StudentJourneyDashboard from "@/components/student/StudentJourneyDashboard";
import { getStudentDashboardData } from "@/lib/queries/student-dashboard";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{
    userId: string;
  }>;
};

export default async function AdminStudentDashboardPreviewPage({
  params,
}: Props) {
  const { userId } = await params;
  const normalizedUserId = userId?.trim();

  if (!normalizedUserId) {
    notFound();
  }

  let data;

  try {
    // getStudentDashboardData already verifies that a different target user
    // can only be loaded by an authenticated admin/super_admin.
    data = await getStudentDashboardData(normalizedUserId);
  } catch {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC]">
      <div className="mx-auto max-w-[1450px] px-3 pt-4 sm:px-6 lg:px-8">
        <div
          dir="rtl"
          className="rounded-2xl border border-[#F7B548]/45 bg-[#FFF8E9] px-4 py-3 text-sm font-bold text-[#07152E]"
        >
          معاينة صفحة الطالب: {data.studentName} — وضع العرض فقط
        </div>
      </div>

      <StudentJourneyDashboard
        data={data}
        previewUserId={normalizedUserId}
        readOnly
      />
    </div>
  );
}
