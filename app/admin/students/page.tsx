import AdminPageHeader from "@/components/admin/layout/AdminPageHeader";
import StudentsTable, {
  type StudentRow,
} from "@/components/admin/table/StudentsTable";

import { getStudentsSummary } from "@/lib/actions/admin/students";
import { isEgyptResident } from "@/lib/pricing/student-currency";
import { getStudentCurrencies } from "@/lib/pricing/student-currency-store";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function toTableRow(
  student: Awaited<
    ReturnType<typeof getStudentsSummary>
  >[number],
): StudentRow {
  return {
    userId: student.userId,

    studentName: student.studentName,
    studentEmail: student.studentEmail,
    studentPhone: student.studentPhone,
    studentCountry: student.studentCountry,
    accountActive: student.accountActive,
    suspensionReason: student.suspensionReason,

    professionalEnrollments:
      student.professionalEnrollments,

    oneDayEnrollments:
      student.oneDayEnrollments,

    freeEnrollments:
      student.freeEnrollments,

    totalEnrollments:
      student.totalEnrollments,

    approvedEnrollments:
      student.approvedEnrollments,

    pendingEnrollments:
      student.pendingEnrollments,

    completedCourses:
      student.completedCourses,

    certificatesCount:
      student.certificatesCount,

    projectsCount:
      student.projectsCount,

    surveysCount:
      student.surveysCount,

    rewardCourses:
      student.rewardCourses,

    earnedRewards:
      student.earnedRewards,

    redeemedRewards:
      student.redeemedRewards,

    availableRewards:
      student.availableRewards,

    rewardBalance:
      student.rewardBalance,

    rewardProgress:
      student.rewardProgress,

    lastRewardCourseId:
      student.lastRewardCourseId,

    lastRewardCourseTitle:
      student.lastRewardCourseTitle,

    lastRewardRedeemedAt:
      student.lastRewardRedeemedAt,

    totalPoints:
      student.totalPoints,
bonusPoints:
  student.bonusPoints,

lastBonusReason:
  student.lastBonusReason,
    drawEntries:
      student.drawEntries,

    drawWins:
      student.drawWins,

    availableDrawEntries:
      student.availableDrawEntries,
  };
}

export default async function StudentsPage() {
  const students =
    await getStudentsSummary();

  // «عملة الطالب» + هل يرى أسعار الجنيه المصرية (مقيم في مصر) أم الجنيه المحسوب من الريال.
  const admin = createAdminClient();
  const ids = students.map((s) => s.userId);
  const [currencies, { data: profiles }] = await Promise.all([
    getStudentCurrencies(admin, ids).catch(() => new Map()),
    ids.length
      ? admin.from("profiles").select("id,country,phone").in("id", ids)
      : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
  ]);
  const resident = new Map(
    ((profiles ?? []) as Array<Record<string, unknown>>).map((p) => [
      String(p.id),
      isEgyptResident(p.country, p.phone),
    ]),
  );

  const rows = students.map((student) => ({
    ...toTableRow(student),
    studentCurrency: currencies.get(student.userId)?.currency ?? null,
    studentCurrencySource: currencies.get(student.userId)?.source ?? null,
    egyptResident: resident.get(student.userId) ?? false,
  }));

  return (
    <div>
      <AdminPageHeader
        title="الطلاب"
        description="إدارة جميع الطلاب ومتابعة رحلاتهم التعليمية وإنجازاتهم."
        breadcrumbs={[
          {
            label: "إدارة الطلاب",
          },
          {
            label: "الطلاب",
          },
        ]}
      />

      <StudentsTable
        students={rows}
      />
    </div>
  );
}