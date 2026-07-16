"use client";

import {
  Check,
  Globe2,
  Loader2,
  RotateCcw,
  Save,
  X,
  Trash2,
} from "lucide-react";

import {
  useTransition,
} from "react";

import {
  useRouter,
} from "next/navigation";


import {
  createCoursePanelItem,
  deleteCoursePanelItem,
  updateCoursePanelItem,
} from "@/lib/actions/builder";

import {
  useBuilder,
} from "./BuilderProvider";

export default function BuilderPropertiesPanel() {
  const router = useRouter();

  const [
    isPending,
    startTransition,
  ] = useTransition();

  const {
    isEditMode,
    selectedElement,
    isDirty,
    closeProperties,
    updateSelectedValue,
    resetSelectedElement,
    setIsSaving,
  } = useBuilder();

  if (
    !isEditMode ||
    !selectedElement
  ) {
    return null;
  }
console.log(selectedElement);

  const isCreate =
  selectedElement.type === "panel-item" &&
  selectedElement.recordId === "";

const canSave = Boolean(
  selectedElement.table &&
    selectedElement.field &&
    (isCreate
      ? selectedElement.pageType
      : selectedElement.recordId)
);

const handleSave = () => {
  const table =
    selectedElement.table;

  const recordId =
    selectedElement.recordId;

  const field =
    selectedElement.field;

  const fieldValue =
    selectedElement.value.trim();

  const stationId =
    selectedElement.pageType;

  const isCreate =
    selectedElement.type === "panel-item" &&
    recordId === "";

  if (
    !table ||
    !field ||
    !fieldValue
  ) {
    return;
  }

  if (
    isCreate &&
    !stationId
  ) {
    window.alert(
      "لم يتم تحديد المحطة الخاصة بالزر."
    );

    return;
  }

  if (
    !isCreate &&
    !recordId
  ) {
    return;
  }

  startTransition(async () => {
    setIsSaving(true);

    try {
      let result: {
        success: boolean;
        message?: string;
      };

      if (isCreate) {
        if (
          table !==
            "course_learning_modes" &&
          table !==
            "course_result_tabs"
        ) {
          window.alert(
            "لا يمكن إضافة زر داخل هذا الجدول."
          );

          return;
        }

        result =
          await createCoursePanelItem({
            table,

            values: {
              station_id: stationId,

              title: fieldValue,

              icon:
                selectedElement.group ===
                "learning"
                  ? "play-circle"
                  : "target",

              panel_type:
                selectedElement.group ===
                "learning"
                  ? "learning"
                  : "result",

              panel_component:
                `custom-${crypto.randomUUID()}`,

              display_order:
                selectedElement.displayOrder ??
                99,

              active: true,

              updated_at:
                new Date().toISOString(),
            },
          });
      } else {
        result =
          await updateCoursePanelItem({
            table,

            id: recordId as string,

            values: {
              [field]: fieldValue,

              updated_at:
                new Date().toISOString(),
            },
          });
      }

      if (!result.success) {
        window.alert(
          result.message ??
            "تعذر حفظ التعديل."
        );

        return;
      }

      closeProperties();
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  });
};

const handleDelete = () => {
  const table =
    selectedElement.table;

  const recordId =
    selectedElement.recordId;

  if (
    !table ||
    !recordId ||
    table === "course_stations"
  ) {
    return;
  }

  const confirmed =
    window.confirm(
      `هل تريدين حذف "${selectedElement.value}"؟`
    );

  if (!confirmed) {
    return;
  }

  startTransition(async () => {
    setIsSaving(true);

    try {
      const result =
        await deleteCoursePanelItem({
          table,
          id: recordId,
        });

      if (!result.success) {
        window.alert(
          result.message ??
            "تعذر حذف الزر."
        );

        return;
      }

      closeProperties();
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  });
};

  return (
    <>
      <button
        type="button"
        onClick={closeProperties}
        className="
          fixed inset-0
          z-[9997]
          cursor-default
          bg-[#07152E]/20
          backdrop-blur-[1px]
        "
        aria-label="إغلاق لوحة الخصائص"
      />

      <aside
        dir="rtl"
        className="
          fixed left-0 top-0
          z-[9998]
          h-screen w-full
          max-w-[390px]
          overflow-y-auto
          border-r border-[#DCE3EB]
          bg-white
          shadow-[18px_0_55px_rgba(7,21,46,0.18)]
        "
      >
        <header
          className="
            sticky top-0 z-10
            flex items-center
            justify-between
            bg-[#07152E]
            px-5 py-4
            text-white
          "
        >
          <div>
            <p className="text-[11px] font-bold text-[#F7B548]">
              خصائص العنصر
            </p>

            <h2 className="mt-1 text-[17px] font-black">
              {selectedElement.label}
            </h2>
          </div>

          <button
            type="button"
            onClick={closeProperties}
            className="
              flex h-9 w-9
              items-center justify-center
              rounded-full
              bg-white/10
              transition
              hover:bg-white/20
            "
            aria-label="إغلاق"
          >
            <X size={18} />
          </button>
        </header>

        <div className="space-y-6 p-5">
          <div>
            <label
              htmlFor="builder-element-value"
              className="
                text-[12px]
                font-black
                text-[#07152E]
              "
            >
              النص
            </label>

            <textarea
              id="builder-element-value"
              value={
                selectedElement.value
              }
              onChange={(event) =>
                updateSelectedValue(
                  event.target.value
                )
              }
              rows={4}
              autoFocus
              className="
                mt-2 w-full
                resize-none
                rounded-xl
                border border-[#DCE3EB]
                px-4 py-3
                text-[13px]
                font-bold
                text-[#07152E]
                outline-none
                transition
                focus:border-[#F7B548]
                focus:ring-2
                focus:ring-[#F7B548]/15
              "
            />
          </div>

          {selectedElement.type ===
            "panel-item" && (
            <div
              className="
                grid gap-3
                rounded-xl
                border border-[#DCE3EB]
                bg-[#F8FAFC]
                p-4
              "
            >
              <InfoRow
                label="المجموعة"
                value={
                  selectedElement.group ===
                  "learning"
                    ? "اختر طريقة التعلم"
                    : "نتائج الرحلة"
                }
              />

              <InfoRow
                label="حالة الزر"
                value={
                  selectedElement.active ===
                  false
                    ? "مخفي"
                    : "ظاهر"
                }
              />

              {selectedElement.displayOrder !==
                undefined && (
                <InfoRow
                  label="الترتيب"
                  value={String(
                    selectedElement.displayOrder
                  )}
                />
              )}
            </div>
          )}

          <div
            className="
              rounded-xl
              border border-[#DCE3EB]
              bg-[#F8FAFC]
              p-4
            "
          >
            <p className="text-[11px] font-black text-[#07152E]">
              نطاق التعديل
            </p>

            <div className="mt-3 flex items-center gap-2">
              {selectedElement.scope ===
              "template" ? (
                <Globe2
                  size={16}
                  className="text-[#D49319]"
                />
              ) : (
                <Check
                  size={16}
                  className="text-[#D49319]"
                />
              )}

              <span className="text-[11px] font-bold text-slate-600">
                {selectedElement.scope ===
                "template"
                  ? "إعداد مشترك من القالب"
                  : "هذه الصفحة فقط"}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={
                !canSave ||
                !isDirty ||
                isPending
              }
              className="
                flex h-11 w-full
                items-center justify-center
                gap-2 rounded-xl
                bg-[#F7B548]
                px-5
                text-[13px]
                font-black
                text-[#07152E]
                transition
                hover:bg-[#FFC966]
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              {isPending ? (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              ) : (
                <Save size={16} />
              )}

              {isPending
                ? "جارٍ الحفظ..."
                : "حفظ التعديل"}
            </button>

            <button
              type="button"
              onClick={
                resetSelectedElement
              }
              disabled={
                !isDirty ||
                isPending
              }
              className="
                flex h-11 w-full
                items-center justify-center
                gap-2 rounded-xl
                border border-[#DCE3EB]
                bg-white
                px-5
                text-[12px]
                font-black
                text-[#07152E]
                transition
                hover:border-[#F7B548]
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              <RotateCcw size={16} />
              إلغاء التعديل
            </button>
          </div>

{selectedElement.type ===
  "panel-item" &&
  selectedElement.recordId && (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      className="
        flex h-11 w-full
        items-center justify-center
        gap-2 rounded-xl
        border border-red-200
        bg-red-50 px-5
        text-[12px] font-black
        text-red-600
        transition
        hover:bg-red-600
        hover:text-white
        disabled:cursor-not-allowed
        disabled:opacity-50
      "
    >
      <Trash2 size={16} />
      حذف الزر
    </button>
  )}
  
          {!canSave && (
            <p
              className="
                rounded-lg
                border border-amber-200
                bg-amber-50
                px-3 py-2
                text-[10px]
                font-bold
                leading-5
                text-amber-700
              "
            >
              هذا العنصر لم يتم ربطه بالحفظ بعد.
            </p>
          )}
        </div>
      </aside>
    </>
  );
}

type InfoRowProps = {
  label: string;
  value: string;
};

function InfoRow({
  label,
  value,
}: InfoRowProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[10px] font-bold text-slate-500">
        {label}
      </span>

      <span className="text-[11px] font-black text-[#07152E]">
        {value}
      </span>
    </div>
  );
}