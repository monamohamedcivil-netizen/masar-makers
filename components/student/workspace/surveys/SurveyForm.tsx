"use client";

import { useEffect, useState, useTransition } from "react";
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

  const [locale, setLocale] =
    useState<"ar" | "en">("ar");

  useEffect(() => {
    const readLocale = () => {
      const saved =
        window.localStorage.getItem("masar-locale");
      setLocale(saved === "en" ? "en" : "ar");
    };

    readLocale();
    window.addEventListener("masar:locale-change", readLocale);
    window.addEventListener("storage", readLocale);

    return () => {
      window.removeEventListener("masar:locale-change", readLocale);
      window.removeEventListener("storage", readLocale);
    };
  }, []);

  const isArabic = locale === "ar";

  function handleSubmit() {
    setError("");
    setSuccess("");

    if (rating === 0) {
      setError(isArabic ? "يرجى اختيار التقييم أولاً." : "Please select a rating first.");
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
            (isArabic ? "حدث خطأ أثناء حفظ التقييم." : "An error occurred while saving your review.")
        );
        return;
      }

      setSuccess(
        isArabic
          ? "تم حفظ تقييمك بنجاح."
          : "Your review was saved successfully."
      );

      onSaved?.();
    });
  }

  return (
    <div dir={isArabic ? "rtl" : "ltr"} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

      <div className="flex items-center gap-2">

        <MessageSquare className="h-5 w-5 text-[#F7B548]" />

        <h3 className="font-bold text-[#07152E]">
          {isArabic ? "تقييم الكورس" : "Course Review"}
        </h3>

      </div>

      <div className="mt-6">

        <label className="mb-3 block text-sm font-semibold text-slate-700">
          {isArabic ? "كيف تقيّم هذا الكورس؟" : "How would you rate this course?"}
        </label>

        <StarRating
          value={rating}
          onChange={setRating}
          size="lg"
          locale={locale}
        />

      </div>

      <div className="mt-6">

        <label className="mb-2 block text-sm font-semibold text-slate-700">
          {isArabic ? "تعليقك" : "Your Comment"}
        </label>

        <textarea
          rows={5}
          value={comment}
          onChange={(e) =>
            setComment(e.target.value)
          }
          placeholder={isArabic ? "اكتب رأيك في الكورس وما الذي أعجبك أو تقترح تطويره..." : "Share your thoughts about the course, what you liked, and what you would improve..."}
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
              {isArabic ? "جاري الحفظ..." : "Saving..."}
            </>
          ) : (
            <>
              {isArabic ? "حفظ التقييم" : "Save Review"}
            </>
          )}
        </button>

      </div>

      <div className="mt-8 rounded-2xl bg-amber-50 p-5">

        <p className="text-sm leading-7 text-slate-700">

          {isArabic ? "رأيك يساعدنا على تطوير المحتوى باستمرار." : "Your feedback helps us continuously improve the content."}

          <br />

          {isArabic ? "بعد إرسال هذا التقييم يمكنك أيضًا تعبئة الاستبيان التفصيلي للحصول على فرصة إضافية للدخول في السحب الشهري على محاضرة مجانية." : "After submitting this review, you can also complete the detailed survey for an additional entry in the monthly draw for a free lecture."}

        </p>

        {surveyUrl && (

          <a
            href={surveyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-[#F7B548] px-5 text-sm font-bold text-[#07152E] transition hover:opacity-90"
          >
            {isArabic ? "فتح الاستبيان التفصيلي" : "Open Detailed Survey"}
          </a>

        )}

      </div>

    </div>
  );
}