import { ChevronLeft, Home } from "lucide-react";
import Link from "next/link";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
}

export default function AdminPageHeader({
  title,
  description,
  breadcrumbs = [],
  actions,
}: AdminPageHeaderProps) {
  return (
    <div className="mb-6">
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-slate-500">
        <Link
          href="/admin"
          className="transition hover:text-[#07152E]"
        >
          <Home className="h-4 w-4" />
        </Link>

        {breadcrumbs.map((item) => (
          <div
            key={`${item.label}-${item.href ?? ""}`}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4 text-slate-300" />

            {item.href ? (
              <Link
                href={item.href}
                className="transition hover:text-[#07152E]"
              >
                {item.label}
              </Link>
            ) : (
              <span className="font-semibold text-[#07152E]">
                {item.label}
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-black text-[#07152E] sm:text-3xl">
            {title}
          </h1>

          {description && (
            <p className="mt-2 text-sm leading-7 text-slate-500">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex flex-wrap items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}