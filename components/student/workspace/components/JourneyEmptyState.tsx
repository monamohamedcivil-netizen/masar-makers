import Link from "next/link";
import type { LucideIcon } from "lucide-react";

type Props = {
  icon: LucideIcon;
  title: string;
  text: string;
  href?: string;
  actionLabel?: string;
};

export default function JourneyEmptyState({
  icon: Icon,
  title,
  text,
  href,
  actionLabel = "استكشف الرحلات",
}: Props) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center border border-dashed border-[#CBD5E1] bg-[#F8FAFC] px-5 py-12 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#07152E] text-[#F7B548]">
        <Icon size={26} />
      </span>
      <h3 className="mt-4 text-lg font-black text-[#07152E]">{title}</h3>
      <p className="mt-2 max-w-md text-sm font-semibold leading-7 text-slate-500">
        {text}
      </p>
      {href && (
        <Link
          href={href}
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#07152E] px-5 py-2.5 text-xs font-black text-white transition hover:-translate-y-0.5 hover:bg-[#102B50]"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
