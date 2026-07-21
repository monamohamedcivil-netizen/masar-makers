import AdminPageHeader from "@/components/admin/layout/AdminPageHeader";
import LessonContentManager from "@/components/admin/lessons/LessonContentManager";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function LessonsPage() {
  const supabase = await createClient();
  const [{ data: lessons }, { data: courses }, { data: journeys }, { data: resources }] = await Promise.all([
    supabase.from("lessons").select("id,course_id,journey_id,title,description,video_url,video_provider,video_asset_id,lesson_order,duration_minutes,is_preview,is_published,created_at,courses(id,title,title_ar),journeys(id,title)").order("course_id").order("lesson_order"),
    supabase.from("courses").select("id,title,title_ar").order("display_order"),
    supabase.from("journeys").select("id,course_id,title").order("display_order"),
    supabase.from("lesson_resources").select("id,lesson_id,title,resource_type,file_url,file_path,external_url,display_order,is_active").order("display_order"),
  ]);

  return (
    <>
      <AdminPageHeader title="الدروس والمحتوى" description="إدارة الدروس والفيديوهات والمرفقات وترتيب محتوى كل كورس." />
      <LessonContentManager initialLessons={lessons ?? []} courses={courses ?? []} journeys={journeys ?? []} initialResources={resources ?? []} />
    </>
  );
}
