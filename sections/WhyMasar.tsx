"use client";

import {
  ArrowLeft,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  FolderKanban,
  Route,
} from "lucide-react";

const features = [
  {
    number: "01",
    title: "رحلة واضحة ومتكاملة",
    description:
      "تتعلم من خلال مسار مهني مرتب يقودك خطوة بخطوة من الأساسيات إلى مستوى احترافي واضح.",
    icon: Route,
  },
  {
    number: "02",
    title: "تطبيق عملي حقيقي",
    description:
      "لا تكتفي بمشاهدة الشرح، بل تطبق المهارات على تمارين ومشاريع تحاكي متطلبات العمل الفعلية.",
    icon: FolderKanban,
  },
  {
    number: "03",
    title: "منهجية احترافية",
    description:
      "تتعلم طريقة التفكير وإدارة خطوات التصميم، وليس مجرد استخدام أدوات وأوامر البرامج الهندسية.",
    icon: ChartNoAxesCombined,
  },
  {
    number: "04",
    title: "بناء مسيرتك المهنية",
    description:
      "تجمع مشاريعك وشهاداتك وإنجازاتك في رحلة واحدة تساعدك على إظهار تطورك ومستواك المهني.",
    icon: BriefcaseBusiness,
  },
];

export default function WhyMasar() {
  return (
    <section
      id="why-masar"
      dir="rtl"
      className="w-full bg-[#F7F8FA] px-6 py-3"
    >
      <div className="mx-auto max-w-[1580px]">
        {/* Main statement */}
        <div className="relative mb-3 overflow-hidden rounded-[28px] bg-[#07152E] px-8 py-3 text-white shadow-[0_18px_45px_rgba(7,21,46,0.16)]">
          {/* Decorative lighting */}
          <div className="pointer-events-none absolute -right-14 -top-20 h-48 w-48 rounded-full bg-[#F7B548]/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-20 h-52 w-52 rounded-full bg-white/10 blur-3xl" />

          <div className="relative z-10 flex items-center justify-between gap-8">
            <div className="max-w-[950px] text-right">
              <span className="inline-flex rounded-full border border-[#F7B548]/40 bg-[#F7B548]/10 px-4 py-1.5 text-[13px] font-black text-[#F7B548]">
                منهجية تعلم مختلفة
              </span>

              <h3 className="mt-2 text-[27px] font-black leading-tight">
                دوراتنا ليست مجرد شرح أدوات
                <span className="mr-2 text-[#F7B548]">
                  بل رحلة لبناء مهندس محترف
                </span>
              </h3>

              <p className="mt-2 max-w-[850px] text-[16px] font-medium leading-6 text-slate-300">
                في صناع المسار نربط المعرفة بالتطبيق، ونرتب المهارات داخل رحلة
                واضحة تساعدك على تنفيذ مشاريع حقيقية وبناء مسيرتك المهنية بثقة.
              </p>
            </div>

            <button
              type="button"
              className="hidden shrink-0 items-center gap-3 rounded-2xl bg-[#F7B548] px-6 py-3 text-[15px] font-black text-[#07152E] shadow-[0_10px_24px_rgba(247,181,72,0.2)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_14px_30px_rgba(247,181,72,0.3)] lg:flex"
            >
              اكتشف منهجيتنا
              <ArrowLeft size={18} />
            </button>
          </div>
        </div>

        {/* Feature cards */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <article
                key={feature.title}
                className="group relative flex min-h-[205px] flex-col overflow-hidden rounded-[26px] border border-[#DCE3EC] bg-white p-5 text-right shadow-[0_12px_32px_rgba(7,21,46,0.06)] transition-all duration-500 hover:-translate-y-1.5 hover:border-[#F7B548]/60 hover:shadow-[0_18px_42px_rgba(7,21,46,0.11)]"
              >
                {/* Hover glow */}
                <div className="pointer-events-none absolute -left-14 -top-14 h-32 w-32 rounded-full bg-[#F7B548]/0 blur-3xl transition duration-500 group-hover:bg-[#F7B548]/16" />

                <div className="relative z-10 flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#F7B548]/35 bg-[#FFF8E8] text-[#D49319] transition duration-500 group-hover:scale-110 group-hover:bg-[#F7B548] group-hover:text-[#07152E]">
                    <Icon size={24} strokeWidth={2} />
                  </div>

                  <span className="text-[34px] font-black leading-none text-[#07152E]/7 transition duration-500 group-hover:text-[#F7B548]/30">
                    {feature.number}
                  </span>
                </div>

                <div className="relative z-10 mt-3">
                  <h3 className="text-[19px] font-black text-[#07152E]">
                    {feature.title}
                  </h3>

                  <div className="mt-1 h-[3px] w-10 rounded-full bg-[#F7B548] transition-all duration-500 group-hover:w-16" />

                  <p className="mt-3 text-[13px] font-medium leading-6 text-slate-600">
                    {feature.description}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}