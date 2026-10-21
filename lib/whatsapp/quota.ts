import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { resend } from "@/lib/email/resend";

/* =========================================================
   WhatsApp free-tier guard
   Meta: the first 1,000 service messages per phone number per
   month are free (since 1 Oct 2026); after that every message is
   charged. Masar Makers never pays for these, so:
   - at `quota_warn_at` (default 800)  → platform + email warning
   - at `quota_stop_at` (default 980)  → bot stops auto-replying for
     the rest of the month + platform + email alert
   - at `quota_monthly_free` (1000)    → platform replies blocked too
   Replies sent from the WhatsApp Business app (coexistence echoes)
   are free and are not counted.
   The counter resets automatically on the 1st of each month (UTC).
========================================================= */

type AnyRow = Record<string, any>;

export type QuotaState = {
  month: string;
  used: number;
  free: number;
  warnAt: number;
  stopAt: number;
  botPaused: boolean;
  hardLimitReached: boolean;
};

export function quotaMonth(date = new Date()) {
  return date.toISOString().slice(0, 7); // YYYY-MM (UTC, as Meta bills)
}

function monthStartIso(month: string) {
  return `${month}-01T00:00:00.000Z`;
}

function num(value: unknown, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export async function countChargeableMessages(supabase: SupabaseClient, month = quotaMonth()) {
  const { count, error } = await supabase
    .from("whatsapp_messages")
    .select("id", { count: "exact", head: true })
    .eq("direction", "out")
    .in("sender", ["bot", "admin"])
    .gte("created_at", monthStartIso(month))
    .or("status.is.null,status.neq.failed");
  if (error) throw error;
  return count ?? 0;
}

export async function getQuotaState(supabase: SupabaseClient, settings: AnyRow | null): Promise<QuotaState> {
  const month = quotaMonth();
  const used = await countChargeableMessages(supabase, month);
  const free = num(settings?.quota_monthly_free, 1000);
  const warnAt = num(settings?.quota_warn_at, 800);
  const stopAt = Math.min(num(settings?.quota_stop_at, 980), free);
  return {
    month,
    used,
    free,
    warnAt,
    stopAt,
    botPaused: settings?.quota_paused_month === month || used >= stopAt,
    hardLimitReached: used >= free,
  };
}

async function adminRecipients(supabase: SupabaseClient) {
  const { data } = await supabase
    .from("profiles")
    .select("id, email")
    .in("role", ["admin", "super_admin"]);
  return (data ?? []) as { id: string; email: string | null }[];
}

async function alertAdmins(
  supabase: SupabaseClient,
  { title, body, subject }: { title: string; body: string; subject: string },
) {
  const admins = await adminRecipients(supabase);

  // 1) platform notification
  try {
    const { data: notification } = await supabase
      .from("notifications")
      .insert({ title, body, type: "admin_whatsapp_quota", action_url: "/admin/whatsapp-inbox" })
      .select("id")
      .single();
    if (notification && admins.length) {
      await supabase.from("notification_recipients").insert(
        admins.map((admin) => ({ notification_id: notification.id, user_id: admin.id, is_read: false, read_at: null })),
      );
    }
  } catch (error) {
    console.error("WhatsApp quota: platform notification failed", error);
  }

  // 2) email
  const emails = admins.map((a) => (a.email ?? "").trim()).filter((e) => /^\S+@\S+\.\S+$/.test(e));
  if (!emails.length || !process.env.RESEND_API_KEY) return;
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://masarmakers.com";
    await resend.emails.send({
      from: "Masar Makers <notifications@masarmakers.com>",
      to: emails,
      subject,
      html: `<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;font-size:15px;line-height:1.8;color:#07152E">
        <h2 style="margin:0 0 12px">${title}</h2>
        <p style="white-space:pre-line">${body}</p>
        <p><a href="${appUrl}/admin/whatsapp-inbox" style="background:#F7B548;color:#07152E;padding:10px 18px;border-radius:999px;text-decoration:none;font-weight:bold">فتح صندوق واتساب</a></p>
      </div>`,
    });
  } catch (error) {
    console.error("WhatsApp quota: email failed", error);
  }
}

/**
 * Called on every webhook batch that may trigger bot replies.
 * Sends each alert once per month and records the pause in settings.
 * Returns the current state; never throws.
 */
export async function enforceQuota(supabase: SupabaseClient, settings: AnyRow | null): Promise<QuotaState | null> {
  try {
    const state = await getQuotaState(supabase, settings);
    const id = settings?.id ?? 1;

    if (state.used >= state.warnAt && settings?.quota_warned_month !== state.month) {
      await supabase.from("whatsapp_bot_settings").update({ quota_warned_month: state.month }).eq("id", id);
      await alertAdmins(supabase, {
        title: `⚠️ رسائل واتساب: ${state.used} من ${state.free} رسالة مجانية هذا الشهر`,
        subject: `تنبيه: اقتربنا من حد رسائل واتساب المجانية (${state.used}/${state.free})`,
        body: `وصل عدد رسائل الرد (البوت + ردود المنصة) هذا الشهر إلى ${state.used} رسالة.\nالحد المجاني من Meta هو ${state.free} رسالة شهريًا.\nعند ${state.stopAt} رسالة سيتوقف الرد الآلي تلقائيًا حتى بداية الشهر القادم، حتى لا يتم أي دفع.`,
      });
    }

    if (state.used >= state.stopAt && settings?.quota_paused_month !== state.month) {
      await supabase.from("whatsapp_bot_settings").update({ quota_paused_month: state.month }).eq("id", id);
      await alertAdmins(supabase, {
        title: "⛔ تم إيقاف الرد الآلي على واتساب",
        subject: "تم إيقاف الرد الآلي على واتساب — وصلنا للحد المجاني",
        body: `وصل عدد الرسائل هذا الشهر إلى ${state.used} من ${state.free} رسالة مجانية، فتم إيقاف الرد الآلي تلقائيًا لتجنب أي رسوم.\nالرسائل الجديدة تصل وتظهر في صندوق واتساب، ويمكنك الرد عليها من تطبيق واتساب على الجوال.\nيعود الرد الآلي تلقائيًا في أول الشهر القادم.`,
      });
    }

    return state;
  } catch (error) {
    console.error("WhatsApp quota check failed:", error);
    return null;
  }
}
