"use server";

import { randomBytes } from "crypto";

import { createAdminClient, createClient } from "@/lib/supabase/server";
import { WebChatEngine, type ChatMessage } from "@/lib/webchat/engine";

/* =========================================================
   Website chat — public server actions (visitors may be anonymous).
   Each session gets a secret token kept in the visitor's browser.
========================================================= */

export type WebChatContext = {
  source?: string;          // contact | course_action | enrollment | inquiry
  text?: string;            // what the visitor "asked" (shown as their first bubble)
  courseHint?: string;      // course title/code from the page
  botLead?: string;         // first line the bot says (e.g. "تم تسجيل طلبك ✅")
  handoffText?: string;     // full message to prefill in WhatsApp on hand-off
};

export type WebChatStart = { ok: true; sessionId: string; token: string; code: string; messages: ChatMessage[] } | { ok: false; error: string };
export type WebChatReply = { ok: true; messages: ChatMessage[] } | { ok: false; error: string };

const MAX_MESSAGES_PER_SESSION = 300;
const cut = (v: unknown, n: number) => String(v ?? "").trim().slice(0, n);

function newCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(5);
  return "MM-" + [...bytes].map((b) => alphabet[b % alphabet.length]).join("");
}

async function log(db: ReturnType<typeof createAdminClient>, sessionId: string, rows: { sender: "visitor" | "bot"; body: string; action_id?: string | null }[]) {
  if (!rows.length) return;
  await db.from("web_chat_messages").insert(rows.map((r) => ({ session_id: sessionId, sender: r.sender, body: r.body.slice(0, 4000), action_id: r.action_id ?? null })));
  const { data } = await db.from("web_chat_sessions").select("message_count").eq("id", sessionId).maybeSingle();
  await db
    .from("web_chat_sessions")
    .update({ message_count: Number(data?.message_count ?? 0) + rows.length, updated_at: new Date().toISOString() })
    .eq("id", sessionId);
}

export async function startWebChat(input: WebChatContext): Promise<WebChatStart> {
  try {
    const db = createAdminClient();
    const ctx: WebChatContext = {
      source: cut(input?.source, 40) || "contact",
      text: cut(input?.text, 1500),
      courseHint: cut(input?.courseHint, 200),
      botLead: cut(input?.botLead, 500),
      handoffText: cut(input?.handoffText, 2500),
    };

    let userId: string | null = null;
    try {
      const auth = await createClient();
      userId = (await auth.auth.getUser()).data.user?.id ?? null;
    } catch {
      /* anonymous visitor */
    }

    const token = randomBytes(24).toString("hex");
    let session: Record<string, any> | null = null;
    for (let attempt = 0; attempt < 3 && !session; attempt += 1) {
      const { data } = await db
        .from("web_chat_sessions")
        .insert({ code: newCode(), token, user_id: userId, source: ctx.source, context: ctx })
        .select("*")
        .single();
      session = data;
    }
    if (!session) return { ok: false, error: "تعذّر بدء المحادثة." };

    const engine = new WebChatEngine(db, session);
    const greeting = ctx.botLead || "أهلًا بك في Masar Makers 👋 يسعدنا مساعدتك.";
    const course = ctx.courseHint ? await engine.matchCourse(ctx.courseHint) : null;
    const messages = course ? await engine.openCourse(course.id, greeting) : await engine.mainMenu(greeting);

    await log(db, session.id, [
      ...(ctx.text ? [{ sender: "visitor" as const, body: ctx.text }] : []),
      ...messages.map((m) => ({ sender: "bot" as const, body: m.text })),
    ]);

    return { ok: true, sessionId: session.id, token, code: session.code, messages };
  } catch (error) {
    console.error("startWebChat failed:", error);
    return { ok: false, error: "تعذّر بدء المحادثة. حاول مرة أخرى." };
  }
}

export async function webChatAct(sessionId: string, token: string, actionId: string, label: string): Promise<WebChatReply> {
  try {
    const db = createAdminClient();
    const { data: session } = await db.from("web_chat_sessions").select("*").eq("id", cut(sessionId, 64)).maybeSingle();
    if (!session || session.token !== token) return { ok: false, error: "انتهت المحادثة. ابدأ محادثة جديدة." };
    if (Number(session.message_count) > MAX_MESSAGES_PER_SESSION) return { ok: false, error: "تم الوصول للحد الأقصى لهذه المحادثة." };

    const messages = await new WebChatEngine(db, session).act(cut(actionId, 80));
    await log(db, session.id, [
      { sender: "visitor", body: cut(label, 200) || actionId, action_id: cut(actionId, 80) },
      ...messages.map((m) => ({ sender: "bot" as const, body: m.text })),
    ]);
    return { ok: true, messages };
  } catch (error) {
    console.error("webChatAct failed:", error);
    return { ok: false, error: "حدث خطأ، حاول مرة أخرى." };
  }
}
