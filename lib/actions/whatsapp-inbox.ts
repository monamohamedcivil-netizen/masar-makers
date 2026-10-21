"use server";

import { createAdminClient, createClient } from "@/lib/supabase/server";
import {
  humanModeHours,
  logOutgoingMessage,
  pauseBotForCustomer,
  resumeBotForCustomer,
} from "@/lib/whatsapp/inbox";
import { getQuotaState, type QuotaState } from "@/lib/whatsapp/quota";
import { botMode, digits } from "@/lib/whatsapp/routing";

/* =========================================================
   WhatsApp live inbox — admin server actions
========================================================= */

type AnyRow = Record<string, any>;
type Result = { ok: true } | { ok: false; error: string };

export type InboxConversation = {
  phone: string;
  contactName: string | null;
  mode: "bot" | "human";
  humanModeUntil: string | null;
  alwaysHuman: boolean;
  botForced: boolean;
  lastMessageAt: string | null;
  lastInboundAt: string | null;
  lastMessage: string | null;
  lastSender: string | null;
  unread: number;
  windowOpen: boolean;
};

export type InboxMessage = {
  id: string;
  direction: "in" | "out";
  sender: "customer" | "bot" | "admin" | "admin_phone";
  body: string | null;
  status: string | null;
  statusError: string | null;
  createdAt: string;
};

export type InboxRouting = {
  mode: "off" | "test" | "live";
  testNumbers: string[];
  knownNumbers: string[];
};

export type InboxSnapshot = {
  botEnabled: boolean;
  humanHours: number;
  quota: QuotaState | null;
  routing: InboxRouting;
  conversations: InboxConversation[];
};

const SERVICE_WINDOW_MS = 24 * 60 * 60 * 1000;
const MAX_REPLY_LENGTH = 4000;

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("غير مصرح.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!["admin", "super_admin"].includes(String(profile?.role))) {
    throw new Error("هذه العملية للإدارة فقط.");
  }

  return { userId: user.id, db: createAdminClient() };
}

function cleanPhone(value: unknown) {
  return digits(value);
}

function errorText(error: unknown) {
  return error instanceof Error ? error.message : "خطأ غير متوقع.";
}

function isHumanActive(session: AnyRow) {
  if (session?.mode !== "human") return false;
  if (!session?.human_mode_until) return true;
  return new Date(session.human_mode_until).getTime() > Date.now();
}

function windowOpen(lastInboundAt: string | null) {
  if (!lastInboundAt) return false;
  return Date.now() - new Date(lastInboundAt).getTime() < SERVICE_WINDOW_MS;
}

async function getSettings(db: ReturnType<typeof createAdminClient>) {
  const { data } = await db
    .from("whatsapp_bot_settings")
    .select("*")
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle();
  return (data ?? null) as AnyRow | null;
}

function parseNumbers(text: string) {
  const out = new Set<string>();
  for (const part of String(text ?? "").split(/[\s,;،\n]+/)) {
    const d = digits(part);
    if (d.length >= 9 && d.length <= 15) out.add(d);
  }
  return [...out];
}

/** Send a Cloud API message, log it, respect the free tier. */
async function sendCloudMessage(
  db: ReturnType<typeof createAdminClient>,
  payload: AnyRow,
  sender: "bot" | "admin",
  sentBy: string | null,
): Promise<Result> {
  const settings = await getSettings(db);
  const quota = await getQuotaState(db, settings).catch(() => null);
  if (quota?.hardLimitReached) {
    return {
      ok: false,
      error: `تم استهلاك الرسائل المجانية لهذا الشهر (${quota.used}/${quota.free}). الإرسال الآن سيُحاسب من Meta، لذلك تم إيقافه حتى بداية الشهر القادم.`,
    };
  }

  const token = (process.env.WHATSAPP_ACCESS_TOKEN ?? "").trim();
  const phoneNumberId = (process.env.WHATSAPP_PHONE_NUMBER_ID ?? "").trim();
  const versionMatch = (process.env.WHATSAPP_GRAPH_VERSION ?? "").trim().match(/v?\d+\.\d+/i);
  const version = versionMatch
    ? versionMatch[0].toLowerCase().startsWith("v") ? versionMatch[0] : `v${versionMatch[0]}`
    : "";
  if (!token || !phoneNumberId || !version) {
    return { ok: false, error: "إعدادات WhatsApp API ناقصة على الخادم." };
  }

  const body = { messaging_product: "whatsapp", ...payload };
  const response = await fetch(`https://graph.facebook.com/${version}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    console.error("WhatsApp send from inbox failed:", data);
    return { ok: false, error: `لم يتم الإرسال: ${data?.error?.message ?? response.status}` };
  }

  await logOutgoingMessage(db, { payload: body, response: data, sender, sentBy });
  return { ok: true };
}

/* ---------- Conversation list (polled by the inbox page) ---------- */

export async function getInboxSnapshot(): Promise<InboxSnapshot> {
  const { db } = await requireAdmin();
  const settings = await getSettings(db);

  const { data: sessions, error } = await db
    .from("whatsapp_bot_sessions")
    .select("*")
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .limit(150);
  if (error) throw error;

  const phones = (sessions ?? []).map((session) => session.phone);

  const { data: recent } = phones.length
    ? await db
        .from("whatsapp_messages")
        .select("phone, body, sender, direction, created_at")
        .in("phone", phones)
        .order("created_at", { ascending: false })
        .limit(1500)
    : { data: [] as AnyRow[] };

  const lastByPhone = new Map<string, AnyRow>();
  const inboundTimes = new Map<string, string[]>();
  for (const message of recent ?? []) {
    if (!lastByPhone.has(message.phone)) lastByPhone.set(message.phone, message);
    if (message.direction === "in") {
      const list = inboundTimes.get(message.phone) ?? [];
      list.push(message.created_at);
      inboundTimes.set(message.phone, list);
    }
  }

  const conversations: InboxConversation[] = (sessions ?? []).map((session) => {
    const last = lastByPhone.get(session.phone);
    const readAt = session.admin_last_read_at ? new Date(session.admin_last_read_at).getTime() : 0;
    const unread = (inboundTimes.get(session.phone) ?? []).filter((time) => new Date(time).getTime() > readAt).length;
    const human = isHumanActive(session) || (!!session.always_human && !session.bot_forced);

    return {
      phone: session.phone,
      contactName: session.contact_name ?? null,
      mode: human ? "human" : "bot",
      humanModeUntil: isHumanActive(session) ? session.human_mode_until ?? null : null,
      alwaysHuman: !!session.always_human,
      botForced: !!session.bot_forced,
      lastMessageAt: session.last_message_at ?? session.updated_at ?? null,
      lastInboundAt: session.last_inbound_at ?? null,
      lastMessage: last?.body ?? null,
      lastSender: last?.sender ?? null,
      unread,
      windowOpen: windowOpen(session.last_inbound_at ?? null),
    };
  });

  const quota = await getQuotaState(db, settings).catch(() => null);

  return {
    botEnabled: settings?.bot_enabled !== false,
    humanHours: humanModeHours(settings),
    quota,
    routing: {
      mode: botMode(settings),
      testNumbers: Array.isArray(settings?.test_numbers) ? settings.test_numbers : [],
      knownNumbers: Array.isArray(settings?.known_numbers) ? settings.known_numbers : [],
    },
    conversations,
  };
}

/* ---------- One conversation ---------- */

export async function getConversationMessages(phoneInput: string): Promise<InboxMessage[]> {
  const { db } = await requireAdmin();
  const phone = cleanPhone(phoneInput);
  if (!phone) return [];

  const { data, error } = await db
    .from("whatsapp_messages")
    .select("id, direction, sender, body, status, status_error, created_at")
    .eq("phone", phone)
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) throw error;

  await db.from("whatsapp_bot_sessions").update({ admin_last_read_at: new Date().toISOString() }).eq("phone", phone);

  return (data ?? []).reverse().map((row) => ({
    id: row.id,
    direction: row.direction,
    sender: row.sender,
    body: row.body,
    status: row.status,
    statusError: row.status_error,
    createdAt: row.created_at,
  }));
}

/* ---------- Manual reply from the platform ---------- */

export async function sendAdminReply(phoneInput: string, textInput: string): Promise<Result> {
  try {
    const { db, userId } = await requireAdmin();
    const phone = cleanPhone(phoneInput);
    const text = String(textInput ?? "").trim();

    if (!phone) return { ok: false, error: "رقم غير صالح." };
    if (!text) return { ok: false, error: "اكتبي نص الرد أولًا." };
    if (text.length > MAX_REPLY_LENGTH) return { ok: false, error: `الرد أطول من ${MAX_REPLY_LENGTH} حرف.` };

    const { data: session } = await db.from("whatsapp_bot_sessions").select("last_inbound_at").eq("phone", phone).maybeSingle();
    if (!windowOpen(session?.last_inbound_at ?? null)) {
      return {
        ok: false,
        error: "مرّ أكثر من 24 ساعة على آخر رسالة من العميل، وواتساب لا يسمح بالرد الحر بعدها إلا برسالة قالب (Template) معتمدة من Meta.",
      };
    }

    const result = await sendCloudMessage(db, { to: phone, type: "text", text: { preview_url: true, body: text } }, "admin", userId);
    if (!result.ok) return result;

    // Mona is talking to this customer now → bot stays silent for them.
    const settings = await getSettings(db);
    await pauseBotForCustomer(db, phone, humanModeHours(settings));
    await db.from("whatsapp_bot_sessions").update({ bot_forced: false }).eq("phone", phone);
    return { ok: true };
  } catch (error) {
    console.error("sendAdminReply error:", error);
    return { ok: false, error: errorText(error) };
  }
}

/* ---------- Who answers this conversation: the bot or Mona ---------- */

export async function setConversationMode(
  phoneInput: string,
  mode: "bot" | "human",
  options: { sendMenu?: boolean } = {},
): Promise<Result> {
  try {
    const { db } = await requireAdmin();
    const phone = cleanPhone(phoneInput);
    if (!phone) return { ok: false, error: "رقم غير صالح." };

    if (mode === "bot") {
      // Hand the conversation to the bot (works for known contacts and in test mode too).
      await resumeBotForCustomer(db, phone);
      await db.from("whatsapp_bot_sessions").update({ bot_forced: true }).eq("phone", phone);

      if (options.sendMenu) {
        const { data: session } = await db.from("whatsapp_bot_sessions").select("last_inbound_at").eq("phone", phone).maybeSingle();
        if (windowOpen(session?.last_inbound_at ?? null)) {
          const sent = await sendCloudMessage(
            db,
            {
              to: phone,
              type: "interactive",
              interactive: {
                type: "button",
                body: { text: "تقدر تختار استفسارك من القائمة، وهيرد عليك المساعد الآلي فورًا 👇" },
                action: { buttons: [{ type: "reply", reply: { id: "show_main_menu", title: "📋 عرض القائمة" } }] },
              },
            },
            "bot",
            null,
          );
          if (!sent.ok) return sent;
        }
      }
    } else {
      const settings = await getSettings(db);
      await pauseBotForCustomer(db, phone, humanModeHours(settings));
      await db.from("whatsapp_bot_sessions").update({ bot_forced: false }).eq("phone", phone);
    }

    return { ok: true };
  } catch (error) {
    return { ok: false, error: errorText(error) };
  }
}

/** Known contact = Mona always answers; the bot never replies automatically. */
export async function setKnownContact(phoneInput: string, known: boolean): Promise<Result> {
  try {
    const { db } = await requireAdmin();
    const phone = cleanPhone(phoneInput);
    if (!phone) return { ok: false, error: "رقم غير صالح." };
    await db.from("whatsapp_bot_sessions").update({ always_human: known, bot_forced: false }).eq("phone", phone);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: errorText(error) };
  }
}

/* ---------- Bot routing settings ---------- */

export async function updateRouting(input: {
  mode: "off" | "test" | "live";
  testNumbers: string;
  knownNumbers: string;
}): Promise<Result> {
  try {
    const { db } = await requireAdmin();
    const settings = await getSettings(db);
    const mode = ["off", "test", "live"].includes(input.mode) ? input.mode : "test";
    const known = parseNumbers(input.knownNumbers);

    const { error } = await db
      .from("whatsapp_bot_settings")
      .update({ bot_mode: mode, test_numbers: parseNumbers(input.testNumbers), known_numbers: known, updated_at: new Date().toISOString() })
      .eq("id", settings?.id ?? 1);
    if (error) throw error;

    // Existing conversations from known numbers: mark them now.
    if (known.length) {
      const { data: sessions } = await db.from("whatsapp_bot_sessions").select("phone, always_human");
      const tails = new Set(known.map((n) => n.slice(-9)));
      const match = (sessions ?? []).filter((s) => !s.always_human && tails.has(digits(s.phone).slice(-9))).map((s) => s.phone);
      if (match.length) await db.from("whatsapp_bot_sessions").update({ always_human: true }).in("phone", match);
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, error: errorText(error) };
  }
}

/* ---------- Phone notifications (Web Push) ---------- */

export async function savePushSubscription(sub: { endpoint: string; p256dh: string; auth: string; userAgent?: string }): Promise<Result> {
  try {
    const { db, userId } = await requireAdmin();
    if (!sub?.endpoint?.startsWith("https://") || !sub.p256dh || !sub.auth) return { ok: false, error: "اشتراك غير صالح." };
    const { error } = await db.from("push_subscriptions").upsert(
      { user_id: userId, endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth, user_agent: (sub.userAgent ?? "").slice(0, 300) },
      { onConflict: "endpoint" },
    );
    if (error) throw error;
    return { ok: true };
  } catch (error) {
    return { ok: false, error: errorText(error) };
  }
}

export async function removePushSubscription(endpoint: string): Promise<Result> {
  try {
    const { db } = await requireAdmin();
    await db.from("push_subscriptions").delete().eq("endpoint", String(endpoint ?? ""));
    return { ok: true };
  } catch (error) {
    return { ok: false, error: errorText(error) };
  }
}
