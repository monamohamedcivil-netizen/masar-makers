"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { EnrollmentStatus } from "@/lib/actions/enroll";

export interface AdminEnrollmentRequest {
  id: string;
  userId: string;
  courseId: string;
  stationId: string | null;
  journeyType: string;
  status: EnrollmentStatus;
  createdAt: string;
  updatedAt: string | null;

  student: {
    name: string;
    email: string;
    phone: string | null;
  };

  course: {
    title: string;
    slug: string | null;
  };

  station: {
    title: string | null;
  };
}

export interface AdminActionResult {
  success: boolean;
  message?: string;
}

/**
 * يتحقق من أن المستخدم الحالي أدمن.
 *
 * يعتمد على وجود:
 * app_metadata.role = "admin"
 * أو:
 * user_metadata.role = "admin"
 *
 * إذا كنتِ تستخدمين نظام صلاحيات مختلفًا، سنعدّل هذه الدالة فقط لاحقًا.
 */
async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || profile?.role !== "admin") {
    throw new Error("FORBIDDEN");
  }

  return {
    supabase,
    user,
  };
}

function getStudentName(profile: Record<string, unknown> | undefined) {
  if (!profile) return "طالب غير معروف";

  return String(
    profile.full_name ??
      profile.name ??
      profile.display_name ??
      profile.username ??
      "طالب غير معروف",
  );
}

function getStudentEmail(profile: Record<string, unknown> | undefined) {
  if (!profile) return "غير متوفر";

  return String(profile.email ?? profile.user_email ?? "غير متوفر");
}

function getStudentPhone(profile: Record<string, unknown> | undefined) {
  if (!profile) return null;

  const phone =
    profile.phone ??
    profile.phone_number ??
    profile.whatsapp ??
    profile.whatsapp_number;

  return phone ? String(phone) : null;
}

function getCourseTitle(course: Record<string, unknown> | undefined) {
  if (!course) return "كورس غير معروف";

  return String(
    course.title ??
      course.name ??
      course.course_title ??
      "كورس غير معروف",
  );
}

function getCourseSlug(course: Record<string, unknown> | undefined) {
  if (!course?.slug) return null;
  return String(course.slug);
}

function getStationTitle(station: Record<string, unknown> | undefined) {
  if (!station) return null;

  const title = station.title ?? station.name ?? station.station_title;
  return title ? String(title) : null;
}

/**
 * جلب جميع طلبات الاشتراك للوحة التحكم.
 *
 * يتم جلب البيانات على مراحل حتى لا نعتمد على أسماء العلاقات
 * التلقائية في Supabase.
 */
export async function getEnrollmentRequests(): Promise<
  AdminEnrollmentRequest[]
> {
  const { supabase } = await requireAdmin();

  const { data: enrollments, error: enrollmentsError } = await supabase
    .from("enrollments")
    .select(
      "id,user_id,course_id,station_id,journey_type,status,created_at,updated_at",
    )
    .order("created_at", { ascending: false });

  if (enrollmentsError) {
    throw new Error(enrollmentsError.message);
  }

  if (!enrollments?.length) {
    return [];
  }

  const userIds = Array.from(
    new Set(enrollments.map((item) => item.user_id).filter(Boolean)),
  );

  const courseIds = Array.from(
    new Set(enrollments.map((item) => item.course_id).filter(Boolean)),
  );

  const stationIds = Array.from(
    new Set(enrollments.map((item) => item.station_id).filter(Boolean)),
  ) as string[];

  const [
    { data: profiles },
    { data: courses },
    { data: stations },
  ] = await Promise.all([
    userIds.length
      ? supabase.from("profiles").select("*").in("id", userIds)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),

    courseIds.length
      ? supabase.from("courses").select("*").in("id", courseIds)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),

    stationIds.length
      ? supabase
  .from("course_stations")
  .select("*")
  .in("id", stationIds)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
  ]);

  const profilesMap = new Map(
    (profiles ?? []).map((profile) => [
      String((profile as Record<string, unknown>).id),
      profile as Record<string, unknown>,
    ]),
  );

  const coursesMap = new Map(
    (courses ?? []).map((course) => [
      String((course as Record<string, unknown>).id),
      course as Record<string, unknown>,
    ]),
  );

  const stationsMap = new Map(
    (stations ?? []).map((station) => [
      String((station as Record<string, unknown>).id),
      station as Record<string, unknown>,
    ]),
  );

  return enrollments.map((enrollment) => {
    const profile = profilesMap.get(enrollment.user_id);
    const course = coursesMap.get(enrollment.course_id);
    const station = enrollment.station_id
      ? stationsMap.get(enrollment.station_id)
      : undefined;

    return {
      id: enrollment.id,
      userId: enrollment.user_id,
      courseId: enrollment.course_id,
      stationId: enrollment.station_id,
      journeyType: enrollment.journey_type,
      status: enrollment.status as EnrollmentStatus,
      createdAt: enrollment.created_at,
      updatedAt: enrollment.updated_at ?? null,

      student: {
        name: getStudentName(profile),
        email: getStudentEmail(profile),
        phone: getStudentPhone(profile),
      },

      course: {
        title: getCourseTitle(course),
        slug: getCourseSlug(course),
      },

      station: {
        title: getStationTitle(station),
      },
    };
  });
}

async function changeEnrollmentStatus(
  enrollmentId: string,
  status: EnrollmentStatus,
): Promise<AdminActionResult> {
  if (!enrollmentId) {
    return {
      success: false,
      message: "رقم طلب الاشتراك غير موجود.",
    };
  }

  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from("enrollments")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", enrollmentId);

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/students/enrollment-requests");
  revalidatePath("/dashboard");

  return {
    success: true,
  };
}

export async function approveEnrollment(
  enrollmentId: string,
): Promise<AdminActionResult> {
  return changeEnrollmentStatus(enrollmentId, "active");
}

export async function rejectEnrollment(
  enrollmentId: string,
): Promise<AdminActionResult> {
  return changeEnrollmentStatus(enrollmentId, "rejected");
}

export async function suspendEnrollment(
  enrollmentId: string,
): Promise<AdminActionResult> {
  return changeEnrollmentStatus(enrollmentId, "suspended");
}

export async function setEnrollmentPending(
  enrollmentId: string,
): Promise<AdminActionResult> {
  return changeEnrollmentStatus(enrollmentId, "pending");
}

export async function expireEnrollment(
  enrollmentId: string,
): Promise<AdminActionResult> {
  return changeEnrollmentStatus(enrollmentId, "expired");
}