import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

/* =========================================================
   Platform-chat follow-up helpers
   - Team / Mona chats are never followed up.
   - A student's follow-up covers EVERY course he asked about
     (course_ids), also across his older chats.
========================================================= */

type AnyRow = Record<string, any>;

/** Fallback if the database function is not there yet (keep in sync with web_chat_settings.team_emails). */
const TEAM_EMAILS = new Set([
  "mona.mohamed.civil@gmail.com",
  "mona_abdallah2013@hotmail.com",
  "mona.abdallah.civil@gmail.com",
  "mobility.makers.civil@gmail.com",
  "mino.moor22@gmail.com",
  "m.f.sherif@gmail.com",
]);

/** Is this chat opened by the Masar Makers team or Mona (admin role or a team email)? */
export async function isTeamChat(db: SupabaseClient, userId: string | null, contactId?: string | null): Promise<boolean> {
  if (!userId && !contactId) return false;
  const { data, error } = await db.rpc("web_chat_is_team", { p_user: userId, p_contact: contactId ?? null });
  if (!error) return Boolean(data);

  let uid = userId;
  if (!uid && contactId) uid = (await db.from("web_chat_contacts").select("user_id").eq("id", contactId).maybeSingle()).data?.user_id ?? null;
  if (!uid) return false;
  const { data: p } = await db.from("profiles").select("role,email").eq("id", uid).maybeSingle();
  return ["admin", "super_admin"].includes(String(p?.role ?? "")) || TEAM_EMAILS.has(String(p?.email ?? "").toLowerCase());
}

/** Courses of a session, in order (course_ids, else the current course). */
export function sessionCourseIds(session: AnyRow | null | undefined): string[] {
  const ids: string[] = Array.isArray(session?.course_ids) ? session!.course_ids.map(String) : [];
  if (!ids.length && session?.current_course_id) ids.push(String(session.current_course_id));
  return ids;
}

function merge(...lists: string[][]) {
  return [...new Set(lists.flat().filter(Boolean))];
}

/** Remember one more course on the session (ignored if the column is not there yet). */
export async function rememberCourse(db: SupabaseClient, session: AnyRow, courseId: string) {
  const ids = merge(sessionCourseIds(session), [courseId]);
  if (Array.isArray(session.course_ids) && ids.length === session.course_ids.length) return;
  const { error } = await db.from("web_chat_sessions").update({ course_ids: ids }).eq("id", session.id);
  if (!error) session.course_ids = ids;
}

/**
 * A new (or woken) chat of the same student: instead of dropping the older follow-ups,
 * their courses move into this chat → ONE follow-up that mentions all of them (no duplicates).
 * Returns the merged course list.
 */
export async function takeOverFollowups(db: SupabaseClient, contactId: string, session: AnyRow, followupDays: () => Promise<number>) {
  const { data: older } = await db
    .from("web_chat_sessions")
    .select("*")
    .eq("contact_id", contactId)
    .eq("followup_status", "active")
    .neq("id", session.id);

  const now = new Date();
  if (older?.length) {
    await db
      .from("web_chat_sessions")
      .update({ followup_status: "closed", followup_closed_reason: "new_chat", followup_closed_at: now.toISOString(), followup_next_at: null })
      .in("id", older.map((s: AnyRow) => s.id));
  }

  const ids = merge(...(older ?? []).map((s: AnyRow) => sessionCourseIds(s)), sessionCourseIds(session));
  if (!ids.length) return ids;

  const patch: AnyRow = { course_ids: ids };
  if (!session.current_course_id) patch.current_course_id = ids[ids.length - 1];
  if (session.followup_status === "none" && older?.length) {
    Object.assign(patch, {
      followup_status: "active",
      followup_count: 0,
      followup_next_at: new Date(now.getTime() + (await followupDays()) * 86400000).toISOString(),
    });
  }
  const { error } = await db.from("web_chat_sessions").update(patch).eq("id", session.id);
  if (error) {
    // course_ids column missing (migration not applied yet): keep the old behaviour.
    delete patch.course_ids;
    if (Object.keys(patch).length) await db.from("web_chat_sessions").update(patch).eq("id", session.id);
  }
  Object.assign(session, error ? { ...patch } : patch);
  return ids;
}
