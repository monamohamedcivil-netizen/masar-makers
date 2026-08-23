"use client";

import { useState } from "react";
import {
  BarChart3,
  ChevronDown,
} from "lucide-react";

type CourseStatsToggleProps = {
  children: React.ReactNode;
  locale?: "ar" | "en";
};

export default function CourseStatsToggle({
  children,
  locale = "ar",
}: CourseStatsToggleProps) {
  const [isOpen, setIsOpen] = useState(false);

  const isArabic = locale === "ar";

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className="w-full"
    >
      {/* شريط إحصائيات الرحلة التعليمية */}
<div
  className="
    bg-[#DCE7F2]
    px-3
    sm:px-6
    lg:px-8
  "
>
  <div
    className="
      mx-auto
      flex
max-w-[1680px]
items-center
justify-start
py-2
    "
  >
    <button
      type="button"
      onClick={() =>
        setIsOpen((current) => !current)
      }
      aria-expanded={isOpen}
      className="
        inline-flex
        items-center
        gap-2
        bg-transparent
        p-0
        text-[#07152E]
        transition-colors
        hover:text-[#D49319]
      "
    >
      <BarChart3
        size={18}
        strokeWidth={2}
        className="
          shrink-0
          text-[#D49319]
          sm:h-[20px]
          sm:w-[20px]
        "
      />

      <span
        className="
          text-[12px]
          font-black
          sm:text-[14px]
        "
      >
        {isArabic
          ? "إحصائيات الرحلة التعليمية"
          : "Learning Journey Statistics"}
      </span>

      <ChevronDown
        size={16}
        strokeWidth={2}
        className={[
          "shrink-0 transition-transform duration-300",
          isOpen
            ? "rotate-180"
            : "rotate-0",
        ].join(" ")}
      />
    </button>
  </div>
</div>

      {/* جميع الإحصائيات */}
      <div
        className={[
          "grid bg-[#DCE7F2] transition-all duration-300 ease-in-out",
          isOpen
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0",
        ].join(" ")}
      >
        <div className="overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}