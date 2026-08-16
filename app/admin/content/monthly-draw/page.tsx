import AdminPageHeader from "@/components/admin/layout/AdminPageHeader";
import MonthlyDrawManager from "@/components/admin/monthly-draws/MonthlyDrawManager";
import {
  getAdminMonthlyDraws,
  getMonthlyDrawParticipants,
  getMonthlyDrawSettings,
} from "@/lib/admin/monthly-draws";

export default async function MonthlyDrawPage() {
  const [draws, settings] = await Promise.all([
    getAdminMonthlyDraws(),
    getMonthlyDrawSettings(),
  ]);

  const participantsByDraw = Object.fromEntries(
    await Promise.all(
      draws.map(async (draw) => [
        draw.id,
        await getMonthlyDrawParticipants(draw.id),
      ]),
    ),
  );

  return (
    <>
      <AdminPageHeader
        title="السحب الشهري"
        description="إدارة جوائز وسحوبات Masar Makers الشهرية."
      />

      <MonthlyDrawManager
        initialDraws={draws}
        initialSettings={settings}
        initialParticipantsByDraw={participantsByDraw}
      />
    </>
  );
}