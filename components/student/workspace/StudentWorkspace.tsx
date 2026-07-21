"use client";

import { useMemo, useState } from "react";

import type { StudentDashboardData } from "@/lib/queries/student-dashboard";
import WorkspacePanelHeader from "./WorkspacePanelHeader";
import WorkspacePanelRenderer from "./WorkspacePanelRenderer";
import WorkspaceSidebar from "./WorkspaceSidebar";
import type { WorkspaceDefinition, WorkspacePanelId } from "./types";

type Props = {
  definition: WorkspaceDefinition;
  data: StudentDashboardData;
};

export default function StudentWorkspace({ definition, data }: Props) {
  const [activePanelId, setActivePanelId] = useState<WorkspacePanelId>(
    definition.defaultPanelId,
  );

  const orderedPanels = useMemo(
    () => [...definition.panels].sort((a, b) => a.order - b.order),
    [definition.panels],
  );

  const activePanel =
    orderedPanels.find((panel) => panel.id === activePanelId) ?? orderedPanels[0];

  const learningPanels = orderedPanels.filter(
    (panel) => panel.side === "learning",
  );
  const achievementPanels = orderedPanels.filter(
    (panel) => panel.side === "achievement",
  );

  if (!activePanel) return null;

  return (
    <section className="mx-auto max-w-[1500px] px-3 py-5 sm:px-6 lg:px-8">
      <div className="grid min-h-[610px] gap-4 lg:grid-cols-[230px_minmax(0,1fr)_230px] xl:grid-cols-[250px_minmax(0,1fr)_250px]">
        <aside className="hidden lg:block">
          <WorkspaceSidebar
            title="الإنجازات"
            panels={achievementPanels}
            activePanelId={activePanel.id}
            onSelect={setActivePanelId}
          />
        </aside>

        <main className="min-w-0 overflow-hidden border border-[#DCE2EA] bg-white shadow-[0_10px_28px_rgba(7,21,46,0.07)]">
          <div className="flex gap-2 overflow-x-auto border-b border-slate-200 bg-[#07152E] p-3 lg:hidden">
            {orderedPanels.map((panel) => (
              <button
                key={panel.id}
                type="button"
                onClick={() => setActivePanelId(panel.id)}
                className={`shrink-0 px-3 py-2 text-[11px] font-black transition ${
                  activePanel.id === panel.id
                    ? "bg-[#F7B548] text-[#07152E]"
                    : "bg-white/10 text-white"
                }`}
              >
                {panel.title}
              </button>
            ))}
          </div>

          <WorkspacePanelHeader panel={activePanel} />
          <div className="min-h-[530px] p-4 sm:p-6">
            <WorkspacePanelRenderer panel={activePanel} data={data} />
          </div>
        </main>

        <aside className="hidden lg:block">
          <WorkspaceSidebar
            title="رحلاتي"
            panels={learningPanels}
            activePanelId={activePanel.id}
            onSelect={setActivePanelId}
          />
        </aside>
      </div>
    </section>
  );
}
