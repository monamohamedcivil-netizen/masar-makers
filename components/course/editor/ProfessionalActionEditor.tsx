"use client";

import { Link2 } from "lucide-react";

import type {
  ProfessionalActionConfig,
} from "./ProfessionalPanelTypes";

type ProfessionalActionEditorProps = {
  title: string;
  value: ProfessionalActionConfig;
  onChange: (value: ProfessionalActionConfig) => void;
};

export default function ProfessionalActionEditor({
  title,
  value,
  onChange,
}: ProfessionalActionEditorProps) {
  return (
    <section className="rounded-2xl border border-[#DCE3EB] bg-[#F8FAFC] p-4">
      <label className="flex cursor-pointer items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black text-[#07152E]">
            {title}
          </p>
          <p className="mt-1 text-[11px] font-bold text-slate-500">
            فعّلي الزر أو اتركيه مخفيًا.
          </p>
        </div>

        <input
          type="checkbox"
          checked={value.enabled}
          onChange={(event) =>
            onChange({
              ...value,
              enabled: event.target.checked,
            })
          }
          className="h-5 w-5 accent-[#07152E]"
        />
      </label>

      {value.enabled && (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <EditorField label="نص الزر">
            <input
              value={value.label}
              onChange={(event) =>
                onChange({
                  ...value,
                  label: event.target.value,
                })
              }
              placeholder="مثال: ابدأ الرحلة"
              className={inputClassName}
            />
          </EditorField>

          <EditorField label="نوع الإجراء">
            <select
              value={value.mode}
              onChange={(event) =>
                onChange({
                  ...value,
                  mode: event.target
                    .value as ProfessionalActionConfig["mode"],
                })
              }
              className={inputClassName}
            >
              <option value="enrollment">
                طلب الاشتراك في الرحلة
              </option>
              <option value="whatsapp">
                واتساب فقط
              </option>
              <option value="link">
                فتح الرابط فقط
              </option>
              <option value="link_and_whatsapp">
                فتح الرابط + واتساب
              </option>
            </select>
          </EditorField>

          {value.mode === "enrollment" ? (
            <>
              <EditorField label="كود الكورس (Slug)">
                <input
                  value={value.courseSlug}
                  onChange={(event) =>
                    onChange({
                      ...value,
                      courseSlug: event.target.value,
                    })
                  }
                  placeholder="اتركيه فارغًا لاستخدام الكورس الحالي"
                  className={inputClassName}
                />
              </EditorField>

              <EditorField label="نوع الرحلة">
                <input
                  value={value.journeyType}
                  onChange={(event) =>
                    onChange({
                      ...value,
                      journeyType: event.target.value,
                    })
                  }
                  placeholder="fundamental / advanced / integrated"
                  className={inputClassName}
                />
              </EditorField>
            </>
          ) : (
            value.mode !== "whatsapp" && (
              <div className="md:col-span-2">
                <EditorField label="رابط الزر">
                  <div className="relative">
                    <Link2
                      size={16}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      value={value.link}
                      onChange={(event) =>
                        onChange({
                          ...value,
                          link: event.target.value,
                        })
                      }
                      placeholder="https://..."
                      className={`${inputClassName} pr-10`}
                    />
                  </div>
                </EditorField>
              </div>
            )
          )}
        </div>
      )}
    </section>
  );
}

function EditorField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black text-[#07152E]">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputClassName =
  "w-full rounded-xl border border-[#D8E0E9] bg-white px-4 py-3 text-sm font-bold text-[#07152E] outline-none transition placeholder:text-slate-400 focus:border-[#F7B548] focus:ring-4 focus:ring-[#F7B548]/15";
