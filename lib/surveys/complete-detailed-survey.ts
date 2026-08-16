"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function completeDetailedSurvey(
  courseId: string,
) {
  const normalizedCourseId = courseId.trim();

  if (!normalizedCourseId) {
    return {
      success: false,
      error: "معرّف الرحلة غير صالح.",
    };
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      error: "يجب تسجيل الدخول أولًا.",
    };
  }

  const completedAt = new Date().toISOString();

  const { error } = await supabase
    .from("student_surveys")
    .update({
      detailed_survey_completed: true,
      detailed_survey_completed_at: completedAt,
      updated_at: completedAt,
    })
    .eq("user_id", user.id)
    .eq("course_id", normalizedCourseId);

  if (error) {
    console.error(
      "Failed to complete detailed survey:",
      error,
    );

    return {
      success: false,
      error:
        "تعذر تحديث حالة الاستبيان.",
    };
  }

  revalidatePath("/dashboard");

  return {
    success: true,
  };
}