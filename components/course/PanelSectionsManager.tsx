"use client";

import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";

import {
  useState,
  useTransition,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  createPanelSection,
  deletePanelSection,
  swapPanelSectionOrder,
  updatePanelSection,
} from "@/lib/actions/builder";

import type {
  CatalogPanelSection,
} from "@/lib/queries/catalog/panels";

type PanelSectionsManagerProps = {
  courseId: string;
  panelComponent: string;
  sections: CatalogPanelSection[];
};

type SectionFormState = {
  id: string | null;
  sectionKey: string;
  title: string;
};

const emptyForm: SectionFormState = {
  id: null,
  sectionKey: "hero",
  title: "",
};

const sectionOptions = [
  {
    value: "hero",
    label: "مقدمة القسم",
  },
  {
    value: "stats",
    label: "الإحصائيات",
  },
  {
    value: "pricing",
    label: "الأسعار",
  },
  {
    value: "projects",
    label: "المشاريع",
  },
  {
    value: "outcomes",
    label: "النتائج",
  },
  {
    value: "curriculum",
    label: "المحاضرات",
  },
  {
    value: "reviews",
    label: "آراء المتدربين",
  },
  {
    value: "faq",
    label: "الأسئلة الشائعة",
  },
  {
    value: "cta",
    label: "دعوة لاتخاذ إجراء",
  },
];

export default function PanelSectionsManager({
  courseId,
  panelComponent,
  sections,
}: PanelSectionsManagerProps) {
  const router = useRouter();

  const [
    isPending,
    startTransition,
  ] = useTransition();

  const [
    isFormOpen,
    setIsFormOpen,
  ] = useState(false);

  const [
    form,
    setForm,
  ] =
    useState<SectionFormState>(
      emptyForm
    );

  const sortedSections = [
    ...sections,
  ].sort(
    (a, b) =>
      a.display_order -
      b.display_order
  );

  const resetForm = () => {
    setForm(emptyForm);
    setIsFormOpen(false);
  };

  const openCreateForm = () => {
    setForm(emptyForm);
    setIsFormOpen(true);
  };

  const openEditForm = (
    section: CatalogPanelSection
  ) => {
    setForm({
      id: section.id,
      sectionKey:
        section.section_key,
      title:
        section.title ?? "",
    });

    setIsFormOpen(true);
  };

  const handleSave = () => {
    const cleanTitle =
      form.title.trim();

    if (!cleanTitle) {
      window.alert(
        "اكتبي عنوان القسم."
      );

      return;
    }

    startTransition(async () => {
      const result = form.id
        ? await updatePanelSection({
            id: form.id,

            values: {
              section_key:
                form.sectionKey,

              title:
                cleanTitle,
            },
          })
        : await createPanelSection({
            courseId,

            panelComponent,

            sectionKey:
              form.sectionKey,

            title:
              cleanTitle,

            displayOrder:
              sortedSections.length +
              1,
          });

      if (!result.success) {
        window.alert(
          result.message ??
            "تعذر حفظ القسم."
        );

        return;
      }

      resetForm();
      router.refresh();
    });
  };

  const handleDelete = (
    section: CatalogPanelSection
  ) => {
    const confirmed =
      window.confirm(
        `هل تريدين حذف قسم "${section.title ?? section.section_key}"؟`
      );

    if (!confirmed) {
      return;
    }

    startTransition(async () => {
      const result =
        await deletePanelSection({
          id: section.id,
        });

      if (!result.success) {
        window.alert(
          result.message ??
            "تعذر حذف القسم."
        );

        return;
      }

      router.refresh();
    });
  };

  const handleToggleActive = (
    section: CatalogPanelSection
  ) => {
    startTransition(async () => {
      const result =
        await updatePanelSection({
          id: section.id,

          values: {
            active:
              !section.active,
          },
        });

      if (!result.success) {
        window.alert(
          result.message ??
            "تعذر تغيير حالة القسم."
        );

        return;
      }

      router.refresh();
    });
  };

  const handleMove = (
    section: CatalogPanelSection,
    direction: "up" | "down"
  ) => {
    const currentIndex =
      sortedSections.findIndex(
        (item) =>
          item.id === section.id
      );

    const targetIndex =
      direction === "up"
        ? currentIndex - 1
        : currentIndex + 1;

    const targetSection =
      sortedSections[targetIndex];

    if (
      currentIndex < 0 ||
      !targetSection
    ) {
      return;
    }

    startTransition(async () => {
      const result =
        await swapPanelSectionOrder({
          firstId:
            section.id,

          firstOrder:
            section.display_order,

          secondId:
            targetSection.id,

          secondOrder:
            targetSection.display_order,
        });

      if (!result.success) {
        window.alert(
          result.message ??
            "تعذر تغيير ترتيب الأقسام."
        );

        return;
      }

      router.refresh();
    });
  };

  return (
    <section
      dir="rtl"
      className="
        overflow-hidden
        rounded-[24px]
        border border-[#DCE3EB]
        bg-white
        shadow-[0_12px_34px_rgba(7,21,46,0.08)]
      "
    >
      <header
        className="
          flex flex-wrap
          items-center
          justify-between gap-3
          border-b border-[#E3E7ED]
          bg-[#07152E]
          px-5 py-4
          text-white
        "
      >
        <div>
          <p className="text-[11px] font-bold text-[#F7B548]">
            إدارة محتوى الشاشة
          </p>

          <h2 className="mt-1 text-[18px] font-black">
            أقسام الـ Panel
          </h2>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
          disabled={isPending}
          className="
            flex h-10 items-center
            justify-center gap-2
            rounded-xl
            bg-[#F7B548]
            px-4 text-[12px]
            font-black text-[#07152E]
            transition
            hover:bg-[#FFC966]
            disabled:opacity-50
          "
        >
          <Plus size={16} />
          إضافة قسم
        </button>
      </header>

      {isPending && (
        <div
          className="
            flex items-center
            justify-center gap-2
            border-b border-[#E3E7ED]
            bg-[#FFF7E3]
            px-4 py-2
            text-[11px] font-black
            text-[#B87508]
          "
        >
          <Loader2
            size={14}
            className="animate-spin"
          />

          جارٍ تنفيذ التعديل...
        </div>
      )}

      <div className="space-y-3 p-5">
        {sortedSections.length ===
        0 ? (
          <div
            className="
              flex min-h-[160px]
              flex-col items-center
              justify-center
              rounded-2xl
              border border-dashed
              border-[#D6DEE8]
              bg-[#F9FAFC]
              px-6 text-center
            "
          >
            <p className="text-[13px] font-black text-[#07152E]">
              لا توجد أقسام بعد
            </p>

            <p className="mt-2 text-[11px] font-bold text-slate-500">
              اضغطي على إضافة قسم لبدء بناء الشاشة.
            </p>
          </div>
        ) : (
          sortedSections.map(
            (section, index) => (
              <article
                key={section.id}
                className="
                  flex flex-col gap-4
                  rounded-2xl
                  border border-[#DCE3EB]
                  bg-[#F8FAFC]
                  p-4
                  sm:flex-row
                  sm:items-center
                "
              >
                <div
                  className="
                    flex h-10 w-10
                    shrink-0 items-center
                    justify-center
                    rounded-full
                    bg-[#07152E]
                    text-[13px]
                    font-black
                    text-[#F7B548]
                  "
                >
                  {index + 1}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-[14px] font-black text-[#07152E]">
                    {section.title ??
                      section.section_key}
                  </h3>

                  <p className="mt-1 text-[10px] font-bold text-slate-500">
                    نوع القسم:{" "}
                    {
                      section.section_key
                    }
                  </p>

                  <p
                    className={`
                      mt-1 text-[10px]
                      font-black

                      ${
                        section.active
                          ? "text-emerald-600"
                          : "text-slate-400"
                      }
                    `}
                  >
                    {section.active
                      ? "ظاهر"
                      : "مخفي"}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleMove(
                        section,
                        "up"
                      )
                    }
                    disabled={
                      index === 0 ||
                      isPending
                    }
                    className="
                      flex h-9 w-9
                      items-center
                      justify-center
                      rounded-lg
                      border border-[#DCE3EB]
                      bg-white
                      text-[#07152E]
                      transition
                      hover:border-[#F7B548]
                      disabled:opacity-30
                    "
                    aria-label="نقل لأعلى"
                  >
                    <ArrowUp
                      size={15}
                    />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleMove(
                        section,
                        "down"
                      )
                    }
                    disabled={
                      index ===
                        sortedSections.length -
                          1 ||
                      isPending
                    }
                    className="
                      flex h-9 w-9
                      items-center
                      justify-center
                      rounded-lg
                      border border-[#DCE3EB]
                      bg-white
                      text-[#07152E]
                      transition
                      hover:border-[#F7B548]
                      disabled:opacity-30
                    "
                    aria-label="نقل لأسفل"
                  >
                    <ArrowDown
                      size={15}
                    />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleToggleActive(
                        section
                      )
                    }
                    disabled={isPending}
                    className="
                      flex h-9 w-9
                      items-center
                      justify-center
                      rounded-lg
                      border border-[#DCE3EB]
                      bg-white
                      text-[#07152E]
                      transition
                      hover:border-[#F7B548]
                    "
                    aria-label={
                      section.active
                        ? "إخفاء القسم"
                        : "إظهار القسم"
                    }
                  >
                    {section.active ? (
                      <Eye size={15} />
                    ) : (
                      <EyeOff
                        size={15}
                      />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      openEditForm(
                        section
                      )
                    }
                    disabled={isPending}
                    className="
                      flex h-9 w-9
                      items-center
                      justify-center
                      rounded-lg
                      border border-[#DCE3EB]
                      bg-white
                      text-[#07152E]
                      transition
                      hover:border-[#F7B548]
                    "
                    aria-label="تعديل القسم"
                  >
                    <Pencil size={15} />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleDelete(
                        section
                      )
                    }
                    disabled={isPending}
                    className="
                      flex h-9 w-9
                      items-center
                      justify-center
                      rounded-lg
                      border border-red-200
                      bg-red-50
                      text-red-600
                      transition
                      hover:bg-red-600
                      hover:text-white
                    "
                    aria-label="حذف القسم"
                  >
                    <Trash2
                      size={15}
                    />
                  </button>
                </div>
              </article>
            )
          )
        )}
      </div>

      {isFormOpen && (
        <>
          <button
            type="button"
            onClick={resetForm}
            className="
              fixed inset-0
              z-[9997]
              cursor-default
              bg-[#07152E]/25
              backdrop-blur-[1px]
            "
            aria-label="إغلاق النموذج"
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
                flex items-center
                justify-between
                bg-[#07152E]
                px-5 py-4
                text-white
              "
            >
              <div>
                <p className="text-[11px] font-bold text-[#F7B548]">
                  إعدادات القسم
                </p>

                <h2 className="mt-1 text-[17px] font-black">
                  {form.id
                    ? "تعديل القسم"
                    : "إضافة قسم جديد"}
                </h2>
              </div>

              <button
                type="button"
                onClick={resetForm}
                className="
                  flex h-9 w-9
                  items-center
                  justify-center
                  rounded-full
                  bg-white/10
                "
              >
                <X size={18} />
              </button>
            </header>

            <div className="space-y-5 p-5">
              <div>
                <label className="text-[12px] font-black text-[#07152E]">
                  نوع القسم
                </label>

                <select
                  value={
                    form.sectionKey
                  }
                  onChange={(
                    event
                  ) =>
                    setForm(
                      (current) => ({
                        ...current,

                        sectionKey:
                          event
                            .target
                            .value,
                      })
                    )
                  }
                  className="
                    mt-2 h-11 w-full
                    rounded-xl
                    border border-[#DCE3EB]
                    bg-white px-3
                    text-[12px]
                    font-bold
                    text-[#07152E]
                    outline-none
                    focus:border-[#F7B548]
                  "
                >
                  {sectionOptions.map(
                    (option) => (
                      <option
                        key={
                          option.value
                        }
                        value={
                          option.value
                        }
                      >
                        {option.label}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="text-[12px] font-black text-[#07152E]">
                  عنوان القسم
                </label>

                <input
                  value={form.title}
                  onChange={(
                    event
                  ) =>
                    setForm(
                      (current) => ({
                        ...current,

                        title:
                          event
                            .target
                            .value,
                      })
                    )
                  }
                  className="
                    mt-2 h-11 w-full
                    rounded-xl
                    border border-[#DCE3EB]
                    px-4
                    text-[13px]
                    font-bold
                    text-[#07152E]
                    outline-none
                    focus:border-[#F7B548]
                  "
                  placeholder="اكتبي عنوان القسم"
                  autoFocus
                />
              </div>

              <button
                type="button"
                onClick={handleSave}
                disabled={isPending}
                className="
                  flex h-11 w-full
                  items-center
                  justify-center gap-2
                  rounded-xl
                  bg-[#F7B548]
                  px-5
                  text-[13px]
                  font-black
                  text-[#07152E]
                  transition
                  hover:bg-[#FFC966]
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

                حفظ القسم
              </button>
            </div>
          </aside>
        </>
      )}
    </section>
  );
}