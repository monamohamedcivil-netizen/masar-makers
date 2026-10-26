import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

/*
 * «عملة الطالب» — one value per student, stored on his platform-chat contact
 * (web_chat_contacts.currency, the same currency the chat bot uses).
 * When empty: the currency of his last payment (finance_payments).
 * Server-only (service-role client).
 */

type AnyRow = Record<string, any>;

export type StudentCurrency = { currency: string | null; source: "student" | "admin" | "payments" | "country" | null };

export async function getStudentCurrencies(db: SupabaseClient, userIds: string[]) {
  const out = new Map<string, StudentCurrency>();
  const ids = [...new Set(userIds.filter(Boolean))];
  if (!ids.length) return out;
  const [{ data: contacts }, { data: payments }] = await Promise.all([
    db.from("web_chat_contacts").select("user_id,currency,currency_set_by").in("user_id", ids),
    db
      .from("finance_payments")
      .select("user_id,currency,created_at")
      .in("user_id", ids)
      .not("currency", "is", null)
      .order("created_at", { ascending: false }),
  ]);
  for (const c of (contacts ?? []) as AnyRow[]) {
    const code = String(c.currency ?? "").toUpperCase();
    if (code) out.set(String(c.user_id), { currency: code, source: (c.currency_set_by as StudentCurrency["source"]) ?? "student" });
  }
  for (const p of (payments ?? []) as AnyRow[]) {
    const id = String(p.user_id);
    const code = String(p.currency ?? "").toUpperCase();
    if (code && !out.has(id)) out.set(id, { currency: code, source: "payments" });
  }
  return out;
}

/** Sets (or clears) the student's currency. The chat uses it right away (no currency question). */
export async function setStudentCurrency(
  db: SupabaseClient,
  userId: string,
  currency: string | null,
  setBy: "admin" | "payments" = "admin",
) {
  const code = currency ? currency.toUpperCase() : null;
  const now = new Date().toISOString();
  const patch = { currency: code, currency_set_at: code ? now : null, currency_set_by: code ? setBy : null, updated_at: now };
  const { data: existing } = await db.from("web_chat_contacts").select("id").eq("user_id", userId).maybeSingle();
  const { error } = existing
    ? await db.from("web_chat_contacts").update(patch).eq("id", existing.id)
    : await db.from("web_chat_contacts").insert({ user_id: userId, ...patch });
  if (error) throw new Error(error.message);
}
