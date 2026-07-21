"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  Archive,
  Eye,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";

import {
  deleteCourse,
  updateCourseStatus,
} from "@/lib/actions/admin/courses";

interface CourseActionsProps {
  courseId: string;
  slug: string;
  status?: string | null;
}

export default function CourseActions({
  courseId,
  slug,
  status,
}: CourseActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const normalizedStatus = status?.toLowerCase() || "draft";

  const handleDelete = () => {
    const confirmed = window.confirm(
      "هل تريد حذف هذا الكورس نهائيًا؟",
    );

    if (!confirmed) return;

    setError("");

    startTransition(async () => {
      const result = await deleteCourse(courseId);

      if (!result.success) {
        setError(result.message);
        return;
      }

      router.refresh();
    });
  };

  const handleArchive = () => {
    setError("");

    startTransition(async () => {
      const result = await updateCourseStatus(
        courseId,
        normalizedStatus === "archived" ? "draft" : "archived",
      );

      if (!result.success) {
        setError(result.message);
        return;
      }

      router.refresh();
    });
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        <Link
          href={`/courses/${slug}`}
          target="_blank"
          className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100"
          title="عرض"
        >
          <Eye className="h-4 w-4" />
        </Link>

        <Link
          href={`/admin/learning/courses/${courseId}/edit`}
          className="rounded-lg border border-blue-200 bg-blue-50 p-2 text-blue-700 transition hover:bg-blue-100"
          title="تعديل"
        >
          <Pencil className="h-4 w-4" />
        </Link>

        <button
          type="button"
          onClick={handleArchive}
          disabled={isPending}
          className="rounded-lg border border-amber-200 bg-amber-50 p-2 text-amber-700 transition hover:bg-amber-100 disabled:opacity-50"
          title={
            normalizedStatus === "archived"
              ? "إلغاء الأرشفة"
              : "أرشفة"
          }
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Archive className="h-4 w-4" />
          )}
        </button>

        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-700 transition hover:bg-red-100 disabled:opacity-50"
          title="حذف"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {error && (
        <p className="mt-2 text-xs font-semibold text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}