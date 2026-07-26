import { SupabaseClient } from "@supabase/supabase-js";
import { createMember } from "./create-member";
import { getMember } from "./get-member";

export async function ensureMember(
  supabase: SupabaseClient,
  userId: string,
) {
  let member = await getMember(supabase, userId);

  if (member) return member;

  member = await createMember(supabase, userId);

  return member;
}