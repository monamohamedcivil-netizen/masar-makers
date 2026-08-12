import { createClient } from "@/lib/supabase/server";

export async function getStudentSurveys() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
  .from("student_surveys")
  .select(`
    *,
    courses(
      id,
      title,
      survey_url,
      survey_enabled
    )
  `)
  .eq("user_id", user.id)
  .order("submitted_at", { ascending: false });

  if (error) return [];

  return data ?? [];
}