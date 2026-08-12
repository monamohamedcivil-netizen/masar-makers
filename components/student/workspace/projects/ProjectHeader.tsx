"use client";

import { Plus } from "lucide-react";

type Props = {
  onAddProject: () => void;
};

export default function ProjectHeader({
  onAddProject,
}: Props) {
  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="space-y-2 text-right">
        <h2 className="text-2xl font-bold text-[#07152E]">
          مشاريعي
        </h2>

        <p className="text-sm text-slate-500">
          اعرض المشاريع التي قمت بتنفيذها أثناء رحلتك التدريبية.
        </p>
      </div>

      <div className="flex justify-start">
        <button
          type="button"
          onClick={onAddProject}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#07152E] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0B2148]"
        >
          <Plus className="h-4 w-4" />

          إضافة مشروع
        </button>
      </div>
    </div>
  );
}