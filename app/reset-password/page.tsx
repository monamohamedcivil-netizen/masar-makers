"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, LockKeyhole } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const goToLogin = async () => {
  const supabase = createClient();

  await supabase.auth.signOut();

  router.replace("/login");
  router.refresh();
};
    const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [canReset, setCanReset] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      if (session) setCanReset(true);
      setCheckingSession(false);
    };

    void checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        if (event === "PASSWORD_RECOVERY" || Boolean(session)) {
          setCanReset(true);
          setCheckingSession(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (password.length < 8) {
      setError("يجب ألا تقل كلمة المرور الجديدة عن 8 أحرف.");
      return;
    }

    if (password !== confirmPassword) {
      setError("كلمتا المرور الجديدتان غير متطابقتين.");
      return;
    }

    if (!canReset) {
      setError("رابط إعادة تعيين كلمة المرور غير صالح أو انتهت صلاحيته. اطلبي رابطًا جديدًا.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        console.error("Update password error:", updateError);
        setError("تعذر تحديث كلمة المرور. قد يكون الرابط قد انتهت صلاحيته، اطلبي رابطًا جديدًا.");
        return;
      }

      setSuccess("تم تغيير كلمة المرور بنجاح. سيتم تحويلك إلى صفحة تسجيل الدخول.");
      setPassword("");
      setConfirmPassword("");
      await supabase.auth.signOut();

      window.setTimeout(() => {
        router.replace("/login?password_reset=true");
      }, 1200);
    } catch (caughtError) {
      console.error("Reset password error:", caughtError);
      setError("حدث خطأ غير متوقع أثناء تغيير كلمة المرور.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <AuthShell title="إعادة تعيين كلمة المرور" description="جاري التحقق من رابط الاستعادة...">
        <div className="rounded-xl border border-[#DCE3EC] bg-[#FAFBFC] px-4 py-4 text-center text-[12px] font-bold text-slate-500">
          جاري التحقق...
        </div>
      </AuthShell>
    );
  }

  if (!canReset) {
    return (
      <AuthShell title="رابط غير صالح" description="تعذر التحقق من رابط إعادة تعيين كلمة المرور.">
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] font-bold leading-6 text-amber-700">
          قد يكون الرابط قد انتهت صلاحيته أو تم استخدامه مسبقًا. اطلبي رابط استعادة جديدًا.
        </div>
        <Link href="/forgot-password" className="mt-5 flex h-[50px] w-full items-center justify-center rounded-2xl bg-[#07152E] text-[14px] font-black text-white transition hover:bg-[#F7B548] hover:text-[#07152E]">
          طلب رابط جديد
        </Link>
       <button
  type="button"
  onClick={goToLogin}
  className="mt-3 flex h-[48px] w-full items-center justify-center rounded-2xl border border-[#07152E]/20 bg-[#F7F8FA] text-[13px] font-black text-[#07152E] transition hover:bg-[#07152E] hover:text-white"
>
  العودة إلى تسجيل الدخول
</button>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="كلمة مرور جديدة" description="أنشئ كلمة مرور جديدة لحسابك على منصة صناع المسار.">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="password" className="mb-2 block text-[13px] font-black text-[#07152E]">
            كلمة المرور الجديدة
          </label>
          <div className="relative">
            <LockKeyhole size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="8 أحرف على الأقل"
              className="h-[52px] w-full rounded-2xl border border-[#DCE3EC] bg-[#FAFBFC] pr-12 pl-12 text-left text-[14px] font-semibold text-[#07152E] outline-none transition placeholder:text-slate-400 focus:border-[#F7B548] focus:bg-white focus:ring-4 focus:ring-[#F7B548]/10"
            />
            <button type="button" onClick={() => setShowPassword((current) => !current)} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-[#07152E]">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="mb-2 block text-[13px] font-black text-[#07152E]">
            تأكيد كلمة المرور الجديدة
          </label>
          <div className="relative">
            <LockKeyhole size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              required
              minLength={8}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="أعد كتابة كلمة المرور"
              className="h-[52px] w-full rounded-2xl border border-[#DCE3EC] bg-[#FAFBFC] pr-12 pl-12 text-left text-[14px] font-semibold text-[#07152E] outline-none transition placeholder:text-slate-400 focus:border-[#F7B548] focus:bg-white focus:ring-4 focus:ring-[#F7B548]/10"
            />
            <button type="button" onClick={() => setShowConfirmPassword((current) => !current)} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-[#07152E]">
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {success && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[12px] font-bold leading-6 text-emerald-700">{success}</div>}
        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[12px] font-bold leading-6 text-red-600">{error}</div>}

        <button type="submit" disabled={loading} className="flex h-[52px] w-full items-center justify-center gap-3 rounded-2xl bg-[#07152E] text-[15px] font-black text-white shadow-[0_12px_25px_rgba(7,21,46,0.16)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#F7B548] hover:text-[#07152E] disabled:cursor-not-allowed disabled:opacity-60">
          {loading ? "جاري تغيير كلمة المرور..." : "حفظ كلمة المرور الجديدة"}
          {!loading && <ArrowLeft size={18} />}
        </button>
      </form>
    </AuthShell>
  );
}