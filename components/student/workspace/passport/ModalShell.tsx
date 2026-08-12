"use client";

import { X } from "lucide-react";

interface ModalShellProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export default function ModalShell({
  title,
  onClose,
  children,
}: ModalShellProps) {
  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-[300] flex items-center justify-center bg-[#07152E]/75 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="max-h-[90vh] w-full max-w-[760px] overflow-y-auto rounded-[26px] bg-white shadow-[0_30px_90px_rgba(0,0,0,0.35)]">

        <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-[#E1E7EE] bg-white px-5 py-4">

          <h2 className="text-[18px] font-black text-[#07152E]">
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-[#07152E] transition hover:bg-[#F7B548]"
            aria-label="إغلاق"
          >
            <X size={17} />
          </button>

        </header>

        <div className="p-3 sm:p-6">
          {children}
        </div>

      </div>
    </div>
  );
}