import {
  createAdminClient,
  createClient,
} from "@/lib/supabase/server";

import {
  INTERNAL_ACCOUNT_EMAILS,
  getInternalAccountUserIds,
} from "@/lib/admin/internal-accounts";
import {
  getCertificatesDashboard,
} from "@/lib/actions/admin/certificates-dashboard";
import {
  getProjectsDashboard,
} from "@/lib/actions/admin/projects-dashboard";
import {
  getSurveysDashboard,
} from "@/lib/actions/admin/surveys-dashboard";

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

/*
 * الحسابات الداخلية (الفريق) لا تدخل في أرقام الإحصائيات.
 * - enrollments: نستبعد حسب user_id أو البريد المسجّل في الاشتراك.
 * - student_registry: نستبعد حسب البريد (normalized_email).
 */
type Exclusion = {
  userIds: string[];
};

async function countRows(
  table: string,
  filters: Array<[string, string]> = [],
  exclusion?: Exclusion,
  options: { paidOnly?: boolean } = {},
): Promise<number> {
  const admin = createAdminClient();

  let query = admin
    .from(table)
    .select("id", {
      count: "exact",
      head: true,
    });

  for (const [column, value] of filters) {
    query = query.eq(column, value);
  }

  // الاشتراكات المجانية (journey_type = free) لا تُحتسب ضمن الاشتراكات.
  if (table === "enrollments" && options.paidOnly) {
    query = query.or("journey_type.is.null,journey_type.neq.free");
  }

  if (exclusion) {
    const emails = INTERNAL_ACCOUNT_EMAILS.map(
      (email) => `"${email}"`,
    ).join(",");

    if (table === "enrollments") {
      if (exclusion.userIds.length > 0) {
        // user_id قد يكون فارغًا في الاشتراكات المستوردة، فنُبقي تلك الصفوف.
        query = query.or(
          `user_id.is.null,user_id.not.in.(${exclusion.userIds.join(",")})`,
        );
      }

      query = query.or(
        `student_email.is.null,student_email.not.in.(${emails})`,
      );
    }

    if (table === "student_registry") {
      query = query.not(
        "normalized_email",
        "in",
        `(${emails})`,
      );
    }
  }

  const { count, error } = await query;

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

  const internalUserIds =
    await getInternalAccountUserIds();
  const exclusion: Exclusion = {
    userIds: internalUserIds,
  };

  const [
    students,
    courses,

    /*
     * الاشتراكات تُقرأ مباشرة من enrollments.
     * هذا يشمل:
     * - الطلاب المستوردين admin_import
     * - الطلاب الذين اشتركوا من المنصة platform
     *
     * ولا يشترط وجود "طلب اشتراك" سابق.
     */
    activeEnrollments,

    /*
     * طلبات الاشتراك هي فقط السجلات المعلقة.
     */
    pendingRequests,

    rejectedRequests,
    suspendedRequests,

    certificatesResult,
    projectsResult,
    surveysResult,
  ] = await Promise.all([
    countRows("student_registry", [], exclusion),
    countRows("courses"),

    countRows(
      "enrollments",
      [["status", "active"]],
      exclusion,
      { paidOnly: true },
    ),

    countRows(
      "enrollments",
      [["status", "pending"]],
      exclusion,
    ),

    countRows(
      "enrollments",
      [["status", "rejected"]],
      exclusion,
    ),

    countRows(
      "enrollments",
      [["status", "suspended"]],
      exclusion,
    ),

    getCertificatesDashboard(),
    getProjectsDashboard(),
    getSurveysDashboard(),
  ]);

  /*
   * في النظام الحالي قبول الطلب يحوله إلى active،
   * لذلك عدد المقبولة/النشطة هو نفس عدد الاشتراكات الفعلية النشطة.
   */
  const approvedRequests =
    activeEnrollments;

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