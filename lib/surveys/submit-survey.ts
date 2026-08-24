"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type SubmitSurveyInput = {
  courseId: string;
  rating: number;
  comment: string;
};

export type SavedStudentSurvey = {
  id: string;
  userId: string;
  courseId: string;
  surveyTemplateId: string | null;
  rating: number;
  comment: string | null;
  submittedAt: string | null;
  showOnHome: boolean;
  showOnCourse: boolean;
  detailedSurveyCompleted: boolean;
  detailedSurveyCompletedAt: string | null;
};

export type SubmitSurveyResult =
  | { success: true; survey: SavedStudentSurvey }
  | { success: false; error: string };

type StudentSurveyRow = {
  id: string;
  user_id: string;
  course_id: string;
  survey_template_id: string | null;
  rating: number;
  comment: string | null;
  submitted_at: string | null;
  show_on_home: boolean | null;
  show_on_course: boolean | null;
  detailed_survey_completed: boolean | null;
  detailed_survey_completed_at: string | null;
};

export async function submitSurvey({
  courseId,
  rating,
  comment,
}: SubmitSurveyInput): Promise<SubmitSurveyResult> {
  const normalizedCourseId = courseId.trim();
  const normalizedRating = Number(rating);
  const normalizedComment = comment.trim();

  if (!normalizedCourseId) {
    return { success: false, error: "معرّف الرحلة غير صالح." };
  }

  if (!Number.isInteger(normalizedRating) || normalizedRating < 1 || normalizedRating > 5) {
    return { success: false, error: "يجب أن يكون التقييم من 1 إلى 5." };
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "يجب تسجيل الدخول أولًا." };
  }

  const submittedAt = new Date().toISOString();

  /*
   * نحفظ بيانات الطالب الحالية مع التقييم.
   * student_surveys جدول denormalized، لذلك user_id وحده لا يكفي
   * لعرض الاسم لاحقًا إذا كانت student_name فارغة أو قديمة.
   */
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name,email")
    .eq("id", user.id)
    .maybeSingle();

  const studentName =
    profile?.full_name?.trim() ||
    (typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name.trim()
      : "") ||
    (typeof user.user_metadata?.name === "string"
      ? user.user_metadata.name.trim()
      : "") ||
    null;

  const studentEmail =
    profile?.email?.trim().toLowerCase() ||
    user.email?.trim().toLowerCase() ||
    null;

  const { data, error } = await supabase
    .from("student_surveys")
    .upsert(
      {
        user_id: user.id,
        student_name: studentName,
        student_email: studentEmail,
        course_id: normalizedCourseId,
        rating: normalizedRating,
        comment: normalizedComment || null,

        // التقييم الأول أصبح مكتملًا فعليًا بمجرد الإرسال.
        general_survey_completed: true,
        general_survey_completed_at: submittedAt,

        submitted_at: submittedAt,
        updated_at: submittedAt,
      },
      { onConflict: "user_id,course_id" },
    )
    .select(`
      id,
      user_id,
      course_id,
      survey_template_id,
      rating,
      comment,
      submitted_at,
      show_on_home,
      show_on_course,
      detailed_survey_completed,
      detailed_survey_completed_at
    `)
    .single();

  if (error || !data) {
    console.error("Failed to submit student survey:", {
      message: error?.message,
      details: error?.details,
      hint: error?.hint,
      code: error?.code,
    });

    return {
      success: false,
      error: error?.message ?? "حدث خطأ أثناء حفظ تقييم الرحلة.",
    };
  }

  const row = data as StudentSurveyRow;

  revalidatePath("/dashboard");

  return {
    success: true,
    survey: {
      id: row.id,
      userId: row.user_id,
      courseId: row.course_id,
      surveyTemplateId: row.survey_template_id,
      rating: Number(row.rating),
      comment: row.comment,
      submittedAt: row.submitted_at,
      showOnHome: Boolean(row.show_on_home),
      showOnCourse: Boolean(row.show_on_course),
      detailedSurveyCompleted: Boolean(row.detailed_survey_completed),
      detailedSurveyCompletedAt: row.detailed_survey_completed_at,
    },
  };
}