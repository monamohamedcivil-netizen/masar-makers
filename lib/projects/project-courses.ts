"use server";

import { createClient } from "@/lib/supabase/server";

/*
 * النوع القديم سيظل موجودًا مؤقتًا
 * حتى لا ينكسر ProjectDialog الحالي.
 */
export type EligibleProjectCourse = {
  enrollmentId: string;
  courseId: string;
  courseTitle: string;
  journeyType: string | null;
  journeyTitle: string | null;
};

/*
 * بيانات الكورس داخل معرض أعمال الطالب.
 */
export type ProjectPortfolioCourse = {
  enrollmentId: string;
  courseId: string;
  courseTitle: string;

  courseSlug: string | null;
  courseImage: string | null;

  stationId: string | null;
  stationTitle: string | null;

  projectsCount: number;
};

/*
 * المسار المهني وما يحتويه من كورسات
 * اشترك بها الطالب فقط.
 */
export type ProjectPortfolioPath = {
  pathId: string;
  pathSlug: string | null;
  pathTitle: string;
  pathShortTitle: string | null;
  pathIcon: string | null;

  courses: ProjectPortfolioCourse[];
};

type EnrollmentRow = {
  id: string;
  course_id: string;
  course_title: string | null;
  journey_type: string | null;
  journey_title: string | null;
};

type CourseRow = {
  id: string;
  slug: string | null;
  title: string | null;
  title_ar: string | null;
  image_url: string | null;
  station_id: string | null;
  display_order: number | null;
};

type StationRow = {
  id: string;
  career_path_id: string | null;
  title: string | null;
  short_title: string | null;
  icon_url: string | null;
  display_order: number | null;
};

type CareerPathRow = {
  id: string;
  slug: string | null;
  title: string | null;
  title_ar: string | null;
  short_title: string | null;
  icon_url: string | null;
  display_order: number | null;
};

type ProjectCountRow = {
  course_id: string;
};

async function getApprovedEnrollments() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      supabase,
      user: null,
      enrollments: [] as EnrollmentRow[],
    };
  }

  const { data, error } = await supabase
    .from("enrollments")
    .select(
      `
        id,
        course_id,
        course_title,
        journey_type,
        journey_title
      `,
    )
    .eq("user_id", user.id)
    .eq("status", "approved")
    .not("course_id", "is", null)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error(
      "Failed to load eligible project enrollments:",
      error.message,
    );

    return {
      supabase,
      user,
      enrollments: [] as EnrollmentRow[],
    };
  }

  return {
    supabase,
    user,
    enrollments: (data ?? []) as EnrollmentRow[],
  };
}

/*
 * الدالة القديمة:
 * نُبقيها كما هي حاليًا حتى يستمر ProjectDialog
 * في العمل إلى أن نعدله في الخطوة التالية.
 */
export async function getEligibleProjectCourses(): Promise<
  EligibleProjectCourse[]
> {
  const { enrollments } =
    await getApprovedEnrollments();

  const uniqueCourses = new Map<
    string,
    EligibleProjectCourse
  >();

  for (const enrollment of enrollments) {
    if (
      !enrollment.course_id ||
      uniqueCourses.has(enrollment.course_id)
    ) {
      continue;
    }

    uniqueCourses.set(enrollment.course_id, {
      enrollmentId: enrollment.id,

      courseId: enrollment.course_id,

      courseTitle:
        enrollment.course_title?.trim() ||
        "كورس بدون اسم",

      journeyType: enrollment.journey_type,

      journeyTitle: enrollment.journey_title,
    });
  }

  return Array.from(uniqueCourses.values());
}

/*
 * الدالة الجديدة:
 *
 * تعيد البيانات بهذا التسلسل:
 *
 * المسار المهني
 *   ← الكورسات المشترك بها الطالب
 *      ← عدد المشاريع داخل كل كورس
 */
export async function getProjectPortfolioCatalog(): Promise<
  ProjectPortfolioPath[]
> {
  const {
    supabase,
    user,
    enrollments,
  } = await getApprovedEnrollments();

  if (!user || enrollments.length === 0) {
    return [];
  }

  /*
   * قد توجد أكثر من رحلة أو اشتراك لنفس الكورس.
   * نحتفظ بأحدث اشتراك مقبول لكل كورس.
   */
  const enrollmentByCourseId = new Map<
    string,
    EnrollmentRow
  >();

  for (const enrollment of enrollments) {
    if (
      enrollment.course_id &&
      !enrollmentByCourseId.has(
        enrollment.course_id,
      )
    ) {
      enrollmentByCourseId.set(
        enrollment.course_id,
        enrollment,
      );
    }
  }

  const courseIds = Array.from(
    enrollmentByCourseId.keys(),
  );

  if (courseIds.length === 0) {
    return [];
  }

  /*
   * نحمّل بيانات الكورسات وعدد مشاريع الطالب
   * في نفس الوقت.
   */
  const [coursesResult, projectsResult] =
    await Promise.all([
      supabase
        .from("courses")
        .select(
          `
            id,
            slug,
            title,
            title_ar,
            image_url,
            station_id,
            display_order
          `,
        )
        .in("id", courseIds),

      supabase
        .from("student_projects")
        .select("course_id")
        .eq("user_id", user.id)
        .in("course_id", courseIds),
    ]);

  if (coursesResult.error) {
    console.error(
      "Failed to load project portfolio courses:",
      coursesResult.error.message,
    );

    return [];
  }

  if (projectsResult.error) {
    console.error(
      "Failed to load project counts:",
      projectsResult.error.message,
    );
  }

  const courses =
    (coursesResult.data ?? []) as CourseRow[];

  const projectRows =
    projectsResult.error
      ? []
      : ((projectsResult.data ??
          []) as ProjectCountRow[]);

  /*
   * حساب عدد المشاريع لكل كورس.
   */
  const projectsCountByCourseId =
    new Map<string, number>();

  for (const project of projectRows) {
    projectsCountByCourseId.set(
      project.course_id,
      (projectsCountByCourseId.get(
        project.course_id,
      ) ?? 0) + 1,
    );
  }

  const stationIds = Array.from(
    new Set(
      courses
        .map((course) => course.station_id)
        .filter(
          (stationId): stationId is string =>
            Boolean(stationId),
        ),
    ),
  );

  const stationsResult =
    stationIds.length > 0
      ? await supabase
          .from("course_stations")
          .select(
            `
              id,
              career_path_id,
              title,
              short_title,
              icon_url,
              display_order
            `,
          )
          .in("id", stationIds)
      : {
          data: [],
          error: null,
        };

  if (stationsResult.error) {
    console.error(
      "Failed to load project course stations:",
      stationsResult.error.message,
    );
  }

  const stations =
    stationsResult.error
      ? []
      : ((stationsResult.data ??
          []) as StationRow[]);

  const stationById = new Map(
    stations.map((station) => [
      station.id,
      station,
    ]),
  );

  const careerPathIds = Array.from(
    new Set(
      stations
        .map(
          (station) =>
            station.career_path_id,
        )
        .filter(
          (pathId): pathId is string =>
            Boolean(pathId),
        ),
    ),
  );

  const pathsResult =
    careerPathIds.length > 0
      ? await supabase
          .from("career_paths")
          .select(
            `
              id,
              slug,
              title,
              title_ar,
              short_title,
              icon_url,
              display_order
            `,
          )
          .in("id", careerPathIds)
          .eq("is_active", true)
          .order("display_order", {
            ascending: true,
          })
      : {
          data: [],
          error: null,
        };

  if (pathsResult.error) {
    console.error(
      "Failed to load project career paths:",
      pathsResult.error.message,
    );
  }

  const careerPaths =
    pathsResult.error
      ? []
      : ((pathsResult.data ??
          []) as CareerPathRow[]);

  const careerPathById = new Map(
    careerPaths.map((path) => [
      path.id,
      path,
    ]),
  );

  /*
   * تجميع الكورسات حسب المسار المهني.
   */
  const groupedPaths = new Map<
    string,
    ProjectPortfolioPath
  >();

  for (const course of courses) {
    const enrollment =
      enrollmentByCourseId.get(course.id);

    if (!enrollment) {
      continue;
    }

    const station = course.station_id
      ? stationById.get(course.station_id)
      : undefined;

    const careerPath =
      station?.career_path_id
        ? careerPathById.get(
            station.career_path_id,
          )
        : undefined;

    /*
     * هذا المسار الاحتياطي يمنع اختفاء الكورس
     * إذا كانت بيانات station أو career path
     * غير مكتملة في قاعدة البيانات.
     */
    const pathId =
      careerPath?.id ??
      station?.career_path_id ??
      `unassigned-${enrollment.journey_type ?? "course"}`;

    const pathTitle =
      careerPath?.title_ar?.trim() ||
      careerPath?.title?.trim() ||
      enrollment.journey_title?.trim() ||
      "المسار التدريبي";

    if (!groupedPaths.has(pathId)) {
      groupedPaths.set(pathId, {
        pathId,

        pathSlug:
          careerPath?.slug ?? null,

        pathTitle,

        pathShortTitle:
          careerPath?.short_title ?? null,

        pathIcon:
          careerPath?.icon_url ?? null,

        courses: [],
      });
    }

    const groupedPath =
      groupedPaths.get(pathId);

    if (!groupedPath) {
      continue;
    }

    groupedPath.courses.push({
      enrollmentId: enrollment.id,

      courseId: course.id,

      courseTitle:
        course.title_ar?.trim() ||
        course.title?.trim() ||
        enrollment.course_title?.trim() ||
        "كورس بدون اسم",

      courseSlug: course.slug,

      courseImage: course.image_url,

      stationId: station?.id ?? null,

      stationTitle:
        station?.short_title?.trim() ||
        station?.title?.trim() ||
        null,

      projectsCount:
        projectsCountByCourseId.get(
          course.id,
        ) ?? 0,
    });
  }

  /*
   * ترتيب الكورسات داخل كل مسار
   * وفق ترتيب المحطة ثم ترتيب الكورس.
   */
  const courseById = new Map(
    courses.map((course) => [
      course.id,
      course,
    ]),
  );

  const stationOrderById = new Map(
    stations.map((station) => [
      station.id,
      station.display_order ?? 999,
    ]),
  );

  for (const path of groupedPaths.values()) {
    path.courses.sort((first, second) => {
      const firstCourse =
        courseById.get(first.courseId);

      const secondCourse =
        courseById.get(second.courseId);

      const firstStationOrder =
        first.stationId
          ? stationOrderById.get(
              first.stationId,
            ) ?? 999
          : 999;

      const secondStationOrder =
        second.stationId
          ? stationOrderById.get(
              second.stationId,
            ) ?? 999
          : 999;

      if (
        firstStationOrder !==
        secondStationOrder
      ) {
        return (
          firstStationOrder -
          secondStationOrder
        );
      }

      return (
        (firstCourse?.display_order ??
          999) -
        (secondCourse?.display_order ??
          999)
      );
    });
  }

  /*
   * ترتيب المسارات حسب display_order.
   */
  const pathOrderById = new Map(
    careerPaths.map((path) => [
      path.id,
      path.display_order ?? 999,
    ]),
  );

  return Array.from(
    groupedPaths.values(),
  ).sort(
    (first, second) =>
      (pathOrderById.get(first.pathId) ??
        999) -
      (pathOrderById.get(second.pathId) ??
        999),
  );
}