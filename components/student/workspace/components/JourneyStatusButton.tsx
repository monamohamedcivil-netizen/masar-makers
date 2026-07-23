import Link from "next/link";

type Status = "completed" | "in_progress" | "not_started";

type Props = {
  status: Status;
  href?: string;
  className?: string;
};

const statusConfig = {
  completed: {
    label: "الرحلة مكتملة",
    className: "bg-[#70B64A] text-white",
  },
  in_progress: {
    label: "استكمل الرحلة",
    className: "bg-[#F7B548] text-[#07152E]",
  },
  not_started: {
    label: "ابدأ الرحلة",
    className: "bg-[#07152E] text-white",
  },
} as const;

export default function JourneyStatusButton({
  status,
  href,
  className = "",
}: Props) {
  const config = statusConfig[status];
  const classes = `inline-flex min-h-10 items-center justify-center rounded-xl px-4 py-2 text-xs font-black transition hover:-translate-y-0.5 ${config.className} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {config.label}
      </Link>
    );
  }

  return (
    <button type="button" className={classes}>
      {config.label}
    </button>
  );
}
