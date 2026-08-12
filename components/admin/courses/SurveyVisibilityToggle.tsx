"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { updateStudentSurveyVisibility } from "@/lib/actions/admin/student-surveys";

interface SurveyVisibilityToggleProps {
  surveyId: string;
  initialShowOnHome: boolean;
  initialShowOnCourse: boolean;
  type: "home" | "course";
}

export default function SurveyVisibilityToggle({
  surveyId,
  initialShowOnHome,
  initialShowOnCourse,
  type,
}: SurveyVisibilityToggleProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [showOnHome, setShowOnHome] = useState(
    initialShowOnHome,
  );

  const [showOnCourse, setShowOnCourse] = useState(
    initialShowOnCourse,
  );

  const enabled =
    type === "home" ? showOnHome : showOnCourse;

  function toggleVisibility() {
    const nextShowOnHome =
      type === "home" ? !showOnHome : showOnHome;

    const nextShowOnCourse =
      type === "course" ? !showOnCourse : showOnCourse;

    setShowOnHome(nextShowOnHome);
    setShowOnCourse(nextShowOnCourse);

    startTransition(async () => {
      const result =
        await updateStudentSurveyVisibility(
          surveyId,
          nextShowOnHome,
          nextShowOnCourse,
        );

      if (!result.success) {
        setShowOnHome(showOnHome);
        setShowOnCourse(showOnCourse);
        alert(result.message);
        return;
      }

      router.refresh();
    });
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={
        type === "home"
          ? "إظهار التقييم في الصفحة الرئيسية"
          : "إظهار التقييم في صفحة الكورس"
      }
      disabled={pending}
      onClick={toggleVisibility}
      className={`relative inline-flex h-7 w-12 rounded-full transition ${
        enabled ? "bg-[#F7B548]" : "bg-slate-300"
      } ${
        pending
          ? "cursor-wait opacity-60"
          : "cursor-pointer"
      }`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
          enabled ? "right-1" : "right-6"
        }`}
      />
    </button>
  );
}