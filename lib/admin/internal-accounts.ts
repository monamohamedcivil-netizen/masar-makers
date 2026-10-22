import { createAdminClient } from "@/lib/supabase/server";

/*
 * حسابات داخلية (خاصة بالفريق) تُستخدم لتجربة المنصة كطلاب.
 *
 * هذه الحسابات تعمل كأي طالب عادي بالكامل (تقييم، مشاريع، سحب شهري...)،
 * لكنها لا تُحتسب في أرقام لوحة التحكم (عدد الطلاب والاشتراكات).
 *
 * لإضافة حساب أو حذفه: عدّلي هذه القائمة فقط (بأحرف صغيرة).
 */
export const INTERNAL_ACCOUNT_EMAILS: readonly string[] = [
  "mona.mohamed.civil@gmail.com",
  "mona_abdallah2013@hotmail.com",
  "mona.abdallah.civil@gmail.com",
  "mobility.makers.civil@gmail.com",
  "mino.moor22@gmail.com",
  "m.f.sherif@gmail.com",
];

/** معرّفات (user_id) الحسابات الداخلية، للاستبعاد من الإحصائيات فقط. */
export async function getInternalAccountUserIds(): Promise<string[]> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("profiles")
    .select("id,email")
    .in("email", [...INTERNAL_ACCOUNT_EMAILS]);

  if (error) {
    console.error("Failed to load internal accounts:", error.message);
    return [];
  }

  return (data ?? []).map((row) => String(row.id));
}

/** هل هذا البريد لحساب داخلي (فريق العمل)؟ */
export function isInternalEmail(email: unknown): boolean {
  const e = String(email ?? "").trim().toLowerCase();
  return e !== "" && INTERNAL_ACCOUNT_EMAILS.includes(e);
}
