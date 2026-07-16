"use client";

import {
  Pencil,
} from "lucide-react";

import {
  useBuilder,
} from "./BuilderProvider";

type EditableTitleProps = {
  id: string;
  value: string;

  label?: string;
  pageType?: string;

  as?:
    | "h1"
    | "h2"
    | "h3"
    | "p"
    | "span";

  className?: string;

  scope?:
    | "page"
    | "template";
};

export default function EditableTitle({
  id,
  value,
  label = "العنوان",
  pageType,
  as = "h2",
  className = "",
  scope = "page",
}: EditableTitleProps) {
  const {
    isEditMode,
    selectedElement,
    selectElement,
  } = useBuilder();

  const Component = as;

  const isSelected =
    selectedElement?.id === id;

  const displayedValue =
    isSelected
      ? selectedElement.value
      : value;

  const handleSelect = () => {
    if (!isEditMode) {
      return;
    }

    selectElement({
      id,
      type: "title",
      label,
      value: displayedValue,
      pageType,
      scope,
    });
  };

  return (
    <div
      className={`
        group/editable relative
        ${isEditMode
          ? "cursor-pointer"
          : ""}
      `}
      onClick={handleSelect}
    >
      {isEditMode && (
        <span
          className={`
            pointer-events-none
            absolute -inset-2
            rounded-lg border
            transition-all

            ${
              isSelected
                ? `
                  border-[#F7B548]
                  bg-[#FFF7E3]/20
                `
                : `
                  border-transparent
                  group-hover/editable:border-[#F7B548]
                `
            }
          `}
        />
      )}

      {isEditMode && (
        <span
          className={`
            absolute -left-2 -top-7
            z-20 hidden
            items-center gap-1
            rounded-md
            bg-[#07152E]
            px-2 py-1
            text-[9px] font-black
            text-white
            shadow-lg

            group-hover/editable:flex

            ${
              isSelected
                ? "!flex"
                : ""
            }
          `}
        >
          <Pencil size={10} />
          تعديل
        </span>
      )}

      <Component
        className={`
          relative z-10
          ${className}
        `}
      >
        {displayedValue}
      </Component>
    </div>
  );
}