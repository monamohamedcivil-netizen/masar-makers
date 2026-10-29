import "server-only";

import { createClient } from "@/lib/supabase/server";

/** true = the new pages (journeys by topic, new landing) are visible to admins only. */
export const JOURNEYS_PAGES_PREVIEW = true;

export async function isPreviewViewer() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;
    const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    return ["admin", "super_admin"].includes(String(data?.role ?? ""));
  } catch {
    return false;
  }
}
