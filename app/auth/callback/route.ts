import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/auth/confirmed";

  if (!code) {
    return NextResponse.redirect(
      `${origin}/login?error=invalid_confirmation_link`
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
      `${origin}/login?error=confirmation_failed`
    );
  }

  return NextResponse.redirect(`${origin}${next}`);
}