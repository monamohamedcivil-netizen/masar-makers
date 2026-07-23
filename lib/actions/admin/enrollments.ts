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
  actionKey: string | null;
  actionTitle: string | null;
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

type EnrollmentRow = {
  id: string;
  user_id: string;
  course_id: string;
  journey_type: string | null;
  action_key: string | null;
  action_title: string | null;
  status: EnrollmentStatus;
  created_at: string;
  updated_at: string | null;
};

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

  return { supabase };
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
    course.title_ar ??
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

  const title =
    station.title_ar ??
    station.title ??
    station.name ??
    station.station_title;

  return title ? String(title) : null;
}

export async function getEnrollmentRequests(): Promise<
  AdminEnrollmentRequest[]
> {
  const { supabase } = await requireAdmin();

  const { data, error } = await supabase
    .from("enrollments")
    .select(
      "id,user_id,course_id,journey_type,action_key,action_title,status,created_at,updated_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const enrollments = (data ?? []) as EnrollmentRow[];

  if (enrollments.length === 0) {
    return [];
  }

  const userIds = Array.from(
    new Set(enrollments.map((item) => item.user_id).filter(Boolean)),
  );

  const courseIds = Array.from(
    new Set(enrollments.map((item) => item.course_id).filter(Boolean)),
  );

  const [{ data: profiles }, { data: courses }] = await Promise.all([
    userIds.length
      ? supabase.from("profiles").select("*").in("id", userIds)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),

    courseIds.length
      ? supabase.from("courses").select("*").in("id", courseIds)
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

  /*
   * The current enrollment insert stores course_id and journey_type.
   * The station is derived automatically from the course record.
   */
  const stationIds = Array.from(
    new Set(
      (courses ?? [])
        .map((course) =>
          String(
            (course as Record<string, unknown>).station_id ?? "",
          ),
        )
        .filter(Boolean),
    ),
  );

  const { data: stations } = stationIds.length
    ? await supabase
        .from("course_stations")
        .select("*")
        .in("id", stationIds)
    : { data: [] as Record<string, unknown>[] };

  const stationsMap = new Map(
    (stations ?? []).map((station) => [
      String((station as Record<string, unknown>).id),
      station as Record<string, unknown>,
    ]),
  );

  return enrollments.map((enrollment) => {
    const profile = profilesMap.get(enrollment.user_id);
    const course = coursesMap.get(enrollment.course_id);

    const stationId = course?.station_id
      ? String(course.station_id)
      : null;

    const station = stationId
      ? stationsMap.get(stationId)
      : undefined;

    return {
      id: enrollment.id,
      userId: enrollment.user_id,
      courseId: enrollment.course_id,
      stationId,

      /*
       * Important: journey type belongs to the enrollment request,
       * not to the course record.
       */
      journeyType: enrollment.journey_type?.trim() || "career_path",
      actionKey: enrollment.action_key?.trim() || null,
      actionTitle: enrollment.action_title?.trim() || null,

      status: enrollment.status,
      createdAt: enrollment.created_at,
      updatedAt: enrollment.updated_at,

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
  revalidatePath("/admin/dashboard");
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