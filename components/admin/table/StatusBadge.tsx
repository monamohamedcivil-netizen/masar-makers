interface StatusBadgeProps {
  status: string;
}

const statusStyles: Record<string, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  rejected: "border-red-200 bg-red-50 text-red-700",
  suspended: "border-slate-300 bg-slate-100 text-slate-700",
  expired: "border-orange-200 bg-orange-50 text-orange-700",
};

const statusLabels: Record<string, string> = {
  pending: "قيد المراجعة",
  approved: "مقبول",
  active: "نشط",
  rejected: "مرفوض",
  suspended: "موقوف",
  expired: "منتهي",
};

export default function StatusBadge({
  status,
}: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase();

  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold",
        statusStyles[normalizedStatus] ??
          "border-slate-200 bg-slate-50 text-slate-600",
      ].join(" ")}
    >
      {statusLabels[normalizedStatus] ?? status}
    </span>
  );
}