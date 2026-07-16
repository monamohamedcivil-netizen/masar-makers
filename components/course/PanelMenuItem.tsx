"use client";

import type {
  LucideIcon,
} from "lucide-react";

import type {
  CoursePanelTab,
} from "@/data/types";

import PanelToolbar from "./PanelToolbar";

export type PanelMenuItemData = {
  databaseId: string;
  id: CoursePanelTab;
  title: string;
  icon: LucideIcon;
  displayOrder: number;
};

type PanelMenuItemProps = {
  item: PanelMenuItemData;
  index: number;
  totalItems: number;

  isActive: boolean;
  isEditMode: boolean;

  onChange: (
    panel: CoursePanelTab
  ) => void;

  onEdit: (
    item: PanelMenuItemData
  ) => void;

  onMoveUp: (
    item: PanelMenuItemData
  ) => void;

  onMoveDown: (
    item: PanelMenuItemData
  ) => void;
};

export default function PanelMenuItem({
  item,
  index,
  totalItems,
  isActive,
  isEditMode,
  onChange,
  onEdit,
  onMoveUp,
  onMoveDown,
}: PanelMenuItemProps) {
  const Icon = item.icon;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() =>
          onChange(item.id)
        }
        aria-pressed={isActive}
        className={`
          group relative flex
          min-h-[60px] w-full
          items-center gap-3
          border-b-3 px-4
          text-right
          transition-all duration-200
          last:border-b-0

          ${
            isActive
              ? `
                border-[#07152E]
                bg-[#07152E]
                text-[#F7B548]
              `
              : `
                border-[#F1F3F6]
                bg-[#E0E5EC]
                text-[#59606B]
                hover:bg-white
                hover:text-[#07152E]
              `
          }

          ${
            isEditMode
              ? "pl-[112px]"
              : ""
          }
        `}
      >
        <span
          className={`
            flex h-7 w-7 shrink-0
            items-center justify-center
            rounded-full
            transition duration-200

            ${
              isActive
                ? `
                  bg-[#F7B548]
                  text-[#07152E]
                `
                : `
                  text-[#747B86]
                  group-hover:bg-[#FFF4D8]
                  group-hover:text-[#B87508]
                `
            }
          `}
        >
          <Icon size={18} />
        </span>

        <span
          className="
            min-w-0 flex-1
            text-[13px] font-black
            leading-5
            xl:text-[14px]
          "
        >
          {item.title}
        </span>

        {isActive && (
          <span
            className="
              absolute bottom-0 right-0
              h-[3px] w-full
              bg-[#F7B548]
            "
          />
        )}
      </button>

      {isEditMode && (
        <PanelToolbar
          title={item.title}
          canMoveUp={index > 0}
          canMoveDown={
            index < totalItems - 1
          }
          onEdit={() => onEdit(item)}
          onMoveUp={() =>
            onMoveUp(item)
          }
          onMoveDown={() =>
            onMoveDown(item)
          }
        />
      )}
    </div>
  );
}