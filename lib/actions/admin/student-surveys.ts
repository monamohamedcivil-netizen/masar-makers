"use server";

import { revalidatePath } from "next/cache";
import {
  createClient,
  createAdminClient,
} from "@/lib/supabase/server";

export async function updateStudentSurveyVisibility(
  surveyId: string,
  showOnHome: boolean,
  showOnCourse: boolean,
) {
  // هذه عملية إدارية؛ استخدام عميل المستخدم قد يجعل RLS
  // يعيد نجاحًا بدون تحديث أي صف (data = [] و error = null).
  const supabase = createAdminClient();

  const { data: updatedRows, error } = await supabase
    .from("student_surveys")
    .update({
      show_on_home: showOnHome,
      show_on_course: showOnCourse,
    })
    .eq("id", surveyId)
    .select("id, show_on_home, show_on_course");

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  if (!updatedRows || updatedRows.length === 0) {
    return {
      success: false,
      message: "لم يتم العثور على التقييم أو لم يتم تحديثه.",
    };
  }

  revalidatePath("/admin");
  revalidatePath("/");

  return {
    success: true,
    message: "تم الحفظ بنجاح",
  };
}
export async function createImportedStudentSurvey({
  studentName,
  studentEmail,
  studentJobTitle,
  studentCountry,
  courseId,
  rating,
  comment,
  generalSurveyCompleted,
  detailedSurveyCompleted,
  showOnHome,
  showOnCourse,
  sourceReference,
}: {
  studentName: string;
  studentEmail: string;
  studentJobTitle: string;
  studentCountry: string;
  courseId: string;

  rating: number;
  comment: string;

  generalSurveyCompleted: boolean;
  detailedSurveyCompleted: boolean;

  showOnHome: boolean;
  showOnCourse: boolean;

  sourceReference: string;
}) {
  const supabase = await createClient();

  // محاولة ربط الطالب إذا كان لديه حساب

  let userId: string | null = null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", studentEmail.trim().toLowerCase())
    .maybeSingle();

  if (profile) {
    userId = profile.id;
  }

  const now = new Date().toISOString();

  const { error } = await supabase
    .from("student_surveys")
    .insert({
      user_id: userId ?? null,

      student_name: studentName,

      student_email: studentEmail.trim().toLowerCase(),
student_job_title: studentJobTitle,

student_country: studentCountry,
      course_id: courseId,

      rating,

      comment,

      submitted_at: now,

      general_survey_completed: generalSurveyCompleted,

      general_survey_completed_at: generalSurveyCompleted
        ? now
        : null,

      detailed_survey_completed:
        detailedSurveyCompleted,

      detailed_survey_completed_at:
        detailedSurveyCompleted
          ? now
          : null,

      show_on_home: showOnHome,

      show_on_course: showOnCourse,

      previous_show_on_home: showOnHome,

      previous_show_on_course: showOnCourse,

      source: "admin_import",

      source_reference: sourceReference,

      status: "approved",

      edited_by_student: false,
    });

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  revalidatePath("/admin");

  return {
    success: true,
    message: "تمت إضافة التقييم بنجاح",
  };
}