"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient, createClient } from "@/lib/supabase/server";

/*
 * تبويب «تصنيف الرحلات» في «الدروس والمحتوى»:
 * - محطات اليوم الواحد والمجانية (lesson_topics)
 * - كلمات البحث (lesson_search_terms) وربطها بالمحاضرات (lesson_search_term_links)
 * لا يوجد حذف: الإخفاء بدل الحذف.
 */

type AnyRow = Record<string, any>;
type Result<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

export type TaxonomyItem = {
  id: string;
  pathId: string;
  title: string;
  titleEn: string;
  sortOrder: number;
  isActive: boolean;
  lectures: number;
};
export type TaxonomyPath = { id: string; slug: string; title: string };
export type TaxonomyData = {
  paths: TaxonomyPath[];
  topics: TaxonomyItem[];
  terms: TaxonomyItem[];
  /** false إذا لم يتم تشغيل ملف SQL الخاص بكلمات البحث بعد */
  termsReady: boolean;
};
export type SearchTermOption = { id: string; title: string; titleEn: string };

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
  error: error instanceof Error ? error.message : (error as { message?: string } | null)?.message || "تعذر الحفظ.",
});

function refresh() {
  revalidatePath("/admin/learning/lessons");
  revalidatePath("/journeys/one-day");
  revalidatePath("/journeys/free");
}

const countBy = (rows: AnyRow[] | null, key: string) => {
  const map = new Map<string, number>();
  for (const r of rows ?? []) map.set(String(r[key]), (map.get(String(r[key])) ?? 0) + 1);
  return map;
};

export async function getTaxonomy(): Promise<Result<TaxonomyData>> {
  try {
    const db = await admin();
    const [paths, topics, topicLinks, terms, termLinks] = await Promise.all([
      db.from("career_paths").select("id,slug,title,title_ar,display_order").order("display_order"),
      db.from("lesson_topics").select("id,career_path_id,title,title_en,sort_order,is_active").order("sort_order"),
      db.from("lesson_topic_links").select("topic_id"),
      db.from("lesson_search_terms").select("id,career_path_id,title,title_en,sort_order,is_active").order("sort_order"),
      db.from("lesson_search_term_links").select("term_id"),
    ]);
    if (paths.error) throw paths.error;
    if (topics.error) throw topics.error;
    const termsReady = !terms.error;
    const topicCounts = countBy(topicLinks.data as AnyRow[] | null, "topic_id");
    const termCounts = countBy(termLinks.data as AnyRow[] | null, "term_id");
    const map = (rows: AnyRow[] | null, counts: Map<string, number>): TaxonomyItem[] =>
      (rows ?? []).map((r) => ({
        id: String(r.id),
        pathId: String(r.career_path_id),
        title: String(r.title ?? ""),
        titleEn: String(r.title_en ?? ""),
        sortOrder: Number(r.sort_order ?? 100),
        isActive: r.is_active !== false,
        lectures: counts.get(String(r.id)) ?? 0,
      }));
    return {
      ok: true,
      data: {
        paths: ((paths.data ?? []) as AnyRow[]).map((p) => ({ id: String(p.id), slug: String(p.slug ?? ""), title: String(p.title_ar || p.title || "") })),
        topics: map(topics.data as AnyRow[] | null, topicCounts),
        terms: termsReady ? map(terms.data as AnyRow[] | null, termCounts) : [],
        termsReady,
      },
    };
  } catch (error) {
    return fail(error);
  }
}

/* ---------- كلمات البحث ---------- */

export async function addSearchTerm(careerPathId: string, title: string, titleEn: string): Promise<Result<TaxonomyItem>> {
  try {
    const db = await admin();
    const name = title.trim();
    if (!careerPathId) throw new Error("اختاري المسار أولًا.");
    if (!name) throw new Error("اكتبي كلمة البحث بالعربي.");
    const { data: last } = await db
      .from("lesson_search_terms")
      .select("sort_order")
      .eq("career_path_id", careerPathId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const sortOrder = Number(last?.sort_order ?? 0) + 10;
    const { data, error } = await db
      .from("lesson_search_terms")
      .insert({ career_path_id: careerPathId, title: name, title_en: titleEn.trim() || null, sort_order: sortOrder })
      .select("id,career_path_id,title,title_en,sort_order,is_active")
      .single();
    if (error) throw error;
    refresh();
    return {
      ok: true,
      data: { id: String(data.id), pathId: careerPathId, title: String(data.title), titleEn: String(data.title_en ?? ""), sortOrder, isActive: true, lectures: 0 },
    };
  } catch (error) {
    return fail(error);
  }
}

export async function updateSearchTerm(
  termId: string,
  patch: { title?: string; titleEn?: string | null; isActive?: boolean },
): Promise<Result> {
  try {
    const db = await admin();
    const row: AnyRow = { updated_at: new Date().toISOString() };
    if (patch.title !== undefined) {
      const name = patch.title.trim();
      if (!name) throw new Error("اكتبي كلمة البحث بالعربي.");
      row.title = name;
    }
    if (patch.titleEn !== undefined) row.title_en = patch.titleEn?.trim() || null;
    if (patch.isActive !== undefined) row.is_active = patch.isActive;
    const { error } = await db.from("lesson_search_terms").update(row).eq("id", termId);
    if (error) throw error;
    refresh();
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

/** Renumbers the path's terms as 10, 20, 30… in the given order (only changed rows are written). */
export async function reorderSearchTerms(careerPathId: string, orderedIds: string[]): Promise<Result> {
  try {
    const db = await admin();
    if (!careerPathId) throw new Error("اختاري المسار أولًا.");
    const { data: current, error } = await db.from("lesson_search_terms").select("id,sort_order").eq("career_path_id", careerPathId);
    if (error) throw error;
    const valid = new Map(((current ?? []) as AnyRow[]).map((t) => [String(t.id), Number(t.sort_order ?? 0)]));
    const ids = [...new Set(orderedIds.map(String))].filter((id) => valid.has(id));
    if (!ids.length) throw new Error("لا توجد كلمات لإعادة ترتيبها.");
    const now = new Date().toISOString();
    for (let i = 0; i < ids.length; i += 1) {
      const next = (i + 1) * 10;
      if (valid.get(ids[i]) === next) continue;
      const { error: updError } = await db
        .from("lesson_search_terms")
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

/* ---------- ربط المحاضرة بكلمات البحث ---------- */

export async function getLessonSearchTerms(
  lessonId: string | null,
  careerPathId: string | null,
): Promise<Result<{ terms: SearchTermOption[]; selected: string[] }>> {
  try {
    const db = await admin();
    if (!careerPathId) return { ok: true, data: { terms: [], selected: [] } };
    const { data: terms, error } = await db
      .from("lesson_search_terms")
      .select("id,title,title_en")
      .eq("career_path_id", careerPathId)
      .eq("is_active", true)
      .order("sort_order");
    // الجدول غير موجود بعد (لم يتم تشغيل ملف SQL): نعرض قائمة فاضية بدون خطأ.
    if (error) return { ok: true, data: { terms: [], selected: [] } };
    const { data: links } = lessonId
      ? await db.from("lesson_search_term_links").select("term_id").eq("lesson_id", lessonId)
      : { data: [] as AnyRow[] };
    return {
      ok: true,
      data: {
        terms: ((terms ?? []) as AnyRow[]).map((t) => ({ id: String(t.id), title: String(t.title), titleEn: String(t.title_en ?? "") })),
        selected: ((links ?? []) as AnyRow[]).map((l) => String(l.term_id)),
      },
    };
  } catch (error) {
    return fail(error);
  }
}

/** Saves the lesson's search terms (several allowed). Only the difference is written. */
export async function setLessonSearchTerms(lessonId: string, termIds: string[]): Promise<Result> {
  try {
    const db = await admin();
    if (!lessonId) throw new Error("احفظي الدرس أولًا.");
    const wanted = new Set(termIds.filter(Boolean).map(String));
    const { data: existing, error } = await db.from("lesson_search_term_links").select("term_id").eq("lesson_id", lessonId);
    if (error) throw error;
    const have = new Set(((existing ?? []) as AnyRow[]).map((l) => String(l.term_id)));
    const toAdd = [...wanted].filter((id) => !have.has(id));
    const toRemove = [...have].filter((id) => !wanted.has(id));
    if (toAdd.length) {
      const { error: addError } = await db.from("lesson_search_term_links").insert(toAdd.map((term_id) => ({ lesson_id: lessonId, term_id })));
      if (addError) throw addError;
    }
    if (toRemove.length) {
      const { error: delError } = await db.from("lesson_search_term_links").delete().eq("lesson_id", lessonId).in("term_id", toRemove);
      if (delError) throw delError;
    }
    refresh();
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}
