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

type Locale = "ar" | "en";

const sectionContent = {
  ar: {
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
  },

  en: {
    paths: {
      title: "Career Paths",
      description:
        "Choose the path that leads you toward a professional future",
    },

    learning: {
      title: "How Do You Prefer to Learn?",
      description:
        "Choose the learning experience that best fits your time and goals",
    },

    why: {
      title: "Why Masar Makers?",
      description:
        "Professional learning journeys designed to help you build your career",
    },

    popular: {
      title: "Most Popular Journeys",
      description:
        "Discover the journeys chosen by engineers to develop their professional skills",
    },

    projects: {
      title: "From Learning to Practice",
      description:
        "Explore trainee projects where engineering knowledge became real-world applications",
    },

    testimonials: {
      title: "Learner Success Stories",
      description:
        "Real experiences from engineers who transformed learning into practical results",
    },

    partners: {
      title: "Our Success Partners",
      description:
        "Professional and technology partnerships that strengthen the learning experience",
    },

    cta: {
      title: "Start Your Journey",
      description:
        "Choose your goal and take the first practical step toward stronger professional skills",
    },
  },
} as const;

type SectionKey =
  keyof (typeof sectionContent)["ar"];

export default function Home() {
  const mainRef =
    useRef<HTMLElement | null>(null);

  const [activeSection, setActiveSection] =
    useState<SectionKey>("paths");

  const [locale, setLocale] =
    useState<Locale>("ar");

  useEffect(() => {
    const savedLocale =
      window.localStorage.getItem(
        "masar-locale",
      );

    if (
      savedLocale === "ar" ||
      savedLocale === "en"
    ) {
      setLocale(savedLocale);
    }

    const handleLocaleChange = (
      event: Event,
    ) => {
      const customEvent =
        event as CustomEvent<{
          locale?: Locale;
        }>;

      if (
        customEvent.detail?.locale ===
          "ar" ||
        customEvent.detail?.locale ===
          "en"
      ) {
        setLocale(
          customEvent.detail.locale,
        );
      }
    };

    window.addEventListener(
      "masar:locale-change",
      handleLocaleChange,
    );

    return () => {
      window.removeEventListener(
        "masar:locale-change",
        handleLocaleChange,
      );
    };
  }, []);

  useEffect(() => {
    const mainElement =
      mainRef.current;

    if (!mainElement) return;

    const sections =
      mainElement.querySelectorAll<HTMLElement>(
        "[data-home-section]",
      );

    const isDesktop =
      window.matchMedia(
        "(min-width: 768px)",
      ).matches;

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
          /*
           * Desktop:
           * main نفسه هو منطقة الـ scroll.
           *
           * Mobile:
           * الصفحة كلها تتحرك بصورة طبيعية،
           * لذلك نراقب بالنسبة للـ viewport.
           */
          root:
            isDesktop
              ? mainElement
              : null,

          rootMargin:
            isDesktop
              ? "-35% 0px -35% 0px"
              : "-25% 0px -55% 0px",

          threshold: 0,
        },
      );

    sections.forEach((section) => {
      observer.observe(section);
    });

    return () =>
      observer.disconnect();
  }, []);

  const currentContent =
    sectionContent[locale][
      activeSection
    ];

  /*
   * Animation الحالية نحتفظ بها على Desktop فقط.
   *
   * على Mobile يجب ألا نخفي السكاشن غير النشطة،
   * لأن الصفحة أصبحت Scroll طبيعي.
   */
  const sectionAnimation = (
    section: SectionKey,
  ) =>
    activeSection === section
      ? `
          md:translate-y-0
          md:scale-100
          md:opacity-100
        `
      : `
          md:pointer-events-none
          md:translate-y-5
          md:scale-[0.985]
          md:opacity-0
        `;

  const sectionClassName = `
    relative
    w-full
    min-w-0
    overflow-visible
    py-3

    md:flex
    md:min-h-full
    md:snap-start
    md:snap-always
    md:items-center
    md:overflow-hidden
    md:py-0
  `;

  const contentClassName = (
    section: SectionKey,
  ) => `
    w-full
    min-w-0
    max-w-full
    transform-gpu
    opacity-100

    md:transition-all
    md:duration-700
    md:ease-out

    ${sectionAnimation(section)}
  `;

  return (
    <div className="w-full max-w-full overflow-x-hidden">
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
          w-full
          min-w-0
          max-w-full
          overflow-x-hidden
          overflow-y-visible
          bg-[#F7F8FA]

          md:h-[calc(100vh-479px)]
          md:min-h-[350px]
          md:overflow-y-auto
          md:snap-y
          md:snap-mandatory
          md:scroll-smooth
          md:overscroll-contain
        "
      >
        {/* Career Paths */}
        <section
          data-home-section="paths"
          className={
            sectionClassName
          }
        >
          <div
            className={contentClassName(
              "paths",
            )}
          >
            <CareerPaths />
          </div>
        </section>

        {/* Learning Modes */}
        <section
          data-home-section="learning"
          className={
            sectionClassName
          }
        >
          <div
            className={contentClassName(
              "learning",
            )}
          >
            <LearningModes />
          </div>
        </section>

        {/* Why Masar */}
        <section
          data-home-section="why"
          className={
            sectionClassName
          }
        >
          <div
            className={contentClassName(
              "why",
            )}
          >
            <WhyMasar />
          </div>
        </section>

        {/* Popular Courses */}
        <section
          data-home-section="popular"
          className={
            sectionClassName
          }
        >
          <div
            className={contentClassName(
              "popular",
            )}
          >
            <PopularCourses />
          </div>
        </section>

        {/* Student Projects */}
        <section
          data-home-section="projects"
          className={
            sectionClassName
          }
        >
          <div
            className={contentClassName(
              "projects",
            )}
          >
            <StudentProjects />
          </div>
        </section>

        {/* Testimonials */}
        <section
          data-home-section="testimonials"
          className={
            sectionClassName
          }
        >
          <div
            className={contentClassName(
              "testimonials",
            )}
          >
            <TestimonialsFromDB />
          </div>
        </section>

        {/* Partners */}
        <section
          data-home-section="partners"
          className={
            sectionClassName
          }
        >
          <div
            className={contentClassName(
              "partners",
            )}
          >
            <Partners />
          </div>
        </section>

        {/* Final CTA */}
        <section
          data-home-section="cta"
          className={
            sectionClassName
          }
        >
          <div
            className={contentClassName(
              "cta",
            )}
          >
            <FinalCTA />
          </div>
        </section>
      </main>
    </div>
  );
}