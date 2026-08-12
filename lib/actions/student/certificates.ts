"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export async function markCertificateAsViewed(
  certificateId: string,
) {
  const normalizedCertificateId = certificateId?.trim();

  if (!normalizedCertificateId) {
    return {
      success: false,
      message: "رقم الشهادة غير موجود.",
    };
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      success: false,
      message: "يجب تسجيل الدخول أولًا.",
    };
  }

  const { error } = await supabase
    .from("certificates")
    .update({
      is_new: false,
    })
    .eq("id", normalizedCertificateId)
    .eq("user_id", user.id)
    .eq("is_new", true);

  if (error) {
    return {
      success: false,
      message: `تعذر تحديث حالة الشهادة: ${error.message}`,
    };
  }

  return {
    success: true,
    message: "تم اعتبار الشهادة معروضة.",
  };
}