"use client";

import Image from "next/image";
import {
  ArrowLeft,
  Award,
  Compass,
  Crosshair,
  Sparkles,
} from "lucide-react";
import AuthLink from "@/components/AuthLink";

export default function FinalCTA() {
  return (
    <section
      id="final-cta"
      dir="rtl"
      className="w-full bg-[#F7F8FA] px-6 py-3"
    >
      <div className="mx-auto max-w-[1320px]">
        <div
          className="
            relative mx-auto h-[340px] overflow-hidden
            rounded-[30px] bg-[#07152E]
            shadow-[0_22px_55px_rgba(7,21,46,0.20)]
          "
        >
          {/* Main content */}
          <div className="grid h-[275px] lg:grid-cols-[0.96fr_1.04fr]">
            {/* Right content */}
            <div
              className="
                relative z-20 flex flex-col justify-center
                px-10 py-6 text-right
                lg:order-1
              "
            >
              <h1 className="text-[44px] lg:text-[35px] font-black leading-[1.05]">
<span className="text-white">
             لا تنتظر الفرصة المناسبة ...
            </span>

            <span className="mr-2 text-[#F7B548]">
                  ابنِها بنفسك

            </span>

</h1>
        
              <p className="mt-1 max-w-[600px] text-[14px] font-medium leading-7 text-slate-300">
                اختر الرحلة التي تناسب هدفك، وابدأ بخطوات واضحة حتى تصل إلى
                الاحتراف من خلال مشاريع حقيقية وخبرة عملية.
              </p>

              <div className="mt-15 flex flex-wrap items-center gap-3">
             <AuthLink>
                <button
                  type="button"
                  className="
                    flex h-[46px] items-center justify-center gap-3
                    rounded-xl bg-[#F7B548] px-6
                    text-[14px] font-black text-[#07152E]
                    shadow-[0_10px_24px_rgba(247,181,72,0.22)]
                    transition duration-300
                    hover:-translate-y-1
                    hover:shadow-[0_14px_30px_rgba(247,181,72,0.32)]
                  "
                >
                  ابدأ رحلتك
                  <ArrowLeft size={17} />
                  
                </button>
                </AuthLink>  

<AuthLink href="/journeys">
                <button
                  type="button"
                  className="
                    flex h-[46px] items-center justify-center gap-3
                    rounded-xl border border-white/25
                    bg-white/5 px-6
                    text-[14px] font-black text-white
                    backdrop-blur-sm
                    transition duration-300
                    hover:border-[#F7B548]/60
                    hover:bg-white/10
                  "
                >
                  استكشف المسارات
                  <Compass size={17} />
                </button>
                </AuthLink>
              </div>
            </div>

            {/* Left realistic road */}
            <div
              className="
                relative overflow-hidden
                lg:order-2
              "
            >
              <Image
                src="/images/cta/road-to-trophy.jpg"
                alt="طريق الاحتراف المؤدي إلى الكأس"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover object-center"
              />

              {/* Image integration overlays */}
              <div className="absolute inset-0 bg-gradient-to-l from-[#07152E] via-[#07152E]/25 to-transparent" />

              <div className="absolute inset-y-0 right-0 w-[38%] bg-gradient-to-l from-[#07152E] to-transparent" />

              <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[#07152E]/80 to-transparent" />

              {/* Start marker */}
              <div
                className="
                  absolute bottom-5 right-35
                  rotate-[-45deg] flex h-[50px] w-[50px]
                  items-center justify-center
                  rounded-full border border-[#F7B548]/45
                  bg-[#07152E]/90 text-[#F7B548]
                  shadow-[0_0_30px_rgba(247,181,72,0.22)]
                  backdrop-blur-md
                "
              >
                <Compass size={25} />
              </div>

              {/* Destination label */}
              <div
                className="
                  absolute left-5 top-12
                  flex items-center gap-2
                  rounded-full border border-[#F7B548]/30
                  bg-[#07152E]/75 px-4 py-1.5
                  text-[11px] font-black text-[#F7B548]
                  backdrop-blur-md
                "
              >
                <Award size={15} />
                الوصول إلى الاحتراف
              </div>
            </div>
          </div>

          {/* Bottom strip */}
          <div
            className="
              relative z-30 grid h-[70px] grid-cols-3
              border-t border-white/10
              bg-[#06132A]/96
            "
          >
            <div className="flex items-center justify-center gap-3 border-l border-white/10 px-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#F7B548]/25 bg-[#F7B548]/10 text-[#F7B548]">
                <Sparkles size={19} />
              </div>

              <div className="text-right">
                <p className="text-[15px] font-black text-white">
                  ابدأ مجانًا
                </p>

                <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                  استكشف المحتوى المفتوح أولًا
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 border-l border-white/10 px-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#F7B548]/25 bg-[#F7B548]/10 text-[#F7B548]">
                <Crosshair size={19} />
              </div>

              <div className="text-right">
                <p className="text-[15px] font-black text-white">
                  اختر هدفك
                </p>

                <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                  رحلة كاملة أو ورشة مركزة
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 px-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#F7B548]/25 bg-[#F7B548]/10 text-[#F7B548]">
                <Award size={19} />
              </div>

              <div className="text-right">
                <p className="text-[15px] font-black text-white">
                  طبّق وشارك
                </p>

                <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                  أضف مشروعك إلى إنجازاتك
                </p>
              </div>
            </div>
          </div>

          {/* Soft lighting */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[#F7B548]/10 blur-3xl" />
        </div>
      </div>
    </section>
  );
}