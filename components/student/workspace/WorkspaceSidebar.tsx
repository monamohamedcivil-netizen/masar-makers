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
              className={`group flex min-h-[58px] w-full items-center gap-3 border-b border-[#E4E8EE] px-4 text-right text-[12px] font-black transition last:border-b-0 ${
                active
                  ? "bg-[#07152E] text-white"
                  : "bg-white text-[#07152E] hover:bg-[#FFF9ED]"
              }`}
            >
              <span
                className={`grid h-9 w-9 shrink-0 place-items-center border transition ${
                  active
                    ? "border-[#F7B548]/45 bg-white/10 text-[#F7B548]"
                    : "border-[#F7B548]/35 bg-[#FFF8E9] text-[#B87508] group-hover:border-[#F7B548]"
                }`}
              >
                <Icon size={17} />
              </span>
              <span>{panel.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
