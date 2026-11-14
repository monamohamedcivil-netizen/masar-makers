import { getInternalPaymentMatcher } from "@/lib/admin/internal-accounts";
import { createAdminClient } from "@/lib/supabase/server";

/** نفس تعريف «عدد الأشخاص» في التقارير: شخص واحد مهما تعدّدت اشتراكاته (الفريق مستبعد). */
export function personKey(row: { email?: unknown; student_name?: unknown; id?: unknown }): string {
  const raw = String(row.email ?? row.student_name ?? row.id ?? "");
  return raw.split(/[\s,&;]+/)[0].toLowerCase();
}

export async function getSubscribedPeopleCount(): Promise<number> {
  try {
    const admin = createAdminClient();
    const [isInternal, { data }] = await Promise.all([
      getInternalPaymentMatcher(),
      admin.from("finance_payments").select("id,user_id,email,student_name").limit(20000),
    ]);
    const people = new Set<string>();
    for (const row of (data ?? []) as Array<Record<string, unknown>>) {
      if (isInternal(row)) continue;
      people.add(personKey(row));
    }
    return people.size;
  } catch {
    return 0;
  }
}

export const percentOf = (part: number, total: number): string =>
  total > 0 ? `${Math.round((part / total) * 1000) / 10}%` : "—";
