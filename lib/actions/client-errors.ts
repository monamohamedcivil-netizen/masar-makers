"use server";

import { headers } from "next/headers";

import { createAdminClient } from "@/lib/supabase/server";

const cut = (v: unknown, n: number) => String(v ?? "").slice(0, n);

/** Saves a browser error (page crash) so the cause can be found later. Never throws. */
export async function reportClientError(input: {
  url?: string;
  message?: string;
  digest?: string;
  stack?: string;
  recovered?: boolean;
}) {
  try {
    let userAgent = "";
    try {
      userAgent = (await headers()).get("user-agent") ?? "";
    } catch {
      /* ignore */
    }
    await createAdminClient()
      .from("client_error_logs")
      .insert({
        url: cut(input?.url, 500),
        message: cut(input?.message, 1000),
        digest: cut(input?.digest, 100),
        stack: cut(input?.stack, 3000),
        user_agent: cut(userAgent, 400),
        recovered: Boolean(input?.recovered),
      });
  } catch {
    /* logging must never break the page */
  }
}
