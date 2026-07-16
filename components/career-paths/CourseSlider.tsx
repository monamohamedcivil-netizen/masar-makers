"use client";

import Image from "next/image";
import { ArrowLeft } from "lucide-react";

type Course = {
  title: string;
  image: string;
};

type Props = {
  course: Course;
};

export default function CourseSlider({ course }: Props) {
  return (
    <div className="rounded-[28px] bg-white shadow-xl overflow-hidden">

      {/* Course Image */}

      <div className="relative h-72">

        <Image
          src={course.image}
          alt={course.title}
          fill
          className="object-cover transition duration-700 hover:scale-105"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        <div className="absolute bottom-6 right-6 text-white">

          <span className="rounded-full bg-[#F7B548] px-4 py-2 text-sm font-bold text-slate-900">
            داخل هذا المسار
          </span>

          <h3 className="mt-4 text-4xl font-black">
            {course.title}
          </h3>

        </div>

      </div>

      {/* Content */}

      <div className="p-8">

        <p className="leading-8 text-slate-600">
          ستتعلم هذا الكورس من خلال تطبيق عملي ومشروع حقيقي يساعدك
          على اكتساب المهارات المطلوبة لسوق العمل.
        </p>

        <div className="mt-8 flex gap-4">

          <button className="rounded-2xl bg-[#0F2B5B] px-8 py-4 font-bold text-white transition hover:scale-105">
            ابدأ الكورس
          </button>

          <button className="flex items-center gap-2 rounded-2xl border border-slate-300 px-8 py-4 font-bold transition hover:bg-slate-100">
            اعرف المزيد
            <ArrowLeft size={18} />
          </button>

        </div>

      </div>

    </div>
  );
}