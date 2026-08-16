import { notFound } from "next/navigation";

import AdminPageHeader from "@/components/admin/layout/AdminPageHeader";
import StudentAdminWorkspace from "@/components/admin/students/StudentAdminWorkspace";

import {
  getStudentDashboardData,
} from "@/lib/queries/student-dashboard";

export const dynamic = "force-dynamic";

interface AdminStudentPageProps {
  params: Promise<{
    userId: string;
  }>;
}

export default async function AdminStudentPage({
  params,
}: AdminStudentPageProps) {
  const { userId } = await params;

  if (!userId?.trim()) {
    notFound();
  }

  let data;

  try {
    data =
      await getStudentDashboardData(userId);
  } catch {
    notFound();
  }

  return (
    <div>
      <AdminPageHeader
        title={data.studentName}
        description="متابعة بيانات الطالب ورحلاته وإنجازاته ونظام النقاط والمكافآت."
        breadcrumbs={[
  {
    label: "الطلاب",
    href: "/admin/students",
  },
  
  {
    label: data.studentName,
  },
]}
      />

      <StudentAdminWorkspace
  data={data}
  userId={userId}
/>
    </div>
  );
}