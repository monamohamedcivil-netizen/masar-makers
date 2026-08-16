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
  initialPanelId?: WorkspacePanelId;
};

export default function StudentWorkspace({
  definition,
  data,
  initialPanelId,
}: Props) {
  const validInitialPanel =
    initialPanelId &&
    definition.panels.some(
      (panel) => panel.id === initialPanelId
    )
      ? initialPanelId
      : definition.defaultPanelId;

  const [activePanelId, setActivePanelId] =
    useState<WorkspacePanelId>(validInitialPanel);

  const orderedPanels = useMemo(
    () => [...definition.panels].sort((a, b) => a.order - b.order),
    [definition.panels],
  );

  /*
    ترتيب التابات الخارجية في الموبايل:
    1) رحلات الاحتراف
    2) اليوم الواحد
    3) المجانية
    4) الخطوة التالية
    5) Masar Passport
    ثم بقية لوحات الإنجاز بترتيبها الأصلي.
  */
  const mobilePanels = useMemo(() => {
    const priority = [
      "professional",
      "one-day",
      "free",
      "next-step",
      "passport",
    ];

    const getPriority = (panel: (typeof orderedPanels)[number]) => {
      const normalizedId = String(panel.id).toLowerCase();
      const normalizedTitle = String(panel.title).toLowerCase();

      if (
        normalizedId.includes("professional") ||
        normalizedTitle.includes("احتراف")
      ) {
        return 0;
      }

      if (
        normalizedId === "one-day" ||
        normalizedId.includes("one-day") ||
        normalizedTitle.includes("اليوم الواحد")
      ) {
        return 1;
      }

      if (
        normalizedId === "free" ||
        normalizedId.includes("free") ||
        normalizedTitle.includes("مجاني")
      ) {
        return 2;
      }

      if (
        normalizedId.includes("next-step") ||
        normalizedTitle.includes("الخطوة التالية")
      ) {
        return 3;
      }

      if (
        normalizedId.includes("passport") ||
        normalizedTitle.includes("passport")
      ) {
        return 4;
      }

      const exactIndex = priority.indexOf(normalizedId);
      return exactIndex >= 0 ? exactIndex : 100 + panel.order;
    };

    return [...orderedPanels].sort(
      (a, b) => getPriority(a) - getPriority(b),
    );
  }, [orderedPanels]);


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
    <section className="mx-auto max-w-[1450px] px-3 py-0 sm:px-6 lg:px-8">
      <div className="grid min-h-[450px] gap-0 lg:grid-cols-[230px_minmax(0,1fr)_230px] xl:grid-cols-[230px_minmax(0,1fr)_230px]">
        <aside className="hidden lg:block order-3 lg:order-3">
          <WorkspaceSidebar
            title="إنجازاتي"
            panels={achievementPanels}
            activePanelId={activePanel.id}
            onSelect={setActivePanelId}
          />
        </aside>

       <main className="order-2 min-w-0 overflow-visible lg:overflow-hidden lg:rounded-[30px] lg:border lg:border-[#DCE2EA] lg:bg-white lg:shadow-[0_18px_45px_rgba(7,21,46,0.20)]">
          {/* التابات الخارجية — نفس لغة تصميم صفحة الكورس */}
          <div
            className="
              relative z-20 grid items-end gap-[3px]
              border-b border-[#D6DDE6] bg-transparent
              px-3 pt-3 lg:hidden
            "
            style={{
              gridTemplateColumns: `repeat(${mobilePanels.length}, minmax(0, 1fr))`,
            }}
          >
            {mobilePanels.map((panel) => {
              const isActive = activePanel.id === panel.id;

              return (
                <button
                  key={panel.id}
                  type="button"
                  onClick={() => setActivePanelId(panel.id)}
                  className={`
                    relative min-w-0 px-1 text-center font-black
                    transition-all duration-200
                    ${
                      isActive
                        ? "h-[48px] rounded-t-[16px] border border-[#07152E] bg-[#07152E] text-white shadow-[0_-5px_16px_rgba(7,21,46,0.10)]"
                        : "h-[40px] rounded-t-[12px] border border-[#CBD3DE] bg-[#E7EBF0] text-[#566273] hover:bg-[#DDE3EA] hover:text-[#07152E]"
                    }
                  `}
                >
                  <span
                    className="
                      mx-auto block max-w-full
                      whitespace-normal break-words
                      text-[7px] leading-[1.15]
                      sm:text-[8px]
                    "
                  >
                    {panel.title}
                  </span>

                  {isActive ? (
                    <span className="absolute inset-x-3 bottom-0 h-[3px] bg-[#F7B548]" />
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="overflow-hidden rounded-b-[28px] rounded-t-none border border-t-0 border-[#DCE2EA] bg-white shadow-[0_18px_45px_rgba(7,21,46,0.20)] lg:contents">
            <WorkspacePanelHeader panel={activePanel} />
            <div className="min-h-[400px] px-4 pb-4 pt-2 sm:px-6 sm:pb-6 sm:pt-2">
              <WorkspacePanelRenderer panel={activePanel} data={data} />
            </div>
          </div>
        </main>

        <aside className="hidden lg:block order-1 lg:order-1">
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