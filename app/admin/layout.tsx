import { redirect } from "next/navigation";

import AdminShell from "@/components/admin/layout/AdminShell";
import { createClient } from "@/lib/supabase/server";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default async function AdminLayout({
  children,
}: AdminLayoutProps) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if (profileError || profile?.role !== "admin") {
    redirect("/");
  }

  const adminName =
    profile.full_name ??
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    "مدير المنصة";

  return (
    <AdminShell
      adminName={adminName}
      adminEmail={user.email ?? ""}
    >
      {children}
    </AdminShell>
  );
}