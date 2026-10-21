import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { sendWebPush, vapidConfigured } from "@/lib/push/webpush";

/** Push a notification to every admin device that enabled notifications. Never throws. */
export async function notifyAdminDevices(
  supabase: SupabaseClient,
  payload: { title: string; body: string; url: string; tag?: string },
) {
  if (!vapidConfigured()) return;
  try {
    const { data: subs } = await supabase.from("push_subscriptions").select("id, endpoint, p256dh, auth");
    await Promise.all(
      (subs ?? []).map(async (sub) => {
        try {
          const status = await sendWebPush(sub, payload);
          if (status === 404 || status === 410) {
            await supabase.from("push_subscriptions").delete().eq("id", sub.id); // expired subscription
          } else if (status >= 200 && status < 300) {
            await supabase.from("push_subscriptions").update({ last_success_at: new Date().toISOString() }).eq("id", sub.id);
          } else {
            console.error("Web push rejected:", status, sub.endpoint.slice(0, 60));
          }
        } catch (error) {
          console.error("Web push failed:", error);
        }
      }),
    );
  } catch (error) {
    console.error("notifyAdminDevices failed:", error);
  }
}
