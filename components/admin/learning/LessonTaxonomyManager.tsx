"use client";

import { ArrowDown, ArrowUp, Check, Eye, EyeOff, Pencil, Plus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  addSearchTerm,
  getTaxonomy,
  reorderSearchTerms,
  updateSearchTerm,
  type TaxonomyData,
  type TaxonomyItem,
} from "@/lib/actions/admin/lesson-taxonomy";
import { addLessonTopic, reorderLessonTopics, updateLessonTopic } from "@/lib/actions/admin/lesson-topics";

type Result = { ok: true; data?: unknown } | { ok: false; error: string };

/** جدول واحد (محطات أو كلمات بحث) لمسار واحد: تعديل، إخفاء، ترتيب بالأسهم، وإضافة. */
function TaxonomyTable({
  title,
  hint,
  items,
  setItems,
  unit,
  onAdd,
  onUpdate,
  onReorder,
  unavailable,
}: {
  title: string;
  hint: string;
  items: TaxonomyItem[];
  setItems: (next: TaxonomyItem[]) => void;
  unit: string;
  onAdd: (title: string, titleEn: string) => Promise<Result>;
  onUpdate: (id: string, patch: { title?: string; titleEn?: string | null; isActive?: boolean }) => Promise<Result>;
  onReorder: (orderedIds: string[]) => Promise<Result>;
  unavailable?: string;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAr, setEditAr] = useState("");
  const [editEn, setEditEn] = useState("");
  const [newAr, setNewAr] = useState("");
  const [newEn, setNewEn] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const flash = (text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(null), 3000);
  };

  const move = async (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (busy || target < 0 || target >= items.length) return;
    const previous = items;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);
    setBusy(true);
    const result = await onReorder(next.map((i) => i.id));
    setBusy(false);
    if (!result.ok) {
      setItems(previous);
      return flash(result.error);
    }
    flash("تم حفظ الترتيب ✓");
  };

  const saveEdit = async (item: TaxonomyItem) => {
    setBusy(true);
    const result = await onUpdate(item.id, { title: editAr, titleEn: editEn });
    setBusy(false);
    if (!result.ok) return flash(result.error);
    setItems(items.map((i) => (i.id === item.id ? { ...i, title: editAr.trim(), titleEn: editEn.trim() } : i)));
    setEditingId(null);
    flash("تم الحفظ ✓");
  };

  const toggle = async (item: TaxonomyItem) => {
    setBusy(true);
    const result = await onUpdate(item.id, { isActive: !item.isActive });
    setBusy(false);
    if (!result.ok) return flash(result.error);
    setItems(items.map((i) => (i.id === item.id ? { ...i, isActive: !item.isActive } : i)));
  };

  const add = async () => {
    setBusy(true);
    const result = await onAdd(newAr, newEn);
    setBusy(false);
    if (!result.ok || !("data" in result) || !result.data) return flash(result.ok ? "تعذرت الإضافة." : result.error);
    setItems([...items, result.data as TaxonomyItem]);
    setNewAr("");
    setNewEn("");
    flash("تمت الإضافة ✓");
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header className="border-b border-slate-100 px-4 py-3">
        <h3 className="text-base font-black text-[#07152E]">{title}</h3>
        <p className="mt-0.5 text-xs font-semibold text-slate-500">{hint}</p>
      </header>

      {unavailable ? (
        <p className="m-4 rounded-xl bg-amber-50 p-4 text-sm font-bold text-amber-800">{unavailable}</p>
      ) : (
        <>
          <ul className="divide-y divide-slate-100">
            {items.length === 0 ? <li className="px-4 py-6 text-center text-sm font-bold text-slate-400">لا يوجد شيء بعد.</li> : null}
            {items.map((item, index) => (
              <li key={item.id} className={`flex flex-wrap items-center gap-2 px-3 py-2 ${item.isActive ? "" : "bg-slate-50 opacity-70"}`}>
                <span className="w-6 shrink-0 text-center text-xs font-black text-slate-400">{index + 1}</span>
                {editingId === item.id ? (
                  <>
                    <input
                      value={editAr}
                      onChange={(e) => setEditAr(e.target.value)}
                      placeholder="بالعربي"
                      className="h-9 min-w-[140px] flex-1 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#F7B548]"
                      autoFocus
                    />
                    <input
                      value={editEn}
                      onChange={(e) => setEditEn(e.target.value)}
                      placeholder="English"
                      dir="ltr"
                      className="h-9 min-w-[140px] flex-1 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#F7B548]"
                    />
                    <button type="button" disabled={busy} onClick={() => void saveEdit(item)} className="rounded-lg bg-[#07152E] p-2 text-white" aria-label="حفظ">
                      <Check className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => setEditingId(null)} className="rounded-lg bg-slate-100 p-2" aria-label="إلغاء">
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-3 gap-y-0.5">
                      <span className="text-sm font-black text-[#07152E]">{item.title}</span>
                      {item.titleEn ? (
                        <span dir="ltr" className="text-xs font-bold text-slate-500">
                          {item.titleEn}
                        </span>
                      ) : null}
                    </div>
                    <span className="shrink-0 text-[11px] font-bold text-slate-400">
                      {item.lectures} {unit}
                    </span>
                    <button
                      type="button"
                      disabled={busy || index === 0}
                      onClick={() => void move(index, -1)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-[#07152E] disabled:opacity-30"
                      aria-label="تحريك لأعلى"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      disabled={busy || index === items.length - 1}
                      onClick={() => void move(index, 1)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-[#07152E] disabled:opacity-30"
                      aria-label="تحريك لأسفل"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(item.id);
                        setEditAr(item.title);
                        setEditEn(item.titleEn);
                      }}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-[#07152E]"
                      aria-label="تعديل"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void toggle(item)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-[#07152E]"
                      aria-label={item.isActive ? "إخفاء" : "إظهار"}
                      title={item.isActive ? "إخفاء من المنصة" : "إظهار على المنصة"}
                    >
                      {item.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 p-3">
            <input
              value={newAr}
              onChange={(e) => setNewAr(e.target.value)}
              placeholder="بالعربي (مثال: تصميم الدوارات)"
              className="h-9 min-w-[160px] flex-1 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#F7B548]"
            />
            <input
              value={newEn}
              onChange={(e) => setNewEn(e.target.value)}
              placeholder="English (Roundabout Design)"
              dir="ltr"
              className="h-9 min-w-[160px] flex-1 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#F7B548]"
            />
            <button
              type="button"
              disabled={busy || !newAr.trim()}
              onClick={() => void add()}
              className="inline-flex items-center gap-1 rounded-lg bg-[#F7B548] px-3 py-2 text-xs font-black text-[#07152E] disabled:opacity-50"
            >
              <Plus className="h-4 w-4" /> إضافة
            </button>
          </div>
        </>
      )}
      {message ? <p className="px-4 pb-3 text-xs font-bold text-slate-500">{message}</p> : null}
    </section>
  );
}

export default function LessonTaxonomyManager() {
  const [data, setData] = useState<TaxonomyData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pathId, setPathId] = useState("");
  const [topics, setTopics] = useState<TaxonomyItem[]>([]);
  const [terms, setTerms] = useState<TaxonomyItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    void getTaxonomy().then((result) => {
      if (cancelled) return;
      if (!result.ok || !result.data) return setError(result.ok ? "تعذر التحميل." : result.error);
      setData(result.data);
      setTopics(result.data.topics);
      setTerms(result.data.terms);
      setPathId(result.data.paths[0]?.id ?? "");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const pathTopics = useMemo(() => topics.filter((t) => t.pathId === pathId), [topics, pathId]);
  const pathTerms = useMemo(() => terms.filter((t) => t.pathId === pathId), [terms, pathId]);

  if (error) return <p className="rounded-xl bg-red-50 p-4 text-sm font-bold text-red-700">{error}</p>;
  if (!data) return <p className="p-6 text-center text-sm font-bold text-slate-400">جارٍ التحميل…</p>;

  // تحديث عناصر المسار الحالي فقط مع الإبقاء على باقي المسارات.
  const replaceForPath = (all: TaxonomyItem[], next: TaxonomyItem[]) => [...all.filter((i) => i.pathId !== pathId), ...next];

  return (
    <div className="space-y-4">
      <div role="tablist" className="flex flex-wrap gap-2">
        {data.paths.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={p.id === pathId}
            onClick={() => setPathId(p.id)}
            className={`rounded-xl px-4 py-2 text-sm font-black transition ${p.id === pathId ? "bg-[#07152E] text-white" : "bg-white text-[#07152E] ring-1 ring-slate-200 hover:bg-slate-50"}`}
          >
            {p.title}
          </button>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <TaxonomyTable
          title="محطات اليوم الواحد والمجانية"
          hint="نفس المحطات في الصفحتين. المحطة اللي مفيهاش محاضرات ما بتظهرش للطلاب."
          unit="محاضرة"
          items={pathTopics}
          setItems={(next) => setTopics((all) => replaceForPath(all, next))}
          onAdd={async (title, titleEn) => {
            const result = await addLessonTopic(pathId, title);
            if (!result.ok || !result.data) return result;
            if (titleEn.trim()) await updateLessonTopic(result.data.id, { titleEn });
            return {
              ok: true,
              data: { id: result.data.id, pathId, title: result.data.title, titleEn: titleEn.trim(), sortOrder: result.data.sortOrder, isActive: true, lectures: 0 } satisfies TaxonomyItem,
            };
          }}
          onUpdate={updateLessonTopic}
          onReorder={(ids) => reorderLessonTopics(pathId, ids)}
        />

        <TaxonomyTable
          title="كلمات البحث"
          hint="القائمة اللي بتظهر للطالب في خانة البحث (عربي + English). اربطيها بالمحاضرات من شاشة إضافة/تعديل المحاضرة."
          unit="محاضرة"
          items={pathTerms}
          setItems={(next) => setTerms((all) => replaceForPath(all, next))}
          onAdd={(title, titleEn) => addSearchTerm(pathId, title, titleEn)}
          onUpdate={updateSearchTerm}
          onReorder={(ids) => reorderSearchTerms(pathId, ids)}
          unavailable={data.termsReady ? undefined : "جدول كلمات البحث لسه ما اتعملش. شغّلي ملف SQL الخاص بيه في Supabase ثم حدّثي الصفحة."}
        />
      </div>
    </div>
  );
}
