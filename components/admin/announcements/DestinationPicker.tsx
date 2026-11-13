"use client";

import {
  DEFAULT_WHATSAPP_NUMBER,
  buildHref,
  type LinkConfig,
  type PageOption,
} from "@/lib/links/destinations";

const INPUT =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-[#07152E] outline-none focus:border-[#F7B548]";

const KIND_LABELS: Record<LinkConfig["kind"], string> = {
  whatsapp: "رسالة واتساب",
  page: "صفحة في المنصة",
  custom: "رابط مخصص",
};

/*
 * اختيار وجهة الزر من قائمة (بدل كتابة الرابط):
 *  - رسالة واتساب: الرقم ونص الرسالة فقط.
 *  - صفحة في المنصة: قائمة الصفحة، ثم قائمة التبويب داخلها.
 *  - رابط مخصص: للحالات الخاصة.
 */
export default function DestinationPicker({
  value,
  onChange,
  pages,
}: {
  value: LinkConfig;
  onChange: (next: LinkConfig) => void;
  pages: PageOption[];
}) {
  const selectedPage =
    value.kind === "page" ? pages.find((page) => page.value === value.page) : undefined;

  function changeKind(kind: LinkConfig["kind"]) {
    if (kind === value.kind) return;
    if (kind === "whatsapp") onChange({ kind, number: DEFAULT_WHATSAPP_NUMBER, text: "" });
    else if (kind === "page") onChange({ kind, page: pages[0]?.value ?? "/", tab: "" });
    else onChange({ kind, url: "" });
  }

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-3">
      <select
        value={value.kind}
        onChange={(event) => changeKind(event.target.value as LinkConfig["kind"])}
        className={INPUT}
      >
        {(Object.keys(KIND_LABELS) as Array<LinkConfig["kind"]>).map((kind) => (
          <option key={kind} value={kind}>
            {KIND_LABELS[kind]}
          </option>
        ))}
      </select>

      {value.kind === "whatsapp" ? (
        <div className="grid gap-3 md:grid-cols-[200px_1fr]">
          <input
            value={value.number}
            onChange={(event) => onChange({ ...value, number: event.target.value })}
            dir="ltr"
            placeholder={DEFAULT_WHATSAPP_NUMBER}
            className={`${INPUT} text-left`}
            aria-label="رقم واتساب"
          />
          <textarea
            value={value.text}
            onChange={(event) => onChange({ ...value, text: event.target.value })}
            rows={2}
            placeholder="نص الرسالة الجاهزة، مثال: مرحبًا، أريد الاستفادة من العرض"
            className={`${INPUT} h-auto min-h-[64px] py-2`}
            aria-label="نص رسالة واتساب"
          />
        </div>
      ) : null}

      {value.kind === "page" ? (
        <div className="grid gap-3 md:grid-cols-2">
          <select
            value={value.page}
            onChange={(event) => onChange({ kind: "page", page: event.target.value, tab: "" })}
            className={INPUT}
            aria-label="الصفحة"
          >
            {pages.map((page) => (
              <option key={page.value} value={page.value}>
                {page.label}
              </option>
            ))}
          </select>
          <select
            value={value.tab}
            onChange={(event) => onChange({ ...value, tab: event.target.value })}
            disabled={!selectedPage || selectedPage.tabs.length === 0}
            className={`${INPUT} disabled:opacity-50`}
            aria-label="التبويب داخل الصفحة"
          >
            <option value="">بداية الصفحة (بدون تبويب)</option>
            {(selectedPage?.tabs ?? []).map((tab) => (
              <option key={tab.value} value={tab.value}>
                {tab.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {value.kind === "custom" ? (
        <input
          value={value.url}
          onChange={(event) => onChange({ kind: "custom", url: event.target.value })}
          dir="ltr"
          placeholder="https://... أو /course/example"
          className={`${INPUT} text-left`}
        />
      ) : null}

      <p dir="ltr" className="truncate text-left text-[11px] font-semibold text-slate-400">
        {buildHref(value)}
      </p>
    </div>
  );
}
