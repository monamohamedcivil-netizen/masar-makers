"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Check,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  Loader2,
  MessageSquareText,
  Star,
} from "lucide-react";

import StarRating from "./StarRating";
import {
  submitSurvey,
  type SavedStudentSurvey,
} from "@/lib/surveys/submit-survey";
import {
  completeDetailedSurvey,
} from "@/lib/surveys/complete-detailed-survey";
type Props = {
  courseId: string;
  courseTitle: string;
  submitted: boolean;
  rating?: number;
  comment?: string;
  surveyUrl?: string | null;
  detailedSurveyCompleted?: boolean;
  onSaved?: (survey?: SavedStudentSurvey) => void | Promise<void>;
  locale?: "ar" | "en";
};

export default function SurveyCard({
  courseId,
  courseTitle,
  submitted,
  rating: initialRating = 0,
  comment: initialComment = "",
  surveyUrl = null,
  detailedSurveyCompleted = false,
  onSaved,
  locale = "ar",
}: Props) {
  const isArabic = locale === "ar";
  const [rating, setRating] = useState(initialRating);
  const [comment, setComment] = useState(initialComment);
  const [isSubmitted, setIsSubmitted] = useState(submitted);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isPending, startTransition] = useTransition();
const [
  isDetailedCompleted,
  setIsDetailedCompleted,
] = useState(
  detailedSurveyCompleted,
);
  useEffect(() => {
  setRating(initialRating);
  setComment(initialComment);
  setIsSubmitted(submitted);
  setIsDetailedCompleted(
    detailedSurveyCompleted,
  );
}, [
  initialRating,
  initialComment,
  submitted,
  detailedSurveyCompleted,
]);

 const journeyCompleted =
  isSubmitted && isDetailedCompleted;

  function handleSubmit() {
    setErrorMessage("");
    setSuccessMessage("");

    if (rating === 0) {
      setErrorMessage(isArabic ? "يرجى اختيار تقييم الرحلة أولًا." : "Please select a journey rating first.");
      return;
    }

    startTransition(async () => {
      const result = await submitSurvey({
        courseId,
        rating,
        comment,
      });

      if (!result.success) {
        setErrorMessage(
          result.error ?? (isArabic ? "حدث خطأ أثناء حفظ تقييم الرحلة." : "An error occurred while saving your journey review."),
        );

        async function handleDetailedSurveyClick() {
  if (!surveyUrl) {
    return;
  }

  const newWindow = window.open(
    surveyUrl,
    "_blank",
    "noopener,noreferrer",
  );

  const result =
    await completeDetailedSurvey(
      courseId,
    );

  if (!result.success) {
    setErrorMessage(
      result.error ??
        (isArabic ? "تعذر تحديث حالة الاستبيان." : "Unable to update the detailed survey status."),
    );

    return;
  }

  setIsDetailedCompleted(true);

  await onSaved?.();

  if (!newWindow) {
    window.open(
      surveyUrl,
      "_blank",
      "noopener,noreferrer",
    );
  }
}
        return;
      }

      setRating(result.survey.rating);
      setComment(result.survey.comment ?? "");
      setIsSubmitted(true);
      setSuccessMessage(
        isArabic
          ? "شكرًا لمشاركتك، تم حفظ تقييم الرحلة بنجاح."
          : "Thank you for sharing. Your journey review was saved successfully.",
      );

      await onSaved?.(result.survey);
    });
  }
  async function handleDetailedSurveyClick() {
    if (!surveyUrl) {
      return;
    }

    const newWindow = window.open(
      surveyUrl,
      "_blank",
      "noopener,noreferrer",
    );

    const result =
      await completeDetailedSurvey(
        courseId,
      );

    if (!result.success) {
      setErrorMessage(
        result.error ??
          (isArabic ? "تعذر تحديث حالة الاستبيان." : "Unable to update the detailed survey status."),
      );

      return;
    }

    setIsDetailedCompleted(true);

    await onSaved?.();

    if (!newWindow) {
      window.open(
        surveyUrl,
        "_blank",
        "noopener,noreferrer",
      );
    }
  }


  return (
    <article dir={isArabic ? "rtl" : "ltr"} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-3 sm:px-6">
  <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5">
    <ChecklistItem
      completed={isSubmitted}
      label={isArabic ? "تقييم الرحلة" : "Journey Review"}
    />

    <ChecklistItem
      completed={isDetailedCompleted}
      label={isArabic ? "الاستبيان التفصيلي" : "Detailed Survey"}
    />
  </div>
</div>

      <div className="p-3 sm:p-4">
        {!isSubmitted && (
  <section className="space-y-3">
            <div className="flex items-center gap-2">
              <MessageSquareText className="h-4 w-4 text-[#F7B548]" />

              <h4 className="text-sm font-bold text-[#07152E]">
                {isArabic ? "كيف كانت رحلتك التعليمية؟" : "How was your learning journey?"}
              </h4>
            </div>

            <div className="mt-2">
              <StarRating
                value={rating}
                onChange={setRating}
                disabled={isPending}
                size="md"
                locale={locale}
              />
            </div>

            <div className="mt-2">
              <label
                htmlFor={`survey-comment-${courseId}`}
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                {isArabic ? "شاركنا رأيك" : "Share your feedback"}
              </label>

              <textarea
                id={`survey-comment-${courseId}`}
                rows={2}
                value={comment}
                disabled={isPending}
                onChange={(event) => setComment(event.target.value)}
                placeholder={isArabic ? "ما أكثر شيء أعجبك في الرحلة؟ وما الذي تقترح تطويره؟" : "What did you like most about the journey, and what would you improve?"}
                className="w-full resize-none rounded-xl border border-slate-300 px-3 py-2 text-xs leading-5 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#F7B548] focus:ring-2 focus:ring-amber-100 disabled:cursor-not-allowed disabled:bg-slate-50"
              />
            </div>

            {errorMessage && (
              <div className="mt-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                {errorMessage}
              </div>
            )}

            <button
              type="button"
              disabled={isPending}
              onClick={handleSubmit}
              className="mt-2 inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[#07152E] px-4 text-xs font-bold text-white transition hover:bg-[#0B2148] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isArabic ? "جاري الحفظ..." : "Saving..."}
                </>
              ) : (
                <>
                  <Star className="h-4 w-4 text-[#F7B548]" />
                  {isArabic ? "إرسال تقييم الرحلة" : "Submit Journey Review"}
                </>
              )}
            </button>
          </section>
        )}

        {isSubmitted && (
          <section>
            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />

                <div>
                  <h4 className="font-bold text-green-800">
                    {isArabic ? "شكرًا لمشاركتك" : "Thank you for sharing"}
                  </h4>

                  <p className="mt-0.5 text-xs leading-5 text-green-700">
                    {isArabic ? "تم حفظ تقييم الرحلة بنجاح." : "Your journey review was saved successfully."}
                  </p>
                </div>
              </div>

              <div
                className="mt-2 flex items-center gap-1"
                dir="ltr"
                aria-label={isArabic ? `التقييم ${rating} من 5` : `Rating ${rating} out of 5`}
              >
                {[1, 2, 3, 4, 5].map((starValue) => (
                  <Star
                    key={starValue}
                    className={`h-4 w-4 ${
                      starValue <= rating
                        ? "fill-[#F7B548] text-[#F7B548]"
                        : "fill-transparent text-slate-300"
                    }`}
                  />
                ))}
              </div>

              {comment.trim() && (
                <p className="mt-2 whitespace-pre-wrap rounded-lg bg-white/70 px-3 py-2 text-sm leading-5 text-slate-700">
                  {comment}
                </p>
              )}
            </div>

            {successMessage && <p className="sr-only">{successMessage}</p>}
          </section>
        )}

        {isSubmitted &&
  !isDetailedCompleted && (
          <section className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <div className="flex items-start gap-3">
              <ClipboardCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#D89213]" />

              <div>
                <h4 className="font-bold text-[#07152E]">
                  {isArabic ? "أكمل الاستبيان التفصيلي" : "Complete the Detailed Survey"}
                </h4>

                <p className="mt-1 text-xs leading-5 text-slate-700">
                  {isArabic
                    ? "يساعدنا الاستبيان التفصيلي في تطوير الرحلات القادمة. اسمك لا يظهر لنا داخل الاستبيان، لذلك يمكنك الإجابة بكل حرية."
                    : "The detailed survey helps us improve future journeys. Your name is not shown to us in the survey, so you can answer freely."}
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-600">
                  {isArabic
                    ? "يمكنك كتابة اسمك ووسيلة التواصل في السؤال الأخير للدخول في السحب الشهري، وهذا اختياري تمامًا."
                    : "You may add your name and contact information in the final question to enter the monthly draw. This is completely optional."}
                </p>
              </div>
            </div>

            {surveyUrl ? (
              <button
  type="button"
  onClick={() => {
    void handleDetailedSurveyClick();
  }}
  className="mt-3 inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[#F7B548] px-4 text-xs font-extrabold text-[#07152E] transition hover:brightness-95"
>
  {isArabic ? "إكمال الاستبيان التفصيلي" : "Open Detailed Survey"}
  <ExternalLink className="h-4 w-4" />
</button>
            ) : (
              <div className="mt-5 rounded-xl border border-amber-200 bg-white/70 px-4 py-3 text-sm font-medium text-amber-800">
                {isArabic ? "رابط الاستبيان التفصيلي غير متاح حاليًا." : "The detailed survey link is not available right now."}
              </div>
            )}
          </section>
        )}

        {journeyCompleted && (
          <section className="mt-6 rounded-2xl border border-green-200 bg-gradient-to-b from-green-50 to-white px-5 py-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <Check className="h-7 w-7 text-green-700" />
            </div>

            <h4 className="mt-4 text-lg font-extrabold text-[#07152E]">
              {isArabic ? "🎉 اكتملت رحلة التقييم" : "🎉 Review Journey Completed"}
            </h4>

            <p className="mt-2 text-sm leading-7 text-slate-600">
              {isArabic ? "شكرًا لمساهمتك في تطوير Masar Makers." : "Thank you for helping us improve Masar Makers."}
            </p>
          </section>
        )}
      </div>
    </article>
  );
}

type ChecklistItemProps = {
  completed: boolean;
  label: string;
};

function ChecklistItem({ completed, label }: ChecklistItemProps) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${
          completed
            ? "border-green-600 bg-green-600 text-white"
            : "border-slate-300 bg-white text-transparent"
        }`}
      >
        <Check className="h-4 w-4" />
      </span>

      <span
        className={`text-sm font-bold ${
          completed ? "text-green-700" : "text-slate-600"
        }`}
      >
        {label}
      </span>
    </div>
  );
}