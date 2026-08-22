"use client";

import RoadJourney from "@/components/RoadJourney";
import Image from "next/image";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import AuthLink from "@/components/AuthLink";

type Locale = "ar" | "en";

const labels = {
  ar: {
    sectionTitle: "المسارات المهنية",
sectionSubtitle: "اختر المسار الذي يقودك إلى مستقبل احترافي",

    roadTitle: "مسار تصميم الطرق",
    roadDescription:
      "رحلة متكاملة لتعلم أحدث الأدوات والتقنيات في تصميم الطرق من الأساس إلى الاحتراف.",
    trafficTitle: "مسار هندسة المرور",
    trafficDescription:
      "رحلة متكاملة لإتقان تحليل وتصميم أنظمة المرور باستخدام أحدث البرامج.",
    explore: "استكشف المسار",
  },
  en: {
    sectionTitle: "Career Paths",
sectionSubtitle: "Choose the path that leads you to a professional future",
    roadTitle: "Road Design Path",
    roadDescription:
      "A complete journey to master modern road design tools and techniques from fundamentals to professional practice.",
    trafficTitle: "Traffic Engineering Path",
    trafficDescription:
      "A complete journey to master traffic analysis and system design using modern engineering software.",
    explore: "Explore Path",
  },
} as const;

const paths = [
  {
    key: "road",
    heroImage: "/images/paths/road-design.jpg",
    link: "/career-path/road-design",
    coursesList: [
      {
        title: "Civil 3D",
        icon: "/images/courses/icons/civil3d.png",
        href: "/course/civil-3d",
      },
      {
        title: "CSD",
        icon: "/images/courses/icons/csd.png",
        href: "/course/civil-site-design",
      },
      {
        title: "Smart Project\nDeliverables",
        icon: "/images/courses/icons/spd.png",
        href: "/course/smart-project-deliverables",
      },
      {
        title: "Vehicle Tracking",
        icon: "/images/courses/icons/vehicle-tracking.png",
        href: "/course/vehicle-tracking",
      },
      {
        title: "BIM for Roads",
        icon: "/images/courses/icons/bim-roads.png",
        href: "/course/bim-roads",
      },
    ],
  },
  {
    key: "traffic",
    heroImage: "/images/paths/traffic-engineering.jpg",
    link: "/career-path/traffic-engineering",
    coursesList: [
      {
        title: "SIDRA",
        image: "/images/courses/course-sidra.jpg",
        icon: "/images/courses/icons/sidra.png",
        href: "/course/sidra",
      },
      {
        title: "Synchro",
        image: "/images/courses/course-synchro.jpg",
        icon: "/images/courses/icons/synchro.png",
        href: "/course/synchro",
      },
      {
        title: "VISSIM",
        image: "/images/courses/course-vissim.jpg",
        icon: "/images/courses/icons/vissim.png",
        href: "/course/vissim",
      },
      {
        title: "VISUM",
        image: "/images/courses/course-visum.jpg",
        icon: "/images/courses/icons/visum.png",
        href: "/course/visum",
      },
      {
        title: "CUBE",
        image: "/images/courses/course-cube.jpg",
        icon: "/images/courses/icons/cube.png",
        href: "/course/cube",
      },
    ],
  },
];

export default function CareerPaths() {
  const router = useRouter();
  const [activeCourse, setActiveCourse] = useState([0, 0]);
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
    const timer = window.setInterval(() => {
      setActiveCourse((prev) =>
        prev.map(
          (item, index) =>
            (item + 1) %
            paths[index].coursesList.length,
        ),
      );
    }, 2600);

    return () => window.clearInterval(timer);
  }, []);

  const text = labels[locale];

  return (
    <section
      id="paths"
      dir={locale === "ar" ? "rtl" : "ltr"}
      className="w-full bg-[#F7F8FA] py-1 sm:py-4 lg:py-5"
    >
      <div className="mx-auto w-full max-w-[1600px] px-3 sm:px-5 lg:px-7 xl:px-10">
        <div className="grid gap-2 xl:grid-cols-2 xl:gap-5 2xl:gap-">
          {paths.map((path, pathIndex) => {
            const current = activeCourse[pathIndex];
            const isRoad = path.key === "road";

            const title = isRoad
              ? text.roadTitle
              : text.trafficTitle;

            const description = isRoad
              ? text.roadDescription
              : text.trafficDescription;

            return (
              <article
                key={path.key}
                className="
                  group relative mx-auto
                  h-[210px] w-full
                  overflow-hidden rounded-[24px]
                  bg-[#07152E] text-white
                  shadow-[0_22px_55px_rgba(7,21,46,0.22)]
                  ring-1 ring-[#07152E]/10
                  transition duration-500 hover:-translate-y-1
                  sm:h-[270px]
                  lg:h-[265px]
                  xl:max-w-[760px]
                  2xl:max-w-[790px]
                "
              >
                {/* Background */}
                <div className="absolute inset-x-0 top-0 h-[220px] overflow-hidden sm:h-[226px] lg:h-[232px]">
                  <Image
                    src={path.heroImage}
                    alt={title}
                    fill
                    sizes="(max-width: 1279px) 100vw, 790px"
                   className={`object-cover object-left transition-none ${
  locale === "en" ? "-scale-x-100" : ""
}`}
                  />

                  <div
                    className={`absolute inset-0 ${
                      locale === "ar"
                        ? "bg-gradient-to-l from-[#07152E] via-[#07152E]/88 to-transparent"
                        : "bg-gradient-to-r from-[#07152E] via-[#07152E]/88 to-transparent"
                    }`}
                  />

                  <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#07152E] via-[#07152E]/70 to-transparent" />
                </div>

                {/* Dark body */}
                <div className="absolute inset-x-0 bottom-0 top-[205px] bg-[#07152E] sm:top-[210px] lg:top-[216px]" />

                {/* Golden glow */}
                <div
                  className={`absolute -bottom-28 h-72 w-64 rounded-full bg-[#F7B548]/16 blur-3xl ${
                    locale === "ar"
                      ? "left-12"
                      : "right-12"
                  }`}
                />

                <div className="relative z-10 flex h-full flex-col px-4 pb-3 pt-4 sm:px-5 sm:pt-5">
                  {/* Heading */}
                  <div className="relative min-h-[118px] sm:min-h-[122px]">
                    <div
                      className={`w-[66%] sm:w-[64%] lg:w-[62%] ${
                        locale === "ar"
                          ? "ml-auto text-right"
                          : "mr-auto text-left"
                      }`}
                    >
                      <h3 className="text-[22px] font-black leading-tight sm:text-[24px] lg:text-[26px]">
                        {title}
                      </h3>

                      <div
                        className={`mt-1 h-[2px] w-36 rounded-full bg-[#F7B548] ${
                          locale === "ar"
                            ? "ml-auto"
                            : "mr-auto"
                        }`}
                      />

                      <p className="mt-1 line-clamp-2 text-[12px] font-semibold leading-5 text-slate-100 sm:text-[13px] sm:leading-6 lg:text-[14px]">
                        {description}
                      </p>
                    </div>

                    <AuthLink
                      href={path.link}
                      className={`absolute top-0 inline-flex items-center gap-2 rounded-2xl bg-[#F7B548] px-4 py-2 text-[11px] font-black text-[#07152E] shadow-[0_10px_25px_rgba(247,181,72,0.22)] transition hover:scale-105 sm:px-5 sm:text-[12px] ${
                        locale === "ar"
                          ? "left-0"
                          : "right-0"
                      }`}
                    >
                      {text.explore}
                      <ArrowLeft
                        size={14}
                        className={
                          locale === "en"
                            ? "rotate-180"
                            : ""
                        }
                      />
                    </AuthLink>
                  </div>

                  {/* Road raised upward */}
                  <div className="-mt-9 rounded-[22px] border border-white/15 bg-[#06142B]/90 px-3 pb-0 pt-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl sm:-mt-4 sm:px-4 sm:pb-2.5 sm:pt-1 lg:-mt-5">
                    <RoadJourney
  items={path.coursesList}
  activeIndex={current}
  direction={locale === "ar" ? "rtl" : "ltr"}
  onChange={(index) => {
    setActiveCourse((prev) => {
      const updated = [...prev];
      updated[pathIndex] = index;
      return updated;
    });

    const courseHref =
      path.coursesList[index]?.href;

    if (courseHref) {
      router.push(courseHref);
    }
  }}
/>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}