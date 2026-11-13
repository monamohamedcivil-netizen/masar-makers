"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Plus } from "lucide-react";

import {
  createPriceOffer,
  saveOfferMeta,
  savePriceCell,
  setActiveOffer,
  type PriceCellInput,
} from "@/lib/actions/admin/price-table";
import {
  CURRENCIES,
  CURRENCY_LABEL,
  discountPercent,
  findOverlaps,
  rowKey,
  trackOf,
  type CurrencyCode,
  type OfferInfo,
  type OfferRow,
  type PriceKind,
  type PriceTableData,
  type PriceTrack,
} from "@/lib/pricing/offer-table";

type Props = {
  data: PriceTableData;
  kind: PriceKind;
  /** Shows the courses / one-day switch (used in the dedicated page). */
  kindSwitch?: boolean;
  /** Set when the table lives in a path tab; null/undefined shows the path filter. */
  fixedTrack?: PriceTrack | null;
};

const TRACK_LABEL: Record<string, string> = {
  all: "كل المسارات",
  "Road Design": "تصميم الطرق",
  "Traffic Engineering": "هندسة المرور",
  other: "أخرى",
};

const fmtDate = (v: string | null) =>
  v
    ? new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeStyle: "short" }).format(new Date(v))
    : "بدون تاريخ";

function toLocalInput(v: string | null) {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

const field =
  "h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs font-bold text-[#07152E] outline-none focus:border-[#F7B548]";

function NumCell({
  value,
  suffix,
  disabled,
  onSave,
}: {
  value: number | null;
  suffix?: string;
  disabled?: boolean;
  onSave: (v: number) => void;
}) {
  const shown = value == null ? "" : String(value);
  return (
    <div className="flex items-center gap-1">
      <input
        key={shown}
        type="number"
        min={0}
        step="any"
        inputMode="decimal"
        defaultValue={shown}
        disabled={disabled}
        placeholder="—"
        onBlur={(e) => {
          const raw = e.currentTarget.value.trim();
          if (raw === "" || raw === shown) return;
          onSave(Number(raw));
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        className={`${field} w-24 text-center tabular-nums disabled:bg-slate-50`}
      />
      {suffix ? <span className="text-[11px] font-bold text-slate-400">{suffix}</span> : null}
    </div>
  );
}

export default function PriceTable({ data, kind: initialKind, kindSwitch = false, fixedTrack = null }: Props) {
  const [kind, setKind] = useState<PriceKind>(initialKind);
  const [offers, setOffers] = useState<OfferInfo[]>(data.offers);
  const [rows, setRows] = useState<OfferRow[]>(data.rows);
  const [activeId, setActiveId] = useState<string | null>(data.activeOfferId);
  const [viewId, setViewId] = useState<string | null>(data.activeOfferId ?? data.offers[0]?.id ?? null);
  const [currency, setCurrency] = useState<CurrencyCode>("EGP");
  const [track, setTrack] = useState<string>("all");
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);
  const [newName, setNewName] = useState("");
  const [copyPrices, setCopyPrices] = useState(true);
  const [busy, setBusy] = useState(false);

  const flash = (text: string, error = false) => {
    setMessage({ text, error });
    window.setTimeout(() => setMessage(null), error ? 6000 : 2500);
  };

  const view = offers.find((o) => o.id === viewId) ?? null;
  const active = offers.find((o) => o.id === activeId) ?? null;

  const rowMap = useMemo(() => {
    const map = new Map<string, OfferRow>();
    for (const r of rows) {
      if (r.offer_id === viewId && r.kind === kind) {
        map.set(rowKey(kind, r.course_id, r.variant_id, r.currency_code), r);
      }
    }
    return map;
  }, [rows, viewId, kind]);

  const overlaps = useMemo(
    () => findOverlaps(offers, new Set(rows.map((r) => r.offer_id))),
    [offers, rows],
  );

  const lines = useMemo(() => {
    const wanted = fixedTrack ?? (track === "all" ? null : (track as PriceTrack));
    const out: Array<{ courseId: string; variantId: string | null; course: string; type: string }> = [];
    for (const c of [...data.courses].sort((a, b) => a.sort_order - b.sort_order)) {
      if (wanted && trackOf(c.track) !== wanted) continue;
      const vars = c.has_variants
        ? data.variants.filter((v) => v.course_id === c.id).sort((a, b) => a.sort_order - b.sort_order)
        : [];
      if (kind === "course" && vars.length) {
        for (const v of vars) out.push({ courseId: c.id, variantId: v.id, course: c.title, type: v.title });
      } else {
        out.push({ courseId: c.id, variantId: null, course: c.title, type: kind === "oneday" ? "رحلة يوم واحد" : "كورس كامل" });
      }
    }
    return out;
  }, [data.courses, data.variants, kind, fixedTrack, track]);

  const trackOptions = useMemo(() => {
    const set = new Set(data.courses.map((c) => trackOf(c.track)));
    return ["all", ...set];
  }, [data.courses]);

  if (!data.ready) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-900">
        جدول الأسعار يحتاج تطبيق ملف الترحيل <span dir="ltr">20261113_price_offer_table.sql</span> في Supabase أولًا.
      </div>
    );
  }

  const upsertLocal = (saved: OfferRow) =>
    setRows((prev) => {
      const k = rowKey(saved.kind, saved.course_id, saved.variant_id, saved.currency_code);
      const rest = prev.filter(
        (r) => !(r.offer_id === saved.offer_id && rowKey(r.kind, r.course_id, r.variant_id, r.currency_code) === k),
      );
      return [...rest, saved];
    });

  const saveCell = async (
    line: { courseId: string; variantId: string | null },
    fieldName: PriceCellInput["field"],
    value: number | boolean,
  ) => {
    if (!viewId) return;
    const result = await savePriceCell({
      offerId: viewId,
      kind,
      courseId: line.courseId,
      variantId: line.variantId,
      currency,
      field: fieldName,
      value,
    });
    if (!result.success || !result.data) return flash(result.message || "تعذر الحفظ", true);
    upsertLocal({ ...result.data, updated_at: new Date().toISOString() });
    flash(viewId === activeId ? "تم الحفظ وتطبيقه في الشات والمنصة" : "تم الحفظ (العرض غير مفعّل حاليًا)");
  };

  const chooseActive = async (id: string) => {
    const next = id || null;
    const name = offers.find((o) => o.id === next)?.name;
    const ok = window.confirm(
      next
        ? `تفعيل «${name}»؟ ستتغير الأسعار في الشات والمنصة فورًا.`
        : "إيقاف أي عرض؟ ستعود الأسعار في الشات والمنصة للسعر الأصلي بدون خصم.",
    );
    if (!ok) return;
    setBusy(true);
    const result = await setActiveOffer(next);
    setBusy(false);
    if (!result.success) return flash(result.message || "تعذر التفعيل", true);
    setActiveId(next);
    flash("تم تفعيل العرض وتحديث الشات والمنصة");
  };

  const saveMeta = async (patch: Partial<Pick<OfferInfo, "name" | "name_en" | "starts_at" | "ends_at">>) => {
    if (!view) return;
    // The date inputs are in the browser's time zone: convert here so the server stores the right instant.
    const toIso = (v: string | null | undefined) => (v === undefined ? undefined : v ? new Date(v).toISOString() : null);
    const clean = { ...patch, starts_at: toIso(patch.starts_at), ends_at: toIso(patch.ends_at) };
    const result = await saveOfferMeta({ id: view.id, ...clean });
    if (!result.success) return flash(result.message || "تعذر الحفظ", true);
    setOffers((prev) =>
      prev.map((o) =>
        o.id === view.id
          ? {
              ...o,
              ...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
              ...(patch.name_en !== undefined ? { name_en: patch.name_en?.trim() || null } : {}),
              ...(clean.starts_at !== undefined ? { starts_at: clean.starts_at } : {}),
              ...(clean.ends_at !== undefined ? { ends_at: clean.ends_at } : {}),
            }
          : o,
      ),
    );
    flash("تم حفظ بيانات العرض");
  };

  const addOffer = async () => {
    setBusy(true);
    const result = await createPriceOffer({ name: newName, copyFromOfferId: copyPrices ? viewId : null });
    setBusy(false);
    if (!result.success || !result.data) return flash(result.message || "تعذر الإضافة", true);
    const { offer, rows: copied } = result.data;
    setOffers((prev) => [...prev, offer]);
    setRows((prev) => [...prev, ...copied]);
    setViewId(offer.id);
    setNewName("");
    flash("تم إنشاء العرض");
  };

  const isViewActive = viewId !== null && viewId === activeId;
  const colCount = 12;

  return (
    <div dir="rtl" className="space-y-3">
      {/* العروض */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-[11px] font-black text-slate-500">العرض المعروض في الجدول (للتعديل)</span>
            <select value={viewId ?? ""} onChange={(e) => setViewId(e.target.value || null)} className={`${field} w-full`}>
              {offers.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                  {o.id === activeId ? " ✓ (مفعّل)" : ""}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-[11px] font-black text-slate-500">العرض النشط فعليًا (الشات والمنصة)</span>
            <select
              value={activeId ?? ""}
              disabled={busy}
              onChange={(e) => void chooseActive(e.target.value)}
              className={`${field} w-full border-[#F7B548] bg-[#FFFBF2]`}
            >
              <option value="">بدون عرض (السعر الأصلي)</option>
              {offers.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-[11px] font-bold text-slate-500">
              {active ? `من ${fmtDate(active.starts_at)} إلى ${fmtDate(active.ends_at)}` : "لا يوجد عرض مفعّل"}
            </span>
          </label>
        </div>

        {overlaps.length > 1 ? (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              يوجد أكثر من عرض بتواريخ متداخلة ({overlaps.map((o) => o.name).join("، ")}). يجب اختيار عرض واحد للتفعيل —
              المطبَّق الآن: {active ? `«${active.name}»` : "لا شيء"}.
            </p>
          </div>
        ) : null}

        {view ? (
          <div className="mt-3 grid gap-2 border-t border-slate-100 pt-3 md:grid-cols-2 xl:grid-cols-4">
            <label className="block">
              <span className="mb-1 block text-[11px] font-black text-slate-500">اسم العرض</span>
              <input
                key={view.id + view.name}
                defaultValue={view.name}
                onBlur={(e) => e.currentTarget.value.trim() !== view.name && void saveMeta({ name: e.currentTarget.value })}
                className={`${field} w-full`}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-black text-slate-500">Offer name (English)</span>
              <input
                key={view.id + (view.name_en ?? "")}
                dir="ltr"
                defaultValue={view.name_en ?? ""}
                onBlur={(e) => e.currentTarget.value.trim() !== (view.name_en ?? "") && void saveMeta({ name_en: e.currentTarget.value })}
                className={`${field} w-full`}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-black text-slate-500">بداية العرض</span>
              <input
                key={view.id + "s" + view.starts_at}
                type="datetime-local"
                defaultValue={toLocalInput(view.starts_at)}
                onBlur={(e) => e.currentTarget.value !== toLocalInput(view.starts_at) && void saveMeta({ starts_at: e.currentTarget.value || null })}
                className={`${field} w-full`}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-black text-slate-500">نهاية العرض</span>
              <input
                key={view.id + "e" + view.ends_at}
                type="datetime-local"
                defaultValue={toLocalInput(view.ends_at)}
                onBlur={(e) => e.currentTarget.value !== toLocalInput(view.ends_at) && void saveMeta({ ends_at: e.currentTarget.value || null })}
                className={`${field} w-full`}
              />
            </label>
          </div>
        ) : null}

        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="اسم عرض جديد"
            className={`${field} w-48`}
          />
          <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
            <input type="checkbox" checked={copyPrices} onChange={(e) => setCopyPrices(e.target.checked)} />
            نسخ أسعار العرض المعروض كبداية
          </label>
          <button
            type="button"
            disabled={busy || !newName.trim()}
            onClick={() => void addOffer()}
            className="inline-flex h-9 items-center gap-1 rounded-lg bg-[#07152E] px-3 text-xs font-black text-white disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" /> إضافة عرض
          </button>
          {message ? (
            <span className={`text-xs font-black ${message.error ? "text-red-600" : "text-emerald-600"}`}>{message.text}</span>
          ) : null}
        </div>
      </section>

      {kindSwitch ? (
        <div className="flex gap-1 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
          {(
            [
              ["course", "أسعار الكورسات"],
              ["oneday", "أسعار رحلات اليوم الواحد"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setKind(key)}
              className={`h-9 rounded-xl px-4 text-xs font-black ${
                kind === key ? "bg-[#F7B548] text-[#07152E]" : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      ) : null}

      {/* التابات والفلاتر */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
          {CURRENCIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCurrency(c)}
              className={`rounded-lg px-4 py-1.5 text-xs font-black ${
                currency === c ? "bg-[#07152E] text-white" : "text-slate-600 hover:bg-white"
              }`}
            >
              {CURRENCY_LABEL[c]}
            </button>
          ))}
        </div>
        {!fixedTrack ? (
          <select value={track} onChange={(e) => setTrack(e.target.value)} className={field}>
            {trackOptions.map((t) => (
              <option key={t} value={t}>
                {TRACK_LABEL[t] ?? t}
              </option>
            ))}
          </select>
        ) : null}
        <span className="text-[11px] font-bold text-slate-400">
          {currency} · أسعار مستقلة لكل عملة (بدون تحويل تلقائي)
        </span>
      </div>

      {view && !isViewActive ? (
        <p className="rounded-xl bg-slate-50 p-2.5 text-[11px] font-bold text-slate-600">
          هذا العرض غير مفعّل: تعديلاته تُحفظ لكن لا تظهر في الشات والمنصة إلا بعد اختياره في «العرض النشط فعليًا».
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[1100px] text-right">
          <thead className="bg-slate-50 text-[11px] font-black text-slate-500">
            <tr>
              <th className="px-2 py-2.5">الكورس</th>
              <th className="px-2 py-2.5">النوع</th>
              <th className="px-2 py-2.5">السعر الأصلي</th>
              <th className="px-2 py-2.5">نسبة الخصم</th>
              <th className="px-2 py-2.5">السعر بعد الخصم</th>
              <th className="px-2 py-2.5">اسم العرض</th>
              <th className="px-2 py-2.5">بداية العرض</th>
              <th className="px-2 py-2.5">نهاية العرض</th>
              <th className="px-2 py-2.5">العرض مفعّل</th>
              <th className="px-2 py-2.5">العملة مفعّلة</th>
              <th className="px-2 py-2.5">آخر تعديل</th>
            </tr>
          </thead>
          <tbody>
            {lines.length === 0 ? (
              <tr>
                <td colSpan={colCount} className="px-3 py-8 text-center text-xs font-bold text-slate-400">
                  لا توجد كورسات في هذا الفلتر.
                </td>
              </tr>
            ) : (
              lines.map((line) => {
                const row = rowMap.get(rowKey(kind, line.courseId, line.variantId, currency));
                return (
                  <tr key={`${line.courseId}-${line.variantId ?? "main"}`} className="border-t border-slate-100 text-xs">
                    <td className="px-2 py-1.5 font-black text-[#07152E]">{line.course}</td>
                    <td className="px-2 py-1.5 font-bold text-slate-600">{line.type}</td>
                    <td className="px-2 py-1.5">
                      <NumCell value={row?.original_price ?? null} onSave={(v) => void saveCell(line, "original_price", v)} />
                    </td>
                    <td className="px-2 py-1.5">
                      <NumCell
                        value={row ? discountPercent(row.original_price, row.offer_price) : null}
                        suffix="%"
                        disabled={!row}
                        onSave={(v) => void saveCell(line, "discount_percent", v)}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <NumCell value={row?.offer_price ?? null} onSave={(v) => void saveCell(line, "offer_price", v)} />
                    </td>
                    <td className="px-2 py-1.5 font-bold text-[#9A6711]">{row ? view?.name : "—"}</td>
                    <td className="px-2 py-1.5 text-[11px] text-slate-500">{row ? fmtDate(view?.starts_at ?? null) : "—"}</td>
                    <td className="px-2 py-1.5 text-[11px] text-slate-500">{row ? fmtDate(view?.ends_at ?? null) : "—"}</td>
                    <td className="px-2 py-1.5">
                      <input
                        type="checkbox"
                        checked={row?.offer_active ?? false}
                        disabled={!row}
                        onChange={(e) => void saveCell(line, "offer_active", e.target.checked)}
                        className="h-4 w-4 accent-[#F7B548]"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="checkbox"
                        checked={row?.currency_active ?? false}
                        disabled={!row}
                        onChange={(e) => void saveCell(line, "currency_active", e.target.checked)}
                        className="h-4 w-4 accent-[#F7B548]"
                      />
                    </td>
                    <td className="px-2 py-1.5 text-[11px] text-slate-400">{row?.updated_at ? fmtDate(row.updated_at) : "—"}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] font-bold text-slate-400">
        اكتبي السعر الأصلي ثم الخصم % أو السعر بعد الخصم (يحسب الآخر تلقائيًا). تغيير السعر الأصلي يبقي نسبة الخصم كما هي.
        سعر جديد لم يُسعَّر من قبل يظهر «—»: اكتبي سعره الأصلي لإنشائه. العملة الجديدة (الدولار) تبدأ غير مفعّلة في الشات.
      </p>
    </div>
  );
}
