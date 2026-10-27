"use client";

import { useEffect, useState } from "react";

import {
  deleteConvertedOriginals,
  listConvertedOriginals,
  listOldCourseImages,
  replaceCourseImageUrl,
  type ConvertedOriginal,
  type OldImage,
} from "@/lib/actions/admin/webp-images";
import { createClient } from "@/lib/supabase/client";
import { compressImageForUpload } from "@/lib/utils/compress-image";

type Status = { state: "waiting" | "working" | "done" | "failed"; note?: string; newSize?: number; oldSize?: number };

const mb = (bytes: number | null | undefined) => (bytes ? `${(bytes / 1048576).toFixed(2)} MB` : "—");

export default function WebpImagesTool() {
  const [images, setImages] = useState<OldImage[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<Record<string, Status>>({});
  const [running, setRunning] = useState(false);
  const [originals, setOriginals] = useState<ConvertedOriginal[] | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteNote, setDeleteNote] = useState<string | null>(null);

  const loadOriginals = async () => {
    const result = await listConvertedOriginals();
    if (result.ok) setOriginals(result.items);
    else setDeleteNote(result.error);
  };

  const deleteOriginals = async () => {
    const safe = (originals ?? []).filter((o) => !o.stillUsed);
    if (!safe.length) return;
    if (
      !window.confirm(
        `حذف ${safe.length} صورة أصلية (PNG / JPG) نهائيًا من Supabase؟\nالصفحات تستخدم نسخ WebP الجديدة، والحذف لا يمكن التراجع عنه.`,
      )
    ) {
      return;
    }
    setDeleting(true);
    setDeleteNote(null);
    const result = await deleteConvertedOriginals();
    setDeleting(false);
    if (!result.ok) {
      setDeleteNote(result.error);
      return;
    }
    setDeleteNote(`تم حذف ${result.deleted} صورة أصلية ووفّرنا ${mb(result.freed)}${result.kept ? ` • ${result.kept} صورة ما زالت مستخدمة ولم تُحذف` : ""}.`);
    void loadOriginals();
  };

  const load = async () => {
    setError(null);
    const result = await listOldCourseImages();
    if (!result.ok) setError(result.error);
    else setImages(result.images);
  };

  useEffect(() => {
    void load();
    void loadOriginals();
  }, []);

  const setOne = (url: string, s: Status) => setStatus((prev) => ({ ...prev, [url]: s }));

  const convertAll = async () => {
    if (!images?.length) return;
    setRunning(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("يجب تسجيل الدخول أولًا.");
      setRunning(false);
      return;
    }
    for (const image of images) {
      if (status[image.url]?.state === "done") continue;
      setOne(image.url, { state: "working" });
      try {
        const response = await fetch(image.url, { cache: "no-store" });
        if (!response.ok) throw new Error(`تعذر تنزيل الصورة (${response.status})`);
        const blob = await response.blob();
        const name = decodeURIComponent(image.url.split("/").pop() ?? "image.png");
        const original = new File([blob], name, { type: blob.type || "image/png" });
        const webp = await compressImageForUpload(original);
        if (webp.type !== "image/webp") throw new Error("المتصفح لم يستطع التحويل إلى WebP");
        const path = [user.id, "webp-converted", `${crypto.randomUUID()}.webp`].join("/");
        const { error: uploadError } = await supabase.storage
          .from("course-images")
          .upload(path, webp, { cacheControl: "31536000", contentType: "image/webp", upsert: false });
        if (uploadError) throw uploadError;
        const newUrl = supabase.storage.from("course-images").getPublicUrl(path).data.publicUrl;
        const result = await replaceCourseImageUrl(image.url, newUrl, { oldSize: blob.size, newSize: webp.size });
        if (!result.ok) throw new Error(result.error);
        setOne(image.url, { state: "done", oldSize: blob.size, newSize: webp.size, note: `${result.rows} صفحة` });
      } catch (e) {
        setOne(image.url, { state: "failed", note: e instanceof Error ? e.message : "خطأ" });
      }
    }
    setRunning(false);
    void loadOriginals();
  };

  const done = Object.values(status).filter((s) => s.state === "done");
  const before = done.reduce((t, s) => t + (s.oldSize ?? 0), 0);
  const after = done.reduce((t, s) => t + (s.newSize ?? 0), 0);

  return (
    <div dir="rtl" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-black text-[#07152E]">تحويل صور صفحات الكورسات القديمة إلى WebP</h2>
      <p className="mt-1 text-sm text-slate-500">
        الصور PNG / JPG المستخدمة في محتوى صفحات الكورسات تتحول في متصفحك إلى WebP، وتُرفع بجانب الأصل، ثم تتغير روابطها في الصفحات.
        الصور الأصلية لا تُحذف. اترك الصفحة مفتوحة حتى ينتهي التحويل.
      </p>

      {error ? <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p> : null}

      {images === null ? (
        <p className="mt-4 text-sm text-slate-500">جارٍ تحميل قائمة الصور…</p>
      ) : images.length === 0 ? (
        <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-700">لا توجد صور PNG / JPG في صفحات الكورسات. كل الصور WebP ✓</p>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={running}
              onClick={() => void convertAll()}
              className="rounded-xl bg-[#07152E] px-5 py-2.5 text-sm font-black text-white disabled:opacity-60"
            >
              {running ? "جارٍ التحويل…" : `تحويل ${images.length} صورة`}
            </button>
            <span className="text-sm font-bold text-slate-600">
              {done.length ? `تم ${done.length} من ${images.length}: ${mb(before)} ← ${mb(after)}` : `${images.length} صورة PNG / JPG`}
            </span>
            {!running && done.length ? (
              <button type="button" onClick={() => { setStatus({}); setImages(null); void load(); }} className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold">
                تحديث القائمة
              </button>
            ) : null}
          </div>
          <div className="mt-4 max-h-[60vh] overflow-auto rounded-xl border border-slate-100">
            <table className="w-full text-right text-xs">
              <thead className="sticky top-0 bg-slate-50 text-[11px] font-black text-slate-500">
                <tr>
                  <th className="px-2 py-2">الصورة</th>
                  <th className="px-2 py-2">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {images.map((image) => {
                  const s = status[image.url];
                  return (
                    <tr key={image.url} className="border-t border-slate-100">
                      <td className="max-w-[340px] truncate px-2 py-1.5" dir="ltr" title={image.url}>
                        {decodeURIComponent(image.url.split("/").pop() ?? "")}
                      </td>
                      <td className="px-2 py-1.5 font-bold">
                        {!s ? <span className="text-slate-400">لم يبدأ</span> : null}
                        {s?.state === "working" ? <span className="text-amber-600">جارٍ…</span> : null}
                        {s?.state === "done" ? <span className="text-emerald-600">✓ {mb(s.oldSize)} ← {mb(s.newSize)} ({s.note})</span> : null}
                        {s?.state === "failed" ? <span className="text-red-600">✕ {s.note}</span> : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div className="mt-6 border-t border-slate-100 pt-5">
        <h3 className="text-base font-black text-[#07152E]">حذف الصور الأصلية بعد التحويل</h3>
        <p className="mt-1 text-sm text-slate-500">
          بعد ما تتأكدي إن صفحات الكورسات بتعرض الصور كويس، احذفي النسخ الأصلية PNG / JPG لتوفير مساحة التخزين.
          الحذف يشمل فقط الصور التي تم تحويلها ولم تعد مستخدمة في أي صفحة، وهو نهائي.
        </p>
        {originals === null ? (
          <p className="mt-3 text-sm text-slate-500">جارٍ التحميل…</p>
        ) : originals.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">لا توجد صور أصلية محوّلة في انتظار الحذف.</p>
        ) : (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={deleting || running || (originals ?? []).filter((o) => !o.stillUsed).length === 0}
              onClick={() => void deleteOriginals()}
              className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-black text-white disabled:opacity-50"
            >
              {deleting ? "جارٍ الحذف…" : `حذف ${(originals ?? []).filter((o) => !o.stillUsed).length} صورة أصلية`}
            </button>
            <span className="text-sm font-bold text-slate-600">
              المساحة: {mb((originals ?? []).filter((o) => !o.stillUsed).reduce((t, o) => t + (o.oldSize ?? 0), 0))}
              {originals.some((o) => o.stillUsed) ? ` • ${originals.filter((o) => o.stillUsed).length} ما زالت مستخدمة ولن تُحذف` : ""}
            </span>
          </div>
        )}
        {deleteNote ? <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm font-bold text-[#07152E]">{deleteNote}</p> : null}
      </div>
    </div>
  );
}
