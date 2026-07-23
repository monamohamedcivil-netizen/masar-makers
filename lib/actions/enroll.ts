"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type EnrollmentStatus =
  | "pending"
  | "active"
  | "rejected"
  | "expired"
  | "suspended"
  | "completed"
  | "cancelled";

export type EnrollmentStatusMap = Record<string, EnrollmentStatus>;

export interface EnrollmentRequestResult {
  success: boolean;
  message?: string;
  enrollment?: {
    id: string;
    status: EnrollmentStatus;
  };
  whatsapp?: {
    number: string;
    studentName: string;
    studentEmail: string;
    courseTitle: string;
    journeyType: string;
    requestNumber: string;
  };
}

type CourseLookupRow = {
  id: string;
  slug: string;
  title: string;
  title_ar: string | null;
  station_id: string | null;
};

async function findCourse(
  supabase: Awaited<ReturnType<typeof createClient>>,
  courseReference: string,
): Promise<CourseLookupRow | null> {
  const columns = "id,slug,title,title_ar,station_id";

  // The course page passes the slug. Keep UUID lookup as a safe fallback.
  const { data: courseBySlug, error: slugError } = await supabase
    .from("courses")
    .select(columns)
    .eq("slug", courseReference)
    .maybeSingle();

  if (slugError) {
    console.error("Failed to find course by slug:", slugError.message);
  }

  if (courseBySlug) {
    return courseBySlug as CourseLookupRow;
  }

  const { data: courseById, error: idError } = await supabase
    .from("courses")
    .select(columns)
    .eq("id", courseReference)
    .maybeSingle();

  if (idError) {
    console.error("Failed to find course by id:", idError.message);
  }

  return (courseById as CourseLookupRow | null) ?? null;
}

export async function getEnrollment(courseReference: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const course = await findCourse(supabase, courseReference);

  if (!course) return null;

  const { data } = await supabase
    .from("enrollments")
    .select("*")
    .eq("user_id", user.id)
    .eq("course_id", course.id)
    .maybeSingle();

  return data;
}

export async function getEnrollmentStatuses(
  courseReference: string,
): Promise<EnrollmentStatusMap> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {};
  }

  const course = await findCourse(supabase, courseReference);

  if (!course) {
    return {};
  }

  const { data, error } = await supabase
    .from("enrollments")
    .select("action_key,status")
    .eq("user_id", user.id)
    .eq("course_id", course.id);

  if (error) {
    console.error("Failed to load enrollment statuses:", error.message);
    return {};
  }

  return Object.fromEntries(
    (data ?? [])
      .filter(
        (item): item is { action_key: string; status: EnrollmentStatus } =>
          typeof item.action_key === "string" &&
          item.action_key.trim().length > 0,
      )
      .map((item) => [item.action_key, item.status]),
  );
}

export async function requestEnrollment(
  courseReference: string,
  journeyType: string,
  actionKey: string,
  actionTitle?: string,
): Promise<EnrollmentRequestResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      message: "LOGIN_REQUIRED",
    };
  }

  const course = await findCourse(supabase, courseReference);

  if (!course) {
    return {
      success: false,
      message: "لم يتم العثور على الكورس في قاعدة البيانات.",
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name,email,phone")
    .eq("id", user.id)
    .maybeSingle();

  const studentName =
    profile?.full_name?.trim() ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "طالب جديد";

  const studentEmail = profile?.email || user.email || "غير متوفر";
  const resolvedJourneyType = journeyType?.trim() || "career_path";
  const resolvedActionKey = actionKey?.trim();

  if (!resolvedActionKey) {
    return {
      success: false,
      message: "تعذر تحديد عنصر الاشتراك.",
    };
  }

  const whatsappNumber =
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim() || "";

  const buildWhatsappData = (
    enrollment: { id: string; status: EnrollmentStatus },
  ) => ({
    number: whatsappNumber,
    studentName,
    studentEmail,
    courseTitle: course.title_ar?.trim() || course.title,
    journeyType: resolvedJourneyType,
    requestNumber: `MM-${enrollment.id.slice(0, 8).toUpperCase()}`,
  });

  const { data: existing, error: existingError } = await supabase
    .from("enrollments")
    .select("id,status,journey_type,action_key")
    .eq("user_id", user.id)
    .eq("course_id", course.id)
    .eq("action_key", resolvedActionKey)
    .maybeSingle();

  if (existingError) {
    return {
      success: false,
      message: existingError.message,
    };
  }

  if (existing) {
    const typedExisting = existing as {
      id: string;
      status: EnrollmentStatus;
    };

    return {
      success: true,
      enrollment: typedExisting,
      whatsapp: buildWhatsappData(typedExisting),
    };
  }

  const { data, error } = await supabase
    .from("enrollments")
    .insert({
      user_id: user.id,
      course_id: course.id,
      journey_type: resolvedJourneyType,
      action_key: resolvedActionKey,
      action_title: actionTitle?.trim() || null,
      status: "pending",
    })
    .select("id,status,journey_type")
    .single();

    console.log("REQUEST INSERT", {
  data,
  error,
  actionKey: resolvedActionKey,
  journeyType: resolvedJourneyType,
});


  if (error || !data) {
    return {
      success: false,
      message: error?.message || "تعذر إنشاء طلب الاشتراك.",
    };
  }

  const enrollment = data as {
    id: string;
    status: EnrollmentStatus;
  };

  revalidatePath(`/course/${course.slug}`);
  revalidatePath("/admin");
  revalidatePath("/admin/students/enrollment-requests");
  revalidatePath("/dashboard");

  return {
    success: true,
    enrollment,
    whatsapp: buildWhatsappData(enrollment),
  };
}

export async function startFreeJourney(
  courseReference: string,
  actionKey: string,
  actionTitle?: string,
): Promise<EnrollmentRequestResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      message: "LOGIN_REQUIRED",
    };
  }

  const course = await findCourse(supabase, courseReference);

  if (!course) {
    return {
      success: false,
      message: "لم يتم العثور على الكورس.",
    };
  }

  const resolvedActionKey = actionKey?.trim();

  if (!resolvedActionKey) {
    return {
      success: false,
      message: "تعذر تحديد عنصر الرحلة المجانية.",
    };
  }

  const { data: existing } = await supabase
    .from("enrollments")
    .select("id,status")
    .eq("user_id", user.id)
    .eq("course_id", course.id)
    .eq("action_key", resolvedActionKey)
    .maybeSingle();

  if (existing) {
    return {
      success: true,
      enrollment: existing,
    };
  }

  const { data, error } = await supabase
    .from("enrollments")
    .insert({
      user_id: user.id,
      course_id: course.id,
      journey_type: "free",
      action_key: resolvedActionKey,
      action_title: actionTitle?.trim() || null,
      status: "active",
    })
    .select("id,status")
    .single();

    console.log("FREE INSERT", {
  data,
  error,
  actionKey: resolvedActionKey,
});

  if (error || !data) {
    return {
      success: false,
      message: error?.message,
    };
  }

  revalidatePath(`/course/${course.slug}`);
  revalidatePath("/dashboard");

  return {
    success: true,
    enrollment: data,
  };
}

export async function updateEnrollmentStatus(
  enrollmentId: string,
  status: EnrollmentStatus,
) {
  const supabase = await createClient();

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

export async function cancelEnrollment(
  courseReference: string,
  journeyType?: string,
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const course = await findCourse(supabase, courseReference);

  if (!course) return;

  let query = supabase
    .from("enrollments")
    .delete()
    .eq("user_id", user.id)
    .eq("course_id", course.id);

  if (journeyType?.trim()) {
    query = query.eq("journey_type", journeyType.trim());
  }

  await query;

  revalidatePath(`/course/${course.slug}`);
}