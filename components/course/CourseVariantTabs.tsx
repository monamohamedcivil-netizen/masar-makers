"use client";

import {
  BookOpen,
  GraduationCap,
  Plus,
  Rocket,
} from "lucide-react";

import type {
  CourseVariant,
} from "@/data/types";

type CourseVariantTabsProps = {
  variants: CourseVariant[];
  activeVariantSlug: string;
  onChange: (variantSlug: string) => void;
};

export default function CourseVariantTabs({
  variants,
  activeVariantSlug,
  onChange,
}: CourseVariantTabsProps) {
  const visibleVariants = [...variants]
    .filter((variant) => variant.active)
    .sort((a, b) => a.order - b.order);

  if (visibleVariants.length <= 1) {
    return null;
  }

  const integratedVariant =
    visibleVariants.find(
      (variant) =>
        variant.type === "integrated"
    );

  const fundamentalVariant =
    visibleVariants.find(
      (variant) =>
        variant.type === "fundamental"
    );

  const advancedVariant =
    visibleVariants.find(
      (variant) =>
        variant.type === "advanced"
    );

  /*
    إذا لم تكن المحطة مبنية بنظام:
    Integrated + Fundamental + Advanced
    نعرض البطاقات بصورة عادية.
  */
  if (!integratedVariant) {
    return (
      <div
        dir="rtl"
        className="
          relative z-40 mx-auto
          flex w-fit overflow-hidden
          border border-[#DCE2EA]
          bg-white
          shadow-[0_7px_20px_rgba(7,21,46,0.06)]
        "
      >
        {visibleVariants.map((variant) => (
          <VariantButton
            key={variant.id}
            variant={variant}
            isActive={
              variant.slug ===
              activeVariantSlug
            }
            onClick={() =>
              onChange(variant.slug)
            }
          />
        ))}
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      className="
relative
z-40
mx-auto
w-full
max-w-full
md:max-w-[520px]
px-2
md:px-3
pb-2
"
    >
      {/* Integrated Journey */}
      <div className="relative z-20 flex justify-center">
        <button
          type="button"
          onClick={() =>
            onChange(
              integratedVariant.slug
            )
          }
          className={`
            group relative
            min-h-[50px] w-full
            max-w-[350px]
            overflow-hidden
            rounded-[20px] border
            px-6 py-2
            text-center
            transition-all duration-300

            ${
              integratedVariant.slug ===
              activeVariantSlug
                ? `
                  border-[#F7B548]
                  bg-[#07152E]
                  text-white
                  shadow-[0_14px_35px_rgba(7,21,46,0.22)]
                  ring-2 ring-[#F7B548]/25
                `
                : `
                  border-[#D7DDE6]
                  bg-white
                  text-[#07152E]
                  shadow-[0_9px_25px_rgba(7,21,46,0.10)]
                  hover:-translate-y-0.5
                  hover:border-[#F7B548]
                `
            }
          `}
        >
          <div className="flex items-center justify-center gap-3">
            <span
              className={`
                flex h-8 w-8 shrink-0
                items-center justify-center
                rounded-[13px]
                transition duration-300

                ${
                  integratedVariant.slug ===
                  activeVariantSlug
                    ? `
                      bg-[#F7B548]
                      text-[#07152E]
                    `
                    : `
                      bg-[#FFF7E3]
                      text-[#D49319]
                    `
                }
              `}
            >
              <Rocket size={20} />
            </span>

            <div className="text-right">
              <h3 className="text-[15px] font-black">
                الرحلة المتكاملة
              </h3>

              <p
                className={`
                  mt-0 text-[10px]
                  font-bold

                  ${
                    integratedVariant.slug ===
                    activeVariantSlug
                      ? "text-slate-300"
                      : "text-slate-500"
                  }
                `}
              >
                تشمل رحلة الأساسيات
                والرحلة المتقدمة
              </p>
            </div>
          </div>

          {integratedVariant.status ===
            "coming_soon" && (
            <ComingSoonBadge />
          )}

          {integratedVariant.slug ===
            activeVariantSlug && (
            <span className="absolute bottom-0 right-0 h-[4px] w-full bg-[#F7B548]" />
          )}
        </button>
      </div>

      {/* Connector */}
      <div className="relative mx-auto h-[31px] w-[55%]">
        <span
          className="
            absolute left-1/2 top-0
            h-[15px] w-px
            -translate-x-1/2
            bg-[#C9D0DA]
          "
        />

        <span
          className="
            absolute left-0 right-0
            top-[14px] h-px
            bg-[#C9D0DA]
          "
        />

        <span
          className="
            absolute left-0 top-[14px]
            h-[17px] w-px
            bg-[#C9D0DA]
          "
        />

        <span
          className="
            absolute right-0 top-[14px]
            h-[17px] w-px
            bg-[#C9D0DA]
          "
        />

        <span
          className="
            absolute left-1/2 top-[6px]
            flex h-5 w-5
            -translate-x-1/2
            items-center justify-center
            rounded-full
            border border-[#D7DDE6]
            bg-[#F7F8FA]
            text-[#D49319]
          "
        >
          <Plus size={12} />
        </span>
      </div>

      {/* Fundamental + Advanced */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
        {fundamentalVariant && (
          <SecondaryVariantButton
            variant={fundamentalVariant}
            isActive={
              fundamentalVariant.slug ===
              activeVariantSlug
            }
            icon={BookOpen}
            onClick={() =>
              onChange(
                fundamentalVariant.slug
              )
            }
          />
        )}

        {advancedVariant && (
          <SecondaryVariantButton
            variant={advancedVariant}
            isActive={
              advancedVariant.slug ===
              activeVariantSlug
            }
            icon={GraduationCap}
            onClick={() =>
              onChange(
                advancedVariant.slug
              )
            }
          />
        )}
      </div>
    </div>
  );
}

/* ==================================================
   Secondary Variant
================================================== */

type SecondaryVariantButtonProps = {
  variant: CourseVariant;
  isActive: boolean;
  icon: typeof BookOpen;
  onClick: () => void;
};

function SecondaryVariantButton({
  variant,
  isActive,
  icon: Icon,
  onClick,
}: SecondaryVariantButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        group relative
        flex min-h-[58px]
        items-center justify-center
        gap-3 overflow-hidden
        rounded-[17px] border
        px-4 py-2.5
        text-right
        transition-all duration-300

        ${
          isActive
            ? `
              border-[#F7B548]
              bg-[#FFF7E3]
              text-[#07152E]
              shadow-[0_9px_24px_rgba(247,181,72,0.16)]
              ring-1 ring-[#F7B548]/30
            `
            : `
              border-[#D8DDE5]
              bg-[#E9EBEF]
              text-[#555B66]
              hover:-translate-y-0.5
              hover:border-[#F7B548]/70
              hover:bg-white
              hover:text-[#07152E]
            `
        }
      `}
    >
      <span
        className={`
          flex h-9 w-9 shrink-0
          items-center justify-center
          rounded-[12px]
          transition duration-300

          ${
            isActive
              ? `
                bg-[#F7B548]
                text-[#07152E]
              `
              : `
                bg-[#DDE1E7]
                text-[#747B86]
                group-hover:bg-[#FFF7E3]
                group-hover:text-[#D49319]
              `
          }
        `}
      >
        <Icon size={18} />
      </span>

      <div>
        <h3 className="text-[14px] font-black">
          {variant.type ===
          "fundamental"
            ? "رحلة الأساسيات"
            : "الرحلة المتقدمة"}
        </h3>

        <p className="mt-0.5 text-[9px] font-bold opacity-70">
          {variant.level}
        </p>
      </div>

      {variant.status ===
        "coming_soon" && (
        <ComingSoonBadge />
      )}

      {isActive && (
        <span className="absolute bottom-0 right-0 h-[3px] w-full bg-[#F7B548]" />
      )}
    </button>
  );
}

/* ==================================================
   Generic Fallback Button
================================================== */

type VariantButtonProps = {
  variant: CourseVariant;
  isActive: boolean;
  onClick: () => void;
};

function VariantButton({
  variant,
  isActive,
  onClick,
}: VariantButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        relative min-w-[185px]
        border-l border-[#DCE2EA]
        px-7 py-3
        text-[15px] font-black
        transition duration-300
        last:border-l-0

        ${
          isActive
            ? `
              border-[#F7B548]
              bg-[#FFF7E3]
              text-[#07152E]
              shadow-[inset_0_0_0_1px_#F7B548]
            `
            : `
              bg-[#E7E7E7]
              text-[#747474]
              hover:bg-white
              hover:text-[#07152E]
            `
        }
      `}
    >
      {variant.shortTitle}

      {variant.status ===
        "coming_soon" && (
        <ComingSoonBadge />
      )}
    </button>
  );
}

/* ==================================================
   Coming Soon Badge
================================================== */

function ComingSoonBadge() {
  return (
    <span
      className="
        absolute left-2 top-1.5
        rounded-full bg-[#07152E]
        px-2 py-0.5
        text-[8px] font-black
        text-white
      "
    >
      قريبًا
    </span>
  );
}