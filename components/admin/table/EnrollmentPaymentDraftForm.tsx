"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";

import { saveEnrollmentPaymentDraft } from "@/lib/actions/admin/finance";
import { PAYMENT_STATUS_LABELS } from "@/lib/finance/shared";

interface EnrollmentPaymentDraftFormProps {
  enrollmentId: string;
  initialDraft: Record<string, unknown> | null;
  onSaved?: () => void;
  /** Integrated journey in a two-stage course: Fundamentals row + Advanced row. */
  twoPrices?: boolean;
  currency?: string;
  /** «السعر الأصلي» from the course prices, per currency (filled in when empty; editable). */
  suggestedListPrice?: Record<string, number>;
  suggestedListPriceAdvanced?: Record<string, number>;
}

const text = (v: unknown) =>
  v === null || v === undefined ? "" : String(v);

const inputClass =
  "h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs text-[#07152E] outline-none focus:border-[#F7B548]";

/**
 * بيانات الدفع لطلب الاشتراك (نفس أعمدة جدول المدفوعات):
 * تُملأ مرة واحدة قبل القبول، وعند القبول تنتقل كما هي إلى المدفوعات والتقارير.
 */
export default function EnrollmentPaymentDraftForm({
  enrollmentId,
  initialDraft,
  onSaved,
  twoPrices = false,
  currency = "EGP",
  suggestedListPrice = {},
  suggestedListPriceAdvanced = {},
}: EnrollmentPaymentDraftFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const initial = initialDraft ?? {};

  const [form, setForm] = useState({
    edition_code: text(initial.edition_code),
    delivery_type: text(initial.delivery_type),
    list_price: text(initial.list_price) || text(suggestedListPrice[currency]),
    amount_paid: text(initial.amount_paid),
    list_price_advanced:
      text(initial.list_price_advanced) || text(suggestedListPriceAdvanced[currency]),
    amount_paid_advanced: text(initial.amount_paid_advanced),
    payment_status: text(initial.payment_status),
    paid_at: text(initial.paid_at),
    notes: text(initial.notes),
    needs_followup: Boolean(initial.needs_followup),
    followup_reason: text(initial.followup_reason),
    followup_date: text(initial.followup_date),
  });

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setSaved(false);
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const save = () => {
    setError("");

    if (form.needs_followup && !(form.followup_reason.trim() && form.followup_date)) {
      setError("اكتب سبب المتابعة وحدّد موعدها.");
      return;
    }

    startTransition(async () => {
      const result = await saveEnrollmentPaymentDraft(enrollmentId, form);
      if (!result.success) {
        setError(result.message || "تعذر الحفظ");
        return;
      }
      setSaved(true);
      onSaved?.();
      router.refresh();
    });
  };

  return (
    <div className="rounded-xl border border-[#F7B548]/40 bg-amber-50/40 p-3">
      <p className="mb-2 text-xs font-black text-[#07152E]">
        بيانات الدفع — تنتقل تلقائيًا إلى جدول المدفوعات والتقارير عند قبول الطلب
        {twoPrices ? " (صفان: الأساسيات + المتقدم)" : ""}
      </p>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <Field label="الإصدار">
          <input
            value={form.edition_code}
            onChange={(e) => set("edition_code", e.target.value)}
            placeholder={twoPrices ? "تلقائي: C3D-F و C3D-A" : "تلقائي"}
            className={inputClass}
          />
        </Field>

        <Field label="النوع">
          <select
            value={form.delivery_type}
            onChange={(e) => set("delivery_type", e.target.value)}
            className={inputClass}
          >
            <option value="">—</option>
            <option value="recorded">مسجل</option>
            <option value="interactive">تفاعلي</option>
          </select>
        </Field>

        <Field label={twoPrices ? "السعر الأصلي — الأساسيات" : "السعر الأصلي"}>
          <input
            type="number"
            min={0}
            inputMode="decimal"
            value={form.list_price}
            onChange={(e) => set("list_price", e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label={twoPrices ? "المدفوع — الأساسيات" : "المدفوع"}>
          <input
            type="number"
            min={0}
            inputMode="decimal"
            value={form.amount_paid}
            onChange={(e) => set("amount_paid", e.target.value)}
            placeholder="= قيمة الاشتراك"
            className={inputClass}
          />
        </Field>

        {twoPrices ? (
          <>
            <Field label="السعر الأصلي — المتقدم">
              <input
                type="number"
                min={0}
                inputMode="decimal"
                value={form.list_price_advanced}
                onChange={(e) => set("list_price_advanced", e.target.value)}
                className={inputClass}
              />
            </Field>

            <Field label="المدفوع — المتقدم">
              <input
                type="number"
                min={0}
                inputMode="decimal"
                value={form.amount_paid_advanced}
                onChange={(e) => set("amount_paid_advanced", e.target.value)}
                placeholder="= سعر المتقدم"
                className={inputClass}
              />
            </Field>
          </>
        ) : null}

        <Field label="حالة الدفع">
          <select
            value={form.payment_status}
            onChange={(e) => set("payment_status", e.target.value)}
            className={inputClass}
          >
            <option value="">تلقائي</option>
            {(Object.keys(PAYMENT_STATUS_LABELS) as Array<keyof typeof PAYMENT_STATUS_LABELS>).map(
              (key) => (
                <option key={key} value={key}>
                  {PAYMENT_STATUS_LABELS[key]}
                </option>
              ),
            )}
          </select>
        </Field>

        <Field label="تاريخ الدفع">
          <input
            type="date"
            value={form.paid_at}
            onChange={(e) => set("paid_at", e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="ملاحظات">
          <input
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>

      <div className="mt-2 grid gap-2 sm:grid-cols-[auto_1fr_180px_auto] sm:items-end">
        <label className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-[#07152E]">
          <input
            type="checkbox"
            checked={form.needs_followup}
            onChange={(e) => set("needs_followup", e.target.checked)}
            className="h-4 w-4 accent-[#F7B548]"
          />
          يحتاج متابعة
        </label>

        <Field label="سبب المتابعة">
          <input
            value={form.followup_reason}
            onChange={(e) => set("followup_reason", e.target.value)}
            disabled={!form.needs_followup}
            placeholder={form.needs_followup ? "مثال: يدفع القسط الثاني" : "—"}
            className={`${inputClass} disabled:bg-slate-50 disabled:text-slate-400`}
          />
        </Field>

        <Field label="موعد المتابعة">
          <input
            type="date"
            value={form.followup_date}
            onChange={(e) => set("followup_date", e.target.value)}
            disabled={!form.needs_followup}
            className={`${inputClass} disabled:bg-slate-50 disabled:text-slate-400`}
          />
        </Field>

        <button
          type="button"
          onClick={save}
          disabled={isPending}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#07152E] px-4 text-xs font-bold text-[#F7B548] disabled:opacity-60"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          {saved ? "تم الحفظ" : "حفظ بيانات الدفع"}
        </button>
      </div>

      {error ? (
        <p className="mt-2 text-xs font-semibold text-red-600">{error}</p>
      ) : null}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-bold text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}
