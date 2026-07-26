import { SupabaseClient } from "@supabase/supabase-js";

export async function getMember(
  supabase: SupabaseClient,
  userId: string,
) {
  const { data, error } = await supabase
    .from("member_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;

  return data;
}