"use client";

import { ReactNode } from "react";

type JourneyAdminShellProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export default function JourneyAdminShell({
  title,
  description,
  children,
}: JourneyAdminShellProps) {
  return (
    <section
      className="
        overflow-hidden
        rounded-[28px]
        border border-[#DCE2EA]
        bg-white
        shadow-[0_18px_45px_rgba(7,21,46,0.08)]
      "
    >
      {/* Header */}
      <div
        className="
          border-b border-[#EEF2F6]
          bg-[#07152E]
          px-6 py-4
          text-white
        "
      >
        <h2 className="text-[22px] font-black">
          {title}
        </h2>

        {description && (
          <p className="mt-1 text-sm text-slate-300">
            {description}
          </p>
        )}
      </div>

      {/* Body */}
      <div className="p-6">
        {children}
      </div>
    </section>
  );
}