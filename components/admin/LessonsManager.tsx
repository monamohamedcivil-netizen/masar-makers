"use client";

import { useState } from "react";
import { Plus, BookOpen } from "lucide-react";
import { Button } from "@/components/button";

const JOURNEY_TYPES = [
  {
    id: "fundamental",
    title: "رحلة الأساسيات",
    allowMultiple: true,
  },
  {
    id: "advanced",
    title: "الرحلة المتقدمة",
    allowMultiple: true,
  },
  {
    id: "integrated",
    title: "الرحلة المتكاملة",
    allowMultiple: false,
    disabled: true,
  },
  {
    id: "workshop",
    title: "رحلات اليوم الواحد",
    allowMultiple: false,
  },
  {
    id: "free",
    title: "الرحلات المجانية",
    allowMultiple: false,
  },
];

export default function LessonsManager() {
  const [selected, setSelected] = useState("fundamental");

  const current = JOURNEY_TYPES.find(
    (j) => j.id === selected,
  )!;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black">
            إدارة المحاضرات
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            اختر نوع الرحلة لإدارة محاضراتها.
          </p>
        </div>

        {!current.disabled && (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            إضافة محاضرة
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        {JOURNEY_TYPES.map((journey) => (
          <button
            key={journey.id}
            onClick={() => setSelected(journey.id)}
            className={`rounded-xl border px-5 py-3 font-bold transition ${
              selected === journey.id
                ? "border-[#07152E] bg-[#07152E] text-white"
                : "border-slate-300 bg-white hover:border-[#07152E]"
            }`}
          >
            {journey.title}
          </button>
        ))}
      </div>

      {current.disabled ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <BookOpen className="mx-auto mb-4 h-10 w-10 text-slate-400" />

          <h3 className="text-xl font-bold">
            لا توجد محاضرات لهذه الرحلة
          </h3>

          <p className="mt-2 text-slate-500">
            الرحلة المتكاملة تجمع بين الأساسيات
            والمتقدمة ولا تحتوي محاضرات مستقلة.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <BookOpen className="mx-auto mb-4 h-10 w-10 text-slate-400" />

          <h3 className="text-xl font-bold">
            لا توجد محاضرات بعد
          </h3>

          <p className="mt-2 text-slate-500">
            سيتم هنا عرض جدول المحاضرات وربطه
            بقاعدة البيانات.
          </p>
        </div>
      )}
    </div>
  );
}