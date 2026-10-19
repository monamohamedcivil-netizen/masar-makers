/*
 * قاعدة السحب الشهري: لا يفوز الشخص نفسه مرتين في نفس السنة،
 * إلا إذا اختارته الإدارة يدويًا كفائز لهذا الشهر (وضع الفائز اليدوي).
 *
 * ملف عادي (ليس "use server") يُستخدم من السيرفر عند تجهيز مشاركين السحب.
 */

export type CompletedDrawWinnerRow = {
  winner_user_id: string | null;
  winner_registry_id: string | null;
  month_key: string | null;
};

export type DrawForBlocklist = {
  month_key: string;
  winner_mode?: string | null;
  preset_winner_user_id?: string | null;
  preset_winner_registry_id?: string | null;
};

export function buildYearWinnerBlocklist(
  completedRows: CompletedDrawWinnerRow[],
  draw: DrawForBlocklist,
) {
  const year = String(draw.month_key ?? "").slice(0, 4);

  const blockedUserIds = new Set<string>();
  const blockedRegistryIds = new Set<string>();

  if (/^\d{4}$/.test(year)) {
    for (const row of completedRows) {
      if (!String(row.month_key ?? "").startsWith(`${year}-`)) {
        continue;
      }

      if (row.winner_user_id) {
        blockedUserIds.add(row.winner_user_id);
      }

      if (row.winner_registry_id) {
        blockedRegistryIds.add(row.winner_registry_id);
      }
    }
  }

  // الفائز الذي اختارته الإدارة يدويًا لهذا الشهر مستثنى من الحظر.
  if (draw.winner_mode === "manual") {
    if (draw.preset_winner_user_id) {
      blockedUserIds.delete(draw.preset_winner_user_id);
    }

    if (draw.preset_winner_registry_id) {
      blockedRegistryIds.delete(draw.preset_winner_registry_id);
    }
  }

  return {
    isBlocked(userId: string | null, registryId: string | null) {
      return (
        (userId !== null && blockedUserIds.has(userId)) ||
        (registryId !== null && blockedRegistryIds.has(registryId))
      );
    },
  };
}
