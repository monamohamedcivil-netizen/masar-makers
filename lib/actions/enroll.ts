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

export type CourseEnrollmentAccess = {
  statuses: EnrollmentStatusMap;
  journeyTypes: string[];
  hasFundamental: boolean;
  hasAdvanced: boolean;
  hasIntegrated: boolean;
  showFundamental: boolean;
  showAdvanced: boolean;
  showIntegrated: boolean;
};

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

type StationLookupRow = {
  id: string;
  slug: string;
  title: string;
  title_ar: string | null;
};

function getJourneyTitle(journeyType: string) {
  const labels: Record<string, string> = {
    fundamental: "رحلة الأساسيات",
    fundamentals: "رحلة الأساسيات",
    advanced: "الرحلة المتقدمة",
    integrated: "رحلة الاحتراف المتكاملة",
    professional: "رحلة الاحتراف المتكاملة",
    career_path: "رحلة الاحتراف المتكاملة",
    workshop: "رحلة اليوم الواحد",
    free: "الرحلة المجانية",
  };

  return labels[normalizeJourneyType(journeyType)] || journeyType;
}

async function findStation(
  supabase: Awaited<ReturnType<typeof createClient>>,
  stationId: string | null,
): Promise<StationLookupRow | null> {
  if (!stationId) {
    return null;
  }

  const { data, error } = await supabase
    .from("course_stations")
    .select("id,slug,title,title_ar")
    .eq("id", stationId)
    .maybeSingle();

  if (error) {
    console.error("Failed to find station:", error.message);
    return null;
  }

  return (data as StationLookupRow | null) ?? null;
}

const blockingEnrollmentStatuses = new Set<EnrollmentStatus>([
  "pending",
  "active",
  "completed",
  "suspended",
  "expired",
]);

function normalizeJourneyType(value: string | null | undefined) {
  const normalized = (value ?? "").trim().toLowerCase();

  if (normalized === "fundamentals") {
    return "fundamental";
  }

  return normalized;
}

function buildCourseEnrollmentAccess(
  rows: Array<{
    action_key: string | null;
    journey_type: string | null;
    status: EnrollmentStatus;
  }>,
): CourseEnrollmentAccess {
  const statuses: EnrollmentStatusMap = Object.fromEntries(
    rows
      .filter(
        (item): item is {
          action_key: string;
          journey_type: string | null;
          status: EnrollmentStatus;
        } =>
          typeof item.action_key === "string" &&
          item.action_key.trim().length > 0,
      )
      .map((item) => [item.action_key.trim(), item.status]),
  );

  const journeyTypes = Array.from(
    new Set(
      rows
        .filter((item) =>
          blockingEnrollmentStatuses.has(item.status),
        )
        .map((item) => normalizeJourneyType(item.journey_type))
        .filter(Boolean),
    ),
  );

  const hasFundamental = journeyTypes.includes("fundamental");
  const hasAdvanced = journeyTypes.includes("advanced");
  const hasIntegrated = journeyTypes.includes("integrated");

  return {
    statuses,
    journeyTypes,
    hasFundamental,
    hasAdvanced,
    hasIntegrated,
    showFundamental: !hasIntegrated,
    showAdvanced: !hasIntegrated,
    showIntegrated:
      hasIntegrated ||
      (!hasFundamental && !hasAdvanced),
  };
}

function validateJourneyCombination(
  requestedJourneyType: string,
  existingRows: Array<{
    journey_type: string | null;
    status: EnrollmentStatus;
  }>,
): string | null {
  const requested = normalizeJourneyType(requestedJourneyType);

  if (
    requested !== "fundamental" &&
    requested !== "advanced" &&
    requested !== "integrated"
  ) {
    return null;
  }

  const existingJourneyTypes = new Set(
    existingRows
      .filter((item) =>
        blockingEnrollmentStatuses.has(item.status),
      )
      .map((item) => normalizeJourneyType(item.journey_type))
      .filter(Boolean),
  );

  const hasFundamental =
    existingJourneyTypes.has("fundamental");
  const hasAdvanced =
    existingJourneyTypes.has("advanced");
  const hasIntegrated =
    existingJourneyTypes.has("integrated");

  if (
    requested === "integrated" &&
    (hasFundamental || hasAdvanced)
  ) {
    return "لا يمكن الاشتراك في الرحلة المتكاملة بعد الاشتراك في رحلة الأساسيات أو الرحلة المتقدمة.";
  }

  if (
    (requested === "fundamental" ||
      requested === "advanced") &&
    hasIntegrated
  ) {
    return "أنت مشترك بالفعل في الرحلة المتكاملة التي تشمل الأساسيات والمتقدم.";
  }

  return null;
}

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

export async function getCourseEnrollmentAccess(
  courseReference: string,
): Promise<CourseEnrollmentAccess> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return buildCourseEnrollmentAccess([]);
  }

  const course = await findCourse(supabase, courseReference);

  if (!course) {
    return buildCourseEnrollmentAccess([]);
  }

  const { data, error } = await supabase
    .from("enrollments")
    .select("action_key,journey_type,status")
    .eq("user_id", user.id)
    .eq("course_id", course.id);

  if (error) {
    console.error(
      "Failed to load course enrollment access:",
      error.message,
    );
    return buildCourseEnrollmentAccess([]);
  }

  return buildCourseEnrollmentAccess(
    (data ?? []) as Array<{
      action_key: string | null;
      journey_type: string | null;
      status: EnrollmentStatus;
    }>,
  );
}

export async function getEnrollmentStatuses(
  courseReference: string,
): Promise<EnrollmentStatusMap> {
  const access =
    await getCourseEnrollmentAccess(courseReference);

  return access.statuses;
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

  const station = await findStation(supabase, course.station_id);
  const resolvedCourseTitle =
    course.title_ar?.trim() || course.title;
  const resolvedStationTitle =
    station?.title_ar?.trim() ||
    station?.title?.trim() ||
    resolvedCourseTitle;

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
  const resolvedJourneyType =
    normalizeJourneyType(journeyType) || "career_path";
  const resolvedJourneyTitle =
    getJourneyTitle(resolvedJourneyType);
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
    courseTitle: resolvedStationTitle,
    journeyType: resolvedJourneyType,
    requestNumber: `MM-${enrollment.id.slice(0, 8).toUpperCase()}`,
  });

  const {
    data: relatedEnrollments,
    error: relatedEnrollmentsError,
  } = await supabase
    .from("enrollments")
    .select("id,status,journey_type,action_key")
    .eq("user_id", user.id)
    .eq("course_id", course.id);

  if (relatedEnrollmentsError) {
    return {
      success: false,
      message: relatedEnrollmentsError.message,
    };
  }

  const combinationError = validateJourneyCombination(
    resolvedJourneyType,
    (relatedEnrollments ?? []) as Array<{
      journey_type: string | null;
      status: EnrollmentStatus;
    }>,
  );

  if (combinationError) {
    return {
      success: false,
      message: combinationError,
    };
  }

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

    /*
     * A rejected or cancelled request must become pending again when the
     * student clicks “Resend enrollment request”. Returning the old row
     * unchanged kept the button red and prevented a new pending request from
     * appearing in the admin panel.
     */
    if (
      typedExisting.status === "rejected" ||
      typedExisting.status === "cancelled"
    ) {
      const { data: renewedEnrollment, error: renewError } = await supabase
        .from("enrollments")
        .update({
          journey_type: resolvedJourneyType,
          journey_title: resolvedJourneyTitle,
          course_title: resolvedCourseTitle,
          station_id: station?.id ?? course.station_id,
          station_slug: station?.slug ?? null,
          station_title: resolvedStationTitle,
          action_title: resolvedJourneyTitle,
          status: "pending",
          updated_at: new Date().toISOString(),
        })
        .eq("id", typedExisting.id)
        .eq("user_id", user.id)
        .select("id,status")
        .single();

      if (renewError || !renewedEnrollment) {
        return {
          success: false,
          message:
            renewError?.message || "تعذر إعادة إرسال طلب الاشتراك.",
        };
      }

      const renewed = renewedEnrollment as {
        id: string;
        status: EnrollmentStatus;
      };

      revalidatePath(`/course/${course.slug}`);
      revalidatePath("/admin");
      revalidatePath("/admin/students/enrollment-requests");
      revalidatePath("/dashboard");

      return {
        success: true,
        enrollment: renewed,
        whatsapp: buildWhatsappData(renewed),
      };
    }

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
      course_title: resolvedCourseTitle,
      station_id: station?.id ?? course.station_id,
      station_slug: station?.slug ?? null,
      station_title: resolvedStationTitle,
      journey_type: resolvedJourneyType,
      journey_title: resolvedJourneyTitle,
      action_key: resolvedActionKey,
      action_title: resolvedJourneyTitle,
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

  const station = await findStation(supabase, course.station_id);
  const resolvedCourseTitle =
    course.title_ar?.trim() || course.title;
  const resolvedStationTitle =
    station?.title_ar?.trim() ||
    station?.title?.trim() ||
    resolvedCourseTitle;
  const resolvedJourneyTitle = getJourneyTitle("free");

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
      course_title: resolvedCourseTitle,
      station_id: station?.id ?? course.station_id,
      station_slug: station?.slug ?? null,
      station_title: resolvedStationTitle,
      journey_type: "free",
      journey_title: resolvedJourneyTitle,
      action_key: resolvedActionKey,
      action_title: resolvedJourneyTitle,
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
    query = query.eq("journey_type", normalizeJourneyType(journeyType));
  }

  await query;

  revalidatePath(`/course/${course.slug}`);
}