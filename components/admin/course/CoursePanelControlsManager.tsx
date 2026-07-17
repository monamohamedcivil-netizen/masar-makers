"use client";

import {
  useState,
  useTransition,
} from "react";


import type {
  CatalogCoursePanelItem,
} from "@/lib/queries/catalog/panels";

import {
  addCoursePanelControl,
  saveCoursePanelControls,
} from "@/lib/actions/course-panel-controls";

import {
  CheckCircle2,
  Eye,
  EyeOff,
  GripVertical,
  Loader2,
  Plus,
  Save,
} from "lucide-react";

type CoursePanelControlsManagerProps = {
  stationId: string;
  stationTitle: string;
  stationSlug: string;

  learningModes: CatalogCoursePanelItem[];
  resultTabs: CatalogCoursePanelItem[];
};

export default function CoursePanelControlsManager({
  stationId,
  stationTitle,
  stationSlug,
  learningModes,
  resultTabs,
}: CoursePanelControlsManagerProps) {
  const [learningItems, setLearningItems] =
    useState(learningModes);

  const [resultItems, setResultItems] =
    useState(resultTabs);

  const [isPending, startTransition] =
    useTransition();

  const [message, setMessage] =
    useState("");

  const handleSave = () => {
    setMessage("");

    startTransition(async () => {
      try {
        await saveCoursePanelControls({
          stationSlug,

          learningModes:
            learningItems.map((item) => ({
              id: item.id,
              title: item.title,
              display_order:
                item.display_order,
              active: item.active,
            })),

          resultTabs:
            resultItems.map((item) => ({
              id: item.id,
              title: item.title,
              display_order:
                item.display_order,
              active: item.active,
            })),
        });

        setMessage(
          "تم حفظ التعديلات بنجاح."
        );
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "حدث خطأ أثناء الحفظ."
        );
      }
    });
  };
const handleAddButton = (
  group: "learning" | "result"
) => {
  setMessage("");

  startTransition(async () => {
    try {
      const newItem =
        await addCoursePanelControl({
          stationId,
          stationTitle,
          group,
        });

      if (group === "learning") {
        setLearningItems((items) => [
          ...items,
          newItem,
        ]);
      } else {
        setResultItems((items) => [
          ...items,
          newItem,
        ]);
      }

      setMessage(
        "تمت إضافة زر جديد. عدّلي اسمه ثم احفظي."
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "تعذر إضافة الزر."
      );
    }
  });
};
  return (
    <section
      dir="rtl"
      className="space-y-5"
    >
      <div className="grid gap-6 xl:grid-cols-2">
        <ControlsTable
  title="اختر طريقة التعلم"
  items={learningItems}
  onChange={setLearningItems}
  onAdd={() =>
    handleAddButton("learning")
  }
/>

<ControlsTable
  title="نتائج الرحلة"
  items={resultItems}
  onChange={setResultItems}
  onAdd={() =>
    handleAddButton("result")
  }
/>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="
            flex h-11 items-center
            justify-center gap-2
            rounded-xl bg-[#F7B548]
            px-6 text-[13px]
            font-black text-[#07152E]
            transition
            hover:bg-[#FFC966]
            disabled:cursor-not-allowed
            disabled:opacity-60
          "
        >
          {isPending ? (
            <Loader2
              size={17}
              className="animate-spin"
            />
          ) : (
            <Save size={17} />
          )}

          {isPending
            ? "جارٍ الحفظ..."
            : "حفظ جميع التعديلات"}
        </button>

        {message && (
          <div
            className="
              flex items-center gap-2
              rounded-lg
              border border-[#DCE3EB]
              bg-white px-4 py-2
              text-[12px] font-bold
              text-[#07152E]
            "
          >
            <CheckCircle2
              size={16}
              className="text-[#D49319]"
            />

            {message}
          </div>
        )}
      </div>
    </section>
  );
}

type ControlsTableProps = {
  title: string;
  onAdd: () => void;
  items: CatalogCoursePanelItem[];
  onChange: (
    items: CatalogCoursePanelItem[]
  ) => void;
};

function ControlsTable({
  title,
  items,
  onChange,
  onAdd,
}: ControlsTableProps) {
  const updateItem = (
    itemId: string,
    changes: Partial<CatalogCoursePanelItem>
  ) => {
    onChange(
      items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              ...changes,
            }
          : item
      )
    );
  };

  return (
    <div
      className="
        overflow-hidden
        rounded-[20px]
        border border-[#DCE3EB]
        bg-white
        shadow-[0_12px_32px_rgba(7,21,46,0.07)]
      "
    >
      <div
  className="
    flex items-center justify-between
    gap-4 bg-[#07152E]
    px-5 py-4 text-white
  "
>
  <h2 className="text-[18px] font-black">
    {title}
  </h2>

  <button
    type="button"
    onClick={onAdd}
    className="
      flex h-9 items-center gap-2
      rounded-lg bg-[#F7B548]
      px-4 text-[12px]
      font-black text-[#07152E]
      transition hover:bg-[#FFC966]
    "
  >
    <Plus size={16} />
    إضافة زر
  </button>
</div>

      <div className="divide-y divide-[#E1E6ED]">
        {items.map((item) => (
          <div
            key={item.id}
            className="
              grid items-center gap-3
              px-4 py-3
              sm:grid-cols-[28px_minmax(0,1fr)_90px_48px]
            "
          >
            <GripVertical
              size={18}
              className="text-slate-400"
            />

            <input
              value={item.title}
              onChange={(event) =>
                updateItem(item.id, {
                  title:
                    event.target.value,
                })
              }
              className="
                h-10 w-full
                rounded-lg border
                border-[#DCE3EB]
                px-3 text-[13px]
                font-bold text-[#07152E]
                outline-none
                focus:border-[#F7B548]
              "
            />

            <input
              type="number"
              min={1}
              value={item.display_order}
              onChange={(event) =>
                updateItem(item.id, {
                  display_order:
                    Number(
                      event.target.value
                    ),
                })
              }
              className="
                h-10 rounded-lg
                border border-[#DCE3EB]
                px-3 text-center
                text-[13px] font-black
                outline-none
                focus:border-[#F7B548]
              "
            />

            <button
              type="button"
              onClick={() =>
                updateItem(item.id, {
                  active: !item.active,
                })
              }
              className={`
                flex h-10 w-10
                items-center justify-center
                rounded-lg border
                transition

                ${
                  item.active
                    ? `
                      border-[#F7B548]
                      bg-[#FFF7E3]
                      text-[#C98612]
                    `
                    : `
                      border-[#DCE3EB]
                      bg-[#F1F3F6]
                      text-slate-400
                    `
                }
              `}
              aria-label={
                item.active
                  ? "إخفاء الزر"
                  : "إظهار الزر"
              }
            >
              {item.active ? (
                <Eye size={17} />
              ) : (
                <EyeOff size={17} />
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}