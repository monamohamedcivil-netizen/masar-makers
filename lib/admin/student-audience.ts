import { createAdminClient } from "@/lib/supabase/server";
import {
  ANNOUNCEMENT_EMAIL_DAILY_CAP,
} from "@/lib/email/announcement-email";

/*
 * أدوات مشتركة لإرسال الإيميلات الجماعية (الإعلانات + الإيميل المخصص).
 * ملف عادي (ليس "use server") ويُستخدم من السيرفر فقط.
 */

export type Audience = Array<{
  id: string;
  email: string;
  name: string | null;
}>;

export async function loadAudience(): Promise<Audience> {
  const admin = createAdminClient();
  const audience: Audience = [];
  const pageSize = 1000;

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await admin
      .from("profiles")
      .select("id,email,full_name")
      .eq("role", "student")
      .or("is_active.is.null,is_active.eq.true")
      .order("created_at", { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) {
      throw new Error(error.message);
    }

    for (const row of data ?? []) {
      audience.push({
        id: row.id as string,
        email: String(row.email ?? "").trim(),
        name: (row.full_name as string | null) ?? null,
      });
    }

    if (!data || data.length < pageSize) {
      break;
    }
  }

  return audience;
}


export type ActivityScore = { points: number; lastAt: number };

/*
 * ترتيب نشاط الطالب (يُستخدم فقط عند زيادة العدد عن الحد اليومي للإيميل):
 *  اشتراك نشط +3 | درس بدأه +1 (وأكمله +1 إضافية) | مشروع +4 | استبيان +2
 *  شهادة +3 | دخول السحب الشهري +1 | نقاط إضافية +1
 * وعند التساوي: الأحدث نشاطًا أولًا.
 */
export async function getActivityScores(
  admin: ReturnType<typeof createAdminClient>,
): Promise<Map<string, ActivityScore>> {
  const scores = new Map<string, ActivityScore>();

  const add = (
    userId: unknown,
    points: number,
    at?: unknown,
  ) => {
    if (typeof userId !== "string" || !userId) return;

    const current = scores.get(userId) ?? { points: 0, lastAt: 0 };
    const time = at ? new Date(String(at)).getTime() : 0;

    current.points += points;

    if (Number.isFinite(time) && time > current.lastAt) {
      current.lastAt = time;
    }

    scores.set(userId, current);
  };

  async function scan(
    table: string,
    columns: string,
    handle: (row: Record<string, unknown>) => void,
    filter?: (query: any) => any,
  ) {
    const pageSize = 1000;

    for (let from = 0; ; from += pageSize) {
      let query: any = admin.from(table).select(columns);

      if (filter) query = filter(query);

      const { data, error } = await query
        .order("created_at", { ascending: true })
        .range(from, from + pageSize - 1);

      if (error) {
        console.error(`ACTIVITY SCAN ERROR (${table}):`, error.message);
        return;
      }

      for (const row of (data ?? []) as Record<string, unknown>[]) {
        handle(row);
      }

      if (!data || data.length < pageSize) return;
    }
  }

  await Promise.all([
    scan(
      "enrollments",
      "user_id,updated_at,created_at",
      (row) => add(row.user_id, 3, row.updated_at ?? row.created_at),
      (query) => query.eq("status", "active"),
    ),
    scan(
      "lesson_progress",
      "user_id,completed,last_watched_at,created_at",
      (row) =>
        add(
          row.user_id,
          row.completed ? 2 : 1,
          row.last_watched_at ?? row.created_at,
        ),
    ),
    scan("student_projects", "user_id,created_at", (row) =>
      add(row.user_id, 4, row.created_at),
    ),
    scan("student_surveys", "user_id,created_at", (row) =>
      add(row.user_id, 2, row.created_at),
    ),
    scan("certificates", "user_id,created_at", (row) =>
      add(row.user_id, 3, row.created_at),
    ),
    scan("monthly_draw_entries", "user_id,created_at", (row) =>
      add(row.user_id, 1, row.created_at),
    ),
    scan("student_bonus_points", "user_id,created_at", (row) =>
      add(row.user_id, 1, row.created_at),
    ),
  ]);

  return scores;
}


/** يرتّب الطلاب من الأكثر نشاطًا إلى الأقل. */
export async function rankByActivity<T extends { id: string }>(
  admin: ReturnType<typeof createAdminClient>,
  students: T[],
): Promise<T[]> {
  const scores = await getActivityScores(admin);

  return students
    .map((student) => ({
      student,
      score: scores.get(student.id) ?? { points: 0, lastAt: 0 },
    }))
    .sort(
      (a, b) =>
        b.score.points - a.score.points ||
        b.score.lastAt - a.score.lastAt,
    )
    .map((item) => item.student);
}

/**
 * كم إيميلًا متبقيًا من الحد اليومي لباقة Brevo المجانية؟
 * نحسب ما أُرسل في آخر 24 ساعة (إعلانات + إيميلات مخصصة).
 */
export async function getRemainingDailyEmails(
  admin: ReturnType<typeof createAdminClient>,
): Promise<{ cap: number; used: number; remaining: number }> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  let used = 0;

  const { data: announcements } = await admin
    .from("platform_announcements")
    .select("email_sent_count")
    .gte("emailed_at", since);

  for (const row of announcements ?? []) {
    used += Number(row.email_sent_count ?? 0);
  }

  // الجدول قد لا يكون موجودًا قبل تنفيذ التعديل، فنتجاهل الخطأ.
  const { data: campaigns } = await admin
    .from("admin_email_campaigns")
    .select("sent_count")
    .gte("created_at", since);

  for (const row of campaigns ?? []) {
    used += Number(row.sent_count ?? 0);
  }

  return {
    cap: ANNOUNCEMENT_EMAIL_DAILY_CAP,
    used,
    remaining: Math.max(0, ANNOUNCEMENT_EMAIL_DAILY_CAP - used),
  };
}
