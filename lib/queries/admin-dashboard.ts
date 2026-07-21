import { createClient } from "@/lib/supabase/server";

export interface AdminDashboardStats {
  students: number;
  courses: number;
  journeys: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  suspendedRequests: number;
}

async function countRows(
  table: string,
  filters: Array<[string, string]> = [],
): Promise<number> {
  const supabase = await createClient();
  let query = supabase.from(table).select("id", {
    count: "exact",
    head: true,
  });

  for (const [column, value] of filters) {
    query = query.eq(column, value);
  }

  const { count, error } = await query;

  if (error) {
    console.error(`Dashboard count error (${table}):`, error.message);
    return 0;
  }

  return count ?? 0;
}

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const [
    students,
    courses,
    journeys,
    pendingRequests,
    approvedRequests,
    rejectedRequests,
    suspendedRequests,
  ] = await Promise.all([
    countRows("profiles", [["role", "student"]]),
    countRows("courses"),
    countRows("journeys"),
    countRows("enrollment_requests", [["status", "pending"]]),
    countRows("enrollment_requests", [["status", "approved"]]),
    countRows("enrollment_requests", [["status", "rejected"]]),
    countRows("enrollment_requests", [["status", "suspended"]]),
  ]);

  return {
    students,
    courses,
    journeys,
    pendingRequests,
    approvedRequests,
    rejectedRequests,
    suspendedRequests,
  };
}
