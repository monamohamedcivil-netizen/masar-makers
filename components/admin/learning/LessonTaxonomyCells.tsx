"use client";

import { useEffect, useRef, useState } from "react";

import { setLessonSearchTerms } from "@/lib/actions/admin/lesson-taxonomy";
import { setLessonTopics } from "@/lib/actions/admin/lesson-topics";

export type TaxonomyOption = { id: string; title: string; titleEn?: string };

/**
 * عمود قابل للتعديل من خارج المحاضرة: يعرض الأسماء المختارة، والضغط عليه يفتح قائمة
 * بتحديد متعدد، وكل اختيار يُحفظ فورًا. القائمة بموضع ثابت (fixed) حتى لا تُقص داخل البطاقات.
 */
function MultiPickCell({
  label,
  options,
  initial,
  onSave,
  searchable,
}: {
  label: string;
  options: TaxonomyOption[];
  initial: string[];
  onSave: (ids: string[]) => Promise<{ ok: boolean; error?: string }>;
  searchable?: boolean;
}) {
  const [selected, setSelected] = useState<string[]>(initial);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: Event) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      setOpen(false);
    };
    const closeOnScroll = (event: Event) => {
      if (panelRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", close);
    window.addEventListener("scroll", closeOnScroll, true);
    return () => {
      document.removeEventListener("mousedown", close);
      window.removeEventListener("scroll", closeOnScroll, true);
    };
  }, [open]);

  const openPanel = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      const width = 300;
      const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
      const below = rect.bottom + 4;
      const top = below + 280 > window.innerHeight ? Math.max(8, rect.top - 284) : below;
      setPos({ left, top });
    }
    setFilter("");
    setOpen((value) => !value);
  };

  const toggle = async (id: string) => {
    const previous = selected;
    const next = selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id];
    setSelected(next);
    const result = await onSave(next);
    if (!result.ok) {
      setSelected(previous);
      setMessage(result.error || "تعذر الحفظ");
    } else setMessage("تم الحفظ ✓");
    window.setTimeout(() => setMessage(null), 2000);
  };

  const q = filter.trim().toLowerCase();
  const shown = q ? options.filter((o) => `${o.title} ${o.titleEn ?? ""}`.toLowerCase().includes(q)) : options;
  const names = options.filter((o) => selected.includes(o.id)).map((o) => o.title);

  return (
    <div className="min-w-0">
      <p className="mb-1 text-[9px] font-black text-slate-400">{label}</p>
      <button
        ref={buttonRef}
        type="button"
        onClick={openPanel}
        title={names.join(" • ") || "اضغطي للاختيار"}
        className={`flex w-full items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-right text-[10px] font-black transition hover:border-[#F7B548] ${
          names.length ? "border-slate-200 bg-white text-[#07152E]" : "border-dashed border-slate-300 bg-slate-50 text-slate-400"
        }`}
      >
        <span className="min-w-0 truncate">{names.length ? names.join(" • ") : "— لم يُحدد"}</span>
        <span className="shrink-0 text-[#C88712]">▾</span>
      </button>
      {message ? <p className="mt-0.5 text-[9px] font-bold text-slate-500">{message}</p> : null}

      {open && pos ? (
        <div
          ref={panelRef}
          style={{ position: "fixed", left: pos.left, top: pos.top, width: 300 }}
          className="z-50 rounded-xl border border-slate-200 bg-white p-2 shadow-[0_16px_40px_rgba(7,21,46,0.2)]"
        >
          {options.length === 0 ? (
            <p className="px-2 py-3 text-xs font-bold text-slate-400">لا توجد خيارات لهذا المسار.</p>
          ) : (
            <>
              {searchable ? (
                <input
                  value={filter}
                  onChange={(event) => setFilter(event.target.value)}
                  placeholder="ابحثي…"
                  className="mb-2 h-8 w-full rounded-lg border border-slate-200 px-2 text-xs outline-none focus:border-[#F7B548]"
                  autoFocus
                />
              ) : null}
              <div className="max-h-60 space-y-0.5 overflow-y-auto">
                {shown.map((o) => (
                  <label key={o.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-bold text-[#07152E] hover:bg-slate-50">
                    <input type="checkbox" checked={selected.includes(o.id)} onChange={() => void toggle(o.id)} className="h-4 w-4 shrink-0 accent-[#F7B548]" />
                    <span className="min-w-0 truncate">{o.title}</span>
                    {o.titleEn ? (
                      <span dir="ltr" className="shrink-0 truncate text-[10px] font-semibold text-slate-500">
                        {o.titleEn}
                      </span>
                    ) : null}
                  </label>
                ))}
                {shown.length === 0 ? <p className="px-2 py-2 text-xs text-slate-400">لا نتائج.</p> : null}
              </div>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

/** عمودا «القسم (المحطة)» و«كلمات البحث» أمام كل محاضرة يوم واحد/مجانية. */
export function LessonTaxonomyCells({
  lessonId,
  topics,
  terms,
  topicIds,
  termIds,
}: {
  lessonId: string;
  topics: TaxonomyOption[];
  terms: TaxonomyOption[];
  topicIds: string[];
  termIds: string[];
}) {
  return (
    // على الشاشات الواسعة (xl) يصبح العمودان داخل شبكة الصف؛ وعلى الأصغر يظهران في سطر خاص أسفل الصف.
    <div className="grid gap-3 sm:grid-cols-2 lg:order-last lg:col-span-3 xl:contents">
      <MultiPickCell
        label="القسم (المحطة)"
        options={topics}
        initial={topicIds}
        onSave={async (ids) => {
          const result = await setLessonTopics(lessonId, ids);
          return result.ok ? { ok: true } : { ok: false, error: result.error };
        }}
      />
      <MultiPickCell
        label="كلمات البحث"
        options={terms}
        initial={termIds}
        searchable
        onSave={async (ids) => {
          const result = await setLessonSearchTerms(lessonId, ids);
          return result.ok ? { ok: true } : { ok: false, error: result.error };
        }}
      />
    </div>
  );
}
