"use client";

import { Gift } from "lucide-react";

/* علبة الهدايا «جميع العروض»: نبضة ذهبية خفيفة وعدد العروض الحالية. */
export default function OffersGiftButton({
  count,
  onClick,
  label,
  compact = false,
}: {
  count: number;
  onClick: () => void;
  label: string;
  compact?: boolean;
}) {
  if (count <= 0) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`relative flex shrink-0 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-[#FFD27A] to-[#F7B548] text-[#07152E] shadow-[0_6px_16px_rgba(247,181,72,0.45)] ring-2 ring-white transition hover:scale-110 ${
        compact ? "h-9 w-9" : "h-11 w-11"
      }`}
    >
      <span className="absolute inset-0 animate-ping rounded-full bg-[#F7B548]/40 [animation-duration:2.4s]" />
      <Gift className={`relative ${compact ? "h-[18px] w-[18px]" : "h-[22px] w-[22px]"}`} />
      <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-red-600 px-1 text-[10px] font-black leading-none text-white">
        {count}
      </span>
    </button>
  );
}
