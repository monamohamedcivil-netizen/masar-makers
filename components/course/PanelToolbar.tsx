"use client";

import {
  ArrowDown,
  ArrowUp,
  Pencil,
} from "lucide-react";

type PanelToolbarProps = {
  title: string;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onEdit: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
};

export default function PanelToolbar({
  title,
  canMoveUp,
  canMoveDown,
  onEdit,
  onMoveUp,
  onMoveDown,
}: PanelToolbarProps) {
  return (
    <div
      className="
        absolute left-2 top-1/2
        z-20 flex
        -translate-y-1/2
        items-center gap-1
      "
    >
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onMoveUp();
        }}
        disabled={!canMoveUp}
        className="
          flex h-7 w-7
          items-center justify-center
          rounded-full
          border border-[#DCE3EB]
          bg-white text-[#07152E]
          shadow-sm transition
          hover:border-[#F7B548]
          hover:text-[#B87508]
          disabled:cursor-not-allowed
          disabled:opacity-30
        "
        aria-label={`نقل ${title} لأعلى`}
      >
        <ArrowUp size={12} />
      </button>

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onMoveDown();
        }}
        disabled={!canMoveDown}
        className="
          flex h-7 w-7
          items-center justify-center
          rounded-full
          border border-[#DCE3EB]
          bg-white text-[#07152E]
          shadow-sm transition
          hover:border-[#F7B548]
          hover:text-[#B87508]
          disabled:cursor-not-allowed
          disabled:opacity-30
        "
        aria-label={`نقل ${title} لأسفل`}
      >
        <ArrowDown size={12} />
      </button>

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onEdit();
        }}
        className="
          flex h-8 w-8
          items-center justify-center
          rounded-full
          border border-[#DCE3EB]
          bg-white text-[#07152E]
          shadow-sm transition
          hover:border-[#F7B548]
          hover:text-[#B87508]
        "
        aria-label={`تعديل ${title}`}
      >
        <Pencil size={13} />
      </button>
    </div>
  );
}