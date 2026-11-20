"use client";

import { useEffect, useMemo, useState } from "react";

import {
  getLessonSearchTerms,
  setLessonSearchTerms,
  type SearchTermOption,
} from "@/lib/actions/admin/lesson-taxonomy";

/**
 * «كلمات البحث» للمحاضرة (خانة البحث في صفحتي اليوم الواحد والمجانية).
 * قائمة منسدلة بتحديد متعدد؛ الكلمات تُدار من تبويب «تصنيف الرحلات».
 */
export default function LessonSearchTermsField({ lessonId, careerPathId }: { lessonId?: string | null; careerPathId?: string | null }) {
  const [terms, setTerms] = useState<SearchTermOption[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getLessonSearchTerms(lessonId ?? null, careerPathId ?? null).then((result) => {
      if (cancelled) return;
      if (result.ok && result.data) {
        setTerms(result.data.terms);
        setSelected(result.data.selected);
      } else if (!result.ok) setMessage(result.error);
    });
    return () => {
      cancelled = true;
    };
  }, [lessonId, careerPathId]);

  const flash = (text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(null), 2500);
  };

  const toggle = async (termId: string) => {
    if (!lessonId) return flash("احفظي الدرس أولًا ثم اختاري كلمات البحث.");
    const previous = selected;
    const next = selected.includes(termId) ? selected.filter((id) => id !== termId) : [...selected, termId];
    setSelected(next);
    const result = await setLessonSearchTerms(lessonId, next);
    if (!result.ok) {
      setSelected(previous);
      flash(result.error);
    } else flash("تم حفظ كلمات البحث ✓");
  };

  const shown = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return terms;
    return terms.filter((t) => t.title.toLowerCase().includes(q) || t.titleEn.toLowerCase().includes(q));
  }, [terms, filter]);

  const names = terms.filter((t) => selected.includes(t.id)).map((t) => t.title);

  return (
    <div className="md:col-span-2">
      <label className="mb-2 block text-sm font-bold text-[#07152E]">كلمات البحث (خانة البحث في صفحات اليوم الواحد والمجانية)</label>
      {!careerPathId ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-400">اختاري المسار أولًا.</div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-right text-sm font-bold text-[#07152E]"
          >
            <span className="min-w-0 truncate">{names.length ? names.join(" • ") : "— بدون كلمات بحث"}</span>
            <span className="text-xs text-[#C88712]">{open ? "إغلاق ▲" : "اختيار ▼"}</span>
          </button>
          {open ? (
            <div className="border-t border-slate-100 p-3">
              {terms.length === 0 ? (
                <p className="px-2 py-3 text-sm font-bold text-slate-400">لا توجد كلمات بحث لهذا المسار. أضيفيها من «الدروس والمحتوى ← تصنيف الرحلات».</p>
              ) : (
                <>
                  <input
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    placeholder="ابحثي في الكلمات…"
                    className="mb-2 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#F7B548]"
                  />
                  <div className="max-h-64 space-y-1 overflow-y-auto">
                    {shown.map((t) => (
                      <label key={t.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-bold text-[#07152E] hover:bg-slate-50">
                        <input type="checkbox" checked={selected.includes(t.id)} onChange={() => void toggle(t.id)} className="h-4 w-4 accent-[#F7B548]" />
                        <span className="truncate">{t.title}</span>
                        {t.titleEn ? (
                          <span dir="ltr" className="truncate text-xs font-semibold text-slate-500">
                            {t.titleEn}
                          </span>
                        ) : null}
                      </label>
                    ))}
                    {shown.length === 0 ? <p className="px-2 py-2 text-sm text-slate-400">لا نتائج.</p> : null}
                  </div>
                </>
              )}
            </div>
          ) : null}
        </div>
      )}
      {message ? <p className="mt-2 text-xs font-bold text-slate-500">{message}</p> : null}
      <p className="mt-1 text-xs text-slate-500">يمكن اختيار أكثر من كلمة للمحاضرة الواحدة. تظهر المحاضرة للطالب لما يختار أي كلمة منهم.</p>
    </div>
  );
}
