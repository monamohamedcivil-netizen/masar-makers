import {
  createClient,
} from "@/lib/supabase/server";

export async function getCourseReviews(
  courseId: string
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("student_surveys")
    .select(`
      id,
      rating,
      comment,
      student_name,
      student_country,
      show_on_course,
      status,
      profiles(
        full_name,
        country
      )
    `)
    .eq("course_id", courseId)
    .eq("show_on_course", true)
    .eq("status", "approved")
    .order(
      "submitted_at",
      { ascending: false }
    );

  if (error) {
    console.error(
      "Failed to load course reviews:",
      error.message
    );

    return [];
  }

  return data ?? [];
}