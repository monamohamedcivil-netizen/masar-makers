import type { WorkspacePanelDefinition } from "./types";

export default function WorkspacePanelHeader({
  panel,
}: {
  panel: WorkspacePanelDefinition;
}) {
  const Icon = panel.icon;

  return (
    <div className="relative flex min-h-[50px] items-center gap-4 border-b border-[#DCE2EA] bg-[#07152E] px-5 py-1.5 text-white">
      <span className="grid h-11 w-11 shrink-0 place-items-center text-[#F7B548]">
        <Icon size={30} />
      </span>
      <div>
        {panel.eyebrow ? (
          <p className="text-[10px] font-black text-[#F7B548]">
            {panel.eyebrow}
          </p>
        ) : null}
        <h1 className="mt-0.5 text-lg font-black sm:text-xl">{panel.title}</h1>
      </div>
      <span className="absolute bottom-0 right-0 h-[3px] w-24 bg-[#F7B548]" />
    </div>
  );
}
