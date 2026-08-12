"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { EnrollmentStatus } from "@/lib/actions/enroll";
import { getMasarPassport } from "@/lib/dashboard/masar-passport";
import { activateEnrollmentWorkflow } from "@/lib/workflows";

export type EnrollmentSource = "paid" | "reward";

export interface AdminEnrollmentRequest {
  id: string;
  userId: string;
  courseId: string;
  stationId: string | null;
  journeyType: string;
  actionKey: string | null;
  actionTitle: string | null;
  enrollmentSource: EnrollmentSource;
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
  warning?: string;
}

type EnrollmentRow = {
  id: string;
  user_id: string;
  course_id: string;
  journey_type: string | null;
  action_key: string | null;
  action_title: string | null;
  enrollment_source: string | null;
  status: EnrollmentStatus;
  created_at: string;
  updated_at: string | null;
};

type ApproveEnrollmentRow = {
  id: string;
  user_id: string;
  course_id: string;
  journey_type: string | null;
  enrollment_source: string | null;
  status: EnrollmentStatus;
  courses:
    | {
        title: string | null;
        title_ar: string | null;
      }
    | {
        title: string | null;
        title_ar: string | null;
      }[]
    | null;
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

  if (
    profileError ||
    !profile ||
    !["admin", "super_admin"].includes(String(profile.role))
  ) {
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

function normalizeJourneyType(value: string | null | undefined) {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .replaceAll("-", "_");
}

function isOneDayJourney(value: string | null | undefined) {
  return [
    "workshop",
    "one_day",
    "one_day_journey",
    "one_day_workshop",
  ].includes(normalizeJourneyType(value));
}

function normalizeEnrollmentSource(
  value: string | null | undefined,
): EnrollmentSource {
  return value === "reward" ? "reward" : "paid";
}

function revalidateEnrollmentPages() {
  revalidatePath("/admin");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/students");
  revalidatePath("/admin/students/enrollment-requests");
  revalidatePath("/admin/students/active");
  revalidatePath("/admin/students/suspended");
  revalidatePath("/dashboard");
}

export async function getEnrollmentRequests(): Promise<
  AdminEnrollmentRequest[]
> {
  const { supabase } = await requireAdmin();

  const { data, error } = await supabase
    .from("enrollments")
    .select(
      "id,user_id,course_id,journey_type,action_key,action_title,enrollment_source,status,created_at,updated_at",
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

      journeyType: enrollment.journey_type?.trim() || "career_path",
      actionKey: enrollment.action_key?.trim() || null,
      actionTitle: enrollment.action_title?.trim() || null,
      enrollmentSource: normalizeEnrollmentSource(
        enrollment.enrollment_source,
      ),

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

export async function updateEnrollmentSource(
  enrollmentId: string,
  enrollmentSource: EnrollmentSource,
): Promise<AdminActionResult> {
  if (!enrollmentId?.trim()) {
    return {
      success: false,
      message: "رقم طلب الاشتراك غير موجود.",
    };
  }

  if (!["paid", "reward"].includes(enrollmentSource)) {
    return {
      success: false,
      message: "نوع الاشتراك غير صحيح.",
    };
  }

  const { supabase } = await requireAdmin();

  const { data: enrollmentData, error: enrollmentError } =
    await supabase
      .from("enrollments")
      .select("id,journey_type,status")
      .eq("id", enrollmentId)
      .maybeSingle();

  if (enrollmentError || !enrollmentData) {
    return {
      success: false,
      message:
        enrollmentError?.message ||
        "تعذر العثور على طلب الاشتراك.",
    };
  }

  if (String(enrollmentData.status).toLowerCase() !== "pending") {
    return {
      success: false,
      message: "لا يمكن تغيير نوع اشتراك تمت مراجعته.",
    };
  }

  if (
    enrollmentSource === "reward" &&
    !isOneDayJourney(enrollmentData.journey_type)
  ) {
    return {
      success: false,
      message: "المكافأة متاحة لرحلات اليوم الواحد فقط.",
    };
  }

  const { error: updateError } = await supabase
    .from("enrollments")
    .update({
      enrollment_source: enrollmentSource,
      updated_at: new Date().toISOString(),
    })
    .eq("id", enrollmentId);

  if (updateError) {
    return {
      success: false,
      message: `تعذر حفظ نوع الاشتراك: ${updateError.message}`,
    };
  }

  revalidatePath("/admin/students/enrollment-requests");

  return {
    success: true,
    message: "تم تحديث نوع الاشتراك.",
  };
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

  revalidateEnrollmentPages();

  return {
    success: true,
  };
}

export async function approveEnrollment(
  enrollmentId: string,
): Promise<AdminActionResult> {
  if (!enrollmentId?.trim()) {
    return {
      success: false,
      message: "رقم طلب الاشتراك غير موجود.",
    };
  }

  const { supabase } = await requireAdmin();

  const { data, error } = await supabase
    .from("enrollments")
    .select(`
      id,
      user_id,
      course_id,
      journey_type,
      enrollment_source,
      status,
      courses (
        title,
        title_ar
      )
    `)
    .eq("id", enrollmentId)
    .maybeSingle();

  if (error || !data) {
    return {
      success: false,
      message:
        error?.message ||
        "تعذر العثور على طلب الاشتراك.",
    };
  }

  const enrollment = data as ApproveEnrollmentRow;
  const enrollmentSource = normalizeEnrollmentSource(
    enrollment.enrollment_source,
  );

  if (
    enrollmentSource === "reward" &&
    !isOneDayJourney(enrollment.journey_type)
  ) {
    return {
      success: false,
      message: "المكافأة متاحة لرحلات اليوم الواحد فقط.",
    };
  }

  if (enrollmentSource === "reward") {
    const passport = await getMasarPassport(enrollment.user_id);

    if (passport.availableRewards <= 0) {
      return {
        success: false,
        message: "الطالب لا يمتلك مكافأة متاحة حاليًا.",
      };
    }
  }

  const result = await activateEnrollmentWorkflow(
    supabase,
    enrollmentId,
  );

  if (!result.success) {
    return {
      success: false,
      message: result.message,
    };
  }

  let rewardWarning: string | undefined;

  if (enrollmentSource === "reward") {
    const { data: profileData, error: profileLoadError } =
      await supabase
        .from("profiles")
        .select("redeemed_rewards")
        .eq("id", enrollment.user_id)
        .maybeSingle();

    if (profileLoadError) {
      rewardWarning =
        `تم تفعيل الاشتراك، لكن تعذر قراءة بطاقة المكافآت: ${profileLoadError.message}`;
    } else {
      const currentRedeemedRewards = Math.max(
        0,
        Number(profileData?.redeemed_rewards ?? 0),
      );

      const courseRelation = Array.isArray(enrollment.courses)
        ? enrollment.courses[0]
        : enrollment.courses;

      const courseTitle =
        courseRelation?.title_ar?.trim() ||
        courseRelation?.title?.trim() ||
        "رحلة اليوم الواحد";

      const rewardedAt = new Date().toISOString();

      const { error: rewardError } = await supabase
        .from("profiles")
        .update({
          redeemed_rewards: currentRedeemedRewards + 1,
          last_reward_course_id: enrollment.course_id,
          last_reward_course_title: courseTitle,
          last_reward_redeemed_at: rewardedAt,
        })
        .eq("id", enrollment.user_id);

      if (rewardError) {
        rewardWarning =
          `تم تفعيل الاشتراك، لكن تعذر تحديث بطاقة المكافآت: ${rewardError.message}`;
      }
    }
  }

  revalidateEnrollmentPages();

  return {
    success: true,
    message:
      enrollmentSource === "reward"
        ? "تم قبول الاشتراك وتسجيله كمكافأة."
        : result.message,
    warning: rewardWarning ?? result.warning,
  };
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

export async function reactivateEnrollment(
  enrollmentId: string,
): Promise<AdminActionResult> {
  return changeEnrollmentStatus(enrollmentId, "active");
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