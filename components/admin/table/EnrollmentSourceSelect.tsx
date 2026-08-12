"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";

import {
  updateEnrollmentSource,
  type EnrollmentSource,
} from "@/lib/actions/admin/enrollments";

interface EnrollmentSourceSelectProps {
  enrollmentId: string;
  journeyType: string;
  status: string;
  initialSource: EnrollmentSource;
}

function normalizeJourneyType(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replaceAll("-", "_");
}

export default function EnrollmentSourceSelect({
  enrollmentId,
  journeyType,
  status,
  initialSource,
}: EnrollmentSourceSelectProps) {
  const [source, setSource] =
    useState<EnrollmentSource>(initialSource);

  const [error, setError] = useState("");
  const [isPending, startTransition] =
    useTransition();

  useEffect(() => {
    setSource(initialSource);
  }, [initialSource]);

  const normalizedJourneyType =
    normalizeJourneyType(journeyType);

  const isOneDayJourney = [
    "workshop",
    "one_day",
    "one_day_journey",
    "one_day_workshop",
  ].includes(normalizedJourneyType);

  const isEditable =
    status.toLowerCase() === "pending" &&
    isOneDayJourney;

  if (!isEditable) {
    return (
      <span
        className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${
          source === "reward"
            ? "bg-[#FFF5DD] text-[#B8790B]"
            : "bg-slate-100 text-slate-600"
        }`}
      >
        {source === "reward"
          ? "مكافأة"
          : "مدفوع"}
      </span>
    );
  }

  const handleChange = (
    nextSource: EnrollmentSource,
  ) => {
    const previousSource = source;

    setSource(nextSource);
    setError("");

    startTransition(async () => {
      const result =
        await updateEnrollmentSource(
          enrollmentId,
          nextSource,
        );

      if (!result.success) {
        setSource(previousSource);
        setError(
          result.message ||
            "تعذر تحديث نوع الاشتراك.",
        );
      }
    });
  };

  return (
    <div className="min-w-[150px]">
      <div className="relative">
        <select
          value={source}
          disabled={isPending}
          onChange={(event) =>
            handleChange(
              event.target
                .value as EnrollmentSource,
            )
          }
          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 pl-9 text-xs font-black text-[#07152E] outline-none transition focus:border-[#F7B548] disabled:cursor-wait disabled:opacity-70"
        >
          <option value="paid">
            اشتراك مدفوع
          </option>

          <option value="reward">
            مكافأة
          </option>
        </select>

        {isPending ? (
          <Loader2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[#C88712]" />
        ) : null}
      </div>

      {error ? (
        <p className="mt-1 max-w-[180px] text-[10px] font-bold leading-4 text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}