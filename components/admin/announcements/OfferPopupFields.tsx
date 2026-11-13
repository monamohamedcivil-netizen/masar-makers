"use client";

import ImageUploadField from "@/components/admin/catalog/ImageUploadField";
import type { PageOption } from "@/lib/links/destinations";
import type { OfferPopupConfig } from "@/lib/offers/types";

import DestinationPicker from "./DestinationPicker";

const INPUT =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-[#07152E] outline-none focus:border-[#F7B548]";

/* قسم «شاشة العروض المنبثقة» في نموذج الإعلان: تشغيل، صورة (تتحول WebP تلقائيًا)، وزر الاستفادة بوجهته. */
export default function OfferPopupFields({
  value,
  onChange,
  pages,
}: {
  value: OfferPopupConfig;
  onChange: (next: OfferPopupConfig) => void;
  pages: PageOption[];
}) {
  return (
    <div className="md:col-span-2 space-y-4 rounded-2xl border border-[#F7B548]/40 bg-[#FFF8E6]/60 p-4">
      <label className="flex cursor-pointer items-center gap-3 text-sm font-black text-[#07152E]">
        <input
          type="checkbox"
          checked={value.enabled}
          onChange={(event) => onChange({ ...value, enabled: event.target.checked })}
          className="h-4 w-4 cursor-pointer"
        />
        🎁 إظهار هذا الإعلان في شاشة العروض المنبثقة (وعلبة «جميع العروض»)
      </label>

      {value.enabled ? (
        <>
          <ImageUploadField
            label="صورة العرض (تتحول إلى WebP تلقائيًا)"
            value={value.imageUrl}
            onChange={(url) => onChange({ ...value, imageUrl: url })}
            folder="offers"
          />

          {value.imageUrl ? (
            <img
              src={value.imageUrl}
              alt="معاينة صورة العرض"
              className="max-h-48 rounded-xl border border-slate-200 object-contain"
            />
          ) : (
            <p className="text-xs font-bold text-amber-700">
              بدون صورة لن يظهر العرض في الشاشة المنبثقة.
            </p>
          )}

          <label className="flex cursor-pointer items-center gap-3 text-sm font-black text-[#07152E]">
            <input
              type="checkbox"
              checked={value.buttonEnabled}
              onChange={(event) => onChange({ ...value, buttonEnabled: event.target.checked })}
              className="h-4 w-4 cursor-pointer"
            />
            إضافة زر «استفد بالعرض» تحت الصورة
          </label>

          {value.buttonEnabled ? (
            <>
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  value={value.buttonText}
                  onChange={(event) => onChange({ ...value, buttonText: event.target.value })}
                  placeholder="نص الزر بالعربية"
                  className={INPUT}
                />
                <input
                  value={value.buttonTextEn}
                  onChange={(event) => onChange({ ...value, buttonTextEn: event.target.value })}
                  dir="ltr"
                  placeholder="Button text (English)"
                  className={`${INPUT} text-left`}
                />
              </div>
              <DestinationPicker
                value={value.link}
                onChange={(link) => onChange({ ...value, link })}
                pages={pages}
              />
            </>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
