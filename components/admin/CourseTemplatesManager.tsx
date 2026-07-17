"use client";

import {
  Check,
  CirclePlus,
  Crown,
  Loader2,
  Pencil,
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
  createCourseTemplate,
  deleteCourseTemplate,
  setDefaultCourseTemplate,
  updateCourseTemplate,
} from "@/lib/actions/builder";

import type {
  CatalogCourseTemplate,
} from "@/lib/queries/catalog/templates";

type CourseTemplatesManagerProps = {
  templates: CatalogCourseTemplate[];
};

type TemplateType =
  | "road"
  | "traffic"
  | "general";

type TemplateFormState = {
  id: string | null;
  name: string;
  slug: string;
  description: string;
  templateType: TemplateType;
};

const emptyForm: TemplateFormState = {
  id: null,
  name: "",
  slug: "",
  description: "",
  templateType: "road",
};

const templateTypeLabels: Record<
  TemplateType,
  string
> = {
  road: "هندسة الطرق",
  traffic: "الهندسة المرورية",
  general: "قالب عام",
};

function createSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function CourseTemplatesManager({
  templates,
}: CourseTemplatesManagerProps) {
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
    useState<TemplateFormState>(
      emptyForm
    );

  const sortedTemplates = [
    ...templates,
  ].sort((a, b) => {
    if (
      a.template_type !==
      b.template_type
    ) {
      return a.template_type.localeCompare(
        b.template_type
      );
    }

    return b.version - a.version;
  });

  const resetForm = () => {
    setForm(emptyForm);
    setIsFormOpen(false);
  };

  const openCreateForm = () => {
    setForm(emptyForm);
    setIsFormOpen(true);
  };

  const openEditForm = (
    template: CatalogCourseTemplate
  ) => {
    setForm({
      id: template.id,
      name: template.name,
      slug: template.slug,
      description:
        template.description ?? "",
      templateType:
        template.template_type,
    });

    setIsFormOpen(true);
  };

  const handleNameChange = (
    value: string
  ) => {
    setForm((current) => ({
      ...current,
      name: value,
      slug: current.id
        ? current.slug
        : createSlug(value),
    }));
  };

  const handleSave = () => {
    const name = form.name.trim();
    const slug = form.slug.trim();

    if (!name) {
      window.alert(
        "اكتبي اسم القالب."
      );

      return;
    }

    if (!form.id && !slug) {
      window.alert(
        "اكتبي رابط القالب."
      );

      return;
    }

    startTransition(async () => {
      const result = form.id
        ? await updateCourseTemplate({
            id: form.id,
            values: {
              name,
              description:
                form.description.trim() ||
                null,
              template_type:
                form.templateType,
            },
          })
        : await createCourseTemplate({
            name,
            slug,
            templateType:
              form.templateType,
          });

      if (!result.success) {
        window.alert(
          result.message ??
            "تعذر حفظ القالب."
        );

        return;
      }

      resetForm();
      router.refresh();
    });
  };

  const handleSetDefault = (
    template: CatalogCourseTemplate
  ) => {
    if (template.is_default) {
      return;
    }

    startTransition(async () => {
      const result =
        await setDefaultCourseTemplate({
          id: template.id,
          templateType:
            template.template_type,
        });

      if (!result.success) {
        window.alert(
          result.message ??
            "تعذر اعتماد القالب الافتراضي."
        );

        return;
      }

      router.refresh();
    });
  };

  const handleToggleActive = (
    template: CatalogCourseTemplate
  ) => {
    if (
      template.is_default &&
      template.is_active
    ) {
      window.alert(
        "لا يمكن تعطيل القالب الافتراضي. اعتمدي قالبًا آخر أولًا."
      );

      return;
    }

    startTransition(async () => {
      const result =
        await updateCourseTemplate({
          id: template.id,
          values: {
            is_active:
              !template.is_active,
          },
        });

      if (!result.success) {
        window.alert(
          result.message ??
            "تعذر تغيير حالة القالب."
        );

        return;
      }

      router.refresh();
    });
  };

  const handleDelete = (
    template: CatalogCourseTemplate
  ) => {
    if (template.is_default) {
      window.alert(
        "لا يمكن حذف القالب الافتراضي. اعتمدي قالبًا آخر أولًا."
      );

      return;
    }

    const confirmed =
      window.confirm(
        `هل تريدين حذف قالب "${template.name}"؟`
      );

    if (!confirmed) {
      return;
    }

    startTransition(async () => {
      const result =
        await deleteCourseTemplate({
          id: template.id,
        });

      if (!result.success) {
        window.alert(
          result.message ??
            "تعذر حذف القالب."
        );

        return;
      }

      router.refresh();
    });
  };

  return (
    <section
      dir="rtl"
      className="mx-auto max-w-[1500px]"
    >
      <header
        className="
          flex flex-wrap items-center
          justify-between gap-4
          rounded-[26px]
          bg-[#07152E]
          px-6 py-5 text-white
          shadow-[0_18px_50px_rgba(7,21,46,0.16)]
        "
      >
        <div>
          <p className="text-[12px] font-black text-[#F7B548]">
            Masar Template Manager
          </p>

          <h1 className="mt-1 text-[28px] font-black">
            إدارة قوالب الكورسات
          </h1>

          <p className="mt-2 text-[11px] font-bold text-slate-300">
            عدد القوالب:{" "}
            {templates.length}
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
          disabled={isPending}
          className="
            flex h-11 items-center
            justify-center gap-2
            rounded-xl bg-[#F7B548]
            px-5 text-[13px]
            font-black text-[#07152E]
            transition
            hover:bg-[#FFC966]
            disabled:opacity-50
          "
        >
          <CirclePlus size={18} />
          إضافة قالب
        </button>
      </header>

      {isPending && (
        <div
          className="
            mt-4 flex items-center
            justify-center gap-2
            rounded-xl border
            border-amber-200
            bg-amber-50 px-4 py-3
            text-[12px] font-black
            text-amber-700
          "
        >
          <Loader2
            size={16}
            className="animate-spin"
          />
          جارٍ تنفيذ التعديل...
        </div>
      )}

      <div className="mt-6 grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        {sortedTemplates.map(
          (template) => (
            <article
              key={template.id}
              className="
                overflow-hidden
                rounded-[24px]
                border border-[#DCE3EB]
                bg-white
                shadow-[0_12px_34px_rgba(7,21,46,0.08)]
              "
            >
              <div
                className={`
                  border-b px-5 py-4

                  ${
                    template.is_default
                      ? "border-[#F7B548] bg-[#FFF7E3]"
                      : "border-[#E3E7ED] bg-[#F8FAFC]"
                  }
                `}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-[17px] font-black text-[#07152E]">
                        {template.name}
                      </h2>

                      {template.is_default && (
                        <span
                          className="
                            flex items-center gap-1
                            rounded-full
                            bg-[#F7B548]
                            px-2.5 py-1
                            text-[9px] font-black
                            text-[#07152E]
                          "
                        >
                          <Crown size={11} />
                          افتراضي
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-[10px] font-bold text-slate-500">
                      {
                        templateTypeLabels[
                          template.template_type
                        ]
                      }
                    </p>
                  </div>

                  <span
                    className="
                      rounded-full bg-[#07152E]
                      px-3 py-1
                      text-[10px] font-black
                      text-[#F7B548]
                    "
                  >
                    V{template.version}
                  </span>
                </div>
              </div>

              <div className="space-y-4 p-5">
                <p className="min-h-[42px] text-[11px] font-medium leading-5 text-slate-500">
                  {template.description ??
                    "لا يوجد وصف للقالب."}
                </p>

                <div
                  className="
                    rounded-xl border
                    border-[#E3E7ED]
                    bg-[#F8FAFC]
                    px-4 py-3
                  "
                >
                  <InfoRow
                    label="الرابط"
                    value={template.slug}
                  />

                  <InfoRow
                    label="الحالة"
                    value={
                      template.is_active
                        ? "نشط"
                        : "غير نشط"
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      openEditForm(
                        template
                      )
                    }
                    disabled={isPending}
                    className="
                      flex h-10 items-center
                      justify-center gap-2
                      rounded-xl border
                      border-[#DCE3EB]
                      bg-white text-[11px]
                      font-black text-[#07152E]
                      transition
                      hover:border-[#F7B548]
                    "
                  >
                    <Pencil size={14} />
                    تعديل
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleSetDefault(
                        template
                      )
                    }
                    disabled={
                      isPending ||
                      template.is_default
                    }
                    className="
                      flex h-10 items-center
                      justify-center gap-2
                      rounded-xl border
                      border-[#F7B548]
                      bg-[#FFF7E3]
                      text-[11px] font-black
                      text-[#B87508]
                      transition
                      hover:bg-[#F7B548]
                      hover:text-[#07152E]
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                    "
                  >
                    <Crown size={14} />
                    اعتماد افتراضي
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleToggleActive(
                        template
                      )
                    }
                    disabled={isPending}
                    className="
                      flex h-10 items-center
                      justify-center gap-2
                      rounded-xl border
                      border-[#DCE3EB]
                      bg-white text-[11px]
                      font-black text-[#07152E]
                      transition
                      hover:border-[#F7B548]
                    "
                  >
                    <Check size={14} />

                    {template.is_active
                      ? "تعطيل"
                      : "تفعيل"}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleDelete(
                        template
                      )
                    }
                    disabled={
                      isPending ||
                      template.is_default
                    }
                    className="
                      flex h-10 items-center
                      justify-center gap-2
                      rounded-xl border
                      border-red-200
                      bg-red-50 text-[11px]
                      font-black text-red-600
                      transition
                      hover:bg-red-600
                      hover:text-white
                      disabled:cursor-not-allowed
                      disabled:opacity-40
                    "
                  >
                    <Trash2 size={14} />
                    حذف
                  </button>
                </div>
              </div>
            </article>
          )
        )}
      </div>

      {sortedTemplates.length === 0 && (
        <div
          className="
            mt-6 flex min-h-[260px]
            flex-col items-center
            justify-center
            rounded-[24px]
            border border-dashed
            border-[#D6DEE8]
            bg-white px-6 text-center
          "
        >
          <p className="text-[15px] font-black text-[#07152E]">
            لا توجد قوالب
          </p>

          <p className="mt-2 text-[11px] font-bold text-slate-500">
            اضغطي على إضافة قالب لإنشاء أول قالب.
          </p>
        </div>
      )}

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
            aria-label="إغلاق"
          />

          <aside
            dir="rtl"
            className="
              fixed left-0 top-0
              z-[9998]
              h-screen w-full
              max-w-[420px]
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
                px-5 py-4 text-white
              "
            >
              <div>
                <p className="text-[11px] font-bold text-[#F7B548]">
                  Template Manager
                </p>

                <h2 className="mt-1 text-[18px] font-black">
                  {form.id
                    ? "تعديل القالب"
                    : "إضافة قالب جديد"}
                </h2>
              </div>

              <button
                type="button"
                onClick={resetForm}
                className="
                  flex h-9 w-9
                  items-center justify-center
                  rounded-full bg-white/10
                "
              >
                <X size={18} />
              </button>
            </header>

            <div className="space-y-5 p-5">
              <FieldLabel label="اسم القالب">
                <input
                  value={form.name}
                  onChange={(event) =>
                    handleNameChange(
                      event.target.value
                    )
                  }
                  className={inputClassName}
                  placeholder="Road Course Template"
                  autoFocus
                />
              </FieldLabel>

              <FieldLabel label="رابط القالب">
                <input
                  value={form.slug}
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        slug: createSlug(
                          event.target.value
                        ),
                      })
                    )
                  }
                  disabled={Boolean(
                    form.id
                  )}
                  className={inputClassName}
                  placeholder="road-template-v1"
                  dir="ltr"
                />
              </FieldLabel>

              <FieldLabel label="نوع القالب">
                <select
                  value={
                    form.templateType
                  }
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        templateType:
                          event.target
                            .value as TemplateType,
                      })
                    )
                  }
                  className={inputClassName}
                >
                  <option value="road">
                    هندسة الطرق
                  </option>

                  <option value="traffic">
                    الهندسة المرورية
                  </option>

                  <option value="general">
                    قالب عام
                  </option>
                </select>
              </FieldLabel>

              <FieldLabel label="وصف القالب">
                <textarea
                  value={
                    form.description
                  }
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        description:
                          event.target
                            .value,
                      })
                    )
                  }
                  rows={5}
                  className={`
                    ${inputClassName}
                    h-auto resize-none py-3
                  `}
                  placeholder="اكتبي وصفًا مختصرًا للقالب"
                />
              </FieldLabel>

              <button
                type="button"
                onClick={handleSave}
                disabled={isPending}
                className="
                  flex h-11 w-full
                  items-center justify-center
                  gap-2 rounded-xl
                  bg-[#F7B548]
                  px-5 text-[13px]
                  font-black text-[#07152E]
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

                حفظ القالب
              </button>
            </div>
          </aside>
        </>
      )}
    </section>
  );
}

const inputClassName = `
  mt-2 h-11 w-full
  rounded-xl border
  border-[#DCE3EB]
  bg-white px-4
  text-[13px] font-bold
  text-[#07152E]
  outline-none transition
  focus:border-[#F7B548]
  focus:ring-2
  focus:ring-[#F7B548]/15
  disabled:cursor-not-allowed
  disabled:bg-slate-100
  disabled:text-slate-400
`;

type FieldLabelProps = {
  label: string;
  children: React.ReactNode;
};

function FieldLabel({
  label,
  children,
}: FieldLabelProps) {
  return (
    <label className="block">
      <span className="text-[12px] font-black text-[#07152E]">
        {label}
      </span>

      {children}
    </label>
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
    <div className="flex items-center justify-between gap-4 py-1.5">
      <span className="text-[10px] font-bold text-slate-500">
        {label}
      </span>

      <span className="max-w-[65%] truncate text-[10px] font-black text-[#07152E]">
        {value}
      </span>
    </div>
  );
}