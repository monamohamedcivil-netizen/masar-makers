"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
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
import { useEffect, useState } from "react";

type Locale = "ar" | "en";

export default function AboutPage() {
  const [locale, setLocale] = useState<Locale>("ar");

  useEffect(() => {
    const readLocale = () => {
      const savedLocale = window.localStorage.getItem("masar-locale");
      setLocale(savedLocale === "en" ? "en" : "ar");
    };

    readLocale();

    const handleLocaleChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ locale?: Locale }>;
      const nextLocale = customEvent.detail?.locale;

      if (nextLocale === "ar" || nextLocale === "en") {
        setLocale(nextLocale);
      } else {
        readLocale();
      }
    };

    window.addEventListener("masar:locale-change", handleLocaleChange);

    return () => {
      window.removeEventListener("masar:locale-change", handleLocaleChange);
    };
  }, []);

  const isArabic = locale === "ar";

  const text = isArabic
    ? {
        badge: "Masar Makers",
        heroLine1: "لا تتعلم كورس فقط...",
        heroLine2: "ابنِ مسيرتك المهنية الاحترافية",
        heroDescription:
          "صناع المسار منصة تعليمية هندسية تهدف إلى تحويل التعلم من مجموعة كورسات منفصلة إلى رحلة مهنية واضحة، مترابطة، وعملية تساعد المهندس على الانتقال من التعلم إلى الاحتراف.",
        explorePaths: "استكشف المسارات المهنية",
        journeyCenter: "مركز الرحلات",
        heroCards: [
          ["مسارات مهنية", "تعلم بخطة واضحة", GraduationCap],
          ["مشروعات عملية", "تطبيق على تحديات حقيقية", BookOpenCheck],
          ["شهادات وإنجازات", "وثّق تطورك المهني", Award],
          ["مجتمع هندسي", "تعلم مع مهندسين من دول مختلفة", Users],
        ],
        whoLabel: "من نحن؟",
        whoP1:
          "Masar Makers هي منصة تعليمية متخصصة في بناء المسارات المهنية للمهندسين. نؤمن أن التطور الحقيقي لا يحدث بمجرد مشاهدة المحاضرات، بل عندما يعرف المتعلم أين يبدأ، وما الذي يتعلمه بعد ذلك، وكيف يطبق ما تعلمه في مشروع حقيقي.",
        whoP2:
          "لذلك صممنا المنصة حول فكرة المحطات والرحلات المهنية، بحيث يصبح لكل مهندس مسار واضح يمكنه متابعته وقياس تقدمه وإنجازاته خلاله.",
        vision: "رؤيتنا",
        visionTitle: "أن يصبح التعلم الهندسي رحلة مهنية متكاملة.",
        visionDescription:
          "نريد أن يعرف كل مهندس خطوته الحالية، والخطوة التالية، وما الذي يحتاجه للوصول إلى مستوى مهني أعلى.",
        mission: "رسالتنا",
        missionTitle: "تحويل المعرفة إلى مهارة وإنجاز مهني قابل للقياس.",
        missionDescription:
          "من خلال محتوى منظم، تطبيق عملي، مشروعات، شهادات، ومتابعة مستمرة لتقدم المتعلم داخل مساره.",
        methodLabel: "منهجية صناع المسار",
        methodTitle: "كيف نصنع المسار المهني؟",
        methodDescription:
          "كل رحلة مصممة لتقودك من التعلم إلى التطبيق ثم إلى الإنجاز.",
        pillars: [
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
        ],
        whyLabel: "لماذا Masar Makers؟",
        whyTitle: "لأننا نبني رحلة... لا قائمة فيديوهات.",
        advantages: [
          "محتوى هندسي متخصص ومبني على خبرة عملية.",
          "رحلات احتراف متكاملة، ورحلات يوم واحد، ورحلات مجانية.",
          "شهادات ومشروعات واستبيانات وملف مهني داخل المنصة.",
          "متابعة واضحة للتقدم من محطة إلى أخرى.",
          "تجربة تعلم مصممة للمهندسين الراغبين في التميز المهني.",
          "تطوير مستمر للمحتوى بما يخدم احتياجات سوق العمل.",
        ],
        ctaLabel: "خطوتك القادمة تبدأ من هنا",
        ctaTitle: "اختر المسار الذي يقودك إلى مستقبل احترافي.",
        ctaButton: "استكشف المسارات",
      }
    : {
        badge: "Masar Makers",
        heroLine1: "Don't just take a course...",
        heroLine2: "Build your professional journey.",
        heroDescription:
          "Masar Makers is an engineering learning platform that transforms separate courses into a clear, connected, and practical professional journey that helps engineers move from learning to mastery.",
        explorePaths: "Explore Career Paths",
        journeyCenter: "Journey Center",
        heroCards: [
          ["Career Paths", "Learn with a clear roadmap", GraduationCap],
          ["Practical Projects", "Apply skills to real challenges", BookOpenCheck],
          ["Certificates & Achievements", "Document your professional growth", Award],
          ["Engineering Community", "Learn with engineers from different countries", Users],
        ],
        whoLabel: "Who Are We?",
        whoP1:
          "Masar Makers is a specialized learning platform built around professional development journeys for engineers. We believe real growth does not come from simply watching lectures; it happens when learners know where to start, what comes next, and how to apply what they learn in a real project.",
        whoP2:
          "That is why the platform is designed around professional journeys and milestones, giving every engineer a clear path to follow while tracking progress and achievements along the way.",
        vision: "Our Vision",
        visionTitle: "To make engineering learning a complete professional journey.",
        visionDescription:
          "We want every engineer to understand their current step, the next step, and what they need to reach a higher professional level.",
        mission: "Our Mission",
        missionTitle: "Turn knowledge into measurable skills and professional achievements.",
        missionDescription:
          "Through structured content, hands-on application, projects, certificates, and continuous progress tracking throughout the learner's journey.",
        methodLabel: "The Masar Makers Method",
        methodTitle: "How do we build a professional journey?",
        methodDescription:
          "Every journey is designed to take you from learning, to application, and then to achievement.",
        pillars: [
          {
            title: "Professional journeys, not isolated courses",
            description:
              "We build a connected learning experience that starts with the fundamentals and moves step by step toward professional application.",
            icon: Route,
          },
          {
            title: "Learning through application",
            description:
              "We focus on real projects and challenges engineers face in the workplace, not only on explaining software tools.",
            icon: Target,
          },
          {
            title: "A clear path for growth",
            description:
              "Track your progress, achievements, certificates, and projects in one platform that helps you build a complete professional profile.",
            icon: Compass,
          },
        ],
        whyLabel: "Why Masar Makers?",
        whyTitle: "Because we build a journey — not a playlist.",
        advantages: [
          "Specialized engineering content built on practical experience.",
          "Complete professional journeys, one-day journeys, and free journeys.",
          "Certificates, projects, surveys, and a professional profile in one platform.",
          "Clear progress tracking from one milestone to the next.",
          "A learning experience designed for engineers seeking professional distinction.",
          "Continuous content development aligned with real market needs.",
        ],
        ctaLabel: "Your next step starts here",
        ctaTitle: "Choose the path that leads you toward professional mastery.",
        ctaButton: "Explore Career Paths",
      };

  const DirectionArrow = isArabic ? ArrowLeft : ArrowRight;

  return (
    <>
      <Navbar activeItem="about" />

      <main className="min-h-screen bg-[#F7F8FA] pt-[55px]">
        <AnnouncementBar />

        {/* Hero */}
        <section className="relative overflow-hidden bg-[#07152E]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(247,181,72,0.16),transparent_28%),radial-gradient(circle_at_84%_65%,rgba(255,255,255,0.06),transparent_25%)]" />

          <div
            dir={isArabic ? "rtl" : "ltr"}
            className="relative mx-auto grid max-w-[1480px] items-center gap-6 px-5 py-10 sm:px-6 sm:py-12 lg:grid-cols-[1.12fr_0.88fr] lg:px-10 lg:py-14"
          >
            <div className={isArabic ? "text-right" : "text-left"}>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#F7B548]/35 bg-[#F7B548]/10 px-4 py-2 text-[15px] font-black text-[#F7B548]">
                <Sparkles size={15} />
                {text.badge}
              </span>

              <h1 className="mt-4 text-[32px] font-black leading-[1.18] text-white sm:text-[35px] lg:text-[40px]">
                {text.heroLine1}
                <span className="block text-[#F7B548]">{text.heroLine2}</span>
              </h1>

              <p className="mt-4 max-w-3xl text-[14px] font-semibold leading-7 text-slate-300 sm:text-[15px]">
                {text.heroDescription}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/career-path/road-design"
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#F7B548] px-5 text-[14px] font-black text-[#07152E] transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  {text.explorePaths}
                  <DirectionArrow size={15} />
                </Link>

                <Link
                  href="/"
                  className="inline-flex h-11 items-center rounded-xl border border-white/25 bg-white/[0.04] px-5 text-[14px] font-black text-white transition hover:border-[#F7B548] hover:text-[#F7B548]"
                >
                  {text.journeyCenter}
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {text.heroCards.map(([title, subtitle, Icon]) => {
                const IconComponent = Icon as typeof GraduationCap;

                return (
                  <div
                    key={String(title)}
                    className="min-h-[130px] rounded-[20px] border border-white/10 bg-white/[0.055] p-4 backdrop-blur-sm sm:min-h-[140px] sm:p-5"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F7B548] text-[#07152E]">
                      <IconComponent size={20} />
                    </span>

                    <h3 className="mt-3 text-[15px] font-black text-white sm:text-[16px]">
                      {String(title)}
                    </h3>

                    <p className="mt-1 text-[12px] font-bold leading-5 text-white/60 sm:text-[13px]">
                      {String(subtitle)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Who we are / Vision / Mission */}
        <section
          dir={isArabic ? "rtl" : "ltr"}
          className="mx-auto max-w-[1360px] px-5 py-10 sm:px-6 lg:px-10 lg:py-12"
        >
          <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-[24px] border border-[#DCE2EA] bg-white p-6 shadow-[0_14px_35px_rgba(7,21,46,0.06)] lg:p-7">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FFF4DF] text-[#C88712]">
                  <ShieldCheck size={22} />
                </span>
                <h2 className="text-[25px] font-black text-[#07152E]">
                  {text.whoLabel}
                </h2>
              </div>

              <p className="mt-4 text-[14px] font-semibold leading-7 text-slate-600">
                {text.whoP1}
              </p>

              <p className="mt-3 text-[14px] font-semibold leading-7 text-slate-600">
                {text.whoP2}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-[22px] bg-[#07152E] p-5 text-white">
                <p className="text-[15px] font-black text-[#F7B548]">{text.vision}</p>
                <h3 className="mt-2 text-[20px] font-black">{text.visionTitle}</h3>
                <p className="mt-2 text-[13px] font-semibold leading-6 text-white/65">
                  {text.visionDescription}
                </p>
              </div>

              <div className="rounded-[22px] border border-[#E2D1AD] bg-[#FFF8EA] p-5">
                <p className="text-[15px] font-black text-[#B8780A]">{text.mission}</p>
                <h3 className="mt-2 text-[20px] font-black text-[#07152E]">
                  {text.missionTitle}
                </h3>
                <p className="mt-2 text-[13px] font-semibold leading-6 text-slate-600">
                  {text.missionDescription}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Method */}
        <section dir={isArabic ? "rtl" : "ltr"} className="bg-white py-10 lg:py-12">
          <div className="mx-auto max-w-[1360px] px-5 sm:px-6 lg:px-10">
            <div className="text-center">
              <p className="text-[15px] font-black text-[#C88712]">{text.methodLabel}</p>
              <h2 className="mt-1 text-[27px] font-black text-[#07152E] sm:text-[30px]">
                {text.methodTitle}
              </h2>
              <p className="mx-auto mt-2 max-w-2xl text-[14px] font-semibold leading-7 text-slate-500">
                {text.methodDescription}
              </p>
            </div>

            <div className="mt-7 grid gap-4 md:grid-cols-3">
              {text.pillars.map((item) => {
                const Icon = item.icon;
                return (
                  <article
                    key={item.title}
                    className="rounded-[22px] border border-[#E0E6ED] bg-[#F9FBFD] p-5 transition hover:-translate-y-1 hover:border-[#F7B548] hover:shadow-[0_12px_30px_rgba(7,21,46,0.06)]"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#07152E] text-[#F7B548]">
                      <Icon size={21} />
                    </span>
                    <h3 className="mt-4 text-[18px] font-black text-[#07152E]">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-[13px] font-semibold leading-6 text-slate-600">
                      {item.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* Why Masar */}
        <section
          dir={isArabic ? "rtl" : "ltr"}
          className="mx-auto max-w-[1360px] px-5 py-10 sm:px-6 lg:px-10 lg:py-12"
        >
          <div className="overflow-hidden rounded-[26px] border border-[#DCE2EA] bg-white shadow-[0_16px_40px_rgba(7,21,46,0.06)]">
            <div className="flex items-center gap-3 bg-[#07152E] px-6 py-5 text-white">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#F7B548]/35 bg-[#F7B548]/10 text-[#F7B548]">
                <Award size={22} />
              </span>
              <div>
                <p className="text-[15px] font-black text-[#F7B548]">{text.whyLabel}</p>
                <h2 className="mt-0.5 text-[22px] font-black sm:text-[24px]">{text.whyTitle}</h2>
              </div>
            </div>

            <div className="grid gap-3 p-5 md:grid-cols-2 lg:p-6">
              {text.advantages.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-[15px] border border-[#E5EAF0] bg-[#FAFBFD] px-4 py-3"
                >
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F7B548] text-[#07152E]">
                    <ShieldCheck size={14} />
                  </span>
                  <p className="text-[14px] font-bold leading-6 text-[#334155]">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Full-width CTA */}
        <section
          dir={isArabic ? "rtl" : "ltr"}
          className="relative overflow-hidden bg-[#07152E] px-5 py-8 text-white sm:px-6 lg:px-10"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_75%_50%,rgba(247,181,72,0.12),transparent_26%)]" />
          <div className="relative mx-auto flex max-w-[1360px] flex-col items-start justify-between gap-5 md:flex-row md:items-center">
            <div className={isArabic ? "text-right" : "text-left"}>
              <p className="text-[15px] font-black text-[#F7B548]">{text.ctaLabel}</p>
              <h2 className="mt-1 text-[23px] font-black sm:text-[26px]">{text.ctaTitle}</h2>
            </div>

            <Link
              href="/career-path/road-design"
              className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-[#F7B548] px-5 text-[14px] font-black text-[#07152E] transition hover:-translate-y-0.5"
            >
              {text.ctaButton}
              <DirectionArrow size={15} />
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}