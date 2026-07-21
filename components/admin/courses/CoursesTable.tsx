"use client";

import { useMemo, useState } from "react";
import { BookOpen, Search } from "lucide-react";

import CourseActions from "./CourseActions";
import CourseStatusBadge from "./CourseStatusBadge";

export interface AdminCourseRow {
  id: string;
  title: string;
  slug: string;
  description: string;
  imageUrl: string;
  journeyType: string;
  price: number;
  durationHours: number;
  status: string;
  createdAt: string;
}

interface CoursesTableProps {
  courses: AdminCourseRow[];
}

const journeyLabels: Record<string, string> = {
  career_path: "رحلة احتراف متكاملة",
  workshop: "رحلة اليوم الواحد",
  one_day: "رحلة اليوم الواحد",
  free: "رحلة مجانية",
  free_session: "رحلة مجانية",
};

function formatDate(value: string) {
  const date = new Date(value);

  if (!value || Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("ar-SA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export default function CoursesTable({
  courses,
}: CoursesTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredCourses = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return courses.filter((course) => {
      const matchesSearch =
        !search ||
        [course.title, course.slug, course.description]
          .join(" ")
          .toLowerCase()
          .includes(search);

      const matchesStatus =
        statusFilter === "all" ||
        course.status.toLowerCase() === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [courses, searchTerm, statusFilter]);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

          <input
            type="search"
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(event.target.value)
            }
            placeholder="ابحث باسم الكورس..."
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pr-10 pl-4 text-sm outline-none focus:border-[#F7B548] focus:bg-white"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value)
          }
          className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:border-[#F7B548]"
        >
          <option value="all">جميع الحالات</option>
          <option value="draft">مسودة</option>
          <option value="published">منشور</option>
          <option value="archived">مؤرشف</option>
        </select>
      </div>

      {filteredCourses.length === 0 ? (
        <div className="flex min-h-80 flex-col items-center justify-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
            <BookOpen className="h-7 w-7 text-slate-400" />
          </div>

          <h2 className="text-lg font-black text-[#07152E]">
            لا توجد كورسات
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            لم يتم العثور على كورسات مطابقة.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-right">
            <thead className="bg-slate-50">
              <tr className="border-b border-slate-200">
                <th className="px-5 py-4 text-xs font-black text-slate-500">
                  الكورس
                </th>

                <th className="px-5 py-4 text-xs font-black text-slate-500">
                  نوع الرحلة
                </th>

                <th className="px-5 py-4 text-xs font-black text-slate-500">
                  المدة
                </th>

                <th className="px-5 py-4 text-xs font-black text-slate-500">
                  السعر
                </th>

                <th className="px-5 py-4 text-xs font-black text-slate-500">
                  الحالة
                </th>

                <th className="px-5 py-4 text-xs font-black text-slate-500">
                  تاريخ الإنشاء
                </th>

                <th className="px-5 py-4 text-xs font-black text-slate-500">
                  الإجراءات
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredCourses.map((course) => (
                <tr
                  key={course.id}
                  className="border-b border-slate-100 transition last:border-0 hover:bg-slate-50/70"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-16 overflow-hidden rounded-lg bg-slate-100">
                        {course.imageUrl ? (
                          <img
                            src={course.imageUrl}
                            alt={course.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <BookOpen className="h-5 w-5 text-slate-400" />
                          </div>
                        )}
                      </div>

                      <div>
                        <p className="font-bold text-[#07152E]">
                          {course.title}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          /{course.slug}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4 text-sm text-slate-600">
                    {journeyLabels[course.journeyType] ??
                      course.journeyType}
                  </td>

                  <td className="px-5 py-4 text-sm text-slate-600">
                    {course.durationHours
                      ? `${course.durationHours} ساعة`
                      : "—"}
                  </td>

                  <td className="px-5 py-4 text-sm font-bold text-[#07152E]">
                    {course.price > 0
                      ? `${course.price} ر.س`
                      : "مجاني"}
                  </td>

                  <td className="px-5 py-4">
                    <CourseStatusBadge status={course.status} />
                  </td>

                  <td className="px-5 py-4 text-sm text-slate-600">
                    {formatDate(course.createdAt)}
                  </td>

                  <td className="px-5 py-4">
                    <CourseActions
                      courseId={course.id}
                      slug={course.slug}
                      status={course.status}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="border-t border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold text-slate-500">
        عدد الكورسات: {filteredCourses.length}
      </div>
    </section>
  );
}