import Link from "next/link";

import type { BuilderEntity } from "@/lib/builder/schema";

type EntityCardProps = {
  entity: BuilderEntity;
  toggleAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
};

export default function EntityCard({
  entity,
  toggleAction,
  deleteAction,
}: EntityCardProps) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="font-semibold text-lg">
            {entity.title}
          </h3>

          {entity.description && (
            <p className="text-sm text-muted-foreground">
              {entity.description}
            </p>
          )}

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Order: {entity.displayOrder}</span>

            <span>•</span>

            <span>
              {entity.active ? "Active" : "Inactive"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={entity.manageHref}
            className="rounded-md border px-3 py-2 text-sm hover:bg-muted"
          >
            Manage
          </Link>

          <form action={toggleAction}>
            <input
              type="hidden"
              name="id"
              value={entity.id}
            />

            <button
              className="rounded-md border px-3 py-2 text-sm"
            >
              {entity.active ? "Disable" : "Enable"}
            </button>
          </form>

          <form action={deleteAction}>
            <input
              type="hidden"
              name="id"
              value={entity.id}
            />

            <button
              className="rounded-md border border-red-300 px-3 py-2 text-sm text-red-600"
            >
              Delete
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}