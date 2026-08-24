"use client";

import {
  BarChart3,
  ClipboardList,
  Compass,
  GraduationCap,
  Layers3,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";

import StudentStatistics from "@/components/student/StudentStatistics";
import type { StudentStatisticsData } from "@/components/student/mockStatistics";
import { StudentWorkspace, studentWorkspaceDefinition } from "@/components/student/workspace";
import type { WorkspacePanelId } from "@/components/student/workspace/types";
import type { StudentDashboardData } from "@/lib/queries/student-dashboard";

type Props = {
  data: StudentDashboardData;
  initialPanelId?: WorkspacePanelId;
  initialLessonId?: string;
};

export default function StudentJourneyDashboard({
  data,
  initialPanelId,
  initialLessonId,
}: Props) {
  /*
   * إحصائيات موحدة:
   * نعد نفس "الرحلات التعليمية" التي تظهر فعليًا للطالب.
   * - رحلة الاحتراف المقسمة: كل learningPart متاح = رحلة مستقلة.
   * - اليوم الواحد/المجاني: كل journey = رحلة مستقلة.
   * - التقدم الرسمي لكل رحلة احترافية يستخدم station.progressPercent
   *   كحد أدنى حتى يحافظ على imported/final baseline القادم من الخادم.
   */
  const professionalJourneyParts =
    data.careerPaths.flatMap((path) =>
      path.stations.flatMap((station) =>
        station.learningParts
          .filter((part) => part.access !== "locked")
          .map((part) => {
            const lessonProgress =
              part.lessons.length > 0
                ? Math.round(
                    part.lessons.reduce(
                      (sum, lesson) =>
                        sum + lesson.progressPercent,
                      0,
                    ) / part.lessons.length,
                  )
                : 0;

            const progressPercent = Math.max(
              lessonProgress,
              station.progressPercent,
            );

            return {
              access: part.access,
              progressPercent,
              completed:
                progressPercent >= 100 ||
                station.status === "completed",
            };
          }),
      ),
    );

  const professionalCount =
    professionalJourneyParts.length;

  const professionalPendingCount =
    professionalJourneyParts.filter(
      (part) => part.access === "pending",
    ).length;

  const professionalCompletedCount =
    professionalJourneyParts.filter(
      (part) =>
        part.access === "active" &&
        part.completed,
    ).length;

  const professionalActiveCount =
    professionalJourneyParts.filter(
      (part) =>
        part.access === "active" &&
        !part.completed,
    ).length;

  const oneDayJourneys =
    data.oneDayJourneyGroups.flatMap(
      (path) =>
        path.stations.flatMap(
          (station) => station.journeys,
        ),
    );

  const freeJourneys =
    data.freeJourneyGroups.flatMap(
      (path) =>
        path.stations.flatMap(
          (station) => station.journeys,
        ),
    );

  const oneDayCount = oneDayJourneys.length;
  const freeCount = freeJourneys.length;

  const oneDayActiveCount =
    oneDayJourneys.filter(
      (journey) =>
        journey.status !== "completed",
    ).length;

  const oneDayCompletedCount =
    oneDayJourneys.filter(
      (journey) =>
        journey.status === "completed",
    ).length;

  const freeActiveCount =
    freeJourneys.filter(
      (journey) =>
        journey.status !== "completed",
    ).length;

  const freeCompletedCount =
    freeJourneys.filter(
      (journey) =>
        journey.status === "completed",
    ).length;

  const activeJourneys =
    professionalActiveCount +
    oneDayActiveCount +
    freeActiveCount;

  const completedJourneys =
    professionalCompletedCount +
    oneDayCompletedCount +
    freeCompletedCount;

  const pendingJourneys =
    professionalPendingCount;

  const allProgressValues = [
    ...professionalJourneyParts
      .filter(
        (part) => part.access === "active",
      )
      .map(
        (part) => part.progressPercent,
      ),
    ...oneDayJourneys.map(
      (journey) => journey.progressPercent,
    ),
    ...freeJourneys.map(
      (journey) => journey.progressPercent,
    ),
  ];

  const averageJourneyProgress =
    allProgressValues.length > 0
      ? Math.round(
          allProgressValues.reduce(
            (sum, value) => sum + value,
            0,
          ) / allProgressValues.length,
        )
      : 0;

  const statistics: StudentStatisticsData = {
    learning: [
      {
        id: "paths-journeys",
        label: "المسارات والرحلات",
        icon: Layers3,
        splitValue: {
          primaryValue: data.careerPaths.length,
          primaryLabel: "مسارات",
          secondaryValue: professionalCount,
          secondaryLabel: "رحلات",
        },
      },
      {
        id: "one-day",
        label: "رحلات اليوم الواحد",
        icon: Zap,
        value: oneDayCount,
        secondaryText:
          oneDayCount > 0
            ? "رحلات متاحة في حسابك"
            : "لا توجد رحلات بعد",
      },
      {
        id: "free",
        label: "الرحلات المجانية",
        icon: Sparkles,
        value: freeCount,
        secondaryText:
          freeCount > 0
            ? "رحلات مجانية متاحة"
            : "ابدأ أول رحلة مجانية",
      },
      {
        id: "surveys",
        label: "الاستبيانات",
        icon: ClipboardList,
        splitValue: {
          primaryValue: 0,
          primaryLabel: "مكتمل",
          secondaryValue: 0,
          secondaryLabel: "متبقي",
        },
      },
    ],
    achievements: [
      {
        id: "active",
        label: "الرحلات النشطة",
        icon: Compass,
        value: activeJourneys,
      },
      {
        id: "progress",
        label: "متوسط التقدم",
        icon: BarChart3,
        progress: averageJourneyProgress,
      },
      {
        id: "completed",
        label: "الرحلات المكتملة",
        icon: GraduationCap,
        value: completedJourneys,
      },
      {
        id: "pending",
        label: "بانتظار الاعتماد",
        icon: Target,
        value: pendingJourneys,
      },
    ],
  };

  return (
    <div dir="rtl" className="bg-white text-[#07152E]">
      <section className="border-b border-[#C9D4DF] bg-[#DCE7F2]">
        <StudentStatistics
  data={statistics}
  currentLevel={data.passport.currentLevel}
  nextLevel={data.passport.nextLevel}
  progressPercent={data.passport.progressPercent}
  pointsToNextLevel={data.passport.pointsToNextLevel}
/>
      </section>

      <div className="bg-white pt-6">
        <StudentWorkspace
          definition={studentWorkspaceDefinition}
          data={data}
          initialPanelId={initialPanelId}
          initialLessonId={initialLessonId}
        />
      </div>
    </div>
  );
}