"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";

type AuthShellProps = {
  children: React.ReactNode;
  title: string;
  description: string;
};

export default function AuthShell({
  children,
  title,
  description,
}: AuthShellProps) {
  return (
    <main
      dir="rtl"
      className="relative min-h-screen overflow-hidden bg-[#F5F7FA]"
    >
      {/* Decorative background */}
      <div className="pointer-events-none absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full bg-[#F7B548]/12 blur-3xl" />

      <div className="pointer-events-none absolute -bottom-40 -left-24 h-[420px] w-[420px] rounded-full bg-[#07152E]/10 blur-3xl" />

      <div className="relative z-10 grid min-h-screen lg:grid-cols-[0.92fr_1.08fr]">
        {/* Form area */}
        <section className="flex items-center justify-center px-6 py-10 lg:px-12">
          <div className="w-full max-w-[520px]">
            {/* هوية المنصة على الموبايل والتابلت (اللوحة الجانبية تظهر على الكمبيوتر فقط) */}
            <Link
              href="/"
              className="mx-auto mb-5 flex w-fit items-center gap-2 rounded-2xl bg-[#07152E] px-4 py-2.5 shadow-[0_14px_34px_rgba(7,21,46,0.18)] lg:hidden"
            >
              <Image
                src="/images/logo/masar-makers-mark.png"
                alt="Masar Makers"
                width={44}
                height={44}
                className="h-11 w-11 object-contain"
              />

              <BrandName compact />
            </Link>

            <Link
              href="/"
              className="mb-5 inline-flex items-center gap-2 text-[14px] font-black text-[#07152E] transition hover:text-[#C88712] lg:mb-7"
            >
              <ArrowRight size={18} />
              العودة إلى الصفحة الرئيسية
            </Link>

            <div className="rounded-[28px] border border-[#E0E6EE] bg-white p-5 shadow-[0_24px_65px_rgba(7,21,46,0.10)] sm:rounded-[32px] sm:p-9">
              <div className="mb-7 text-right">
                <span className="inline-flex items-center gap-2 rounded-full bg-[#FFF7E3] px-4 py-1.5 text-[12px] font-black text-[#C88712]">
                  <Sparkles size={14} />
                  بوابة صناع المسار
                </span>

                <h1 className="mt-4 text-[28px] font-black leading-tight text-[#07152E] sm:text-[34px]">
                  {title}
                </h1>

                <p className="mt-2 text-[14px] font-medium leading-7 text-slate-500">
                  {description}
                </p>
              </div>

              {children}
            </div>
          </div>
        </section>

        {/* Visual area: صورة رحلة المنصة (فيها كل الكلام) + الشعار فوق والـ CTA تحت */}
        <section className="relative hidden overflow-hidden bg-[#07152E] lg:block">
          {/* نفس الصورة مغبّشة تملأ المساحة حوالين الصورة الأساسية */}
          <Image
            src="/images/auth-journey-map.webp"
            alt=""
            fill
            aria-hidden="true"
            sizes="55vw"
            className="scale-125 object-cover opacity-80 blur-2xl"
          />
          <div className="absolute inset-0 bg-[#07152E]/35" />

          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2">
            <Image
              src="/images/auth-journey-map.webp"
              alt="رحلتك في صناع المسار: اختر مسارك، محطتك، رحلتك، وطريقة تعلمك، ثم تابع تقدمك وقدّم مشروعك"
              width={1800}
              height={1013}
              priority
              sizes="55vw"
              className="h-auto w-full"
            />
          </div>

          <div className="relative z-10 flex h-full flex-col justify-between p-12 text-white">
            <Link href="/" className="inline-flex w-fit items-center gap-3">
              <Image
                src="/images/logo/masar-makers-mark.png"
                alt="Masar Makers"
                width={64}
                height={64}
                className="h-16 w-16 object-contain drop-shadow-[0_6px_16px_rgba(0,0,0,.45)]"
              />

              <BrandName />
            </Link>

            <div className="grid grid-cols-3 gap-3">
              {[
                "مسارات احترافية",
                "تطبيقات عملية",
                "مشاريع وشهادات",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-center text-[12px] font-black backdrop-blur-sm"
                >
                  <ShieldCheck size={16} className="text-[#F7B548]" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

/* اسم المنصة بنفس شكل الهيدر: الخط المتصل بين الكلمتين يشبه تخطيط الطريق */
function BrandName({
  compact = false,
}: {
  compact?: boolean;
}) {
  return (
    <div data-masar-no-translate>
      <p
        className={`whitespace-nowrap font-black leading-none text-white ${
          compact ? "text-[19px]" : "text-[24px]"
        }`}
      >
        <span>صناعــ</span>
        <span className="ms-2 text-[#F7B548]">ــالمسار</span>
      </p>

      <p
        dir="ltr"
        className={`mt-1 text-right font-bold tracking-[.16em] text-[#F7B548] ${
          compact ? "text-[10px]" : "text-[12px]"
        }`}
      >
        Masar <span className="text-white">Makers</span>
      </p>
    </div>
  );
}