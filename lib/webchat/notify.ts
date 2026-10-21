import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { notifyAdminDevices } from "@/lib/push/notify";

/**
 * Mona's notifications for the platform chat — only two moments:
 *   1) a student starts a chat (any platform button)
 *   2) a chat is handed off to WhatsApp (subscribe / customer support)
 * Sent as a phone push (if enabled) + an admin notification inside the platform. Never throws.
 */
export async function notifyWebChatAdmins(db: SupabaseClient, payload: { title: string; body: string; sessionId: string; tag: string }) {
  const url = `/admin/web-chat?session=${payload.sessionId}`;
  await notifyAdminDevices(db, { title: payload.title, body: payload.body.slice(0, 160), url, tag: payload.tag });
  try {
    const { data: admins } = await db.from("profiles").select("id").in("role", ["admin", "super_admin"]);
    const ids = (admins ?? []).map((a) => String(a.id));
    if (!ids.length) return;
    const { data: notification } = await db
      .from("notifications")
      .insert({ title: payload.title, body: payload.body.slice(0, 500), type: "admin_web_chat", action_url: url })
      .select("id")
      .single();
    if (notification) await db.from("notification_recipients").insert(ids.map((user_id) => ({ notification_id: notification.id, user_id })));
  } catch (error) {
    console.error("notifyWebChatAdmins failed:", error);
  }
}
