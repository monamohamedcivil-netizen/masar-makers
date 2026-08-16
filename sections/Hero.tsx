"use client";

import Image from "next/image";
import {
  ArrowLeft,
  Compass,
} from "lucide-react";

import AuthLink from "@/components/AuthLink";
import HeroWelcome from "@/components/auth/HeroWelcome";
import HomeMonthlyDrawStatus from "@/components/monthly-draw/HomeMonthlyDrawStatus";

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="relative h-[220px] overflow-hidden">
        <Image
          src="/images/hero-road-v4.jpg"
          alt="Masar Makers"
          fill
          priority
          className="object-cover object-center"
        />

        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to left, rgba(7,21,46,.95) 0%, rgba(7,21,46,.88) 18%, rgba(7,21,46,.55) 38%, rgba(7,21,46,.18) 62%, transparent 100%)",
          }}
        />

        <HeroWelcome />
        <HomeMonthlyDrawStatus />

        <div className="absolute inset-0">
          <div className="mx-auto flex h-full max-w-7xl items-center px-8">
            <div
              className="mt-0 max-w-[620px] text-right text-white"
              style={{
                paddingRight: "0px",
                paddingTop: "0px",
              }}
            >
              <div className="mb-2">
                <span className="inline-flex rounded-full border border-[#F7B548]/30 bg-[#0C1F40]/90 px-6 py-2 text-sm font-semibold text-[#F7B548] shadow-lg backdrop-blur">
                  منصة تعليمية احترافية
                </span>
              </div>

              <div className="mb-0">
                <h1 className="text-[44px] font-black leading-[1.05] lg:text-[35px]">
                  <span className="text-white">
                    لا تتعلم كورس فقط ...
                  </span>

                  <span className="mr-2 text-[#F7B548]">
                    ابنِ مسيرتك المهنية
                  </span>
                </h1>
              </div>

              <p className="mt-1 max-w-[540px] text-[15px] font-black leading-8 text-white/90">
                رحلات تعليمية عملية تنقلك من التصميم إلى الإبهار，
                ومن المعرفة إلى الاحتراف
              </p>

              <div className="mt-1 flex justify-start gap-4">
                <AuthLink>
                  <button className="flex items-center gap-2 rounded-2xl bg-[#F7B548] px-8 py-1 font-bold text-[#07152E] transition duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(247,181,72,.45)]">
                    ابدأ رحلتك
                    <ArrowLeft size={18} />
                  </button>
                </AuthLink>

                <AuthLink href="/career-path/road">
                  <button className="flex items-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-8 py-1 font-bold text-white backdrop-blur transition duration-300 hover:bg-white hover:text-[#07152E]">
                    استكشف المسارات
                    <Compass size={18} />
                  </button>
                </AuthLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}