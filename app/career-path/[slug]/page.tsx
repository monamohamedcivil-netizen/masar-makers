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

type CareerPathPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

/*
  الصفحة تعتمد على جلسة المستخدم المسجل وبيانات Supabase،
  لذلك لا نقوم بتخزينها كصفحة Static.
*/
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
      title: "المسار غير موجود | Masar Makers",
    };
  }

  return {
    title: `${path.title} | Masar Makers`,
    description:
      path.description ??
      "استكشف رحلات الاحتراف في منصة صناع المسار.",
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

  /*
    نحسب إحصائيات كل محطة على حدة:
    - عدد الرحلات من level: single = 1 / split = 2
    - الساعات من مجموع duration_minutes للدروس المنشورة
      عبر نفس RPC العامة التي تعمل للطالب والأدمن.
  */
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
          ? Math.ceil(
              totalMinutes / 60 / 5
            ) * 5
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

  /*
    كل محطة تظهر مرة واحدة فقط على الطريق،
    حتى لو كانت تحتوي على أكثر من كورس.
  */
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


        /*
          الأولوية:
          1. الكورس المميز.
          2. الرحلة المتكاملة.
          3. أول كورس داخل المحطة.
        */
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
          /*
            PathRoadmap الحالي يعتمد على Course المحلي،
            لذلك نقوم بتحويل بيانات المحطة القادمة من
            Supabase إلى نفس الشكل مؤقتًا.
          */
          id: stationIndex + 1,

          /*
            نستخدم slug المحطة لأن صفحة المحطة الواحدة
            ستعرض الرحلة المتكاملة والأساسية والمتقدمة.
          */
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
              ? `${currentStationStats.roundedHours} ساعات تدريبية`
              : "0 ساعات تدريبية",

          projects:
            `${currentStationStats?.journeysCount ?? 0} ${
              (currentStationStats?.journeysCount ?? 0) === 1
                ? "رحلة"
                : "رحلات"
            }`,

          level:
            representativeCourse?.level ??
            "احترافي",

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
  /*
    إحصائيات المسار:
    - عدد المحطات = عدد المحطات التعليمية الفعالة.
    - عدد الرحلات = عدد الرحلات الفعالة داخل جميع كورسات المحطات.
    - الساعات التدريبية = مجموع مدد الدروس/الفيديوهات الفعلية داخل المسار.
    - المستوى = احترافي.
  */
  const totalStations = activeStations.length;

  /*
    عدد الرحلات يعتمد على تقسيم الكورس في لوحة التحكم:
    - single = رحلة واحدة
    - split  = رحلتان (Fundamentals + Advanced)

    أي كورس جديد سيُحسب تلقائيًا حسب قيمة level.
  */
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

  /*
    المحتوى التدريبي:
    نجمع duration_minutes لكل الدروس المنشورة التابعة
    للكورسات الفعالة داخل هذا المسار، ثم نحولها إلى ساعات.

    العرض يُقرب دائمًا إلى أقرب 5 ساعات للأعلى:
    31.2 ساعة -> 35 ساعة
    35 ساعة   -> 35 ساعة
    36 ساعة   -> 40 ساعة
  */
  const activeCourseIds = activeStations.flatMap(
    (station) =>
      station.courses
        .filter((course) => course.is_active)
        .map((course) => course.id)
  );

  const totalTrainingMinutes =
    await getCoursesTrainingMinutes(
      activeCourseIds
    );

  const exactTrainingHours =
    totalTrainingMinutes / 60;

  const totalTrainingHours =
    totalTrainingMinutes > 0
      ? Math.ceil(
          exactTrainingHours / 5
        ) * 5
      : 0;

  const heroImage =
    path.image_url ??
    (path.slug === "traffic"
      ? "/images/courses/traffic-track.jpg"
      : "/images/courses/road-track.jpg");

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#F7F8FA]"
    >
      <Navbar />

      {/* مساحة الـNavbar الثابت */}
      <div className="h-[55px]" />

      <AnnouncementBar />

      <PathSwitcher activeSlug={path.slug} />

      {/* Compact Hero */}
      <section className="relative min-h-[170px] overflow-hidden bg-[#07152E] lg:h-[140px] lg:min-h-0">
        <Image
          src={heroImage}
          alt={path.title}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />

        <div className="absolute inset-0 bg-gradient-to-l from-[#07152E]/92 via-[#07152E]/62 to-[#07152E]/15" />

        <div
          className="
            relative z-10 mx-auto grid min-h-[170px]
            max-w-[1480px] grid-cols-[1.08fr_0.92fr]
            items-center gap-3 px-4 py-4
            sm:gap-5 sm:px-6
            lg:h-full lg:min-h-0 lg:grid-cols-[1.18fr_0.82fr]
            lg:gap-8 lg:px-10 lg:py-0
          "
        >
          {/* Right: path information */}
          <div className="min-w-0 text-right text-white">
            <h1 className="text-[20px] font-black leading-tight sm:text-[24px] lg:text-[34px]">
              {path.title}
            </h1>

            <p className="mt-1 max-w-[700px] text-[9px] font-medium leading-4 text-slate-200 sm:text-[10px] lg:mt-1.5 lg:text-[12px] lg:leading-5">
              {path.description ??
                "رحلة تعليمية متكاملة تقودك إلى مستوى احترافي."}
            </p>
          </div>

          {/* Left: statistics */}
          <div
            className="
              grid grid-cols-2
              gap-x-3 gap-y-3
              border-r border-white/20 pr-4
              max-lg:border-r-0 max-lg:pr-0
              sm:gap-x-5 sm:gap-y-4
              lg:gap-x-8 lg:gap-y-3 lg:border-r lg:pr-6
            "
          >
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <BookOpen
                size={21}
                className="shrink-0 text-[#F7B548] max-sm:h-[17px] max-sm:w-[17px]"
              />

              <div>
                <p className="text-[14px] font-black leading-none text-white sm:text-[16px]">
                  {totalStations}
                </p>

                <p className="mt-1 text-[8px] font-bold leading-3 text-slate-200 sm:text-[10px] lg:text-[11px]">
                  محطات تعليمية
                </p>
              </div>
            </div>

            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <FolderKanban
                size={21}
                className="shrink-0 text-[#F7B548] max-sm:h-[17px] max-sm:w-[17px]"
              />

              <div>
                <p className="text-[14px] font-black leading-none text-white sm:text-[16px]">
                  {totalJourneys}
                </p>

                <p className="mt-1 text-[8px] font-bold leading-3 text-slate-200 sm:text-[10px] lg:text-[11px]">
                  رحلات تدريبية
                </p>
              </div>
            </div>

            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <Clock3
                size={21}
                className="shrink-0 text-[#F7B548] max-sm:h-[17px] max-sm:w-[17px]"
              />

              <div>
                <p className="text-[14px] font-black leading-none text-white sm:text-[16px]">
                  {totalTrainingHours > 0
                    ? `${totalTrainingHours} ساعة`
                    : "—"}
                </p>

                <p className="mt-1 text-[8px] font-bold leading-3 text-slate-200 sm:text-[10px] lg:text-[11px]">
                  محتوى تدريبي
                </p>
              </div>
            </div>

            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <GraduationCap
                size={21}
                className="shrink-0 text-[#F7B548] max-sm:h-[17px] max-sm:w-[17px]"
              />

              <div>
                <p className="text-[14px] font-black leading-none text-white sm:text-[16px]">
                  احترافي
                </p>

                <p className="mt-1 text-[8px] font-bold leading-3 text-slate-200 sm:text-[10px] lg:text-[11px]">
                  المستوى
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section className="mx-auto max-w-[1480px] px-6 py-4 lg:px-10">
        <PathRoadmap
          courses={roadmapCourses}
        />
      </section>
    </main>
  );
}