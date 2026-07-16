"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Route, ShieldCheck, Sparkles } from "lucide-react";

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
            <Link
              href="/"
              className="mb-7 inline-flex items-center gap-2 text-[14px] font-black text-[#07152E] transition hover:text-[#C88712]"
            >
              <ArrowRight size={18} />
              العودة إلى الصفحة الرئيسية
            </Link>

            <div className="rounded-[32px] border border-[#E0E6EE] bg-white p-7 shadow-[0_24px_65px_rgba(7,21,46,0.10)] sm:p-9">
              <div className="mb-7 text-right">
                <span className="inline-flex items-center gap-2 rounded-full bg-[#FFF7E3] px-4 py-1.5 text-[12px] font-black text-[#C88712]">
                  <Sparkles size={14} />
                  بوابة صناع المسار
                </span>

                <h1 className="mt-4 text-[34px] font-black leading-tight text-[#07152E]">
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

        {/* Visual area */}
        <section className="relative hidden overflow-hidden bg-[#07152E] lg:block">
          <Image
            src="/images/hero-road-v8.jpg"
            alt="Masar Makers professional journey"
            fill
            priority
            className="object-cover object-left"
          />

          <div className="absolute inset-0 bg-gradient-to-l from-[#07152E]/96 via-[#07152E]/75 to-[#07152E]/25" />

          <div className="relative z-10 flex h-full flex-col justify-between p-12 text-white">
            <Link href="/" className="inline-flex w-fit items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-[#F7B548]/35 bg-[#07152E]/70">
                <Image
                  src="/images/logo/masar-makers-mark.png"
                  alt="Masar Makers"
                  width={44}
                  height={44}
                  className="object-contain"
                />
              </div>

              <div>
                <p className="text-[21px] font-black">
                  صناع
                  <span className="mr-2 text-[#F7B548]">المسار</span>
                </p>

                <p className="text-[11px] font-bold text-slate-300">
                  Masar Makers
                </p>
              </div>
            </Link>

            <div className="max-w-[620px]">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#F7B548]/35 bg-[#F7B548]/10 px-4 py-1.5 text-[12px] font-black text-[#F7B548]">
                <Route size={15} />
                رحلتك المهنية تبدأ هنا
              </span>

              <h2 className="mt-5 text-[42px] font-black leading-[1.25]">
                لا تتعلم كورسًا فقط
                <span className="mt-2 block text-[#F7B548]">
                  ابنِ مسيرتك المهنية
                </span>
              </h2>

              <p className="mt-4 max-w-[560px] text-[15px] font-medium leading-8 text-slate-300">
                سجّل دخولك لاستكشاف المسارات والورش والمحاضرات المجانية، وتتبع
                تقدمك ومشاريعك وشهاداتك داخل رحلة تعليمية واحدة.
              </p>
            </div>

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