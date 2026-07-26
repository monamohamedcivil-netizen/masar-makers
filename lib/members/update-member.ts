import { SupabaseClient } from "@supabase/supabase-js";

export async function updateMember(
  supabase: SupabaseClient,
  userId: string,
  values: {
    english_name?: string;
    country?: string;
    phone?: string;
    profession?: string;
    company?: string;
  },
) {
  const { data, error } = await supabase
    .from("member_profiles")
    .update(values)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw error;

  return data;
}