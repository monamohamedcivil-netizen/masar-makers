"use client";

export default function DashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main dir="rtl" className="flex min-h-screen items-center justify-center bg-[#F7F8FA] p-6 text-center text-[#07152E]">
      <div className="max-w-md border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-black">تعذر تحميل رحلتك الآن</h1>
        <p className="mt-2 text-sm font-semibold text-slate-500">تحققي من الاتصال ثم أعيدي المحاولة.</p>
        <button type="button" onClick={reset} className="mt-5 h-11 bg-[#07152E] px-6 text-sm font-black text-[#F7B548]">إعادة المحاولة</button>
      </div>
    </main>
  );
}
