import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const protectedRoutes = [
  "/career-path",
  "/course",
  "/journeys",
  "/workshops",
  "/free",
  "/achievements",
  "/dashboard",
];

function isProtectedRoute(pathname: string) {
  return protectedRoutes.some(
    (route) =>
      pathname === route ||
      pathname.startsWith(`${route}/`)
  );
}

export async function updateSession(
  request: NextRequest
) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env
      .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(
            ({ name, value }) =>
              request.cookies.set(name, value)
          );

          supabaseResponse = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(
            ({ name, value, options }) =>
              supabaseResponse.cookies.set(
                name,
                value,
                options
              )
          );

          Object.entries(headers).forEach(
            ([key, value]) =>
              supabaseResponse.headers.set(
                key,
                value
              )
          );
        },
      },
    }
  );

  /*
    مهم جدًا:
    لا تضعي أي كود بين createServerClient
    و getUser.
  */
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  /*
    حساب موقوف: نُخرجه فورًا حتى لو كانت جلسته ما زالت صالحة،
    ويُمنع من الدخول مجددًا حتى تُعاد تفعيل الحساب.
  */
  const bannedUntil = (user as { banned_until?: string | null } | null)
    ?.banned_until;

  if (
    user &&
    bannedUntil &&
    new Date(bannedUntil).getTime() > Date.now() &&
    pathname !== "/login"
  ) {
    await supabase.auth.signOut();

    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "?suspended=1";

    const redirect = NextResponse.redirect(loginUrl);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirect.cookies.set(cookie);
    });

    return redirect;
  }

  if (
    !user &&
    isProtectedRoute(pathname)
  ) {
    const loginUrl = request.nextUrl.clone();

    loginUrl.pathname = "/login";

    loginUrl.searchParams.set(
      "next",
      `${pathname}${request.nextUrl.search}`
    );

    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}