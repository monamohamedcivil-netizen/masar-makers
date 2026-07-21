"use client";

import {
  FileImage,
  ListChecks,
  MonitorPlay,
  Plus,
} from "lucide-react";

import ProfessionalContentCard from "./ProfessionalContentCard";

import type {
  ProfessionalActionConfig,
  ProfessionalContentBlock,
  ProfessionalEditorContentType,
  ProfessionalJourneyColumn,
} from "./ProfessionalPanelTypes";

type ProfessionalColumnProps = {
  title: string;
  action: ProfessionalActionConfig;
  journey: ProfessionalJourneyColumn;
  blocks: ProfessionalContentBlock[];
  onAdd: (
    type: ProfessionalEditorContentType,
    journey: ProfessionalJourneyColumn
  ) => void;
  onEdit: (block: ProfessionalContentBlock) => void;
  onDelete: (blockId: string) => void;
  onMove: (
    blockId: string,
    direction: "up" | "down"
  ) => void;
};

export default function ProfessionalColumn({
  title,
  action,
  journey,
  blocks,
  onAdd,
  onEdit,
  onDelete,
  onMove,
}: ProfessionalColumnProps) {
  const isFundamental = journey === "fundamental";

  return (
    <section className="overflow-hidden rounded-[22px] border border-[#DCE3EB] bg-white shadow-[0_12px_35px_rgba(7,21,46,0.06)]">
      <div
        className={`flex min-h-[86px] flex-wrap items-center justify-between gap-4 border-b px-5 py-4 text-white ${
          isFundamental
            ? "border-[#315D91] bg-[#214B75]"
            : "border-[#3D5685] bg-[#263F6D]"
        }`}
      >
        <div>
          <p className="text-[10px] font-black text-[#F7B548]">
            محتوى العمود
          </p>
          <h3 className="mt-1 text-lg font-black">
            {title}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {action.enabled && (
            <span className="rounded-xl border border-white/25 bg-white px-3 py-2 text-[11px] font-black text-[#07152E]">
              {action.label || "اشترك الآن"}
            </span>
          )}

          <span className="rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-black">
            {blocks.length} محتوى
          </span>
        </div>
      </div>

      <div className="space-y-4 p-4">
        {blocks.length === 0 ? (
          <EmptyColumn />
        ) : (
          blocks.map((block, index) => (
            <ProfessionalContentCard
              key={block.id}
              block={block}
              isFirst={index === 0}
              isLast={index === blocks.length - 1}
              onEdit={() => onEdit(block)}
              onDelete={() => onDelete(block.id)}
              onMoveUp={() => onMove(block.id, "up")}
              onMoveDown={() => onMove(block.id, "down")}
            />
          ))
        )}

        <div className="grid gap-2 border-t border-[#E7ECF2] pt-4 sm:grid-cols-3">
          <AddContentButton
            icon={<ListChecks size={17} />}
            label="إضافة قائمة"
            onClick={() => onAdd("list", journey)}
          />

          <AddContentButton
            icon={<FileImage size={17} />}
            label="إضافة صورة"
            onClick={() => onAdd("image", journey)}
          />

          <AddContentButton
            icon={<MonitorPlay size={17} />}
            label="إضافة فيديو"
            onClick={() => onAdd("video", journey)}
          />
        </div>
      </div>
    </section>
  );
}

function EmptyColumn() {
  return (
    <div className="rounded-2xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] px-5 py-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
        <Plus size={23} />
      </div>

      <p className="mt-4 text-sm font-black text-[#07152E]">
        لا يوجد محتوى
      </p>

      <p className="mt-1 text-xs font-bold text-slate-500">
        أضيفي قائمة أو صورة أو فيديو
      </p>
    </div>
  );
}

type AddContentButtonProps = {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
};

function AddContentButton({
  icon,
  label,
  onClick,
}: AddContentButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#DCE3EB] bg-white px-3 py-3 text-xs font-black text-[#07152E] transition hover:-translate-y-0.5 hover:border-[#F7B548] hover:bg-[#FFF8E8] hover:shadow-sm"
    >
      {icon}
      {label}
    </button>
  );
}
