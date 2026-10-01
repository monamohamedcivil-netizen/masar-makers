import type { StudentDashboardData } from "@/lib/queries/student-dashboard";
import WorkspacePanelContent from "./panels/WorkspacePanelContent";
import type { WorkspacePanelDefinition } from "./types";

export default function WorkspacePanelRenderer({
  panel,
  data,
  initialLessonId,
  previewUserId,
  readOnly = false,
}: {
  panel: WorkspacePanelDefinition;
  data: StudentDashboardData;
  initialLessonId?: string;
  previewUserId?: string;
  readOnly?: boolean;
}) {
  return (
    <WorkspacePanelContent
      panel={panel}
      data={data}
      initialLessonId={initialLessonId}
      previewUserId={previewUserId}
      readOnly={readOnly}
    />
  );
}