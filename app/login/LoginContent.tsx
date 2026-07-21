"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
} from "lucide-react";

import AuthShell from "@/components/auth/AuthShell";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
const requestedNext = searchParams.get("next");

const safeNext =
  requestedNext &&
  requestedNext.startsWith("/") &&
  !requestedNext.startsWith("//")
    ? requestedNext
    : "/dashboard";
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const confirmed = searchParams.get("confirmed");
  const confirmationError = searchParams.get("error");

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    const formData = new FormData(event.currentTarget);

    const email = String(
      formData.get("email") ?? ""
    )
      .trim()
      .toLowerCase();

    const password = String(
      formData.get("password") ?? ""
    );

    if (!email || !password) {
      setError(
        "يرجى إدخال البريد الإلكتروني وكلمة المرور."
      );
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();

      const {
        data: signInData,
        error: signInError,
      } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        const errorMessage =
          signInError.message.toLowerCase();

        if (
          errorMessage.includes(
            "email not confirmed"
          )
        ) {
          setError(
            "يرجى تأكيد بريدك الإلكتروني أولًا، ثم محاولة تسجيل الدخول."
          );
        } else if (
          errorMessage.includes(
            "invalid login credentials"
          )
        ) {
          setError(
            "البريد الإلكتروني أو كلمة المرور غير صحيحة."
          );
        } else {
          setError(signInError.message);
        }

        return;
      }

      if (!signInData.user) {
        setError(
          "تعذر تسجيل الدخول. حاولي مرة أخرى."
        );
        return;
      }

      
router.push(safeNext);
router.refresh();

    } catch (caughtError) {
      console.error(
        "Login error:",
        caughtError
      );

      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "حدث خطأ غير متوقع أثناء تسجيل الدخول."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="مرحبًا بعودتك"
      description="سجّل دخولك لاستكمال رحلاتك واستكشاف جميع محتويات المنصة."
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        {confirmed === "true" && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[12px] font-bold leading-6 text-emerald-700">
            تم تأكيد بريدك الإلكتروني بنجاح. يمكنك الآن تسجيل الدخول.
          </div>
        )}

        {confirmationError && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] font-bold leading-6 text-amber-700">
            تعذر استخدام رابط التأكيد. ربما تم استخدامه مسبقًا أو انتهت صلاحيته.
          </div>
        )}

        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-[13px] font-black text-[#07152E]"
          >
            البريد الإلكتروني
          </label>

          <div className="relative">
            <Mail
              size={18}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="name@example.com"
              className="
                h-[52px] w-full rounded-2xl
                border border-[#DCE3EC]
                bg-[#FAFBFC]
                pr-12 pl-4
                text-left text-[14px]
                font-semibold
                text-[#07152E]
                outline-none
                transition
                placeholder:text-slate-400
                focus:border-[#F7B548]
                focus:bg-white
                focus:ring-4
                focus:ring-[#F7B548]/10
              "
            />
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label
              htmlFor="password"
              className="text-[13px] font-black text-[#07152E]"
            >
              كلمة المرور
            </label>

            <button
              type="button"
              className="text-[12px] font-black text-[#C88712] transition hover:underline"
            >
              نسيت كلمة المرور؟
            </button>
          </div>

          <div className="relative">
            <LockKeyhole
              size={18}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              id="password"
              name="password"
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="
                h-[52px] w-full rounded-2xl
                border border-[#DCE3EC]
                bg-[#FAFBFC]
                pr-12 pl-12
                text-left text-[14px]
                font-semibold
                text-[#07152E]
                outline-none
                transition
                placeholder:text-slate-400
                focus:border-[#F7B548]
                focus:bg-white
                focus:ring-4
                focus:ring-[#F7B548]/10
              "
            />

            <button
              type="button"
              onClick={() =>
                setShowPassword(
                  (current) => !current
                )
              }
              aria-label={
                showPassword
                  ? "إخفاء كلمة المرور"
                  : "إظهار كلمة المرور"
              }
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-[#07152E]"
            >
              {showPassword ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
              )}
            </button>
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 accent-[#F7B548]"
          />

          <span className="text-[12px] font-bold text-slate-600">
            تذكر تسجيل دخولي
          </span>
        </label>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[12px] font-bold leading-6 text-red-600">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="
            flex h-[52px] w-full
            items-center justify-center gap-3
            rounded-2xl
            bg-[#07152E]
            text-[15px]
            font-black
            text-white
            shadow-[0_12px_25px_rgba(7,21,46,0.16)]
            transition duration-300
            hover:-translate-y-0.5
            hover:bg-[#F7B548]
            hover:text-[#07152E]
            disabled:cursor-not-allowed
            disabled:opacity-60
          "
        >
          {loading
            ? "جاري تسجيل الدخول..."
            : "تسجيل الدخول"}

          {!loading && (
            <ArrowLeft size={18} />
          )}
        </button>
      </form>

      <div className="my-6 flex items-center gap-4">
        <span className="h-px flex-1 bg-[#E5EAF0]" />

        <span className="text-[11px] font-bold text-slate-400">
          ليس لديك حساب؟
        </span>

        <span className="h-px flex-1 bg-[#E5EAF0]" />
      </div>

      <Link
        href="/register"
        className="
          flex h-[50px] w-full
          items-center justify-center
          rounded-2xl
          border border-[#F7B548]/60
          bg-[#FFF9EB]
          text-[14px]
          font-black
          text-[#A66F09]
          transition duration-300
          hover:bg-[#F7B548]
          hover:text-[#07152E]
        "
      >
        إنشاء حساب جديد
      </Link>
    </AuthShell>
  );
}