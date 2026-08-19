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

type SectionKey = keyof (typeof sectionContent)["ar"];

export default function Home() {
  const mainRef = useRef<HTMLElement | null>(null);

  const [activeSection, setActiveSection] =
    useState<SectionKey>("paths");
const [locale, setLocale] = useState<Locale>("ar");

useEffect(() => {
  const savedLocale = window.localStorage.getItem("masar-locale");

  if (savedLocale === "ar" || savedLocale === "en") {
    setLocale(savedLocale);
  }

  const handleLocaleChange = (event: Event) => {
    const customEvent = event as CustomEvent<{
      locale?: Locale;
    }>;

    if (
      customEvent.detail?.locale === "ar" ||
      customEvent.detail?.locale === "en"
    ) {
      setLocale(customEvent.detail.locale);
    }
  };

  window.addEventListener(
    "masar:locale-change",
    handleLocaleChange
  );

  return () => {
    window.removeEventListener(
      "masar:locale-change",
      handleLocaleChange
    );
  };
}, []);
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
        // Activate a section when it reaches the central band of the
        // scroll area. This works consistently for short and tall
        // sections, so no section disappears because of its height.
        root: mainElement,
        rootMargin: "-35% 0px -35% 0px",
        threshold: 0,
      }
    );

    sections.forEach((section) => {
      observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  const currentContent =
  sectionContent[locale][activeSection];

  const sectionAnimation = (section: SectionKey) =>
    activeSection === section
      ? "translate-y-0 scale-100 opacity-100"
      : "pointer-events-none translate-y-5 scale-[0.985] opacity-0";

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
  h-[calc(100svh-390px)]
  min-h-[330px]
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
          className="flex min-h-full snap-start snap-always items-center overflow-hidden"
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
          className="flex min-h-full snap-start snap-always items-center overflow-hidden"
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
  className="flex min-h-full snap-start snap-always items-center overflow-hidden"
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
  className="flex min-h-full snap-start snap-always items-center overflow-hidden"
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
  className="flex min-h-full snap-start snap-always items-center overflow-hidden"
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
  className="flex min-h-full snap-start snap-always items-center overflow-hidden"
>
  <div
    className={`w-full transform-gpu transition-all duration-700 ease-out ${sectionAnimation(
      "testimonials"
    )}`}
  >
    <TestimonialsFromDB />
  </div>
</section>

{/* partners */}

<section
  data-home-section="partners"
  className="flex min-h-full snap-start snap-always items-center overflow-hidden"
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
  className="flex min-h-full snap-start snap-always items-center overflow-hidden"
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