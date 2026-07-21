"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, Loader2, X } from "lucide-react";

import {
  approveEnrollment,
  rejectEnrollment,
} from "@/lib/actions/admin/enrollments";

interface EnrollmentActionButtonsProps {
  enrollmentId: string;
  status: string;
}

export default function EnrollmentActionButtons({
  enrollmentId,
  status,
}: EnrollmentActionButtonsProps) {
  const router = useRouter();

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const normalizedStatus = status.toLowerCase();

  if (normalizedStatus !== "pending") {
    return (
      <span className="text-xs text-slate-400">
        لا توجد إجراءات
      </span>
    );
  }

  const handleApprove = () => {
    const confirmed = window.confirm(
      "هل تريد اعتماد طلب الاشتراك؟",
    );

    if (!confirmed) return;

    setError("");

    startTransition(async () => {
      try {
        const result = await approveEnrollment(enrollmentId);

        if (
          result &&
          typeof result === "object" &&
          "success" in result &&
          result.success === false
        ) {
          throw new Error(
            "message" in result && typeof result.message === "string"
              ? result.message
              : "تعذر اعتماد الطلب.",
          );
        }

        router.refresh();
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "حدث خطأ أثناء اعتماد الطلب.",
        );
      }
    });
  };

  const handleReject = () => {
    const confirmed = window.confirm(
      "هل تريد رفض طلب الاشتراك؟",
    );

    if (!confirmed) return;

    setError("");

    startTransition(async () => {
      try {
        const result = await rejectEnrollment(enrollmentId);

        if (
          result &&
          typeof result === "object" &&
          "success" in result &&
          result.success === false
        ) {
          throw new Error(
            "message" in result && typeof result.message === "string"
              ? result.message
              : "تعذر رفض الطلب.",
          );
        }

        router.refresh();
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "حدث خطأ أثناء رفض الطلب.",
        );
      }
    });
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleApprove}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}

          قبول
        </button>

        <button
          type="button"
          onClick={handleReject}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <X className="h-4 w-4" />
          رفض
        </button>
      </div>

      {error && (
        <p className="mt-2 text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}