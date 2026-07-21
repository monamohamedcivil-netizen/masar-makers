"use client";

import { useState } from "react";

import {
  trackCourseActionLead,
} from "@/lib/actions/course-action-leads";

import type {
  ProfessionalActionMode,
} from "@/components/course/editor";

type TrackedCourseActionButtonProps = {
  stationId: string;
  panelComponent?: string;
  sourceType: "screen" | "column" | "item";
  sourceId: string;
  sourceTitle: string;
  label: string;
  link?: string;
  mode?: ProfessionalActionMode;
  className?: string;
};

const whatsappNumber = "201031885659";

export default function TrackedCourseActionButton({
  stationId,
  panelComponent = "professional",
  sourceType,
  sourceId,
  sourceTitle,
  label,
  link = "",
  mode = "whatsapp",
  className = "",
}: TrackedCourseActionButtonProps) {
  const [isSending, setIsSending] = useState(false);

  const handleClick = async () => {
    if (isSending) return;

    setIsSending(true);

    try {
      const result = await trackCourseActionLead({
        stationId,
        panelComponent,
        sourceType,
        sourceId,
        sourceTitle,
        actionLabel: label,
        actionLink: link,
      });

      if (!result.success) {
        window.alert(
          result.message ??
            "تعذر تسجيل الطلب. يرجى المحاولة مرة أخرى."
        );
        return;
      }

      const message = [
        "مرحبًا، أرغب في الاستفسار عن:",
        `الطلب: ${label}`,
        `المحتوى: ${sourceTitle}`,
        result.student?.name
          ? `الاسم: ${result.student.name}`
          : null,
        result.student?.email
          ? `البريد: ${result.student.email}`
          : null,
        result.student?.phone
          ? `الجوال: ${result.student.phone}`
          : null,
        result.student?.country
          ? `الدولة: ${result.student.country}`
          : null,
      ]
        .filter(Boolean)
        .join("\n");

      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
        message
      )}`;

      if (mode === "link" && link) {
        window.open(link, "_blank", "noopener,noreferrer");
        return;
      }

      if (mode === "link_and_whatsapp" && link) {
        window.open(link, "_blank", "noopener,noreferrer");
      }

      window.location.href = whatsappUrl;
    } catch (error) {
      console.error("Failed to process course action:", error);
      window.alert("حدث خطأ أثناء إرسال الطلب.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isSending}
      className={className}
    >
      {isSending ? "جارٍ الإرسال..." : label}
    </button>
  );
}
