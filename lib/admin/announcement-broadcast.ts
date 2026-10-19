"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  ANNOUNCEMENT_EMAIL_DAILY_CAP,
  isAnnouncementEmailConfigured,
  sendAnnouncementEmails,
  type AnnouncementRecipient,
} from "@/lib/email/announcement-email";

/*
 * إرسال إعلان لكل الطلاب:
 *  1) إشعار داخل المنصة (جدولا notifications + notification_recipients).
 *  2) إيميل بتصميم Masar Makers.
 *
 * حماية من التكرار: نسجّل وقت الإرسال في platform_announcements
 * (notified_at / emailed_at) ونرفض أي إرسال ثانٍ لنفس الإعلان.
 */

type BroadcastResult = {
  success: boolean;
  message: string;
};

type Audience = Array<{
  id: string;
  email: string;
  name: string | null;
}>;

async function loadAudience(): Promise<Audience> {
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

export async function getBroadcastAudienceCount(): Promise<{
  count: number;
  emailCap: number;
  emailConfigured: boolean;
}> {
  await requireAdmin();

  const audience = await loadAudience();

  return {
    count: audience.length,
    emailCap: ANNOUNCEMENT_EMAIL_DAILY_CAP,
    emailConfigured: isAnnouncementEmailConfigured(),
  };
}

type ActivityScore = { points: number; lastAt: number };

/*
 * ترتيب نشاط الطالب (يُستخدم فقط عند زيادة العدد عن الحد اليومي للإيميل):
 *  اشتراك نشط +3 | درس بدأه +1 (وأكمله +1 إضافية) | مشروع +4 | استبيان +2
 *  شهادة +3 | دخول السحب الشهري +1 | نقاط إضافية +1
 * وعند التساوي: الأحدث نشاطًا أولًا.
 */
async function getActivityScores(
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

function notificationActionUrl(href: string | null) {
  const value = href?.trim() ?? "";

  if (!value || value === "#") {
    return null;
  }

  if (value.startsWith("/") || /^https?:\/\//i.test(value)) {
    return value;
  }

  return null;
}

export async function broadcastAnnouncement(
  announcementId: string,
  options: { notify: boolean; email: boolean },
): Promise<BroadcastResult> {
  try {
    await requireAdmin();

    if (!announcementId || (!options.notify && !options.email)) {
      return { success: false, message: "لم يتم اختيار قناة إرسال." };
    }

    const admin = createAdminClient();

    const { data: announcement, error: announcementError } =
      await admin
        .from("platform_announcements")
        .select(
          "id,type,title,title_en,description,description_en,button_text,href",
        )
        .eq("id", announcementId)
        .maybeSingle();

    if (announcementError || !announcement) {
      return {
        success: false,
        message:
          announcementError?.message || "الإعلان غير موجود.",
      };
    }

    const audience = await loadAudience();

    if (audience.length === 0) {
      return { success: false, message: "لا يوجد طلاب لإرسال الإعلان إليهم." };
    }

    const messages: string[] = [];
    let anyFailed = false;

    /* ---------- 1) إشعار داخل المنصة ---------- */
    if (options.notify) {
      const { data: claimed } = await admin
        .from("platform_announcements")
        .update({ notified_at: new Date().toISOString() })
        .eq("id", announcementId)
        .is("notified_at", null)
        .select("id");

      if (!claimed || claimed.length === 0) {
        messages.push("الإشعار داخل المنصة أُرسل مسبقًا لهذا الإعلان.");
      } else {
        const { data: notification, error: notificationError } =
          await admin
            .from("notifications")
            .insert({
              title: announcement.title,
              body:
                announcement.description?.trim() ||
                announcement.title,
              type: "announcement",
              action_url: notificationActionUrl(announcement.href),
            })
            .select("id")
            .single();

        let inserted = 0;
        let recipientsError: string | null = null;

        if (!notificationError && notification) {
          const rows = audience.map((student) => ({
            notification_id: notification.id as string,
            user_id: student.id,
          }));

          for (let i = 0; i < rows.length; i += 500) {
            const { error } = await admin
              .from("notification_recipients")
              .insert(rows.slice(i, i + 500));

            if (error) {
              recipientsError = error.message;
              break;
            }

            inserted += Math.min(500, rows.length - i);
          }
        }

        if (notificationError || !notification || recipientsError) {
          anyFailed = true;

          // نسمح بإعادة المحاولة لاحقًا.
          await admin
            .from("platform_announcements")
            .update({ notified_at: null })
            .eq("id", announcementId);

          messages.push(
            `تعذر إرسال الإشعار داخل المنصة: ${
              notificationError?.message || recipientsError
            }`,
          );
        } else {
          messages.push(`تم إرسال الإشعار داخل المنصة إلى ${inserted} طالب.`);
        }
      }
    }

    /* ---------- 2) إيميل ---------- */
    if (options.email && !isAnnouncementEmailConfigured()) {
      anyFailed = true;
      messages.push(
        "لم يُرسل الإيميل: خدمة Brevo غير مفعّلة بعد (المفتاح BREVO_API_KEY غير مضاف في إعدادات الاستضافة).",
      );
    } else if (options.email) {
      const { data: claimed } = await admin
        .from("platform_announcements")
        .update({ emailed_at: new Date().toISOString() })
        .eq("id", announcementId)
        .is("emailed_at", null)
        .select("id");

      if (!claimed || claimed.length === 0) {
        messages.push("الإيميل أُرسل مسبقًا لهذا الإعلان.");
      } else {
        let eligible = audience.filter((student) =>
          /^\S+@\S+\.\S+$/.test(student.email),
        );

        let skippedByCap = 0;

        // لو زاد العدد عن الحد اليومي: الإيميل لأكثر الطلاب نشاطًا فقط.
        if (eligible.length > ANNOUNCEMENT_EMAIL_DAILY_CAP) {
          const scores = await getActivityScores(admin);

          eligible = eligible
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

          skippedByCap = eligible.length - ANNOUNCEMENT_EMAIL_DAILY_CAP;
          eligible = eligible.slice(0, ANNOUNCEMENT_EMAIL_DAILY_CAP);
        }

        const recipients: AnnouncementRecipient[] = eligible.map(
          (student) => ({
            email: student.email,
            name: student.name,
          }),
        );

        const result = await sendAnnouncementEmails(
          {
            type: announcement.type,
            title: announcement.title,
            titleEn: announcement.title_en,
            description: announcement.description,
            descriptionEn: announcement.description_en,
            buttonText: announcement.button_text,
            href: announcement.href,
          },
          recipients,
        );

        await admin
          .from("platform_announcements")
          .update({
            email_sent_count: result.sent,
            email_failed_count: result.failed,
            // لو فشل الكل نسمح بإعادة المحاولة.
            emailed_at: result.sent === 0 ? null : undefined,
          })
          .eq("id", announcementId);

        if (result.failed > 0) {
          anyFailed = true;
          console.error(
            "ANNOUNCEMENT EMAIL ERRORS:",
            result.errors,
          );
        }

        messages.push(
          result.failed > 0
            ? `الإيميل: وصل إلى ${result.sent} وفشل ${result.failed}. (${result.errors[0] ?? ""})`
            : `تم إرسال الإيميل إلى ${result.sent} طالب.`,
        );

        if (skippedByCap > 0) {
          messages.push(
            `بسبب الحد اليومي (${ANNOUNCEMENT_EMAIL_DAILY_CAP}) أُرسل الإيميل لأكثر الطلاب نشاطًا، ولم يُرسل إلى ${skippedByCap} طالب (وصلهم الإشعار داخل المنصة).`,
          );
        }
      }
    }

    return {
      success: !anyFailed,
      message: messages.join(" "),
    };
  } catch (error) {
    console.error("BROADCAST ANNOUNCEMENT ERROR", error);

    return {
      success: false,
      message:
        error instanceof Error && error.message === "FORBIDDEN"
          ? "ليس لديك صلاحية لإرسال الإعلانات."
          : error instanceof Error
            ? error.message
            : "تعذر إرسال الإعلان.",
    };
  }
}
