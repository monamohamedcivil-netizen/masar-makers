"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";

import { saveEnrollmentPricing } from "@/lib/actions/admin/finance";

interface EnrollmentPricingFieldsProps {
  enrollmentId: string;
  editable: boolean;
  applicable: boolean;
  initialPrice: number | null;
  /** Integrated journey in a two-stage course: Fundamentals price + Advanced price. */
  twoPrices?: boolean;
  initialPriceAdvanced?: number | null;
  initialCurrency: string;
  initialOffer: string;
  offerNames: string[];
}

const CURRENCIES = [
  { value: "EGP", label: "جنيه" },
  { value: "SAR", label: "ريال" },
  { value: "USD", label: "دولار" },
];

/** خليّتان في صف طلب الاشتراك: قيمة الاشتراك + العرض. */
export default function EnrollmentPricingFields({
  enrollmentId,
  editable,
  applicable,
  initialPrice,
  twoPrices = false,
  initialPriceAdvanced = null,
  initialCurrency,
  initialOffer,
  offerNames,
}: EnrollmentPricingFieldsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [price, setPrice] = useState(
    initialPrice ? String(initialPrice) : "",
  );
  const [priceAdvanced, setPriceAdvanced] = useState(
    initialPriceAdvanced ? String(initialPriceAdvanced) : "",
  );
  const [currency, setCurrency] = useState(initialCurrency || "EGP");
  const [offer, setOffer] = useState(initialOffer);
  const [error, setError] = useState("");

  const dirty =
    price !== (initialPrice ? String(initialPrice) : "") ||
    priceAdvanced !== (initialPriceAdvanced ? String(initialPriceAdvanced) : "") ||
    currency !== (initialCurrency || "EGP") ||
    offer !== initialOffer;

  if (!applicable) {
    return (
      <>
        <td className="px-5 py-4 text-sm text-slate-400">—</td>
        <td className="px-5 py-4 text-sm text-slate-400">—</td>
      </>
    );
  }

  if (!editable) {
    const currencyLabel =
      CURRENCIES.find((c) => c.value === initialCurrency)?.label ?? "";
    return (
      <>
        <td className="px-5 py-4 text-sm font-bold text-[#07152E]">
          {twoPrices ? (
            <span className="block whitespace-nowrap leading-6">
              أساسيات: {initialPrice ? `${initialPrice} ${currencyLabel}` : "—"}
              <br />
              متقدم: {initialPriceAdvanced ? `${initialPriceAdvanced} ${currencyLabel}` : "—"}
            </span>
          ) : initialPrice ? (
            `${initialPrice} ${currencyLabel}`
          ) : (
            "—"
          )}
        </td>
        <td className="px-5 py-4 text-sm text-slate-600">
          {initialOffer || "—"}
        </td>
      </>
    );
  }

  const save = () => {
    setError("");
    startTransition(async () => {
      const result = await saveEnrollmentPricing(enrollmentId, {
        price: price.trim() ? Number(price) : null,
        priceAdvanced: twoPrices && priceAdvanced.trim() ? Number(priceAdvanced) : null,
        currency,
        offerLabel: offer,
      });
      if (!result.success) {
        setError(result.message || "تعذر الحفظ");
        return;
      }
      router.refresh();
    });
  };

  return (
    <>
      <td className="px-5 py-4">
        <div className="flex min-w-[170px] items-center gap-1.5">
          {twoPrices ? (
            <div className="grid gap-1">
              <input
                type="number"
                min={0}
                inputMode="decimal"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="الأساسيات"
                title="سعر رحلة الأساسيات"
                className="h-9 w-24 rounded-lg border border-slate-200 bg-white px-2 text-sm outline-none focus:border-[#F7B548]"
              />
              <input
                type="number"
                min={0}
                inputMode="decimal"
                value={priceAdvanced}
                onChange={(e) => setPriceAdvanced(e.target.value)}
                placeholder="المتقدم"
                title="سعر الرحلة المتقدمة"
                className="h-9 w-24 rounded-lg border border-slate-200 bg-white px-2 text-sm outline-none focus:border-[#F7B548]"
              />
            </div>
          ) : (
            <input
              type="number"
              min={0}
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="القيمة"
              className="h-9 w-24 rounded-lg border border-slate-200 bg-white px-2 text-sm outline-none focus:border-[#F7B548]"
            />
          )}
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 bg-white px-1.5 text-xs font-semibold outline-none focus:border-[#F7B548]"
          >
            {CURRENCIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        {error ? (
          <p className="mt-1 text-xs text-red-600">{error}</p>
        ) : null}
      </td>

      <td className="px-5 py-4">
        <div className="flex min-w-[190px] items-center gap-1.5">
          <input
            list={`offers-${enrollmentId}`}
            value={offer}
            onChange={(e) => setOffer(e.target.value)}
            placeholder="بدون عرض"
            className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm outline-none focus:border-[#F7B548]"
          />
          <datalist id={`offers-${enrollmentId}`}>
            {offerNames.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
          {dirty ? (
            <button
              type="button"
              onClick={save}
              disabled={isPending}
              title="حفظ السعر والعرض"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#07152E] text-[#F7B548] disabled:opacity-60"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
            </button>
          ) : null}
        </div>
      </td>
    </>
  );
}
