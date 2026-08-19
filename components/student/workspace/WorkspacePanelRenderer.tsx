import type { StudentDashboardData } from "@/lib/queries/student-dashboard";
import WorkspacePanelContent from "./panels/WorkspacePanelContent";
import type { WorkspacePanelDefinition } from "./types";

export default function WorkspacePanelRenderer({
  panel,
  data,
  initialLessonId,
}: {
  panel: WorkspacePanelDefinition;
  data: StudentDashboardData;
  initialLessonId?: string;
}) {
  return (
    <WorkspacePanelContent
      panel={panel}
      data={data}
      initialLessonId={initialLessonId}
    />
  );
}