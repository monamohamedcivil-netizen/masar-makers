"use client";

import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

/** شريط يُفتح ويُقفل (لتقصير صفحات الأدمن). المحتوى يبقى محمّلًا حتى لا تضيع بيانات النموذج عند القفل. */
export default function AccordionPanel({
  title,
  hint,
  open,
  onToggle,
  children,
}: {
  title: string;
  hint?: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 bg-[#F8FAFC] px-5 py-4 text-start transition hover:bg-[#F1F5F9]"
      >
        <span className="min-w-0">
          <span className="block text-[16px] font-black text-[#07152E]">{title}</span>
          {hint ? <span className="mt-0.5 block text-[11px] font-bold text-slate-500">{hint}</span> : null}
        </span>
        <ChevronDown className={`h-5 w-5 shrink-0 text-[#C88712] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <div hidden={!open}>{children}</div>
    </div>
  );
}
