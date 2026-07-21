"use client";

import type { ReactNode } from "react";

import CourseActionButton from "./CourseActionButton";
import type { EnrollmentStatus } from "@/lib/actions/enroll";

type PlatformActionMode =
  | "enrollment"
  | "whatsapp"
  | "link"
  | "link_and_whatsapp";

type PlatformActionButtonProps = {
  label: string;
  mode: PlatformActionMode;
  link?: string | null;
  courseId?: string;
  stationId?: string;
  journeyType?: string;
  enrollmentStatus?: EnrollmentStatus | null;
  className?: string;
  children?: ReactNode;
};

export default function PlatformActionButton({
  label,
  mode,
  link,
  courseId,
  stationId,
  journeyType,
  enrollmentStatus,
  className = "",
  children,
}: PlatformActionButtonProps) {
  if (mode === "enrollment") {
    if (!courseId) {
      return null;
    }

    return (
      <div className={className}>
        <CourseActionButton
          courseId={courseId}
          stationId={stationId}
          journeyType={journeyType}
          enrollmentStatus={enrollmentStatus}
        />
      </div>
    );
  }

  const href = buildActionHref(mode, link);

  if (!href) {
    return (
      <button
        type="button"
        disabled
        className={`${className} cursor-not-allowed opacity-50`}
      >
        {children ?? label}
      </button>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={className}
    >
      {children ?? label}
    </a>
  );
}

function buildActionHref(
  mode: Exclude<PlatformActionMode, "enrollment">,
  rawLink?: string | null,
): string {
  const link = rawLink?.trim();

  if (!link) {
    return "";
  }

  if (mode === "whatsapp" || mode === "link_and_whatsapp") {
    if (
      link.startsWith("https://wa.me/") ||
      link.startsWith("https://api.whatsapp.com/") ||
      link.startsWith("whatsapp://")
    ) {
      return link;
    }

    const phone = link.replace(/[^0-9]/g, "");

    return phone ? `https://wa.me/${phone}` : "";
  }

  if (/^https?:\/\//i.test(link)) {
    return link;
  }

  return `https://${link}`;
}