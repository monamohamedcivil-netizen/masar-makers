"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import {
  ClipboardCheck,
  Loader2,
} from "lucide-react";

import type {
  StudentCareerPathProgress,
  StudentDashboardData,
  StudentPathStationProgress,
} from "@/lib/queries/student-dashboard";

import { getStudentSurveys } from "@/lib/surveys/get-student-surveys";
import JourneyTabs from "../components/JourneyTabs";
import SurveyCard from "../surveys/SurveyCard";

type Props = {
  data: StudentDashboardData;
};

type StudentSurveyRecord = {
  id: string;
  user_id: string;
  course_id: string;
  survey_template_id?: string | null;
  rating: number;
  comment?: string | null;
  submitted_at?: string | null;
  show_on_home?: boolean;
  show_on_course?: boolean;
  detailed_survey_completed?: boolean;
  detailed_survey_completed_at?: string | null;
  survey_templates?:
    | {
        id?: string;
        survey_url?: string | null;
      }
    | {
        id?: string;
        survey_url?: string | null;
      }[]
    | null;
    courses?:
  | {
      id?: string;
      title?: string | null;
      survey_url?: string | null;
      survey_enabled?: boolean | null;
    }
  | {
      id?: string;
      title?: string | null;
      survey_url?: string | null;
      survey_enabled?: boolean | null;
    }[]
  | null;
};

function getRelatedSurveyUrl(
  relation: StudentSurveyRecord["survey_templates"],
) {
  if (Array.isArray(relation)) {
    return relation[0]?.survey_url ?? null;
  }

  return relation?.survey_url ?? null;
}
function getCourseSurveyUrl(
  relation: StudentSurveyRecord["courses"],
) {
  if (Array.isArray(relation)) {
    return relation[0]?.survey_url ?? null;
  }

  return relation?.survey_url ?? null;
}
export default function SurveysPanel({
  data,
}: Props) {
  const searchParams = useSearchParams();
  const requestedCourseId =
    searchParams.get("courseId") ?? "";

  const [loading, setLoading] =
    useState(true);
  const [errorMessage, setErrorMessage] =
    useState("");
  const [surveys, setSurveys] = useState<
    StudentSurveyRecord[]
  >([]);

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

  const loadSurveys = useCallback(
    async () => {
      setLoading(true);
      setErrorMessage("");

      try {
        const studentSurveys =
          await getStudentSurveys();

        setSurveys(
          (studentSurveys ??
            []) as StudentSurveyRecord[],
        );
      } catch (error) {
        console.error(
          "Failed to load student surveys:",
          error,
        );

        setSurveys([]);
        setErrorMessage(
          "تعذر تحميل التقييمات حاليًا. يرجى المحاولة مرة أخرى.",
        );
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadSurveys();
  }, [loadSurveys]);

  function getCourseSurvey(
    courseId: string,
  ) {
    return (
      surveys.find(
        (survey) =>
          survey.course_id === courseId,
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
      courseIds.has(survey.course_id),
    ).length;
  }

  function getPathCompletedCount(
    stations: StudentPathStationProgress[],
  ) {
    const courseIds = new Set(
      stations.map(
        (station) => station.courseId,
      ),
    );

    return surveys.filter(
      (survey) =>
        courseIds.has(survey.course_id) &&
        Boolean(survey.submitted_at) &&
        Boolean(
          survey.detailed_survey_completed,
        ),
    ).length;
  }

  const requestedPathId = useMemo(() => {
    if (!requestedCourseId) {
      return undefined;
    }

    return paths.find((path) =>
      path.stations.some(
        (station) =>
          station.courseId ===
          requestedCourseId,
      ),
    )?.pathId;
  }, [paths, requestedCourseId]);

  if (loading) {
    return (
      <div
        className="flex min-h-[420px] items-center justify-center"
        dir="rtl"
      >
        <div className="text-center">
          <Loader2 className="mx-auto h-9 w-9 animate-spin text-[#F7B548]" />

          <p className="mt-4 text-sm font-medium text-slate-500">
            جاري تحميل التقييمات...
          </p>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div
        className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700"
        dir="rtl"
      >
        {errorMessage}
      </div>
    );
  }

  if (!paths.length) {
    return (
      <div
        className="flex min-h-[400px] flex-col items-center justify-center text-center"
        dir="rtl"
      >
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FFF4DF] text-[#C88712]">
          <ClipboardCheck size={30} />
        </span>

        <h3 className="mt-4 text-lg font-black text-[#07152E]">
          لا توجد رحلات متاحة للتقييم
        </h3>

        <p className="mt-2 max-w-md text-sm font-semibold leading-7 text-slate-500">
          ستظهر هنا الرحلات التعليمية التي تم
          تفعيل اشتراكك بها حتى تتمكني من
          تقييمها وإكمال الاستبيان التفصيلي.
        </p>
      </div>
    );
  }

  return (
    <div dir="rtl">
      <JourneyTabs
        ariaLabel="مسارات استبياناتي"
        defaultTabId={
          requestedPathId ??
          paths[0]?.pathId
        }
        tabs={paths.map((path) => {
          const submittedCount =
            getPathSurveyCount(
              path.stations,
            );

          const completedCount =
            getPathCompletedCount(
              path.stations,
            );

          const progressPercent =
            path.stations.length > 0
              ? Math.round(
                  (completedCount /
                    path.stations.length) *
                    100,
                )
              : 0;

          return {
            id: path.pathId,
            title: path.title,
            subtitle: `${completedCount} من ${path.stations.length} مكتملة`,
            badge: `${progressPercent}%`,
            progressPercent,
            statusLabel: `${submittedCount} تقييم`,
            content: (
              <SurveyPathView
                key={path.pathId}
                path={path}
                requestedCourseId={
                  requestedCourseId
                }
                getCourseSurvey={
                  getCourseSurvey
                }
                onSaved={loadSurveys}
              />
            ),
          };
        })}
      />
    </div>
  );
}

function SurveyPathView({
  path,
  requestedCourseId,
  getCourseSurvey,
  onSaved,
}: {
  path: StudentCareerPathProgress;
  requestedCourseId: string;
  getCourseSurvey: (
    courseId: string,
  ) => StudentSurveyRecord | null;
  onSaved: () => Promise<void>;
}) {
  const initialCourseId =
    path.stations.some(
      (station) =>
        station.courseId ===
        requestedCourseId,
    )
      ? requestedCourseId
      : path.stations[0]?.courseId ??
        "";

  const [activeCourseId, setActiveCourseId] =
    useState(initialCourseId);

  useEffect(() => {
    const exists = path.stations.some(
      (station) =>
        station.courseId ===
        activeCourseId,
    );

    if (!exists) {
      setActiveCourseId(
        path.stations[0]?.courseId ??
          "",
      );
    }
  }, [path, activeCourseId]);

  const activeCourse =
    path.stations.find(
      (station) =>
        station.courseId ===
        activeCourseId,
    ) ?? path.stations[0];

  if (!activeCourse) {
    return null;
  }

  const survey = getCourseSurvey(
    activeCourse.courseId,
  );

  return (
    <div className="space-y-3">
      <CompactStationRoad
        stations={path.stations}
        activeCourseId={
          activeCourse.courseId
        }
        getCourseSurvey={
          getCourseSurvey
        }
        onSelectCourse={
          setActiveCourseId
        }
      />

      <section className="overflow-hidden rounded-b-[24px] border border-[#DCE2EA] bg-white shadow-[0_12px_32px_rgba(7,21,46,0.07)]">
        <header className="flex items-center justify-between border-b border-[#E5EAF0] bg-[#F7F9FC] px-5 py-3">
          <div>
            <p className="text-[10px] font-black text-[#C88712]">
              استبياناتي
            </p>

            <h3 className="mt-1 text-[17px] font-black text-[#07152E]">
              {activeCourse.shortTitle ||
                activeCourse.title}
            </h3>
          </div>

          <SurveyStatusBadge
            survey={survey}
          />
        </header>

        <div className="p-4">
          <SurveyCard
            key={`${activeCourse.courseId}-${survey?.submitted_at ?? "new"}-${survey?.detailed_survey_completed ?? false}`}
            courseId={
              activeCourse.courseId
            }
            courseTitle={
              activeCourse.shortTitle ||
              activeCourse.title
            }
            submitted={Boolean(
              survey?.submitted_at,
            )}
            rating={
              survey?.rating ?? 0
            }
            comment={
              survey?.comment ?? ""
            }
            surveyUrl={
  getCourseSurveyUrl(
    survey?.courses ?? null,
  ) ??
  getRelatedSurveyUrl(
    survey?.survey_templates ?? null,
  )
}
            detailedSurveyCompleted={Boolean(
              survey?.detailed_survey_completed,
            )}
            onSaved={onSaved}
          />
        </div>
      </section>
    </div>
  );
}

function CompactStationRoad({
  stations,
  activeCourseId,
  getCourseSurvey,
  onSelectCourse,
}: {
  stations: StudentPathStationProgress[];
  activeCourseId: string;
  getCourseSurvey: (
    courseId: string,
  ) => StudentSurveyRecord | null;
  onSelectCourse: (
    courseId: string,
  ) => void;
}) {
  return (
    <div className="relative px-3 py-3">
        <div
          className="relative mx-auto grid w-full items-start gap-1 px-2 pt-1 sm:px-4"
          style={{
            gridTemplateColumns: `repeat(${stations.length}, minmax(0, 1fr))`,
          }}
        >
          <div className="absolute left-[11%] right-[11%] top-[32px] h-[8px] bg-[#07152E]">
            <div className="absolute inset-x-0 top-1/2 h-[0.5px] -translate-y-1/2 bg-[#F7B548]" />
          </div>

          {stations.map(
            (station, index) => {
              const active =
                station.courseId ===
                activeCourseId;

              const survey =
                getCourseSurvey(
                  station.courseId,
                );

              const completed =
                Boolean(
                  survey?.submitted_at,
                ) &&
                Boolean(
                  survey?.detailed_survey_completed,
                );

              return (
                <button
                  key={station.stationId}
                  type="button"
                  onClick={() =>
                    onSelectCourse(
                      station.courseId,
                    )
                  }
                  className="group relative z-10 flex min-w-0 flex-col items-center px-1 py-1"
                >
                  <span
                    className={`relative flex h-[52px] w-[52px] items-center justify-center overflow-hidden rounded-full border-[2px] bg-white transition ${
                      active
                        ? "scale-110 border-[#F7B548] shadow-[0_6px_18px_rgba(247,181,72,0.28)]"
                        : completed
                          ? "border-emerald-400"
                          : "border-[#D5DCE6] group-hover:border-[#F7B548]"
                    }`}
                  >
                    {station.iconUrl ? (
                      <img
                        src={station.iconUrl}
                        alt={
                          station.shortTitle ||
                          station.title
                        }
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-black text-[#07152E]">
                        {index + 1}
                      </span>
                    )}
                  </span>

                  <span
                    className={`mt-2 w-full truncate text-center text-[9px] font-black sm:text-[10px] ${
                      active
                        ? "text-[#C88712]"
                        : "text-[#334155]"
                    }`}
                  >
                    {station.shortTitle ||
                      station.title}
                  </span>

                  <span
                    className={`mt-0.5 text-[8px] font-bold ${
                      completed
                        ? "text-emerald-600"
                        : survey
                          ? "text-blue-600"
                          : "text-slate-400"
                    }`}
                  >
                    {completed
                      ? "مكتمل"
                      : survey
                        ? "محفوظ"
                        : "بانتظار التقييم"}
                  </span>
                </button>
              );
            },
          )}
        </div>
    </div>
  );
}

function SurveyStatusBadge({
  survey,
}: {
  survey: StudentSurveyRecord | null;
}) {
  const completed =
    Boolean(survey?.submitted_at) &&
    Boolean(
      survey?.detailed_survey_completed,
    );

  if (completed) {
    return (
      <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-black text-emerald-700">
        اكتملت رحلة التقييم
      </span>
    );
  }

  if (survey) {
    return (
      <span className="rounded-full bg-blue-100 px-3 py-1 text-[10px] font-black text-blue-700">
        التقييم محفوظ
      </span>
    );
  }

  return (
    <span className="rounded-full bg-amber-100 px-3 py-1 text-[10px] font-black text-amber-700">
      بانتظار التقييم
    </span>
  );
}