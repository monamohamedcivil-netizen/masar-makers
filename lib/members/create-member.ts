import { SupabaseClient } from "@supabase/supabase-js";

export async function createMember(
  supabase: SupabaseClient,
  userId: string,
) {
  const { data, error } = await supabase
    .from("member_profiles")
    .insert({
      user_id: userId,
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}