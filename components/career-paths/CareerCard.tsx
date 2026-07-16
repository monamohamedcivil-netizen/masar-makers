"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import CourseTimeline from "./CourseTimeline";
import { motion, AnimatePresence } from "framer-motion";

type Course = {
  title: string;
  image: string;
};

type Props = {
  title: string;
  description: string;
  image: string;
  courses: Course[];
};

export default function CareerCard({
  title,
  description,
  image,
  courses,
}: Props) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % courses.length);
    }, 3500);

    return () => clearInterval(timer);
  }, [courses.length]);

  const next = () => {
    setCurrent((prev) => (prev + 1) % courses.length);
  };

  const prev = () => {
    setCurrent((prev) => (prev - 1 + courses.length) % courses.length);
  };

  return (
    <div className="group overflow-hidden rounded-[34px] bg-[#07152E] shadow-2xl">

  {/* Hero */}

  <div className="relative h-[340px] overflow-hidden">

    <Image
      src={image}
      alt={title}
      fill
      className="object-cover transition duration-700 group-hover:scale-110"
    />

    <div className="absolute inset-0 bg-gradient-to-t from-[#07152E] via-[#07152E]/45 to-transparent" />

    {/* Badge */}

    <div className="absolute right-8 top-8">

      <span className="rounded-full bg-[#F7B548] px-5 py-2 text-xs font-bold tracking-wide text-[#07152E] shadow-lg">
        PROFESSIONAL TRACK
      </span>

    </div>

    {/* Text */}

    <div className="absolute bottom-10 right-10 left-10">

      <h3 className="text-4xl font-black text-white">

        {title}

      </h3>

      <p className="mt-5 max-w-xl leading-8 text-slate-200">

        {description}

      </p>

    </div>

  </div>
      {/* Course */}

      <div className="p-7">

        <div className="mt-6 rounded-3xl bg-[#0C1F40] p-6">

  <AnimatePresence mode="wait">

    <motion.div
      key={current}
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -25 }}
      transition={{ duration: 0.35 }}
      className="flex items-center gap-5"
    >

      {/* Course Image */}

      <div className="relative h-28 w-28 overflow-hidden rounded-2xl">

        <Image
          src={courses[current].image}
          alt={courses[current].title}
          fill
          className="object-cover transition duration-500 hover:scale-110"
        />

      </div>

      {/* Course Info */}

      <div className="flex-1">

        <span className="rounded-full bg-[#F7B548]/20 px-3 py-1 text-xs font-bold text-[#F7B548]">
          CURRENT COURSE
        </span>

        <h4 className="mt-4 text-2xl font-bold text-white">

          {courses[current].title}

        </h4>

        <p className="mt-3 leading-7 text-slate-300">

          ابدأ رحلتك خطوة بخطوة حتى تصل إلى الاحتراف الكامل داخل هذا المسار.

        </p>

      </div>

      {/* Button */}

      <button className="rounded-2xl bg-[#F7B548] px-7 py-4 font-bold text-[#07152E] transition hover:scale-105">

        ابدأ الكورس

      </button>

    </motion.div>

  </AnimatePresence>

</div>
       <div className="mt-8">

  <CourseTimeline
  courses={courses}
  current={current}
  onSelect={setCurrent}
/>

<div className="mt-8 flex items-center justify-between">

  ...

</div>

</div>

</div>

</div>

);
}