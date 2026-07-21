"use client";
import { useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { uploadCourseMedia } from "@/lib/actions/admin/media";

export default function ImageUploadField({ label, value, onChange, folder }: { label: string; value: string; onChange: (url: string, path?: string) => void; folder: string }) {
  const [loading, setLoading] = useState(false);
  async function upload(file?: File) {
    if (!file) return;
    setLoading(true);
    const fd = new FormData(); fd.append("file", file); fd.append("folder", folder);
    const result = await uploadCourseMedia(fd);
    setLoading(false);
    if (!result.success || !result.url) return alert(result.message || "تعذر رفع الصورة.");
    onChange(result.url, result.path);
  }
  return <div><label className="mb-2 block text-sm font-bold text-[#07152E]">{label}</label><div className="flex gap-2"><input value={value} onChange={e=>onChange(e.target.value)} placeholder="رابط الصورة أو ارفعي ملفاً" className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 px-3 outline-none focus:border-[#F7B548]"/><label className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-4 font-bold text-slate-600 hover:bg-slate-50">{loading?<Loader2 className="h-4 w-4 animate-spin"/>:<ImagePlus className="h-4 w-4"/>}رفع<input type="file" accept="image/*" className="hidden" disabled={loading} onChange={e=>upload(e.target.files?.[0])}/></label></div></div>;
}
