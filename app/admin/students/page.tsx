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

/**
 * آخر تسجيل دخول لكل طالب من نظام الدخول نفسه (يُحدَّث تلقائيًا عند الدخول، بلا أي كتابة إضافية).
 * قراءة واحدة خفيفة لصفحة الإدارة فقط؛ إن فشلت تظهر الخلية فارغة دون كسر الصفحة.
 */
async function getLastSignIns(admin: ReturnType<typeof createAdminClient>) {
  const result = new Map<string, string>();
  try {
    for (let page = 1; page <= 20; page += 1) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
      if (error || !data?.users?.length) break;
      for (const user of data.users) {
        if (user.last_sign_in_at) result.set(user.id, user.last_sign_in_at);
      }
      if (data.users.length < 1000) break;
    }
  } catch {
    // تجاهل: العمود يظهر فارغًا
  }
  return result;
}

export default async function StudentsPage() {
  const students =
    await getStudentsSummary();

  // «عملة الطالب» + هل يرى أسعار الجنيه المصرية (مقيم في مصر) أم الجنيه المحسوب من الريال.
  const admin = createAdminClient();
  const ids = students.map((s) => s.userId);
  const [currencies, { data: profiles }, lastSignIns] = await Promise.all([
    getStudentCurrencies(admin, ids).catch(() => new Map()),
    ids.length
      ? admin.from("profiles").select("id,country,phone,created_at").in("id", ids)
      : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
    getLastSignIns(admin),
  ]);
  const registeredAt = new Map(
    ((profiles ?? []) as Array<Record<string, unknown>>).map((p) => [
      String(p.id),
      typeof p.created_at === "string" ? p.created_at : null,
    ]),
  );
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
    registeredAt: registeredAt.get(student.userId) ?? null,
    lastSignInAt: lastSignIns.get(student.userId) ?? null,
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