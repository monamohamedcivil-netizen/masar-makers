import { createAdminClient } from "@/lib/supabase/server";

/**
 * يرسل إشعار منصة للمشرفين عند حلول موعد متابعة دفعة.
 * يُستدعى عند فتح لوحة التحكم (لا يوجد جدولة خارجية)، ولا يكرر الإشعار لنفس الدفعة.
 */
export async function dispatchDueFollowups() {
  try {
    const admin = createAdminClient();
    const today = new Date().toISOString().slice(0, 10);

    const { data: due } = await admin
      .from("finance_payments")
      .select("id,student_name,followup_reason")
      .eq("followup_done", false)
      .is("followup_notified_at", null)
      .not("followup_date", "is", null)
      .lte("followup_date", today)
      .limit(50);

    if (!due || due.length === 0) return;

    const { data: admins } = await admin
      .from("profiles")
      .select("id")
      .in("role", ["admin", "super_admin"]);

    const adminIds = (admins ?? []).map((a) => String(a.id));
    if (adminIds.length === 0) return;

    for (const row of due) {
      const reason = row.followup_reason ? String(row.followup_reason) : "—";
      const name = row.student_name ? String(row.student_name) : "طالب";

      const { data: notification, error } = await admin
        .from("notifications")
        .insert({
          title: "حان وقت متابعة حالة دفع",
          body: `حان وقت متابعة حالة دفع ${name} بسبب: ${reason}`,
          type: "announcement",
          action_url: "/admin/reports",
        })
        .select("id")
        .single();

      if (error || !notification) continue;

      const { error: recipientsError } = await admin
        .from("notification_recipients")
        .insert(
          adminIds.map((id) => ({
            notification_id: notification.id as string,
            user_id: id,
          })),
        );

      if (recipientsError) continue;

      await admin
        .from("finance_payments")
        .update({ followup_notified_at: new Date().toISOString() })
        .eq("id", row.id);
    }
  } catch (error) {
    console.error("FINANCE FOLLOWUP DISPATCH ERROR:", error);
  }
}
