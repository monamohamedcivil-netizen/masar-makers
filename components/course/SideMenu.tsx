"use client";

import {
  Pencil,
  Plus,
} from "lucide-react";

import type {
  CoursePanelTab,
} from "@/data/types";

import type {
  PanelMenuItemData,
} from "./PanelMenuItem";

import PanelToolbar from "./PanelToolbar";

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
      {/* نفس عنوان القوائم الجانبية في صفحة الطالب */}
      <div className="relative flex min-h-[56px] items-center justify-center px-2 text-center">
        <h2 className="relative px-2 pb-1 text-[20px] font-black text-[#B87508] drop-shadow-[0_2px_2px_rgba(7,21,46,0.14)] xl:text-[22px]">
          {title}

          <span className="absolute bottom-0 left-1/2 h-[2px] w-10 -translate-x-1/2 bg-[#F7B548]" />
        </h2>

        {isEditMode ? (
          <button
            type="button"
            onClick={onEditTitle}
            className="absolute left-0 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-[#F7B548] bg-white text-[#B87508] shadow-sm transition hover:bg-[#FFF7E3]"
            aria-label="تعديل عنوان العمود"
          >
            <Pencil size={14} />
          </button>
        ) : null}
      </div>

      <div className="overflow-hidden border border-[#DCE2EA] bg-white shadow-[0_10px_28px_rgba(7,21,46,0.07)]">
        {items.map((item, index) => {
          const Icon = item.icon;
          const active =
            activePanel === item.id;

          return (
            <div
              key={item.databaseId}
              className="relative"
            >
              <button
                type="button"
                onClick={() =>
                  onChange(item.id)
                }
                aria-current={
                  active
                    ? "page"
                    : undefined
                }
                className={`group relative flex w-full items-center gap-3 px-4 text-right font-black transition-all duration-200 ${
                  active
                    ? "min-h-[56px] border-b border-[#07152E] bg-[#07152E] text-[14px] text-white"
                    : "min-h-[48px] border-b border-[#DCE2EA] bg-[#EEF1F5] text-[12px] text-[#4B5563] hover:bg-[#E3E7EC]"
                }`}
              >
                <span
                  className={`grid h-7 w-7 shrink-0 place-items-center transition ${
                    active
                      ? "text-[#F7B548]"
                      : "text-[#6B7280]"
                  }`}
                >
                  <Icon
                    size={20}
                    strokeWidth={1.8}
                  />
                </span>

                <span>
                  {item.title}
                </span>

                {active ? (
                  <span className="absolute bottom-0 left-4 right-4 h-[3px] bg-[#F7B548]" />
                ) : null}
              </button>

              {isEditMode ? (
                <PanelToolbar
                  title={item.title}
                  canMoveUp={index > 0}
                  canMoveDown={
                    index <
                    items.length - 1
                  }
                  onEdit={() =>
                    onEditItem(item)
                  }
                  onMoveUp={() =>
                    onMoveUp(item)
                  }
                  onMoveDown={() =>
                    onMoveDown(item)
                  }
                />
              ) : null}
            </div>
          );
        })}

        {isEditMode ? (
          <button
            type="button"
            onClick={onAdd}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 border-t border-dashed border-[#F7B548] bg-[#FFFDF7] px-4 text-[11px] font-black text-[#B87508] transition hover:bg-[#FFF7E3]"
          >
            <Plus size={15} />
            إضافة زر
          </button>
        ) : null}
      </div>
    </aside>
  );
}