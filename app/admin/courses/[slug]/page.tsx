import CourseManager from "@/components/admin/CourseManager";

import { getCareerPaths } from "@/lib/queries/catalog/career-paths";

export const dynamic = "force-dynamic";

export default async function CoursesAdminPage() {
  const careerPaths = await getCareerPaths();

  const courses = careerPaths.flatMap((path) =>
    path.course_stations.flatMap((station) =>
      station.courses.map((course) => ({
        ...course,
        stationTitle: station.title,
        stationSlug: station.slug,
        pathTitle: path.title,
        pathSlug: path.slug,
      }))
    )
  );

  return (
    <main
      dir="rtl"
      className="
        min-h-screen
        bg-[#F7F8FA]
        p-6
        lg:p-10
      "
    >
      <CourseManager courses={courses} />
    </main>
  );
}