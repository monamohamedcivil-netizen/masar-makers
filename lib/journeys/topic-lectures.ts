import "server-only";

import { createAdminClient, createClient } from "@/lib/supabase/server";

/*
 * صفحتا «رحلات اليوم الواحد» و«الرحلات المجانية»:
 * كل محاضرات النوع في المنصة، مقسّمة حسب المسار ثم «أقسام» المسار (lesson_topics)،
 * والمحاضرة قد تظهر في أكثر من قسم (lesson_topic_links).
 * لكل محاضرة حالة اشتراك الطالب الحالي (action_key = workshop:lesson:ID / free:lesson:ID).
 */

type AnyRow = Record<string, any>;
export type LectureKind = "workshop" | "free";

export type TopicLecture = {
  id: string;
  title: string;
  courseId: string;
  courseCode: string;
  courseTitle: string;
  coursePart: string;
  durationSeconds: number;
  actionKey: string;
  enrollmentStatus: string | null;
};

export type LectureTopic = { id: string | null; title: string; lectures: TopicLecture[] };
export type LecturePath = { id: string; slug: string; title: string; topics: LectureTopic[] };

const KIND_TYPES: Record<LectureKind, string[]> = {
  workshop: ["workshop", "one_day", "one-day", "one_day_workshop", "one-day-workshop"],
  free: ["free", "free_session", "free-session", "free_journey"],
};

const norm = (v: unknown) => String(v ?? "").trim().toLowerCase();

export async function getTopicLectures(kind: LectureKind): Promise<LecturePath[]> {
  const db = createAdminClient();

  const [{ data: paths }, { data: courses }, { data: journeys }] = await Promise.all([
    db.from("career_paths").select("id,slug,title,title_ar,display_order").order("display_order"),
    db.from("courses").select("id,course_code,title,title_ar,career_path_id,is_active"),
    db.from("journeys").select("id,course_id,journey_type,is_active").eq("is_active", true),
  ]);

  const journeyIds = ((journeys ?? []) as AnyRow[])
    .filter((j) => KIND_TYPES[kind].includes(norm(j.journey_type)))
    .map((j) => String(j.id));
  if (!journeyIds.length) return [];

  const { data: links } = await db.from("lesson_journeys").select("lesson_id").in("journey_id", journeyIds);
  const lessonIds = [...new Set(((links ?? []) as AnyRow[]).map((l) => String(l.lesson_id)))];
  if (!lessonIds.length) return [];

  const [{ data: lessons }, { data: topicLinks }, { data: topics }] = await Promise.all([
    db
      .from("lessons")
      .select("id,course_id,title,title_ar,course_part,sort_order,video_duration_seconds,status")
      .in("id", lessonIds)
      .eq("status", "published"),
    db.from("lesson_topic_links").select("lesson_id,topic_id").in("lesson_id", lessonIds),
    db.from("lesson_topics").select("id,career_path_id,title,sort_order,is_active").eq("is_active", true).order("sort_order"),
  ]);

  // Current student's subscriptions (to show «ابدأ / شاهد» instead of «اشترك»).
  const statusByKey = new Map<string, string>();
  try {
    const auth = await createClient();
    const {
      data: { user },
    } = await auth.auth.getUser();
    if (user) {
      const { data: mine } = await db
        .from("enrollments")
        .select("action_key,status")
        .eq("user_id", user.id)
        .like("action_key", `${kind}:lesson:%`);
      for (const e of (mine ?? []) as AnyRow[]) {
        if (e.action_key) statusByKey.set(String(e.action_key), String(e.status));
      }
    }
  } catch {
    /* visitor */
  }

  const courseById = new Map(((courses ?? []) as AnyRow[]).map((c) => [String(c.id), c]));
  const topicsByLesson = new Map<string, string[]>();
  for (const l of (topicLinks ?? []) as AnyRow[]) {
    const list = topicsByLesson.get(String(l.lesson_id)) ?? [];
    list.push(String(l.topic_id));
    topicsByLesson.set(String(l.lesson_id), list);
  }

  const lectures = ((lessons ?? []) as AnyRow[])
    .map((l) => {
      const course = courseById.get(String(l.course_id));
      const actionKey = `${kind}:lesson:${l.id}`;
      return {
        pathId: String(course?.career_path_id ?? ""),
        topicIds: topicsByLesson.get(String(l.id)) ?? [],
        lecture: {
          id: String(l.id),
          title: String(l.title_ar || l.title || "محاضرة").trim(),
          courseId: String(l.course_id),
          courseCode: String(course?.course_code ?? ""),
          courseTitle: String(course?.title_ar || course?.title || ""),
          coursePart: String(l.course_part ?? "single"),
          durationSeconds: Math.max(0, Number(l.video_duration_seconds ?? 0)),
          actionKey,
          enrollmentStatus: statusByKey.get(actionKey) ?? null,
          sortOrder: Number(l.sort_order ?? 0),
        },
      };
    })
    .filter((x) => x.pathId);

  const partRank = (p: string) => (norm(p).startsWith("fund") ? 1 : norm(p) === "advanced" ? 2 : 0);
  const sortLectures = (list: Array<TopicLecture & { sortOrder: number }>) =>
    list.sort(
      (a, b) =>
        a.courseCode.localeCompare(b.courseCode) || partRank(a.coursePart) - partRank(b.coursePart) || a.sortOrder - b.sortOrder,
    );
  const strip = (list: Array<TopicLecture & { sortOrder: number }>): TopicLecture[] =>
    sortLectures(list).map(({ sortOrder: _sortOrder, ...rest }) => rest);

  return ((paths ?? []) as AnyRow[]).map((p) => {
    const pathId = String(p.id);
    const mine = lectures.filter((x) => x.pathId === pathId);
    const pathTopics = ((topics ?? []) as AnyRow[]).filter((t) => String(t.career_path_id) === pathId);
    const topicIds = new Set(pathTopics.map((t) => String(t.id)));
    const grouped: LectureTopic[] = pathTopics
      .map((t) => ({
        id: String(t.id),
        title: String(t.title),
        lectures: strip(mine.filter((x) => x.topicIds.includes(String(t.id))).map((x) => x.lecture)),
      }))
      .filter((t) => t.lectures.length);
    const others = mine.filter((x) => !x.topicIds.some((id) => topicIds.has(id))).map((x) => x.lecture);
    if (others.length) grouped.push({ id: null, title: "محاضرات أخرى", lectures: strip(others) });
    return {
      id: pathId,
      slug: String(p.slug ?? ""),
      title: String(p.title_ar || p.title || ""),
      topics: grouped,
    };
  });
}
