import {
  createServerClient,
} from "@supabase/ssr";

import {
  createClient as createSupabaseClient,
} from "@supabase/supabase-js";

import {
  cookies,
} from "next/headers";

function getSupabaseUrl(): string {
  const value =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!value) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is missing.",
    );
  }

  return value;
}

function getSupabasePublicKey(): string {
  const value =
    process.env
      .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env
      .NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!value) {
    throw new Error(
      "Supabase publishable key is missing.",
    );
  }

  return value;
}

function getSupabaseServiceRoleKey(): string {
  const value =
    process.env
      .SUPABASE_SERVICE_ROLE_KEY;

  if (!value) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is missing.",
    );
  }

  return value;
}

export async function createClient() {
  const cookieStore =
    await cookies();

  return createServerClient(
    getSupabaseUrl(),
    getSupabasePublicKey(),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },

        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(
              ({
                name,
                value,
                options,
              }) => {
                cookieStore.set(
                  name,
                  value,
                  options,
                );
              },
            );
          } catch {
            /*
             * قد يتم استدعاء createClient من Server Component
             * لا يسمح بتعديل الكوكيز مباشرة.
             */
          }
        },
      },
    },
  );
}

export function createAdminClient() {
  return createSupabaseClient(
    getSupabaseUrl(),
    getSupabaseServiceRoleKey(),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );
}