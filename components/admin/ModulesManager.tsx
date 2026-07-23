"use client";

import { Button } from "@/components/button";
import { Plus } from "lucide-react";

const JOURNEY_TYPES = [
  {
    key: "fundamental",
    title: "رحلة الأساسيات",
    description: "تحتوي جميع محاضرات مرحلة الأساسيات.",
    color: "bg-blue-50 border-blue-200",
  },
  {
    key: "advanced",
    title: "الرحلة المتقدمة",
    description: "تحتوي جميع محاضرات المرحلة المتقدمة.",
    color: "bg-indigo-50 border-indigo-200",
  },
  {
    key: "integrated",
    title: "الرحلة المتكاملة",
    description:
      "رحلة اشتراك فقط، ولا تحتوي محاضرات مستقلة.",
    color: "bg-amber-50 border-amber-200",
  },
  {
    key: "workshop",
    title: "رحلات اليوم الواحد",
    description:
      "كل رحلة تحتوي محاضرة واحدة فقط.",
    color: "bg-emerald-50 border-emerald-200",
  },
  {
    key: "free",
    title: "الرحلات المجانية",
    description:
      "كل رحلة تحتوي محاضرة مجانية واحدة.",
    color: "bg-slate-50 border-slate-200",
  },
];

export default function ModulesManager() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black">
            إدارة الرحلات
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            اختر نوع الرحلة أو أضف رحلة جديدة.
          </p>
        </div>

        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          إضافة رحلة
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {JOURNEY_TYPES.map((journey) => (
          <div
            key={journey.key}
            className={`rounded-2xl border p-6 transition hover:shadow-md ${journey.color}`}
          >
            <h3 className="text-lg font-bold">
              {journey.title}
            </h3>

            <p className="mt-2 text-sm text-slate-600">
              {journey.description}
            </p>

            <div className="mt-6 flex justify-end">
              <Button variant="outline">
                إدارة الرحلات
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}