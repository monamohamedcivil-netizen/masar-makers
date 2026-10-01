import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Navbar from "@/sections/Navbar";
import AnnouncementBar from "@/sections/AnnouncementBar";

import CareerPathClientContent from "@/components/career-paths/CareerPathClientContent";

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

      /*
       * "الرحلات التدريبية" هنا تعني الرحلات التعليمية داخل المسار،
       * وليست سجلات journeys التقنية (Professional / One Day / Free).
       *
       * كورس كامل = رحلة واحدة
       * كورس Split = رحلتان (Fundamentals + Advanced)
       */
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
        totalMinutes,
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

  const buildRoadmapCourses = (locale: Locale): Course[] => {
    const text = labels[locale];

    return activeStations
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
  };

  const roadmapCoursesAr = buildRoadmapCourses("ar");
  const roadmapCoursesEn = buildRoadmapCourses("en");

  const totalStations = activeStations.length;

  /*
   * إجمالي الرحلات التدريبية في المسار
   * بنفس تعريف الرحلة المستخدم داخل كل محطة.
   */
  const totalJourneys =
    stationStats.reduce(
      (total, item) =>
        total + item.journeysCount,
      0
    );

  /*
   * المحتوى التدريبي ديناميكي من مدد المحاضرات المنشورة فعلًا.
   * نحافظ على نفس طريقة عرض مدة كل محطة:
   * تقريب مدة المحطة لأعلى إلى أقرب 5 ساعات، ثم جمع المحطات.
   */
  const totalTrainingHours =
    stationStats.reduce(
      (total, item) =>
        total + item.roundedHours,
      0
    );

  const heroImage =
    path.image_url ??
    (path.slug === "traffic"
      ? "/images/courses/traffic-track.jpg"
      : "/images/courses/road-track.jpg");

  return (
    <main className="min-h-screen bg-[#F7F8FA]">
      <Navbar />

      <div className="h-[55px]" />

      <AnnouncementBar />

      <CareerPathClientContent
        activeSlug={path.slug}
        pathTitle={path.title}
        pathDescription={path.description}
        heroImage={heroImage}
        roadmapCoursesAr={roadmapCoursesAr}
        roadmapCoursesEn={roadmapCoursesEn}
        totalStations={totalStations}
        totalJourneys={totalJourneys}
        totalTrainingHours={totalTrainingHours}
      />
    </main>
  );
}
