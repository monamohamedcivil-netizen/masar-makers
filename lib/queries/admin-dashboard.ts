import {
  createAdminClient,
  createClient,
} from "@/lib/supabase/server";

import {
  getCertificatesDashboard,
} from "@/lib/actions/admin/certificates-dashboard";
import {
  getProjectsDashboard,
} from "@/lib/actions/admin/projects-dashboard";
import {
  getSurveysDashboard,
} from "@/lib/actions/admin/surveys-dashboard";
import {
  getEnrollmentRequests,
} from "@/lib/actions/admin/enrollments";

export interface AdminDashboardStats {
  students: number;
  courses: number;
  activeEnrollments: number;

  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  suspendedRequests: number;

  pendingCertificates: number;
  pendingProjects: number;
  surveysReceived: number;
}

async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("UNAUTHORIZED");
  }

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (
    profileError ||
    !profile ||
    !["admin", "super_admin"].includes(
      String(profile.role),
    )
  ) {
    throw new Error("FORBIDDEN");
  }
}

async function countRows(
  table: string,
): Promise<number> {
  const admin = createAdminClient();

  const { count, error } = await admin
    .from(table)
    .select("id", {
      count: "exact",
      head: true,
    });

  if (error) {
    console.error(
      `Dashboard count error (${table}):`,
      error.message,
    );
    return 0;
  }

  return count ?? 0;
}

export async function getAdminDashboardStats():
Promise<AdminDashboardStats> {
  await requireAdmin();

  const [
    students,
    courses,
    enrollments,
    certificatesResult,
    projectsResult,
    surveysResult,
  ] = await Promise.all([
    /*
     * student_registry هو سجل الهوية الموحد:
     * يشمل المسجلين والمستوردين بدون تكرار البريد.
     */
    countRows("student_registry"),
    countRows("courses"),
    getEnrollmentRequests(),
    getCertificatesDashboard(),
    getProjectsDashboard(),
    getSurveysDashboard(),
  ]);

  const normalizedStatus = (
    value: string,
  ) => value.trim().toLowerCase();

  const pendingRequests =
    enrollments.filter(
      (item) =>
        normalizedStatus(item.status) ===
        "pending",
    ).length;

  const approvedRequests =
    enrollments.filter((item) =>
      [
        "active",
        "approved",
        "enrolled",
        "confirmed",
      ].includes(
        normalizedStatus(item.status),
      ),
    ).length;

  const rejectedRequests =
    enrollments.filter(
      (item) =>
        normalizedStatus(item.status) ===
        "rejected",
    ).length;

  const suspendedRequests =
    enrollments.filter(
      (item) =>
        normalizedStatus(item.status) ===
        "suspended",
    ).length;

  const activeEnrollments =
    approvedRequests;

  const pendingCertificates =
    certificatesResult.success &&
    certificatesResult.data
      ? certificatesResult.data.statistics
          .pending
      : 0;

  const pendingProjects =
    projectsResult.success &&
    projectsResult.data
      ? projectsResult.data.statistics
          .pending
      : 0;

  const surveysReceived =
    surveysResult.success &&
    surveysResult.data
      ? surveysResult.data.statistics.total
      : 0;

  return {
    students,
    courses,
    activeEnrollments,

    pendingRequests,
    approvedRequests,
    rejectedRequests,
    suspendedRequests,

    pendingCertificates,
    pendingProjects,
    surveysReceived,
  };
}