"use server";

import { revalidatePath } from "next/cache";
import {
  createClient,
  createAdminClient,
} from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";

export async function updateStudentSurveyVisibility(
  surveyId: string,
  showOnHome: boolean,
  showOnCourse: boolean,
) {
  // حماية: عملية إدارية تستخدم service_role.
  await requireAdmin();

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
/*
 * موافقة الأدمن على تعديل الطالب لتقييمه.
 * التقييم المنشور لا يتغير إلا هنا، والأدمن يحدد الظهور في الرئيسية وصفحة الكورس.
 */
export async function approveSurveyEdit(
  surveyId: string,
  showOnHome: boolean,
  showOnCourse: boolean,
) {
  await requireAdmin();

  const supabase = createAdminClient();

  const { data: current, error: readError } = await supabase
    .from("student_surveys")
    .select(
      "id,pending_rating,pending_comment,pending_requested_at,show_on_home,show_on_course",
    )
    .eq("id", surveyId)
    .maybeSingle();

  if (
    readError ||
    !current ||
    !current.pending_requested_at ||
    !current.pending_rating
  ) {
    return {
      success: false,
      message: "لا يوجد تعديل معلّق لهذا التقييم.",
    };
  }

  const now = new Date().toISOString();

  const { data: updated, error } = await supabase
    .from("student_surveys")
    .update({
      rating: current.pending_rating,
      comment: current.pending_comment,
      show_on_home: showOnHome,
      show_on_course: showOnCourse,
      previous_show_on_home: Boolean(current.show_on_home),
      previous_show_on_course: Boolean(current.show_on_course),
      edited_by_student: true,
      student_last_edit_at: current.pending_requested_at,
      updated_at: now,
      pending_rating: null,
      pending_comment: null,
      pending_requested_at: null,
    })
    .eq("id", surveyId)
    // نتأكد أن الطلب ما زال معلّقًا (لم يُعالج من نافذة أخرى).
    .not("pending_requested_at", "is", null)
    .select("id");

  if (error || !updated || updated.length === 0) {
    return {
      success: false,
      message: error?.message || "تعذرت الموافقة على التعديل.",
    };
  }

  revalidatePath("/admin");
  revalidatePath("/");

  return { success: true, message: "تمت الموافقة على التعديل." };
}

export async function rejectSurveyEdit(surveyId: string) {
  await requireAdmin();

  const { data: updated, error } = await createAdminClient()
    .from("student_surveys")
    .update({
      pending_rating: null,
      pending_comment: null,
      pending_requested_at: null,
    })
    .eq("id", surveyId)
    .not("pending_requested_at", "is", null)
    .select("id");

  if (error || !updated || updated.length === 0) {
    return {
      success: false,
      message: error?.message || "لا يوجد تعديل معلّق لهذا التقييم.",
    };
  }

  revalidatePath("/admin");

  return {
    success: true,
    message: "تم رفض التعديل وبقي التقييم السابق كما هو.",
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
  // حماية إضافية: الاستيراد الإداري للتقييمات للأدمن فقط.
  await requireAdmin();

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