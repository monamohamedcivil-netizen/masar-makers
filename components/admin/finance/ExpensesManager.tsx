"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";

import {
  deleteExpense,
  saveExpense,
  saveService,
} from "@/lib/actions/admin/finance";
import {
  BILLING_PERIOD_LABELS,
  EXPENSE_CATEGORY_LABELS,
  type ExpenseCategory,
  type FinanceExpense,
  type FinanceService,
} from "@/lib/finance/shared";

import { chargeDate } from "@/lib/finance/expense-calc";
import EditableCell from "./EditableCell";
import ServicesManager from "./ServicesManager";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);

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

type Tab = "all" | ExpenseCategory;

const ROW_TONE: Record<ExpenseCategory, string> = {
  ads: "bg-orange-50 hover:bg-orange-100/70 border-r-4 border-r-orange-400",
  platform: "bg-sky-50 hover:bg-sky-100/70 border-r-4 border-r-sky-400",
  other: "bg-emerald-50 hover:bg-emerald-100/70 border-r-4 border-r-emerald-400",
};

// «مدفوع إلى» stays visible while scrolling the table sideways (opaque background = row colour).
const STICKY_CELL =
  "sticky right-0 z-10 shadow-[-6px_0_8px_-6px_rgba(7,21,46,0.25)]";
const STICKY_BG: Record<ExpenseCategory, string> = {
  ads: "bg-orange-50",
  platform: "bg-sky-50",
  other: "bg-emerald-50",
};

const LEGEND_DOT: Record<ExpenseCategory, string> = {
  ads: "bg-orange-400",
  platform: "bg-sky-400",
  other: "bg-emerald-400",
};

type FilterKey =
  | "status"
  | "category"
  | "payee"
  | "period"
  | "amount"
  | "currency"
  | "from"
  | "to"
  | "count"
  | "total"
  | "egp"
  | "notes";

const FILTER_COLUMNS: Array<{
  key: FilterKey;
  label: string;
  options?: Array<{ value: string; label: string }>;
}> = [
  {
    key: "status",
    label: "الحالة",
    options: [
      { value: "running", label: "مستمر" },
      { value: "stopped", label: "متوقف" },
    ],
  },
  { key: "category", label: "الفئة", options: CATEGORY_OPTIONS },
  { key: "payee", label: "مدفوع إلى" },
  { key: "period", label: "الدورة", options: PERIOD_OPTIONS },
  { key: "amount", label: "المبلغ لكل دورة" },
  { key: "currency", label: "العملة", options: CURRENCIES },
  { key: "from", label: "من" },
  { key: "to", label: "إلى" },
  { key: "count", label: "عدد مرات الصرف" },
  { key: "total", label: "الإجمالي" },
  { key: "egp", label: "الإجمالي (جنيه)" },
  { key: "notes", label: "ملاحظات" },
];

function filterValue(r: FinanceExpense, key: FilterKey): string {
  switch (key) {
    case "status":
      return r.is_running ? "running" : "stopped";
    case "category":
      return r.category;
    case "payee":
      return r.payee ?? "";
    case "period":
      return r.billing_period;
    case "amount":
      return String(r.monthly_amount ?? "");
    case "currency":
      return r.currency;
    case "from":
      return r.start_month ?? "";
    case "to":
      return r.is_running ? "مستمر" : (r.end_month ?? "");
    case "count":
      return String(r.months_count ?? "");
    case "total":
      return `${fmt(r.total_amount)} ${r.currency}`;
    case "egp":
      return fmt(r.total_egp);
    case "notes":
      return r.notes ?? "";
  }
}

export default function ExpensesManager({
  initial,
  services,
  initialTab = "all",
}: {
  initial: FinanceExpense[];
  services: FinanceService[];
  initialTab?: Tab;
}) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [tab, setTab] = useState<Tab>(initialTab);
  const [filters, setFilters] = useState<Partial<Record<FilterKey, string>>>({});
  const [message, setMessage] = useState("");

  useEffect(() => setRows(initial), [initial]);

  const flash = (m: string) => {
    setMessage(m);
    setTimeout(() => setMessage(""), 4000);
  };

  const totals = useMemo(() => {
    const t: Record<Tab, { count: number; egp: number }> = {
      all: { count: 0, egp: 0 },
      ads: { count: 0, egp: 0 },
      platform: { count: 0, egp: 0 },
      other: { count: 0, egp: 0 },
    };
    for (const r of rows) {
      t.all.count += 1;
      t.all.egp += r.total_egp;
      t[r.category].count += 1;
      t[r.category].egp += r.total_egp;
    }
    return t;
  }, [rows]);

  const visible = rows.filter((r) => {
    if (tab !== "all" && r.category !== tab) return false;
    for (const col of FILTER_COLUMNS) {
      const f = (filters[col.key] ?? "").trim().toLowerCase();
      if (!f) continue;
      const v = filterValue(r, col.key).toLowerCase();
      if (col.options ? v !== f : !v.includes(f)) return false;
    }
    return true;
  });
  const activeFilters = Object.values(filters).filter((v) => v && v.trim()).length;

  const save = async (
    id: string,
    key: string,
    value: string | number | boolean | null,
  ) => {
    const result = await saveExpense(id, { [key]: value });
    if (!result.success) {
      flash(result.message || "تعذر الحفظ");
      return false;
    }
    router.refresh();
    return true;
  };

  // تعديل صف مرتبط بخدمة: يُكتب في جدول الخدمات فيتحدث الصرف تلقائيًا.
  const saveLinked = async (
    r: FinanceExpense,
    key: string,
    value: string | number | boolean | null,
  ) => {
    if (!r.service_id) return save(r.id, key, value);

    let patch: Record<string, unknown>;
    if (key === "months_count") {
      const n = Math.max(1, Math.floor(Number(value) || 1));
      patch = {
        is_running: false,
        stopped_on: chargeDate(r.start_month, n - 1, r.billing_period),
      };
    } else {
      const map: Record<string, string> = {
        payee: "name",
        monthly_amount: "amount",
        start_month: "started_on",
        billing_period: "billing_period",
        currency: "currency",
        category: "category",
      };
      patch = { [map[key] ?? key]: value };
    }

    const result = await saveService(r.service_id, patch);
    if (!result.success) {
      flash(result.message || "تعذر الحفظ");
      return false;
    }
    router.refresh();
    return true;
  };

  const toggle = async (r: FinanceExpense) => {
    const result = r.service_id
      ? await saveService(r.service_id, { is_running: !r.is_running })
      : await saveExpense(r.id, { is_running: !r.is_running });
    if (!result.success) return flash(result.message || "تعذر التغيير");
    router.refresh();
  };

  const add = async () => {
    const result = await saveExpense(null, {
      payee: "مصروف جديد",
      category: tab === "all" ? "other" : tab,
      monthly_amount: 0,
      currency: "EGP",
      billing_period: "monthly",
      months_count: 1,
    });
    if (!result.success) return flash(result.message || "تعذر الإضافة");
    router.refresh();
  };

  const remove = async (r: FinanceExpense) => {
    if (r.service_id) {
      return flash("احذفي الخدمة من جدول الخدمات أسفل الصفحة لحذف صرفها.");
    }
    if (!window.confirm("حذف هذا المصروف نهائيًا؟")) return;
    const result = await deleteExpense(r.id);
    if (!result.success) return flash(result.message || "تعذر الحذف");
    router.refresh();
  };

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: "all", label: "إجمالي المصروفات" },
    { key: "ads", label: EXPENSE_CATEGORY_LABELS.ads },
    { key: "platform", label: EXPENSE_CATEGORY_LABELS.platform },
    { key: "other", label: EXPENSE_CATEGORY_LABELS.other },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-2xl border p-4 text-right transition ${
              tab === t.key
                ? "border-[#F7B548] bg-[#07152E] text-white"
                : "border-slate-200 bg-white hover:border-[#F7B548]/60"
            }`}
          >
            <p
              className={`text-xs font-bold ${
                tab === t.key ? "text-[#F7B548]" : "text-slate-500"
              }`}
            >
              {t.label}
            </p>
            <p className="mt-1.5 text-2xl font-black">
              {fmt(totals[t.key].egp)}
              <span className="mr-1 text-xs font-bold opacity-60">جنيه</span>
            </p>
            <p className="mt-0.5 text-[11px] opacity-60">
              {totals[t.key].count} بند
            </p>
          </button>
        ))}
      </div>

      {message ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-2 text-xs font-semibold text-red-700">
          {message}
        </p>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 p-3">
          <p className="text-sm font-black text-[#07152E]">
            جدول المصروفات ({visible.length}) — المصروف «المستمر» يزيد تلقائيًا
            حسب دورته (يومي / شهري / سنوي) حتى تُوقفيه
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

        <div className="flex flex-wrap items-center gap-4 border-b border-slate-100 px-3 py-2 text-[11px] font-bold text-slate-600">
          {(Object.keys(EXPENSE_CATEGORY_LABELS) as ExpenseCategory[]).map((c) => (
            <span key={c} className="inline-flex items-center gap-1.5">
              <span className={`h-3 w-3 rounded-full ${LEGEND_DOT[c]}`} />
              {EXPENSE_CATEGORY_LABELS[c]}
            </span>
          ))}
          {activeFilters > 0 && (
            <button
              type="button"
              onClick={() => setFilters({})}
              className="mr-auto rounded-full bg-red-50 px-3 py-1 text-red-700 hover:bg-red-100"
            >
              مسح الفلاتر ({activeFilters})
            </button>
          )}
        </div>

        <div className="overflow-auto">
          <table className="w-max min-w-full text-right">
            <thead className="bg-slate-50">
              <tr className="border-b border-slate-200 text-[11px] font-black text-slate-500">
                {[
                  "الحالة",
                  "الفئة",
                  "مدفوع إلى",
                  "الدورة",
                  "المبلغ لكل دورة",
                  "العملة",
                  "من",
                  "إلى",
                  "عدد مرات الصرف",
                  "الإجمالي",
                  "الإجمالي (جنيه)",
                  "ملاحظات",
                ].map((h) => (
                  <th
                    key={h}
                    className={`whitespace-nowrap px-2 py-3 ${
                      h === "مدفوع إلى" ? `${STICKY_CELL} bg-slate-50` : ""
                    }`}
                  >
                    {h}
                  </th>
                ))}
                <th />
              </tr>
              <tr className="border-b border-slate-200 bg-white">
                {FILTER_COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    className={`px-1 py-1.5 font-normal ${
                      col.key === "payee" ? `${STICKY_CELL} bg-white` : ""
                    }`}
                  >
                    {col.options ? (
                      <select
                        value={filters[col.key] ?? ""}
                        onChange={(e) =>
                          setFilters((f) => ({ ...f, [col.key]: e.target.value }))
                        }
                        className="w-full min-w-[80px] rounded-md border border-slate-200 bg-white px-1.5 py-1 text-[11px] text-slate-700"
                      >
                        <option value="">الكل</option>
                        {col.options.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        value={filters[col.key] ?? ""}
                        onChange={(e) =>
                          setFilters((f) => ({ ...f, [col.key]: e.target.value }))
                        }
                        placeholder="بحث…"
                        className="w-full min-w-[80px] rounded-md border border-slate-200 bg-white px-1.5 py-1 text-[11px] text-slate-700 placeholder:text-slate-300"
                      />
                    )}
                  </th>
                ))}
                <th />
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={13} className="p-10 text-center text-sm text-slate-400">
                    لا توجد مصروفات في هذا التبويب.
                  </td>
                </tr>
              ) : (
                visible.map((r) => {
                  const linked = Boolean(r.service_id);
                  const ro = (v: string) => (
                    <span className="block whitespace-nowrap px-1.5 text-xs font-semibold text-slate-600">
                      {v}
                    </span>
                  );
                  return (
                    <tr key={r.id} className={`border-b border-white ${ROW_TONE[r.category]}`}>
                      <td className="px-2 py-1">
                        <button
                          type="button"
                          onClick={() => toggle(r)}
                          className={`rounded-full px-3 py-1 text-[11px] font-black ${
                            r.is_running
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                          }`}
                          title="اضغطي للتبديل بين مستمر ومتوقف"
                        >
                          {r.is_running ? "● مستمر" : "■ متوقف"}
                        </button>
                      </td>
                      <td className="px-1 py-1">
                        <EditableCell
                          value={r.category}
                          type="select"
                          options={CATEGORY_OPTIONS}
                          width={130}
                          onSave={(v) => saveLinked(r, "category", v)}
                        />
                      </td>
                      <td className={`px-1 py-1 ${STICKY_CELL} ${STICKY_BG[r.category]}`}>
                        <EditableCell
                          value={r.payee}
                          width={260}
                          onSave={(v) => saveLinked(r, "payee", v)}
                        />
                        {linked && (
                          <span className="mt-0.5 inline-block rounded bg-amber-100 px-1 text-[10px] text-amber-800">
                            مرتبط بجدول الخدمات
                          </span>
                        )}
                      </td>
                      <td className="px-1 py-1">
                        <EditableCell
                            value={r.billing_period}
                            type="select"
                            options={PERIOD_OPTIONS}
                            width={90}
                            onSave={(v) => saveLinked(r, "billing_period", v)}
                          />
                      </td>
                      <td className="px-1 py-1">
                        <EditableCell
                            value={r.monthly_amount}
                            type="number"
                            width={90}
                            onSave={(v) => saveLinked(r, "monthly_amount", v)}
                          />
                      </td>
                      <td className="px-1 py-1">
                        <EditableCell
                            value={r.currency}
                            type="select"
                            options={CURRENCIES}
                            width={105}
                            onSave={(v) => saveLinked(r, "currency", v)}
                          />
                      </td>
                      <td className="px-1 py-1">
                        <EditableCell
                            value={r.start_month}
                            type="date"
                            width={130}
                            onSave={(v) => saveLinked(r, "start_month", v)}
                          />
                      </td>
                      <td className="px-1 py-1">
                        {r.is_running
                          ? ro("مستمر حتى اليوم")
                          : ro(r.end_month ?? "متوقف")}
                      </td>
                      <td className="px-1 py-1">
                        {r.is_running ? (
                          ro(String(r.months_count))
                        ) : (
                          <EditableCell
                            value={r.months_count}
                            type="number"
                            width={70}
                            onSave={(v) => saveLinked(r, "months_count", v)}
                          />
                        )}
                      </td>
                      <td className="px-2 py-1 text-xs font-bold text-[#07152E]">
                        {fmt(r.total_amount)} {r.currency}
                      </td>
                      <td className="px-2 py-1 text-xs font-black text-[#07152E]">
                        {fmt(r.total_egp)}
                      </td>
                      <td className="px-1 py-1">
                        <EditableCell
                          value={r.notes}
                          width={200}
                          onSave={(v) => save(r.id, "notes", v)}
                        />
                      </td>
                      <td className="px-2">
                        <button
                          type="button"
                          onClick={() => remove(r)}
                          className="text-slate-300 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <ServicesManager services={services} />
    </div>
  );
}
