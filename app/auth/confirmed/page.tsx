import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
} from "lucide-react";

export default function EmailConfirmedPage() {
  return (
    <main
      dir="rtl"
      className="flex min-h-screen items-center justify-center bg-[#F5F7FA] px-6"
    >
      <div className="w-full max-w-[520px] rounded-[32px] border border-[#E0E6EE] bg-white p-10 text-center shadow-[0_24px_65px_rgba(7,21,46,0.10)]">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <BadgeCheck size={42} />
        </div>

        <h1 className="mt-6 text-[30px] font-black text-[#07152E]">
          تم تأكيد بريدك بنجاح
        </h1>

        <p className="mt-3 text-[14px] font-medium leading-7 text-slate-500">
          أصبح حسابك في صناع المسار جاهزًا، ويمكنك الآن تسجيل الدخول واستكشاف
          رحلتك التعليمية.
        </p>

        <Link
          href="/login"
          className="mt-7 flex h-[52px] w-full items-center justify-center gap-3 rounded-2xl bg-[#07152E] text-[15px] font-black text-white transition hover:bg-[#F7B548] hover:text-[#07152E]"
        >
          الانتقال إلى تسجيل الدخول
          <ArrowLeft size={18} />
        </Link>
      </div>
    </main>
  );
}