"use server";

import {
  getAdminCourseProjects,
  type AdminCourseProject,
} from "@/lib/actions/admin/course-projects";

import { createClient } from "@/lib/supabase/server";

export type ProjectsDashboardRow = AdminCourseProject & {
  courseTitle: string;
  courseCode: string | null;
  pathId: string | null;
  pathTitle: string;
  pathSlug: string | null;
};

export type ProjectsDashboardData = {
  rows: ProjectsDashboardRow[];
  paths: {
    id: string;
    title: string;
    slug: string | null;
    count: number;
  }[];
  statistics: {
    total: number;
    pending: number;
    approved: number;
    showOnHome: number;
  };
};

export type GetProjectsDashboardResult = {
  success: boolean;
  message: string;
  data?: ProjectsDashboardData;
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
    throw new Error("ليس لديك صلاحية لعرض المشاريع.");
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

export async function getProjectsDashboard():
Promise<GetProjectsDashboardResult> {
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
            total: 0,
            pending: 0,
            approved: 0,
            showOnHome: 0,
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

    let paths: CareerPathRow[] = [];

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

      paths = (data ?? []) as CareerPathRow[];
    }

    const stationMap = new Map(
      stations.map((station) => [station.id, station]),
    );

    const pathMap = new Map(
      paths.map((path) => [path.id, path]),
    );

    const courseResults = await Promise.all(
      courses.map(async (course) => ({
        course,
        result: await getAdminCourseProjects(course.id),
      })),
    );

    const rows: ProjectsDashboardRow[] = [];

    for (const { course, result } of courseResults) {
      if (!result.success) {
        console.error(
          `PROJECTS DASHBOARD COURSE ${course.id}:`,
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

      for (const project of result.data) {
        rows.push({
          ...project,
          courseTitle:
            course.title_ar?.trim() ||
            course.title?.trim() ||
            "كورس بدون عنوان",
          courseCode: course.course_code?.trim() || null,
          pathId: path?.id ?? null,
          pathTitle: getPathTitle(path),
          pathSlug: path?.slug ?? null,
        });
      }
    }

    rows.sort((first, second) => {
      const firstDate = first.submittedAt
        ? new Date(first.submittedAt).getTime()
        : 0;

      const secondDate = second.submittedAt
        ? new Date(second.submittedAt).getTime()
        : 0;

      return secondDate - firstDate;
    });

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

    return {
      success: true,
      message: "تم تحميل المشاريع بنجاح.",
      data: {
        rows,
        paths: Array.from(pathCounter.values()).sort(
          (first, second) =>
            first.title.localeCompare(second.title, "ar"),
        ),
        statistics: {
          total: rows.length,
          pending: rows.filter(
            (row) => row.status !== "approved",
          ).length,
          approved: rows.filter(
            (row) => row.status === "approved",
          ).length,
          showOnHome: rows.filter(
            (row) => row.showOnHome,
          ).length,
        },
      },
    };
  } catch (error) {
    console.error("GET PROJECTS DASHBOARD ERROR", error);

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "حدث خطأ غير متوقع أثناء تحميل المشاريع.",
    };
  }
}