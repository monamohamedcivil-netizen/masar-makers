"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import {
  BookOpen,
  ClipboardCheck,
  Route,
} from "lucide-react";

import type {
  StudentDashboardData,
  StudentPathStationProgress,
  StudentSurvey,
} from "@/lib/queries/student-dashboard";

import SurveyCard from "../surveys/SurveyCard";

type Props = {
  data: StudentDashboardData;
};

type LocalStudentSurvey = StudentSurvey & {
  detailedSurveyCompleted?: boolean;
};

export default function SurveysPanel({
  data,
}: Props) {
  const searchParams = useSearchParams();
  const requestedCourseId =
    searchParams.get("courseId") ?? "";

  const [surveys, setSurveys] = useState<
    LocalStudentSurvey[]
  >(data.surveys ?? []);

  const [activePathId, setActivePathId] =
    useState("");

  const [activeCourseId, setActiveCourseId] =
    useState("");

  const paths = useMemo(
    () =>
      (data.careerPaths ?? [])
        .map((path) => ({
          ...path,
          stations: path.stations.filter(
            (station) =>
              station.isEnrolled &&
              station.status !== "pending" &&
              Boolean(station.courseId),
          ),
        }))
        .filter(
          (path) => path.stations.length > 0,
        ),
    [data.careerPaths],
  );

  useEffect(() => {
    setSurveys(data.surveys ?? []);
  }, [data.surveys]);

  useEffect(() => {
    if (paths.length === 0) {
      setActivePathId("");
      setActiveCourseId("");
      return;
    }

    if (requestedCourseId) {
      const requestedPath = paths.find(
        (path) =>
          path.stations.some(
            (station) =>
              station.courseId ===
              requestedCourseId,
          ),
      );

      if (requestedPath) {
        setActivePathId(
          requestedPath.pathId,
        );
        setActiveCourseId(
          requestedCourseId,
        );
        return;
      }
    }

    setActivePathId((currentPathId) => {
      const currentPathStillExists =
        paths.some(
          (path) =>
            path.pathId === currentPathId,
        );

      if (currentPathStillExists) {
        return currentPathId;
      }

      return paths[0]?.pathId ?? "";
    });
  }, [paths, requestedCourseId]);

  const activePath = useMemo(
    () =>
      paths.find(
        (path) =>
          path.pathId === activePathId,
      ) ?? paths[0],
    [paths, activePathId],
  );

  useEffect(() => {
    if (!activePath) {
      setActiveCourseId("");
      return;
    }

    const activeCourseStillExists =
      activePath.stations.some(
        (station) =>
          station.courseId ===
          activeCourseId,
      );

    if (!activeCourseStillExists) {
      setActiveCourseId(
        activePath.stations[0]?.courseId ??
          "",
      );
    }
  }, [activePath, activeCourseId]);

  const activeCourse = useMemo(
    () =>
      activePath?.stations.find(
        (station) =>
          station.courseId ===
          activeCourseId,
      ) ?? activePath?.stations[0],
    [activePath, activeCourseId],
  );

  function getCourseSurvey(
    courseId: string,
  ) {
    return (
      surveys.find(
        (survey) =>
          survey.courseId === courseId,
      ) ?? null
    );
  }

  function getPathSurveyCount(
    stations: StudentPathStationProgress[],
  ) {
    const courseIds = new Set(
      stations.map(
        (station) => station.courseId,
      ),
    );

    return surveys.filter((survey) =>
      courseIds.has(survey.courseId),
    ).length;
  }

  function handlePathChange(pathId: string) {
    const selectedPath = paths.find(
      (path) => path.pathId === pathId,
    );

    setActivePathId(pathId);
    setActiveCourseId(
      selectedPath?.stations[0]?.courseId ??
        "",
    );
  }

  function markCourseAsSubmitted(
    courseId: string,
  ) {
    setSurveys((currentSurveys) => {
      const existingSurvey =
        currentSurveys.find(
          (survey) =>
            survey.courseId === courseId,
        );

      if (existingSurvey) {
        return currentSurveys.map(
          (survey) =>
            survey.courseId === courseId
              ? {
                  ...survey,
                  submittedAt:
                    survey.submittedAt ??
                    new Date().toISOString(),
                }
              : survey,
        );
      }

      return [
        ...currentSurveys,
        {
          id: `local:${courseId}`,
          userId: "",
          courseId,
          surveyTemplateId: null,
          rating: 0,
          comment: null,
          submittedAt:
            new Date().toISOString(),
          showOnHome: false,
          showOnCourse: false,
          surveyUrl: null,
          detailedSurveyCompleted: false,
        },
      ];
    });
  }

  return (
    <div
      className="space-y-6"
      dir="rtl"
    >
      {paths.length === 0 && (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
            <ClipboardCheck className="h-8 w-8 text-slate-400" />
          </div>

          <h3 className="mt-5 text-lg font-bold text-[#07152E]">
            لا توجد رحلات متاحة للتقييم
          </h3>

          <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-slate-500">
            ستظهر هنا الرحلات التعليمية التي تم
            تفعيل اشتراكك بها حتى تتمكني من
            تقييمها وإكمال الاستبيان التفصيلي.
          </p>
        </div>
      )}

      {paths.length > 0 && (
        <>
          <section className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex flex-wrap gap-2">
              {paths.map((path) => {
                const isActive =
                  path.pathId ===
                  activePath?.pathId;

                const submittedCount =
                  getPathSurveyCount(
                    path.stations,
                  );

                return (
                  <button
                    key={path.pathId}
                    type="button"
                    onClick={() =>
                      handlePathChange(
                        path.pathId,
                      )
                    }
                    className={`flex min-h-12 items-center gap-3 rounded-2xl px-5 py-3 text-right transition ${
                      isActive
                        ? "bg-[#07152E] text-white shadow-md"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-[#07152E]"
                    }`}
                  >
                    <Route
                      className={`h-5 w-5 shrink-0 ${
                        isActive
                          ? "text-[#F7B548]"
                          : "text-slate-400"
                      }`}
                    />

                    <span>
                      <span className="block text-sm font-bold">
                        {path.title}
                      </span>

                      <span
                        className={`mt-0.5 block text-xs ${
                          isActive
                            ? "text-slate-300"
                            : "text-slate-400"
                        }`}
                      >
                        {path.stations.length}{" "}
                        رحلات
                        {" • "}
                        {submittedCount} تم تقييمها
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {activePath && (
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-[#F7B548]" />

                <h3 className="font-bold text-[#07152E]">
                  رحلات المسار
                </h3>
              </div>

              <div className="flex gap-3 overflow-x-auto pb-2">
                {activePath.stations.map(
                  (station) => {
                    const isActive =
                      station.courseId ===
                      activeCourse?.courseId;

                    const survey =
                      getCourseSurvey(
                        station.courseId,
                      );

                    const completed =
                      Boolean(
                        survey?.submittedAt,
                      ) &&
                      Boolean(
                        survey?.detailedSurveyCompleted,
                      );

                    return (
                      <button
                        key={station.stationId}
                        type="button"
                        onClick={() =>
                          setActiveCourseId(
                            station.courseId,
                          )
                        }
                        className={`flex min-h-[112px] min-w-[210px] flex-col items-center justify-center rounded-2xl border px-4 py-4 text-center transition ${
                          isActive
                            ? "border-[#F7B548] bg-amber-50 shadow-sm"
                            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <p
                          className={`line-clamp-2 text-sm font-bold ${
                            isActive
                              ? "text-[#07152E]"
                              : "text-slate-700"
                          }`}
                        >
                          {station.shortTitle ||
                            station.title}
                        </p>

                        <span
                          className={`mt-3 rounded-full px-3 py-1 text-xs font-semibold ${
                            completed
                              ? "bg-green-100 text-green-700"
                              : survey?.submittedAt
                                ? "bg-blue-100 text-blue-700"
                                : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {completed
                            ? "اكتملت رحلة التقييم"
                            : survey?.submittedAt
                              ? "التقييم محفوظ"
                              : "بانتظار التقييم"}
                        </span>
                      </button>
                    );
                  },
                )}
              </div>
            </section>
          )}

          {activeCourse &&
            (() => {
              const survey =
                getCourseSurvey(
                  activeCourse.courseId,
                );

              return (
                <SurveyCard
                  key={activeCourse.courseId}
                  courseId={
                    activeCourse.courseId
                  }
                  courseTitle={
                    activeCourse.shortTitle ||
                    activeCourse.title
                  }
                  submitted={Boolean(
                    survey?.submittedAt,
                  )}
                  rating={
                    survey?.rating ?? 0
                  }
                  comment={
                    survey?.comment ?? ""
                  }
                  surveyUrl={
                    survey?.surveyUrl ?? null
                  }
                  detailedSurveyCompleted={Boolean(
                    survey?.detailedSurveyCompleted,
                  )}
                  onSaved={() =>
                    markCourseAsSubmitted(
                      activeCourse.courseId,
                    )
                  }
                />
              );
            })()}
        </>
      )}
    </div>
  );
}