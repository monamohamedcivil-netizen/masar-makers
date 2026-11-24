"use client";

import { ArrowDown, ArrowUp, Eye, EyeOff, Plus, PlayCircle, Video } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  addSectionItem,
  getSectionAdminData,
  reorderSectionItems,
  updateSectionItem,
  type SectionAdminData,
  type SectionItem,
} from "@/lib/actions/admin/station-section-items";
import { SECTION_KEYS, SECTION_LABELS, extractYoutubeId, type SectionKey } from "@/lib/journeys/station-section-shared";

/** تحكم في فيديوهات الأقسام الخمسة تحت كل محطة في «رحلة الاحتراف المتكاملة». */
export default function StationSectionsManager() {
  const [data, setData] = useState<SectionAdminData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stationId, setStationId] = useState("");
  const [section, setSection] = useState<SectionKey>("professional");
  const [items, setItems] = useState<SectionItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [mode, setMode] = useState<"youtube" | "lesson">("youtube");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [lessonId, setLessonId] = useState("");
  const [lessonQuery, setLessonQuery] = useState("");

  useEffect(() => {
    getSectionAdminData().then((res) => {
      if (!res.ok) return setError(res.error);
      setData(res.data!);
      setItems(res.data!.items);
      setStationId(res.data!.stations[0]?.id ?? "");
    });
  }, []);

  const flash = (text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(null), 3000);
  };

  const current = useMemo(
    () => items.filter((i) => i.stationId === stationId && i.sectionKey === section),
    [items, stationId, section],
  );
  const lessonTitle = (id: string | null) => {
    const l = data?.lessons.find((x) => x.id === id);
    return l ? `${l.courseCode ? `${l.courseCode} — ` : ""}${l.title}` : "محاضرة";
  };
  const filteredLessons = useMemo(() => {
    const q = lessonQuery.trim().toLowerCase();
    return (data?.lessons ?? []).filter((l) => !q || `${l.courseCode} ${l.title}`.toLowerCase().includes(q)).slice(0, 80);
  }, [data, lessonQuery]);

  if (error) return <p className="rounded-xl bg-red-50 p-4 text-sm font-bold text-red-700">{error}</p>;
  if (!data) return <p className="p-4 text-sm font-bold text-slate-500">جاري التحميل...</p>;

  const replaceGroup = (next: SectionItem[]) =>
    setItems((all) => [...all.filter((i) => !(i.stationId === stationId && i.sectionKey === section)), ...next]);

  const move = async (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (busy || target < 0 || target >= current.length) return;
    const previous = current;
    const next = [...current];
    [next[index], next[target]] = [next[target], next[index]];
    replaceGroup(next);
    setBusy(true);
    const res = await reorderSectionItems(stationId, section, next.map((i) => i.id));
    setBusy(false);
    if (!res.ok) {
      replaceGroup(previous);
      flash(res.error);
    }
  };

  const toggle = async (item: SectionItem) => {
    setBusy(true);
    const res = await updateSectionItem(item.id, { isActive: !item.isActive });
    setBusy(false);
    if (!res.ok) return flash(res.error);
    setItems((all) => all.map((i) => (i.id === item.id ? { ...i, isActive: !i.isActive } : i)));
  };

  const rename = async (item: SectionItem, value: string) => {
    if (value.trim() === item.title) return;
    const res = await updateSectionItem(item.id, { title: value });
    if (!res.ok) return flash(res.error);
    setItems((all) => all.map((i) => (i.id === item.id ? { ...i, title: value.trim() } : i)));
  };

  const add = async () => {
    setBusy(true);
    const res = await addSectionItem({ stationId, sectionKey: section, kind: mode, title, youtubeUrl: url, lessonId });
    setBusy(false);
    if (!res.ok) return flash(res.error);
    setItems((all) => [...all, res.data!]);
    setTitle("");
    setUrl("");
    setLessonId("");
    flash("تمت الإضافة.");
  };

  const stationsByPath = data.stations;

  return (
    <div className="space-y-4">
      <p className="rounded-xl bg-[#FBF3E2] p-3 text-sm font-bold leading-6 text-[#07152E]">
        هنا تتحكمي في الفيديوهات اللي تظهر داخل الأقسام الخمسة تحت كل محطة في صفحة «رحلة الاحتراف المتكاملة». أي فيديو تضيفيه يظهر أعلى المحتوى الحالي للقسم. لرفع فيديو جديد على المنصة ارفعيه كمحاضرة من تبويب «المحاضرات» ثم اختاريه من هنا.
      </p>

      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <select
          value={stationId}
          onChange={(e) => setStationId(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-[#07152E]"
        >
          {stationsByPath.map((s) => (
            <option key={s.id} value={s.id}>
              {s.pathTitle ? `${s.pathTitle} — ` : ""}
              {s.title}
            </option>
          ))}
        </select>
        {message ? <span className="self-center text-sm font-black text-[#2F7D4F]">{message}</span> : null}
      </div>

      <div role="tablist" className="flex flex-wrap gap-2">
        {SECTION_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={section === key}
            onClick={() => setSection(key)}
            className={`rounded-xl px-3.5 py-2 text-sm font-black transition ${section === key ? "bg-[#07152E] text-white" : "bg-white text-[#07152E] ring-1 ring-slate-200 hover:bg-slate-50"}`}
          >
            {SECTION_LABELS[key]}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {current.length === 0 ? (
          <p className="p-5 text-center text-sm font-bold text-slate-500">لا توجد فيديوهات مضافة في هذا القسم بعد.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {current.map((item, index) => (
              <li key={item.id} className={`flex flex-wrap items-center gap-3 px-4 py-3 ${item.isActive ? "" : "opacity-50"}`}>
                <div className="flex flex-col">
                  <button type="button" disabled={busy || index === 0} onClick={() => move(index, -1)} className="rounded p-0.5 hover:bg-slate-100 disabled:opacity-30" aria-label="أعلى">
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button type="button" disabled={busy || index === current.length - 1} onClick={() => move(index, 1)} className="rounded p-0.5 hover:bg-slate-100 disabled:opacity-30" aria-label="أسفل">
                    <ArrowDown className="h-4 w-4" />
                  </button>
                </div>
                {item.kind === "youtube" ? <PlayCircle className="h-5 w-5 shrink-0 text-red-600" /> : <Video className="h-5 w-5 shrink-0 text-[#2463C7]" />}
                <div className="min-w-0 flex-1">
                  <input
                    defaultValue={item.title}
                    placeholder={item.kind === "lesson" ? lessonTitle(item.lessonId) : "عنوان الفيديو (اختياري)"}
                    onBlur={(e) => rename(item, e.target.value)}
                    className="w-full rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm font-black text-[#07152E] hover:border-slate-200 focus:border-slate-300 focus:bg-white"
                    dir="auto"
                  />
                  <p className="truncate px-2 text-xs font-semibold text-slate-500" dir="auto">
                    {item.kind === "youtube" ? item.youtubeUrl : lessonTitle(item.lessonId)}
                  </p>
                </div>
                <button type="button" disabled={busy} onClick={() => toggle(item)} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-black text-slate-600 hover:bg-slate-100">
                  {item.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  {item.isActive ? "ظاهر" : "مخفي"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-sm font-black text-[#07152E]">إضافة فيديو إلى «{SECTION_LABELS[section]}»</p>
        <div className="flex gap-2">
          {(["youtube", "lesson"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded-lg px-3 py-1.5 text-xs font-black ${mode === m ? "bg-[#07152E] text-white" : "bg-slate-100 text-[#07152E]"}`}
            >
              {m === "youtube" ? "رابط يوتيوب" : "اختيار محاضرة موجودة"}
            </button>
          ))}
        </div>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="عنوان الفيديو (اختياري)"
          dir="auto"
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold"
        />

        {mode === "youtube" ? (
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            dir="ltr"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold"
          />
        ) : (
          <div className="space-y-2">
            <input
              value={lessonQuery}
              onChange={(e) => setLessonQuery(e.target.value)}
              placeholder="ابحثي عن محاضرة..."
              dir="auto"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold"
            />
            <select
              value={lessonId}
              onChange={(e) => setLessonId(e.target.value)}
              size={6}
              className="w-full rounded-xl border border-slate-200 bg-white px-2 py-1 text-sm font-semibold"
            >
              {filteredLessons.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.courseCode ? `${l.courseCode} — ` : ""}
                  {l.title}
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          type="button"
          disabled={busy || (mode === "youtube" ? !extractYoutubeId(url) : !lessonId)}
          onClick={add}
          className="inline-flex items-center gap-2 rounded-xl bg-[#07152E] px-4 py-2 text-sm font-black text-white disabled:opacity-40"
        >
          <Plus className="h-4 w-4" />
          إضافة
        </button>
      </div>
    </div>
  );
}
