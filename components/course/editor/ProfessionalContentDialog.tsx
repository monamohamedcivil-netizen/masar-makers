"use client";

import {
  Save,
  X,
} from "lucide-react";

import ProfessionalImageEditor from "./ProfessionalImageEditor";
import ProfessionalListEditor from "./ProfessionalListEditor";
import ProfessionalVideoEditor from "./ProfessionalVideoEditor";

import type {
  ProfessionalContentBlock,
  ProfessionalJourneyColumn,
} from "./ProfessionalPanelTypes";

export default function ProfessionalContentDialog({
  block,
  onChange,
  onClose,
  onSave,
}: {
  block: ProfessionalContentBlock;
  onChange: (block: ProfessionalContentBlock) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const typeLabel =
    block.type === "list"
      ? "إضافة أو تعديل قائمة"
      : block.type === "image"
        ? "إضافة أو تعديل صورة"
        : "إضافة أو تعديل فيديو";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#07152E]/70 p-3 backdrop-blur-sm sm:p-6">
      <div
        dir="rtl"
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-[26px] bg-white shadow-[0_30px_90px_rgba(0,0,0,0.30)]"
      >
        <div className="flex items-center justify-between gap-4 border-b border-[#E7ECF2] bg-[#07152E] px-5 py-4 text-white">
          <div>
            <p className="text-[10px] font-black text-[#F7B548]">
              CONTENT EDITOR
            </p>
            <h3 className="mt-1 text-lg font-black">
              {typeLabel}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 transition hover:bg-white/20"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto bg-[#F7F8FA] p-4 sm:p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <EditorField label="عنوان المحتوى">
              <input
                value={block.title}
                onChange={(event) =>
                  onChange({
                    ...block,
                    title: event.target.value,
                  })
                }
                placeholder="اكتبي عنوان المحتوى"
                className={inputClassName}
              />
            </EditorField>

            <EditorField label="مكان الظهور">
              <select
                value={block.journey}
                onChange={(event) =>
                  onChange({
                    ...block,
                    journey: event.target
                      .value as ProfessionalJourneyColumn,
                  })
                }
                className={inputClassName}
              >
                <option value="fundamental">
                  رحلة الأساسيات
                </option>
                <option value="advanced">
                  الرحلة المتقدمة
                </option>
              </select>
            </EditorField>
          </div>

          {block.type === "list" && (
            <ProfessionalListEditor
              block={block}
              onChange={onChange}
            />
          )}

          {block.type === "image" && (
            <ProfessionalImageEditor
              block={block}
              onChange={onChange}
            />
          )}

          {block.type === "video" && (
            <ProfessionalVideoEditor
              block={block}
              onChange={onChange}
            />
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-[#E7ECF2] bg-white px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#DCE3EB] bg-white px-5 py-3 text-sm font-black text-[#07152E] transition hover:bg-slate-50"
          >
            إلغاء
          </button>

          <button
            type="button"
            onClick={onSave}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#07152E] px-5 py-3 text-sm font-black text-white transition hover:bg-[#10294E]"
          >
            <Save size={16} />
            حفظ المحتوى
          </button>
        </div>
      </div>
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
