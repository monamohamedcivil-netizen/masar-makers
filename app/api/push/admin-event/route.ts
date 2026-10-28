import { NextResponse } from "next/server";

import { notifyAdminDevices } from "@/lib/push/notify";
import { createAdminClient } from "@/lib/supabase/server";

/*
 * Phone push for admin notifications created inside the database
 * (enrollment requests, certificates, surveys, WhatsApp support …).
 * Called by the Supabase trigger push_admin_notification (pg_net) with a shared secret.
 */
export async function POST(request: Request) {
  const secret = (process.env.PUSH_WEBHOOK_SECRET ?? "").trim();
  if (!secret || request.headers.get("x-push-secret") !== secret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  let body: { title?: unknown; body?: unknown; url?: unknown; tag?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const title = String(body.title ?? "").slice(0, 120);
  if (!title) return NextResponse.json({ ok: false }, { status: 400 });
  const url = String(body.url ?? "/admin");
  await notifyAdminDevices(createAdminClient(), {
    title,
    body: String(body.body ?? "").slice(0, 160),
    url: url.startsWith("/") ? url : "/admin",
    tag: body.tag ? String(body.tag).slice(0, 80) : undefined,
  });
  return NextResponse.json({ ok: true });
}
