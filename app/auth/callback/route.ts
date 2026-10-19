import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");
  // نسمح فقط بمسار داخلي يبدأ بـ "/" لمنع التحويل إلى مواقع خارجية.
  const requestedNext = searchParams.get("next") ?? "/auth/confirmed";
  const next =
    requestedNext.startsWith("/") &&
    !requestedNext.startsWith("//") &&
    !requestedNext.includes("\\")
      ? requestedNext
      : "/auth/confirmed";

  // Production:
  // https://masarmakers.com
  //
  // Local development:
  // falls back to the current origin if NEXT_PUBLIC_APP_URL is not defined.
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    origin;

  if (!code) {
    return NextResponse.redirect(
      `${appUrl}/login?error=invalid_confirmation_link`
    );
  }

  const supabase = await createClient();

  const { error } =
    await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error(
      "Email confirmation callback error:",
      error.message
    );

    return NextResponse.redirect(
      `${appUrl}/login?error=confirmation_failed`
    );
  }

  return NextResponse.redirect(`${appUrl}${next}`);
}