"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

type PanelItemUpdate = {
  id: string;
  title: string;
  display_order: number;
  active: boolean;
};

type SaveCoursePanelControlsInput = {
  stationSlug: string;
  learningModes: PanelItemUpdate[];
  resultTabs: PanelItemUpdate[];
};

export async function saveCoursePanelControls(
  input: SaveCoursePanelControlsInput
) {
  const supabase = await createClient();

  const learningUpdates = input.learningModes.map(
    async (item) => {
      const { error } = await supabase
        .from("course_learning_modes")
        .update({
          title: item.title,
          display_order: item.display_order,
          active: item.active,
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.id);

      if (error) {
        throw new Error(
          `تعذر حفظ زر طريقة التعلم: ${error.message}`
        );
      }
    }
  );

  const resultUpdates = input.resultTabs.map(
    async (item) => {
      const { error } = await supabase
        .from("course_result_tabs")
        .update({
          title: item.title,
          display_order: item.display_order,
          active: item.active,
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.id);

      if (error) {
        throw new Error(
          `تعذر حفظ زر نتائج الرحلة: ${error.message}`
        );
      }
    }
  );

  await Promise.all([
    ...learningUpdates,
    ...resultUpdates,
  ]);

  revalidatePath(
    `/course/${input.stationSlug}`
  );

  return {
    success: true,
  };
}
type AddPanelControlInput = {
  stationId: string;
  stationTitle: string;
  group: "learning" | "result";
};

export async function addCoursePanelControl(
  input: AddPanelControlInput
) {
  const supabase = await createClient();

  const tableName =
    input.group === "learning"
      ? "course_learning_modes"
      : "course_result_tabs";

  const { count, error: countError } =
    await supabase
      .from(tableName)
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("station_id", input.stationId);

  if (countError) {
    throw new Error(
      `تعذر حساب الأزرار: ${countError.message}`
    );
  }

  const uniqueKey = crypto.randomUUID();

  const { data, error } = await supabase
    .from(tableName)
    .insert({
      station_id: input.stationId,
      station_title: input.stationTitle,

      title: "زر جديد",
      icon:
        input.group === "learning"
          ? "play-circle"
          : "target",

      panel_type: input.group,

      panel_component:
        `custom-${uniqueKey}`,

      display_order: (count ?? 0) + 1,
      active: true,
    })
    .select()
    .single();

  if (error) {
    throw new Error(
      `تعذر إضافة الزر: ${error.message}`
    );
  }

  revalidatePath(
    `/course/${input.stationTitle}`
  );

  return data;
}