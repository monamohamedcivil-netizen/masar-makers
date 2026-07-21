"use client";

import {
  ArrowDown,
  ArrowUp,
  Check,
  FileImage,
  ListChecks,
  MonitorPlay,
  Pencil,
  Trash2,
} from "lucide-react";

import type {
  ProfessionalContentBlock,
} from "./ProfessionalPanelTypes";

type ProfessionalContentCardProps = {
  block: ProfessionalContentBlock;
  isFirst: boolean;
  isLast: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
};

export default function ProfessionalContentCard({
  block,
  isFirst,
  isLast,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: ProfessionalContentCardProps) {
  const icon =
    block.type === "list" ? (
      <ListChecks size={18} />
    ) : block.type === "image" ? (
      <FileImage size={18} />
    ) : (
      <MonitorPlay size={18} />
    );

  const typeLabel =
    block.type === "list"
      ? "قائمة"
      : block.type === "image"
        ? "صورة"
        : "فيديو";

  return (
    <article className="rounded-2xl border border-[#DCE3EB] bg-white p-4 transition hover:border-[#F7B548]/70 hover:shadow-[0_12px_30px_rgba(7,21,46,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF4D8] text-[#B87508]">
            {icon}
          </div>

          <div className="min-w-0">
            <span className="text-[10px] font-black text-[#B87508]">
              {typeLabel}
            </span>

            <h4 className="mt-1 truncate text-sm font-black text-[#07152E]">
              {block.title || `${typeLabel} بدون عنوان`}
            </h4>

            {block.type === "list" && (
              <p className="mt-1 text-xs font-bold text-slate-500">
                {block.items.length} عنصر
              </p>
            )}

            {block.type === "image" && (
              <p className="mt-1 truncate text-xs font-bold text-slate-500">
                {block.imageUrl || "لم يتم إدخال رابط الصورة"}
              </p>
            )}

            {block.type === "video" && (
              <p className="mt-1 truncate text-xs font-bold text-slate-500">
                {block.videoUrl || "لم يتم إدخال رابط الفيديو"}
              </p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <SmallButton
            title="تحريك لأعلى"
            disabled={isFirst}
            onClick={onMoveUp}
          >
            <ArrowUp size={15} />
          </SmallButton>

          <SmallButton
            title="تحريك لأسفل"
            disabled={isLast}
            onClick={onMoveDown}
          >
            <ArrowDown size={15} />
          </SmallButton>

          <SmallButton title="تعديل" onClick={onEdit}>
            <Pencil size={15} />
          </SmallButton>

          <SmallButton title="حذف" danger onClick={onDelete}>
            <Trash2 size={15} />
          </SmallButton>
        </div>
      </div>

      {block.type === "list" && block.items.length > 0 && (
        <div className="mt-4 space-y-2">
          {block.items.slice(0, 3).map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-2 rounded-xl bg-[#F8FAFC] px-3 py-2"
            >
              <Check
                size={15}
                className="mt-0.5 shrink-0 text-[#B87508]"
              />

              <div className="min-w-0">
                <p className="truncate text-xs font-black text-[#07152E]">
                  {item.title || "عنصر بدون عنوان"}
                </p>

                {item.description && (
                  <p className="mt-1 line-clamp-1 text-[11px] font-bold text-slate-500">
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          ))}

          {block.items.length > 3 && (
            <p className="text-[11px] font-black text-slate-500">
              + {block.items.length - 3} عناصر أخرى
            </p>
          )}
        </div>
      )}
    </article>
  );
}

type SmallButtonProps = {
  title: string;
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
};

function SmallButton({
  title,
  children,
  onClick,
  disabled = false,
  danger = false,
}: SmallButtonProps) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-30 ${
        danger
          ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
          : "border-[#DCE3EB] bg-white text-[#07152E] hover:border-[#F7B548] hover:bg-[#FFF8E8]"
      }`}
    >
      {children}
    </button>
  );
}
