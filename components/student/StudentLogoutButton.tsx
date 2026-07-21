"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

export default function StudentLogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 text-xs font-black text-white transition hover:bg-white/15 disabled:opacity-60"
    >
      <LogOut size={16} />
      {loading ? "جارٍ الخروج..." : "تسجيل الخروج"}
    </button>
  );
}
