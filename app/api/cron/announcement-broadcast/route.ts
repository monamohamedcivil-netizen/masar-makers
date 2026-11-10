import { NextResponse } from "next/server";

import { broadcastAnnouncementCore } from "@/lib/admin/announcement-broadcast-core";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/*
 * إرسال الإعلانات المجدولة (إشعار + إيميل لكل الطلاب) في موعد بدء الإعلان.
 * تستدعيه جدولة Supabase (pg_cron + pg_net) كل 10 دقائق، وفقط عند وجود إعلان مستحق.
 *
 * لا يقبل أي مدخلات، ولا يرسل إلا إعلانًا علّمته الأدمن بـ auto_broadcast وحان موعد بدايته،
 * وكل قناة (إشعار / إيميل) تُرسل مرة واحدة فقط (يحميها notified_at / emailed_at).
 * نافذة المحاولة 48 ساعة من موعد البدء حتى لا يُرسل إعلان قديم بالخطأ.
 */
const WINDOW_MS = 48 * 60 * 60 * 1000;

async function run() {
  try {
    const admin = createAdminClient();
    const now = new Date();

    const { data, error } = await admin
      .from("platform_announcements")
      .select("id,starts_at,ends_at,notified_at,emailed_at")
      .eq("auto_broadcast", true)
      .eq("is_active", true)
      .not("starts_at", "is", null)
      .lte("starts_at", now.toISOString())
      .or("notified_at.is.null,emailed_at.is.null");

    if (error) throw error;

    const results: Array<{ id: string; message: string }> = [];

    for (const row of data ?? []) {
      const startsAt = new Date(String(row.starts_at)).getTime();
      const endsAt = row.ends_at ? new Date(String(row.ends_at)).getTime() : null;

      if (now.getTime() - startsAt > WINDOW_MS) continue;
      if (endsAt !== null && endsAt <= now.getTime()) continue;

      const result = await broadcastAnnouncementCore(String(row.id), {
        notify: !row.notified_at,
        email: !row.emailed_at,
      });

      results.push({ id: String(row.id), message: result.message });
    }

    return NextResponse.json({ ok: true, processed: results.length });
  } catch (error) {
    console.error("ANNOUNCEMENT BROADCAST CRON ERROR:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function POST() {
  return run();
}
