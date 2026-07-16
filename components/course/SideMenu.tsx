"use client";

import {
  Pencil,
  Plus,
} from "lucide-react";

import type {
  CoursePanelTab,
} from "@/data/types";

import PanelMenuItem, {
  type PanelMenuItemData,
} from "./PanelMenuItem";

type SideMenuProps = {
  mode:
    | "student"
    | "edit"
    | "preview";

  title: string;

  items: PanelMenuItemData[];

  activePanel: CoursePanelTab;

  onChange: (
    panel: CoursePanelTab
  ) => void;

  onEditTitle: () => void;

  onAdd: () => void;

  onEditItem: (
    item: PanelMenuItemData
  ) => void;

  onMoveUp: (
    item: PanelMenuItemData
  ) => void;

  onMoveDown: (
    item: PanelMenuItemData
  ) => void;
};

export default function SideMenu({
  mode,
  title,
  items,
  activePanel,
  onChange,
  onEditTitle,
  onAdd,
  onEditItem,
  onMoveUp,
  onMoveDown,
}: SideMenuProps) {
  const isEditMode =
    mode === "edit";

  return (
    <aside className="relative w-full">
      <div
        className="
          relative flex min-h-[56px]
          items-center justify-center
          px-2 text-center
        "
      >
        <h2
          className="
            relative px-2 pb-1
            text-[20px] font-black
            text-[#B87508]
            drop-shadow-[0_2px_2px_rgba(7,21,46,0.14)]
            xl:text-[22px]
          "
        >
          {title}

          <span
            className="
              absolute bottom-0 left-1/2
              h-[2px] w-10
              -translate-x-1/2
              bg-[#F7B548]
            "
          />
        </h2>

        {isEditMode && (
          <button
            type="button"
            onClick={onEditTitle}
            className="
              absolute left-0 top-1/2
              flex h-8 w-8
              -translate-y-1/2
              items-center justify-center
              rounded-full
              border border-[#F7B548]
              bg-white text-[#B87508]
              shadow-sm transition
              hover:bg-[#FFF7E3]
            "
            aria-label="تعديل عنوان العمود"
          >
            <Pencil size={14} />
          </button>
        )}
      </div>

      <div
        className="
          overflow-hidden
          border border-[#DCE2EA]
          bg-white
          shadow-[0_10px_28px_rgba(7,21,46,0.07)]
        "
      >
        {items.map(
          (item, index) => (
            <PanelMenuItem
              key={item.databaseId}
              item={item}
              index={index}
              totalItems={items.length}
              isActive={
                activePanel === item.id
              }
              isEditMode={isEditMode}
              onChange={onChange}
              onEdit={onEditItem}
              onMoveUp={onMoveUp}
              onMoveDown={onMoveDown}
            />
          )
        )}

        {isEditMode && (
          <button
            type="button"
            onClick={onAdd}
            className="
              flex min-h-[50px] w-full
              items-center justify-center
              gap-2 border-t
              border-dashed border-[#F7B548]
              bg-[#FFFDF7]
              px-4 text-[12px]
              font-black text-[#B87508]
              transition hover:bg-[#FFF7E3]
            "
          >
            <Plus size={16} />
            إضافة زر
          </button>
        )}
      </div>
    </aside>
  );
}