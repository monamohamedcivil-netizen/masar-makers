"use client";

import Image from "next/image";
import { ArrowLeft, Gift, Star, Zap } from "lucide-react";

type LearningModeCardProps = {
  title: string;
  description: string;
  image: string;
  button: string;
  color: "gold" | "blue" | "green";
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
    label: "الأكثر طلبًا",
    icon: Star,
    imageBorder: "border-[#F7B548]/45",
  },

  blue: {
    border: "border-[#2F6FD6]/45",
    title: "text-[#123C7A]",
    badge:
      "bg-gradient-to-r from-[#2F6FD6] to-[#164A96] text-white",
    button:
      "bg-gradient-to-r from-[#2867C7] to-[#123C7A] text-white",
    label: "الأسرع",
    icon: Zap,
    imageBorder: "border-[#2F6FD6]/35",
  },

  green: {
    border: "border-[#2E9B57]/45",
    title: "text-[#2E8547]",
    badge:
      "bg-gradient-to-r from-[#49A95B] to-[#26773D] text-white",
    button:
      "bg-gradient-to-r from-[#55C766] to-[#2E8547] text-white",
    label: "FREE",
    icon: Gift,
    imageBorder: "border-[#2E9B57]/35",
  },
};

export default function LearningModeCard({
  title,
  description,
  image,
  button,
  color,
  featured = false,
  onClick,
}: LearningModeCardProps) {
  const theme = themes[color];
  const BadgeIcon = theme.icon;

  return (
    <article
      className={`
        group relative flex flex-col bg-white
        rounded-[42px] border
        transition-all duration-500
        hover:-translate-y-1.5
        hover:shadow-[0_24px_55px_rgba(7,21,46,0.12)]
        ${theme.border}
        ${featured ? "h-[425px]" : "h-[405px]"}
      `}
    >
      {/* Badge */}
      <div
        className={`
          absolute left-1/2 top-0 z-30
          flex -translate-x-1/2 -translate-y-1/2
          items-center gap-2 whitespace-nowrap
          rounded-full px-6 py-2.5
          text-[14px] font-black
          shadow-[0_9px_22px_rgba(7,21,46,0.18)]
          transition duration-300
          group-hover:scale-105
          ${theme.badge}
        `}
      >
        <BadgeIcon size={17} />
        <span>{theme.label}</span>
      </div>

     {/* Architectural Gate */}
<div className="px-5 pt-7">
  <div
    className={`
      relative mx-auto
      ${featured ? "h-[235px]" : "h-[215px]"}
    `}
  >
    {/* Outer arch frame */}
    <div
      className={`
        absolute left-[18px] right-[18px] top-0 bottom-[14px] z-10
        rounded-t-[105px] rounded-b-[12px]
        border-[3px] bg-white
        shadow-[0_12px_28px_rgba(7,21,46,0.12)]
        ${
          color === "gold"
            ? "border-[#F7B548]/55"
            : color === "blue"
            ? "border-[#2F6FD6]/38"
            : "border-[#2E9B57]/38"
        }
      `}
    />

    {/* Image opening */}
    <div
      className={`
        absolute left-[31px] right-[31px] top-[13px] bottom-[22px] z-20
        overflow-hidden rounded-t-[88px] rounded-b-[8px]
        bg-slate-100
      `}
    >
      <Image
        src={image}
        alt={title}
        fill
        priority={featured}
        sizes="(max-width: 1024px) 100vw, 33vw"
        className={`
          object-cover transition-transform duration-700
          group-hover:scale-[1.035]
          ${
            color === "gold"
              ? "object-[center_53%]"
              : color === "blue"
              ? "object-[center_47%]"
              : "object-[center_51%]"
          }
        `}
      />

      <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/10 to-transparent" />
    </div>

    {/* Left column */}
    <div
      className={`
        absolute bottom-[8px] left-[8px] z-30
        h-[64%] w-[22px]
        rounded-t-[8px] border bg-white
        shadow-[0_8px_16px_rgba(7,21,46,0.11)]
        ${
          color === "gold"
            ? "border-[#F7B548]/48"
            : color === "blue"
            ? "border-[#2F6FD6]/34"
            : "border-[#2E9B57]/34"
        }
      `}
    >
      <div className="absolute inset-y-1 left-1/2 w-px -translate-x-1/2 bg-slate-200/70" />
    </div>

    {/* Right column */}
    <div
      className={`
        absolute bottom-[8px] right-[8px] z-30
        h-[64%] w-[22px]
        rounded-t-[8px] border bg-white
        shadow-[0_8px_16px_rgba(7,21,46,0.11)]
        ${
          color === "gold"
            ? "border-[#F7B548]/48"
            : color === "blue"
            ? "border-[#2F6FD6]/34"
            : "border-[#2E9B57]/34"
        }
      `}
    >
      <div className="absolute inset-y-1 left-1/2 w-px -translate-x-1/2 bg-slate-200/70" />
    </div>

    {/* Left capital */}
    <div
      className={`
        absolute bottom-[64%] left-[4px] z-40
        h-[10px] w-[30px]
        rounded-[4px] border bg-white
        ${
          color === "gold"
            ? "border-[#F7B548]/48"
            : color === "blue"
            ? "border-[#2F6FD6]/34"
            : "border-[#2E9B57]/34"
        }
      `}
    />

    {/* Right capital */}
    <div
      className={`
        absolute bottom-[64%] right-[4px] z-40
        h-[10px] w-[30px]
        rounded-[4px] border bg-white
        ${
          color === "gold"
            ? "border-[#F7B548]/48"
            : color === "blue"
            ? "border-[#2F6FD6]/34"
            : "border-[#2E9B57]/34"
        }
      `}
    />

    {/* Left base */}
    <div
      className={`
        absolute bottom-0 left-[2px] z-40
        h-[12px] w-[34px]
        rounded-[5px] border bg-white
        shadow-sm
        ${
          color === "gold"
            ? "border-[#F7B548]/48"
            : color === "blue"
            ? "border-[#2F6FD6]/34"
            : "border-[#2E9B57]/34"
        }
      `}
    />

    {/* Right base */}
    <div
      className={`
        absolute bottom-0 right-[2px] z-40
        h-[12px] w-[34px]
        rounded-[5px] border bg-white
        shadow-sm
        ${
          color === "gold"
            ? "border-[#F7B548]/48"
            : color === "blue"
            ? "border-[#2F6FD6]/34"
            : "border-[#2E9B57]/34"
        }
      `}
    />

    {/* Bottom threshold */}
    <div
      className={`
        absolute bottom-[3px] left-[25px] right-[25px] z-35
        h-[8px] rounded-full border bg-white
        ${
          color === "gold"
            ? "border-[#F7B548]/42"
            : color === "blue"
            ? "border-[#2F6FD6]/30"
            : "border-[#2E9B57]/30"
        }
      `}
    />
  </div>
</div>

      {/* Content */}
      <div className="flex min-h-0 flex-1 flex-col px-6 pb-4 pt-3 text-center">
        <h3
          className={`
            font-black leading-tight
            ${theme.title}
            ${featured ? "text-[26px]" : "text-[23px]"}
          `}
        >
          {title}
        </h3>

         <p className="mx-auto mt-2 min-h-[48px] max-w-[440px] text-center text-[13px] font-medium leading-6 text-slate-600">
  {description}
</p>
          

        <button
          type="button"
          onClick={onClick}
          className={`
  mt-3 flex w-full items-center justify-center gap-3
  rounded-[16px] px-5 py-2.5
  text-[15px] font-black
  shadow-[0_8px_18px_rgba(7,21,46,0.14)]
  transition duration-300
  hover:brightness-105
  ${theme.button}
`}
        >
          {button}
          <ArrowLeft size={17} />
        </button>
      </div>
    </article>
  );
}