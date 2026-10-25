"use server";

import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/server";

/* =========================================================
   Platform chat — admin actions (list, currency, follow-up, settings)
========================================================= */

type AnyRow = Record<string, any>;
type Result = { ok: true } | { ok: false; error: string };

export type WebChatRow = {
  id: string;
  code: string;
  source: string | null;
  createdAt: string;
  lastActivityAt: string | null;
  contactId: string | null;
  isMember: boolean;
  name: string | null;
  email: string | null;
  phone: string | null;
  course: string | null;
  currency: string | null;
  currencySetBy: string | null;
  lastPrice: string | null;
  handoffReason: string | null;
  handedOffAt: string | null;
  whatsappPhone: string | null;
  followupStatus: "none" | "active" | "closed";
  followupCount: number;
  followupNextAt: string | null;
  followupClosedReason: string | null;
  messageCount: number;
};

export type WebChatEntry = { key: string; label: string; text: string; active: boolean };
export type WebChatQuestion = { id: string; menu: string; label: string; visibility: "all" | "members" };
export type WebChatAdminData = {
  rows: WebChatRow[];
  currencies: { code: string; label: string }[];
  entries: WebChatEntry[];
  questions: WebChatQuestion[];
  followup: { everyDays: number; max: number; messages: string[] };
};

const MENU_LABELS: Record<string, string> = {
  main_menu: "القائمة الرئيسية",
  course_actions: "داخل الكورس",
  currency_menu: "العملات",
};

function errorText(error: unknown) {
  return error instanceof Error ? error.message : "خطأ غير متوقع.";
}

async function admin() {
  await requireAdmin();
  return createAdminClient();
}

function priceText(last: AnyRow | null) {
  if (!last || !Array.isArray(last.rows)) return null;
  return (last.rows as AnyRow[])
    .map((r) => `${r.variant ? `${r.variant}: ` : ""}${Number(r.amount).toLocaleString("en-US")} ${last.currencyLabel ?? last.currency}${r.offer ? ` (${r.offer})` : ""}`)
    .join(" • ");
}

export async function getWebChatAdmin(): Promise<WebChatAdminData> {
  const db = await admin();

  const { data: sessions } = await db.from("web_chat_sessions").select("*").order("updated_at", { ascending: false }).limit(400);
  // Silent ad chats (opened by the ad link, the visitor never pressed anything) are not listed.
  const list = ((sessions ?? []) as AnyRow[]).filter((s) => !s.context?.quiet).slice(0, 300);
  const contactIds = [...new Set(list.map((s) => s.contact_id).filter(Boolean))];
  const userIds = [...new Set(list.map((s) => s.user_id).filter(Boolean))];
  const courseIds = [...new Set(list.map((s) => s.current_course_id).filter(Boolean))];

  const [contacts, profiles, courses, prices, entries, items, settings] = await Promise.all([
    contactIds.length ? db.from("web_chat_contacts").select("*").in("id", contactIds) : Promise.resolve({ data: [] }),
    userIds.length ? db.from("profiles").select("id,full_name,email,phone").in("id", userIds) : Promise.resolve({ data: [] }),
    courseIds.length ? db.from("whatsapp_courses").select("id,title,whatsapp_label").in("id", courseIds) : Promise.resolve({ data: [] }),
    db.from("whatsapp_course_prices").select("currency_code,currency_label").eq("is_active", true),
    db.from("web_chat_entry_points").select("*").order("entry_key"),
    db.from("whatsapp_menu_items").select("id,label,web_visibility,is_active,sort_order,menu_id,whatsapp_menus!whatsapp_menu_items_menu_id_fkey(menu_key)").eq("is_active", true).order("sort_order"),
    db.from("web_chat_settings").select("*").eq("id", 1).maybeSingle(),
  ]);

  const contactMap = new Map(((contacts.data ?? []) as AnyRow[]).map((c) => [c.id, c]));
  const profileMap = new Map(((profiles.data ?? []) as AnyRow[]).map((p) => [p.id, p]));
  const courseMap = new Map(((courses.data ?? []) as AnyRow[]).map((c) => [c.id, c.whatsapp_label || c.title]));

  const currencies = new Map<string, string>();
  for (const p of (prices.data ?? []) as AnyRow[]) if (p.currency_code) currencies.set(String(p.currency_code).toUpperCase(), String(p.currency_label || p.currency_code));

  const rows: WebChatRow[] = list.map((s) => {
    const contact = s.contact_id ? contactMap.get(s.contact_id) : null;
    const profile = s.user_id ? profileMap.get(s.user_id) : null;
    return {
      id: s.id,
      code: s.code,
      source: s.source ?? null,
      createdAt: s.created_at,
      lastActivityAt: s.last_visitor_at ?? s.updated_at ?? null,
      contactId: s.contact_id ?? null,
      isMember: Boolean(s.user_id),
      name: profile?.full_name ?? null,
      email: profile?.email ?? null,
      phone: profile?.phone ?? s.whatsapp_phone ?? null,
      course: s.current_course_id ? courseMap.get(s.current_course_id) ?? null : null,
      currency: contact?.currency ?? null,
      currencySetBy: contact?.currency_set_by ?? null,
      lastPrice: priceText(s.last_price ?? null),
      handoffReason: s.handoff_reason ?? null,
      handedOffAt: s.handed_off_at ?? null,
      whatsappPhone: s.whatsapp_phone ?? null,
      followupStatus: s.followup_status ?? "none",
      followupCount: Number(s.followup_count ?? 0),
      followupNextAt: s.followup_next_at ?? null,
      followupClosedReason: s.followup_closed_reason ?? null,
      messageCount: Number(s.message_count ?? 0),
    };
  });

  const cfg = (settings.data ?? {}) as AnyRow;
  return {
    rows,
    currencies: [...currencies.entries()].map(([code, label]) => ({ code, label })),
    entries: ((entries.data ?? []) as AnyRow[]).map((e) => ({ key: e.entry_key, label: e.label, text: e.welcome_text, active: e.is_active !== false })),
    questions: ((items.data ?? []) as AnyRow[])
      .map((i) => ({ id: i.id, menu: String((i.whatsapp_menus as AnyRow | null)?.menu_key ?? ""), label: i.label, visibility: i.web_visibility === "members" ? "members" : "all" }) as WebChatQuestion)
      .filter((q) => q.menu in MENU_LABELS)
      .map((q) => ({ ...q, menu: MENU_LABELS[q.menu] })),
    followup: {
      everyDays: Number(cfg.followup_every_days ?? 3),
      max: Number(cfg.followup_max ?? 3),
      messages: Array.isArray(cfg.followup_messages) ? cfg.followup_messages : [],
    },
  };
}

export async function getWebChatTranscript(sessionId: string) {
  const db = await admin();
  const { data } = await db
    .from("web_chat_messages")
    .select("sender,body,created_at")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true })
    .limit(300);
  return ((data ?? []) as AnyRow[]).map((m) => ({ from: m.sender as "bot" | "visitor", text: String(m.body ?? ""), at: String(m.created_at) }));
}

export async function setWebChatFollowup(sessionId: string, status: "active" | "closed"): Promise<Result> {
  try {
    const db = await admin();
    const now = new Date();
    const { data: cfg } = await db.from("web_chat_settings").select("followup_every_days").eq("id", 1).maybeSingle();
    const days = Math.max(1, Number(cfg?.followup_every_days ?? 3));
    const patch =
      status === "closed"
        ? { followup_status: "closed", followup_closed_reason: "admin", followup_closed_at: now.toISOString(), followup_next_at: null }
        : { followup_status: "active", followup_count: 0, followup_closed_reason: null, followup_closed_at: null, followup_next_at: new Date(now.getTime() + days * 86400000).toISOString() };
    const { error } = await db.from("web_chat_sessions").update(patch).eq("id", sessionId);
    if (error) throw error;
    return { ok: true };
  } catch (error) {
    return { ok: false, error: errorText(error) };
  }
}

export async function setWebChatCurrency(contactId: string, currency: string | null): Promise<Result> {
  try {
    const db = await admin();
    const code = currency ? currency.trim().toUpperCase().slice(0, 8) : null;
    const now = new Date().toISOString();
    const { error } = await db
      .from("web_chat_contacts")
      .update({ currency: code, currency_set_at: code ? now : null, currency_set_by: code ? "admin" : null, updated_at: now })
      .eq("id", contactId);
    if (error) throw error;
    return { ok: true };
  } catch (error) {
    return { ok: false, error: errorText(error) };
  }
}

export async function saveWebChatEntry(key: string, text: string, active: boolean): Promise<Result> {
  try {
    const db = await admin();
    const body = text.trim().slice(0, 1500);
    if (!body) return { ok: false, error: "الرسالة فارغة." };
    const { error } = await db.from("web_chat_entry_points").update({ welcome_text: body, is_active: active, updated_at: new Date().toISOString() }).eq("entry_key", key);
    if (error) throw error;
    return { ok: true };
  } catch (error) {
    return { ok: false, error: errorText(error) };
  }
}

export async function setWebChatQuestionVisibility(itemId: string, visibility: "all" | "members"): Promise<Result> {
  try {
    const db = await admin();
    const { error } = await db.from("whatsapp_menu_items").update({ web_visibility: visibility === "members" ? "members" : "all" }).eq("id", itemId);
    if (error) throw error;
    return { ok: true };
  } catch (error) {
    return { ok: false, error: errorText(error) };
  }
}

export async function saveWebChatFollowupSettings(everyDays: number, max: number, messages: string[]): Promise<Result> {
  try {
    const db = await admin();
    const cleanMessages = messages.map((m) => m.trim().slice(0, 1000)).filter(Boolean);
    if (!cleanMessages.length) return { ok: false, error: "أضيفي رسالة متابعة واحدة على الأقل." };
    const { error } = await db
      .from("web_chat_settings")
      .update({
        followup_every_days: Math.min(30, Math.max(1, Math.round(everyDays))),
        followup_max: Math.min(10, Math.max(1, Math.round(max))),
        followup_messages: cleanMessages,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);
    if (error) throw error;
    return { ok: true };
  } catch (error) {
    return { ok: false, error: errorText(error) };
  }
}
