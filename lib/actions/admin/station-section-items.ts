"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient, createClient } from "@/lib/supabase/server";
import { SECTION_KEYS, extractYoutubeId, type SectionKey } from "@/lib/journeys/station-section-shared";

/* فيديوهات أقسام المحطة (station_section_items): إضافة، تعديل، إخفاء، وترتيب. لا يتم حذف أي شيء. */

type AnyRow = Record<string, any>;
type Result<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };


export type SectionItem = {
  id: string;
  stationId: string;
  sectionKey: SectionKey;
  kind: "youtube" | "lesson";
  title: string;
  youtubeUrl: string;
  lessonId: string | null;
  isActive: boolean;
};

export type SectionAdminData = {
  stations: Array<{ id: string; title: string; pathTitle: string }>;
  lessons: Array<{ id: string; title: string; courseCode: string }>;
  items: SectionItem[];
};

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

const fail = (error: unknown): { ok: false; error: string } => {
  const message = error instanceof Error ? error.message : (error as AnyRow)?.message;
  if (typeof message === "string" && message.includes("station_section_items")) {
    return { ok: false, error: "جدول أقسام المحطات غير موجود بعد. شغّلي ملف SQL الخاص به أولًا." };
  }
  return { ok: false, error: typeof message === "string" && message ? message : "تعذر الحفظ." };
};

function refresh() {
  revalidatePath("/admin/learning/lessons");
  revalidatePath("/journeys/professional");
}

const toItem = (r: AnyRow): SectionItem => ({
  id: String(r.id),
  stationId: String(r.station_id),
  sectionKey: r.section_key,
  kind: r.kind,
  title: String(r.title ?? ""),
  youtubeUrl: String(r.youtube_url ?? ""),
  lessonId: r.lesson_id ? String(r.lesson_id) : null,
  isActive: r.is_active !== false,
});

export async function getSectionAdminData(): Promise<Result<SectionAdminData>> {
  try {
    const db = await admin();
    const [{ data: stations }, { data: paths }, { data: lessons }, { data: courses }, itemsRes] = await Promise.all([
      db.from("course_stations").select("id,title,career_path_id,display_order").eq("is_active", true).order("display_order"),
      db.from("career_paths").select("id,title,title_ar,display_order").order("display_order"),
      db.from("lessons").select("id,course_id,title,title_ar").eq("status", "published").order("title").limit(1500),
      db.from("courses").select("id,course_code"),
      db.from("station_section_items").select("*").order("sort_order"),
    ]);
    if (itemsRes.error) throw itemsRes.error;
    const pathTitle = new Map(((paths ?? []) as AnyRow[]).map((p) => [String(p.id), String(p.title_ar || p.title || "")]));
    const code = new Map(((courses ?? []) as AnyRow[]).map((c) => [String(c.id), String(c.course_code ?? "")]));
    return {
      ok: true,
      data: {
        stations: ((stations ?? []) as AnyRow[]).map((s) => ({
          id: String(s.id),
          title: String(s.title ?? ""),
          pathTitle: pathTitle.get(String(s.career_path_id)) ?? "",
        })),
        lessons: ((lessons ?? []) as AnyRow[]).map((l) => ({
          id: String(l.id),
          title: String(l.title_ar || l.title || ""),
          courseCode: code.get(String(l.course_id)) ?? "",
        })),
        items: ((itemsRes.data ?? []) as AnyRow[]).map(toItem),
      },
    };
  } catch (error) {
    return fail(error);
  }
}

export async function addSectionItem(input: {
  stationId: string;
  sectionKey: string;
  kind: "youtube" | "lesson";
  title?: string;
  youtubeUrl?: string;
  lessonId?: string;
}): Promise<Result<SectionItem>> {
  try {
    const db = await admin();
    if (!input.stationId) throw new Error("اختاري المحطة أولًا.");
    if (!(SECTION_KEYS as readonly string[]).includes(input.sectionKey)) throw new Error("القسم غير صحيح.");
    if (input.kind === "youtube") {
      if (!extractYoutubeId(input.youtubeUrl ?? "")) throw new Error("رابط يوتيوب غير صحيح.");
    } else if (!input.lessonId) {
      throw new Error("اختاري المحاضرة.");
    }
    const { data: last } = await db
      .from("station_section_items")
      .select("sort_order")
      .eq("station_id", input.stationId)
      .eq("section_key", input.sectionKey)
      .order("sort_order", { ascending: false })
      .limit(1);
    const next = Number((last as AnyRow[] | null)?.[0]?.sort_order ?? 0) + 10;
    const { data, error } = await db
      .from("station_section_items")
      .insert({
        station_id: input.stationId,
        section_key: input.sectionKey,
        kind: input.kind,
        title: input.title?.trim() || null,
        youtube_url: input.kind === "youtube" ? input.youtubeUrl!.trim() : null,
        lesson_id: input.kind === "lesson" ? input.lessonId : null,
        sort_order: next,
      })
      .select("*")
      .single();
    if (error) throw error;
    refresh();
    return { ok: true, data: toItem(data as AnyRow) };
  } catch (error) {
    return fail(error);
  }
}

export async function updateSectionItem(
  id: string,
  patch: { title?: string; youtubeUrl?: string; isActive?: boolean },
): Promise<Result> {
  try {
    const db = await admin();
    const update: AnyRow = { updated_at: new Date().toISOString() };
    if (patch.title !== undefined) update.title = patch.title.trim() || null;
    if (patch.youtubeUrl !== undefined) {
      if (!extractYoutubeId(patch.youtubeUrl)) throw new Error("رابط يوتيوب غير صحيح.");
      update.youtube_url = patch.youtubeUrl.trim();
    }
    if (patch.isActive !== undefined) update.is_active = patch.isActive;
    const { error } = await db.from("station_section_items").update(update).eq("id", id);
    if (error) throw error;
    refresh();
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function reorderSectionItems(stationId: string, sectionKey: string, orderedIds: string[]): Promise<Result> {
  try {
    const db = await admin();
    const ids = [...new Set(orderedIds.map(String))];
    for (let i = 0; i < ids.length; i += 1) {
      const { error } = await db
        .from("station_section_items")
        .update({ sort_order: (i + 1) * 10, updated_at: new Date().toISOString() })
        .eq("id", ids[i])
        .eq("station_id", stationId)
        .eq("section_key", sectionKey);
      if (error) throw error;
    }
    refresh();
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}
