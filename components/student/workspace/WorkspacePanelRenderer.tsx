import type { StudentDashboardData } from "@/lib/queries/student-dashboard";
import WorkspacePanelContent from "./panels/WorkspacePanelContent";
import type { WorkspacePanelDefinition } from "./types";

export default function WorkspacePanelRenderer({
  panel,
  data,
}: {
  panel: WorkspacePanelDefinition;
  data: StudentDashboardData;
}) {
  return <WorkspacePanelContent panel={panel} data={data} />;
}
