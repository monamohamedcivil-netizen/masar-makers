"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { loadPublishedCourseReviews } from "@/lib/course/published-reviews";
import { mapStoredProfessionalContent } from "@/lib/course/stored-professional-content";
import { getCourseProjects } from "@/lib/projects/student-projects";
import type { ProfessionalPanelDraft } from "@/components/course/editor";
import type { Review } from "@/data/types";
import type { StudentProject } from "@/lib/projects/types";
import { extractYoutubeId } from "@/lib/journeys/station-section-shared";

/*
 * أقسام المحطة في صفحة «رحلة الاحتراف المتكاملة»:
 * نفس محتوى تبويبات صفحة الكورس (محاور الرحلة / نتائج الرحلة / الهدايا / قصص النجاح)،
 * يُحمَّل عند الطلب لمحطة واحدة فقط لتقليل الاستهلاك.
 * البيانات عامة (تُعرض لأي زائر في صفحة الكورس).
 */

export type PublicSectionItem = {
  id: string;
  sectionKey: string;
  kind: "youtube" | "lesson";
  title: string;
  youtubeId: string | null;
  courseCode: string;
  href: string | null;
};

export type StationSectionsData = {
  items: PublicSectionItem[];
  panels: Record<string, Partial<ProfessionalPanelDraft> | null>;
  reviews: Review[];
  projects: StudentProject[];
};

const PANELS = ["professional", "outcome", "gifts", "reviews"];

export async function getStationSections(
  stationId: string,
): Promise<StationSectionsData> {
  const empty: StationSectionsData = { items: [], panels: {}, reviews: [], projects: [] };
  if (!stationId || typeof stationId !== "string") return empty;

  const db = createAdminClient();

  const [{ data: screens }, { data: station }, { data: courses }] =
    await Promise.all([
      db
        .from("course_screen_contents")
        .select("panel_component,screen_title,column_count,column_one_title,column_two_title,content")
        .eq("station_id", stationId)
        .in("panel_component", PANELS),
      db
        .from("course_stations")
        .select("slug,career_paths(slug)")
        .eq("id", stationId)
        .maybeSingle(),
      db
        .from("courses")
        .select("id")
        .eq("station_id", stationId)
        .eq("is_active", true),
    ]);

  const panels: StationSectionsData["panels"] = {};
  for (const row of (screens ?? []) as Array<Record<string, any>>) {
    panels[String(row.panel_component)] = mapStoredProfessionalContent(row);
  }

  const courseIds = ((courses ?? []) as Array<{ id: string }>).map((c) => String(c.id));
  const stationSlug = String((station as any)?.slug ?? "");
  const rawPath = (station as any)?.career_paths;
  const pathSlug = String((Array.isArray(rawPath) ? rawPath[0]?.slug : rawPath?.slug) ?? "");

  const [reviewLists, projects] = await Promise.all([
    Promise.all(
      courseIds.map((id) =>
        loadPublishedCourseReviews(id, pathSlug as any, stationSlug),
      ),
    ),
    courseIds.length ? getCourseProjects(courseIds) : Promise.resolve([]),
  ]);

  const reviews = reviewLists
    .flat()
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .map((r, i) => ({ ...r, id: i + 1 }));

  return { items: await loadItems(db, stationId), panels, reviews, projects };
}

async function loadItems(db: ReturnType<typeof createAdminClient>, stationId: string): Promise<PublicSectionItem[]> {
  try {
    const { data, error } = await db
      .from("station_section_items")
      .select("id,section_key,kind,title,youtube_url,lesson_id,sort_order")
      .eq("station_id", stationId)
      .eq("is_active", true)
      .order("sort_order");
    if (error || !data?.length) return [];
    const rows = data as Array<Record<string, any>>;
    const lessonIds = rows.map((r) => r.lesson_id).filter(Boolean).map(String);
    const lessonMap = new Map<string, Record<string, any>>();
    const codeMap = new Map<string, string>();
    if (lessonIds.length) {
      const { data: lessons } = await db
        .from("lessons")
        .select("id,course_id,title,title_ar,journey_type")
        .in("id", lessonIds);
      for (const l of (lessons ?? []) as Array<Record<string, any>>) lessonMap.set(String(l.id), l);
      const courseIds = [...new Set([...lessonMap.values()].map((l) => String(l.course_id)).filter(Boolean))];
      if (courseIds.length) {
        const { data: courses } = await db.from("courses").select("id,course_code").in("id", courseIds);
        for (const c of (courses ?? []) as Array<Record<string, any>>) codeMap.set(String(c.id), String(c.course_code ?? ""));
      }
    }
    const out: PublicSectionItem[] = [];
    for (const r of rows) {
      if (r.kind === "youtube") {
        const youtubeId = extractYoutubeId(String(r.youtube_url ?? ""));
        if (!youtubeId) continue;
        out.push({ id: String(r.id), sectionKey: r.section_key, kind: "youtube", title: String(r.title ?? ""), youtubeId, courseCode: "", href: null });
      } else {
        const l = lessonMap.get(String(r.lesson_id));
        if (!l) continue;
        const type = String(l.journey_type ?? "").toLowerCase();
        const panel = type.includes("free") ? "free" : type.includes("workshop") || type.includes("one") ? "one-day" : null;
        out.push({
          id: String(r.id),
          sectionKey: r.section_key,
          kind: "lesson",
          title: String(r.title || l.title_ar || l.title || ""),
          youtubeId: null,
          courseCode: codeMap.get(String(l.course_id)) ?? "",
          href: panel ? `/dashboard?panel=${panel}&lesson=${encodeURIComponent(String(l.id))}` : "/dashboard",
        });
      }
    }
    return out;
  } catch {
    return [];
  }
}
