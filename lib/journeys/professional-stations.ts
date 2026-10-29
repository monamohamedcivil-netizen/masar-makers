import "server-only";

import { createAdminClient, createClient } from "@/lib/supabase/server";

/* صفحة «رحلات الاحتراف المتكاملة»: محطات كل مسار (كورس لكل محطة) ومستوياتها وحالة اشتراك الطالب. */

type AnyRow = Record<string, any>;

export type ProfessionalLevel = { key: "fundamental" | "advanced" | "integrated"; title: string; lessons: number; seconds: number };
export type ProfessionalStation = {
  id: string;
  slug: string;
  title: string;
  courseCode: string;
  courseTitle: string;
  description: string | null;
  comingSoon: boolean;
  levels: ProfessionalLevel[];
  lessons: number;
  seconds: number;
  enrollment: { status: string; journeyType: string } | null;
};
export type ProfessionalPath = { id: string; slug: string; title: string; stations: ProfessionalStation[] };

const PRO = ["fundamental", "fundamentals", "advanced", "integrated", "professional", "career_path", "career"];
const norm = (v: unknown) => String(v ?? "").trim().toLowerCase();

export async function getProfessionalStations(): Promise<ProfessionalPath[]> {
  const db = createAdminClient();
  const [{ data: paths }, { data: stations }, { data: courses }] = await Promise.all([
    db.from("career_paths").select("id,slug,title,title_ar,display_order").order("display_order"),
    db.from("course_stations").select("id,career_path_id,slug,title,display_order,is_active").eq("is_active", true).order("display_order"),
    db.from("courses").select("id,station_id,course_code,title,title_ar,subtitle,level,is_active"),
  ]);
  const courseList = ((courses ?? []) as AnyRow[]).filter((c) => c.is_active !== false);
  const courseIds = courseList.map((c) => String(c.id));
  const { data: lessons } = courseIds.length
    ? await db.from("lessons").select("course_id,course_part,video_duration_seconds").in("course_id", courseIds).eq("status", "published")
    : { data: [] as AnyRow[] };

  // Student's professional enrollments (best status per course).
  const enrollmentByCourse = new Map<string, { status: string; journeyType: string }>();
  try {
    const auth = await createClient();
    const {
      data: { user },
    } = await auth.auth.getUser();
    if (user) {
      const { data: mine } = await db.from("enrollments").select("course_id,status,journey_type").eq("user_id", user.id);
      const rank = (s: string) => (["active", "completed"].includes(s) ? 3 : s === "pending" ? 2 : s === "suspended" ? 1 : 0);
      for (const e of (mine ?? []) as AnyRow[]) {
        if (!PRO.includes(norm(e.journey_type))) continue;
        const status = norm(e.status);
        if (["rejected", "cancelled", "expired"].includes(status)) continue;
        const prev = enrollmentByCourse.get(String(e.course_id));
        if (!prev || rank(status) > rank(prev.status)) {
          enrollmentByCourse.set(String(e.course_id), { status, journeyType: norm(e.journey_type) });
        }
      }
    }
  } catch {
    /* visitor */
  }

  const lessonsByCourse = new Map<string, AnyRow[]>();
  for (const l of (lessons ?? []) as AnyRow[]) {
    const list = lessonsByCourse.get(String(l.course_id)) ?? [];
    list.push(l);
    lessonsByCourse.set(String(l.course_id), list);
  }

  return ((paths ?? []) as AnyRow[]).map((p) => ({
    id: String(p.id),
    slug: String(p.slug ?? ""),
    title: String(p.title_ar || p.title || ""),
    stations: ((stations ?? []) as AnyRow[])
      .filter((s) => String(s.career_path_id) === String(p.id))
      .map((s) => {
        const course = courseList.find((c) => String(c.station_id) === String(s.id));
        const ls = course ? lessonsByCourse.get(String(course.id)) ?? [] : [];
        const sum = (list: AnyRow[]) => list.reduce((t, l) => t + Number(l.video_duration_seconds ?? 0), 0);
        const fund = ls.filter((l) => norm(l.course_part).startsWith("fund"));
        const adv = ls.filter((l) => norm(l.course_part) === "advanced");
        const split = String(course?.level ?? "") === "split" && (fund.length || adv.length);
        const levels: ProfessionalLevel[] = split
          ? [
              { key: "fundamental", title: "الأساسيات", lessons: fund.length, seconds: sum(fund) },
              { key: "advanced", title: "المتقدم", lessons: adv.length, seconds: sum(adv) },
              { key: "integrated", title: "المتكاملة (الأساسيات + المتقدم)", lessons: fund.length + adv.length, seconds: sum(fund) + sum(adv) },
            ]
          : [{ key: "integrated", title: "الرحلة المتكاملة", lessons: ls.length, seconds: sum(ls) }];
        return {
          id: String(s.id),
          slug: String(s.slug ?? ""),
          title: String(s.title ?? course?.title ?? ""),
          courseCode: String(course?.course_code ?? ""),
          courseTitle: String(course?.title_ar || course?.title || s.title || ""),
          description: course?.subtitle ? String(course.subtitle) : null,
          comingSoon: ls.length === 0,
          levels,
          lessons: ls.length,
          seconds: sum(ls),
          enrollment: course ? enrollmentByCourse.get(String(course.id)) ?? null : null,
        };
      }),
  }));
}
