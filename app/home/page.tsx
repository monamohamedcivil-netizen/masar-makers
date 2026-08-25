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

  const sectionClassName =
    "flex min-h-full snap-start snap-always items-center overflow-hidden";

  const sectionContentClass = (
    section: SectionKey,
  ) =>
    `w-full min-w-0 transform-gpu transition-all duration-700 ease-out ${sectionAnimation(
      section,
    )}`;

  return (
    <>
      <Navbar activeItem="home" />

      <div className="h-[55px]" />

      <AnnouncementBar />

      <Hero />

      <SectionTitle
        title={currentContent.title}
        description={
          currentContent.description
        }
      />

      <main
        ref={mainRef}
        className="
          h-[calc(100svh-390px)]
          min-h-[330px]
          w-full
          min-w-0
          overflow-x-hidden
          overflow-y-auto
          snap-y
          snap-mandatory
          scroll-smooth
          overscroll-contain
          bg-[#F7F8FA]

          md:h-[calc(100vh-479px)]
          md:min-h-[350px]
        "
      >
        {/* Career Paths */}
        <section
          data-home-section="paths"
          className={sectionClassName}
        >
          <div
            className={sectionContentClass(
              "paths",
            )}
          >
            <CareerPaths />
          </div>
        </section>

        {/* Learning Modes */}
        <section
          data-home-section="learning"
          className={sectionClassName}
        >
          <div
            className={sectionContentClass(
              "learning",
            )}
          >
            <LearningModes />
          </div>
        </section>

        {/* Why Masar */}
        <section
          data-home-section="why"
          className={sectionClassName}
        >
          <div
            className={sectionContentClass(
              "why",
            )}
          >
            <WhyMasar />
          </div>
        </section>

        {/* Popular Courses */}
        <section
          data-home-section="popular"
          className={sectionClassName}
        >
          <div
            className={sectionContentClass(
              "popular",
            )}
          >
            <PopularCourses />
          </div>
        </section>

        {/* Student Projects */}
        <section
          data-home-section="projects"
          className={sectionClassName}
        >
          <div
            className={sectionContentClass(
              "projects",
            )}
          >
            <StudentProjects />
          </div>
        </section>

        {/* Testimonials */}
        <section
          data-home-section="testimonials"
          className={sectionClassName}
        >
          <div
            className={sectionContentClass(
              "testimonials",
            )}
          >
            <TestimonialsFromDB />
          </div>
        </section>

        {/* Partners */}
        <section
          data-home-section="partners"
          className={sectionClassName}
        >
          <div
            className={sectionContentClass(
              "partners",
            )}
          >
            <Partners />
          </div>
        </section>

        {/* Final CTA */}
        <section
          data-home-section="cta"
          className={sectionClassName}
        >
          <div
            className={sectionContentClass(
              "cta",
            )}
          >
            <FinalCTA />
          </div>
        </section>
      </main>
    </>
  );
}