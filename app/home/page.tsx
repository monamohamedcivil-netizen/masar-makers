"use client";

import { useEffect, useRef, useState } from "react";

import AnnouncementBar from "@/sections/AnnouncementBar";
import Navbar from "@/sections/Navbar";
import Hero from "@/sections/Hero";
import WhyMasar from "@/sections/WhyMasar";
import CareerPaths from "@/sections/CareerPaths";
import LearningModes from "@/sections/LearningModes";
import SectionTitle from "@/sections/SectionTitle";
import PopularCourses from "@/sections/PopularCourses";
import StudentProjects from "@/sections/StudentProjects";
import TestimonialsFromDB from "@/sections/TestimonialsFromDB";
import Partners from "@/sections/Partners";
import FinalCTA from "@/sections/FinalCTA";
import FitToHeight from "@/components/common/FitToHeight";

const sectionContent = {
  paths: {
    title: "المسارات المهنية",
    description:
      "اختر المسار الذي يقودك إلى مستقبل احترافي",
  },

  learning: {
    title: "كيف تحب أن تتعلم؟",
    description:
      "اختر أسلوب التعلم الذي يناسب وقتك وهدفك",
  },

  why: {
    title: "لماذا صناع المسار؟",
    description:
      "رحلات تعليمية احترافية تساعدك على بناء مسيرتك المهنية",
  },

  popular: {
    title: "الرحلات الأكثر طلبًا",
    description:
      "اكتشف الرحلات التي اختارها أكبر عدد من المهندسين لتطوير مهاراتهم",
  },

  projects: {
    title: "من التدريب إلى التنفيذ",
    description:
      "نماذج من مشاريع المتدربين التي تحولت فيها المعرفة إلى تطبيقات هندسية حقيقية",
  },

  testimonials: {
    title: "قصص نجاح المتدربين",
    description:
      "آراء وتجارب مهندسين تحول فيها التعلم إلى تطبيق عملي ونتائج مهنية حقيقية",
  },

  partners: {
    title: "شركاؤنا في النجاح",
    description:
      "تعاونات مهنية وتقنية تساعدنا على تقديم تجربة تعلم أكثر قوة وارتباطًا بسوق العمل",
  },

  cta: {
    title: "ابدأ رحلتك الآن",
    description:
      "اختر هدفك وابدأ بخطوة عملية تقودك إلى مستوى مهني أقوى",
  },
};

type SectionKey =
  keyof typeof sectionContent;

export default function Home() {
  const mainRef =
    useRef<HTMLElement | null>(null);

  const [activeSection, setActiveSection] =
    useState<SectionKey>("paths");

  const sectionNavRef =
    useRef<HTMLElement | null>(null);

  /*
   * على الموبايل شريط الأقسام يُسحب أفقيًا:
   * نحرّكه تلقائيًا حتى يبقى زر القسم الحالي ظاهرًا في المنتصف.
   */
  useEffect(() => {
    const nav =
      sectionNavRef.current;

    const activeButton =
      nav?.querySelector<HTMLElement>(
        `[data-nav-section="${activeSection}"]`,
      );

    if (!nav || !activeButton) {
      return;
    }

    const navRect =
      nav.getBoundingClientRect();
    const buttonRect =
      activeButton.getBoundingClientRect();

    nav.scrollBy({
      left:
        buttonRect.left +
        buttonRect.width / 2 -
        (navRect.left + navRect.width / 2),
      behavior: "smooth",
    });
  }, [activeSection]);

  function scrollToSection(
    section: SectionKey,
  ) {
    const mainElement =
      mainRef.current;

    const target =
      mainElement?.querySelector<HTMLElement>(
        `[data-home-section="${section}"]`,
      );

    if (!mainElement || !target) {
      return;
    }

    // نحرّك منطقة الأقسام فقط (scrollIntoView كان يحرّك الصفحة كلها أحيانًا).
    mainElement.scrollTo({
      top:
        mainElement.scrollTop +
        target.getBoundingClientRect().top -
        mainElement.getBoundingClientRect().top,
      behavior: "smooth",
    });

    setActiveSection(section);
  }

  useEffect(() => {
    const mainElement =
      mainRef.current;

    if (!mainElement) {
      return;
    }

    const sections =
      mainElement.querySelectorAll<HTMLElement>(
        "[data-home-section]",
      );

    const observer =
      new IntersectionObserver(
        (entries) => {
          const visibleSections =
            entries
              .filter(
                (entry) =>
                  entry.isIntersecting,
              )
              .sort(
                (a, b) =>
                  b.intersectionRatio -
                  a.intersectionRatio,
              );

          const mostVisibleSection =
            visibleSections[0];

          if (!mostVisibleSection) {
            return;
          }

          const sectionName =
            mostVisibleSection.target.getAttribute(
              "data-home-section",
            ) as SectionKey | null;

          if (sectionName) {
            setActiveSection(
              sectionName,
            );
          }
        },
        {
          root: mainElement,

          /*
           * نراقب الشريط الأوسط من منطقة الأقسام.
           * عندما يدخل القسم إلى المنتصف يصبح هو القسم النشط.
           * هذا أكثر ثباتًا من threshold 35%-80% على الموبايل.
           */
          rootMargin:
            "-35% 0px -35% 0px",

          threshold: 0,
        },
      );

    sections.forEach((section) => {
      observer.observe(section);
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  const currentContent =
    sectionContent[activeSection];

  const sectionAnimation = (
    section: SectionKey,
  ) =>
    activeSection === section
      ? "translate-y-0 scale-100 opacity-100"
      : "pointer-events-none translate-y-5 scale-[0.985] opacity-0";

  /*
   * كل قسم بارتفاع منطقة العرض بالضبط ويثبت عليها التمرير (بدون فراغات).
   * FitToHeight يصغّر محتوى القسم إذا كان أطول من الشاشة، فيظهر كاملًا بدون تمرير داخلي.
   */
  const sectionClassName =
    "h-full snap-start snap-always overflow-hidden";

  const sectionContentClass = (
    section: SectionKey,
  ) =>
    `w-full min-w-0 transform-gpu transition-all duration-700 ease-out ${sectionAnimation(
      section,
    )}`;

  const sectionKeys =
    Object.keys(
      sectionContent,
    ) as SectionKey[];

  return (
    <div className="flex h-[100svh] flex-col overflow-hidden">
      <Navbar activeItem="home" />

      <div className="h-[55px] shrink-0" />

      <div className="shrink-0">
        <AnnouncementBar />
      </div>

      <div className="shrink-0">
        <Hero />
      </div>

      <div className="shrink-0">
        <SectionTitle
          title={currentContent.title}
          description={
            currentContent.description
          }
        />
      </div>

      <div className="min-h-0 flex-1">
      <main
        ref={mainRef}
        className="
          h-full
          w-full
          min-w-0
          overflow-x-hidden
          overflow-y-auto
          snap-y
          snap-mandatory
          scroll-smooth
          overscroll-contain
          bg-[#F7F8FA]
          [scrollbar-width:none]
          [&::-webkit-scrollbar]:hidden
        "
      >
        {/* Career Paths */}
        <section
          data-home-section="paths"
          className={sectionClassName}
        >
          <FitToHeight
            className={sectionContentClass(
              "paths",
            )}
          >
            <CareerPaths />
          </FitToHeight>
        </section>

        {/* Learning Modes */}
        <section
          data-home-section="learning"
          className={sectionClassName}
        >
          <FitToHeight
            className={sectionContentClass(
              "learning",
            )}
          >
            <LearningModes />
          </FitToHeight>
        </section>

        {/* Why Masar */}
        <section
          data-home-section="why"
          className={sectionClassName}
        >
          <FitToHeight
            className={sectionContentClass(
              "why",
            )}
          >
            <WhyMasar />
          </FitToHeight>
        </section>

        {/* Popular Courses */}
        <section
          data-home-section="popular"
          className={sectionClassName}
        >
          <FitToHeight
            className={sectionContentClass(
              "popular",
            )}
          >
            <PopularCourses />
          </FitToHeight>
        </section>

        {/* Student Projects */}
        <section
          data-home-section="projects"
          className={sectionClassName}
        >
          <FitToHeight
            className={sectionContentClass(
              "projects",
            )}
          >
            <StudentProjects />
          </FitToHeight>
        </section>

        {/* Testimonials */}
        <section
          data-home-section="testimonials"
          className={sectionClassName}
        >
          <FitToHeight
            className={sectionContentClass(
              "testimonials",
            )}
          >
            <TestimonialsFromDB />
          </FitToHeight>
        </section>

        {/* Partners */}
        <section
          data-home-section="partners"
          className={sectionClassName}
        >
          <FitToHeight
            className={sectionContentClass(
              "partners",
            )}
          >
            <Partners />
          </FitToHeight>
        </section>

        {/* Final CTA */}
        <section
          data-home-section="cta"
          className={sectionClassName}
        >
          <FitToHeight
            className={sectionContentClass(
              "cta",
            )}
          >
            <FinalCTA />
          </FitToHeight>
        </section>
      </main>
      </div>

      {/*
        شريط التنقل بين الأقسام أسفل الصفحة:
        زر لكل قسم، يضيء زر القسم الحالي، والضغط ينقل للقسم مباشرة.
      */}
      <nav
        ref={sectionNavRef}
        aria-label="أقسام الصفحة"
        className="
          shrink-0
          overflow-x-auto
          border-t
          border-[#F7B548]/25
          bg-[#07152E]
          px-3
          py-2
          [scrollbar-width:none]
          [&::-webkit-scrollbar]:hidden
        "
        style={{
          paddingBottom:
            "max(0.5rem, env(safe-area-inset-bottom))",
        }}
      >
        <div className="mx-auto flex w-max items-center gap-1.5 sm:gap-2">
          {sectionKeys.map((key) => {
            const active =
              activeSection === key;

            return (
              <button
                key={key}
                type="button"
                data-nav-section={key}
                aria-current={
                  active ? "true" : undefined
                }
                onClick={() =>
                  scrollToSection(key)
                }
                className={`
                  whitespace-nowrap
                  rounded-full
                  border
                  px-3
                  py-1
                  text-[12px]
                  font-semibold
                  transition-all
                  duration-300
                  sm:px-3.5
                  sm:text-[13px]
                  ${
                    active
                      ? "border-[#E9C989] bg-[#E9C989] text-[#07152E] shadow-[0_0_16px_rgba(233,201,137,.5)]"
                      : "border-slate-200 bg-slate-100 text-[#07152E] hover:border-[#E9C989] hover:bg-white"
                  }
                `}
              >
                {sectionContent[key].title}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}