"use server";

import { randomBytes } from "crypto";
import { headers } from "next/headers";

import { createAdminClient, createClient } from "@/lib/supabase/server";
import { WebChatEngine, type ChatButton, type ChatMessage, type Locale } from "@/lib/webchat/engine";
import { isBotUserAgent } from "@/lib/webchat/bots";
import { notifyWebChatAdmins } from "@/lib/webchat/notify";

/* =========================================================
   Website chat — public server actions (visitors may be anonymous).
   Each session has a secret token kept in the visitor's browser;
   a logged-in student can also reopen his own sessions (follow-up links).
========================================================= */

type AnyRow = Record<string, any>;
type Db = ReturnType<typeof createAdminClient>;

export type WebChatContext = {
  source?: string;        // contact | course_action | enrollment | launcher | restart
  text?: string;          // what the visitor "asked" (shown as his first bubble)
  courseHint?: string;    // course title/code from the page
  actionLabel?: string;   // label of the platform button
  journeyLabel?: string;  // journey type for enrollment buttons
  journeyType?: string;   // journey type key (workshop = one-day journey → one-day prices)
  lessonId?: string;      // one-day lecture the button was for (its special price, if any)
  requestNumber?: string; // enrollment request number
  page?: string;          // page path (to come back after login)
  visitorId?: string;     // anonymous browser id
  announcementId?: string; // platform announcement whose button opened the chat
  locale?: string;        // "ar" | "en" — the platform language
};

const toLocale = (v: unknown): Locale => (String(v ?? "").toLowerCase().startsWith("en") ? "en" : "ar");

/** Remember the chat language on the session (used by the scheduled follow-ups). Ignored if the column is not there yet. */
async function saveLocale(db: Db, session: AnyRow, locale: Locale) {
  if (session.locale === locale) return;
  const { error } = await db.from("web_chat_sessions").update({ locale }).eq("id", session.id);
  if (!error) session.locale = locale;
}

export type WebChatStart = { ok: true; sessionId: string; token: string; code: string; messages: ChatMessage[] } | { ok: false; error: string };
export type WebChatReply = { ok: true; messages: ChatMessage[] } | { ok: false; error: string };
export type WebChatLoad =
  | { ok: true; sessionId: string; token: string; code: string; messages: ChatMessage[]; hasUnseen: boolean }
  | { ok: false; error: string };

const MAX_MESSAGES_PER_SESSION = 300;
const ENTRY_KEYS = new Set(["contact", "course_action", "enrollment", "launcher", "announcement", "ad"]);
const cut = (v: unknown, n: number) => String(v ?? "").trim().slice(0, n);

function newCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(5);
  return "MM-" + [...bytes].map((b) => alphabet[b % alphabet.length]).join("");
}

async function currentUserId() {
  try {
    const auth = await createClient();
    return (await auth.auth.getUser()).data.user?.id ?? null;
  } catch {
    return null;
  }
}

/** Currency the student already paid with (payments table) — used only when his chat currency is empty. */
async function paidCurrency(db: Db, userId: string) {
  const { data } = await db
    .from("finance_payments")
    .select("currency")
    .eq("user_id", userId)
    .not("currency", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return cut(data?.currency, 8).toUpperCase() || null;
}

/**
 * Saudi student → SAR, only if SAR prices are enabled.
 * Saudi = profile country is Saudi Arabia OR his phone is a Saudi number (+966 / 00966 / 966).
 */
async function countryCurrency(db: Db, userId: string) {
  const { data } = await db.from("profiles").select("country,phone").eq("id", userId).maybeSingle();
  const country = String(data?.country ?? "").trim().toLowerCase();
  const saudiCountry = ["saudi arabia", "saudi", "ksa", "السعودية", "المملكة العربية السعودية"].includes(country);
  const digits = String(data?.phone ?? "").replace(/[^0-9]/g, "").replace(/^00/, "");
  const saudiPhone = /^9665\d{8}$/.test(digits) || /^966\d{9}$/.test(digits);
  if (!saudiCountry && !saudiPhone) return null;
  const { count } = await db
    .from("whatsapp_course_prices")
    .select("id", { count: "exact", head: true })
    .eq("currency_code", "SAR")
    .eq("is_active", true);
  return (count ?? 0) > 0 ? "SAR" : null;
}

/** One contact per student (user) or per anonymous browser; merges the browser into the user after login. */
async function resolveContact(db: Db, userId: string | null, visitorId: string | null): Promise<AnyRow | null> {
  const now = new Date().toISOString();
  let byUser: AnyRow | null = null;
  let byVisitor: AnyRow | null = null;
  if (userId) byUser = (await db.from("web_chat_contacts").select("*").eq("user_id", userId).maybeSingle()).data;
  if (visitorId) byVisitor = (await db.from("web_chat_contacts").select("*").eq("visitor_id", visitorId).maybeSingle()).data;

  let contact: AnyRow | null = byUser ?? null;
  if (userId) {
    if (!contact && byVisitor && !byVisitor.user_id) {
      contact = (await db.from("web_chat_contacts").update({ user_id: userId, updated_at: now }).eq("id", byVisitor.id).select("*").single()).data;
    } else if (!contact) {
      contact = (await db.from("web_chat_contacts").insert({ user_id: userId, visitor_id: byVisitor ? null : visitorId }).select("*").single()).data;
    } else if (byVisitor && byVisitor.id !== contact.id && !contact.currency && byVisitor.currency) {
      contact = (
        await db
          .from("web_chat_contacts")
          .update({ currency: byVisitor.currency, currency_set_at: byVisitor.currency_set_at, currency_set_by: byVisitor.currency_set_by, updated_at: now })
          .eq("id", contact.id)
          .select("*")
          .single()
      ).data;
    }
    // Paid before? → use that currency, and never ask.
    if (contact && !contact.currency) {
      const paid = await paidCurrency(db, userId);
      if (paid) {
        contact = (
          await db.from("web_chat_contacts").update({ currency: paid, currency_set_at: now, currency_set_by: "payments", updated_at: now }).eq("id", contact.id).select("*").single()
        ).data;
      } else if (await countryCurrency(db, userId) === "SAR") {
        // Saudi student (country or phone) → Saudi riyal, without asking.
        contact = (
          await db.from("web_chat_contacts").update({ currency: "SAR", currency_set_at: now, currency_set_by: "country", updated_at: now }).eq("id", contact.id).select("*").single()
        ).data;
      }
    }
    return contact;
  }
  if (byVisitor) return byVisitor;
  if (!visitorId) return null;
  return (await db.from("web_chat_contacts").insert({ visitor_id: visitorId }).select("*").single()).data;
}

/** Attach the logged-in user to a session started anonymously (e.g. after "register to see prices"). */
async function attachViewer(db: Db, session: AnyRow, userId: string | null) {
  const visitorContact = session.contact_id ? (await db.from("web_chat_contacts").select("*").eq("id", session.contact_id).maybeSingle()).data : null;
  const contact = await resolveContact(db, userId, cut(visitorContact?.visitor_id, 64) || null) ?? visitorContact;
  const patch: AnyRow = {};
  if (userId && !session.user_id) patch.user_id = userId;
  if (contact && contact.id !== session.contact_id) patch.contact_id = contact.id;
  if (Object.keys(patch).length) {
    await db.from("web_chat_sessions").update(patch).eq("id", session.id);
    Object.assign(session, patch);
  }
  return { userId: session.user_id ?? userId ?? null, contact };
}

async function log(db: Db, sessionId: string, rows: { sender: "visitor" | "bot"; body: string; action_id?: string | null; buttons?: ChatButton[] | null }[]) {
  if (!rows.length) return;
  await db.from("web_chat_messages").insert(
    rows.map((r) => ({
      session_id: sessionId,
      sender: r.sender,
      body: r.body.slice(0, 4000),
      action_id: r.action_id ?? null,
      buttons: r.buttons?.length ? r.buttons : null,
    })),
  );
  const { data } = await db.from("web_chat_sessions").select("message_count").eq("id", sessionId).maybeSingle();
  await db
    .from("web_chat_sessions")
    .update({ message_count: Number(data?.message_count ?? 0) + rows.length, updated_at: new Date().toISOString() })
    .eq("id", sessionId);
}

/** Chat opened by itself from an ad link (?ask=…): kept silent until the visitor presses a button. */
const QUIET_SOURCES = new Set(["ad"]);

async function requestIsBot() {
  try {
    return isBotUserAgent((await headers()).get("user-agent"));
  } catch {
    return false;
  }
}

export async function startWebChat(input: WebChatContext): Promise<WebChatStart> {
  try {
    // Ad review / link-preview crawlers: no session, no notification.
    if (await requestIsBot()) {
      return { ok: false, error: toLocale(input?.locale) === "en" ? "Chat is not available." : "المحادثة غير متاحة." };
    }
    const db = createAdminClient();
    const ctx: WebChatContext = {
      source: cut(input?.source, 40) || "contact",
      text: cut(input?.text, 300),
      courseHint: cut(input?.courseHint, 200),
      actionLabel: cut(input?.actionLabel, 200),
      journeyLabel: cut(input?.journeyLabel, 120),
      journeyType: cut(input?.journeyType, 40),
      lessonId: cut(input?.lessonId, 64),
      requestNumber: cut(input?.requestNumber, 60),
      page: cut(input?.page, 300).startsWith("/") ? cut(input?.page, 300) : "/",
      announcementId: /^[0-9a-f-]{36}$/i.test(String(input?.announcementId ?? "")) ? String(input.announcementId) : undefined,
    };
    const visitorId = /^[a-zA-Z0-9-]{8,64}$/.test(String(input?.visitorId ?? "")) ? String(input.visitorId) : null;
    const userId = await currentUserId();
    const contact = await resolveContact(db, userId, visitorId);

    const quiet = QUIET_SOURCES.has(ctx.source ?? "");
    const token = randomBytes(24).toString("hex");
    let session: AnyRow | null = null;
    for (let attempt = 0; attempt < 3 && !session; attempt += 1) {
      const { data } = await db
        .from("web_chat_sessions")
        .insert({
          code: newCode(),
          token,
          user_id: userId,
          contact_id: contact?.id ?? null,
          source: ctx.source,
          context: quiet ? { ...ctx, quiet: true } : ctx,
          last_visitor_at: new Date().toISOString(),
        })
        .select("*")
        .single();
      session = data;
    }
    if (!session) return { ok: false, error: toLocale(input?.locale) === "en" ? "Couldn't start the chat." : "تعذّر بدء المحادثة." };

    // One follow-up per student: a new chat replaces the older ones
    // (a silent ad chat replaces them only once the visitor answers).
    if (contact?.id && !quiet) {
      await db
        .from("web_chat_sessions")
        .update({ followup_status: "closed", followup_closed_reason: "new_chat", followup_closed_at: new Date().toISOString(), followup_next_at: null })
        .eq("contact_id", contact.id)
        .eq("followup_status", "active")
        .neq("id", session.id);
    }

    const entryKey = ENTRY_KEYS.has(ctx.source!) ? ctx.source! : "launcher";
    const locale = toLocale(input?.locale);
    await saveLocale(db, session, locale);
    const engine = new WebChatEngine(db, session, { userId, contact }, locale);
    const messages = await engine.opening(entryKey, ctx);

    await log(db, session.id, [
      ...(ctx.text ? [{ sender: "visitor" as const, body: ctx.text }] : []),
      ...messages.map((m) => ({ sender: "bot" as const, body: m.text, buttons: m.buttons })),
    ]);

    // Silent ad chat: no follow-up and no notification until the visitor presses a button
    // (ad link checkers open the page like visitors and never answer).
    if (quiet) {
      if (session.followup_status !== "none") {
        await db
          .from("web_chat_sessions")
          .update({ followup_status: "none", followup_count: 0, followup_next_at: null })
          .eq("id", session.id);
      }
      return { ok: true, sessionId: session.id, token, code: session.code, messages };
    }

    // Notify Mona: new chat (who + which button).
    let who = "زائر غير مسجّل";
    if (userId) {
      const { data: p } = await db.from("profiles").select("full_name,email").eq("id", userId).maybeSingle();
      who = String(p?.full_name || p?.email || "طالب مسجّل");
    }
    const sourceLabel: Record<string, string> = { contact: "زر التواصل", course_action: "زر داخل الكورس", enrollment: "طلب اشتراك", launcher: "زر المساعد", announcement: "زر إعلان المنصة", ad: "إعلان ممول / رابط مباشر" };
    await notifyWebChatAdmins(db, {
      title: `🤖 محادثة جديدة — ${who}`,
      body: [sourceLabel[entryKey] ?? entryKey, ctx.actionLabel || ctx.text || "", ctx.courseHint || "", session.code].filter(Boolean).join(" • "),
      sessionId: session.id,
      tag: `chat-${session.id}`,
    });

    return { ok: true, sessionId: session.id, token, code: session.code, messages };
  } catch (error) {
    console.error("startWebChat failed:", error);
    return { ok: false, error: toLocale(input?.locale) === "en" ? "Couldn't start the chat. Please try again." : "تعذّر بدء المحادثة. حاول مرة أخرى." };
  }
}

async function ownedSession(db: Db, sessionId: string, token: string | null, userId: string | null) {
  const { data: session } = await db.from("web_chat_sessions").select("*").eq("id", cut(sessionId, 64)).maybeSingle();
  if (!session) return null;
  if (token && session.token === token) return session as AnyRow;
  if (userId && session.user_id === userId) return session as AnyRow;
  return null;
}

export async function webChatAct(sessionId: string, token: string, actionId: string, label: string, localeInput?: string): Promise<WebChatReply> {
  try {
    const db = createAdminClient();
    const userId = await currentUserId();
    const session = await ownedSession(db, sessionId, token, userId);
    if (!session) return { ok: false, error: toLocale(localeInput) === "en" ? "This chat has ended. Start a new chat." : "انتهت المحادثة. ابدأ محادثة جديدة." };
    if (Number(session.message_count) > MAX_MESSAGES_PER_SESSION) return { ok: false, error: toLocale(localeInput) === "en" ? "This chat reached its maximum length." : "تم الوصول للحد الأقصى لهذه المحادثة." };

    const viewer = await attachViewer(db, session, userId);

    // The student answered → restart the follow-up clock (an admin-closed follow-up stays closed).
    const now = new Date();
    const patch: AnyRow = { last_visitor_at: now.toISOString(), has_unseen: false };
    const reopen = session.followup_status === "closed" && session.followup_closed_reason === "no_reply";
    if (session.followup_status === "active" || reopen) {
      const { data: cfg } = await db.from("web_chat_settings").select("followup_every_days").eq("id", 1).maybeSingle();
      const days = Math.max(1, Number(cfg?.followup_every_days ?? 3));
      Object.assign(patch, {
        followup_status: "active",
        followup_count: 0,
        followup_next_at: new Date(now.getTime() + days * 86400000).toISOString(),
        followup_closed_reason: null,
        followup_closed_at: null,
      });
    }
    // First answer in a silent ad chat → it becomes a normal chat (follow-up + notification).
    const waking = Boolean(session.context?.quiet);
    if (waking) {
      patch.context = { ...(session.context ?? {}), quiet: false };
      if (session.current_course_id && session.followup_status === "none") {
        const { data: cfg } = await db.from("web_chat_settings").select("followup_every_days").eq("id", 1).maybeSingle();
        const days = Math.max(1, Number(cfg?.followup_every_days ?? 3));
        Object.assign(patch, {
          followup_status: "active",
          followup_count: 0,
          followup_next_at: new Date(now.getTime() + days * 86400000).toISOString(),
        });
      }
      if (session.contact_id) {
        await db
          .from("web_chat_sessions")
          .update({ followup_status: "closed", followup_closed_reason: "new_chat", followup_closed_at: now.toISOString(), followup_next_at: null })
          .eq("contact_id", session.contact_id)
          .eq("followup_status", "active")
          .neq("id", session.id);
      }
    }
    await db.from("web_chat_sessions").update(patch).eq("id", session.id);
    Object.assign(session, patch);

    if (waking) {
      let who = "زائر غير مسجّل";
      if (userId) {
        const { data: p } = await db.from("profiles").select("full_name,email").eq("id", userId).maybeSingle();
        who = String(p?.full_name || p?.email || "طالب مسجّل");
      }
      await notifyWebChatAdmins(db, {
        title: `🤖 محادثة جديدة — ${who}`,
        body: ["إعلان ممول / رابط مباشر", session.context?.actionLabel || "", cut(label, 120), session.code].filter(Boolean).join(" • "),
        sessionId: session.id,
        tag: `chat-${session.id}`,
      });
    }

    const id = cut(actionId, 80);
    const locale = toLocale(localeInput);
    await saveLocale(db, session, locale);
    const messages = await new WebChatEngine(db, session, viewer, locale).act(id);
    await log(db, session.id, [
      { sender: "visitor", body: cut(label, 200) || id, action_id: id },
      ...messages.map((m) => ({ sender: "bot" as const, body: m.text, buttons: m.buttons })),
    ]);
    return { ok: true, messages };
  } catch (error) {
    console.error("webChatAct failed:", error);
    return { ok: false, error: toLocale(localeInput) === "en" ? "Something went wrong, please try again." : "حدث خطأ، حاول مرة أخرى." };
  }
}

/** Reload a chat (follow-up messages written by the scheduler appear here). */
export async function loadWebChat(sessionId: string, token: string | null, markSeen: boolean): Promise<WebChatLoad> {
  try {
    const db = createAdminClient();
    const userId = await currentUserId();
    const session = await ownedSession(db, sessionId, token, userId);
    if (!session) return { ok: false, error: "المحادثة غير متاحة." };
    if (userId && !session.user_id) await attachViewer(db, session, userId);

    const { data } = await db
      .from("web_chat_messages")
      .select("sender,body,buttons,created_at")
      .eq("session_id", session.id)
      .order("created_at", { ascending: true })
      .limit(MAX_MESSAGES_PER_SESSION);
    const messages: ChatMessage[] = (data ?? []).map((m: AnyRow) => ({
      from: m.sender === "visitor" ? "visitor" : "bot",
      text: String(m.body ?? ""),
      ...(Array.isArray(m.buttons) && m.buttons.length ? { buttons: m.buttons as ChatButton[] } : {}),
    }));
    if (markSeen && session.has_unseen) await db.from("web_chat_sessions").update({ has_unseen: false }).eq("id", session.id);
    return { ok: true, sessionId: session.id, token: session.token, code: session.code, messages, hasUnseen: Boolean(session.has_unseen) };
  } catch (error) {
    console.error("loadWebChat failed:", error);
    return { ok: false, error: "تعذّر تحميل المحادثة." };
  }
}
