"use server";

import { createClient } from "@/lib/supabase/server";

import {
  getCourseStudentsForCertificates,
  type CertificateType,
  type CourseCertificateStudent,
} from "@/lib/actions/admin/course-certificates";

export type CertificatesDashboardRow = CourseCertificateStudent & {
  pathId: string | null;
  pathTitle: string;
  pathSlug: string | null;
  courseCode: string | null;
  certificateNumber: string | null;
};

export type CertificatesDashboardStatistics = {
  pending: number;
  issued: number;
  issuedThisMonth: number;
  pendingCourses: number;
};

export type CertificatesDashboardData = {
  rows: CertificatesDashboardRow[];
  paths: {
    id: string;
    title: string;
    slug: string | null;
    count: number;
  }[];
  statistics: CertificatesDashboardStatistics;
};

export type GetCertificatesDashboardResult = {
  success: boolean;
  message: string;
  data?: CertificatesDashboardData;
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
  career_path_id: string | null;
};

type CareerPathRow = {
  id: string;
  slug: string | null;
  title: string | null;
  title_ar: string | null;
};

type CertificateLookupRow = {
  id: string;
  enrollment_id: string;
  certificate_type: CertificateType;
  certificate_number: string | null;
  status: string | null;
  issued_at: string | null;
};

async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("يجب تسجيل الدخول أولًا.");
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
    throw new Error("ليس لديك صلاحية لعرض الشهادات.");
  }

  return supabase;
}

function getPathTitle(path: CareerPathRow | undefined) {
  return (
    path?.title_ar?.trim() ||
    path?.title?.trim() ||
    "بدون مسار"
  );
}

function isIssued(row: CertificatesDashboardRow) {
  return (
    Boolean(row.certificateId) ||
    row.certificateStatus?.trim().toLowerCase() === "issued"
  );
}

function isCurrentMonth(value: string | null) {
  if (!value) return false;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const now = new Date();

  return (
    date.getUTCFullYear() === now.getUTCFullYear() &&
    date.getUTCMonth() === now.getUTCMonth()
  );
}

export async function getCertificatesDashboard():
Promise<GetCertificatesDashboardResult> {
  try {
    const supabase = await requireAdmin();

    const { data: courseData, error: courseError } =
      await supabase
        .from("courses")
        .select(`
          id,
          title,
          title_ar,
          course_code,
          station_id
        `)
        .order("title", { ascending: true });

    if (courseError) {
      return {
        success: false,
        message: `تعذر تحميل الكورسات: ${courseError.message}`,
      };
    }

    const courses = (courseData ?? []) as CourseRow[];

    if (courses.length === 0) {
      return {
        success: true,
        message: "لا توجد كورسات.",
        data: {
          rows: [],
          paths: [],
          statistics: {
            pending: 0,
            issued: 0,
            issuedThisMonth: 0,
            pendingCourses: 0,
          },
        },
      };
    }

    const stationIds = Array.from(
      new Set(
        courses
          .map((course) => course.station_id)
          .filter((id): id is string => Boolean(id)),
      ),
    );

    let stations: StationRow[] = [];

    if (stationIds.length > 0) {
      const { data, error } = await supabase
        .from("course_stations")
        .select("id,career_path_id")
        .in("id", stationIds);

      if (error) {
        return {
          success: false,
          message: `تعذر تحميل محطات الكورسات: ${error.message}`,
        };
      }

      stations = (data ?? []) as StationRow[];
    }

    const pathIds = Array.from(
      new Set(
        stations
          .map((station) => station.career_path_id)
          .filter((id): id is string => Boolean(id)),
      ),
    );

    let careerPaths: CareerPathRow[] = [];

    if (pathIds.length > 0) {
      const { data, error } = await supabase
        .from("career_paths")
        .select("id,slug,title,title_ar")
        .in("id", pathIds);

      if (error) {
        return {
          success: false,
          message: `تعذر تحميل المسارات: ${error.message}`,
        };
      }

      careerPaths = (data ?? []) as CareerPathRow[];
    }

    const stationMap = new Map(
      stations.map((station) => [station.id, station]),
    );

    const pathMap = new Map(
      careerPaths.map((path) => [path.id, path]),
    );

    const courseResults = await Promise.all(
      courses.map(async (course) => ({
        course,
        result: await getCourseStudentsForCertificates(course.id),
      })),
    );

    const baseRows: CertificatesDashboardRow[] = [];

    for (const { course, result } of courseResults) {
      if (!result.success) {
        console.error(
          `CERTIFICATES DASHBOARD COURSE ${course.id}:`,
          result.message,
        );
        continue;
      }

      const station = course.station_id
        ? stationMap.get(course.station_id)
        : undefined;

      const path = station?.career_path_id
        ? pathMap.get(station.career_path_id)
        : undefined;

      for (const student of result.data ?? []) {
        baseRows.push({
          ...student,
          courseTitle:
            course.title_ar?.trim() ||
            course.title?.trim() ||
            student.courseTitle,
          courseCode: course.course_code?.trim() || null,
          pathId: path?.id ?? null,
          pathTitle: getPathTitle(path),
          pathSlug: path?.slug ?? null,
          certificateNumber: null,
        });
      }
    }

    const certificateIds = Array.from(
      new Set(
        baseRows
          .map((row) => row.certificateId)
          .filter((id): id is string => Boolean(id)),
      ),
    );

    const enrollmentIds = Array.from(
      new Set(baseRows.map((row) => row.enrollmentId)),
    );

    let certificateRows: CertificateLookupRow[] = [];

    if (certificateIds.length > 0 || enrollmentIds.length > 0) {
      let query = supabase
        .from("certificates")
        .select(`
          id,
          enrollment_id,
          certificate_type,
          certificate_number,
          status,
          issued_at
        `);

      if (certificateIds.length > 0) {
        query = query.in("id", certificateIds);
      } else {
        query = query.in("enrollment_id", enrollmentIds);
      }

      const { data, error } = await query;

      if (error) {
        return {
          success: false,
          message: `تعذر تحميل تفاصيل الشهادات: ${error.message}`,
        };
      }

      certificateRows =
        (data ?? []) as CertificateLookupRow[];
    }

    const certificateMap = new Map(
      certificateRows.map((certificate) => [
        `${certificate.enrollment_id}:${certificate.certificate_type}`,
        certificate,
      ]),
    );

    const rows = baseRows
      .map((row) => {
        const certificate = certificateMap.get(
          `${row.enrollmentId}:${row.certificateType}`,
        );

        return {
          ...row,
          certificateId:
            certificate?.id ?? row.certificateId,
          certificateNumber:
            certificate?.certificate_number ?? null,
          certificateStatus:
            certificate?.status ?? row.certificateStatus,
          certificateIssuedAt:
            certificate?.issued_at ??
            row.certificateIssuedAt,
        };
      })
      .sort((first, second) => {
        const pathCompare = first.pathTitle.localeCompare(
          second.pathTitle,
          "ar",
        );

        if (pathCompare !== 0) return pathCompare;

        const courseCompare = first.courseTitle.localeCompare(
          second.courseTitle,
          "ar",
        );

        if (courseCompare !== 0) return courseCompare;

        return first.studentName.localeCompare(
          second.studentName,
          "ar",
        );
      });

    const pendingRows = rows.filter((row) => !isIssued(row));
    const issuedRows = rows.filter(isIssued);

    const pathCounter = new Map<
      string,
      {
        id: string;
        title: string;
        slug: string | null;
        count: number;
      }
    >();

    for (const row of rows) {
      const id = row.pathId ?? "unassigned";
      const current = pathCounter.get(id);

      if (current) {
        current.count += 1;
      } else {
        pathCounter.set(id, {
          id,
          title: row.pathTitle,
          slug: row.pathSlug,
          count: 1,
        });
      }
    }

    const pendingCourseIds = new Set(
      pendingRows.map((row) => row.courseId),
    );

    return {
      success: true,
      message: "تم تحميل الشهادات بنجاح.",
      data: {
        rows,
        paths: Array.from(pathCounter.values()).sort(
          (first, second) =>
            first.title.localeCompare(second.title, "ar"),
        ),
        statistics: {
          pending: pendingRows.length,
          issued: issuedRows.length,
          issuedThisMonth: issuedRows.filter((row) =>
            isCurrentMonth(row.certificateIssuedAt),
          ).length,
          pendingCourses: pendingCourseIds.size,
        },
      },
    };
  } catch (error) {
    console.error("GET CERTIFICATES DASHBOARD ERROR", error);

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "حدث خطأ غير متوقع أثناء تحميل الشهادات.",
    };
  }
}