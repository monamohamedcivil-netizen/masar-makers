import AdminPageHeader from "@/components/admin/layout/AdminPageHeader";
import LessonContentManager from "@/components/admin/lessons/LessonContentManager";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function LessonsPage() {
  const supabase = await createClient();

  const [
    { data: lessons },
    { data: courses },
    { data: journeys },
    { data: resources },
    { data: careerPaths },
    { data: stations },
    { data: lessonJourneys },
  ] = await Promise.all([
    supabase
      .from("lessons")
      .select(`
        id,
        course_id,
        journey_id,
        journey_type,
        course_part,
        slug,
        title,
        title_ar,
        title_en,
        description,
        lesson_type,
        video_url,
        file_url,
        content,
        duration_minutes,
        sort_order,
        is_preview,
        status,
        published_at,
        created_by,
        created_at,
        updated_at,
        video_provider,
        video_asset_id,
        video_status,
        video_duration_seconds,
        video_size_bytes,
        video_thumbnail_url,
        video_updated_at,
        courses (
          id,
          title,
          title_ar,
          career_path_id,
          station_id,
          display_order
        ),
        journeys (
          id,
          title,
          journey_type
        )
      `)
      .order("sort_order", { ascending: true }),

    supabase
      .from("courses")
      .select(`
        id,
        title,
        title_ar,
        career_path_id,
        station_id,
        display_order
      `)
      .order("display_order", { ascending: true }),

    supabase
      .from("journeys")
      .select(`
        id,
        course_id,
        title,
        journey_type,
        display_order,
        is_active
      `)
      .order("display_order", { ascending: true }),

    supabase
      .from("lesson_resources")
      .select(`
        id,
        lesson_id,
        title,
        resource_type,
        file_url,
        file_path,
        external_url,
        display_order,
        is_active
      `)
      .order("display_order", { ascending: true }),

    supabase
      .from("career_paths")
      .select(`
        id,
        title,
        title_ar,
        short_title,
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
        display_order,
        is_active
      `)
      .order("display_order", { ascending: true }),

    supabase
      .from("lesson_journeys")
      .select(`
        id,
        lesson_id,
        journey_id
      `),
  ]);

  return (
    <>
      <AdminPageHeader
        title="الدروس والمحتوى"
        description="إدارة الدروس والفيديوهات والمرفقات وترتيب المحتوى حسب المسار والمحطة وقسم الكورس."
      />

      <LessonContentManager
        initialLessons={lessons ?? []}
        courses={courses ?? []}
        journeys={journeys ?? []}
        initialResources={resources ?? []}
        careerPaths={careerPaths ?? []}
        stations={stations ?? []}
        lessonJourneys={lessonJourneys ?? []}
      />
    </>
  );
}