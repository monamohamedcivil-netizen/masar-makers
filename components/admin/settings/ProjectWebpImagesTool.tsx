"use client";

import { useEffect, useState } from "react";

import {
  finalizeProjectImage,
  listOldProjectImages,
  prepareProjectImageUpload,
  type OldProjectImage,
} from "@/lib/actions/admin/project-webp-images";
import { createClient } from "@/lib/supabase/client";
import { compressImageForUpload } from "@/lib/utils/compress-image";

type Status = { state: "working" | "done" | "failed"; note?: string; oldSize?: number; newSize?: number };

const mb = (bytes: number | null | undefined) => (bytes ? `${(bytes / 1048576).toFixed(2)} MB` : "—");

export default function ProjectWebpImagesTool() {
  const [images, setImages] = useState<OldProjectImage[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<Record<string, Status>>({});
  const [running, setRunning] = useState(false);

  const load = async () => {
    setError(null);
    const result = await listOldProjectImages();
    if (!result.ok) setError(result.error);
    else setImages(result.images);
  };

  useEffect(() => {
    void load();
  }, []);

  const setOne = (path: string, s: Status) => setStatus((prev) => ({ ...prev, [path]: s }));

  const convertAll = async () => {
    if (!images?.length) return;
    setRunning(true);
    const supabase = createClient();
    for (const image of images) {
      if (status[image.path]?.state === "done") continue;
      setOne(image.path, { state: "working" });
      try {
        // الصورة تُقرأ من مسار المنصة نفسه (مسموح للأدمن).
        const response = await fetch(`/api/project-media?p=${encodeURIComponent(image.path)}`, { cache: "no-store" });
        if (!response.ok) throw new Error(`تعذر تنزيل الصورة (${response.status})`);
        const blob = await response.blob();
        const original = new File([blob], image.path.split("/").pop() ?? "image.png", { type: blob.type || "image/png" });
        const webp = await compressImageForUpload(original);
        if (webp.type !== "image/webp") throw new Error("المتصفح لم يستطع التحويل إلى WebP");

        const prepared = await prepareProjectImageUpload(image.path);
        if (!prepared.ok) throw new Error(prepared.error);
        const { error: uploadError } = await supabase.storage
          .from("student-projects")
          .uploadToSignedUrl(prepared.newPath, prepared.token, webp, { contentType: "image/webp" });
        if (uploadError) throw uploadError;

        const result = await finalizeProjectImage(image.path, prepared.newPath, { oldSize: blob.size, newSize: webp.size });
        if (!result.ok) throw new Error(result.error);
        setOne(image.path, { state: "done", oldSize: blob.size, newSize: webp.size });
      } catch (e) {
        setOne(image.path, { state: "failed", note: e instanceof Error ? e.message : "خطأ" });
      }
    }
    setRunning(false);
  };

  const done = Object.values(status).filter((s) => s.state === "done");
  const before = done.reduce((t, s) => t + (s.oldSize ?? 0), 0);
  const after = done.reduce((t, s) => t + (s.newSize ?? 0), 0);

  return (
    <div dir="rtl" className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-black text-[#07152E]">تحويل صور مشاريع الطلاب القديمة إلى WebP</h2>
      <p className="mt-1 text-sm text-slate-500">
        صور المشاريع PNG / JPG تتحول في متصفحك إلى WebP، وتُرفع بجانب الأصل، ثم يتغير مسار الصورة في المشروع.
        الصور الأصلية لا تُحذف. اترك الصفحة مفتوحة حتى ينتهي التحويل.
      </p>

      {error ? <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p> : null}

      {images === null ? (
        <p className="mt-4 text-sm text-slate-500">جارٍ تحميل قائمة الصور…</p>
      ) : images.length === 0 ? (
        <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-700">لا توجد صور PNG / JPG في مشاريع الطلاب. كل الصور WebP ✓</p>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={running}
              onClick={() => void convertAll()}
              className="cursor-pointer rounded-xl bg-[#07152E] px-5 py-2.5 text-sm font-black text-white disabled:opacity-60"
            >
              {running ? "جارٍ التحويل…" : `تحويل ${images.length} صورة`}
            </button>
            <span className="text-sm font-bold text-slate-600">
              {done.length ? `تم ${done.length} من ${images.length}: ${mb(before)} ← ${mb(after)}` : `${images.length} صورة PNG / JPG`}
            </span>
            {!running && done.length ? (
              <button
                type="button"
                onClick={() => {
                  setStatus({});
                  setImages(null);
                  void load();
                }}
                className="cursor-pointer rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold"
              >
                تحديث القائمة
              </button>
            ) : null}
          </div>
          <div className="mt-4 overflow-auto rounded-xl border border-slate-100">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-[11px] font-black text-slate-500">
                <tr>
                  <th className="px-2 py-2">المشروع</th>
                  <th className="px-2 py-2">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {images.map((image) => {
                  const s = status[image.path];
                  return (
                    <tr key={image.path} className="border-t border-slate-100">
                      <td className="max-w-[340px] truncate px-2 py-1.5" title={image.path}>
                        {image.projectTitle || image.path.split("/").pop()}
                      </td>
                      <td className="px-2 py-1.5 font-bold">
                        {!s ? <span className="text-slate-400">لم يبدأ</span> : null}
                        {s?.state === "working" ? <span className="text-amber-600">جارٍ…</span> : null}
                        {s?.state === "done" ? (
                          <span className="text-emerald-600">
                            ✓ {mb(s.oldSize)} ← {mb(s.newSize)}
                          </span>
                        ) : null}
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
    </div>
  );
}
