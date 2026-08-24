import AdminPageHeader from "@/components/admin/layout/AdminPageHeader";
import CatalogManager from "@/components/admin/catalog/CatalogManager";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function JourneysPage() {
  const supabase = await createClient();

  const [
    { data: journeys },
    { data: courses },
    { data: careerPaths },
    { data: stations },
  ] = await Promise.all([
    supabase
      .from("journeys")
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true }),

    supabase
      .from("courses")
      .select(`
        id,
        title,
        title_ar,
        slug,
        career_path_id,
        station_id,
        display_order
      `)
      .order("display_order", { ascending: true }),

    supabase
      .from("career_paths")
      .select(`
        id,
        title,
        title_ar,
        display_order,
        is_active
      `)
      .order("display_order", { ascending: true }),

    supabase
      .from("course_stations")
      .select(`
        id,
        career_path_id,
        title,
        short_title,
        display_order
      `)
      .order("display_order", { ascending: true }),
  ]);

  const pathMap = new Map(
    (careerPaths ?? []).map((path) => [
      path.id,
      path,
    ]),
  );

  const stationMap = new Map(
    (stations ?? []).map((station) => [
      station.id,
      station,
    ]),
  );

  const normalizedCourses = (courses ?? []).map(
    (course) => {
      const station = course.station_id
        ? stationMap.get(course.station_id)
        : undefined;

      const careerPathId =
        course.career_path_id ??
        station?.career_path_id ??
        null;

      const careerPath = careerPathId
        ? pathMap.get(careerPathId)
        : undefined;

      return {
        ...course,
        title:
          course.title_ar?.trim() ||
          course.title?.trim() ||
          "كورس بدون اسم",

        career_path_id: careerPathId,

        career_path_title:
          careerPath?.title_ar?.trim() ||
          careerPath?.title?.trim() ||
          "بدون مسار",

        career_path_order:
          Number(
            careerPath?.display_order ?? 999,
          ),

        /*
         * هذا هو ترتيب المحطة الحقيقي داخل المسار.
         * لا نستخدم journeys.display_order لترتيب محطات المسار.
         */
        station_display_order:
          Number(
            station?.display_order ??
              course.display_order ??
              999,
          ),
      };
    },
  );

  const normalizedPaths = (careerPaths ?? []).map(
    (path) => ({
      ...path,
      title:
        path.title_ar?.trim() ||
        path.title?.trim() ||
        "مسار بدون اسم",
    }),
  );

  return (
    <>
      <AdminPageHeader
        title="إدارة الرحلات"
        description="إدارة الرحلات مجمعة حسب المسار المهني ومرتبة وفق ترتيب المحطات الحقيقي."
      />

      <CatalogManager
        kind="journeys"
        initialRows={journeys ?? []}
        courses={normalizedCourses}
        careerPaths={normalizedPaths}
      />
    </>
  );
}