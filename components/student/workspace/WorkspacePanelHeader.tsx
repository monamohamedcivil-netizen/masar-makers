import type { WorkspacePanelDefinition } from "./types";

export default function WorkspacePanelHeader({
  panel,
}: {
  panel: WorkspacePanelDefinition;
}) {
  const Icon = panel.icon;

  return (
    <div className="relative flex min-h-[76px] items-center gap-4 border-b border-[#DCE2EA] bg-[#07152E] px-5 py-4 text-white">
      <span className="grid h-11 w-11 shrink-0 place-items-center border border-[#F7B548]/45 bg-white/10 text-[#F7B548]">
        <Icon size={21} />
      </span>
      <div>
        {panel.eyebrow ? (
          <p className="text-[10px] font-black text-[#F7B548]">
            {panel.eyebrow}
          </p>
        ) : null}
        <h1 className="mt-1 text-lg font-black sm:text-xl">{panel.title}</h1>
      </div>
      <span className="absolute bottom-0 right-0 h-[3px] w-24 bg-[#F7B548]" />
    </div>
  );
}
