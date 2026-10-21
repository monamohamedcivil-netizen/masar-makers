import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

/* =========================================================
   Who may the bot answer?
   1. A conversation Mona handed to the bot from the inbox (bot_forced)
      → bot answers (unless the student asked for a human again).
   2. Known contacts (always_human): people Mona already talks to —
      platform students, imported contacts, or marked in the inbox
      → bot stays silent, Mona answers.
   3. bot_mode: "off" → silent for everyone; "test" → only test_numbers;
      "live" → new contacts get automatic replies.
   Human mode (Mona took over / student asked for support) is still
   handled by the webhook's existing human_mode_until logic.
========================================================= */

type AnyRow = Record<string, any>;

export type BotDecision =
  | { reply: true; reason: "forced" | "test" | "live" }
  | { reply: false; reason: "off" | "test_not_allowed" | "known_contact" };

export function digits(value: unknown) {
  return String(value ?? "").replace(/\D/g, "");
}

/** Compare by the last 9 digits so 01012345678, +20 101 234 5678 and 201012345678 match. */
export function samePhone(a: unknown, b: unknown) {
  const x = digits(a), y = digits(b);
  if (x.length < 8 || y.length < 8) return false;
  return x.slice(-9) === y.slice(-9);
}

export function botMode(settings: AnyRow | null): "off" | "test" | "live" {
  const mode = String(settings?.bot_mode ?? "test");
  return mode === "off" || mode === "live" ? mode : "test";
}

export function isTestNumber(settings: AnyRow | null, phone: string) {
  const list: string[] = Array.isArray(settings?.test_numbers) ? settings.test_numbers : [];
  return list.some((n) => samePhone(n, phone));
}

export function isKnownNumber(settings: AnyRow | null, phone: string) {
  const list: string[] = Array.isArray(settings?.known_numbers) ? settings.known_numbers : [];
  return list.some((n) => samePhone(n, phone));
}

/** Platform students (profiles / payments / leads) are existing relationships → Mona answers them. */
let phoneCache: { at: number; phones: string[] } | null = null;

export async function isPlatformStudent(supabase: SupabaseClient, phone: string) {
  if (digits(phone).length < 8) return false;
  if (!phoneCache || Date.now() - phoneCache.at > 10 * 60 * 1000) {
    const phones: string[] = [];
    for (const [table, column] of [
      ["profiles", "phone"],
      ["finance_payments", "phone"],
      ["course_action_leads", "student_phone"],
    ] as const) {
      const { data } = await supabase.from(table).select(column).not(column, "is", null).limit(5000);
      for (const row of (data ?? []) as AnyRow[]) phones.push(String(row[column]));
    }
    phoneCache = { at: Date.now(), phones };
  }
  return phoneCache.phones.some((p) => samePhone(p, phone));
}

export function decideBotReply(settings: AnyRow | null, session: AnyRow | null, phone: string): BotDecision {
  if (session?.bot_forced) return { reply: true, reason: "forced" };
  const mode = botMode(settings);
  if (mode === "off") return { reply: false, reason: "off" };
  // Test numbers always reach the bot (Mona's own phone may also be a platform profile).
  if (isTestNumber(settings, phone)) return { reply: true, reason: "test" };
  if (session?.always_human) return { reply: false, reason: "known_contact" };
  if (mode === "test") {
    return isTestNumber(settings, phone) ? { reply: true, reason: "test" } : { reply: false, reason: "test_not_allowed" };
  }
  return { reply: true, reason: "live" };
}
