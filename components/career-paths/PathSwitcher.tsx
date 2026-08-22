"use client";

import Link from "next/link";
import { Route } from "lucide-react";

import { careerPaths } from "@/data/paths";

type Locale = "ar" | "en";

type PathSwitcherProps = {
  activeSlug: string;
  locale?: Locale;
};

const pathRoutes: Record<string, string> = {
  road: "road-design",
  traffic: "traffic-engineering",
};

const labels = {
  ar: {
    available: "المسارات المتاحة",
    aria: "المسارات المهنية",
  },
  en: {
    available: "Available Paths",
    aria: "Career paths",
  },
} as const;

const pathTitles: Record<
  string,
  {
    ar?: string;
    en?: string;
  }
> = {
  road: {
    ar: "تصميم الطرق",
    en: "Road Design",
  },
  "road-design": {
    ar: "تصميم الطرق",
    en: "Road Design",
  },
  traffic: {
    ar: "هندسة المرور",
    en: "Traffic Engineering",
  },
  "traffic-engineering": {
    ar: "هندسة المرور",
    en: "Traffic Engineering",
  },
};

export default function PathSwitcher({
  activeSlug,
  locale = "ar",
}: PathSwitcherProps) {
  const isArabic = locale === "ar";
  const text = labels[locale];

  const activePaths = careerPaths
    .filter((path) => path.active)
    .sort((a, b) => a.order - b.order);

  return (
    <nav
      dir={isArabic ? "rtl" : "ltr"}
      aria-label={text.aria}
      className="
        relative z-40
        w-full
        border-b
        border-[#DDE3EB]
        bg-white
        shadow-[0_5px_18px_rgba(7,21,46,0.05)]
      "
    >
      <div
        className="
          flex
          h-[38px]
          w-full
          items-stretch

          sm:h-[42px]
          lg:h-[46px]
        "
      >
        {/* Section title */}
        <div
          className="
            flex
            w-[120px]
            shrink-0
            items-center
            justify-center
            gap-1
            bg-[#07152E]
            px-2
            text-[9px]
            font-black
            text-[#F7B548]

            sm:w-[160px]
            sm:gap-1.5
            sm:text-[11px]

            lg:w-[220px]
            lg:gap-2
            lg:px-5
            lg:text-[14px]
          "
        >
          <Route
            size={13}
            className="sm:h-[15px] sm:w-[15px] lg:h-[18px] lg:w-[18px]"
          />

          <span className="truncate">
            {text.available}
          </span>
        </div>

        {/* Tabs */}
        <div
          className="
            grid
            min-w-0
            flex-1
            items-center
            gap-1
            px-1.5

            sm:gap-1.5
            sm:px-3

            lg:flex
            lg:gap-2
            lg:overflow-x-auto
            lg:px-5
            [scrollbar-width:none]
            [&::-webkit-scrollbar]:hidden
          "
          style={{
            gridTemplateColumns: `repeat(${Math.max(
              activePaths.length,
              1
            )}, minmax(0, 1fr))`,
          }}
        >
          {activePaths.map((path) => {
            const routeSlug =
              pathRoutes[path.slug] ?? path.slug;

            const isActive =
              activeSlug === path.slug ||
              activeSlug === routeSlug;

            const localizedTitle =
              pathTitles[path.slug]?.[locale] ??
              pathTitles[routeSlug]?.[locale] ??
              path.shortTitle;

            return (
              <Link
                key={path.slug}
                href={`/career-path/${routeSlug}`}
                className={`
                  flex
                  min-w-0
                  items-center
                  justify-center
                  gap-1
                  rounded-lg
                  px-1.5
                  py-1.5
                  text-center
                  text-[8px]
                  font-black
                  leading-[1.15]
                  transition
                  duration-300

                  sm:rounded-xl
                  sm:px-3
                  sm:text-[10px]

                  lg:shrink-0
                  lg:gap-2
                  lg:px-5
                  lg:py-2
                  lg:text-[13px]

                  ${
                    isActive
                      ? "bg-[#FFF4D9] text-[#07152E]"
                      : "text-slate-600 hover:bg-[#F7F8FA] hover:text-[#07152E]"
                  }
                `}
              >
                {isActive && (
                  <span
                    className="
                      h-1.5
                      w-1.5
                      shrink-0
                      rounded-full
                      bg-[#F7B548]

                      lg:h-2
                      lg:w-2
                    "
                  />
                )}

                <span className="line-clamp-2 min-w-0">
                  {localizedTitle}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}