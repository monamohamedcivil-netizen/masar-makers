"use client";

import { useState } from "react";

interface CourseOption {
  id: string;
  title: string;
}

interface GrantRewardModalProps {
  open: boolean;
  studentName: string;
  courses: CourseOption[];
  onClose: () => void;
  onConfirm: (courseId: string) => void;
}

export default function GrantRewardModal({
  open,
  studentName,
  courses,
  onClose,
  onConfirm,
}: GrantRewardModalProps) {
  const [courseId, setCourseId] = useState("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/40 flex items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl">

        <div className="border-b px-6 py-5">
          <h2 className="text-xl font-black text-[#07152E]">
            منح رحلة مجانية
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {studentName}
          </p>
        </div>

        <div className="space-y-5 p-6">

          <select
            value={courseId}
            onChange={(e) =>
              setCourseId(e.target.value)
            }
            className="h-12 w-full rounded-xl border px-4"
          >
            <option value="">
              اختر رحلة اليوم الواحد
            </option>

            {courses.map((course) => (
              <option
                key={course.id}
                value={course.id}
              >
                {course.title}
              </option>
            ))}
          </select>

        </div>

        <div className="flex justify-end gap-3 border-t px-6 py-5">

          <button
            onClick={onClose}
            className="rounded-xl border px-5 py-2 font-black"
          >
            إلغاء
          </button>

          <button
            disabled={!courseId}
            onClick={() =>
              onConfirm(courseId)
            }
            className="rounded-xl bg-[#F7B548] px-5 py-2 font-black text-[#07152E] disabled:opacity-50"
          >
            منح الرحلة
          </button>

        </div>

      </div>
    </div>
  );
}