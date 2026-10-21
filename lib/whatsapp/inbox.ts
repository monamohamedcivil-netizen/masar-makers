import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

/* =========================================================
   WhatsApp live inbox — shared helpers
   Used by the webhook (logging every message) and by the
   admin inbox actions (manual replies, bot on/off).
   All calls use the service-role client: whatsapp_messages
   is locked by RLS with no policies.
========================================================= */

type AnyRow = Record<string, any>;

export type InboxSender =
  | "customer"
  | "bot"
  | "admin"
  | "admin_phone";

const DEFAULT_HUMAN_HOURS = 24;

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function cut(value: string, max = 4000) {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

/** Readable text for an outgoing Cloud API payload (text, buttons, lists, media). */
export function describeOutgoingPayload(payload: AnyRow): string {
  const type = clean(payload?.type) || "text";

  if (type === "text") return clean(payload?.text?.body);

  if (type === "interactive") {
    const interactive = payload?.interactive ?? {};
    const parts: string[] = [];
    const header = clean(interactive?.header?.text);
    const body = clean(interactive?.body?.text);
    if (header) parts.push(header);
    if (body) parts.push(body);

    const buttons = (interactive?.action?.buttons ?? [])
      .map((button: AnyRow) => clean(button?.reply?.title))
      .filter(Boolean);
    if (buttons.length) parts.push(`[${buttons.join(" | ")}]`);

    const rows = (interactive?.action?.sections ?? [])
      .flatMap((section: AnyRow) => section?.rows ?? [])
      .map((row: AnyRow) => clean(row?.title))
      .filter(Boolean);
    if (rows.length) parts.push(`[قائمة: ${rows.join(" | ")}]`);

    if (interactive?.type === "cta_url") {
      const url = clean(interactive?.action?.parameters?.url);
      if (url) parts.push(url);
    }

    return parts.join("\n");
  }

  const media = payload?.[type];
  const caption = clean(media?.caption);
  const link = clean(media?.link);
  return [`[${type}]`, caption, link].filter(Boolean).join(" ");
}

/** Readable text for an incoming (or echoed) WhatsApp message object. */
export function describeIncomingMessage(message: AnyRow): string {
  const type = clean(message?.type);

  switch (type) {
    case "text":
      return clean(message?.text?.body);
    case "interactive":
      return clean(
        message?.interactive?.button_reply?.title ??
          message?.interactive?.list_reply?.title,
      ) || "[اختيار من القائمة]";
    case "button":
      return clean(message?.button?.text) || "[زر]";
    case "image":
    case "video":
    case "document":
    case "audio":
    case "sticker": {
      const caption = clean(message?.[type]?.caption);
      const fileName = clean(message?.[type]?.filename);
      const label =
        { image: "صورة", video: "فيديو", document: "ملف", audio: "رسالة صوتية", sticker: "ملصق" }[type] ??
        type;
      return [`[${label}]`, fileName, caption].filter(Boolean).join(" ");
    }
    case "location":
      return "[موقع]";
    case "contacts":
      return "[جهة اتصال]";
    case "reaction":
      return `[تفاعل ${clean(message?.reaction?.emoji)}]`;
    default:
      return type ? `[${type}]` : "[رسالة]";
  }
}

async function touchSession(
  supabase: SupabaseClient,
  phone: string,
  patch: AnyRow,
) {
  const { data: existing } = await supabase
    .from("whatsapp_bot_sessions")
    .select("phone")
    .eq("phone", phone)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("whatsapp_bot_sessions")
      .update(patch)
      .eq("phone", phone);
    return;
  }

  await supabase
    .from("whatsapp_bot_sessions")
    .insert({ phone, mode: "bot", current_menu_key: "main_menu", ...patch });
}

/** Store an incoming customer message. Never throws (logging must not break the bot). */
export async function logIncomingMessage(
  supabase: SupabaseClient,
  message: AnyRow,
  contactName?: string | null,
) {
  try {
    const phone = clean(message?.from);
    if (!phone) return;

    const timestamp = Number(message?.timestamp);
    const createdAt = Number.isFinite(timestamp) && timestamp > 0
      ? new Date(timestamp * 1000).toISOString()
      : new Date().toISOString();

    const { error } = await supabase.from("whatsapp_messages").upsert(
      {
        phone,
        direction: "in",
        sender: "customer",
        message_type: clean(message?.type) || "text",
        body: cut(describeIncomingMessage(message)),
        wa_message_id: clean(message?.id) || null,
        raw: message,
        created_at: createdAt,
      },
      { onConflict: "wa_message_id", ignoreDuplicates: true },
    );
    if (error) throw error;

    const patch: AnyRow = {
      last_inbound_at: createdAt,
      last_message_at: createdAt,
    };
    if (clean(contactName)) patch.contact_name = clean(contactName);

    await touchSession(supabase, phone, patch);
  } catch (error) {
    console.error("Could not log incoming WhatsApp message:", error);
  }
}

/** Store an outgoing message sent through the Cloud API (bot or admin). Never throws. */
export async function logOutgoingMessage(
  supabase: SupabaseClient,
  options: {
    payload: AnyRow;
    response?: AnyRow | null;
    sender: Extract<InboxSender, "bot" | "admin">;
    sentBy?: string | null;
  },
) {
  try {
    const phone = clean(options.payload?.to);
    if (!phone) return;

    const now = new Date().toISOString();
    const { error } = await supabase.from("whatsapp_messages").insert({
      phone,
      direction: "out",
      sender: options.sender,
      message_type: clean(options.payload?.type) || "text",
      body: cut(describeOutgoingPayload(options.payload)),
      wa_message_id: clean(options.response?.messages?.[0]?.id) || null,
      status: "sent",
      sent_by: options.sentBy ?? null,
      raw: options.payload,
      created_at: now,
    });
    if (error) throw error;

    await touchSession(supabase, phone, { last_message_at: now });
  } catch (error) {
    console.error("Could not log outgoing WhatsApp message:", error);
  }
}

/** Delivery / read / failed callbacks. Never throws. */
export async function applyStatusUpdate(
  supabase: SupabaseClient,
  status: AnyRow,
) {
  try {
    const id = clean(status?.id);
    const value = clean(status?.status);
    if (!id || !value) return;

    const errorText = (status?.errors ?? [])
      .map((item: AnyRow) => clean(item?.title ?? item?.message))
      .filter(Boolean)
      .join(" | ");

    await supabase
      .from("whatsapp_messages")
      .update({ status: value, status_error: errorText || null })
      .eq("wa_message_id", id);
  } catch (error) {
    console.error("Could not apply WhatsApp status update:", error);
  }
}

export function humanModeHours(settings: AnyRow | null | undefined) {
  const value = Number(
    settings?.human_mode_hours ?? settings?.human_mode_hour ?? DEFAULT_HUMAN_HOURS,
  );
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_HUMAN_HOURS;
}

/** Pause the bot for one customer (Mona took over). Silent: sends nothing to the customer. */
export async function pauseBotForCustomer(
  supabase: SupabaseClient,
  phone: string,
  hours: number,
) {
  const until = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
  await touchSession(supabase, phone, {
    mode: "human",
    current_menu_key: "human_support",
    human_mode_until: until,
    updated_at: new Date().toISOString(),
  });
  return until;
}

/** Give the conversation back to the bot. */
export async function resumeBotForCustomer(
  supabase: SupabaseClient,
  phone: string,
) {
  await touchSession(supabase, phone, {
    mode: "bot",
    current_menu_key: "main_menu",
    current_course_id: null,
    current_variant_id: null,
    current_track: null,
    human_mode_until: null,
    updated_at: new Date().toISOString(),
  });
}

/**
 * Coexistence echoes: a message Mona sent from the WhatsApp Business app on her
 * phone. Log it and pause the bot for that customer so it never talks over her.
 * Webhook field: "smb_message_echoes" → value.message_echoes[] ({ from: business, to: customer, ... }).
 */
export async function handleBusinessAppEcho(
  supabase: SupabaseClient,
  echo: AnyRow,
  settings: AnyRow | null,
) {
  try {
    const phone = clean(echo?.to);
    if (!phone) return;

    const timestamp = Number(echo?.timestamp);
    const createdAt = Number.isFinite(timestamp) && timestamp > 0
      ? new Date(timestamp * 1000).toISOString()
      : new Date().toISOString();

    await supabase.from("whatsapp_messages").upsert(
      {
        phone,
        direction: "out",
        sender: "admin_phone",
        message_type: clean(echo?.type) || "text",
        body: cut(describeIncomingMessage(echo)),
        wa_message_id: clean(echo?.id) || null,
        status: "sent",
        raw: echo,
        created_at: createdAt,
      },
      { onConflict: "wa_message_id", ignoreDuplicates: true },
    );

    await touchSession(supabase, phone, { last_message_at: createdAt });
    await pauseBotForCustomer(supabase, phone, humanModeHours(settings));
  } catch (error) {
    console.error("Could not handle WhatsApp business-app echo:", error);
  }
}

/** Collect echoes from a webhook body. */
export function getBusinessAppEchoes(body: AnyRow) {
  const output: AnyRow[] = [];
  for (const entry of body?.entry ?? []) {
    for (const change of entry?.changes ?? []) {
      if (change?.field !== "smb_message_echoes") continue;
      for (const echo of change?.value?.message_echoes ?? []) output.push(echo);
    }
  }
  return output;
}

/** wa_id → profile name, from webhook "contacts". */
export function getContactNames(body: AnyRow) {
  const names = new Map<string, string>();
  for (const entry of body?.entry ?? []) {
    for (const change of entry?.changes ?? []) {
      for (const contact of change?.value?.contacts ?? []) {
        const id = clean(contact?.wa_id);
        const name = clean(contact?.profile?.name);
        if (id && name) names.set(id, name);
      }
    }
  }
  return names;
}
