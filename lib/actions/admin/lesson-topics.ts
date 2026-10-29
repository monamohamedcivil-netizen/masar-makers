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
