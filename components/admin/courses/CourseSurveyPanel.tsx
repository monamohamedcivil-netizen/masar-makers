"use client";

import {
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  Save,
} from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { updateCourseSurveySettings } from "@/lib/actions/admin/courses";

interface CourseSurveyPanelProps {
course: {
  id: string;
  title: string;
  survey_enabled?: boolean | null;
  survey_url?: string | null;
};

}

export default function CourseSurveyPanel({
  course,
}: CourseSurveyPanelProps) {
  const router = useRouter();

  const [pending, startTransition] = useTransition();

  const [surveyEnabled, setSurveyEnabled] = useState(
    course.survey_enabled ?? true,
  );

  const [surveyUrl, setSurveyUrl] = useState(
    course.survey_url ?? "",
  );

  const [message, setMessage] = useState<string | null>(
    null,
  );

  const [errorMessage, setErrorMessage] = useState<
    string | null
  >(null);

  function saveSettings() {
    setMessage(null);
    setErrorMessage(null);

    startTransition(async () => {
      const result = await updateCourseSurveySettings(
        course.id,
        {
          survey_enabled: surveyEnabled,
          survey_url: surveyUrl,
        },
      );

      if (!result.success) {
        setErrorMessage(result.message);
        return;
      }

      setMessage(result.message);
      router.refresh();
    });
  }

  const canOpenSurvey =
    surveyUrl.trim().startsWith("https://") ||
    surveyUrl.trim().startsWith("http://");

  return (
    <div className="space-y-6">
      {(message || errorMessage) && (
        <div
          className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-bold ${
            errorMessage
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {!errorMessage && (
            <CheckCircle2 className="h-5 w-5 shrink-0" />
          )}

          <span>{errorMessage ?? message}</span>
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F7B548]/15 text-[#F7B548]">
            <ClipboardList className="h-6 w-6" />
          </div>

          <div>
            <h2 className="text-xl font-black text-[#07152E]">
              إعدادات الاستبيان
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              إدارة استبيان كورس{" "}
              <strong className="text-[#07152E]">
                {course.title}
              </strong>
            </p>
          </div>
        </div>

        <div className="mt-7 space-y-5">
          <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-black text-[#07152E]">
                تفعيل استبيان الرحلة
              </h3>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                عند إيقافه لن يظهر زر الاستبيان للطلاب.
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={surveyEnabled}
              onClick={() =>
                setSurveyEnabled((previous) => !previous)
              }
              className={`relative h-8 w-14 shrink-0 rounded-full transition ${
                surveyEnabled
                  ? "bg-[#F7B548]"
                  : "bg-slate-300"
              }`}
            >
              <span
                className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-sm transition ${
                  surveyEnabled
                    ? "right-1"
                    : "right-7"
                }`}
              />
            </button>
          </div>

          <div>
            <label
              htmlFor="course-survey-url"
              className="mb-2 block font-black text-[#07152E]"
            >
              رابط Google Form
            </label>

            <div className="flex flex-col gap-3 lg:flex-row">
              <input
                id="course-survey-url"
                type="url"
                dir="ltr"
                value={surveyUrl}
                onChange={(event) =>
                  setSurveyUrl(event.target.value)
                }
                placeholder="https://forms.gle/..."
                className="h-12 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-left outline-none transition focus:border-[#F7B548] focus:ring-2 focus:ring-[#F7B548]/20"
              />

              <button
                type="button"
                disabled={!canOpenSurvey}
                onClick={() => {
                  window.open(
                    surveyUrl.trim(),
                    "_blank",
                    "noopener,noreferrer",
                  );
                }}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-black text-[#07152E] transition hover:border-[#F7B548] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ExternalLink className="h-4 w-4" />
                فتح الاستبيان
              </button>
            </div>

            <p className="mt-2 text-xs leading-6 text-slate-500">
              أنشئي Google Form مستقلًا لكل كورس ثم ضعي
              رابطه هنا.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5">

  <Link
    href={`/admin/learning/courses/${course.id}/survey/import`}
    className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#F7B548] bg-[#FFF8E8] px-6 font-black text-[#B7791F] transition hover:bg-[#FFF2CC]"
  >
    ➕ إضافة تقييم سابق
  </Link>

  <button
    type="button"
    onClick={saveSettings}
    disabled={pending}
    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#F7B548] px-6 font-black text-[#07152E] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
  >
    <Save className="h-5 w-5" />

    {pending
      ? "جاري الحفظ..."
      : "حفظ إعدادات الاستبيان"}
  </button>

</div>
        </div>

      
      </section>

    </div>
  );
}