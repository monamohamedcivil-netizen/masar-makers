"use client";

import type { WorkspacePanelDefinition, WorkspacePanelId } from "./types";

type Props = {
  title: string;
  panels: WorkspacePanelDefinition[];
  activePanelId: WorkspacePanelId;
  onSelect: (panelId: WorkspacePanelId) => void;
};

export default function WorkspaceSidebar({
  title,
  panels,
  activePanelId,
  onSelect,
}: Props) {
  return (
    <div className="sticky top-20">
      <div className="relative flex min-h-[56px] items-center justify-center px-2 text-center">
        <h2 className="relative px-2 pb-1 text-[20px] font-black text-[#B87508] drop-shadow-[0_2px_2px_rgba(7,21,46,0.14)] xl:text-[22px]">
          {title}
          <span className="absolute bottom-0 left-1/2 h-[2px] w-10 -translate-x-1/2 bg-[#F7B548]" />
        </h2>
      </div>

      <div className="overflow-hidden border border-[#DCE2EA] bg-white shadow-[0_10px_28px_rgba(7,21,46,0.07)]">
        {panels.map((panel) => {
          const active = activePanelId === panel.id;
          const Icon = panel.icon;

          return (
            <button
              key={panel.id}
              type="button"
              onClick={() => onSelect(panel.id)}
              aria-current={active ? "page" : undefined}
className={`group relative flex w-full items-center gap-3 px-4 text-right font-black transition-all duration-200 ${
  active
    ? "min-h-[56px] border-b border-[#07152E] bg-[#07152E] text-[14px] text-white"
    : "min-h-[48px] border-b border-[#DCE2EA] bg-[#EEF1F5] text-[12px] text-[#4B5563] hover:bg-[#E3E7EC]"
}`} 
            >
              <span
  className={`grid h-7 w-7 shrink-0 place-items-center transition ${
    active
      ? "text-[#F7B548]"
      : "text-[#6B7280]"
  }`}
>
  <Icon size={20} strokeWidth={1.8} />
</span>
              <span>{panel.title}</span>
              {active && (
  <span className="absolute bottom-0 left-4 right-4 h-[3px] bg-[#F7B548]" />
)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
