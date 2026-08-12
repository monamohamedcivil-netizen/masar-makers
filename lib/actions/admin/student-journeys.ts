"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type StudentJourneySource = "paid" | "reward";

export interface StudentJourneyRow {
  id: string;
  courseId: string;
  courseTitle: string;
  courseCode: string | null;
  stationTitle: string | null;
  journeyType: string;
  enrollmentSource: StudentJourneySource;
  status: string;
  progressPercent: number;
  enrolledAt: string;
  updatedAt: string | null;
}

export interface StudentJourneysResult {
  success: boolean;
  message?: string;
  journeys: StudentJourneyRow[];
  statistics: {
    total: number;
    paid: number;
    reward: number;
    active: number;
    completed: number;
    pending: number;
  };
}

type EnrollmentRow = {
  id: string;
  course_id: string;
  journey_type: string | null;
  enrollment_source: string | null;
  status: string | null;
  created_at: string;
  updated_at: string | null;
};

type CourseRow = {
  id: string;
  title: string | null;
  title_ar: string | null;
  course_code: string | null;
  station_id: string | null;
};

type StationRow = {
  id: string;
  title: string | null;
  title_ar: string | null;
  name: string | null;
};

type ProgressRow = {
  course_id: string;
  progress_percent: number | string | null;
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

  return supabase;
}

function normalizeSource(value: string | null): StudentJourneySource {
  return value === "reward" ? "reward" : "paid";
}

function normalizeProgress(value: number | string | null) {
  const parsed = Number(value ?? 0);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(parsed)));
}

function normalizeStatus(value: string | null) {
  return (value ?? "pending").trim().toLowerCase();
}

function getCourseTitle(course: CourseRow | undefined) {
  return (
    course?.title_ar?.trim() ||
    course?.title?.trim() ||
    "كورس غير معروف"
  );
}

function getStationTitle(station: StationRow | undefined) {
  return (
    station?.title_ar?.trim() ||
    station?.title?.trim() ||
    station?.name?.trim() ||
    null
  );
}

export async function getStudentJourneys(
  userId: string,
): Promise<StudentJourneysResult> {
  const emptyStatistics = {
    total: 0,
    paid: 0,
    reward: 0,
    active: 0,
    completed: 0,
    pending: 0,
  };

  if (!userId?.trim()) {
    return {
      success: false,
      message: "رقم الطالب غير موجود.",
      journeys: [],
      statistics: emptyStatistics,
    };
  }

  const supabase = await requireAdmin();

  const { data: enrollmentData, error: enrollmentError } =
    await supabase
      .from("enrollments")
      .select(
        "id,course_id,journey_type,enrollment_source,status,created_at,updated_at",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

  if (enrollmentError) {
    return {
      success: false,
      message: enrollmentError.message,
      journeys: [],
      statistics: emptyStatistics,
    };
  }

  const enrollments = (enrollmentData ?? []) as EnrollmentRow[];

  if (enrollments.length === 0) {
    return {
      success: true,
      journeys: [],
      statistics: emptyStatistics,
    };
  }

  const courseIds = Array.from(
    new Set(enrollments.map((item) => item.course_id).filter(Boolean)),
  );

  const [
    { data: courseData, error: courseError },
    { data: progressData, error: progressError },
  ] = await Promise.all([
    supabase
      .from("courses")
      .select("id,title,title_ar,course_code,station_id")
      .in("id", courseIds),

    supabase
      .from("student_course_progress")
      .select("course_id,progress_percent")
      .eq("user_id", userId)
      .in("course_id", courseIds),
  ]);

  if (courseError) {
    return {
      success: false,
      message: courseError.message,
      journeys: [],
      statistics: emptyStatistics,
    };
  }

  if (progressError) {
    console.error(
      "Failed to load student journey progress:",
      progressError.message,
    );
  }

  const courses = (courseData ?? []) as CourseRow[];
  const progressRows = (progressData ?? []) as ProgressRow[];

  const stationIds = Array.from(
    new Set(courses.map((course) => course.station_id).filter(Boolean)),
  ) as string[];

  let stations: StationRow[] = [];

  if (stationIds.length > 0) {
    const { data: stationData, error: stationError } = await supabase
      .from("course_stations")
      .select("id,title,title_ar,name")
      .in("id", stationIds);

    if (stationError) {
      console.error(
        "Failed to load course stations:",
        stationError.message,
      );
    } else {
      stations = (stationData ?? []) as StationRow[];
    }
  }

  const courseMap = new Map(
    courses.map((course) => [course.id, course]),
  );

  const stationMap = new Map(
    stations.map((station) => [station.id, station]),
  );

  const progressMap = new Map(
    progressRows.map((progress) => [
      progress.course_id,
      normalizeProgress(progress.progress_percent),
    ]),
  );

  const journeys: StudentJourneyRow[] = enrollments.map((enrollment) => {
    const course = courseMap.get(enrollment.course_id);
    const station = course?.station_id
      ? stationMap.get(course.station_id)
      : undefined;

    return {
      id: enrollment.id,
      courseId: enrollment.course_id,
      courseTitle: getCourseTitle(course),
      courseCode: course?.course_code?.trim() || null,
      stationTitle: getStationTitle(station),
      journeyType:
        enrollment.journey_type?.trim() || "career_path",
      enrollmentSource: normalizeSource(
        enrollment.enrollment_source,
      ),
      status: normalizeStatus(enrollment.status),
      progressPercent:
        progressMap.get(enrollment.course_id) ?? 0,
      enrolledAt: enrollment.created_at,
      updatedAt: enrollment.updated_at,
    };
  });

  const statistics = journeys.reduce(
    (result, journey) => {
      result.total += 1;

      if (journey.enrollmentSource === "reward") {
        result.reward += 1;
      } else {
        result.paid += 1;
      }

      if (
        ["active", "approved", "enrolled", "confirmed"].includes(
          journey.status,
        )
      ) {
        result.active += 1;
      }

      if (
        journey.status === "completed" ||
        journey.progressPercent >= 100
      ) {
        result.completed += 1;
      }

      if (journey.status === "pending") {
        result.pending += 1;
      }

      return result;
    },
    { ...emptyStatistics },
  );

  return {
    success: true,
    journeys,
    statistics,
  };
}