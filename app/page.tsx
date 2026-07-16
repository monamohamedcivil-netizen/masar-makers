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
import Testimonials from "@/sections/Testimonials";
import Partners from "@/sections/Partners";
import FinalCTA from "@/sections/FinalCTA";

const sectionContent = {
  paths: {
    title: "المسارات المهنية",
    description: "اختر المسار الذي يقودك إلى مستقبل احترافي",
  },

  learning: {
    title: "كيف تحب أن تتعلم؟",
    description: "اختر أسلوب التعلم الذي يناسب وقتك وهدفك",
  },

  why: {
    title: "لماذا صناع المسار؟",
    description: "رحلات تعليمية احترافية تساعدك على بناء مسيرتك المهنية",
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

type SectionKey = keyof typeof sectionContent;

export default function Home() {
  const mainRef = useRef<HTMLElement | null>(null);

  const [activeSection, setActiveSection] =
    useState<SectionKey>("paths");

  useEffect(() => {
    const mainElement = mainRef.current;

    if (!mainElement) return;

    const sections = mainElement.querySelectorAll<HTMLElement>(
      "[data-home-section]"
    );

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleSections = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) =>
              b.intersectionRatio - a.intersectionRatio
          );

        const mostVisibleSection = visibleSections[0];

        if (!mostVisibleSection) return;

        const sectionName =
          mostVisibleSection.target.getAttribute(
            "data-home-section"
          ) as SectionKey | null;

        if (sectionName) {
          setActiveSection(sectionName);
        }
      },
      {
        root: mainElement,
        threshold: [0.35, 0.5, 0.65, 0.8],
      }
    );

    sections.forEach((section) => {
      observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  const currentContent = sectionContent[activeSection];

  const sectionAnimation = (section: SectionKey) =>
    activeSection === section
      ? "translate-y-0 scale-100 opacity-100"
      : "pointer-events-none translate-y-8 scale-[0.98] opacity-0";

  return (
    <>
      <Navbar activeItem="home" />
      <div className="h-[55px]" />
      <AnnouncementBar />
      <Hero />

      <SectionTitle
        title={currentContent.title}
        description={currentContent.description}
      />

      <main
        ref={mainRef}
        className="
          h-[calc(100vh-479px)]
          min-h-[350px]
          overflow-y-auto
          scroll-smooth
          snap-y
          snap-mandatory
          bg-[#F7F8FA]
        "
      >
        {/* Career Paths */}

        <section
          data-home-section="paths"
          className="flex min-h-full snap-start items-center overflow-hidden"
        >
          <div
            className={`w-full transform-gpu transition-all duration-700 ease-out ${sectionAnimation(
              "paths"
            )}`}
          >
            <CareerPaths />
          </div>
        </section>

        {/* Learning Modes */}

        <section
          data-home-section="learning"
          className="flex min-h-full snap-start items-center overflow-hidden"
        >
          <div
            className={`w-full transform-gpu transition-all duration-700 ease-out ${sectionAnimation(
              "learning"
            )}`}
          >
            <LearningModes />
          </div>
        </section>

        {/* Why Masar */}

        <section
  data-home-section="why"
  className="flex min-h-full snap-start items-center overflow-hidden"
>
  <div
    className={`w-full transform-gpu transition-all duration-700 ease-out ${sectionAnimation(
      "why"
    )}`}
  >
    <WhyMasar />
  </div>

   {/* PopularCourses */}

</section>
<section
  data-home-section="popular"
  className="flex min-h-full snap-start items-center overflow-hidden"
>
  <div
    className={`w-full transform-gpu transition-all duration-700 ease-out ${sectionAnimation(
      "popular"
    )}`}
  >
    <PopularCourses />
  </div>
</section>

{/* StudentProjects */}

<section
  data-home-section="projects"
  className="flex min-h-full snap-start items-center overflow-hidden"
>
  <div
    className={`w-full transform-gpu transition-all duration-700 ease-out ${sectionAnimation(
      "projects"
    )}`}
  >
    <StudentProjects />
  </div>
</section>

{/* Testimonials */}

<section
  data-home-section="testimonials"
  className="flex min-h-full snap-start items-center overflow-hidden"
>
  <div
    className={`w-full transform-gpu transition-all duration-700 ease-out ${sectionAnimation(
      "testimonials"
    )}`}
  >
    <Testimonials />
  </div>
</section>

{/* partners */}

<section
  data-home-section="partners"
  className="flex min-h-full snap-start items-center overflow-hidden"
>
  <div
    className={`w-full transform-gpu transition-all duration-700 ease-out ${sectionAnimation(
      "partners"
    )}`}
  >
    <Partners />
  </div>
</section>

{/* Final CTA */}

<section
  data-home-section="cta"
  className="flex min-h-full snap-start items-center overflow-hidden"
>
  <div
    className={`w-full transform-gpu transition-all duration-700 ease-out ${sectionAnimation(
      "cta"
    )}`}
  >
    <FinalCTA />
  </div>
</section>
      </main>
    </>
  );
  
}