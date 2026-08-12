"use client";

import { useState } from "react";
import { Star } from "lucide-react";

type Props = {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: "h-6 w-6",
  md: "h-8 w-8",
  lg: "h-10 w-10",
};

export default function StarRating({
  value,
  onChange,
  disabled = false,
  size = "md",
}: Props) {
  const [hoveredValue, setHoveredValue] =
    useState(0);

  const displayedValue =
    hoveredValue || value;

  return (
    <div
      className="flex items-center gap-1"
      dir="ltr"
      role="radiogroup"
      aria-label="تقييم الكورس"
      onMouseLeave={() =>
        setHoveredValue(0)
      }
    >
      {[1, 2, 3, 4, 5].map(
        (starValue) => {
          const isActive =
            starValue <= displayedValue;

          return (
            <button
              key={starValue}
              type="button"
              role="radio"
              aria-checked={
                value === starValue
              }
              aria-label={`${starValue} من 5`}
              disabled={disabled}
              onMouseEnter={() => {
                if (!disabled) {
                  setHoveredValue(
                    starValue,
                  );
                }
              }}
              onFocus={() => {
                if (!disabled) {
                  setHoveredValue(
                    starValue,
                  );
                }
              }}
              onBlur={() =>
                setHoveredValue(0)
              }
              onClick={() =>
                onChange(starValue)
              }
              className="rounded-full p-1 transition hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F7B548] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Star
                className={`${sizeClasses[size]} transition ${
                  isActive
                    ? "fill-[#F7B548] text-[#F7B548]"
                    : "fill-transparent text-slate-300"
                }`}
                strokeWidth={1.8}
              />
            </button>
          );
        },
      )}
    </div>
  );
}