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

type Props = {
  courseId: string;
  courseTitle: string;
  submitted: boolean;
  rating?: number;
  comment?: string;
  surveyUrl?: string | null;
  detailedSurveyCompleted?: boolean;
  onSaved?: (survey?: SavedStudentSurvey) => void | Promise<void>;
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
}: Props) {
  const [rating, setRating] = useState(initialRating);
  const [comment, setComment] = useState(initialComment);
  const [isSubmitted, setIsSubmitted] = useState(submitted);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setRating(initialRating);
    setComment(initialComment);
    setIsSubmitted(submitted);
  }, [initialRating, initialComment, submitted]);

  const journeyCompleted = isSubmitted && detailedSurveyCompleted;

  function handleSubmit() {
    setErrorMessage("");
    setSuccessMessage("");

    if (rating === 0) {
      setErrorMessage("يرجى اختيار تقييم الرحلة أولًا.");
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
          result.error ?? "حدث خطأ أثناء حفظ تقييم الرحلة.",
        );
        return;
      }

      setRating(result.survey.rating);
      setComment(result.survey.comment ?? "");
      setIsSubmitted(true);
      setSuccessMessage(
        "شكرًا لمشاركتك، تم حفظ تقييم الرحلة بنجاح.",
      );

      await onSaved?.(result.survey);
    });
  }

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-5 sm:px-7">
        <h3 className="text-lg font-extrabold leading-7 text-[#07152E] sm:text-xl">
          {courseTitle}
        </h3>

        <div className="mt-5 space-y-3">
          <ChecklistItem completed={isSubmitted} label="تقييم الرحلة" />
          <ChecklistItem
            completed={detailedSurveyCompleted}
            label="الاستبيان التفصيلي"
          />
        </div>
      </div>

      <div className="p-6 sm:p-7">
        {!isSubmitted && (
          <section>
            <div className="flex items-center gap-2">
              <MessageSquareText className="h-5 w-5 text-[#F7B548]" />

              <h4 className="font-bold text-[#07152E]">
                كيف كانت رحلتك التعليمية؟
              </h4>
            </div>

            <div className="mt-5">
              <StarRating
                value={rating}
                onChange={setRating}
                disabled={isPending}
                size="lg"
              />
            </div>

            <div className="mt-6">
              <label
                htmlFor={`survey-comment-${courseId}`}
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                شاركنا رأيك
              </label>

              <textarea
                id={`survey-comment-${courseId}`}
                rows={5}
                value={comment}
                disabled={isPending}
                onChange={(event) => setComment(event.target.value)}
                placeholder="ما أكثر شيء أعجبك في الرحلة؟ وما الذي تقترح تطويره؟"
                className="w-full resize-none rounded-2xl border border-slate-300 px-4 py-3 text-sm leading-7 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#F7B548] focus:ring-4 focus:ring-amber-100 disabled:cursor-not-allowed disabled:bg-slate-50"
              />
            </div>

            {errorMessage && (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {errorMessage}
              </div>
            )}

            <button
              type="button"
              disabled={isPending}
              onClick={handleSubmit}
              className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#07152E] px-6 text-sm font-bold text-white transition hover:bg-[#0B2148] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Star className="h-4 w-4 text-[#F7B548]" />
                  إرسال تقييم الرحلة
                </>
              )}
            </button>
          </section>
        )}

        {isSubmitted && (
          <section>
            <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-green-600" />

                <div>
                  <h4 className="font-bold text-green-800">
                    شكرًا لمشاركتك
                  </h4>

                  <p className="mt-1 text-sm leading-7 text-green-700">
                    تم حفظ تقييم الرحلة بنجاح.
                  </p>
                </div>
              </div>

              <div
                className="mt-4 flex items-center gap-1"
                dir="ltr"
                aria-label={`التقييم ${rating} من 5`}
              >
                {[1, 2, 3, 4, 5].map((starValue) => (
                  <Star
                    key={starValue}
                    className={`h-5 w-5 ${
                      starValue <= rating
                        ? "fill-[#F7B548] text-[#F7B548]"
                        : "fill-transparent text-slate-300"
                    }`}
                  />
                ))}
              </div>

              {comment.trim() && (
                <p className="mt-4 whitespace-pre-wrap rounded-xl bg-white/70 px-4 py-3 text-sm leading-7 text-slate-700">
                  {comment}
                </p>
              )}
            </div>

            {successMessage && <p className="sr-only">{successMessage}</p>}
          </section>
        )}

        {isSubmitted && !detailedSurveyCompleted && (
          <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <ClipboardCheck className="mt-0.5 h-6 w-6 shrink-0 text-[#D89213]" />

              <div>
                <h4 className="font-bold text-[#07152E]">
                  أكمل الاستبيان التفصيلي
                </h4>

                <p className="mt-2 text-sm leading-7 text-slate-700">
                  يساعدنا الاستبيان التفصيلي في تطوير الرحلات القادمة. اسمك لا
                  يظهر لنا داخل الاستبيان، لذلك يمكنك الإجابة بكل حرية.
                </p>

                <p className="mt-2 text-sm leading-7 text-slate-600">
                  يمكنك كتابة اسمك ووسيلة التواصل في السؤال الأخير للدخول في
                  السحب الشهري، وهذا اختياري تمامًا.
                </p>
              </div>
            </div>

            {surveyUrl ? (
              <a
                href={surveyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#F7B548] px-5 text-sm font-extrabold text-[#07152E] transition hover:brightness-95 sm:w-auto"
              >
                إكمال الاستبيان التفصيلي
                <ExternalLink className="h-4 w-4" />
              </a>
            ) : (
              <div className="mt-5 rounded-xl border border-amber-200 bg-white/70 px-4 py-3 text-sm font-medium text-amber-800">
                رابط الاستبيان التفصيلي غير متاح حاليًا.
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
              🎉 اكتملت رحلة التقييم
            </h4>

            <p className="mt-2 text-sm leading-7 text-slate-600">
              شكرًا لمساهمتك في تطوير Masar Makers.
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