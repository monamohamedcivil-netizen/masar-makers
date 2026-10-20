import AdminPageHeader from "@/components/admin/layout/AdminPageHeader";
import LessonContentManager from "@/components/admin/learning/LessonContentManager";
import {
  createAdminClient,
  createClient,
} from "@/lib/supabase/server";
import { getInternalAccountUserIds } from "@/lib/admin/internal-accounts";

export const dynamic = "force-dynamic";

export default async function LessonsPage() {
  const supabase = await createClient();

  const [
    { data: lessons },
    { data: courses },
    { data: journeys },
    { data: resources },
    { data: careerPaths },
    { data: stations },
    { data: lessonJourneys },
  ] = await Promise.all([
    supabase
      .from("lessons")
      .select(`
        id,
        course_id,
        journey_id,
        journey_type,
        course_part,
        slug,
        title,
        title_ar,
        title_en,
        description,
        lesson_type,
        video_url,
        file_url,
        content,
        duration_minutes,
        sort_order,
        is_preview,
        status,
        published_at,
        created_by,
        created_at,
        updated_at,
        video_provider,
        video_asset_id,
        video_status,
        video_duration_seconds,
        video_size_bytes,
        video_thumbnail_url,
        video_updated_at,
        courses (
          id,
          title,
          title_ar,
          career_path_id,
          station_id,
          display_order
        ),
        journeys (
          id,
          title,
          journey_type
        )
      `)
      .order("sort_order", { ascending: true }),

    supabase
      .from("courses")
      .select(`
        id,
        title,
        title_ar,
        career_path_id,
        station_id,
        display_order
      `)
      .order("display_order", { ascending: true }),

    supabase
      .from("journeys")
      .select(`
        id,
        course_id,
        title,
        journey_type,
        display_order,
        is_active
      `)
      .order("display_order", { ascending: true }),

   supabase
  .from("lesson_resources")
  .select(`
    id,
    lesson_id,
    journey_id,
    course_id,
    course_part,
    resource_scope,
    title,
    resource_type,
    file_url,
    file_path,
    external_url,
    display_order,
    is_active
  `)
      .order("display_order", { ascending: true }),

    supabase
      .from("career_paths")
      .select(`
        id,
        title,
        title_ar,
        short_title,
        display_order,
        is_active
      `)
      .order("display_order", { ascending: true }),

    supabase
      .from("course_stations")
      .select(`
        id,
        career_path_id,
        title,
        short_title,
        display_order,
        is_active
      `)
      .order("display_order", { ascending: true }),

    supabase
      .from("lesson_journeys")
      .select(`
        id,
        lesson_id,
        journey_id
      `),
  ]);

  /*
   * إحصائيات التشغيل لكل محاضرة (بدون الحسابات الداخلية):
   *  - plays: مرات التشغيل (من العدّاد، وللمحاضرات القديمة قبل العدّاد
   *    نعتبر كل طالب بدأها مرة واحدة على الأقل).
   *  - students: عدد الطلاب الذين شغّلوها.
   */
  const admin = createAdminClient();
  const internalIds = new Set(await getInternalAccountUserIds());

  const [{ data: playRows }, { data: progressRows }] = await Promise.all([
    admin
      .from("lesson_play_counts")
      .select("lesson_id,user_id,play_count"),
    admin
      .from("lesson_progress")
      .select("lesson_id,user_id,progress_percent,completed,last_position_seconds,started_at"),
  ]);

  const perLessonUser = new Map<string, Map<string, number>>();

  function bump(lessonId: string, userId: string, plays: number) {
    if (internalIds.has(userId)) return;
    const users = perLessonUser.get(lessonId) ?? new Map<string, number>();
    users.set(userId, Math.max(users.get(userId) ?? 0, plays));
    perLessonUser.set(lessonId, users);
  }

  for (const row of playRows ?? []) {
    bump(String(row.lesson_id), String(row.user_id), Number(row.play_count ?? 0));
  }

  for (const row of progressRows ?? []) {
    const started =
      Boolean(row.completed) ||
      Number(row.progress_percent ?? 0) > 0 ||
      Number(row.last_position_seconds ?? 0) > 0 ||
      Boolean(row.started_at);

    if (started) {
      bump(String(row.lesson_id), String(row.user_id), 1);
    }
  }

  const lessonStats: Record<string, { plays: number; students: number }> = {};

  for (const [lessonId, users] of perLessonUser) {
    let plays = 0;
    users.forEach((count) => {
      plays += count;
    });
    lessonStats[lessonId] = { plays, students: users.size };
  }

  /*
   * عدد الطلاب المشتركين (اشتراك مفعّل) في كل كورس حسب نوع الرحلة،
   * بدون الحسابات الداخلية. كل طالب يُعدّ مرة واحدة لكل نوع.
   */
  const { data: enrollmentRows } = await admin
    .from("enrollments")
    .select("course_id,user_id,journey_type,status");

  const activeStatuses = new Set([
    "active",
    "approved",
    "enrolled",
    "confirmed",
    "completed",
  ]);

  const seen = {
    professional: new Map<string, Set<string>>(),
    oneDay: new Map<string, Set<string>>(),
    free: new Map<string, Set<string>>(),
  };

  for (const row of enrollmentRows ?? []) {
    const userId = String(row.user_id ?? "");
    const courseId = String(row.course_id ?? "");

    if (!userId || !courseId || internalIds.has(userId)) continue;
    if (!activeStatuses.has(String(row.status ?? "").trim().toLowerCase())) continue;

    const type = String(row.journey_type ?? "").trim().toLowerCase();
    const bucket =
      type === "free" || type === "free_session" || type === "free_journey"
        ? seen.free
        : ["workshop", "one_day", "one-day", "one_day_journey", "one_day_workshop", "one-day-workshop"].includes(type)
          ? seen.oneDay
          : seen.professional;

    const users = bucket.get(courseId) ?? new Set<string>();
    users.add(userId);
    bucket.set(courseId, users);
  }

  const courseEnrollmentCounts: Record<
    string,
    { professional: number; oneDay: number; free: number }
  > = {};

  for (const course of courses ?? []) {
    const id = String(course.id);
    courseEnrollmentCounts[id] = {
      professional: seen.professional.get(id)?.size ?? 0,
      oneDay: seen.oneDay.get(id)?.size ?? 0,
      free: seen.free.get(id)?.size ?? 0,
    };
  }

  return (
    <>
      <AdminPageHeader
        title="الدروس والمحتوى"
        description="إدارة الدروس والفيديوهات والمرفقات وترتيب المحتوى حسب المسار والمحطة وقسم الكورس."
      />

      <LessonContentManager
        courseEnrollmentCounts={courseEnrollmentCounts}
        lessonStats={lessonStats}
        initialLessons={lessons ?? []}
        courses={courses ?? []}
        journeys={journeys ?? []}
        initialResources={resources ?? []}
        careerPaths={careerPaths ?? []}
        stations={stations ?? []}
        lessonJourneys={lessonJourneys ?? []}
      />
    </>
  );
}