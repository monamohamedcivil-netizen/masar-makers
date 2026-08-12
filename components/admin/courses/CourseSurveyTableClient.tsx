"use client";

import { useMemo, useState } from "react";
import {
  ClipboardCheck,
  Download,
  Search,
  Star,
  Users,
} from "lucide-react";

import SurveyVisibilityToggle from "@/components/admin/courses/SurveyVisibilityToggle";
import type { AdminCourseSurvey } from "@/lib/queries/admin/course-surveys";

interface CourseSurveyTableClientProps {
  surveys: AdminCourseSurvey[];
}

type FilterValue =
  | "all"
  | "five"
  | "fourPlus"
  | "detailed"
  | "home"
  | "course";

export default function CourseSurveyTableClient({
  surveys,
}: CourseSurveyTableClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] =
    useState<FilterValue>("all");

  const average =
    surveys.length === 0
      ? 0
      : surveys.reduce(
          (sum, survey) => sum + survey.rating,
          0,
        ) / surveys.length;

  const completedDetailed = surveys.filter(
    (survey) => survey.detailedSurveyCompleted,
  ).length;

  const filteredSurveys = useMemo(() => {
    const normalizedSearch = searchTerm
      .trim()
      .toLowerCase();

    return surveys.filter((survey) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        survey.studentName
          .toLowerCase()
          .includes(normalizedSearch) ||
        survey.studentEmail
          .toLowerCase()
          .includes(normalizedSearch) ||
        survey.comment
          ?.toLowerCase()
          .includes(normalizedSearch);

      if (!matchesSearch) {
        return false;
      }

      if (filter === "five") {
        return survey.rating === 5;
      }

      if (filter === "fourPlus") {
        return survey.rating >= 4;
      }

      if (filter === "detailed") {
        return survey.detailedSurveyCompleted;
      }

      if (filter === "home") {
        return survey.showOnHome;
      }

      if (filter === "course") {
        return survey.showOnCourse;
      }

      return true;
    });
  }, [filter, searchTerm, surveys]);

  function exportToExcel() {
    const headers = [
      "اسم الطالب",
      "البريد الإلكتروني",
      "التقييم",
      "التعليق",
      "تاريخ التقييم",
      "Google Form",
      "الصفحة الرئيسية",
      "صفحة الكورس",
    ];

    const rows = filteredSurveys.map((survey) => [
      survey.studentName,
      survey.studentEmail,
      String(survey.rating),
      survey.comment ?? "",
      formatDate(survey.submittedAt),
      survey.detailedSurveyCompleted
        ? "مكتمل"
        : "لم يكتمل",
      survey.showOnHome ? "نعم" : "لا",
      survey.showOnCourse ? "نعم" : "لا",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row
          .map(
            (value) =>
              `"${String(value).replace(/"/g, '""')}"`,
          )
          .join(","),
      )
      .join("\n");

    const blob = new Blob(
      [`\uFEFF${csvContent}`],
      {
        type: "text/csv;charset=utf-8;",
      },
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `course-surveys-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  return (
    <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-6 py-5">
        <h2 className="text-xl font-black text-[#07152E]">
          تقييمات الطلاب
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          تقييمات وآراء المشتركين في هذا الكورس.
        </p>
      </div>

      <div className="space-y-6 p-6">
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            icon={Star}
            title="متوسط التقييم"
            value={average.toFixed(1)}
          />

          <StatCard
            icon={Users}
            title="عدد التقييمات"
            value={String(surveys.length)}
          />

          <StatCard
            icon={ClipboardCheck}
            title="أكملوا Google Form"
            value={String(completedDetailed)}
          />
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="search"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
              placeholder="البحث باسم الطالب أو البريد أو التعليق..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pr-11 pl-4 text-sm outline-none transition focus:border-[#F7B548] focus:ring-2 focus:ring-[#F7B548]/20"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              value={filter}
              onChange={(event) =>
                setFilter(
                  event.target.value as FilterValue,
                )
              }
              className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-[#07152E] outline-none focus:border-[#F7B548]"
            >
              <option value="all">كل التقييمات</option>
              <option value="five">5 نجوم</option>
              <option value="fourPlus">4 نجوم فأكثر</option>
              <option value="detailed">
                أكملوا Google Form
              </option>
              <option value="home">
                منشور في الرئيسية
              </option>
              <option value="course">
                منشور في صفحة الكورس
              </option>
            </select>

            <button
              type="button"
              onClick={exportToExcel}
              disabled={filteredSurveys.length === 0}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#07152E] px-5 text-sm font-black text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Download className="h-4 w-4" />
              تصدير Excel
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="min-w-[1100px] w-full">
            <thead className="bg-slate-50">
              <tr className="text-sm text-[#07152E]">
                <th className="p-4 text-right">
                  الطالب
                </th>

                <th className="p-4 text-center">
                  التقييم
                </th>

                <th className="p-4 text-right">
                  التعليق
                </th>

                <th className="p-4 text-center">
                  التاريخ
                </th>

                <th className="p-4 text-center">
                  Google Form
                </th>

                <th className="p-4 text-center">
                  الرئيسية
                </th>

                <th className="p-4 text-center">
                  صفحة الكورس
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredSurveys.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="p-12 text-center text-sm text-slate-500"
                  >
                    لا توجد نتائج مطابقة.
                  </td>
                </tr>
              ) : (
                filteredSurveys.map((survey) => (
                  <tr
                    key={survey.id}
                    className="border-t border-slate-200 transition hover:bg-slate-50/60"
                  >
                    <td className="p-4">
                      <div className="font-black text-[#07152E]">
                        {survey.studentName}
                      </div>

                      <div
                        dir="ltr"
                        className="mt-1 text-right text-xs text-slate-500"
                      >
                        {survey.studentEmail}
                      </div>
                    </td>

                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div
                          className="flex gap-0.5"
                          aria-label={`${survey.rating} من 5`}
                        >
                          {Array.from({
                            length: 5,
                          }).map((_, index) => (
                            <Star
                              key={index}
                              className={`h-4 w-4 ${
                                index < survey.rating
                                  ? "fill-[#F7B548] text-[#F7B548]"
                                  : "fill-slate-200 text-slate-200"
                              }`}
                            />
                          ))}
                        </div>

                        <span className="whitespace-nowrap text-sm font-black text-[#07152E]">
                          ({survey.rating.toFixed(1)})
                        </span>
                      </div>
                    </td>

                    <td className="max-w-xs px-4 py-4">
                      <p
                        title={
                          survey.comment ??
                          "لا يوجد تعليق"
                        }
                        className="line-clamp-2 text-sm leading-6 text-slate-700"
                      >
                        {survey.comment ||
                          "لا يوجد تعليق"}
                      </p>
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 text-center text-sm text-slate-500">
                      {formatDate(
                        survey.submittedAt,
                      )}
                    </td>

                    <td className="px-4 py-4 text-center">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${
                          survey.detailedSurveyCompleted
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {survey.detailedSurveyCompleted
                          ? "مكتمل"
                          : "لم يكتمل"}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-center">
                      <div className="flex justify-center">
                        <SurveyVisibilityToggle
                          surveyId={survey.id}
                          initialShowOnHome={
                            survey.showOnHome
                          }
                          initialShowOnCourse={
                            survey.showOnCourse
                          }
                          type="home"
                        />
                      </div>
                    </td>

                    <td className="px-4 py-4 text-center">
                      <div className="flex justify-center">
                        <SurveyVisibilityToggle
                          surveyId={survey.id}
                          initialShowOnHome={
                            survey.showOnHome
                          }
                          initialShowOnCourse={
                            survey.showOnCourse
                          }
                          type="course"
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <p className="text-xs font-bold text-slate-500">
          عرض {filteredSurveys.length} من أصل{" "}
          {surveys.length} تقييم.
        </p>
      </div>
    </section>
  );
}

function StatCard({
  icon: Icon,
  title,
  value,
}: {
  icon: typeof Star;
  title: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F7B548]/15 text-[#F7B548]">
        <Icon className="h-5 w-5" />
      </div>

      <div>
        <p className="text-sm font-bold text-slate-500">
          {title}
        </p>

        <p className="mt-1 text-2xl font-black text-[#07152E]">
          {value}
        </p>
      </div>
    </div>
  );
}

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("ar-EG", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}