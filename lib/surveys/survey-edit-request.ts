"use server";

import { revalidatePath } from "next/cache";
import {
  createAdminClient,
  createClient,
} from "@/lib/supabase/server";

/*
 * تعديل الطالب لتقييمه: يُحفظ كطلب معلّق (pending_*) ولا يمس التقييم المنشور،
 * ولا يظهر للعامة إلا بعد موافقة الأدمن من لوحة التحكم.
 */

type EditResult =
  | { success: true; message: string }
  | { success: false; error: string };

async function getUserId() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  return error || !user ? null : user.id;
}

export async function requestSurveyEdit(input: {
  courseId: string;
  rating: number;
  comment: string;
}): Promise<EditResult> {
  const courseId = input.courseId?.trim();
  const rating = Number(input.rating);
  const comment = (input.comment ?? "").trim();

  if (!courseId) {
    return { success: false, error: "معرّف الرحلة غير صالح." };
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { success: false, error: "يجب أن يكون التقييم من 1 إلى 5." };
  }

  if (comment.length > 2000) {
    return { success: false, error: "التعليق أطول من المسموح." };
  }

  const userId = await getUserId();

  if (!userId) {
    return { success: false, error: "يجب تسجيل الدخول أولًا." };
  }

  const admin = createAdminClient();

  // الصف يجب أن يكون للطالب نفسه (التحقق هنا على السيرفر).
  const { data: survey, error: findError } = await admin
    .from("student_surveys")
    .select("id,rating,comment,submitted_at")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .maybeSingle();

  if (findError || !survey || !survey.submitted_at) {
    return { success: false, error: "لا يوجد تقييم سابق لتعديله." };
  }

  if (
    Number(survey.rating) === rating &&
    (survey.comment ?? "").trim() === comment
  ) {
    return { success: false, error: "لم تغيّر شيئًا في تقييمك." };
  }

  const { error } = await admin
    .from("student_surveys")
    .update({
      pending_rating: rating,
      pending_comment: comment || null,
      pending_requested_at: new Date().toISOString(),
    })
    .eq("id", survey.id)
    .eq("user_id", userId);

  if (error) {
    console.error("REQUEST SURVEY EDIT ERROR:", error.message);

    return { success: false, error: "تعذر حفظ طلب التعديل." };
  }

  revalidatePath("/dashboard");

  return {
    success: true,
    message: "تم إرسال تعديلك للمراجعة. سيظهر بعد موافقة الإدارة.",
  };
}

export async function cancelSurveyEditRequest(
  courseId: string,
): Promise<EditResult> {
  const userId = await getUserId();

  if (!userId || !courseId?.trim()) {
    return { success: false, error: "يجب تسجيل الدخول أولًا." };
  }

  const { error } = await createAdminClient()
    .from("student_surveys")
    .update({
      pending_rating: null,
      pending_comment: null,
      pending_requested_at: null,
    })
    .eq("user_id", userId)
    .eq("course_id", courseId.trim());

  if (error) {
    return { success: false, error: "تعذر إلغاء طلب التعديل." };
  }

  revalidatePath("/dashboard");

  return { success: true, message: "تم إلغاء طلب التعديل." };
}
