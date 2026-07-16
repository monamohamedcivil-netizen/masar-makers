"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import {
  ArrowLeft,
  Building2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const partners = [
  
   {
    name: "Present Trade",
    logo: "/images/partners/present-trade.png",
    description:
      "دعم المتدربين في الشرق الأوسط وتسهيل الوصول إلى النسخ التجريبية وخيارات الترخيص.",
  },
    {
    name: "Civil Survey Applications",
    logo: "/images/partners/csa.png",
    description:
      "دعم تقني وتدريبي لرحلات Civil Site Design وتوفير فرص تقييم البرنامج للمتدربين.",
  },
 
  {
    name: "Training Community",
    logo: "/images/logo/masar-makers-mark.png",
    description:
      "مجتمع مهني يجمع المهندسين والمدربين والخبراء داخل رحلات تطبيقية متكاملة.",
  },

  // أضيفي الشركاء الجدد هنا لاحقًا
  // {
  //   name: "New Partner",
  //   logo: "/images/partners/new-partner.png",
  //   description: "وصف الشريك الجديد.",
  // },
];

export default function Partners() {
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const currentIndex = useRef(0);

  /*
    نكرر البطاقات مرتين حتى تستمر الحركة بسلاسة.
    مع وجود 3 شركاء فقط ستظهر البطاقات الحالية،
    وعند إضافة شركاء جدد يبدأ السلايدر في التنقل بينهم.
  */
  const sliderPartners = [...partners, ...partners];

  useEffect(() => {
    const slider = sliderRef.current;

    if (!slider || partners.length <= 3) return;

    const timer = window.setInterval(() => {
      const firstCard =
        slider.querySelector<HTMLElement>("[data-partner-card]");

      if (!firstCard) return;

      const cardWidth = firstCard.offsetWidth;
      const gap = 16;

      currentIndex.current += 1;

      slider.scrollTo({
        left: currentIndex.current * (cardWidth + gap),
        behavior: "smooth",
      });

      if (currentIndex.current >= partners.length) {
        window.setTimeout(() => {
          currentIndex.current = 0;

          slider.scrollTo({
            left: 0,
            behavior: "auto",
          });
        }, 650);
      }
    }, 4000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <section
      id="partners"
      dir="rtl"
      className="w-full bg-[#F7F8FA] px-6 py-4"
    >
      <div className="mx-auto max-w-[1580px]">
        <div className="grid gap-5 lg:grid-cols-[1.05fr_1.95fr]">
          {/* Main message */}
          <div className="relative overflow-hidden rounded-[28px] bg-[#07152E] p-6 text-white shadow-[0_18px_45px_rgba(7,21,46,0.15)]">
            <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-[#F7B548]/16 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 left-8 h-48 w-48 rounded-full bg-white/10 blur-3xl" />

            <div className="relative z-10">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#F7B548]/35 bg-[#F7B548]/10 text-[#F7B548]">
                <ShieldCheck size={25} />
              </div>

              <h3 className="mt-4 text-[26px] font-black leading-tight">
                شراكات تدعم جودة الرحلة
              </h3>

              <p className="mt-3 text-[15px] font-medium leading-7 text-slate-300">
                نتعاون مع جهات تقنية ومهنية تساعدنا على تقديم محتوى أكثر دقة，
                وتوفير تجربة تعلم مرتبطة بمتطلبات السوق والأدوات المستخدمة في
                المشاريع الحقيقية.
              </p>

              <div className="mt-4 flex items-center justify-end gap-0">
  <span className="text-[18px] font-black tracking-wide text-[#F7B548]">
    تعرف على شركائنا
  </span>

  <div className="relative h-[30px] w-[145px]">
    <svg
      viewBox="0 0 60 30"
      className="absolute inset-0 h-full w-full"
      fill="none"
    >
      {/* جسم الطريق الذهبي */}
      <path
        d="M80 15 H16"
        stroke="#F7B548"
        strokeWidth="8"
        strokeLinecap="round"
      />

      {/* الخط المتقطع الكحلي داخل الطريق */}
      <path
  d="M76 15 H22"
  stroke="#07152E"
  strokeWidth="2.3"
  strokeDasharray="10 5"
  strokeLinecap="round"
>
  <animate
    attributeName="stroke-dashoffset"
    from="0"
    to="-17"
    dur="1.8s"
    repeatCount="indefinite"
  />
</path>

      {/* رأس السهم */}
      <path
        d="M30 7 L10 15 L30 23"
        stroke="#F7B548"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </div>
</div>
            </div>
          </div>

          {/* Partners slider */}
          <div className="min-w-0 overflow-hidden">
            <div
              ref={sliderRef}
              dir="ltr"
              className="
                flex h-full gap-4 overflow-x-auto scroll-smooth
                [scrollbar-width:none]
                [&::-webkit-scrollbar]:hidden
              "
            >
              {sliderPartners.map((partner, index) => (
                <article
                  data-partner-card
                  dir="rtl"
                  key={`${partner.name}-${index}`}
                  className="
                    group relative flex min-h-[260px]
                    w-[calc((100%-32px)/3)] min-w-[calc((100%-32px)/3)]
                    flex-col overflow-hidden rounded-[26px]
                    border border-[#DCE3EC] bg-white p-5 text-center
                    shadow-[0_12px_32px_rgba(7,21,46,0.05)]
                    transition-all duration-500
                    hover:-translate-y-1.5
                    hover:border-[#F7B548]/65
                    hover:shadow-[0_18px_42px_rgba(7,21,46,0.1)]
                    max-lg:w-[calc((100%-16px)/2)]
                    max-lg:min-w-[calc((100%-16px)/2)]
                    max-md:w-full
                    max-md:min-w-full
                  "
                >
                  {/* Glow */}
                  <div className="pointer-events-none absolute -left-12 -top-12 h-28 w-28 rounded-full bg-[#F7B548]/0 blur-3xl transition duration-500 group-hover:bg-[#F7B548]/13" />

                  {/* Logo container */}
                  <div
  className="
    relative z-10
    mx-auto
    flex
    h-[95px]
    w-full
    items-center
    justify-center
    py-2
  "
>
  <Image
    src={partner.logo}
    alt={partner.name}
    width={170}
    height={90}
    className="
max-h-[82px]
max-w-[180px]
object-contain
transition-all
duration-500
group-hover:scale-110
group-hover:-translate-y-1
    "
  />
</div>

                  {/* Partner content */}
                  <div className="relative z-10 mt-4">
                    <h3 className="text-[18px] font-black text-[#07152E]">
                      {partner.name}
                    </h3>

                    <div className="mx-auto mt-2 h-[3px] w-10 rounded-full bg-[#F7B548] transition-all duration-500 group-hover:w-16" />

                    <p className="mt-3 text-[15px] font-bold leading-6 text-slate-600">
                      {partner.description}
                    </p>
                  </div>

                  <div className="relative z-10 mt-auto flex items-center justify-center gap-2 pt-4 text-[13px] font-black text-[#D49319]">
                    <Sparkles size={15} />
                    شريك في رحلة التطوير
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>

        {/* Trust strip */}
        <div className="mt-2.5 grid grid-cols-3 gap-3 rounded-[20px] border border-[#E0E6EE] bg-white px-5 py-2 text-center shadow-[0_8px_24px_rgba(7,21,46,0.04)]">
          <div className="flex items-center justify-center gap-3">
            <Building2 size={25} className="text-[#D49319]" />
            <span className="text-[17px] font-black text-[#07152E]">
              جهات تقنية متخصصة
            </span>
          </div>

          <div className="flex items-center justify-center gap-3">
            <ShieldCheck size={25} className="text-[#D49319]" />
            <span className="text-[17px] font-black text-[#07152E]">
              محتوى مدعوم بخبرة عملية
            </span>
          </div>

          <div className="flex items-center justify-center gap-3">
            <Sparkles size={25} className="text-[#D49319]" />
            <span className="text-[17px] font-black text-[#07152E]">
              تطوير مستمر للرحلات
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}