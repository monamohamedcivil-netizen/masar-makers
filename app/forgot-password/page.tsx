"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const goToLogin = async () => {
    try {
      const supabase = createClient();

      // Ensure no active/recovery session causes /login
      // to redirect the user back to the platform homepage.
      await supabase.auth.signOut();
    } finally {
      router.replace("/login");
      router.refresh();
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    const submittedEmail = email.trim().toLowerCase();

    if (!submittedEmail) {
      setError("يرجى إدخال البريد الإلكتروني.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/reset-password`;

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        submittedEmail,
        { redirectTo }
      );

      if (resetError) {
        console.error("Password reset email error:", resetError);
        setError("تعذر إرسال رابط إعادة تعيين كلمة المرور حاليًا. حاولي مرة أخرى.");
        return;
      }

      setSuccess(
        "إذا كان هذا البريد مرتبطًا بحساب على المنصة، فسيصلك رابط إعادة تعيين كلمة المرور. تحققي أيضًا من البريد غير المرغوب فيه (Spam)."
      );
    } catch (caughtError) {
      console.error("Forgot password error:", caughtError);
      setError("حدث خطأ غير متوقع. حاولي مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="نسيت كلمة المرور؟"
      description="أدخل بريدك الإلكتروني وسنرسل لك رابطًا آمنًا لإنشاء كلمة مرور جديدة."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="mb-2 block text-[13px] font-black text-[#07152E]">
            البريد الإلكتروني
          </label>
          <div className="relative">
            <Mail size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
              className="h-[52px] w-full rounded-2xl border border-[#DCE3EC] bg-[#FAFBFC] pr-12 pl-4 text-left text-[14px] font-semibold text-[#07152E] outline-none transition placeholder:text-slate-400 focus:border-[#F7B548] focus:bg-white focus:ring-4 focus:ring-[#F7B548]/10"
            />
          </div>
        </div>

        {success && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[12px] font-bold leading-6 text-emerald-700">
            {success}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[12px] font-bold leading-6 text-red-600">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex h-[52px] w-full items-center justify-center gap-3 rounded-2xl bg-[#07152E] text-[15px] font-black text-white shadow-[0_12px_25px_rgba(7,21,46,0.16)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#F7B548] hover:text-[#07152E] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "جاري إرسال الرابط..." : "إرسال رابط إعادة التعيين"}
          {!loading && <ArrowLeft size={18} />}
        </button>
      </form>

      <button
        type="button"
        onClick={goToLogin}
        className="mt-6 flex h-[50px] w-full items-center justify-center rounded-2xl border border-[#07152E]/20 bg-[#F7F8FA] text-[14px] font-black text-[#07152E] transition duration-300 hover:bg-[#07152E] hover:text-white"
      >
        العودة إلى تسجيل الدخول
      </button>
    </AuthShell>
  );
}