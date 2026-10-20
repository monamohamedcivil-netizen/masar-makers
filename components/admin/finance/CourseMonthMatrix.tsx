"use client";

import { useMemo, useState } from "react";

import { JOURNEY_ORDER, journeyLabelOf, type JourneyLabel } from "@/lib/finance/shared";

export interface MatrixRow {
  course_code: string | null;
  edition_code: string | null;
  journey_kind: string | null;
  paid_at: string | null;
  amount_egp: number;
}

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

const selectClass =
  "rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-[#07152E] outline-none focus:border-[#F7B548]";

interface Cell {
  income: number;
  count: number;
}

export default function CourseMonthMatrix({
  rows,
  titles,
}: {
  rows: MatrixRow[];
  titles: Record<string, string>;
}) {
  const [year, setYear] = useState("all");
  const [month, setMonth] = useState("all");

  const dated = useMemo(
    () => rows.filter((r) => r.paid_at),
    [rows],
  );

  const years = useMemo(
    () =>
      [...new Set(dated.map((r) => r.paid_at!.slice(0, 4)))].sort(),
    [dated],
  );

  const filtered = useMemo(
    () =>
      dated.filter((r) => {
        const y = r.paid_at!.slice(0, 4);
        const m = r.paid_at!.slice(5, 7);
        return (year === "all" || y === year) && (month === "all" || m === month);
      }),
    [dated, year, month],
  );

  const model = useMemo(() => {
    const monthKeys = [
      ...new Set(filtered.map((r) => r.paid_at!.slice(0, 7))),
    ].sort();

    const grid = new Map<string, Map<string, Cell>>();
    const meta = new Map<string, { course: string; journey: JourneyLabel }>();
    const journeyTotals = new Map<JourneyLabel, Cell>();

    for (const r of filtered) {
      const course = r.course_code ?? "—";
      const journey = journeyLabelOf(r);
      const rowKey = `${course}|${journey}`;
      const mk = r.paid_at!.slice(0, 7);

      meta.set(rowKey, { course, journey });
      const row = grid.get(rowKey) ?? new Map<string, Cell>();
      const cell = row.get(mk) ?? { income: 0, count: 0 };
      cell.income += r.amount_egp;
      cell.count += 1;
      row.set(mk, cell);
      grid.set(rowKey, row);

      const jt = journeyTotals.get(journey) ?? { income: 0, count: 0 };
      jt.income += r.amount_egp;
      jt.count += 1;
      journeyTotals.set(journey, jt);
    }

    const rowTotal = (key: string): Cell => {
      const t: Cell = { income: 0, count: 0 };
      for (const c of grid.get(key)?.values() ?? []) {
        t.income += c.income;
        t.count += c.count;
      }
      return t;
    };

    const rowKeys = [...grid.keys()].sort((a, b) => {
      const ma = meta.get(a)!;
      const mb = meta.get(b)!;
      if (ma.course !== mb.course) {
        // الكورس الأعلى دخلًا أولًا
        const courseIncome = (c: string) =>
          [...grid.keys()]
            .filter((k) => meta.get(k)!.course === c)
            .reduce((s, k) => s + rowTotal(k).income, 0);
        return courseIncome(mb.course) - courseIncome(ma.course);
      }
      return JOURNEY_ORDER.indexOf(ma.journey) - JOURNEY_ORDER.indexOf(mb.journey);
    });

    const colTotals = new Map<string, Cell>();
    const grand: Cell = { income: 0, count: 0 };
    for (const key of rowKeys) {
      for (const [mk, c] of grid.get(key)!) {
        const t = colTotals.get(mk) ?? { income: 0, count: 0 };
        t.income += c.income;
        t.count += c.count;
        colTotals.set(mk, t);
        grand.income += c.income;
        grand.count += c.count;
      }
    }

    const maxCell = Math.max(
      1,
      ...rowKeys.flatMap((k) => [...grid.get(k)!.values()].map((c) => c.income)),
    );

    return { monthKeys, grid, meta, rowKeys, rowTotal, colTotals, grand, maxCell, journeyTotals };
  }, [filtered]);

  const courseName = (code: string) => titles[code] ?? code;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-black text-[#07152E]">
            الدخل وعدد المشتركين لكل كورس ورحلة في كل شهر (جنيه)
          </h3>

          <div className="flex flex-wrap items-center gap-2">
            <label className="text-xs font-bold text-slate-500">السنة</label>
            <select
              className={selectClass}
              value={year}
              onChange={(e) => setYear(e.target.value)}
            >
              <option value="all">كل السنوات</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            <label className="text-xs font-bold text-slate-500">الشهر</label>
            <select
              className={selectClass}
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            >
              <option value="all">كل الشهور</option>
              {MONTHS.map((m, i) => (
                <option key={m} value={String(i + 1).padStart(2, "0")}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        {model.rowKeys.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">
            لا توجد اشتراكات في هذه الفترة.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-max text-center text-xs">
              <thead>
                <tr className="text-[11px] font-black text-slate-500">
                  <th className="min-w-[170px] p-2 text-right">الكورس</th>
                  <th className="min-w-[90px] p-2">الرحلة</th>
                  <th className="min-w-[90px] p-2">الإجمالي</th>
                  {model.monthKeys.map((k) => (
                    <th key={k} className="min-w-[90px] p-2">
                      {monthLabel(k)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {model.rowKeys.map((key) => {
                  const m = model.meta.get(key)!;
                  const row = model.grid.get(key)!;
                  const total = model.rowTotal(key);
                  return (
                    <tr key={key} className="border-t border-slate-100">
                      <td className="p-2 text-right font-black text-[#07152E]">
                        {courseName(m.course)}
                      </td>
                      <td className="p-2 font-bold text-slate-600">{m.journey}</td>
                      <td className="bg-slate-50 p-2 font-black">
                        {fmt(total.income)}
                        <span className="block text-[10px] font-bold text-slate-500">
                          {total.count} مشترك
                        </span>
                      </td>
                      {model.monthKeys.map((k) => {
                        const c = row.get(k);
                        return (
                          <td
                            key={k}
                            className="p-2 font-semibold"
                            style={{
                              backgroundColor: c
                                ? `rgba(247,181,72,${0.12 + (c.income / model.maxCell) * 0.6})`
                                : undefined,
                            }}
                          >
                            {c ? (
                              <>
                                {fmt(c.income)}
                                <span className="block text-[10px] font-bold text-slate-600">
                                  {c.count} مشترك
                                </span>
                              </>
                            ) : (
                              "—"
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 font-black text-[#07152E]">
                  <td className="p-2 text-right" colSpan={2}>
                    الإجمالي
                  </td>
                  <td className="bg-slate-100 p-2">
                    {fmt(model.grand.income)}
                    <span className="block text-[10px] font-bold text-slate-500">
                      {model.grand.count} مشترك
                    </span>
                  </td>
                  {model.monthKeys.map((k) => {
                    const t = model.colTotals.get(k);
                    return (
                      <td key={k} className="p-2">
                        {t ? (
                          <>
                            {fmt(t.income)}
                            <span className="block text-[10px] font-bold text-slate-500">
                              {t.count} مشترك
                            </span>
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                    );
                  })}
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
