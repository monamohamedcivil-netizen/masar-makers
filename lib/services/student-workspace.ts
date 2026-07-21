import type { StudentDashboardData } from "@/lib/queries/student-dashboard";
import { studentWorkspaceDefinition } from "@/components/student/workspace/workspaceConfig";

export async function loadStudentWorkspace(): Promise<{
  definition: typeof studentWorkspaceDefinition;
  data: StudentDashboardData;
}> {
  const { getStudentDashboardData } = await import("@/lib/queries/student-dashboard");
  const data = await getStudentDashboardData();
  return { definition: studentWorkspaceDefinition, data };
}
