"use client";

/* eslint-disable @next/next/no-img-element */

import { useRef, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, ExternalLink, ImageUp, Plus, Save, Trash2 } from "lucide-react";

import { saveLandingPage, uploadLandingAsset } from "@/lib/actions/landing-pages";
import { FIELD_LABELS, isImageField, type LandingContent, type LandingPageRow } from "@/lib/landing/types";
import { compressImageForUpload } from "@/lib/utils/compress-image";

/* =========================================================
   محرر صفحة الهبوط: كل أقسام الصفحة كحقول (نصوص، صور، قوائم).
   القوائم: إضافة عنصر / حذف / تحريك لأعلى ولأسفل.
========================================================= */

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };
type Path = (string | number)[];

const GIFT_ICONS = [
  { value: "file", label: "ملف" },
  { value: "video", label: "فيديو" },
  { value: "cert", label: "شهادة" },
];

const LONG_KEYS = new Set(["lead", "text", "description", "outcome", "a", "chatText", "chatBubble", "messageIntro", "note", "desc"]);

function label(key: string | number) {
  return typeof key === "number" ? `#${key + 1}` : FIELD_LABELS[key] ?? key;
}

function setIn(root: Json, path: Path, value: Json): Json {
  if (!path.length) return value;
  const [head, ...rest] = path;
  if (Array.isArray(root)) {
    const copy = [...root];
    copy[head as number] = setIn(copy[head as number], rest, value);
    return copy;
  }
  const obj = (root ?? {}) as Record<string, Json>;
  return { ...obj, [head]: setIn(obj[head as string], rest, value) };
}

function blankLike(value: Json): Json {
  if (Array.isArray(value)) return [];
  if (value && typeof value === "object") {
    const out: Record<string, Json> = {};
    for (const [key, inner] of Object.entries(value)) out[key] = blankLike(inner);
    return out;
  }
  if (typeof value === "boolean") return false;
  if (typeof value === "number") return 0;
  return "";
}

async function fileToBase64(file: File) {
  const buffer = await file.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + 0x8000)));
  }
  return btoa(binary);
}

function ImageField({
  value,
  onChange,
  pageId,
}: {
  value: string;
  onChange: (value: string) => void;
  pageId: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function upload(file: File) {
    setBusy(true);
    setError("");
    try {
      const compressed = await compressImageForUpload(file);
      const result = await uploadLandingAsset({
        pageId,
        name: compressed.name,
        mime: compressed.type,
        base64: await fileToBase64(compressed),
      });
      if (!result.ok) setError(result.error);
      else if (result.data) onChange(result.data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر رفع الصورة.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {value ? (
        <img src={value} alt="" className="h-16 w-28 rounded-lg border border-slate-200 bg-slate-900 object-cover" />
      ) : null}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        dir="ltr"
        className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 font-mono text-xs"
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => input.current?.click()}
        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-60"
      >
        <ImageUp className="h-4 w-4" /> {busy ? "جاري الرفع…" : "رفع صورة"}
      </button>
      <input
        ref={input}
        type="file"
        accept="image/*"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
          event.target.value = "";
        }}
      />
      {error ? <p className="w-full text-xs font-semibold text-red-600">{error}</p> : null}
    </div>
  );
}

function Field({
  name,
  value,
  path,
  onChange,
  pageId,
  depth,
}: {
  name: string | number;
  value: Json;
  path: Path;
  onChange: (path: Path, value: Json) => void;
  pageId: string;
  depth: number;
}) {
  const key = typeof name === "string" ? name : "";

  if (Array.isArray(value)) {
    const move = (from: number, to: number) => {
      if (to < 0 || to >= value.length) return;
      const copy = [...value];
      const [item] = copy.splice(from, 1);
      copy.splice(to, 0, item);
      onChange(path, copy);
    };
    return (
      <fieldset className="rounded-xl border border-slate-200 p-3">
        <legend className="px-2 text-sm font-bold text-[#07152E]">{label(name)}</legend>
        <div className="space-y-3">
          {value.map((item, index) => (
            <div key={index} className="rounded-lg bg-slate-50 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-500">#{index + 1}</span>
                <div className="flex gap-1">
                  <button type="button" onClick={() => move(index, index - 1)} className="rounded border border-slate-200 bg-white p-1" aria-label="لأعلى">
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" onClick={() => move(index, index + 1)} className="rounded border border-slate-200 bg-white p-1" aria-label="لأسفل">
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange(path, value.filter((_, i) => i !== index))}
                    className="rounded border border-red-200 bg-white p-1 text-red-600"
                    aria-label="حذف"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <Field name={index} value={item} path={[...path, index]} onChange={onChange} pageId={pageId} depth={depth + 1} />
            </div>
          ))}
          <button
            type="button"
            onClick={() => onChange(path, [...value, value.length ? blankLike(value[value.length - 1]) : ""])}
            className="inline-flex items-center gap-1 rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-600"
          >
            <Plus className="h-3.5 w-3.5" /> إضافة
          </button>
        </div>
      </fieldset>
    );
  }

  if (value && typeof value === "object") {
    const body = (
      <div className="grid gap-3">
        {Object.entries(value).map(([childKey, child]) => (
          <Field key={childKey} name={childKey} value={child} path={[...path, childKey]} onChange={onChange} pageId={pageId} depth={depth + 1} />
        ))}
      </div>
    );
    if (typeof name === "number") return body;
    if (depth === 0) {
      return (
        <details className="rounded-2xl border border-slate-200 bg-white p-4" open={false}>
          <summary className="cursor-pointer text-base font-black text-[#07152E]">{label(name)}</summary>
          <div className="mt-4">{body}</div>
        </details>
      );
    }
    return (
      <fieldset className="rounded-xl border border-slate-200 p-3">
        <legend className="px-2 text-sm font-bold text-[#07152E]">{label(name)}</legend>
        {body}
      </fieldset>
    );
  }

  const title = typeof name === "number" ? "" : label(name);

  if (typeof value === "boolean") {
    return (
      <label className="flex items-center gap-2 text-sm font-semibold">
        <input type="checkbox" checked={value} onChange={(event) => onChange(path, event.target.checked)} />
        {title}
      </label>
    );
  }

  if (key === "icon" && GIFT_ICONS.some((icon) => icon.value === value)) {
    return (
      <label className="grid gap-1 text-sm font-semibold">
        {title}
        <select value={String(value)} onChange={(event) => onChange(path, event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2">
          {GIFT_ICONS.map((icon) => (
            <option key={icon.value} value={icon.value}>
              {icon.label}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (isImageField(key)) {
    return (
      <div className="grid gap-1 text-sm font-semibold">
        {title}
        <ImageField value={String(value ?? "")} onChange={(next) => onChange(path, next)} pageId={pageId} />
      </div>
    );
  }

  const text = String(value ?? "");
  const long = LONG_KEYS.has(key) || text.length > 70;

  return (
    <label className="grid gap-1 text-sm font-semibold">
      {title}
      {long ? (
        <textarea
          value={text}
          rows={3}
          onChange={(event) => onChange(path, event.target.value)}
          className="rounded-xl border border-slate-200 px-3 py-2 font-normal leading-7"
        />
      ) : (
        <input value={text} onChange={(event) => onChange(path, event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 font-normal" />
      )}
    </label>
  );
}

export default function LandingPageEditor({ page }: { page: LandingPageRow }) {
  const [content, setContent] = useState<Json>(page.content as unknown as Json);
  const [title, setTitle] = useState(page.title);
  const [slug, setSlug] = useState(page.slug);
  const [status, setStatus] = useState<"draft" | "published">(page.status);
  const [whatsapp, setWhatsapp] = useState(page.whatsapp_number);
  const [pixel, setPixel] = useState(page.meta_pixel_id ?? "");
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function change(path: Path, value: Json) {
    setContent((current) => setIn(current, path, value));
    setDirty(true);
  }

  function save(nextStatus = status) {
    setMessage(null);
    startTransition(async () => {
      const result = await saveLandingPage({
        id: page.id,
        slug,
        title,
        status: nextStatus,
        whatsappNumber: whatsapp,
        metaPixelId: pixel,
        content: content as unknown as LandingContent,
      });
      if (result.ok) {
        setStatus(nextStatus);
        setDirty(false);
        setMessage({ ok: true, text: nextStatus === "published" ? "اتحفظت والصفحة منشورة." : "اتحفظت كمسودة." });
      } else {
        setMessage({ ok: false, text: result.error });
      }
    });
  }

  const sections = Object.entries(content as Record<string, Json>);

  return (
    <div className="space-y-4 pb-24">
      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-5">
        <label className="grid gap-1 text-sm font-semibold">
          اسم الصفحة
          <input value={title} onChange={(e) => { setTitle(e.target.value); setDirty(true); }} className="rounded-xl border border-slate-200 px-3 py-2" />
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          الرابط (masarmakers.com/lp/…)
          <input value={slug} dir="ltr" onChange={(e) => { setSlug(e.target.value); setDirty(true); }} className="rounded-xl border border-slate-200 px-3 py-2 font-mono" />
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          رقم واتساب الحجز (بكود الدولة)
          <input value={whatsapp} dir="ltr" onChange={(e) => { setWhatsapp(e.target.value); setDirty(true); }} className="rounded-xl border border-slate-200 px-3 py-2 font-mono" />
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          Meta Pixel ID (اختياري)
          <input value={pixel} dir="ltr" onChange={(e) => { setPixel(e.target.value); setDirty(true); }} placeholder="مثال: 1234567890" className="rounded-xl border border-slate-200 px-3 py-2 font-mono" />
        </label>
        <div className="grid gap-1 text-sm font-semibold">
          الحالة
          <span className={`rounded-xl px-3 py-2 text-center font-bold ${status === "published" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
            {status === "published" ? "منشورة للزوار" : "مسودة (تظهر لك فقط)"}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {sections.map(([key, value]) => (
          <Field key={key} name={key} value={value} path={[key]} onChange={change} pageId={page.id} depth={0} />
        ))}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur md:pr-72">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => save()}
            className="inline-flex items-center gap-2 rounded-xl bg-[#07152E] px-5 py-2.5 font-bold text-white disabled:opacity-60"
          >
            <Save className="h-4 w-4" /> {pending ? "جاري الحفظ…" : "حفظ"}
          </button>
          {status === "draft" ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => save("published")}
              className="rounded-xl bg-[#F7B548] px-5 py-2.5 font-black text-[#07152E] disabled:opacity-60"
            >
              حفظ ونشر للزوار
            </button>
          ) : (
            <button
              type="button"
              disabled={pending}
              onClick={() => save("draft")}
              className="rounded-xl border border-amber-300 px-5 py-2.5 font-bold text-amber-700 disabled:opacity-60"
            >
              إخفاء (تحويل لمسودة)
            </button>
          )}
          <a
            href={`/lp/${page.slug}`}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700"
          >
            <ExternalLink className="h-4 w-4" /> فتح الصفحة
          </a>
          {dirty ? <span className="text-sm font-semibold text-amber-700">فيه تعديلات لسه ما اتحفظتش</span> : null}
          {message ? (
            <span className={`text-sm font-semibold ${message.ok ? "text-emerald-700" : "text-red-600"}`}>{message.text}</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
