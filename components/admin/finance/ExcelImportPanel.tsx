"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileSpreadsheet, Loader2 } from "lucide-react";

import {
  commitFinanceImport,
  type ImportResult,
} from "@/lib/actions/admin/finance";
import { DEFAULT_RATES, toEgp } from "@/lib/finance/shared";
import {
  parseFinanceWorkbook,
  type ParsedImport,
} from "@/lib/finance/excel-import";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);

export default function ExcelImportPanel() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [parsed, setParsed] = useState<ParsedImport | null>(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setError("");
    setResult(null);
    setParsed(null);
    setFileName(file.name);
    try {
      setParsed(await parseFinanceWorkbook(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذرت قراءة الملف");
    }
  };

  const confirm = () => {
    if (!parsed) return;
    setError("");
    startTransition(async () => {
      const res = await commitFinanceImport({
        payments: parsed.payments,
        expenses: parsed.expenses,
        otherIncome: parsed.otherIncome,
      });
      if (!res.success || !res.data) {
        setError(res.message || "فشل الاستيراد");
        return;
      }
      setResult(res.data);
      setParsed(null);
      router.refresh();
    });
  };

  const totalEgp = parsed
    ? parsed.payments.reduce(
        (s, p) =>
          s + toEgp(Number(p.amount_paid) || 0, String(p.currency), DEFAULT_RATES),
        0,
      )
    : 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 text-sm font-black text-[#07152E]"
      >
        <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
        استيراد من ملف الإكسل
      </button>

      {open ? (
        <div className="mt-4 space-y-4 text-sm">
          <p className="text-xs leading-6 text-slate-500">
            اختر ملف الإكسل، سأعرض لك معاينة بما سيُضاف قبل أي حفظ. يُستورد بيانات الطلاب والأسعار فقط، وتُحسب كل الإحصائيات والإجماليات تلقائيًا من الجدول. السجلات الموجودة
            بالفعل لا تتكرر، والاستيراد يضيف الناقص فقط.
          </p>

          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xlsm"
            onChange={(e) => onFile(e.target.files?.[0])}
            className="block text-xs"
          />

          {error ? <p className="text-xs font-semibold text-red-600">{error}</p> : null}

          {parsed ? (
            <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="font-black text-amber-900">معاينة: {fileName}</p>
              <ul className="space-y-1 text-xs font-semibold text-slate-700">
                <li>• اشتراكات: {parsed.payments.length} (إجمالي المدفوع بالجنيه بأسعار الصرف الحالية: {fmt(totalEgp)})</li>
                <li>• مصروفات: {parsed.expenses.length}</li>
                <li>• دخل بيع نسخ البرامج: {parsed.otherIncome.length}</li>
              </ul>
              {parsed.warnings.map((w) => (
                <p key={w} className="text-xs text-red-700">⚠ {w}</p>
              ))}

              <div className="max-h-56 overflow-auto rounded-lg border border-amber-200 bg-white">
                <table className="w-full text-right text-[11px]">
                  <thead className="bg-slate-50 font-black text-slate-500">
                    <tr>
                      <th className="p-1.5">الاسم</th>
                      <th className="p-1.5">الإصدار</th>
                      <th className="p-1.5">المدفوع</th>
                      <th className="p-1.5">بالجنيه</th>
                      <th className="p-1.5">التاريخ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.payments.slice(0, 15).map((p, i) => (
                      <tr key={i} className="border-t border-slate-100">
                        <td className="p-1.5">{String(p.student_name ?? "")}</td>
                        <td className="p-1.5">{String(p.edition_code ?? "")}</td>
                        <td className="p-1.5">
                          {String(p.amount_paid ?? "")} {String(p.currency ?? "")}
                        </td>
                        <td className="p-1.5">
                          {fmt(toEgp(Number(p.amount_paid) || 0, String(p.currency), DEFAULT_RATES))}
                        </td>
                        <td className="p-1.5">{String(p.paid_at ?? "")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                type="button"
                onClick={confirm}
                disabled={isPending}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-black text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                تأكيد الاستيراد وحفظ البيانات
              </button>
            </div>
          ) : null}

          {result ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-900">
              تم الاستيراد — اشتراكات: أُضيف {result.paymentsAdded} (تخطّي {result.paymentsSkipped} موجود) ·
              مصروفات: أُضيف {result.expensesAdded} (تخطّي {result.expensesSkipped}) ·
              دخل نسخ: أُضيف {result.incomeAdded} (تخطّي {result.incomeSkipped}).
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
