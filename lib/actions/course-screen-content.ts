"use server";

import {
  createClient,
} from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase =
    await createClient();

  const {
    data: { user },
    error: userError,
  } =
    await supabase.auth.getUser();

  if (
    userError ||
    !user
  ) {
    throw new Error(
      "يجب تسجيل الدخول أولًا.",
    );
  }

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role =
    profile?.role ??
    user.app_metadata?.role ??
    user.user_metadata?.role ??
    null;

  if (
    profileError ||
    ![
      "admin",
      "super_admin",
    ].includes(
      String(role ?? ""),
    )
  ) {
    throw new Error(
      "ليس لديك صلاحية لتعديل محتوى صفحة الكورس.",
    );
  }

  return supabase;
}

export async function saveCourseScreenContent(
  data: {
    stationId: string;
    panelComponent: string;
    screenTitle: string;
    columnCount: number;
    columnOneTitle?: string;
    columnTwoTitle?: string;
    content: unknown;
  },
) {
  const supabase =
    await requireAdmin();

  const { error } =
    await supabase
      .from(
        "course_screen_contents",
      )
      .upsert(
        {
          station_id:
            data.stationId,
          panel_component:
            data.panelComponent,
          screen_title:
            data.screenTitle,
          column_count:
            data.columnCount,
          column_one_title:
            data.columnOneTitle,
          column_two_title:
            data.columnTwoTitle,
          content:
            data.content,
        },
        {
          onConflict:
            "station_id,panel_component",
        },
      );

  if (error) {
    throw error;
  }

  return true;
}

export async function getCourseScreenContent(
  stationId: string,
  panelComponent: string,
) {
  /*
   * القراءة متاحة لعرض صفحة الكورس للطلاب.
   * صلاحية الإدارة مطلوبة للحفظ فقط.
   */
  const supabase =
    await createClient();

  const { data, error } =
    await supabase
      .from(
        "course_screen_contents",
      )
      .select("*")
      .eq(
        "station_id",
        stationId,
      )
      .eq(
        "panel_component",
        panelComponent,
      )
      .maybeSingle();

  if (error) {
    console.error(
      "Failed to load course screen content:",
      error,
    );

    throw error;
  }

  return data;
}