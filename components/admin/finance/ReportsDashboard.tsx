import Link from "next/link";

import type { FinanceData } from "@/lib/finance/queries";
import {
  PAYMENT_STATUS_LABELS,
  journeyLabelOf,
  type JourneyLabel,
} from "@/lib/finance/shared";

import CourseMonthMatrix from "./CourseMonthMatrix";
import FollowupDoneButton from "./FollowupDoneButton";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);

const MONTHS = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

const monthLabel = (key: string) => {
  const [y, m] = key.split("-");
  return `${MONTHS[Number(m) - 1] ?? m} ${y}`;
};

export default function ReportsDashboard({ data }: { data: FinanceData }) {
  const { payments, expenses, otherIncome, paths } = data;
  const today = new Date().toISOString().slice(0, 10);
  const thisYear = today.slice(0, 4);
  const lastYear = String(Number(thisYear) - 1);

  const titleByCode = new Map<string, string>();
  for (const p of paths)
    for (const c of p.courses) titleByCode.set(c.code, c.title);

  /* ---------- مؤشرات ---------- */
  const incomeOf = (rows: typeof payments) =>
    rows.reduce((s, p) => s + p.amount_egp, 0);

  const integrated = payments.filter((p) => p.journey_kind !== "one_day");
  const oneDay = payments.filter((p) => p.journey_kind === "one_day");
  const integratedIncome = incomeOf(integrated);
  const oneDayIncome = incomeOf(oneDay);
  const income = integratedIncome + oneDayIncome;
  const expensesTotal = expenses.reduce((s, e) => s + e.total_egp, 0);
  const otherTotal = otherIncome.reduce((s, i) => s + i.total_egp, 0);
  const profit = income + otherTotal - expensesTotal;

  const expenseByCategory = (cat: string) =>
    expenses.filter((e) => e.category === cat).reduce((s, e) => s + e.total_egp, 0);

  const yearIncome = (y: string) =>
    payments
      .filter((p) => (p.paid_at ?? "").startsWith(y))
      .reduce((s, p) => s + p.amount_egp, 0) +
    otherIncome
      .filter((i) => i.month.startsWith(y))
      .reduce((s, i) => s + i.total_egp, 0);
  const yearExpenses = (y: string) => data.expensesByYear[y] ?? 0;
  const yearProfit = (y: string) => yearIncome(y) - yearExpenses(y);

  const pctChange = (cur: number, prev: number) =>
    prev === 0 ? null : ((cur - prev) / Math.abs(prev)) * 100;
  const fmtPct = (v: number | null) =>
    v === null ? "—" : `${v > 0 ? "+" : ""}${v.toFixed(1)}%`;
  const profitChange = pctChange(yearProfit(thisYear), yearProfit(lastYear));
  const expensesChange = pctChange(yearExpenses(thisYear), yearExpenses(lastYear));

  const people = new Set(
    payments.map((p) => (p.email ?? p.student_name ?? p.id).split(/[\s,&;]+/)[0].toLowerCase()),
  ).size;
  const paidRows = payments.filter((p) => p.amount_egp > 0);
  const avgPrice = paidRows.length ? income / paidRows.length : 0;

  // متوسط الدخل الشهري = صافي الربح ÷ عدد الشهور من يناير 2026 حتى الشهر الحالي (شاملًا).
  // يتغير مرة واحدة فقط عند بداية كل شهر، ولا يُحسب إلا عند فتح الصفحة.
  const nowDate = new Date();
  const elapsedMonths = Math.max(
    1,
    (nowDate.getUTCFullYear() - 2026) * 12 + nowDate.getUTCMonth() + 1,
  );
  const avgMonthly = profit / elapsedMonths;
  const sarRate = data.rates.SAR || 13.5;

  const byMonth = new Map<string, { income: number; count: number }>();
  const byCourse = new Map<string, { income: number; count: number }>();

  // كل الاشتراكات تُحسب في الأعداد (حتى لو المدفوع 0 كالمكافآت).
  for (const p of payments) {
    const month = (p.paid_at ?? "").slice(0, 7) || "—";
    const course = p.course_code ?? "—";

    const m = byMonth.get(month) ?? { income: 0, count: 0 };
    m.income += p.amount_egp;
    m.count += 1;
    byMonth.set(month, m);

    const c = byCourse.get(course) ?? { income: 0, count: 0 };
    c.income += p.amount_egp;
    c.count += 1;
    byCourse.set(course, c);
  }

  const months = [...byMonth.keys()].filter((k) => k !== "—").sort();

  const maxMonth = Math.max(1, ...months.map((k) => byMonth.get(k)!.income));
  const courses = [...byCourse.entries()].sort((a, b) => b[1].income - a[1].income);
  const maxCourse = Math.max(1, ...courses.map(([, v]) => v.income));

  const courseName = (code: string) => titleByCode.get(code) ?? code;

  const cjMap = new Map<string, { key: string; course: string; journey: JourneyLabel; income: number; count: number; paidCount: number }>();
  for (const p of payments) {
    const course = p.course_code ?? "—";
    const journey = journeyLabelOf(p);
    const key = `${course}|${journey}`;
    const cur = cjMap.get(key) ?? { key, course, journey, income: 0, count: 0, paidCount: 0 };
    cur.income += p.amount_egp;
    cur.count += 1;
    if (p.amount_egp > 0) cur.paidCount += 1;
    cjMap.set(key, cur);
  }
  const courseJourneys = [...cjMap.values()].sort((a, b) => b.income - a.income);
  const maxCourseJourney = Math.max(1, ...courseJourneys.map((v) => v.income));

  /* ---------- جدول المتابعة ---------- */
  const followups = payments
    .filter((p) => !p.followup_done && p.followup_date)
    .sort((a, b) => (a.followup_date! < b.followup_date! ? -1 : 1));

  return (
    <div className="space-y-6">
      {/* مؤشرات رئيسية */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          label="دخل اشتراكات الرحلات المتكاملة"
          value={fmt(integratedIncome)}
          unit="جنيه"
          note={`${integrated.length} اشتراك`}
          accent
        />
        <Kpi
          label="دخل اشتراكات رحلات اليوم الواحد"
          value={fmt(oneDayIncome)}
          unit="جنيه"
          note={`${oneDay.length} اشتراك`}
        />
        <Kpi
          label="دخل البرامج"
          value={fmt(otherTotal)}
          unit="جنيه"
          note={`${otherIncome.length} عملية بيع`}
        />
        <Kpi
          label="صافي الربح"
          value={fmt(profit)}
          unit="جنيه"
          note="الاشتراكات + البرامج − المصروفات"
          good={profit >= 0}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="إجمالي المصروفات" value={fmt(expensesTotal)} unit="جنيه" />
        <Kpi label="مصروفات الإعلانات المدفوعة" value={fmt(expenseByCategory("ads"))} unit="جنيه" />
        <Kpi label="مصروفات خدمات المنصة" value={fmt(expenseByCategory("platform"))} unit="جنيه" />
        <Kpi label="مصروفات أخرى" value={fmt(expenseByCategory("other"))} unit="جنيه" />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label={`دخل ${thisYear} (السنة الحالية)`} value={fmt(yearIncome(thisYear))} unit="جنيه" />
        <Kpi label={`دخل ${lastYear} (السنة السابقة)`} value={fmt(yearIncome(lastYear))} unit="جنيه" />
        <Kpi
          label="نسبة تغير الربح"
          value={fmtPct(profitChange)}
          note={
            profitChange === null
              ? `لا توجد بيانات ${lastYear} للمقارنة`
              : `${thisYear} مقابل ${lastYear}`
          }
          good={profitChange === null ? undefined : profitChange >= 0}
        />
        <Kpi
          label="نسبة تغير المصروفات"
          value={fmtPct(expensesChange)}
          note={
            expensesChange === null
              ? `لا توجد مصروفات ${lastYear} للمقارنة`
              : `${thisYear} مقابل ${lastYear}`
          }
          good={expensesChange === null ? undefined : expensesChange <= 0}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="عدد الاشتراكات" value={String(payments.length)} />
        <Kpi label="عدد الأشخاص" value={String(people)} />
        <Kpi label="متوسط سعر الاشتراك" value={fmt(avgPrice)} unit="جنيه" />
        <Kpi
          label="متوسط الدخل الشهري"
          value={`${fmt(avgMonthly)} جنيه`}
          note={`≈ ${fmt(avgMonthly / sarRate)} ريال · عدد الشهور: ${elapsedMonths} (من يناير 2026 حتى ${monthLabel(today.slice(0, 7))})`}
        />
      </div>

      {/* الدخل لكل شهر */}
      <Card title="الدخل وعدد الاشتراكات لكل شهر">
        {months.length === 0 ? (
          <Empty />
        ) : (
          <div className="flex h-56 items-end gap-3 overflow-x-auto pb-2">
            {months.map((k) => {
              const v = byMonth.get(k)!;
              return (
                <div key={k} className="flex min-w-[64px] flex-1 flex-col items-center justify-end gap-1">
                  <span className="text-[11px] font-black text-[#07152E]">{fmt(v.income)}</span>
                  <div
                    className="w-full max-w-[56px] rounded-t-lg bg-[#07152E]"
                    style={{ height: `${Math.max(4, (v.income / maxMonth) * 150)}px` }}
                  />
                  <span className="text-[11px] font-bold text-slate-500">{monthLabel(k)}</span>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-800">
                    {v.count} اشتراك
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* الدخل لكل كورس ونوع رحلة */}
      <Card title="الدخل وعدد المشتركين ومتوسط السعر لكل كورس ونوع رحلة">
        {courseJourneys.length === 0 ? (
          <Empty />
        ) : (
          <div className="space-y-3">
            {courseJourneys.map((v) => (
              <div key={v.key}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-black text-[#07152E]">
                    {courseName(v.course)} — {v.journey}
                  </span>
                  <span className="font-semibold text-slate-500">
                    {fmt(v.income)} جنيه · {v.count} اشتراك · متوسط {fmt(v.paidCount ? v.income / v.paidCount : 0)}
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[#F7B548]"
                    style={{ width: `${(v.income / maxCourseJourney) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* كورس × رحلة × شهر + متوسط السعر لكل رحلة */}
      <CourseMonthMatrix
        rows={payments.map((p) => ({
          course_code: p.course_code,
          edition_code: p.edition_code,
          journey_kind: p.journey_kind,
          paid_at: p.paid_at,
          amount_egp: p.amount_egp,
        }))}
        titles={Object.fromEntries(titleByCode)}
      />

      {/* جدول المتابعة */}
      <Card title={`جدول متابعة الدفعات (${followups.length})`}>
        {followups.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">لا توجد متابعات معلّقة.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-right text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-black text-slate-500">
                  <th className="p-2">الطالب</th>
                  <th className="p-2">الكورس</th>
                  <th className="p-2">الحالة</th>
                  <th className="p-2">المدفوع</th>
                  <th className="p-2">سبب المتابعة / ملاحظات</th>
                  <th className="p-2">موعد المتابعة</th>
                  <th className="p-2" />
                </tr>
              </thead>
              <tbody>
                {followups.map((p) => {
                  const overdue = p.followup_date! <= today;
                  return (
                    <tr key={p.id} className="border-b border-slate-100 align-top">
                      <td className="p-2 font-black text-[#07152E]">{p.student_name}</td>
                      <td className="p-2">{p.course_code ? courseName(p.course_code) : "—"}</td>
                      <td className="p-2">{PAYMENT_STATUS_LABELS[p.payment_status]}</td>
                      <td className="p-2">{fmt(p.amount_paid)} {p.currency}</td>
                      <td className="max-w-[320px] whitespace-pre-line p-2 text-slate-600">
                        {[p.followup_reason, p.notes].filter(Boolean).join("\n") || "—"}
                      </td>
                      <td className="p-2">
                        <span
                          className={`rounded-full px-2 py-1 text-[11px] font-black ${
                            overdue ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {p.followup_date}
                          {overdue ? " · مستحقة" : ""}
                        </span>
                      </td>
                      <td className="p-2">
                        <FollowupDoneButton paymentId={p.id} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-[11px] text-slate-400">
          لتعديل موعد أو سبب المتابعة افتح{" "}
          <Link href="/admin/finance/payments" className="font-bold underline">
            صفحة المدفوعات
          </Link>
          .
        </p>
      </Card>
    </div>
  );
}

function Kpi({
  label,
  value,
  unit,
  accent,
  good,
  note,
}: {
  label: string;
  value: string;
  unit?: string;
  accent?: boolean;
  good?: boolean;
  note?: string;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        accent ? "border-[#F7B548] bg-[#07152E] text-white" : "border-slate-200 bg-white"
      }`}
    >
      <p className={`text-xs font-bold ${accent ? "text-[#F7B548]" : "text-slate-500"}`}>{label}</p>
      <p
        className={`mt-1.5 text-2xl font-black ${
          good === undefined ? "" : good ? "text-emerald-600" : "text-red-600"
        }`}
      >
        {value}
        {unit ? <span className="mr-1 text-xs font-bold opacity-60">{unit}</span> : null}
      </p>
      {note ? (
        <p className={`mt-1 text-[11px] leading-4 ${accent ? "text-white/60" : "text-slate-400"}`}>
          {note}
        </p>
      ) : null}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-black text-[#07152E]">{title}</h2>
      {children}
    </section>
  );
}

function Empty() {
  return (
    <p className="py-6 text-center text-sm text-slate-400">
      لا توجد بيانات بعد. أضف اشتراكات أو استورد ملف الإكسل من صفحة المدفوعات.
    </p>
  );
}
