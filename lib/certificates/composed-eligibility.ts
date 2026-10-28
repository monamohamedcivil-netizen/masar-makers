import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

/*
 * شهادة من «اليوم الواحد + المجاني»:
 * الطالب بدون اشتراك احترافي يستحق الشهادة إذا كانت محاضرات رحلات اليوم الواحد
 * والرحلات المجانية التي اشترك فيها (اشتراك فعّال) تغطي كل محاضرات الرحلة الاحترافية
 * المتكاملة للكورس، وأكمل مشاهدتها كلها (100%).
 * - كورس بمرحلتين: شهادة الأساسيات إذا غطّى كل محاضرات الأساسيات، والمتقدم كذلك.
 * - كورس بمستوى واحد: شهادة Advanced إذا غطّى كل محاضرات الكورس الاحترافية.
 * لو الرحلة المتكاملة فيها محاضرات غير معروضة له كيوم واحد أو مجاني (أو لم يكملها) → «تغطية جزئية»:
 * لا يستحقها تلقائيًا، لكن الإدارة تقدر تصدرها يدويًا (قرار منى).
 */

type AnyRow = Record<string, any>;
export type ComposedCertificateType = "fundamental" | "advanced";

export type ComposedTypeCoverage = {
  type: ComposedCertificateType;
  /** Professional lessons of this certificate the student watched (100%) through one-day / free journeys. */
  covered: number;
  total: number;
  /** covered === total → eligible automatically. */
  complete: boolean;
};

export type ComposedEligibility = {
  userId: string;
  /** Active one-day / free enrollment the certificate is attached to (latest). */
  anchorEnrollmentId: string;
  coverage: ComposedTypeCoverage[];
};

const NON_PRO = ["free", "free_session", "free_journey", "workshop", "one_day", "one_day_workshop"];
const PRO_TYPES = ["fundamental", "fundamentals", "advanced", "integrated", "professional", "career_path", "career"];
const norm = (v: unknown) => String(v ?? "").trim().toLowerCase().replaceAll("-", "_");
const part = (v: unknown) => {
  const p = norm(v);
  if (p === "fundamental" || p === "fundamentals") return "fundamental";
  if (p === "advanced") return "advanced";
  return "single";
};

function lessonIdOf(actionKey: unknown) {
  return String(actionKey ?? "").match(/^(?:workshop|free):lesson:([0-9a-f-]{36})/i)?.[1]?.toLowerCase() ?? null;
}

/** Professional (integrated) lessons of a course, by part — same rule as refresh_enrollment_progress. */
async function professionalLessons(db: SupabaseClient, courseId: string) {
  const [{ data: lessons }, { data: journeys }] = await Promise.all([
    db.from("lessons").select("id,course_part,status").eq("course_id", courseId).eq("status", "published"),
    db.from("journeys").select("id,journey_type,is_active").eq("course_id", courseId).eq("is_active", true),
  ]);
  const list = (lessons ?? []) as AnyRow[];
  const proJourneyIds = ((journeys ?? []) as AnyRow[])
    .filter((j) => !NON_PRO.includes(norm(j.journey_type)))
    .map((j) => String(j.id));
  let proLinked = new Set<string>();
  if (proJourneyIds.length && list.length) {
    const { data: links } = await db.from("lesson_journeys").select("lesson_id,journey_id").in("journey_id", proJourneyIds);
    proLinked = new Set(((links ?? []) as AnyRow[]).map((l) => String(l.lesson_id).toLowerCase()));
  }
  const isSplit = list.some((l) => part(l.course_part) !== "single");
  const out: Record<"fundamental" | "advanced" | "single", string[]> = { fundamental: [], advanced: [], single: [] };
  for (const l of list) {
    const id = String(l.id).toLowerCase();
    const p = part(l.course_part);
    if (p !== "single") out[p].push(id);
    else if (!isSplit && (proLinked.size === 0 || proLinked.has(id))) out.single.push(id);
  }
  return { isSplit, lessons: out };
}

/**
 * Students of a course who earned a certificate through one-day + free journeys.
 * Students with an active professional enrollment in the course are left out
 * (their certificate comes from that enrollment as usual).
 */
export async function getComposedCertificateEligibility(
  db: SupabaseClient,
  courseId: string,
  onlyUserId?: string,
): Promise<ComposedEligibility[]> {
  let query = db
    .from("enrollments")
    .select("id,user_id,journey_type,action_key,status,created_at")
    .eq("course_id", courseId)
    .eq("status", "active");
  if (onlyUserId) query = query.eq("user_id", onlyUserId);
  const { data: enrollments } = await query;
  const rows = (enrollments ?? []) as AnyRow[];

  const byUser = new Map<string, { pro: boolean; lessons: Set<string>; anchor: AnyRow | null }>();
  for (const e of rows) {
    const userId = String(e.user_id ?? "");
    if (!userId) continue;
    const entry = byUser.get(userId) ?? { pro: false, lessons: new Set<string>(), anchor: null };
    const kind = norm(e.journey_type);
    if (PRO_TYPES.includes(kind)) entry.pro = true;
    else if (NON_PRO.includes(kind)) {
      const lessonId = lessonIdOf(e.action_key);
      if (lessonId) {
        entry.lessons.add(lessonId);
        if (!entry.anchor || String(e.created_at) > String(entry.anchor.created_at)) entry.anchor = e;
      }
    }
    byUser.set(userId, entry);
  }
  const candidates = [...byUser.entries()].filter(([, v]) => !v.pro && v.anchor && v.lessons.size > 0);
  if (!candidates.length) return [];

  const { isSplit, lessons } = await professionalLessons(db, courseId);
  const groups: Array<[ComposedCertificateType, string[]]> = isSplit
    ? [["fundamental", lessons.fundamental], ["advanced", lessons.advanced]]
    : [["advanced", lessons.single]];
  const allPro = groups.flatMap(([, ids]) => ids);
  if (!allPro.length) return [];

  const { data: progress } = await db
    .from("lesson_progress")
    .select("user_id,lesson_id,completed,progress_percent")
    .in("user_id", candidates.map(([userId]) => userId))
    .in("lesson_id", allPro);
  const done = new Set(
    ((progress ?? []) as AnyRow[])
      .filter((p) => p.completed === true || Number(p.progress_percent) >= 100)
      .map((p) => `${p.user_id}:${String(p.lesson_id).toLowerCase()}`),
  );

  const out: ComposedEligibility[] = [];
  for (const [userId, v] of candidates) {
    const coverage: ComposedTypeCoverage[] = [];
    for (const [type, ids] of groups) {
      if (!ids.length) continue;
      const covered = ids.filter((id) => v.lessons.has(id) && done.has(`${userId}:${id}`)).length;
      if (covered > 0) coverage.push({ type, covered, total: ids.length, complete: covered === ids.length });
    }
    if (coverage.length) out.push({ userId, anchorEnrollmentId: String(v.anchor!.id), coverage });
  }
  return out;
}
