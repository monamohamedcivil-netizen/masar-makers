"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import {
  deleteExpense,
  saveExpense,
} from "@/lib/actions/admin/finance";
import type { FinanceExpense } from "@/lib/finance/shared";

import EditableCell, { type CellType } from "./EditableCell";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);

const CURRENCIES = [
  { value: "EGP", label: "جنيه EGP" },
  { value: "SAR", label: "ريال SAR" },
  { value: "USD", label: "دولار $" },
];

const COLS: Array<{
  key: keyof FinanceExpense;
  label: string;
  type: CellType;
  width: number;
  options?: Array<{ value: string; label: string }>;
  readOnly?: boolean;
}> = [
  { key: "payee", label: "مدفوع إلى", type: "text", width: 280 },
  { key: "start_month", label: "من", type: "date", width: 130 },
  { key: "end_month", label: "إلى", type: "date", width: 130 },
  { key: "months_count", label: "عدد الأشهر", type: "number", width: 80 },
  { key: "currency", label: "العملة", type: "select", width: 110, options: CURRENCIES },
  { key: "monthly_amount", label: "المصروف الشهري", type: "number", width: 110 },
  { key: "total_amount", label: "الإجمالي", type: "number", width: 100, readOnly: true },
  { key: "total_egp", label: "الإجمالي (جنيه)", type: "number", width: 110, readOnly: true },
  { key: "notes", label: "ملاحظات", type: "text", width: 220 },
];

export default function ExpensesManager({
  initial,
}: {
  initial: FinanceExpense[];
}) {
  const [rows, setRows] = useState(initial);
  const [message, setMessage] = useState("");

  const total = useMemo(
    () => rows.reduce((s, r) => s + r.total_egp, 0),
    [rows],
  );

  const year = new Date().getFullYear().toString();
  const yearTotal = useMemo(
    () =>
      rows
        .filter((r) => r.start_month.startsWith(year))
        .reduce((s, r) => s + r.total_egp, 0),
    [rows, year],
  );

  const flash = (m: string) => {
    setMessage(m);
    setTimeout(() => setMessage(""), 4000);
  };

  const save = async (
    id: string,
    key: string,
    value: string | number | boolean | null,
  ) => {
    // "إلى" اختياري، أما غيره فنمنع تفريغه
    const result = await saveExpense(id, { [key]: value });
    if (!result.success || !result.data) {
      flash(result.message || "تعذر الحفظ");
      return false;
    }
    setRows((prev) => prev.map((r) => (r.id === id ? result.data! : r)));
    return true;
  };

  const add = async () => {
    const result = await saveExpense(null, {
      payee: "مصروف جديد",
      months_count: 1,
      monthly_amount: 0,
      currency: "EGP",
    });
    if (!result.success || !result.data) return flash(result.message || "تعذر الإضافة");
    setRows((prev) => [result.data!, ...prev]);
  };

  const remove = async (id: string) => {
    if (!window.confirm("حذف هذا المصروف نهائيًا؟")) return;
    const result = await deleteExpense(id);
    if (!result.success) return flash(result.message || "تعذر الحذف");
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <div className="rounded-2xl border border-[#F7B548] bg-[#07152E] p-4 text-white">
          <p className="text-xs font-bold text-[#F7B548]">إجمالي المصروفات (جنيه)</p>
          <p className="mt-1.5 text-2xl font-black">{fmt(total)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-bold text-slate-500">مصروفات {year}</p>
          <p className="mt-1.5 text-2xl font-black text-[#07152E]">{fmt(yearTotal)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-bold text-slate-500">عدد البنود</p>
          <p className="mt-1.5 text-2xl font-black text-[#07152E]">{rows.length}</p>
        </div>
      </div>

      {message ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-2 text-xs font-semibold text-red-700">
          {message}
        </p>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 p-3">
          <p className="text-sm font-black text-[#07152E]">
            جدول المصروفات — اضغط على أي خلية لتعديلها (الإجمالي يُحسب تلقائيًا)
          </p>
          <button
            type="button"
            onClick={add}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#07152E] px-3 py-2 text-xs font-bold text-[#F7B548]"
          >
            <Plus className="h-4 w-4" />
            إضافة مصروف
          </button>
        </div>

        <div className="overflow-auto">
          <table className="w-max min-w-full text-right">
            <thead className="bg-slate-50">
              <tr className="border-b border-slate-200">
                {COLS.map((c) => (
                  <th key={c.key} className="whitespace-nowrap px-2 py-3 text-[11px] font-black text-slate-500">
                    {c.label}
                  </th>
                ))}
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={COLS.length + 1} className="p-10 text-center text-sm text-slate-400">
                    لا توجد مصروفات بعد. يمكنك استيرادها من ملف الإكسل في صفحة المدفوعات.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50/60">
                    {COLS.map((c) => (
                      <td key={c.key} className="px-1 py-1">
                        {c.readOnly ? (
                          <span className="block px-1.5 text-xs font-bold text-[#07152E]">
                            {fmt(Number(r[c.key] ?? 0))}
                          </span>
                        ) : (
                          <EditableCell
                            value={r[c.key] as string | number | null}
                            type={c.type}
                            options={c.options}
                            width={c.width}
                            onSave={(v) => save(r.id, c.key, v)}
                          />
                        )}
                      </td>
                    ))}
                    <td className="px-2">
                      <button type="button" onClick={() => remove(r.id)} className="text-slate-300 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
