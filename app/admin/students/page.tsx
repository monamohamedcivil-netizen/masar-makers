import AdminPageHeader from "@/components/admin/layout/AdminPageHeader";
import StudentsTable, {
  type StudentRow,
} from "@/components/admin/table/StudentsTable";

import { getStudentsSummary } from "@/lib/actions/admin/students";

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

  const rows =
    students.map(toTableRow);

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