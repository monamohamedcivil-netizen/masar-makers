import { createClient } from "@/lib/supabase/server";

/**
 * يتحقق أن المستدعي مسجل دخوله وأنه admin أو super_admin
 * بالاعتماد على جدول profiles فقط (مصدر موثوق على السيرفر).
 *
 * يجب استدعاؤها في أول كل Server Action إداري،
 * خصوصًا التي تستخدم createAdminClient (مفتاح service_role يتجاوز RLS).
 */
export async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("UNAUTHENTICATED");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (
    profileError ||
    !profile ||
    profile.is_active === false ||
    !["admin", "super_admin"].includes(String(profile.role))
  ) {
    throw new Error("FORBIDDEN");
  }

  return { supabase, user };
}
