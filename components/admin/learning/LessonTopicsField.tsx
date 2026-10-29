"use client";

import { Check, Pencil, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";

import {
  addLessonTopic,
  getLessonTopics,
  renameLessonTopic,
  setLessonTopics,
  type LessonTopicOption,
} from "@/lib/actions/admin/lesson-topics";

/**
 * «قسم المحاضرة» في صفحات رحلات اليوم الواحد والمجانية.
 * يمكن اختيار أكثر من قسم. تعديل اسم قسم أو إضافة قسم يظهر في كل محاضرات نفس المسار.
 */
export default function LessonTopicsField({ lessonId, careerPathId }: { lessonId?: string | null; careerPathId?: string | null }) {
  const [topics, setTopics] = useState<LessonTopicOption[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [newName, setNewName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void getLessonTopics(lessonId ?? null, careerPathId ?? null).then((result) => {
      if (cancelled) return;
      if (result.ok && result.data) {
        setTopics(result.data.topics);
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

  const toggle = async (topicId: string) => {
    if (!lessonId) return flash("احفظي الدرس أولًا ثم اختاري القسم.");
    const next = selected.includes(topicId) ? selected.filter((id) => id !== topicId) : [...selected, topicId];
    const previous = selected;
    setSelected(next);
    const result = await setLessonTopics(lessonId, next);
    if (!result.ok) {
      setSelected(previous);
      flash(result.error);
    } else flash("تم حفظ القسم ✓");
  };

  const rename = async (topicId: string) => {
    setBusy(true);
    const result = await renameLessonTopic(topicId, editName);
    setBusy(false);
    if (!result.ok) return flash(result.error);
    setTopics((prev) => prev.map((t) => (t.id === topicId ? { ...t, title: editName.trim() } : t)));
    setEditingId(null);
    flash("تم تعديل اسم القسم لكل محاضرات المسار ✓");
  };

  const add = async () => {
    if (!careerPathId) return flash("اختاري المسار أولًا.");
    setBusy(true);
    const result = await addLessonTopic(careerPathId, newName);
    setBusy(false);
    if (!result.ok || !result.data) return flash(result.ok ? "تعذر الإضافة." : result.error);
    setTopics((prev) => [...prev, result.data!]);
    setNewName("");
    flash("تمت إضافة القسم ✓");
  };

  const names = topics.filter((t) => selected.includes(t.id)).map((t) => t.title);

  return (
    <div className="md:col-span-2">
      <label className="mb-2 block text-sm font-bold text-[#07152E]">قسم المحاضرة (صفحات رحلات اليوم الواحد والمجانية)</label>
      {!careerPathId ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-400">اختاري المسار أولًا.</div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-right text-sm font-bold text-[#07152E]"
          >
            <span className="min-w-0 truncate">{names.length ? names.join(" • ") : "— بدون قسم"}</span>
            <span className="text-xs text-[#C88712]">{open ? "إغلاق ▲" : "اختيار ▼"}</span>
          </button>
          {open ? (
            <div className="space-y-1 border-t border-slate-100 p-3">
              {topics.map((t) => (
                <div key={t.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50">
                  {editingId === t.id ? (
                    <>
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-9 min-w-0 flex-1 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#F7B548]"
                        autoFocus
                      />
                      <button type="button" disabled={busy} onClick={() => void rename(t.id)} className="rounded-lg bg-[#07152E] p-2 text-white" aria-label="حفظ الاسم">
                        <Check className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => setEditingId(null)} className="rounded-lg bg-slate-100 p-2" aria-label="إلغاء">
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-sm font-bold text-[#07152E]">
                        <input type="checkbox" checked={selected.includes(t.id)} onChange={() => void toggle(t.id)} className="h-4 w-4 accent-[#F7B548]" />
                        <span className="truncate">{t.title}</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(t.id);
                          setEditName(t.title);
                        }}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-[#07152E]"
                        aria-label="تعديل اسم القسم"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              ))}
              <div className="flex items-center gap-2 border-t border-slate-100 px-2 pt-2">
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="اسم قسم جديد"
                  className="h-9 min-w-0 flex-1 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#F7B548]"
                />
                <button type="button" disabled={busy || !newName.trim()} onClick={() => void add()} className="inline-flex items-center gap-1 rounded-lg bg-[#F7B548] px-3 py-2 text-xs font-black text-[#07152E] disabled:opacity-50">
                  <Plus className="h-4 w-4" /> إضافة
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}
      {message ? <p className="mt-2 text-xs font-bold text-slate-500">{message}</p> : null}
      <p className="mt-1 text-xs text-slate-500">يمكن اختيار أكثر من قسم. تغيير اسم قسم أو إضافة قسم يظهر في كل محاضرات المسار.</p>
    </div>
  );
}
