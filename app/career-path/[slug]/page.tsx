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

import { getCareerPathBySlug } from "@/lib/queries/catalog/career-paths";

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

  /*
    كل محطة تظهر مرة واحدة فقط على الطريق،
    حتى لو كانت تحتوي على أكثر من كورس مثل:

    CSD:
    - Integrated
    - Fundamental
    - Advanced

    نختار الكورس الرئيسي داخل كل محطة فقط
    لاستخدامه كبيانات ممثلة للمحطة في PathRoadmap.
  */
  const roadmapCourses: Course[] =
    path.course_stations
      .filter((station) => station.is_active)
      .map((station, stationIndex) => {
        const activeCourses = station.courses
          .filter((course) => course.is_active)
          .sort(
            (a, b) =>
              a.display_order - b.display_order
          );

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
            representativeJourney?.duration_hours
              ? `${representativeJourney.duration_hours} ساعة`
              : representativeCourse?.duration_hours
                ? `${representativeCourse.duration_hours} ساعة`
                : "سيتم تحديدها",

          projects:
            representativeCourse?.projects_count
              ? `${representativeCourse.projects_count} مشاريع`
              : "مشاريع تطبيقية",

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
    حساب الإحصائيات باستخدام كورس رئيسي واحد
    لكل محطة؛ حتى لا نحسب CSD Integrated
    وFundamental وAdvanced ثلاث مرات.
  */
  const representativeCourses =
    path.course_stations
      .filter((station) => station.is_active)
      .map((station) => {
        const activeCourses = station.courses
          .filter((course) => course.is_active)
          .sort(
            (a, b) =>
              a.display_order - b.display_order
          );

        return (
          activeCourses.find(
            (course) => course.is_featured
          ) ??
          activeCourses.find((course) =>
            course.slug.includes("integrated")
          ) ??
          activeCourses[0]
        );
      })
      .filter(
        (
          course
        ): course is NonNullable<
          (typeof path.course_stations)[number]["courses"][number]
        > => Boolean(course)
      );

  const totalHours = representativeCourses.reduce(
    (total, course) =>
      total + Number(course.duration_hours ?? 0),
    0
  );

  const totalProjects =
    representativeCourses.reduce(
      (total, course) =>
        total + Number(course.projects_count ?? 0),
      0
    );

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
      <section className="relative h-[165px] overflow-hidden bg-[#07152E]">
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
            relative z-10 mx-auto grid h-full
            max-w-[1480px] items-center gap-8
            px-6
            lg:grid-cols-[1.18fr_0.82fr]
            lg:px-10
          "
        >
          {/* Right: path information */}
          <div className="text-right text-white">
            <h1 className="text-[30px] font-black leading-tight lg:text-[38px]">
              {path.title}
            </h1>

            <p className="mt-2 max-w-[700px] text-[13px] font-medium leading-6 text-slate-200">
              {path.description ??
                "رحلة تعليمية متكاملة تقودك إلى مستوى احترافي."}
            </p>
          </div>

          {/* Left: statistics */}
          <div
            className="
              grid grid-cols-2
              gap-x-10 gap-y-5
              border-r border-white/20 pr-8
              max-lg:border-r-0 max-lg:pr-0
            "
          >
            <div className="flex items-center gap-4">
              <BookOpen
                size={24}
                className="shrink-0 text-[#F7B548]"
              />

              <div>
                <p className="text-[20px] font-black leading-none text-white">
                  {roadmapCourses.length}
                </p>

                <p className="mt-1 text-[12px] font-bold text-slate-200">
                  محطات احترافية
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Clock3
                size={24}
                className="shrink-0 text-[#F7B548]"
              />

              <div>
                <p className="text-[17px] font-black leading-none text-white">
                  {totalHours > 0
                    ? `${totalHours}+ ساعة`
                    : "يُحدّث قريبًا"}
                </p>

                <p className="mt-1 text-[12px] font-bold text-slate-200">
                  محتوى تدريبي
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <FolderKanban
                size={24}
                className="shrink-0 text-[#F7B548]"
              />

              <div>
                <p className="text-[17px] font-black leading-none text-white">
                  {totalProjects > 0
                    ? `${totalProjects}+`
                    : "متعددة"}
                </p>

                <p className="mt-1 text-[12px] font-bold text-slate-200">
                  مشاريع وتطبيقات
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <GraduationCap
                size={24}
                className="shrink-0 text-[#F7B548]"
              />

              <div>
                <p className="text-[17px] font-black leading-none text-white">
                  احترافي
                </p>

                <p className="mt-1 text-[12px] font-bold text-slate-200">
                  المستوى النهائي
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