"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";

import { deleteService, saveService } from "@/lib/actions/admin/finance";
import {
  BILLING_PERIOD_LABELS,
  EXPENSE_CATEGORY_LABELS,
  type ExpenseCategory,
  type FinanceService,
} from "@/lib/finance/shared";

import EditableCell from "./EditableCell";

const CURRENCIES = [
  { value: "EGP", label: "جنيه EGP" },
  { value: "SAR", label: "ريال SAR" },
  { value: "USD", label: "دولار $" },
];
const CATEGORY_OPTIONS = (
  Object.keys(EXPENSE_CATEGORY_LABELS) as ExpenseCategory[]
).map((k) => ({ value: k, label: EXPENSE_CATEGORY_LABELS[k] }));
const PERIOD_OPTIONS = (
  Object.keys(BILLING_PERIOD_LABELS) as Array<keyof typeof BILLING_PERIOD_LABELS>
).map((k) => ({ value: k, label: BILLING_PERIOD_LABELS[k] }));

export default function ServicesManager({
  services,
}: {
  services: FinanceService[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState(services);
  const [message, setMessage] = useState("");

  useEffect(() => setRows(services), [services]);

  const flash = (m: string) => {
    setMessage(m);
    setTimeout(() => setMessage(""), 4000);
  };

  const save = async (
    id: string | null,
    patch: Record<string, unknown>,
  ) => {
    const result = await saveService(id, patch);
    if (!result.success) {
      flash(result.message || "تعذر الحفظ");
      return false;
    }
    router.refresh();
    return true;
  };

  const remove = async (s: FinanceService) => {
    if (
      !window.confirm(
        `حذف خدمة «${s.name}»؟ سيُحذف معها صرفها المرتبط من جدول المصروفات.`,
      )
    )
      return;
    const result = await deleteService(s.id);
    if (!result.success) return flash(result.message || "تعذر الحذف");
    router.refresh();
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 p-3">
        <div>
          <p className="text-sm font-black text-[#07152E]">
            خدمات المنصة ومواعيد التجديد
          </p>
          <p className="mt-1 text-[11px] leading-5 text-slate-500">
            اكتبي سعر الخدمة ودورتها واضغطي «مستمر» ليبدأ الصرف في جدول المصروفات
            تلقائيًا. غيّري السعر أو أوقفي الخدمة وسيتحدث الصرف. الخدمة الجديدة
            تُضاف لجدول المصروفات وحدها.
          </p>
        </div>
        <button
          type="button"
          onClick={() => save(null, { name: "خدمة جديدة", amount: null })}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#07152E] px-3 py-2 text-xs font-bold text-[#F7B548]"
        >
          <Plus className="h-4 w-4" />
          إضافة خدمة
        </button>
      </div>

      {message ? (
        <p className="m-3 rounded-lg border border-red-200 bg-red-50 p-2 text-xs font-semibold text-red-700">
          {message}
        </p>
      ) : null}

      <div className="overflow-auto">
        <table className="w-max min-w-full text-right">
          <thead className="bg-slate-50">
            <tr className="border-b border-slate-200 text-[11px] font-black text-slate-500">
              {[
                "الحالة",
                "الخدمة",
                "الفئة",
                "السعر",
                "العملة",
                "الدورة",
                "بداية الصرف",
                "التجديد القادم",
                "ملاحظة التجديد",
                "آخر دفعة",
                "ملاحظات",
              ].map((h) => (
                <th key={h} className="whitespace-nowrap px-2 py-3">
                  {h}
                </th>
              ))}
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50/60">
                <td className="px-2 py-1">
                  <button
                    type="button"
                    onClick={() => save(s.id, { is_running: !s.is_running })}
                    className={`rounded-full px-3 py-1 text-[11px] font-black ${
                      s.is_running
                        ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                        : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                    }`}
                  >
                    {s.is_running ? "● مستمر" : "■ متوقف"}
                  </button>
                </td>
                <td className="px-1 py-1">
                  <EditableCell value={s.name} width={160} onSave={(v) => save(s.id, { name: v })} />
                </td>
                <td className="px-1 py-1">
                  <EditableCell
                    value={s.category}
                    type="select"
                    options={CATEGORY_OPTIONS}
                    width={130}
                    onSave={(v) => save(s.id, { category: v })}
                  />
                </td>
                <td className="px-1 py-1">
                  <EditableCell
                    value={s.amount}
                    type="number"
                    width={80}
                    placeholder="السعر"
                    onSave={(v) => save(s.id, { amount: v })}
                  />
                </td>
                <td className="px-1 py-1">
                  <EditableCell
                    value={s.currency}
                    type="select"
                    options={CURRENCIES}
                    width={105}
                    onSave={(v) => save(s.id, { currency: v })}
                  />
                </td>
                <td className="px-1 py-1">
                  <EditableCell
                    value={s.billing_period}
                    type="select"
                    options={PERIOD_OPTIONS}
                    width={90}
                    onSave={(v) => save(s.id, { billing_period: v })}
                  />
                </td>
                <td className="px-1 py-1">
                  <EditableCell
                    value={s.started_on}
                    type="date"
                    width={130}
                    onSave={(v) => save(s.id, { started_on: v })}
                  />
                </td>
                <td className="px-1 py-1">
                  <EditableCell
                    value={s.next_renewal}
                    type="date"
                    width={130}
                    onSave={(v) => save(s.id, { next_renewal: v })}
                  />
                </td>
                <td className="px-1 py-1">
                  <EditableCell
                    value={s.next_renewal_note}
                    width={200}
                    onSave={(v) => save(s.id, { next_renewal_note: v })}
                  />
                </td>
                <td className="px-1 py-1">
                  <EditableCell
                    value={s.last_payment_note}
                    width={260}
                    onSave={(v) => save(s.id, { last_payment_note: v })}
                  />
                </td>
                <td className="px-1 py-1">
                  <EditableCell
                    value={s.notes}
                    width={260}
                    onSave={(v) => save(s.id, { notes: v })}
                  />
                </td>
                <td className="px-2">
                  <button type="button" onClick={() => remove(s)} className="text-slate-300 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
