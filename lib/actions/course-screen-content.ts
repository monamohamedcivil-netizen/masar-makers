"use server";

import { createClient } from "@/lib/supabase/server";

export async function saveCourseScreenContent(data: {
  stationId: string;
  panelComponent: string;

  screenTitle: string;

  columnCount: number;

  columnOneTitle?: string;
  columnTwoTitle?: string;

  content: any;
}) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("course_screen_contents")
    .upsert(
      {
        station_id: data.stationId,

        panel_component: data.panelComponent,

        screen_title: data.screenTitle,

        column_count: data.columnCount,

        column_one_title: data.columnOneTitle,

        column_two_title: data.columnTwoTitle,

        content: data.content,
      },
      {
        onConflict: "station_id,panel_component",
      }
    );

  if (error) throw error;

  return true;
}
export async function getCourseScreenContent(
  stationId: string,
  panelComponent: string
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("course_screen_contents")
    .select("*")
    .eq("station_id", stationId)
    .eq("panel_component", panelComponent)
    .maybeSingle();

  if (error) {
    console.error("Failed to load course screen content:", error);
    throw error;
  }

  return data;
}