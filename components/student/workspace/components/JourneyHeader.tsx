import type { ReactNode } from "react";

type Props = {
  title: string;
  eyebrow?: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
};

export default function JourneyHeader({
  title,
  eyebrow,
  description,
  actions,
  className = "",
}: Props) {
  return (
    <header className={`bg-[#07152E] px-5 py-4 text-white sm:px-6 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          {eyebrow && (
            <p className="mb-1 text-[10px] font-black text-[#F7B548]">
              {eyebrow}
            </p>
          )}
          <h3 className="text-lg font-black sm:text-xl">{title}</h3>
          {description && (
            <p className="mt-1 text-[11px] font-bold text-white/75">
              {description}
            </p>
          )}
        </div>
        {actions}
      </div>
    </header>
  );
}
