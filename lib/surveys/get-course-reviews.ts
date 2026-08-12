import { createClient } from "@/lib/supabase/server";

export async function getCourseReviews(courseId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("student_surveys")
    .select(`
      id,
      rating,
      comment,
      show_on_course,
      profiles(
        full_name,
        country
      )
    `)
    .eq("course_id", courseId)
    .eq("show_on_course", true)
    .order("submitted_at", { ascending: false });

  return data ?? [];
}