"use client";

import { useState, useTransition } from "react";
import { Loader2, MessageSquare } from "lucide-react";

import StarRating from "./StarRating";
import { submitSurvey } from "@/lib/surveys/submit-survey";

type Props = {
  courseId: string;
  surveyUrl?: string | null;
  initialRating?: number;
  initialComment?: string;
  onSaved?: () => void;
};

export default function SurveyForm({
  courseId,
  surveyUrl,
  initialRating = 0,
  initialComment = "",
  onSaved,
}: Props) {
  const [rating, setRating] =
    useState(initialRating);

  const [comment, setComment] =
    useState(initialComment);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [isPending, startTransition] =
    useTransition();

  function handleSubmit() {
    setError("");
    setSuccess("");

    if (rating === 0) {
      setError("يرجى اختيار التقييم أولاً.");
      return;
    }

    startTransition(async () => {
      const result = await submitSurvey({
        courseId,
        rating,
        comment,
      });

      if (!result.success) {
        setError(
          result.error ??
            "حدث خطأ أثناء حفظ التقييم."
        );
        return;
      }

      setSuccess(
        "تم حفظ تقييمك بنجاح."
      );

      onSaved?.();
    });
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

      <div className="flex items-center gap-2">

        <MessageSquare className="h-5 w-5 text-[#F7B548]" />

        <h3 className="font-bold text-[#07152E]">
          تقييم الكورس
        </h3>

      </div>

      <div className="mt-6">

        <label className="mb-3 block text-sm font-semibold text-slate-700">
          كيف تقيّم هذا الكورس؟
        </label>

        <StarRating
          value={rating}
          onChange={setRating}
          size="lg"
        />

      </div>

      <div className="mt-6">

        <label className="mb-2 block text-sm font-semibold text-slate-700">
          تعليقك
        </label>

        <textarea
          rows={5}
          value={comment}
          onChange={(e) =>
            setComment(e.target.value)
          }
          placeholder="اكتب رأيك في الكورس وما الذي أعجبك أو تقترح تطويره..."
          className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[#F7B548]"
        />

      </div>

      {error && (

        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">

          {error}

        </div>

      )}

      {success && (

        <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">

          {success}

        </div>

      )}

      <div className="mt-6">

        <button
          type="button"
          disabled={isPending}
          onClick={handleSubmit}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#07152E] px-6 text-sm font-semibold text-white transition hover:bg-[#0B2148] disabled:opacity-60"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              جاري الحفظ...
            </>
          ) : (
            <>
              حفظ التقييم
            </>
          )}
        </button>

      </div>

      <div className="mt-8 rounded-2xl bg-amber-50 p-5">

        <p className="text-sm leading-7 text-slate-700">

          رأيك يساعدنا على تطوير المحتوى باستمرار.

          <br />

          بعد إرسال هذا التقييم يمكنك أيضًا تعبئة الاستبيان التفصيلي للحصول على فرصة إضافية للدخول في السحب الشهري على محاضرة مجانية.

        </p>

        {surveyUrl && (

          <a
            href={surveyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-[#F7B548] px-5 text-sm font-bold text-[#07152E] transition hover:opacity-90"
          >
            فتح الاستبيان التفصيلي
          </a>

        )}

      </div>

    </div>
  );
}