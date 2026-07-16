"use client";

import { motion } from "framer-motion";

type Course = {
  title: string;
};

type Props = {
  courses: Course[];
  current: number;
  onSelect: (index: number) => void;
};

export default function CourseTimeline({
  courses,
  current,
  onSelect,
}: Props) {
  return (
    <div className="relative mt-12 pb-8">

      {/* Road */}

      <div className="absolute left-8 right-8 top-5 h-2 rounded-full bg-slate-200">

        <motion.div
          className="h-full rounded-full bg-[#F7B548]"
          animate={{
            width: `${(current / (courses.length - 1)) * 100}%`,
          }}
          transition={{
            duration: 0.6,
          }}
        />

      </div>

      {/* Moving Car */}

      <motion.div
        className="absolute top-0 z-20"
        animate={{
          left: `calc(${(current / (courses.length - 1)) * 100}% - 8px)`,
        }}
        transition={{
          duration: 0.6,
        }}
      >
        🚗
      </motion.div>

      {/* Stations */}

      <div className="relative flex justify-between">

        {courses.map((course, index) => (
          <button
            key={course.title}
            onClick={() => onSelect(index)}
            className="flex flex-col items-center"
          >

            <motion.div
              animate={{
                scale: current === index ? 1.25 : 1,
              }}
              transition={{
                duration: 0.3,
              }}
              className={`z-10 flex h-8 w-8 items-center justify-center rounded-full border-4 ${
                current >= index
                  ? "border-[#F7B548] bg-[#F7B548]"
                  : "border-slate-300 bg-white"
              }`}
            >
              {current === index && (
                <div className="h-3 w-3 rounded-full bg-white" />
              )}
            </motion.div>

            <span
              className={`mt-4 w-24 text-center text-xs font-semibold ${
                current === index
                  ? "text-[#07152E]"
                  : "text-slate-500"
              }`}
            >
              {course.title}
            </span>

          </button>
        ))}

      </div>

    </div>
  );
}