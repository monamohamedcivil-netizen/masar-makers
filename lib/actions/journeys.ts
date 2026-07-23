"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createJourney(data: {
  courseId: string;
  title: string;
  slug: string;
  journeyType:
    | "fundamental"
    | "advanced"
    | "integrated"
    | "workshop"
    | "free";
}) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("journeys")
    .insert({
      course_id: data.courseId,
      title: data.title,
      slug: data.slug,
      journey_type: data.journeyType,
      is_active: true,
      registration_required: true,
      display_order: 1,
      status: "draft",
    });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin");
}

export async function updateJourney(
  journeyId: string,
  values: Record<string, unknown>,
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("journeys")
    .update(values)
    .eq("id", journeyId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin");
}

export async function deleteJourney(
  journeyId: string,
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("journeys")
    .delete()
    .eq("id", journeyId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin");
}

export async function publishJourney(
  journeyId: string,
  active: boolean,
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("journeys")
    .update({
      is_active: active,
    })
    .eq("id", journeyId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin");
}