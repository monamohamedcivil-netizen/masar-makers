import AdminPageHeader from "@/components/admin/layout/AdminPageHeader";
import LandingPromosManager from "@/components/admin/content/LandingPromosManager";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function LandingPromosPage() {
  const supabase = createAdminClient();

  const [
    { data: courses, error: coursesError },
    { data: promos, error: promosError },
    { data: careerPaths, error: pathsError },
    { data: stations, error: stationsError },
  ] = await Promise.all([
    supabase
      .from("courses")
      .select(
        "id,title,title_ar,title_en,slug,course_code,icon_url,is_active,career_path_id,station_id,display_order"
      )
      .eq("is_active", true)
      .order("display_order", { ascending: true }),

    supabase
      .from("landing_course_promos")
      .select(
        "id,course_id,video_source,youtube_url,youtube_video_id,is_active,created_at,updated_at"
      )
      .order("updated_at", { ascending: false }),

    supabase
      .from("career_paths")
      .select(
        "id,title,title_ar,short_title,display_order,is_active"
      )
      .eq("is_active", true)
      .order("display_order", { ascending: true }),

    supabase
      .from("course_stations")
      .select(
        "id,career_path_id,title,short_title,display_order,is_active"
      )
      .eq("is_active", true)
      .order("display_order", { ascending: true }),
  ]);

  if (coursesError) {
    throw new Error(`تعذر تحميل الكورسات: ${coursesError.message}`);
  }

  if (promosError) {
    throw new Error(
      `تعذر تحميل إعلانات صفحة البداية: ${promosError.message}`
    );
  }

  if (pathsError) {
    throw new Error(`تعذر تحميل المسارات: ${pathsError.message}`);
  }

  if (stationsError) {
    throw new Error(`تعذر تحميل المحطات: ${stationsError.message}`);
  }

  return (
    <>
      <AdminPageHeader
        title="إعلانات صفحة البداية"
        description="إدارة رابط YouTube لإعلان كل محطة في صفحة Landing Page بنفس ترتيب المسارات والمحطات."
      />

      <LandingPromosManager
        initialCourses={courses ?? []}
        initialPromos={promos ?? []}
        careerPaths={careerPaths ?? []}
        stations={stations ?? []}
      />
    </>
  );
}