"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient, createClient } from "@/lib/supabase/server";

/* أقسام المحاضرات (lesson_topics) لكل مسار — تُدار من شاشة المحاضرة في «الدروس والمحتوى». */

type AnyRow = Record<string, any>;
export type LessonTopicOption = { id: string; title: string; sortOrder: number };
type Result<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

async function admin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("يجب تسجيل الدخول أولًا.");
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!["admin", "super_admin"].includes(String(data?.role ?? ""))) throw new Error("هذه العملية للإدارة فقط.");
  return createAdminClient();
}

const fail = (error: unknown): { ok: false; error: string } => ({
  ok: false,
  error: error instanceof Error ? error.message : "تعذر الحفظ.",
});

function refresh() {
  revalidatePath("/admin/learning/lessons");
  revalidatePath("/journeys/one-day");
  revalidatePath("/journeys/free");
}

/** Topics of the lesson's career path + the lesson's selected topics. */
export async function getLessonTopics(
  lessonId: string | null,
  careerPathId: string | null,
): Promise<Result<{ topics: LessonTopicOption[]; selected: string[] }>> {
  try {
    const db = await admin();
    if (!careerPathId) return { ok: true, data: { topics: [], selected: [] } };
    const [{ data: topics, error }, { data: links }] = await Promise.all([
      db.from("lesson_topics").select("id,title,sort_order").eq("career_path_id", careerPathId).eq("is_active", true).order("sort_order"),
      lessonId ? db.from("lesson_topic_links").select("topic_id").eq("lesson_id", lessonId) : Promise.resolve({ data: [] as AnyRow[] }),
    ]);
    if (error) throw error;
    return {
      ok: true,
      data: {
        topics: ((topics ?? []) as AnyRow[]).map((t) => ({ id: String(t.id), title: String(t.title), sortOrder: Number(t.sort_order ?? 100) })),
        selected: ((links ?? []) as AnyRow[]).map((l) => String(l.topic_id)),
      },
    };
  } catch (error) {
    return fail(error);
  }
}

/** Saves the lesson's topics (several allowed). */
export async function setLessonTopics(lessonId: string, topicIds: string[]): Promise<Result> {
  try {
    const db = await admin();
    if (!lessonId) throw new Error("احفظي الدرس أولًا.");
    const ids = [...new Set(topicIds.filter(Boolean))];
    const { error: delError } = await db.from("lesson_topic_links").delete().eq("lesson_id", lessonId);
    if (delError) throw delError;
    if (ids.length) {
      const { error } = await db.from("lesson_topic_links").insert(ids.map((topic_id) => ({ lesson_id: lessonId, topic_id })));
      if (error) throw error;
    }
    refresh();
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

/** Renames a topic — the new name shows for every lecture of the path. */
export async function renameLessonTopic(topicId: string, title: string): Promise<Result> {
  try {
    const db = await admin();
    const name = title.trim();
    if (!name) throw new Error("اكتبي اسم القسم.");
    const { error } = await db.from("lesson_topics").update({ title: name, updated_at: new Date().toISOString() }).eq("id", topicId);
    if (error) throw error;
    refresh();
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

/** Adds a new topic at the end of the path's list. */
export async function addLessonTopic(careerPathId: string, title: string): Promise<Result<LessonTopicOption>> {
  try {
    const db = await admin();
    const name = title.trim();
    if (!careerPathId) throw new Error("اختاري المسار أولًا.");
    if (!name) throw new Error("اكتبي اسم القسم.");
    const { data: last } = await db
      .from("lesson_topics")
      .select("sort_order")
      .eq("career_path_id", careerPathId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const sortOrder = Number(last?.sort_order ?? 0) + 10;
    const { data, error } = await db
      .from("lesson_topics")
      .insert({ career_path_id: careerPathId, title: name, sort_order: sortOrder })
      .select("id,title,sort_order")
      .single();
    if (error) throw error;
    refresh();
    return { ok: true, data: { id: String(data.id), title: String(data.title), sortOrder } };
  } catch (error) {
    return fail(error);
  }
}

/**
 * Saves a new order for the path's topics (the order shown on the one-day and free journey pages).
 * Renumbers sort_order as 10, 20, 30… and writes only the rows that changed.
 */
export async function reorderLessonTopics(careerPathId: string, orderedIds: string[]): Promise<Result> {
  try {
    const db = await admin();
    if (!careerPathId) throw new Error("اختاري المسار أولًا.");
    const { data: current, error } = await db
      .from("lesson_topics")
      .select("id,sort_order")
      .eq("career_path_id", careerPathId);
    if (error) throw error;
    const valid = new Map(((current ?? []) as AnyRow[]).map((t) => [String(t.id), Number(t.sort_order ?? 0)]));
    const ids = [...new Set(orderedIds.map(String))].filter((id) => valid.has(id));
    if (!ids.length) throw new Error("لا توجد أقسام لإعادة ترتيبها.");
    const now = new Date().toISOString();
    for (let i = 0; i < ids.length; i += 1) {
      const next = (i + 1) * 10;
      if (valid.get(ids[i]) === next) continue;
      const { error: updError } = await db
        .from("lesson_topics")
        .update({ sort_order: next, updated_at: now })
        .eq("id", ids[i])
        .eq("career_path_id", careerPathId);
      if (updError) throw updError;
    }
    refresh();
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

/** Edits a topic (station): Arabic name, English name, and show/hide. Nothing is deleted. */
export async function updateLessonTopic(
  topicId: string,
  patch: { title?: string; titleEn?: string | null; isActive?: boolean },
): Promise<Result> {
  try {
    const db = await admin();
    const row: AnyRow = { updated_at: new Date().toISOString() };
    if (patch.title !== undefined) {
      const name = patch.title.trim();
      if (!name) throw new Error("اكتبي اسم المحطة.");
      row.title = name;
    }
    if (patch.titleEn !== undefined) row.title_en = patch.titleEn?.trim() || null;
    if (patch.isActive !== undefined) row.is_active = patch.isActive;
    const { error } = await db.from("lesson_topics").update(row).eq("id", topicId);
    if (error) throw error;
    refresh();
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}
