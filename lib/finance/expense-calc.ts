// حساب المصروفات المتكررة (يومي / شهري / سنوي) تلقائيًا حتى تاريخ اليوم.
import {
  toEgp,
  type BillingPeriod,
  type FinanceRates,
} from "./shared";

export interface ChargeSource {
  start: string | null; // تاريخ أول صرف YYYY-MM-DD
  period: BillingPeriod;
  amount: number; // بعملة الصرف
  currency: string;
  running: boolean;
  /** للمتوقف: عدد مرات الصرف المخزَّن (صفوف عادية) */
  fixedCount?: number | null;
  /** للمتوقف: تاريخ التوقف (صفوف الخدمات) */
  stoppedOn?: string | null;
}

const MAX_CHARGES = 5000;

function parts(d: string) {
  const [y, m, day] = d.slice(0, 10).split("-").map(Number);
  return { y, m, day };
}

function iso(y: number, m: number, d: number) {
  return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** تاريخ الصرف رقم k (يبدأ من 0 في تاريخ البداية). */
export function chargeDate(start: string, k: number, period: BillingPeriod): string {
  const { y, m, day } = parts(start);

  if (period === "daily") {
    const dt = new Date(Date.UTC(y, m - 1, day + k));
    return iso(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
  }

  const monthsToAdd = period === "yearly" ? k * 12 : k;
  const total = y * 12 + (m - 1) + monthsToAdd;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  const lastDay = new Date(Date.UTC(ny, nm, 0)).getUTCDate();
  return iso(ny, nm, Math.min(day, lastDay));
}

/** كل تواريخ الصرف المتوقعة من البداية وحتى اليوم (أو حتى التوقف). */
export function expenseCharges(
  source: ChargeSource,
  today: string,
): string[] {
  if (!source.start) return [];
  const dates: string[] = [];

  if (source.running) {
    for (let k = 0; k < MAX_CHARGES; k++) {
      const d = chargeDate(source.start, k, source.period);
      if (d > today) break;
      dates.push(d);
    }
    return dates;
  }

  if (source.fixedCount != null) {
    for (let k = 0; k < Math.min(source.fixedCount, MAX_CHARGES); k++) {
      dates.push(chargeDate(source.start, k, source.period));
    }
    return dates;
  }

  if (source.stoppedOn) {
    for (let k = 0; k < MAX_CHARGES; k++) {
      const d = chargeDate(source.start, k, source.period);
      if (d > source.stoppedOn) break;
      dates.push(d);
    }
  }
  return dates;
}

export interface ExpenseTotals {
  count: number;
  totalAmount: number;
  totalEgp: number;
  byYear: Record<string, number>; // بالجنيه
}

export function computeExpenseTotals(
  source: ChargeSource,
  today: string,
  rates: FinanceRates,
): ExpenseTotals {
  const dates = expenseCharges(source, today);
  const perChargeEgp = toEgp(source.amount, source.currency, rates);
  const byYear: Record<string, number> = {};
  for (const d of dates) {
    const y = d.slice(0, 4);
    byYear[y] = Math.round(((byYear[y] ?? 0) + perChargeEgp) * 100) / 100;
  }
  return {
    count: dates.length,
    totalAmount: Math.round(dates.length * source.amount * 100) / 100,
    totalEgp: Math.round(dates.length * perChargeEgp * 100) / 100,
    byYear,
  };
}
