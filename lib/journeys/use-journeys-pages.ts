"use client";

import { useEffect, useState } from "react";

import { JOURNEYS_PAGES_PREVIEW } from "@/lib/journeys/flags";
import { createClient } from "@/lib/supabase/client";

const KEY = "mm_journeys_preview_admin";

/** true when the new journeys pages are open for this viewer (everyone after launch, admins during preview). */
export function useJourneysPagesEnabled() {
  const [enabled, setEnabled] = useState(!JOURNEYS_PAGES_PREVIEW);

  useEffect(() => {
    if (!JOURNEYS_PAGES_PREVIEW) return;
    try {
      const cached = window.sessionStorage.getItem(KEY);
      if (cached === "1") return setEnabled(true);
    } catch {
      /* ignore */
    }
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        let admin = false;
        if (user) {
          const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
          admin = ["admin", "super_admin"].includes(String(data?.role ?? ""));
        }
        try {
          if (admin) window.sessionStorage.setItem(KEY, "1");
        } catch {
          /* ignore */
        }
        if (!cancelled) setEnabled(admin);
      } catch {
        /* visitor */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return enabled;
}
