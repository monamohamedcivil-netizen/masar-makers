"use client";

import { FolderOpen, Plus } from "lucide-react";

type Props = {
  onAddProject: () => void;
};

export default function EmptyProjects({
  onAddProject,
}: Props) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12">
      <div className="flex flex-col items-center gap-5 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
          <FolderOpen className="h-10 w-10 text-slate-400" />
        </div>

        <div>
          <h3 className="text-xl font-semibold text-[#07152E]">
            لا توجد مشاريع حتى الآن
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            ابدأ برفع أول مشروع قمت بتنفيذه أثناء رحلتك التدريبية.
          </p>
        </div>

        <button
          type="button"
          onClick={onAddProject}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#F7B548] bg-[#F7B548] px-5 py-3 text-sm font-semibold text-[#07152E] transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" />

          إضافة مشروع
        </button>
      </div>
    </div>
  );
}