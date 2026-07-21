interface CourseStatusBadgeProps {
  status?: string | null;
}

const styles: Record<string, string> = {
  draft: "border-amber-200 bg-amber-50 text-amber-700",
  published: "border-emerald-200 bg-emerald-50 text-emerald-700",
  archived: "border-slate-200 bg-slate-100 text-slate-600",
};

const labels: Record<string, string> = {
  draft: "مسودة",
  published: "منشور",
  archived: "مؤرشف",
};

export default function CourseStatusBadge({
  status,
}: CourseStatusBadgeProps) {
  const normalizedStatus = status?.toLowerCase() || "draft";

  return (
    <span
      className={[
        "inline-flex rounded-full border px-3 py-1 text-xs font-bold",
        styles[normalizedStatus] ??
          "border-slate-200 bg-slate-50 text-slate-600",
      ].join(" ")}
    >
      {labels[normalizedStatus] ?? normalizedStatus}
    </span>
  );
}