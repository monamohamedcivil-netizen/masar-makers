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

/*
 * الاشتراكات النشطة المدفوعة بنفس قاعدة صفحة الطلاب والتقارير:
 * - المجانية لا تُحتسب.
 * - الرحلة المتكاملة/المهنية في كورس منقسم (أساسيات + متقدم) تُحسب مرحلتين.
 */
async function countPaidSubscriptionUnits(
  exclusion: Exclusion,
): Promise<number> {
  const admin = createAdminClient();

  const [{ data: enrollments, error }, { data: lessons }] = await Promise.all([
    admin
      .from("enrollments")
      .select("user_id,course_id,journey_type,student_email")
      .eq("status", "active")
      .limit(5000),
    admin
      .from("lessons")
      .select("course_id,course_part")
      .eq("status", "published")
      .limit(10000),
  ]);

  if (error) {
    console.error("Dashboard paid subscriptions error:", error.message);
    return 0;
  }

  const parts = new Map<string, { f: boolean; a: boolean }>();
  for (const l of lessons ?? []) {
    const id = String(l.course_id ?? "");
    if (!id) continue;
    const cur = parts.get(id) ?? { f: false, a: false };
    const part = String(l.course_part ?? "").toLowerCase();
    if (part === "fundamental" || part === "fundamentals") cur.f = true;
    if (part === "advanced") cur.a = true;
    parts.set(id, cur);
  }

  const internalIds = new Set(exclusion.userIds);
  const internalEmails = new Set(
    INTERNAL_ACCOUNT_EMAILS.map((e) => e.toLowerCase()),
  );
  const grantsAll = new Set([
    "integrated",
    "professional",
    "professional_journey",
    "career_path",
    "career",
  ]);

  let total = 0;
  for (const e of enrollments ?? []) {
    const type = String(e.journey_type ?? "").trim().toLowerCase();
    if (type === "free") continue;
    if (e.user_id && internalIds.has(String(e.user_id))) continue;
    if (e.student_email && internalEmails.has(String(e.student_email).toLowerCase())) continue;

    const p = parts.get(String(e.course_id ?? ""));
    if (grantsAll.has(type) && p && (p.f || p.a)) {
      total += Number(p.f) + Number(p.a);
    } else {
      total += 1;
    }
  }
  return total;
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

    countPaidSubscriptionUnits(exclusion),

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