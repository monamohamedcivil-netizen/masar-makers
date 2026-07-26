"use client";

import CourseActionButton from "./CourseActionButton";
import type { EnrollmentStatus } from "@/lib/actions/enroll";

type PlatformActionMode = "enrollment" | "free";

type PlatformActionButtonProps = {
  label: string;
  mode: PlatformActionMode;
  link?: string | null;
  courseId?: string;
  stationId?: string;
  journeyType?: string;
  enrollmentStatus?: EnrollmentStatus | null;
  actionKey?: string;
  actionTitle?: string;
  itemTitle?: string;
  className?: string;
};

export default function PlatformActionButton({
  label,
  mode,
  link,
  courseId,
  stationId,
  journeyType,
  enrollmentStatus,
  actionKey,
  actionTitle,
  itemTitle,
  className = "",
}: PlatformActionButtonProps) {
  if (!courseId) {
    return null;
  }

  return (
    <div className={className}>
      <CourseActionButton
        courseId={courseId}
        label={label}
        mode={mode}
        stationId={stationId}
        journeyType={journeyType}
        enrollmentStatus={enrollmentStatus}
        actionKey={actionKey}
        actionTitle={actionTitle}
        itemTitle={itemTitle}
        link={link}
      />
    </div>
  );
}
