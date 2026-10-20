"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/server";

export interface SuspensionResult {
  success: boolean;
  message: string;
}

const BAN_FOREVER = "876000h"; // نحو 100 سنة؛ يُرفع عند إعادة التفعيل.

function refresh() {
  revalidatePath("/admin/students");
  revalidatePath("/admin/students/active");
  revalidatePath("/admin/students/suspended");
  revalidatePath("/admin/students/enrollment-requests");
  revalidatePath("/admin");
}

function rpcMissing(error: { code?: string; message?: string } | null) {
  return (
    !!error &&
    (error.code === "PGRST202" ||
      /could not find the function|does not exist/i.test(error.message ?? ""))
  );
}

const NOT_READY =
  "نظام إيقاف الحساب غير مفعّل بعد في قاعدة البيانات (لم يُنفّذ ملف account_suspension).";

/** إيقاف حساب طالب: يوقف كل اشتراكاته ويمنعه من تسجيل الدخول. */
export async function suspendStudentAccount(
  userId: string,
  reason: string,
): Promise<SuspensionResult> {
  try {
    const { user } = await requireAdmin();
    const cleanReason = reason?.trim() ?? "";

    if (!userId) return { success: false, message: "الطالب غير محدد." };
    if (cleanReason.length < 3)
      return { success: false, message: "اكتبي سبب الإيقاف." };
    if (userId === user.id)
      return { success: false, message: "لا يمكنك إيقاف حسابك أنتِ." };

    const admin = createAdminClient();

    const { data: profile } = await admin
      .from("profiles")
      .select("id,role,is_active")
      .eq("id", userId)
      .maybeSingle();

    if (!profile) return { success: false, message: "الحساب غير موجود." };
    if (String(profile.role) !== "student")
      return { success: false, message: "لا يمكن إيقاف حساب مشرف." };
    if (profile.is_active === false)
      return { success: false, message: "الحساب موقوف بالفعل." };

    const { data: count, error } = await admin.rpc("admin_suspend_account", {
      p_user: userId,
      p_reason: cleanReason,
      p_by: user.id,
    });

    if (error) {
      return {
        success: false,
        message: rpcMissing(error) ? NOT_READY : `تعذر الإيقاف: ${error.message}`,
      };
    }

    const { error: banError } = await admin.auth.admin.updateUserById(userId, {
      ban_duration: BAN_FOREVER,
    });

    if (banError) {
      // نتراجع حتى لا يبقى الحساب نصف موقوف.
      await admin.rpc("admin_restore_account", { p_user: userId, p_by: user.id });
      return {
        success: false,
        message: `تعذر منع تسجيل الدخول، فتم التراجع عن الإيقاف: ${banError.message}`,
      };
    }

    refresh();
    return {
      success: true,
      message: `تم إيقاف الحساب وإيقاف ${Number(count ?? 0)} اشتراك. لن يستطيع الدخول للمنصة.`,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

/** إعادة تفعيل الحساب: يعود كل شيء كما كان قبل الإيقاف. */
export async function reactivateStudentAccount(
  userId: string,
): Promise<SuspensionResult> {
  try {
    const { user } = await requireAdmin();
    if (!userId) return { success: false, message: "الطالب غير محدد." };

    const admin = createAdminClient();

    const { data: count, error } = await admin.rpc("admin_restore_account", {
      p_user: userId,
      p_by: user.id,
    });

    if (error) {
      return {
        success: false,
        message: rpcMissing(error) ? NOT_READY : `تعذرت إعادة التفعيل: ${error.message}`,
      };
    }

    const { error: unbanError } = await admin.auth.admin.updateUserById(userId, {
      ban_duration: "none",
    });

    if (unbanError) {
      return {
        success: false,
        message: `أُعيدت الاشتراكات لكن تعذر رفع منع الدخول: ${unbanError.message}. أعيدي المحاولة.`,
      };
    }

    refresh();
    return {
      success: true,
      message: `تمت إعادة تفعيل الحساب وأُعيد ${Number(count ?? 0)} اشتراك كما كان.`,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}
