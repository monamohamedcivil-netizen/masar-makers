"use server";

import { createClient } from "@/lib/supabase/server";

export async function getJourneyModules(
  journeyId: string
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("journey_modules")
    .select("*")
    .eq("journey_id", journeyId)
    .order("display_order");

  if (error) {
    throw error;
  }

  return data;
}