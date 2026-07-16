"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Globe2,
  LockKeyhole,
  Mail,
  Phone,
  UserRound,
} from "lucide-react";

import AuthShell from "@/components/auth/AuthShell";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
const [phone, setPhone] = useState("");
const [country, setCountry] = useState("");
const [jobTitle, setJobTitle] = useState("");
const [experienceLevel, setExperienceLevel] = useState("");
const [specialty, setSpecialty] = useState("");

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    const form = event.currentTarget;
    const formData = new FormData(form);

    const fullName = String(
      formData.get("name") ?? ""
    ).trim();

    const email = String(
      formData.get("email") ?? ""
    )
      .trim()
      .toLowerCase();

    const phone = String(
      formData.get("phone") ?? ""
    ).trim();

    const country = String(
  formData.get("country") ?? ""
).trim();

    const password = String(
      formData.get("password") ?? ""
    );

    const confirmPassword = String(
      formData.get("confirmPassword") ?? ""
    );

    if (!fullName) {
      setError("يرجى إدخال الاسم الكامل.");
      setLoading(false);
      return;
    }

    if (!email) {
      setError("يرجى إدخال البريد الإلكتروني.");
      setLoading(false);
      return;
    }

    if (!phone) {
      setError("يرجى إدخال رقم الهاتف.");
      setLoading(false);
      return;
    }
if (!country) {
  setError("يرجى اختيار الدولة.");
  setLoading(false);
  return;
}
    if (password.length < 8) {
      setError("يجب ألا تقل كلمة المرور عن 8 أحرف.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("كلمتا المرور غير متطابقتين.");
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();

      const {
  data: signUpData,
  error: signUpError,
} = await supabase.auth.signUp({
  email: email.trim(),
  password,
  options: {
    emailRedirectTo:
      `${window.location.origin}/auth/callback`,
    data: {
      full_name: fullName.trim(),
      phone: phone.trim(),
      country,
      job_title: jobTitle,
      experience_level: experienceLevel,
      specialty,
    },
  },
});

      if (signUpError) {
        if (
          signUpError.message
            .toLowerCase()
            .includes("already registered")
        ) {
          setError(
            "هذا البريد الإلكتروني مسجل بالفعل. يمكنك تسجيل الدخول."
          );
        } else {
          setError(signUpError.message);
        }

        return;
      }

      if (!signUpData.user) {
        setError(
          "تعذر إنشاء الحساب. حاولي مرة أخرى."
        );
        return;
      }

      setSuccess(
        "تم إنشاء الحساب بنجاح. أرسلنا رسالة تأكيد إلى بريدك الإلكتروني. افتحي الرسالة واضغطي على رابط التأكيد."
      );

      form.reset();
    } catch (caughtError) {
      console.error(
        "Registration error:",
        caughtError
      );

      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "حدث خطأ غير متوقع أثناء إنشاء الحساب."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="أنشئ حسابك"
      description="انضم إلى صناع المسار وابدأ استكشاف المسارات والورش والمحاضرات المجانية."
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        {/* Full Name */}
        <div>
          <label
            htmlFor="name"
            className="mb-2 block text-[13px] font-black text-[#07152E]"
          >
            الاسم الكامل
          </label>

          <div className="relative">
            <UserRound
              size={18}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              id="name"
              name="name"
              type="text"
              required
              autoComplete="name"
              placeholder="اكتب اسمك الكامل"
              className="
                h-[50px] w-full rounded-2xl
                border border-[#DCE3EC]
                bg-[#FAFBFC]
                pr-12 pl-4
                text-[14px] font-semibold
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

        {/* Email */}
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
                h-[50px] w-full rounded-2xl
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

        {/* Phone */}
<div>
  <label className="mb-2 block text-[11px] font-black text-[#07152E]">
    رقم الهاتف مع كود الدولة
  </label>

  <input
    type="tel"
    value={phone}
    onChange={(event) =>
      setPhone(event.target.value)
    }
    required
    dir="ltr"
    placeholder="+966 5X XXX XXXX"
    className="
      h-[46px] w-full rounded-[16px]
      border border-[#D8DEE7]
      bg-[#F8FAFC] px-4
      text-left text-[12px] font-medium
      text-[#07152E] outline-none
      transition focus:border-[#F7B548]
      focus:bg-white
    "
  />
</div>
        
{/* Country */}
<div>
  <label className="mb-2 block text-[11px] font-black text-[#07152E]">
    الدولة
  </label>

  <select
    value={country}
    onChange={(event) =>
      setCountry(event.target.value)
    }
    required
    className="
      h-[46px] w-full rounded-[16px]
      border border-[#D8DEE7]
      bg-[#F8FAFC] px-4
      text-[12px] font-medium
      text-[#07152E] outline-none
      transition focus:border-[#F7B548]
      focus:bg-white
    "
  >
    <option value="">اختر الدولة</option>
    <option value="Saudi Arabia">السعودية</option>
    <option value="Egypt">مصر</option>
    <option value="United Arab Emirates">
      الإمارات
    </option>
    <option value="Oman">عُمان</option>
    <option value="Iraq">العراق</option>
    <option value="Libya">ليبيا</option>
    <option value="Sudan">السودان</option>
    <option value="Syria">سوريا</option>
    <option value="Nigeria">نيجيريا</option>
    <option value="Other">دولة أخرى</option>
  </select>
</div>

<div>
  <label className="mb-2 block text-[11px] font-black text-[#07152E]">
    المسمى الوظيفي
  </label>

  <select
    value={jobTitle}
    onChange={(event) =>
      setJobTitle(event.target.value)
    }
    className="
      h-[46px] w-full rounded-[16px]
      border border-[#D8DEE7]
      bg-[#F8FAFC] px-4
      text-[12px] font-medium
      text-[#07152E] outline-none
    "
  >
    <option value="">اختر المسمى الوظيفي</option>
    <option value="Student">طالب</option>
    <option value="Engineer">مهندس</option>
    <option value="Consultant">استشاري</option>
    <option value="Project Manager">مدير مشروع</option>
    <option value="Trainer">مدرب</option>
    <option value="Other">أخرى</option>
  </select>
</div>

<div>
  <label className="mb-2 block text-[11px] font-black text-[#07152E]">
    سنوات الخبرة
  </label>

  <select
    value={experienceLevel}
    onChange={(event) =>
      setExperienceLevel(event.target.value)
    }
    className="
      h-[46px] w-full rounded-[16px]
      border border-[#D8DEE7]
      bg-[#F8FAFC] px-4
      text-[12px] font-medium
      text-[#07152E] outline-none
    "
  >
    <option value="">اختر سنوات الخبرة</option>
    <option value="0-2">أقل من سنتين</option>
    <option value="2-5">من سنتين إلى 5 سنوات</option>
    <option value="5-10">من 5 إلى 10 سنوات</option>
    <option value="10+">أكثر من 10 سنوات</option>
  </select>
</div>

<div>
  <label className="mb-2 block text-[11px] font-black text-[#07152E]">
    التخصص
  </label>

  <select
    value={specialty}
    onChange={(event) =>
      setSpecialty(event.target.value)
    }
    className="
      h-[46px] w-full rounded-[16px]
      border border-[#D8DEE7]
      bg-[#F8FAFC] px-4
      text-[12px] font-medium
      text-[#07152E] outline-none
    "
  >
    <option value="">اختر التخصص</option>
    <option value="Road Design">تصميم الطرق</option>
    <option value="Traffic Engineering">
      هندسة المرور
    </option>
    <option value="Civil Engineering">
      الهندسة المدنية
    </option>
    <option value="Surveying">المساحة</option>
    <option value="BIM">BIM</option>
    <option value="Other">أخرى</option>
  </select>
</div>
        {/* Password */}
        <div>
          <label
            htmlFor="password"
            className="mb-2 block text-[13px] font-black text-[#07152E]"
          >
            كلمة المرور
          </label>

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
              minLength={8}
              autoComplete="new-password"
              placeholder="8 أحرف على الأقل"
              className="
                h-[50px] w-full rounded-2xl
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
              className="
                absolute left-4 top-1/2
                -translate-y-1/2
                text-slate-400
                transition
                hover:text-[#07152E]
              "
            >
              {showPassword ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
              )}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <label
            htmlFor="confirmPassword"
            className="mb-2 block text-[13px] font-black text-[#07152E]"
          >
            تأكيد كلمة المرور
          </label>

          <div className="relative">
            <LockKeyhole
              size={18}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              id="confirmPassword"
              name="confirmPassword"
              type={
                showConfirmPassword
                  ? "text"
                  : "password"
              }
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="أعد كتابة كلمة المرور"
              className="
                h-[50px] w-full rounded-2xl
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
                setShowConfirmPassword(
                  (current) => !current
                )
              }
              aria-label={
                showConfirmPassword
                  ? "إخفاء تأكيد كلمة المرور"
                  : "إظهار تأكيد كلمة المرور"
              }
              className="
                absolute left-4 top-1/2
                -translate-y-1/2
                text-slate-400
                transition
                hover:text-[#07152E]
              "
            >
              {showConfirmPassword ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
              )}
            </button>
          </div>
        </div>

        {/* Terms */}
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            required
            className="
              mt-1 h-4 w-4 rounded
              border-slate-300
              accent-[#F7B548]
            "
          />

          <span className="text-[11px] font-bold leading-5 text-slate-600">
            أوافق على شروط الاستخدام وسياسة
            الخصوصية الخاصة بمنصة صناع المسار.
          </span>
        </label>

        {/* Success */}
        {success && (
          <div
            className="
              rounded-xl
              border border-emerald-200
              bg-emerald-50
              px-4 py-3
              text-[12px]
              font-bold
              leading-6
              text-emerald-700
            "
          >
            {success}
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            className="
              rounded-xl
              border border-red-200
              bg-red-50
              px-4 py-3
              text-[12px]
              font-bold
              leading-6
              text-red-600
            "
          >
            {error}
          </div>
        )}

        {/* Submit */}
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
            ? "جاري إنشاء الحساب..."
            : "إنشاء الحساب"}

          {!loading && (
            <ArrowLeft size={18} />
          )}
        </button>
      </form>

      {/* Login Link */}
      <Link
        href="/login"
        className="
          mt-6 flex h-[50px] w-full
          items-center justify-center
          rounded-2xl
          border border-[#07152E]/20
          bg-[#F7F8FA]
          text-[14px]
          font-black
          text-[#07152E]
          transition duration-300
          hover:bg-[#07152E]
          hover:text-white
        "
      >
        لدي حساب بالفعل
      </Link>
    </AuthShell>
  );
}