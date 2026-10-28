"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Copy, ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";

import { deleteLandingPage, duplicateLandingPage } from "@/lib/actions/landing-pages";

type Item = {
  id: string;
  slug: string;
  title: string;
  status: "draft" | "published";
  updatedAt: string;
};

export default function LandingPagesList({ pages }: { pages: Item[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [source, setSource] = useState<string>(pages[0]?.id ?? "");
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  function create() {
    setMessage(null);
    startTransition(async () => {
      const result = await duplicateLandingPage(source || null, slug, title);
      if (!result.ok) {
        setMessage({ ok: false, text: result.error });
        return;
      }
      router.push(`/admin/content/landing-pages/${result.data?.id}`);
    });
  }

  function remove(item: Item) {
    if (!window.confirm(`حذف صفحة «${item.title}» نهائيًا؟`)) return;
    setMessage(null);
    startTransition(async () => {
      const result = await deleteLandingPage(item.id);
      setMessage(result.ok ? { ok: true, text: "اتحذفت الصفحة." } : { ok: false, text: result.error });
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">الصفحة</th>
              <th className="px-4 py-3 font-semibold">الرابط</th>
              <th className="px-4 py-3 font-semibold">الحالة</th>
              <th className="px-4 py-3 font-semibold">آخر تعديل</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {pages.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  لا توجد صفحات بعد. أنشئي أول صفحة من الأسفل.
                </td>
              </tr>
            ) : null}
            {pages.map((item) => (
              <tr key={item.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-semibold text-[#07152E]">{item.title}</td>
                <td className="px-4 py-3 font-mono text-xs" dir="ltr">
                  /lp/{item.slug}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      item.status === "published" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {item.status === "published" ? "منشورة" : "مسودة"}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {new Date(item.updatedAt).toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" })}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <Link
                      href={`/admin/content/landing-pages/${item.id}`}
                      className="inline-flex items-center gap-1 rounded-lg bg-[#07152E] px-3 py-1.5 text-xs font-bold text-white"
                    >
                      <Pencil className="h-3.5 w-3.5" /> تعديل
                    </Link>
                    <a
                      href={`/lp/${item.slug}`}
                      target="_blank"
                      rel="noopener"
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> فتح
                    </a>
                    <button
                      type="button"
                      onClick={() => setSource(item.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700"
                    >
                      <Copy className="h-3.5 w-3.5" /> استخدميها كنموذج
                    </button>
                    {item.status === "draft" ? (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => remove(item)}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> حذف
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-1 text-lg font-black text-[#07152E]">صفحة جديدة لإعلان جديد</h2>
        <p className="mb-4 text-sm text-slate-500">
          الصفحة الجديدة بتتعمل نسخة من النموذج اللي تختاريه (بنفس التصميم والأقسام)، وبتبدأ مسودة لحد ما تنشريها.
        </p>
        <div className="grid gap-3 md:grid-cols-4">
          <label className="grid gap-1 text-sm font-semibold">
            النموذج
            <select
              value={source}
              onChange={(event) => setSource(event.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2"
            >
              {pages.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
              <option value="">نموذج Civil 3D الأصلي</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            اسم الصفحة (للوحة التحكم)
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="CSD — إعلان ديسمبر"
              className="rounded-xl border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            الرابط بالإنجليزي
            <input
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              placeholder="csd-dec"
              dir="ltr"
              className="rounded-xl border border-slate-200 px-3 py-2 font-mono"
            />
          </label>
          <div className="flex items-end">
            <button
              type="button"
              disabled={pending}
              onClick={create}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#F7B548] px-4 py-2.5 font-black text-[#07152E] disabled:opacity-60"
            >
              <Plus className="h-4 w-4" /> إنشاء الصفحة
            </button>
          </div>
        </div>
        {message ? (
          <p className={`mt-3 text-sm font-semibold ${message.ok ? "text-emerald-700" : "text-red-600"}`}>{message.text}</p>
        ) : null}
      </div>
    </div>
  );
}
