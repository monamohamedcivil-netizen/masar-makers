"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2, ChevronDown } from "lucide-react";

import {
  createPayment,
  deleteOffer,
  deleteOtherIncome,
  deletePayment,
  saveExchangeRate,
  saveOffer,
  saveOtherIncome,
  savePriceItem,
  updatePayment,
} from "@/lib/actions/admin/finance";
import type { FinanceData } from "@/lib/finance/queries";
import {
  PAYMENT_STATUS_LABELS,
  stageOfEdition,
  type FinanceOffer,
  type FinanceOtherIncome,
  type FinancePayment,
  type FinancePriceItem,
  type FinanceRates,
} from "@/lib/finance/shared";

import EditableCell, { type CellType } from "./EditableCell";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);

const CURRENCY_OPTIONS = [
  { value: "EGP", label: "جنيه EGP" },
  { value: "SAR", label: "ريال SAR" },
  { value: "USD", label: "دولار $" },
];

const STATUS_OPTIONS = (
  Object.keys(PAYMENT_STATUS_LABELS) as Array<keyof typeof PAYMENT_STATUS_LABELS>
).map((k) => ({ value: k, label: PAYMENT_STATUS_LABELS[k] }));

type Col = {
  key: keyof FinancePayment;
  label: string;
  type: CellType;
  width: number;
  options?: Array<{ value: string; label: string }>;
  readOnly?: boolean;
  offers?: boolean;
  auto?: boolean;
  csdOnly?: boolean;
};

const COLUMNS: Col[] = [
  { key: "student_name", label: "الاسم", type: "text", width: 170 },
  { key: "certificate_name", label: "الاسم في الشهادة", type: "text", width: 160 },
  { key: "email", label: "البريد", type: "text", width: 200 },
  { key: "phone", label: "الهاتف", type: "text", width: 130 },
  { key: "nationality", label: "الجنسية", type: "text", width: 90 },
  { key: "country", label: "بلد الإقامة", type: "text", width: 90 },
  { key: "edition_code", label: "الإصدار", type: "text", width: 90 },
  {
    key: "journey_kind",
    label: "نوع الرحلة",
    type: "select",
    width: 120,
    options: [
      { value: "integrated", label: "متكاملة" },
      { value: "one_day", label: "يوم واحد" },
    ],
  },
  {
    key: "delivery_type",
    label: "النوع",
    type: "select",
    width: 100,
    options: [
      { value: "", label: "—" },
      { value: "recorded", label: "مسجل" },
      { value: "interactive", label: "تفاعلي" },
    ],
  },
  { key: "offer_label", label: "العرض / الخصم", type: "text", width: 200, offers: true },
  { key: "list_price", label: "السعر الأصلي", type: "number", width: 90 },
  { key: "currency", label: "العملة", type: "select", width: 110, options: CURRENCY_OPTIONS },
  { key: "amount_total", label: "السعر بعد الخصم", type: "number", width: 100 },
  { key: "amount_paid", label: "المدفوع", type: "number", width: 90 },
  { key: "amount_egp", label: "بالجنيه", type: "number", width: 90, readOnly: true },
  { key: "payment_status", label: "حالة الدفع", type: "select", width: 120, options: STATUS_OPTIONS },
  { key: "paid_at", label: "تاريخ الدفع", type: "date", width: 130 },
  { key: "notes", label: "ملاحظات", type: "text", width: 260 },
  { key: "followup_date", label: "موعد المتابعة", type: "date", width: 130 },
  { key: "followup_reason", label: "سبب المتابعة", type: "text", width: 180 },
  { key: "followup_done", label: "تمت المتابعة", type: "bool", width: 70 },
  { key: "activation_key", label: "مفتاح التفعيل", type: "text", width: 130, csdOnly: true },
  { key: "email_sent", label: "أُرسل الإيميل", type: "bool", width: 70, csdOnly: true },
  { key: "expires_at", label: "تاريخ الانتهاء", type: "date", width: 130, csdOnly: true },
  { key: "certificate_issued", label: "الشهادة (تلقائي)", type: "bool", width: 70, auto: true },
  { key: "survey_done", label: "الاستبيان (تلقائي)", type: "bool", width: 70, auto: true },
];

type Props = Pick<
  FinanceData,
  "paths" | "payments" | "offers" | "priceItems" | "rates" | "otherIncome"
>;

export default function PaymentsManager(props: Props) {
  const [payments, setPayments] = useState<FinancePayment[]>(props.payments);
  const [income, setIncome] = useState<FinanceOtherIncome[]>(props.otherIncome);
  const [offers, setOffers] = useState<FinanceOffer[]>(props.offers);
  const [priceItems, setPriceItems] = useState<FinancePriceItem[]>(props.priceItems);
  const [rates, setRates] = useState<FinanceRates>(props.rates);

  const [tab, setTab] = useState<string>(props.paths[0]?.id ?? "other");
  const [courseTab, setCourseTab] = useState<string>("all");
  const [stageFilter, setStageFilter] = useState<"all" | "fundamental" | "advanced">("all");
  const [showPricing, setShowPricing] = useState(false);
  const [message, setMessage] = useState("");

  const offerNames = offers.filter((o) => o.is_active).map((o) => o.name);

  /* ---------- الإحصائيات ---------- */
  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const month = today.slice(0, 7);
    const paymentsIncome = payments.reduce((s, p) => s + p.amount_egp, 0);
    const otherTotal = income.reduce((s, i) => s + i.total_egp, 0);
    const monthIncome = payments
      .filter((p) => (p.paid_at ?? "").startsWith(month))
      .reduce((s, p) => s + p.amount_egp, 0);
    return {
      total: paymentsIncome,
      other: otherTotal,
      count: payments.length,
      monthIncome,
      unpaid: payments.filter((p) => p.payment_status !== "paid").length,
      due: payments.filter(
        (p) => !p.followup_done && p.followup_date && p.followup_date <= today,
      ).length,
    };
  }, [payments, income]);

  /* ---------- الصفوف المعروضة ---------- */
  const knownCodes = useMemo(
    () => new Set(props.paths.flatMap((p) => p.courses.map((c) => c.code))),
    [props.paths],
  );
  const unassigned = payments.filter(
    (p) => !p.course_code || !knownCodes.has(p.course_code),
  );

  const activePath = props.paths.find((p) => p.id === tab);

  const rows = useMemo(() => {
    if (tab === "unassigned") return unassigned;
    if (!activePath) return [];
    const codes = activePath.courses.map((c) => c.code);
    const activeCourse = activePath.courses.find((c) => c.code === courseTab);
    return payments.filter((p) => {
      if (!p.course_code) return false;
      if (courseTab === "all" ? !codes.includes(p.course_code) : p.course_code !== courseTab)
        return false;
      // كورس بمرحلتين: فلتر الأساسيات / المتقدم
      if (activeCourse?.split && stageFilter !== "all") {
        return stageOfEdition(p.edition_code) === stageFilter;
      }
      return true;
    });
  }, [tab, activePath, courseTab, stageFilter, payments, unassigned]);

  const notRegistered = rows.filter((p) => p.account_status === "none").length;

  // أعمدة مفتاح التفعيل والإيميل وتاريخ الانتهاء تخص كورس CSD فقط.
  const columns = COLUMNS.filter(
    (c) => !c.csdOnly || (Boolean(activePath) && courseTab === "CSD"),
  );

  /* ---------- العمليات ---------- */
  const flash = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(""), 4000);
  };

  const saveCell = async (
    id: string,
    key: string,
    value: string | number | boolean | null,
  ) => {
    const result = await updatePayment(id, { [key]: value });
    if (!result.success || !result.data) {
      flash(result.message || "تعذر الحفظ");
      return false;
    }
    setPayments((prev) => prev.map((p) => (p.id === id ? result.data! : p)));
    return true;
  };

  const addRow = async () => {
    const code =
      courseTab !== "all"
        ? courseTab
        : (activePath?.courses[0]?.code ?? null);
    const result = await createPayment({ course_code: code });
    if (!result.success || !result.data) {
      flash(result.message || "تعذر الإضافة");
      return;
    }
    setPayments((prev) => [result.data!, ...prev]);
  };

  const removeRow = async (id: string) => {
    if (!window.confirm("حذف هذا السجل نهائيًا؟")) return;
    const result = await deletePayment(id);
    if (!result.success) return flash(result.message || "تعذر الحذف");
    setPayments((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-5">
      {/* الإحصائيات */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <Stat label="دخل الاشتراكات (جنيه)" value={fmt(stats.total)} accent />
        <Stat label="دخل بيع البرامج (جنيه)" value={fmt(stats.other)} />
        <Stat label="دخل هذا الشهر" value={fmt(stats.monthIncome)} />
        <Stat label="عدد الاشتراكات" value={String(stats.count)} />
        <Stat label="غير مكتمل الدفع" value={String(stats.unpaid)} />
        <Stat label="متابعات مستحقة" value={String(stats.due)} warn={stats.due > 0} />
      </div>

      {message ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-2 text-xs font-semibold text-red-700">
          {message}
        </p>
      ) : null}

      {/* تبويبات المسارات */}
      <div className="flex flex-wrap gap-2">
        {props.paths.map((p) => (
          <TabButton
            key={p.id}
            active={tab === p.id}
            onClick={() => {
              setTab(p.id);
              setCourseTab("all");
            }}
          >
            {p.title}
          </TabButton>
        ))}
        {unassigned.length > 0 ? (
          <TabButton active={tab === "unassigned"} onClick={() => setTab("unassigned")}>
            غير مصنّف ({unassigned.length})
          </TabButton>
        ) : null}
        <TabButton active={tab === "other"} onClick={() => setTab("other")} gold>
          أرباح بيع البرامج / دخل آخر
        </TabButton>
      </div>

      {/* تبويبات الكورسات داخل المسار */}
      {activePath ? (
        <div className="flex flex-wrap gap-1.5">
          <SubTab
            active={courseTab === "all"}
            onClick={() => {
              setCourseTab("all");
              setStageFilter("all");
            }}
          >
            الكل
          </SubTab>
          {activePath.courses.map((c) => (
            <SubTab
              key={c.id}
              active={courseTab === c.code}
              onClick={() => {
                setCourseTab(c.code);
                setStageFilter("all");
              }}
            >
              {c.title}
            </SubTab>
          ))}
        </div>
      ) : null}

      {activePath?.courses.find((c) => c.code === courseTab)?.split ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-slate-500">المرحلة:</span>
          {(
            [
              ["all", "الاثنتان"],
              ["fundamental", "الأساسيات"],
              ["advanced", "المتقدم"],
            ] as const
          ).map(([key, label]) => (
            <SubTab
              key={key}
              active={stageFilter === key}
              onClick={() => setStageFilter(key)}
            >
              {label}
            </SubTab>
          ))}
        </div>
      ) : null}

      {tab === "other" ? (
        <OtherIncomeTable income={income} setIncome={setIncome} flash={flash} />
      ) : (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 p-3">
            <p className="text-sm font-black text-[#07152E]">
              المشتركون ({rows.length}) — اضغط على أي خلية لتعديلها
              {notRegistered > 0 ? (
                <span className="mr-2 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-black text-amber-800">
                  {notRegistered} لم يسجّل في المنصة بعد
                </span>
              ) : null}
            </p>
            <button
              type="button"
              onClick={addRow}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#07152E] px-3 py-2 text-xs font-bold text-[#F7B548]"
            >
              <Plus className="h-4 w-4" />
              إضافة اشتراك
            </button>
          </div>

          <div className="max-h-[70vh] overflow-auto">
            <table className="w-max min-w-full text-right">
              <thead className="sticky top-0 z-10 bg-slate-50">
                <tr className="border-b border-slate-200">
                  <th className="px-2 py-3 text-[11px] font-black text-slate-500">#</th>
                  <th className="whitespace-nowrap px-2 py-3 text-[11px] font-black text-slate-500">
                    في المنصة
                  </th>
                  {columns.map((c) => (
                    <th
                      key={c.key}
                      className="whitespace-nowrap px-2 py-3 text-[11px] font-black text-slate-500"
                    >
                      {c.label}
                    </th>
                  ))}
                  <th className="px-2 py-3" />
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length + 3}
                      className="p-10 text-center text-sm text-slate-400"
                    >
                      لا توجد اشتراكات هنا بعد.
                    </td>
                  </tr>
                ) : (
                  rows.map((p, idx) => (
                    <tr
                      key={p.id}
                      className={`border-b border-slate-100 hover:bg-slate-50/60 ${
                        p.account_status === "none" ? "bg-amber-50/70" : ""
                      }`}
                    >
                      <td className="px-2 py-1 text-xs text-slate-400">{idx + 1}</td>
                      <td className="whitespace-nowrap px-2 py-1">
                        {p.account_status === "none" ? (
                          <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-black text-amber-900">
                            ⚠ لم يسجّل بعد
                          </span>
                        ) : p.account_status === "registered" ? (
                          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-black text-slate-700">
                            حساب بلا اشتراك
                          </span>
                        ) : (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-800">
                            مشترك ✓
                          </span>
                        )}
                      </td>
                      {columns.map((c) => (
                        <td key={c.key} className="px-1 py-1">
                          {c.auto ? (
                            <span
                              className="block px-1.5 text-center text-sm font-black text-emerald-600"
                              title="يُحسب تلقائيًا من بيانات المنصة"
                            >
                              {p[c.key] ? "✓" : ""}
                            </span>
                          ) : c.readOnly ? (
                            <span className="block px-1.5 text-xs font-bold text-[#07152E]">
                              {fmt(Number(p[c.key] ?? 0))}
                            </span>
                          ) : (
                            <EditableCell
                              value={p[c.key] as string | number | boolean | null}
                              type={c.type}
                              options={c.options}
                              width={c.width}
                              listId={c.offers ? "finance-offer-names" : undefined}
                              onSave={(v) => saveCell(p.id, c.key, v)}
                            />
                          )}
                        </td>
                      ))}
                      <td className="px-2 py-1">
                        <button
                          type="button"
                          onClick={() => removeRow(p.id)}
                          title="حذف"
                          className="text-slate-300 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <datalist id="finance-offer-names">
            {offerNames.map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>
        </section>
      )}

      {/* الأسعار والعروض */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <button
          type="button"
          onClick={() => setShowPricing((v) => !v)}
          className="flex w-full items-center justify-between p-4 text-right"
        >
          <span className="text-sm font-black text-[#07152E]">
            قائمة الأسعار والعروض وأسعار الصرف (قابلة للتعديل)
          </span>
          <ChevronDown
            className={`h-5 w-5 text-slate-400 transition ${showPricing ? "rotate-180" : ""}`}
          />
        </button>

        {showPricing ? (
          <PricingPanel
            offers={offers}
            setOffers={setOffers}
            priceItems={priceItems}
            setPriceItems={setPriceItems}
            rates={rates}
            setRates={setRates}
            flash={flash}
          />
        ) : null}
      </section>
    </div>
  );
}

/* ============================ مكونات صغيرة ============================ */

function Stat({
  label,
  value,
  accent,
  warn,
}: {
  label: string;
  value: string;
  accent?: boolean;
  warn?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        accent
          ? "border-[#F7B548] bg-[#07152E] text-white"
          : warn
            ? "border-amber-300 bg-amber-50"
            : "border-slate-200 bg-white"
      }`}
    >
      <p className={`text-xs font-bold ${accent ? "text-[#F7B548]" : "text-slate-500"}`}>
        {label}
      </p>
      <p className="mt-1.5 text-2xl font-black">{value}</p>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
  gold,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  gold?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-4 py-2.5 text-sm font-black transition ${
        active
          ? "border-[#F7B548] bg-[#07152E] text-white"
          : gold
            ? "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
            : "border-slate-200 bg-white text-slate-600 hover:border-[#F7B548]/60"
      }`}
    >
      {children}
    </button>
  );
}

function SubTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
        active
          ? "bg-[#F7B548] text-[#07152E]"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      }`}
    >
      {children}
    </button>
  );
}

/* ============================ دخل آخر ============================ */

const INCOME_COLS: Array<{
  key: keyof FinanceOtherIncome;
  label: string;
  type: CellType;
  width: number;
  options?: Array<{ value: string; label: string }>;
}> = [
  { key: "received_from", label: "مدفوع من", type: "text", width: 120 },
  { key: "for_what", label: "لأجل", type: "text", width: 160 },
  { key: "month", label: "الشهر", type: "date", width: 130 },
  { key: "currency", label: "العملة", type: "select", width: 110, options: CURRENCY_OPTIONS },
  { key: "amount", label: "المبلغ", type: "number", width: 90 },
  { key: "my_percent", label: "نسبتي", type: "number", width: 80 },
  { key: "extra_profit", label: "ربح إضافي (جنيه)", type: "number", width: 110 },
  { key: "extra_reason", label: "سبب الربح الإضافي", type: "text", width: 200 },
  { key: "total_egp", label: "الإجمالي (جنيه)", type: "number", width: 110 },
  { key: "notes", label: "ملاحظات", type: "text", width: 220 },
];

function OtherIncomeTable({
  income,
  setIncome,
  flash,
}: {
  income: FinanceOtherIncome[];
  setIncome: React.Dispatch<React.SetStateAction<FinanceOtherIncome[]>>;
  flash: (m: string) => void;
}) {
  const save = async (
    id: string,
    key: string,
    value: string | number | boolean | null,
  ) => {
    const patch: Record<string, unknown> = { [key]: value };
    if (key === "total_egp") patch.__manualTotal = true;
    const result = await saveOtherIncome(id, patch);
    if (!result.success || !result.data) {
      flash(result.message || "تعذر الحفظ");
      return false;
    }
    setIncome((prev) => prev.map((i) => (i.id === id ? result.data! : i)));
    return true;
  };

  const add = async () => {
    const result = await saveOtherIncome(null, {
      for_what: "دخل جديد",
      amount: 0,
    });
    if (!result.success || !result.data) return flash(result.message || "تعذر الإضافة");
    setIncome((prev) => [result.data!, ...prev]);
  };

  const remove = async (id: string) => {
    if (!window.confirm("حذف هذا السجل نهائيًا؟")) return;
    const result = await deleteOtherIncome(id);
    if (!result.success) return flash(result.message || "تعذر الحذف");
    setIncome((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 p-3">
        <p className="text-sm font-black text-[#07152E]">
          أرباح بيع نسخ البرامج ودخل آخر ({income.length})
        </p>
        <button
          type="button"
          onClick={add}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#07152E] px-3 py-2 text-xs font-bold text-[#F7B548]"
        >
          <Plus className="h-4 w-4" />
          إضافة دخل
        </button>
      </div>
      <div className="overflow-auto">
        <table className="w-max min-w-full text-right">
          <thead className="bg-slate-50">
            <tr className="border-b border-slate-200">
              {INCOME_COLS.map((c) => (
                <th key={c.key} className="whitespace-nowrap px-2 py-3 text-[11px] font-black text-slate-500">
                  {c.label}
                </th>
              ))}
              <th />
            </tr>
          </thead>
          <tbody>
            {income.length === 0 ? (
              <tr>
                <td colSpan={INCOME_COLS.length + 1} className="p-10 text-center text-sm text-slate-400">
                  لا يوجد دخل مسجّل بعد.
                </td>
              </tr>
            ) : (
              income.map((i) => (
                <tr key={i.id} className="border-b border-slate-100 hover:bg-slate-50/60">
                  {INCOME_COLS.map((c) => (
                    <td key={c.key} className="px-1 py-1">
                      <EditableCell
                        value={i[c.key] as string | number | null}
                        type={c.type}
                        options={c.options}
                        width={c.width}
                        onSave={(v) => save(i.id, c.key, v)}
                      />
                    </td>
                  ))}
                  <td className="px-2">
                    <button type="button" onClick={() => remove(i.id)} className="text-slate-300 hover:text-red-600">
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
  );
}

/* ============================ الأسعار والعروض ============================ */

function PricingPanel({
  offers,
  setOffers,
  priceItems,
  setPriceItems,
  rates,
  setRates,
  flash,
}: {
  offers: FinanceOffer[];
  setOffers: React.Dispatch<React.SetStateAction<FinanceOffer[]>>;
  priceItems: FinancePriceItem[];
  setPriceItems: React.Dispatch<React.SetStateAction<FinancePriceItem[]>>;
  rates: FinanceRates;
  setRates: React.Dispatch<React.SetStateAction<FinanceRates>>;
  flash: (m: string) => void;
}) {
  const saveOfferField = async (
    o: FinanceOffer,
    patch: Partial<FinanceOffer>,
  ) => {
    const next = { ...o, ...patch };
    const result = await saveOffer({
      id: o.id,
      name: next.name,
      discount_percent: next.discount_percent,
    });
    if (!result.success) {
      flash(result.message || "تعذر الحفظ");
      return false;
    }
    setOffers((prev) => prev.map((x) => (x.id === o.id ? next : x)));
    return true;
  };

  const addOffer = async () => {
    const result = await saveOffer({ name: "عرض جديد", discount_percent: 0 });
    if (!result.success || !result.data) return flash(result.message || "تعذر الإضافة");
    setOffers((prev) => [
      ...prev,
      {
        id: result.data!.id,
        name: "عرض جديد",
        discount_percent: 0,
        sort_order: 100,
        is_active: true,
      },
    ]);
  };

  const removeOffer = async (id: string) => {
    if (!window.confirm("حذف هذا العرض؟ (لن تتأثر الاشتراكات القديمة)")) return;
    const result = await deleteOffer(id);
    if (!result.success) return flash(result.message || "تعذر الحذف");
    setOffers((prev) => prev.filter((o) => o.id !== id));
  };

  const savePrice = async (
    item: FinancePriceItem,
    patch: Partial<FinancePriceItem>,
  ) => {
    const result = await savePriceItem({ code: item.code, ...patch });
    if (!result.success) {
      flash(result.message || "تعذر الحفظ");
      return false;
    }
    setPriceItems((prev) =>
      prev.map((x) => (x.code === item.code ? { ...x, ...patch } : x)),
    );
    return true;
  };

  const saveRate = async (currency: string, value: number | string | boolean | null) => {
    const result = await saveExchangeRate(currency, Number(value));
    if (!result.success) {
      flash(result.message || "تعذر الحفظ");
      return false;
    }
    setRates((prev) => ({ ...prev, [currency]: Number(value) }));
    return true;
  };

  return (
    <div className="grid gap-6 border-t border-slate-200 p-4 xl:grid-cols-2">
      {/* العروض */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-black text-[#07152E]">العروض والخصومات</h3>
          <button
            type="button"
            onClick={addOffer}
            className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-bold"
          >
            <Plus className="h-3.5 w-3.5" /> عرض جديد
          </button>
        </div>
        <table className="w-full text-right">
          <thead>
            <tr className="border-b border-slate-200 text-[11px] font-black text-slate-500">
              <th className="px-1 py-2">اسم العرض</th>
              <th className="px-1 py-2">الخصم %</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {offers.map((o) => (
              <tr key={o.id} className="border-b border-slate-100">
                <td className="px-1 py-1">
                  <EditableCell
                    value={o.name}
                    width={240}
                    onSave={(v) => saveOfferField(o, { name: String(v ?? "") })}
                  />
                </td>
                <td className="px-1 py-1">
                  <EditableCell
                    value={o.discount_percent}
                    type="number"
                    width={70}
                    onSave={(v) => saveOfferField(o, { discount_percent: Number(v ?? 0) })}
                  />
                </td>
                <td className="px-1">
                  <button type="button" onClick={() => removeOffer(o.id)} className="text-slate-300 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3 className="mb-2 mt-6 text-sm font-black text-[#07152E]">أسعار الصرف (مقابل الجنيه)</h3>
        <div className="flex gap-4">
          {(["USD", "SAR"] as const).map((c) => (
            <label key={c} className="flex items-center gap-2 text-xs font-bold text-slate-600">
              1 {c === "USD" ? "دولار" : "ريال"} =
              <EditableCell
                value={rates[c]}
                type="number"
                width={80}
                onSave={(v) => saveRate(c, v)}
              />
              جنيه
            </label>
          ))}
        </div>
      </div>

      {/* قائمة الأسعار */}
      <div className="overflow-x-auto">
        <h3 className="mb-2 text-sm font-black text-[#07152E]">أسعار الكورسات الأساسية</h3>
        <table className="w-full text-right">
          <thead>
            <tr className="border-b border-slate-200 text-[11px] font-black text-slate-500">
              <th className="px-1 py-2">الكورس</th>
              <th className="px-1 py-2">جنيه</th>
              <th className="px-1 py-2">ريال</th>
              <th className="px-1 py-2">دولار</th>
            </tr>
          </thead>
          <tbody>
            {priceItems.map((item) => (
              <tr key={item.code} className="border-b border-slate-100">
                <td className="px-1 py-1">
                  <EditableCell
                    value={item.label}
                    width={150}
                    onSave={(v) => savePrice(item, { label: String(v ?? "") })}
                  />
                </td>
                {(["price_egp", "price_sar", "price_usd"] as const).map((f) => (
                  <td key={f} className="px-1 py-1">
                    <EditableCell
                      value={item[f]}
                      type="number"
                      width={80}
                      onSave={(v) =>
                        savePrice(item, { [f]: Number(v ?? 0) } as Partial<FinancePriceItem>)
                      }
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        <h3 className="mb-2 mt-6 text-sm font-black text-[#07152E]">
          السعر بعد كل عرض (بالجنيه)
        </h3>
        <table className="w-full min-w-[520px] text-right">
          <thead>
            <tr className="border-b border-slate-200 text-[11px] font-black text-slate-500">
              <th className="px-1 py-2">الكورس</th>
              {offers.map((o) => (
                <th key={o.id} className="px-1 py-2">
                  {o.discount_percent}%
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {priceItems.map((item) => (
              <tr key={item.code} className="border-b border-slate-100 text-xs">
                <td className="px-1 py-1.5 font-bold">{item.label}</td>
                {offers.map((o) => (
                  <td key={o.id} className="px-1 py-1.5">
                    {fmt(item.price_egp * (1 - o.discount_percent / 100))}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-[11px] text-slate-400">
          السعر بعد العرض = السعر الأساسي × (1 − نسبة الخصم). يمكنك أيضًا كتابة أي عرض حر داخل خانة العرض في الجدول.
        </p>
      </div>
    </div>
  );
}
