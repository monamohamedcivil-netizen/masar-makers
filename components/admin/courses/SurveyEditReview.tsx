"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";

import {
  approveSurveyEdit,
  rejectSurveyEdit,
} from "@/lib/actions/admin/student-surveys";

type Props = {
  surveyId: string;
  currentShowOnHome: boolean;
  currentShowOnCourse: boolean;
  pendingRating: number;
  pendingComment: string | null;
  requestedAt: string | null;
};

export default function SurveyEditReview({
  surveyId,
  currentShowOnHome,
  currentShowOnCourse,
  pendingRating,
  pendingComment,
  requestedAt,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showOnHome, setShowOnHome] = useState(currentShowOnHome);
  const [showOnCourse, setShowOnCourse] = useState(
    currentShowOnCourse,
  );
  const [error, setError] = useState("");

  function run(action: "approve" | "reject") {
    setError("");

    if (
      action === "reject" &&
      !window.confirm(
        "رفض التعديل؟ سيبقى التقييم السابق كما هو ويُحذف طلب الطالب.",
      )
    ) {
      return;
    }

    startTransition(async () => {
      const result =
        action === "approve"
          ? await approveSurveyEdit(
              surveyId,
              showOnHome,
              showOnCourse,
            )
          : await rejectSurveyEdit(surveyId);

      if (!result.success) {
        setError(result.message);
        return;
      }

      router.refresh();
    });
  }

  return (
    <div className="mt-3 space-y-3 rounded-xl border border-amber-300 bg-amber-50 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="rounded-full bg-amber-200 px-2.5 py-1 text-[11px] font-black text-amber-900">
          تعديل من الطالب بانتظار موافقتك
        </span>

        {requestedAt && (
          <span className="text-[11px] font-bold text-slate-500">
            {new Intl.DateTimeFormat("ar-EG", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            }).format(new Date(requestedAt))}
          </span>
        )}
      </div>

      <div
        className="flex gap-0.5"
        dir="ltr"
        aria-label={`${pendingRating} من 5`}
      >
        {[1, 2, 3, 4, 5].map((value) => (
          <Star
            key={value}
            className={`h-4 w-4 ${
              value <= pendingRating
                ? "fill-[#F7B548] text-[#F7B548]"
                : "fill-slate-200 text-slate-200"
            }`}
          />
        ))}
      </div>

      <p className="whitespace-pre-wrap text-sm leading-6 text-slate-800">
        {pendingComment || "بدون تعليق"}
      </p>

      <div className="space-y-2 border-t border-amber-200 pt-3">
        <p className="text-xs font-black text-[#07152E]">
          عند الموافقة، هل يظهر هذا التقييم؟
        </p>

        <label className="flex cursor-pointer items-center gap-2 text-xs font-bold text-slate-700">
          <input
            type="checkbox"
            checked={showOnHome}
            onChange={(e) => setShowOnHome(e.target.checked)}
            className="h-4 w-4 accent-[#F7B548]"
          />
          في مركز الرحلات (الصفحة الرئيسية)
        </label>

        <label className="flex cursor-pointer items-center gap-2 text-xs font-bold text-slate-700">
          <input
            type="checkbox"
            checked={showOnCourse}
            onChange={(e) => setShowOnCourse(e.target.checked)}
            className="h-4 w-4 accent-[#F7B548]"
          />
          في صفحة الكورس
        </label>
      </div>

      {error && (
        <p className="text-xs font-bold text-red-600">{error}</p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => run("approve")}
          className="h-9 rounded-lg bg-[#07152E] px-4 text-xs font-black text-white transition hover:opacity-90 disabled:opacity-50"
        >
          موافقة وتطبيق التعديل
        </button>

        <button
          type="button"
          disabled={pending}
          onClick={() => run("reject")}
          className="h-9 rounded-lg border border-red-300 bg-white px-4 text-xs font-black text-red-600 transition hover:bg-red-50 disabled:opacity-50"
        >
          رفض التعديل
        </button>
      </div>

      <p className="text-[11px] font-semibold text-slate-500">
        التقييم الظاهر حاليًا (الأعلى) لا يتغير إلا بعد موافقتك.
      </p>
    </div>
  );
}
