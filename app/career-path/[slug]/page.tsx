import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  BookOpen,
  Clock3,
  FolderKanban,
  GraduationCap,
} from "lucide-react";

import Navbar from "@/sections/Navbar";
import AnnouncementBar from "@/sections/AnnouncementBar";

import PathSwitcher from "@/components/career-paths/PathSwitcher";
import PathRoadmap from "@/components/career-paths/PathRoadmap";

import {
  getCareerPathBySlug,
  getCoursesTrainingMinutes,
} from "@/lib/queries/catalog/career-paths";

import type { Course } from "@/data/types";

type Locale = "ar" | "en";

type CareerPathPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const labels = {
  ar: {
    notFound: "المسار غير موجود | Masar Makers",
    defaultDescription:
      "استكشف رحلات الاحتراف في منصة صناع المسار.",
    stations: "محطات تعليمية",
    journeys: "رحلات تدريبية",
    trainingContent: "محتوى تدريبي",
    level: "المستوى",
    professional: "احترافي",
    hours: "ساعة",
    trainingHours: "ساعات تدريبية",
    journey: "رحلة",
    journeysPlural: "رحلات",
    heroFallback:
      "رحلة تعليمية متكاملة تقودك إلى مستوى احترافي.",
  },
  en: {
    notFound: "Career path not found | Masar Makers",
    defaultDescription:
      "Explore professional learning journeys on Masar Makers.",
    stations: "Learning Stations",
    journeys: "Training Journeys",
    trainingContent: "Training Content",
    level: "Level",
    professional: "Professional",
    hours: "Hours",
    trainingHours: "Training Hours",
    journey: "Journey",
    journeysPlural: "Journeys",
    heroFallback:
      "An integrated learning journey that leads you to a professional level.",
  },
} as const;

export const dynamic = "force-dynamic";

/* ==================================================
   Metadata
================================================== */

export async function generateMetadata({
  params,
}: CareerPathPageProps): Promise<Metadata> {
  const { slug } = await params;

  const path = await getCareerPathBySlug(slug);

  if (!path) {
    return {
      title: labels.ar.notFound,
    };
  }

  return {
    title: `${path.title} | Masar Makers`,
    description:
      path.description ??
      labels.ar.defaultDescription,
  };
}

/* ==================================================
   Page
================================================== */

export default async function CareerPathPage({
  params,
}: CareerPathPageProps) {
  const { slug } = await params;

  const path = await getCareerPathBySlug(slug);

  if (!path) {
    notFound();
  }

  /*
   * اللغة هنا عربية مؤقتًا حتى نعيد تفعيل زر اللغة.
   * تجهيز النصوص والـlayout بالأسفل يسمح بتمرير "en"
   * لاحقًا من cookie / route locale بدون إعادة بناء المكونات.
   */
  const locale: Locale = "ar";
  const text = labels[locale];
  const isArabic = locale === "ar";

  const activeStations = path.course_stations.filter(
    (station) => station.is_active
  );

  const stationStats = await Promise.all(
    activeStations.map(async (station) => {
      const activeCourses = station.courses.filter(
        (course) => course.is_active
      );

      const courseIds = activeCourses.map(
        (course) => course.id
      );

      const totalMinutes =
        await getCoursesTrainingMinutes(
          courseIds
        );

      const journeysCount =
        activeCourses.reduce(
          (total, course) =>
            total +
            (course.level === "split" ? 2 : 1),
          0
        );

      const roundedHours =
        totalMinutes > 0
          ? Math.ceil(totalMinutes / 60 / 5) * 5
          : 0;

      return {
        stationId: station.id,
        journeysCount,
        roundedHours,
      };
    })
  );

  const stationStatsMap = new Map(
    stationStats.map((item) => [
      item.stationId,
      item,
    ])
  );

  const roadmapCourses: Course[] =
    activeStations
      .map((station, stationIndex) => {
        const activeCourses = station.courses
          .filter((course) => course.is_active)
          .sort(
            (a, b) =>
              a.display_order - b.display_order
          );

        const currentStationStats =
          stationStatsMap.get(station.id);

        const representativeCourse =
          activeCourses.find(
            (course) => course.is_featured
          ) ??
          activeCourses.find((course) =>
            course.slug.includes("integrated")
          ) ??
          activeCourses[0];

        const representativeJourney =
          representativeCourse?.journeys.find(
            (journey) =>
              journey.journey_type ===
                "professional" &&
              journey.is_active
          ) ??
          representativeCourse?.journeys[0];

        const stationIsComingSoon =
          activeCourses.length > 0 &&
          activeCourses.every((course) =>
            course.journeys.every(
              (journey) =>
                journey.status === "coming_soon"
            )
          );

        return {
          id: stationIndex + 1,
          slug: station.slug,
          title: station.title,
          shortTitle:
            station.short_title ??
            station.title,
          description:
            station.description ??
            representativeCourse?.description ??
            "",
          image:
            station.image_url ??
            representativeCourse?.image_url ??
            "/images/courses/course-placeholder.jpg",
          icon:
            station.icon_url ??
            representativeCourse?.icon_url ??
            "/images/courses/icons/default.png",
          pathSlug: path.slug,
          type: "professional",
          duration:
            currentStationStats?.roundedHours
              ? `${currentStationStats.roundedHours} ${text.trainingHours}`
              : `0 ${text.trainingHours}`,
          projects:
            `${currentStationStats?.journeysCount ?? 0} ${
              (currentStationStats?.journeysCount ?? 0) === 1
                ? text.journey
                : text.journeysPlural
            }`,
          level:
            representativeCourse?.level ??
            text.professional,
          instructorIds: [],
          professionalJourneyId:
            representativeJourney?.id,
          professionalJourneyStatus:
            stationIsComingSoon
              ? "coming_soon"
              : representativeJourney?.status ??
                "open",
          featured:
            representativeCourse?.is_featured ??
            false,
          active: station.is_active,
          order: station.display_order,
        } as Course;
      })
      .sort((a, b) => a.order - b.order);

  const totalStations = activeStations.length;

  const totalJourneys = activeStations.reduce(
    (stationTotal, station) =>
      stationTotal +
      station.courses
        .filter((course) => course.is_active)
        .reduce(
          (courseTotal, course) =>
            courseTotal +
            (course.level === "split" ? 2 : 1),
          0
        ),
    0
  );

  const totalTrainingHours = activeStations.reduce(
    (stationTotal, station) => {
      const stationHours =
        station.courses
          .filter((course) => course.is_active)
          .reduce(
            (courseTotal, course) =>
              courseTotal +
              Math.max(
                0,
                Number(
                  course.duration_hours ?? 0
                )
              ),
            0
          );

      return stationTotal + stationHours;
    },
    0
  );

  const heroImage =
    path.image_url ??
    (path.slug === "traffic"
      ? "/images/courses/traffic-track.jpg"
      : "/images/courses/road-track.jpg");

  return (
    <main
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-screen bg-[#F7F8FA]"
    >
      <Navbar />

      <div className="h-[55px]" />

      <AnnouncementBar />

      <PathSwitcher
        activeSlug={path.slug}
        locale={locale}
      />

      {/* Compact responsive hero */}
      <section
        className="
          relative
          min-h-[118px]
          overflow-hidden
          bg-[#07152E]
          sm:min-h-[135px]
          lg:h-[140px]
          lg:min-h-0
        "
      >
        <Image
          src={heroImage}
          alt={path.title}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />

        <div
          className={`
            absolute inset-0
            ${
              isArabic
                ? "bg-gradient-to-l from-[#07152E]/95 via-[#07152E]/70 to-[#07152E]/30"
                : "bg-gradient-to-r from-[#07152E]/95 via-[#07152E]/70 to-[#07152E]/30"
            }
          `}
        />

        <div
          className="
            relative z-10
            mx-auto
            grid min-h-[118px]
            max-w-[1480px]
            grid-cols-[1.05fr_0.95fr]
            items-center
            gap-2
            px-3 py-2.5

            sm:min-h-[135px]
            sm:gap-4
            sm:px-5
            sm:py-3

            lg:h-full
            lg:min-h-0
            lg:grid-cols-[1.18fr_0.82fr]
            lg:gap-8
            lg:px-10
            lg:py-0
          "
        >
          {/* Path info */}
          <div className="min-w-0 text-start text-white">
            <h1
              className="
                text-[16px]
                font-black
                leading-[1.25]

                sm:text-[20px]
                lg:text-[34px]
              "
            >
              {path.title}
            </h1>

            <p
              className="
                mt-1
                line-clamp-2
                max-w-[700px]
                text-[7.5px]
                font-medium
                leading-3
                text-slate-200

                sm:text-[9px]
                sm:leading-4

                lg:mt-1.5
                lg:text-[12px]
                lg:leading-5
              "
            >
              {path.description ??
                text.heroFallback}
            </p>
          </div>

          {/* Stats */}
          <div
            className="
              grid
              grid-cols-2
              gap-x-2
              gap-y-2
              ps-2

              sm:gap-x-4
              sm:gap-y-3
              sm:ps-4

              lg:gap-x-8
              lg:gap-y-3
              lg:border-s
              lg:border-white/20
              lg:ps-6
            "
          >
            <PathStat
              icon={BookOpen}
              value={totalStations}
              label={text.stations}
            />

            <PathStat
              icon={FolderKanban}
              value={totalJourneys}
              label={text.journeys}
            />

            <PathStat
              icon={Clock3}
              value={
                totalTrainingHours > 0
                  ? `${totalTrainingHours}`
                  : "—"
              }
              label={text.trainingContent}
              suffix={
                totalTrainingHours > 0
                  ? text.hours
                  : undefined
              }
            />

            <PathStat
              icon={GraduationCap}
              value={text.professional}
              label={text.level}
              compactValue
            />
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section
        className="
          mx-auto
          max-w-[1480px]
          px-2.5
          py-2.5

          sm:px-4
          sm:py-3

          lg:px-10
          lg:py-4
        "
      >
        <PathRoadmap
          courses={roadmapCourses}
          locale={locale}
        />
      </section>
    </main>
  );
}

function PathStat({
  icon: Icon,
  value,
  label,
  suffix,
  compactValue = false,
}: {
  icon: typeof BookOpen;
  value: string | number;
  label: string;
  suffix?: string;
  compactValue?: boolean;
}) {
  return (
    <div
      className="
        flex
        min-w-0
        items-center
        gap-1.5

        sm:gap-2
        lg:gap-3
      "
    >
      <Icon
        size={15}
        className="
          shrink-0
          text-[#F7B548]

          sm:h-[18px]
          sm:w-[18px]

          lg:h-[21px]
          lg:w-[21px]
        "
      />

      <div className="min-w-0">
        <p
          className={`
            truncate
            font-black
            leading-none
            text-white

            ${
              compactValue
                ? "text-[10px] sm:text-[12px] lg:text-[16px]"
                : "text-[12px] sm:text-[14px] lg:text-[16px]"
            }
          `}
        >
          {value}
          {suffix ? (
            <span className="ms-0.5 text-[7px] sm:text-[8px] lg:text-[10px]">
              {suffix}
            </span>
          ) : null}
        </p>

        <p
          className="
            mt-0.5
            line-clamp-2
            text-[6px]
            font-bold
            leading-[1.15]
            text-slate-200

            sm:text-[8px]
            sm:leading-3

            lg:mt-1
            lg:text-[11px]
          "
        >
          {label}
        </p>
      </div>
    </div>
  );
}