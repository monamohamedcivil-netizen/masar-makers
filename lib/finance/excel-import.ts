// قراءة ملف الإكسل في المتصفح وتحويله لبيانات جاهزة للمعاينة ثم الاستيراد.
import {
  courseCodeFromEdition,
  normalizeCurrency,
} from "./shared";

export interface ParsedImport {
  payments: Array<Record<string, unknown>>;
  expenses: Array<Record<string, unknown>>;
  otherIncome: Array<Record<string, unknown>>;
  warnings: string[];
}

type Cell = unknown;

function toIsoDate(value: Cell): string | null {
  if (value === null || value === undefined || value === "") return null;

  if (typeof value === "number" && value > 20000 && value < 80000) {
    const ms = Math.round((value - 25569) * 86400 * 1000);
    return new Date(ms).toISOString().slice(0, 10);
  }

  if (value instanceof Date) {
    return new Date(value.getTime() + 12 * 3600 * 1000).toISOString().slice(0, 10);
  }

  const text = String(value).trim();
  let m = /^(\d{4})-(\d{2})-(\d{2})/.exec(text);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/.exec(text);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  return null;
}

function toNumber(value: Cell): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const n = Number(String(value).replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : null;
}

function toText(value: Cell): string | null {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  return s ? s : null;
}

function truthy(value: Cell): boolean {
  if (value === null || value === undefined || value === "") return false;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value > 0;
  const s = String(value).trim().toLowerCase();
  return !["0", "false", "no", "لا", "-"].includes(s);
}

export async function parseFinanceWorkbook(file: File): Promise<ParsedImport> {
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });

  const warnings: string[] = [];
  const grid = (name: string): Cell[][] | null => {
    const sheet = workbook.Sheets[name];
    if (!sheet) return null;
    return XLSX.utils.sheet_to_json<Cell[]>(sheet, {
      header: 1,
      raw: true,
      defval: null,
    });
  };

  /* ---------- المشتركون (Query1) ---------- */
  const payments: ParsedImport["payments"] = [];
  const q1 = grid("Query1");

  if (!q1 || q1.length < 2) {
    warnings.push("لم أجد ورقة Query1 (قائمة الاشتراكات) في الملف.");
  } else {
    const headers = (q1[0] ?? []).map((h) =>
      String(h ?? "").replace(/^Content\./, "").trim().toLowerCase(),
    );
    const col = (...names: string[]) => {
      for (const n of names) {
        const i = headers.indexOf(n.toLowerCase());
        if (i >= 0) return i;
      }
      return -1;
    };
    const idx = {
      type: col("cource type", "course type"),
      code: col("course code.", "course code"),
      name: col("name"),
      cert: col("name on the certificate"),
      email: col("e-mail", "email"),
      phone: col("phone"),
      nat: col("nationality"),
      country: col("country of residence"),
      total: col("total price"),
      currency: col("currency"),
      price: col("price"),
      date: col("date"),
      egp: col("price (egp)"),
      status: col("payment status"),
      note: col("note"),
      key: col("activation key"),
      sent: col("email sent"),
      expires: col("expired date"),
      follow: col("متابعة"),
      cert2: col("الشهادات"),
      survey: col("الاستبيان"),
    };
    const at = (row: Cell[], i: number) => (i >= 0 ? row[i] : null);

    for (let r = 1; r < q1.length; r++) {
      const row = q1[r];
      const name = toText(at(row, idx.name));
      if (!name) continue;

      const edition = toText(at(row, idx.code));
      const rawCurrency = toText(at(row, idx.currency));
      const currency = normalizeCurrency(rawCurrency);
      const knownCurrency =
        !rawCurrency || ["EGP", "$", "USD", "SAR"].includes(rawCurrency.toUpperCase());

      const statusRaw = at(row, idx.status);
      let status: "paid" | "partial" | "unpaid" = "unpaid";
      if (statusRaw === true || statusRaw === 1) status = "paid";
      else if (statusRaw === 0.5) status = "partial";

      const paid = toNumber(at(row, idx.price)) ?? 0;
      const baseNote = toText(at(row, idx.note));
      const notes = knownCurrency
        ? baseNote
        : [baseNote, `العملة الأصلية في الإكسل: ${rawCurrency}`]
            .filter(Boolean)
            .join("\n");

      payments.push({
        edition_code: edition,
        course_code: courseCodeFromEdition(edition),
        delivery_type: /record/i.test(String(at(row, idx.type) ?? ""))
          ? "recorded"
          : "interactive",
        student_name: name,
        certificate_name: toText(at(row, idx.cert)),
        email: toText(at(row, idx.email)),
        phone: toText(at(row, idx.phone)),
        nationality: toText(at(row, idx.nat)),
        country: toText(at(row, idx.country)),
        currency,
        amount_total: toNumber(at(row, idx.total)),
        amount_paid: paid,
        amount_egp: toNumber(at(row, idx.egp)),
        payment_status: status,
        paid_at: toIsoDate(at(row, idx.date)),
        notes,
        activation_key: toText(at(row, idx.key)),
        email_sent: truthy(at(row, idx.sent)),
        expires_at: toIsoDate(at(row, idx.expires)),
        followup_date: toIsoDate(at(row, idx.follow)),
        followup_reason: toIsoDate(at(row, idx.follow)) ? "متابعة من ملف الإكسل" : null,
        certificate_issued: truthy(at(row, idx.cert2)),
        survey_done: truthy(at(row, idx.survey)),
      });
    }
  }

  /* ---------- المصروفات ودخل بيع النسخ (Working) ---------- */
  const expenses: ParsedImport["expenses"] = [];
  const otherIncome: ParsedImport["otherIncome"] = [];
  const working = grid("Working");

  if (!working) {
    warnings.push("لم أجد ورقة Working (المصروفات وبيع النسخ).");
  } else {
    const find = (label: string): [number, number] | null => {
      for (let r = 0; r < working.length; r++) {
        const row = working[r] ?? [];
        for (let c = 0; c < row.length; c++) {
          if (String(row[c] ?? "").trim() === label) return [r, c];
        }
      }
      return null;
    };

    const exp = find("Payed to");
    if (exp) {
      const [r0, c0] = exp;
      for (let r = r0 + 1; r < working.length; r++) {
        const row = working[r] ?? [];
        const payee = toText(row[c0]);
        if (!payee) break;
        expenses.push({
          payee,
          start_month: toIsoDate(row[c0 + 1]),
          end_month: toIsoDate(row[c0 + 2]),
          months_count: toNumber(row[c0 + 3]) ?? 1,
          currency: normalizeCurrency(row[c0 + 4]),
          monthly_amount: toNumber(row[c0 + 5]) ?? 0,
          total_amount: toNumber(row[c0 + 6]) ?? 0,
          total_egp: toNumber(row[c0 + 7]) ?? 0,
        });
      }
    } else {
      warnings.push("لم أجد جدول المصروفات (Payed to).");
    }

    const inc = find("Payed from");
    if (inc) {
      const [r0, c0] = inc;
      for (let r = r0 + 1; r < working.length; r++) {
        const row = working[r] ?? [];
        const from = toText(row[c0]);
        const forWhat = toText(row[c0 + 1]);
        if (!from && !forWhat) break;
        otherIncome.push({
          received_from: from,
          for_what: forWhat,
          month: toIsoDate(row[c0 + 2]),
          currency: normalizeCurrency(row[c0 + 3]),
          amount: toNumber(row[c0 + 4]) ?? 0,
          my_percent: toNumber(row[c0 + 5]),
          notes: toText(row[c0 + 6]),
          extra_profit: toNumber(row[c0 + 7]) ?? 0,
          extra_reason: toText(row[c0 + 8]),
          total_egp: toNumber(row[c0 + 9]) ?? 0,
        });
      }
    } else {
      warnings.push("لم أجد جدول بيع نسخ البرامج (Payed from).");
    }
  }

  return { payments, expenses, otherIncome, warnings };
}
