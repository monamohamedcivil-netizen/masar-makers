"use server";

import { createClient } from "@/lib/supabase/server";

type TrackCourseActionInput = {
  stationId: string;
  panelComponent: string;
  sourceType: "screen" | "column" | "item";
  sourceId: string;
  sourceTitle: string;
  actionLabel: string;
  actionLink?: string;
};

export async function trackCourseActionLead(
  input: TrackCourseActionInput
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      requiresLogin: true,
      message: "يجب تسجيل الدخول أولًا.",
    };
  }

  const metadata = user.user_metadata ?? {};

  const fullName =
    metadata.full_name ??
    metadata.name ??
    metadata.display_name ??
    null;

  const phone =
    metadata.phone ??
    metadata.mobile ??
    metadata.phone_number ??
    null;

  const country =
    metadata.country ??
    metadata.country_name ??
    null;

  const { error } = await supabase
    .from("course_action_leads")
    .insert({
      user_id: user.id,
      station_id: input.stationId,
      panel_component: input.panelComponent,
      source_type: input.sourceType,
      source_id: input.sourceId,
      source_title: input.sourceTitle,
      action_label: input.actionLabel,
      action_link: input.actionLink || null,
      student_name: fullName,
      student_email: user.email ?? null,
      student_phone: phone,
      student_country: country,
      created_at: new Date().toISOString(),
    });

  if (error) {
    console.error("Failed to save course action lead:", error);

    return {
      success: false,
      message: error.message,
    };
  }

  return {
    success: true,
    student: {
      name: fullName,
      email: user.email ?? null,
      phone,
      country,
    },
  };
}
