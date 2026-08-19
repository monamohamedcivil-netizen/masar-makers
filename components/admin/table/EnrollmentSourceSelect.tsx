"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";

import {
  updateEnrollmentSource,
  type EnrollmentSource,
  type RewardSource,
} from "@/lib/actions/admin/enrollments";

interface EnrollmentSourceSelectProps {
  enrollmentId: string;
  journeyType: string;
  status: string;
  initialSource: EnrollmentSource;
  initialRewardSource: RewardSource | null;
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
  initialRewardSource,
}: EnrollmentSourceSelectProps) {
  type SourceOption =
    | "paid"
    | "rewards_card"
    | "monthly_draw";

  const getInitialOption =
    (): SourceOption => {
      if (
        initialSource !== "reward"
      ) {
        return "paid";
      }

      return initialRewardSource ===
        "monthly_draw"
        ? "monthly_draw"
        : "rewards_card";
    };

  const [selectedOption, setSelectedOption] =
    useState<SourceOption>(
      getInitialOption(),
    );

  const [error, setError] =
    useState("");

  const [isPending, startTransition] =
    useTransition();

  useEffect(() => {
    setSelectedOption(
      getInitialOption(),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    initialSource,
    initialRewardSource,
  ]);

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
    const label =
      selectedOption === "paid"
        ? "مدفوع"
        : selectedOption ===
            "monthly_draw"
          ? "مكافأة السحب الشهري"
          : "مكافأة بطاقة المكافآت";

    return (
      <span
        className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${
          selectedOption === "paid"
            ? "bg-slate-100 text-slate-600"
            : "bg-[#FFF5DD] text-[#B8790B]"
        }`}
      >
        {label}
      </span>
    );
  }

  const handleChange = (
    nextOption: SourceOption,
  ) => {
    const previousOption =
      selectedOption;

    setSelectedOption(nextOption);
    setError("");

    const enrollmentSource:
      EnrollmentSource =
        nextOption === "paid"
          ? "paid"
          : "reward";

    const rewardSource:
      RewardSource | null =
        nextOption === "paid"
          ? null
          : nextOption;

    startTransition(async () => {
      const result =
        await updateEnrollmentSource(
          enrollmentId,
          enrollmentSource,
          rewardSource,
        );

      if (!result.success) {
        setSelectedOption(
          previousOption,
        );
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
          value={selectedOption}
          disabled={isPending}
          onChange={(event) =>
            handleChange(
              event.target
                .value as SourceOption,
            )
          }
          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 pl-9 text-xs font-black text-[#07152E] outline-none transition focus:border-[#F7B548] disabled:cursor-wait disabled:opacity-70"
        >
          <option value="paid">
            اشتراك مدفوع
          </option>

          <option value="rewards_card">
            مكافأة بطاقة المكافآت
          </option>

          <option value="monthly_draw">
            مكافأة السحب الشهري
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