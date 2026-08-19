"use client";

import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  Gift,
  Star,
  Zap,
} from "lucide-react";

type Locale = "ar" | "en";

type LearningModeCardProps = {
  title: string;
  description: string;
  image: string;
  button: string;
  badgeLabel: string;
  color: "gold" | "blue" | "green";
  locale: Locale;
  featured?: boolean;
  onClick?: () => void;
};

const themes = {
  gold: {
    border: "border-[#F7B548]/90",
    title: "text-[#C58A16]",
    badge:
      "bg-gradient-to-r from-[#F7B548] to-[#D99B22] text-white",
    button:
      "bg-gradient-to-r from-[#F7B548] to-[#D99B22] text-[#07152E]",
    icon: Star,
  },

  blue: {
    border: "border-[#2F6FD6]/45",
    title: "text-[#123C7A]",
    badge:
      "bg-gradient-to-r from-[#2F6FD6] to-[#164A96] text-white",
    button:
      "bg-gradient-to-r from-[#2867C7] to-[#123C7A] text-white",
    icon: Zap,
  },

  green: {
    border: "border-[#2E9B57]/45",
    title: "text-[#2E8547]",
    badge:
      "bg-gradient-to-r from-[#49A95B] to-[#26773D] text-white",
    button:
      "bg-gradient-to-r from-[#55C766] to-[#2E8547] text-white",
    icon: Gift,
  },
};

export default function LearningModeCard({
  title,
  description,
  image,
  button,
  badgeLabel,
  color,
  locale,
  featured = false,
  onClick,
}: LearningModeCardProps) {
  const theme = themes[color];
  const BadgeIcon = theme.icon;
  const ArrowIcon =
    locale === "ar" ? ArrowLeft : ArrowRight;

  const frameBorder =
    color === "gold"
      ? "border-[#F7B548]/55"
      : color === "blue"
        ? "border-[#2F6FD6]/38"
        : "border-[#2E9B57]/38";

  const detailBorder =
    color === "gold"
      ? "border-[#F7B548]/48"
      : color === "blue"
        ? "border-[#2F6FD6]/34"
        : "border-[#2E9B57]/34";

  return (
    <article
      dir={locale === "ar" ? "rtl" : "ltr"}
      className={`
        group relative flex min-w-0 flex-col bg-white
        rounded-[24px] border
        transition-all duration-500
        hover:-translate-y-1
        hover:shadow-[0_18px_40px_rgba(7,21,46,0.11)]
        sm:rounded-[30px]
        lg:rounded-[34px]
        ${theme.border}
        ${
          featured
            ? "h-[312px] sm:h-[322px] lg:h-[332px]"
            : "h-[300px] sm:h-[310px] lg:h-[320px]"
        }
      `}
    >
      {/* Badge */}
      <div
        className={`
          absolute left-1/2 top-0 z-30
          flex -translate-x-1/2 -translate-y-1/2
          items-center gap-1 whitespace-nowrap
          rounded-full px-2.5 py-1.5
          text-[10px] font-black
          shadow-[0_7px_18px_rgba(7,21,46,0.16)]
          transition duration-300
          group-hover:scale-105
          sm:gap-1.5 sm:px-4 sm:py-2 sm:text-[12px]
          lg:text-[13px]
          ${theme.badge}
        `}
      >
        <BadgeIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        <span>{badgeLabel}</span>
      </div>

      {/* Architectural Gate */}
      <div className="px-2.5 pt-5 sm:px-3.5 sm:pt-6 lg:px-4">
        <div
          className={`
            relative mx-auto
            ${
              featured
                ? "h-[136px] sm:h-[146px] lg:h-[154px]"
                : "h-[128px] sm:h-[138px] lg:h-[146px]"
            }
          `}
        >
          {/* Outer arch frame */}
          <div
            className={`
              absolute bottom-[8px] left-[18%] right-[18%] top-0 z-10
              rounded-t-[48px] rounded-b-[8px]
              border-[2px] bg-white
              shadow-[0_8px_20px_rgba(7,21,46,0.10)]
              sm:bottom-[9px] sm:left-[17%] sm:right-[17%]
              sm:rounded-t-[54px]
              ${frameBorder}
            `}
          />

          {/* Image opening */}
          <div
            className="
              absolute bottom-[14px] left-[22%] right-[22%] top-[8px] z-20
              overflow-hidden rounded-t-[40px] rounded-b-[6px]
              bg-white
              sm:bottom-[16px] sm:left-[21%] sm:right-[21%] sm:top-[10px]
              sm:rounded-t-[46px]
            "
          >
            <Image
              src={image}
              alt={title}
              fill
              priority={featured}
              sizes="(max-width: 767px) 33vw, (max-width: 1279px) 30vw, 360px"
              className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
            />
          </div>

          {/* Columns */}
          <div
            className={`
              absolute bottom-[4px] left-[14%] z-30
              h-[60%] w-[10px]
              rounded-t-[5px] border bg-white
              shadow-[0_5px_12px_rgba(7,21,46,0.09)]
              sm:left-[13%] sm:w-[13px]
              ${detailBorder}
            `}
          />

          <div
            className={`
              absolute bottom-[4px] right-[14%] z-30
              h-[60%] w-[10px]
              rounded-t-[5px] border bg-white
              shadow-[0_5px_12px_rgba(7,21,46,0.09)]
              sm:right-[13%] sm:w-[13px]
              ${detailBorder}
            `}
          />

          {/* Capitals */}
          <div
            className={`
              absolute bottom-[60%] left-[12%] z-40
              h-[6px] w-[18px]
              rounded-[3px] border bg-white
              sm:h-[7px] sm:w-[23px]
              ${detailBorder}
            `}
          />

          <div
            className={`
              absolute bottom-[60%] right-[12%] z-40
              h-[6px] w-[18px]
              rounded-[3px] border bg-white
              sm:h-[7px] sm:w-[23px]
              ${detailBorder}
            `}
          />

          {/* Bases */}
          <div
            className={`
              absolute bottom-0 left-[12%] z-40
              h-[7px] w-[20px]
              rounded-[3px] border bg-white
              shadow-sm
              sm:h-[8px] sm:w-[25px]
              ${detailBorder}
            `}
          />

          <div
            className={`
              absolute bottom-0 right-[12%] z-40
              h-[7px] w-[20px]
              rounded-[3px] border bg-white
              shadow-sm
              sm:h-[8px] sm:w-[25px]
              ${detailBorder}
            `}
          />

          {/* Bottom threshold */}
          <div
            className={`
              absolute bottom-[2px] left-[17%] right-[17%] z-30
              h-[5px] rounded-full border bg-white
              sm:left-[16%] sm:right-[16%] sm:h-[6px]
              ${detailBorder}
            `}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex min-h-0 flex-1 flex-col px-2.5 pb-2.5 pt-1.5 text-center sm:px-4 sm:pb-3 sm:pt-2">
        <h3
          className={`
            min-h-[34px] font-black leading-[1.15]
            sm:min-h-[42px]
            ${theme.title}
            ${
              featured
                ? "text-[14px] sm:text-[17px] lg:text-[19px]"
                : "text-[13px] sm:text-[16px] lg:text-[18px]"
            }
          `}
        >
          {title}
        </h3>

        <p className="
  mx-auto mt-1
  line-clamp-3
  max-w-[360px]
  min-h-0
  overflow-hidden
  text-[9px] font-medium leading-[1.45] text-slate-600
  sm:mt-1 sm:text-[10.5px] sm:leading-[1.2]
  lg:text-[11.5px]
">
  {description}
</p>

        <button
          type="button"
          onClick={onClick}
          className={`
            mt-auto flex w-full items-center justify-center gap-1.5
            rounded-[11px] px-2 py-1.5
            text-[10px] font-black
            shadow-[0_6px_14px_rgba(7,21,46,0.12)]
            transition duration-300
            hover:brightness-105
            sm:rounded-[13px] sm:px-3 sm:py-2 sm:text-[12px]
            lg:text-[13px]
            ${theme.button}
          `}
        >
          {button}
          <ArrowIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </button>
      </div>
    </article>
  );
}