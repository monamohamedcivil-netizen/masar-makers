"use client";
import RoadJourney from "@/components/RoadJourney";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Clock,
  Map,
  Award,
  Route,
  TrafficCone,
} from "lucide-react";
import AuthLink from "@/components/AuthLink";

const paths = [
  {
    title: "مسار تصميم الطرق",
    description:
      "رحلة متكاملة لتعلم أحدث الأدوات والتقنيات في تصميم الطرق من الأساس إلى الاحتراف.",
    journeys: "5 رحلات",
    hours: "80+ ساعة تدريبية",
    projects: "12 مشروع",
    heroImage: "/images/paths/road-design.jpg",
    iconType: "road",
    link: "/career-path/road",
    coursesList: [
      {
        title: "Civil 3D",
        icon: "/images/courses/icons/civil3d.png",
      },
      {
        title: "CSD",
        icon: "/images/courses/icons/csd.png",
      },
      {
        title: "Smart Project\nDeliverables",
        icon: "/images/courses/icons/spd.png",
      },
      {
        title: "Vehicle Tracking",
        icon: "/images/courses/icons/vt.png",
      },
      {
        title: "BIM for Roads",
        icon: "/images/courses/icons/bim.png",
      },
    ],
  },
  {
    title: "مسار هندسة المرور",
    description:
      "رحلة متكاملة لإتقان تحليل وتصميم أنظمة المرور باستخدام أحدث البرامج .",
    journeys: "5 رحلات",
    hours: "80+ ساعة تدريبية",
    projects: "8 مشاريع",
    heroImage: "/images/paths/traffic-engineering.jpg",
    iconType: "traffic",
    link: "/career-path/traffic",
    coursesList: [
      { title: "SIDRA", image: "/images/courses/course-sidra.jpg", icon: "/images/courses/icons/sidra.png" }, 
      { title: "Synchro", image: "/images/courses/course-synchro.jpg", icon: "/images/courses/icons/synchro.png" }, 
      { title: "VISSIM", image: "/images/courses/course-vissim.jpg", icon: "/images/courses/icons/vissim.png" }, 
      { title: "VISUM", image: "/images/courses/course-visum.jpg", icon: "/images/courses/icons/visum.png" }, 
      { title: "CUBE", image: "/images/courses/course-cube.jpg", icon: "/images/courses/icons/cube.png" },
    ],
  },
];

export default function CareerPaths() {
  const [activeCourse, setActiveCourse] = useState([0, 0]);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveCourse((prev) =>
        prev.map((item, index) => (item + 1) % paths[index].coursesList.length)
      );
    }, 2600);

    return () => clearInterval(timer);
  }, []);

  return (
    <section id="paths" className="w-full bg-[#F7F8FA] py-4">
      <div className="mx-auto max-w-[1720px] px-15">
        <div className="grid gap-5 lg:grid-cols-2">
          {paths.map((path, pathIndex) => {
            const current = activeCourse[pathIndex];
            const progress = (current / (path.coursesList.length - 1)) * 100;
            const MainIcon = path.iconType === "traffic" ? TrafficCone : Route;

            return (
              <div
                key={path.title}
                className="group relative h-[320px] overflow-hidden rounded-[28px] bg-[#07152E] text-white shadow-[0_28px_70px_rgba(7,21,46,0.24)] ring-1 ring-[#07152E]/10 transition duration-500 hover:-translate-y-1"
              >
                {/* Top Background Image Only */}
<div className="absolute left-0 right-0 top-0 h-[250px] overflow-hidden">
  <Image
    src={path.heroImage}
    alt={path.title}
    fill
    className="object-cover object-left opacity-100 transition duration-700 group-hover:scale-105"
  />

 {/* Smooth Gradient Overlay */}
<div className="absolute inset-0 bg-gradient-to-l from-[#07152E]/100 via-[#07152E]/100 via-[0%] to-transparent" />

  {/* Smooth fade from text area to image */}
  <div className="absolute inset-y-0 left-[100%] right-[100%] bg-gradient-to-l from-[#07152E]/92 via-[#07152E]/55 to-transparent" />

  {/* Bottom Fade */}
<div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#07152E] via-[#07152E]/65 to-transparent" />
</div>

{/* Dark body under the image */}
<div className="absolute inset-x-0 bottom-0 top-[220px] bg-[#07152E]" />

{/* Golden glow */}
<div className="absolute -bottom-28 left-16 h-80 w-65 rounded-full bg-[#F7B548]/18 blur-3xl" />

                <div className="relative z-10 flex h-full flex-col justify-between p-5">
                  <div className="flex h-[205px] items-start justify-end text-right">
  <div className="mr-0 ml-auto w-[58%] text-right">
    <div className="flex flex items-center gap-3">
      

      <div>
        

        <h3 className="text-[28px] font-black leading-tight">
          {path.title}
        </h3>
      </div>
    </div>

    <div className="mt-2 mr-0 h-[2px] w-40 rounded-full bg-[#F7B548]" />

    <p className="mt-3 w-[calc(100vw-140px)] max-w-[760px] overflow-hidden text-ellipsis whitespace-nowrap text-right text-[16px] font-semibold text-slate-100">
      {path.description}
    </p>

    <div className="mt-4 flex w-[calc(100vw-140px)] max-w-[760px] overflow-hidden  text-ellipsis whitespace-nowrap  items-center justify-START gap-3 text-right text-[15px] font-bold text-[#F7B548]">
      <span className="flex items-center gap-1.5 rounded-full bg-[#07152E]/55 px-3 py-1.5 backdrop-blur-sm">
        <Map size={20} />
        {path.journeys}
      </span>

      <span className="flex items-center gap-1.5 rounded-full bg-[#07152E]/55 px-3 py-1.5 backdrop-blur-sm">
        <Clock size={20} />
        {path.hours}
      </span>

      <span className="flex items-center gap-1.5 rounded-full bg-[#07152E]/55 px-3 py-1.5 backdrop-blur-sm">
        <Award size={20} />
        {path.projects}
      </span>
    </div>
  </div>
<AuthLink
  href={path.link}
  className="absolute left-5 top-5 flex items-center gap-3 rounded-2xl bg-[#F7B548] px-4 py-2.5 text-[14px] font-black text-[#07152E] shadow-[0_10px_25px_rgba(247,181,72,0.22)] transition hover:scale-105"
>
  استكشف المسار
  <ArrowLeft size={15} />
</AuthLink>
</div>
                  <div className="rounded-[24px] border border-white/15 bg-[#06142B]/90 px-4 pb-4 pt-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl">
  <RoadJourney
    items={path.coursesList}
    activeIndex={current}
    onChange={(index) =>
      setActiveCourse((prev) => {
        const updated = [...prev];
        updated[pathIndex] = index;
        return updated;
      })
    }
  />
</div>
                </div>
              </div>
            );
          })}
        </div>

        

          
        </div>
     
    </section>
  );
}