import "server-only";

import { createClient } from "@/lib/supabase/server";

export { JOURNEYS_PAGES_PREVIEW } from "@/lib/journeys/flags";

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
