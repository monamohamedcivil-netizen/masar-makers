"use client";

import {
  Rocket,
  Save,
} from "lucide-react";
import {
  useMemo,
  useState,
} from "react";

import ProfessionalActionEditor from "./ProfessionalActionEditor";
import ProfessionalColumn from "./ProfessionalColumn";
import ProfessionalContentDialog from "./ProfessionalContentDialog";

import {
  cloneProfessionalBlock,
  createEmptyImageBlock,
  createEmptyListBlock,
  createEmptyVideoBlock,
} from "./ProfessionalPanelUtils";

import type {
  ProfessionalContentBlock,
  ProfessionalEditorContentType,
  ProfessionalJourneyColumn,
  ProfessionalPanelDraft,
} from "./ProfessionalPanelTypes";

type ProfessionalPanelEditorProps = {
  value: ProfessionalPanelDraft;
  onChange: (value: ProfessionalPanelDraft) => void;
  onSave?: (
    value: ProfessionalPanelDraft
  ) => Promise<void> | void;
  isSaving?: boolean;
};

export default function ProfessionalPanelEditor({
  value,
  onChange,
  onSave,
  isSaving = false,
}: ProfessionalPanelEditorProps) {
  const [editingBlock, setEditingBlock] =
    useState<ProfessionalContentBlock | null>(null);

  const fundamentalBlocks = useMemo(
    () =>
      value.blocks.filter(
        (block) => block.journey === "fundamental"
      ),
    [value.blocks]
  );

  const advancedBlocks = useMemo(
    () =>
      value.blocks.filter(
        (block) => block.journey === "advanced"
      ),
    [value.blocks]
  );

  const updatePanel = <
    K extends keyof ProfessionalPanelDraft,
  >(
    key: K,
    nextValue: ProfessionalPanelDraft[K]
  ) => {
    onChange({
      ...value,
      [key]: nextValue,
    });
  };

  const openCreateEditor = (
    type: ProfessionalEditorContentType,
    journey: ProfessionalJourneyColumn
  ) => {
    if (type === "list") {
      setEditingBlock(createEmptyListBlock(journey));
      return;
    }

    if (type === "image") {
      setEditingBlock(createEmptyImageBlock(journey));
      return;
    }

    setEditingBlock(createEmptyVideoBlock(journey));
  };

  const openEditEditor = (
    block: ProfessionalContentBlock
  ) => {
    setEditingBlock(cloneProfessionalBlock(block));
  };

  const saveEditedBlock = () => {
    if (!editingBlock) return;

    const exists = value.blocks.some(
      (block) => block.id === editingBlock.id
    );

    const nextBlocks = exists
      ? value.blocks.map((block) =>
          block.id === editingBlock.id
            ? editingBlock
            : block
        )
      : [...value.blocks, editingBlock];

    updatePanel("blocks", nextBlocks);
    setEditingBlock(null);
  };

  const deleteBlock = (blockId: string) => {
    const approved = window.confirm(
      "هل أنتِ متأكدة من حذف هذا المحتوى؟"
    );

    if (!approved) return;

    updatePanel(
      "blocks",
      value.blocks.filter(
        (block) => block.id !== blockId
      )
    );
  };

  const moveBlock = (
    blockId: string,
    direction: "up" | "down"
  ) => {
    const currentIndex = value.blocks.findIndex(
      (block) => block.id === blockId
    );

    if (currentIndex < 0) return;

    const currentBlock = value.blocks[currentIndex];

    const sameColumnIndexes = value.blocks
      .map((block, index) => ({ block, index }))
      .filter(
        ({ block }) =>
          block.journey === currentBlock.journey
      )
      .map(({ index }) => index);

    const positionInColumn =
      sameColumnIndexes.indexOf(currentIndex);

    const targetPosition =
      direction === "up"
        ? positionInColumn - 1
        : positionInColumn + 1;

    const targetIndex =
      sameColumnIndexes[targetPosition];

    if (targetIndex === undefined) return;

    const nextBlocks = [...value.blocks];

    [
      nextBlocks[currentIndex],
      nextBlocks[targetIndex],
    ] = [
      nextBlocks[targetIndex],
      nextBlocks[currentIndex],
    ];

    updatePanel("blocks", nextBlocks);
  };

  return (
    <div
      dir="rtl"
      className="overflow-visible rounded-[28px] border border-[#DCE3EB] bg-white shadow-[0_22px_60px_rgba(7,21,46,0.10)]"
    >
      <div className="sticky top-[88px] z-30 rounded-t-[28px] border-b border-[#F7B548]/35 bg-[linear-gradient(135deg,#07152E_0%,#10294E_100%)] px-5 py-5 text-white shadow-[0_12px_28px_rgba(7,21,46,0.20)] sm:px-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F7B548]/15 text-[#F7B548]">
              <Rocket size={22} />
            </div>

            <div className="min-w-0">
              <h2 className="truncate text-xl font-black text-[#F7B548] sm:text-2xl">
                {value.screenTitle || "رحلة الاحتراف المتكاملة"}
              </h2>

              {value.screenSubtitle && (
                <p className="mt-2 text-xs font-bold leading-6 text-white/75 sm:text-sm">
                  {value.screenSubtitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {value.screenAction.enabled && (
              <span className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#F7B548]/50 bg-[#F7B548] px-4 py-3 text-xs font-black text-[#07152E]">
                {value.screenAction.label || "اشترك الآن"}
              </span>
            )}

            <button
              type="button"
              onClick={() => onSave?.(value)}
              disabled={isSaving}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#F7B548] px-5 py-3 text-sm font-black text-[#07152E] transition hover:-translate-y-0.5 hover:bg-[#FFC765] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save size={17} />
              {isSaving
                ? "جارٍ الحفظ..."
                : "حفظ تعديلات الشاشة"}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6 bg-[#F7F8FA] p-4 sm:p-6">
        <section className="rounded-2xl border border-[#DCE3EB] bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-5">
            <h3 className="text-base font-black text-[#07152E]">
              إعدادات الشاشة
            </h3>
            <p className="mt-1 text-xs font-bold text-slate-500">
              العنوان الرئيسي ذهبي على خلفية كحلية، وعناوين الأعمدة بدرجات كحلي أفتح.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <EditorField label="عنوان الشاشة">
              <input
                value={value.screenTitle}
                onChange={(event) =>
                  updatePanel(
                    "screenTitle",
                    event.target.value
                  )
                }
                placeholder="مثال: رحلة الاحتراف المتكاملة"
                className={inputClassName}
              />
            </EditorField>

            <EditorField label="الوصف أسفل العنوان">
              <input
                value={value.screenSubtitle}
                onChange={(event) =>
                  updatePanel(
                    "screenSubtitle",
                    event.target.value
                  )
                }
                placeholder="مثال: تشمل رحلة الأساسيات + الرحلة المتقدمة"
                className={inputClassName}
              />
            </EditorField>

            <EditorField label="عدد الأعمدة">
              <select
                value={value.columnCount}
                onChange={(event) =>
                  updatePanel(
                    "columnCount",
                    Number(event.target.value) as 1 | 2
                  )
                }
                className={inputClassName}
              >
                <option value={1}>عمود واحد</option>
                <option value={2}>عمودان</option>
              </select>
            </EditorField>

            <EditorField label="عنوان العمود الأول">
              <input
                value={value.columnOneTitle}
                onChange={(event) =>
                  updatePanel(
                    "columnOneTitle",
                    event.target.value
                  )
                }
                placeholder="مثال: رحلة الأساسيات"
                className={inputClassName}
              />
            </EditorField>

            {value.columnCount === 2 && (
              <EditorField label="عنوان العمود الثاني">
                <input
                  value={value.columnTwoTitle}
                  onChange={(event) =>
                    updatePanel(
                      "columnTwoTitle",
                      event.target.value
                    )
                  }
                  placeholder="مثال: الرحلة المتقدمة"
                  className={inputClassName}
                />
              </EditorField>
            )}
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            <ProfessionalActionEditor
              title="زر عنوان الشاشة"
              value={value.screenAction}
              onChange={(nextValue) =>
                updatePanel("screenAction", nextValue)
              }
            />

            <ProfessionalActionEditor
              title="زر العمود الأول"
              value={value.columnOneAction}
              onChange={(nextValue) =>
                updatePanel("columnOneAction", nextValue)
              }
            />

            {value.columnCount === 2 && (
              <ProfessionalActionEditor
                title="زر العمود الثاني"
                value={value.columnTwoAction}
                onChange={(nextValue) =>
                  updatePanel("columnTwoAction", nextValue)
                }
              />
            )}
          </div>
        </section>

        <div
          className={
            value.columnCount === 2
              ? "grid gap-5 xl:grid-cols-2"
              : "grid gap-5"
          }
        >
          <ProfessionalColumn
            title={value.columnOneTitle || "رحلة الأساسيات"}
            action={value.columnOneAction}
            journey="fundamental"
            blocks={fundamentalBlocks}
            onAdd={openCreateEditor}
            onEdit={openEditEditor}
            onDelete={deleteBlock}
            onMove={moveBlock}
          />

          {value.columnCount === 2 && (
            <ProfessionalColumn
              title={value.columnTwoTitle || "الرحلة المتقدمة"}
              action={value.columnTwoAction}
              journey="advanced"
              blocks={advancedBlocks}
              onAdd={openCreateEditor}
              onEdit={openEditEditor}
              onDelete={deleteBlock}
              onMove={moveBlock}
            />
          )}
        </div>
      </div>

      {editingBlock && (
        <ProfessionalContentDialog
          block={editingBlock}
          onChange={setEditingBlock}
          onClose={() => setEditingBlock(null)}
          onSave={saveEditedBlock}
        />
      )}
    </div>
  );
}

function EditorField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black text-[#07152E]">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputClassName =
  "w-full rounded-xl border border-[#D8E0E9] bg-white px-4 py-3 text-sm font-bold text-[#07152E] outline-none transition placeholder:text-slate-400 focus:border-[#F7B548] focus:ring-4 focus:ring-[#F7B548]/15";
