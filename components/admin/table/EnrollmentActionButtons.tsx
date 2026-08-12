"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  Check,
  Loader2,
  TriangleAlert,
  X,
} from "lucide-react";

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

  const [isPending, startTransition] =
    useTransition();

  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");

  const normalizedStatus =
    status.toLowerCase();

  if (normalizedStatus !== "pending") {
    return (
      <span className="text-xs text-slate-400">
        لا توجد إجراءات
      </span>
    );
  }

  const handleApprove = () => {
    const confirmed = window.confirm(
      "هل تريد اعتماد طلب الاشتراك بالنوع المحدد في الجدول؟",
    );

    if (!confirmed) return;

    setError("");
    setWarning("");

    startTransition(async () => {
      try {
        const result =
          await approveEnrollment(
            enrollmentId,
          );

        if (!result.success) {
          throw new Error(
            result.message ||
              "تعذر اعتماد الطلب.",
          );
        }

        if (result.warning) {
          setWarning(result.warning);
        }

        router.refresh();
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
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
    setWarning("");

    startTransition(async () => {
      try {
        const result =
          await rejectEnrollment(
            enrollmentId,
          );

        if (!result.success) {
          throw new Error(
            result.message ||
              "تعذر رفض الطلب.",
          );
        }

        router.refresh();
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "حدث خطأ أثناء رفض الطلب.",
        );
      }
    });
  };

  return (
    <div className="min-w-[230px]">
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

      {warning ? (
        <p className="mt-2 flex items-start gap-1.5 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs font-medium leading-5 text-amber-800">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />

          <span>{warning}</span>
        </p>
      ) : null}

      {error ? (
        <p className="mt-2 text-xs font-medium text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}