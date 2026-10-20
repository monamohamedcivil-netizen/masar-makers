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
  needsPrice?: boolean;
  studentName?: string;
}

export default function EnrollmentActionButtons({
  enrollmentId,
  status,
  needsPrice = false,
  studentName = "",
}: EnrollmentActionButtonsProps) {
  const router = useRouter();

  const [isPending, startTransition] =
    useTransition();

  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [showFollowup, setShowFollowup] = useState(false);
  const [followupReason, setFollowupReason] = useState("");
  const [followupDate, setFollowupDate] = useState("");

  const normalizedStatus =
    status.toLowerCase();

  if (normalizedStatus !== "pending") {
    return (
      <span className="text-xs text-slate-400">
        لا توجد إجراءات
      </span>
    );
  }

  const runApprove = (
    followup?: { reason: string; date: string } | null,
  ) => {
    setError("");
    setWarning("");

    startTransition(async () => {
      try {
        const result =
          await approveEnrollment(
            enrollmentId,
            { followup: followup ?? null },
          );

        if (result.message === "NEEDS_PRICE_FOLLOWUP") {
          setShowFollowup(true);
          return;
        }

        if (!result.success) {
          throw new Error(
            result.message ||
              "تعذر اعتماد الطلب.",
          );
        }

        if (result.warning) {
          setWarning(result.warning);
        }

        setShowFollowup(false);
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

  const handleApprove = () => {
    if (needsPrice) {
      setShowFollowup(true);
      return;
    }

    const confirmed = window.confirm(
      "هل تريد اعتماد طلب الاشتراك بالنوع المحدد في الجدول؟",
    );

    if (!confirmed) return;

    runApprove(null);
  };

  const submitFollowup = () => {
    if (!followupReason.trim() || !followupDate) {
      setError("اكتب سبب عدم تسجيل السعر وحدّد موعد المتابعة.");
      return;
    }

    runApprove({
      reason: followupReason.trim(),
      date: followupDate,
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
    <div className="min-w-[250px]">
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

      {showFollowup ? (
        <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-3">
          <p className="flex items-start gap-1.5 text-xs font-bold leading-5 text-amber-900">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              لم يتم تسجيل قيمة اشتراك{studentName ? ` لـ ${studentName}` : ""}.
              يمكنك القبول، لكن اكتب السبب وموعد المتابعة وسيظهر في جدول
              المتابعة بالتقارير وسيصلك تنبيه في الموعد.
            </span>
          </p>

          <textarea
            value={followupReason}
            onChange={(e) => setFollowupReason(e.target.value)}
            rows={2}
            placeholder="السبب (مثال: سيدفع بعد أسبوع)"
            className="mt-2 w-full rounded-lg border border-amber-200 bg-white p-2 text-xs outline-none focus:border-[#F7B548]"
          />

          <input
            type="date"
            value={followupDate}
            onChange={(e) => setFollowupDate(e.target.value)}
            className="mt-2 h-9 w-full rounded-lg border border-amber-200 bg-white px-2 text-xs outline-none focus:border-[#F7B548]"
          />

          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={submitFollowup}
              disabled={isPending}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              قبول مع المتابعة
            </button>

            <button
              type="button"
              onClick={() => {
                setShowFollowup(false);
                setError("");
              }}
              disabled={isPending}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600"
            >
              إلغاء
            </button>
          </div>
        </div>
      ) : null}

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