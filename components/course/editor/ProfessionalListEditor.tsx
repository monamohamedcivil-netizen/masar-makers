"use client";

import {
  Link2,
  Plus,
  Trash2,
} from "lucide-react";

import {
  createEmptyListItem,
} from "./ProfessionalPanelUtils";

import type {
  ProfessionalContentBlock,
  ProfessionalListBlock,
  ProfessionalListItem,
} from "./ProfessionalPanelTypes";

type ProfessionalListEditorProps = {
  block: ProfessionalListBlock;
  onChange: (block: ProfessionalContentBlock) => void;
};

export default function ProfessionalListEditor({
  block,
  onChange,
}: ProfessionalListEditorProps) {
  const addItem = () => {
    onChange({
      ...block,
      items: [...block.items, createEmptyListItem()],
    });
  };

  const updateItem = (
    itemId: string,
    patch: Partial<ProfessionalListItem>
  ) => {
    onChange({
      ...block,
      items: block.items.map((item) =>
        item.id === itemId
          ? { ...item, ...patch }
          : item
      ),
    });
  };

  const deleteItem = (itemId: string) => {
    const approved = window.confirm(
      "هل تريدين حذف هذا العنصر من القائمة؟"
    );

    if (!approved) return;

    onChange({
      ...block,
      items: block.items.filter(
        (item) => item.id !== itemId
      ),
    });
  };

  return (
    <section className="rounded-2xl border border-[#DCE3EB] bg-white p-4 sm:p-5">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="text-sm font-black text-[#07152E]">
            عناصر القائمة
          </h4>
          <p className="mt-1 text-xs font-bold text-slate-500">
            عدّلي العناصر الحالية أو أضيفي عناصر جديدة
          </p>
        </div>

        <button
          type="button"
          onClick={addItem}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#07152E] px-4 py-2.5 text-xs font-black text-white transition hover:bg-[#10294E]"
        >
          <Plus size={15} />
          إضافة عنصر
        </button>
      </div>

      <div className="space-y-4">
        {block.items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] px-4 py-9 text-center">
            <p className="text-sm font-black text-[#07152E]">
              لا توجد عناصر
            </p>
            <p className="mt-1 text-xs font-bold text-slate-500">
              اضغطي على زر إضافة عنصر
            </p>
          </div>
        ) : (
          block.items.map((item, index) => (
            <div
              key={item.id}
              className="rounded-2xl border border-[#DCE3EB] bg-[#F8FAFC] p-4"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <span className="rounded-full bg-[#FFF4D8] px-3 py-1 text-[11px] font-black text-[#B87508]">
                  العنصر {index + 1}
                </span>

                <button
                  type="button"
                  onClick={() => deleteItem(item.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-black text-red-600 transition hover:bg-red-100"
                >
                  <Trash2 size={14} />
                  حذف العنصر
                </button>
              </div>

              <div className="space-y-4">
                <EditorField label="عنوان العنصر">
                  <input
                    value={item.title}
                    onChange={(event) =>
                      updateItem(item.id, {
                        title: event.target.value,
                      })
                    }
                    placeholder="مثال: تحميل ملفات المشروع"
                    className={inputClassName}
                  />
                </EditorField>

                <EditorField label="الوصف" optional>
                  <textarea
                    value={item.description}
                    onChange={(event) =>
                      updateItem(item.id, {
                        description: event.target.value,
                      })
                    }
                    placeholder="اكتبي وصفًا مختصرًا للعنصر"
                    rows={3}
                    className={`${inputClassName} resize-y`}
                  />
                </EditorField>

                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#DCE3EB] bg-white px-4 py-3">
                  <input
                    type="checkbox"
                    checked={item.hasButton}
                    onChange={(event) => {
                      const checked = event.target.checked;
                      updateItem(item.id, {
                        hasButton: checked,
                        ...(checked
                          ? {}
                          : {
                              buttonText: "شاهد الآن",
                              buttonLink: "",
                              buttonMode: "link_and_whatsapp",
                            }),
                      });
                    }}
                    className="h-4 w-4 accent-[#07152E]"
                  />

                  <span className="text-xs font-black text-[#07152E]">
                    يحتوي هذا العنصر على زر
                  </span>
                </label>

                {item.hasButton && (
                  <div className="grid gap-4 rounded-xl border border-[#F7B548]/40 bg-[#FFF8E8] p-4 md:grid-cols-2">
                    <EditorField label="اسم الزر">
                      <input
                        value={item.buttonText}
                        onChange={(event) =>
                          updateItem(item.id, {
                            buttonText: event.target.value,
                          })
                        }
                        placeholder="مثال: ابدأ الآن"
                        className={inputClassName}
                      />
                    </EditorField>

                    <EditorField label="نوع الإجراء">
                      <select
                        value={item.buttonMode}
                        onChange={(event) =>
                          updateItem(item.id, {
                            buttonMode: event.target.value as ProfessionalListItem["buttonMode"],
                          })
                        }
                        className={inputClassName}
                      >
                        <option value="whatsapp">واتساب فقط</option>
                        <option value="link">فتح الرابط فقط</option>
                        <option value="link_and_whatsapp">فتح الرابط + واتساب</option>
                      </select>
                    </EditorField>

                    {item.buttonMode !== "whatsapp" && (
                    <EditorField label="رابط الزر">
                      <div className="relative">
                        <Link2
                          size={16}
                          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <input
                          value={item.buttonLink}
                          onChange={(event) =>
                            updateItem(item.id, {
                              buttonLink: event.target.value,
                            })
                          }
                          placeholder="https://..."
                          className={`${inputClassName} pr-10`}
                        />
                      </div>
                    </EditorField>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function EditorField({
  label,
  optional = false,
  children,
}: {
  label: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black text-[#07152E]">
        {label}
        {optional && (
          <span className="mr-1 font-bold text-slate-400">
            (اختياري)
          </span>
        )}
      </span>
      {children}
    </label>
  );
}

const inputClassName =
  "w-full rounded-xl border border-[#D8E0E9] bg-white px-4 py-3 text-sm font-bold text-[#07152E] outline-none transition placeholder:text-slate-400 focus:border-[#F7B548] focus:ring-4 focus:ring-[#F7B548]/15";
