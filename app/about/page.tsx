import Link from "next/link";
import {
  ArrowLeft,
  Award,
  BookOpenCheck,
  Compass,
  GraduationCap,
  Route,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from "lucide-react";

import Navbar from "@/sections/Navbar";
import AnnouncementBar from "@/sections/AnnouncementBar";

const pillars = [
  {
    title: "رحلات مهنية وليست كورسات منفصلة",
    description:
      "نبني تجربة تعلم مترابطة تبدأ من الأساسيات وتنتقل بك خطوة بخطوة حتى التطبيق الاحترافي.",
    icon: Route,
  },
  {
    title: "تعلم قائم على التطبيق",
    description:
      "نركز على المشروعات والتحديات الواقعية التي تواجه المهندس في سوق العمل، وليس فقط على شرح الأدوات.",
    icon: Target,
  },
  {
    title: "مسار واضح للتطور",
    description:
      "تتابع تقدمك وإنجازاتك وشهاداتك ومشروعاتك داخل منصة واحدة تساعدك على بناء ملف مهني متكامل.",
    icon: Compass,
  },
];

const advantages = [
  "محتوى هندسي متخصص ومبني على خبرة عملية.",
  "رحلات احتراف متكاملة، ورحلات يوم واحد، ورحلات مجانية.",
  "شهادات ومشروعات واستبيانات وملف مهني داخل المنصة.",
  "متابعة واضحة للتقدم من محطة إلى أخرى.",
  "تجربة تعلم مصممة للمهندسين الراغبين في التميز المهني.",
  "تطوير مستمر للمحتوى بما يخدم احتياجات سوق العمل.",
];

export default function AboutPage() {
  return (
    <>
      <Navbar activeItem="about" />

      <main className="min-h-screen bg-[#F7F8FA] pt-[55px]">
        <AnnouncementBar />

        {/* Hero */}
        <section className="relative overflow-hidden bg-[#07152E]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(247,181,72,0.18),transparent_28%),radial-gradient(circle_at_85%_70%,rgba(255,255,255,0.05),transparent_24%)]" />

          <div
            dir="rtl"
            className="relative mx-auto grid max-w-[1480px] items-center gap-8 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:px-10 lg:py-20"
          >
            <div className="text-right">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#F7B548]/35 bg-[#F7B548]/10 px-4 py-2 text-[16px] font-black text-[#F7B548]">
                <Sparkles size={15} />
                Masar Makers
              </span>

              <h1 className="mt-5 text-[34px] font-black leading-tight text-white sm:text-[42px] lg:text-[50px]">
                لا تتعلم كورس فقط...
                <span className="block text-[#F7B548]">
                  ابنِ مسيرتك المهنية.
                </span>
              </h1>

              <p className="mt-5 max-w-2xl text-[14px] font-semibold leading-8 text-slate-300 sm:text-[16px]">
                صناع المسار منصة تعليمية هندسية تهدف إلى تحويل التعلم من
                مجموعة كورسات منفصلة إلى رحلة مهنية واضحة، مترابطة،
                وعملية تساعد المهندس على الانتقال من التعلم إلى الاحتراف.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/career-path/road-design"
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#F7B548] px-5 text-[14px] font-black text-[#07152E] transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  استكشف المسارات المهنية
                  <ArrowLeft size={15} />
                </Link>

                <Link
                  href="/"
                  className="inline-flex h-11 items-center rounded-xl border border-white/20 px-5 text-[14px] font-black text-white transition hover:border-[#F7B548] hover:text-[#F7B548]"
                >
                  مركز الرحلات
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                ["مسارات مهنية", "تعلم بخطة واضحة", GraduationCap],
                ["مشروعات عملية", "تطبيق على تحديات حقيقية", BookOpenCheck],
                ["شهادات وإنجازات", "وثّق تطورك المهني", Award],
                ["مجتمع هندسي", "تعلم مع مهندسين من دول مختلفة", Users],
              ].map(([title, subtitle, Icon]) => {
                const IconComponent = Icon as typeof GraduationCap;

                return (
                  <div
                    key={String(title)}
                    className="rounded-[22px] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-sm"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F7B548] text-[#07152E]">
                      <IconComponent size={20} />
                    </span>

                    <h3 className="mt-4 text-[15px] font-black text-white">
                      {String(title)}
                    </h3>

                    <p className="mt-1 text-[14px] font-bold leading-5 text-white/55">
                      {String(subtitle)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Who we are */}
        <section dir="rtl" className="mx-auto max-w-[1320px] px-6 py-14 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[28px] border border-[#DCE2EA] bg-white p-7 shadow-[0_16px_40px_rgba(7,21,46,0.07)]">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFF4DF] text-[#C88712]">
                <ShieldCheck size={22} />
              </span>

              <h2 className="mt-5 text-[26px] font-black text-[#07152E]">
                من نحن؟
              </h2>

              <p className="mt-4 text-[14px] font-semibold leading-7 text-slate-600">
                Masar Makers هي منصة تعليمية متخصصة في بناء المسارات المهنية
                للمهندسين. نؤمن أن التطور الحقيقي لا يحدث بمجرد مشاهدة
                المحاضرات، بل عندما يعرف المتعلم أين يبدأ، وما الذي يتعلمه
                بعد ذلك، وكيف يطبق ما تعلمه في مشروع حقيقي.
              </p>

              <p className="mt-3 text-[14px] font-semibold leading-7 text-slate-600">
                لذلك صممنا المنصة حول فكرة المحطات والرحلات المهنية، بحيث
                يصبح لكل مهندس مسار واضح يمكنه متابعته وقياس تقدمه وإنجازاته
                خلاله.
              </p>
            </div>

            <div className="grid gap-4">
              <div className="rounded-[24px] bg-[#07152E] p-6 text-white">
                <p className="text-[16px] font-black text-[#F7B548]">
                  رؤيتنا
                </p>

                <h3 className="mt-2 text-[22px] font-black">
                  أن يصبح التعلم الهندسي رحلة مهنية متكاملة.
                </h3>

                <p className="mt-3 text-[14px] font-semibold leading-7 text-white/65">
                  نريد أن يعرف كل مهندس خطوته الحالية، والخطوة التالية،
                  وما الذي يحتاجه للوصول إلى مستوى مهني أعلى.
                </p>
              </div>

              <div className="rounded-[24px] border border-[#DCE2EA] bg-white p-6">
                <p className="text-[16px] font-black text-[#C88712]">
                  رسالتنا
                </p>

                <h3 className="mt-2 text-[22px] font-black text-[#07152E]">
                  تحويل المعرفة إلى مهارة وإنجاز مهني قابل للقياس.
                </h3>

                <p className="mt-3 text-[14px] font-semibold leading-7 text-slate-600">
                  من خلال محتوى منظم، تطبيق عملي، مشروعات، شهادات،
                  ومتابعة مستمرة لتقدم المتعلم داخل مساره.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Method */}
        <section dir="rtl" className="bg-white py-14">
          <div className="mx-auto max-w-[1320px] px-6 lg:px-10">
            <div className="text-center">
              <p className="text-[16px] font-black text-[#C88712]">
                منهجية صناع المسار
              </p>

              <h2 className="mt-2 text-[28px] font-black text-[#07152E]">
                كيف نصنع المسار المهني؟
              </h2>

              <p className="mx-auto mt-3 max-w-2xl text-[14px] font-semibold leading-7 text-slate-500">
                كل رحلة مصممة لتقودك من التعلم إلى التطبيق ثم إلى الإنجاز.
              </p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {pillars.map((item) => {
                const Icon = item.icon;

                return (
                  <article
                    key={item.title}
                    className="rounded-[24px] border border-[#E0E6ED] bg-[#F9FBFD] p-6 transition hover:-translate-y-1 hover:border-[#F7B548]"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#07152E] text-[#F7B548]">
                      <Icon size={21} />
                    </span>

                    <h3 className="mt-4 text-[20px] font-black text-[#07152E]">
                      {item.title}
                    </h3>

                    <p className="mt-2 text-[14px] font-semibold leading-6 text-slate-600">
                      {item.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* Why Masar */}
        <section dir="rtl" className="mx-auto max-w-[1320px] px-6 py-14 lg:px-10">
          <div className="rounded-[30px] border border-[#DCE2EA] bg-white p-7 shadow-[0_18px_45px_rgba(7,21,46,0.07)] lg:p-9">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFF4DF] text-[#C88712]">
                <Award size={22} />
              </span>

              <div>
                <p className="text-[16px] font-black text-[#C88712]">
                  لماذا Masar Makers؟
                </p>

                <h2 className="text-[25px] font-black text-[#07152E]">
                  لأننا نبني رحلة... لا قائمة فيديوهات.
                </h2>
              </div>
            </div>

            <div className="mt-7 grid gap-3 md:grid-cols-2">
              {advantages.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-[16px] border border-[#E5EAF0] bg-[#FAFBFD] px-4 py-3"
                >
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F7B548] text-[#07152E]">
                    <ShieldCheck size={14} />
                  </span>

                  <p className="text-[16px] font-bold leading-6 text-[#334155]">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section dir="rtl" className="px-6 pb-16 lg:px-10">
          <div className="mx-auto flex max-w-[1320px] flex-col items-center justify-between gap-5 rounded-[28px] bg-[#07152E] px-7 py-8 text-center text-white md:flex-row md:text-right">
            <div>
              <p className="text-[16px] font-black text-[#F7B548]">
                خطوتك القادمة تبدأ من هنا
              </p>

              <h2 className="mt-1 text-[25px] font-black">
                اختر المسار الذي يقودك إلى مستقبل احترافي.
              </h2>
            </div>

            <Link
              href="/career-path/road-design"
              className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-[#F7B548] px-5 text-[14px] font-black text-[#07152E]"
            >
              استكشف المسارات
              <ArrowLeft size={15} />
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}