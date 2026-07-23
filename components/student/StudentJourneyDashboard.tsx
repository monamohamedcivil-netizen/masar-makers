"use client";

import {
  BarChart3,
  ClipboardList,
  Compass,
  GraduationCap,
  Layers3,
  PlayCircle,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";

import StudentStatistics from "@/components/student/StudentStatistics";
import type { StudentStatisticsData } from "@/components/student/mockStatistics";
import { StudentWorkspace, studentWorkspaceDefinition } from "@/components/student/workspace";
import type { StudentDashboardData } from "@/lib/queries/student-dashboard";

type Props = { data: StudentDashboardData };

export default function StudentJourneyDashboard({ data }: Props) {
  const totalCourses =
    data.activeCourses.length +
    data.completedCourses.length +
    data.pendingCourses.length;

  const oneDayCount = data.oneDayJourneyGroups.reduce(
    (total, group) => total + group.journeys.length,
    0,
  );

  const freeCount = data.freeJourneyGroups.reduce(
    (total, group) => total + group.journeys.length,
    0,
  );

  const statistics: StudentStatisticsData = {
    learning: [
      {
        id: "paths-journeys",
        label: "المسارات والرحلات",
        icon: Layers3,
        splitValue: {
          primaryValue: data.careerPaths.length,
          primaryLabel: "مسارات",
          secondaryValue: totalCourses,
          secondaryLabel: "كورسات",
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
        value: data.summary.active,
      },
      {
        id: "progress",
        label: "متوسط التقدم",
        icon: BarChart3,
        progress: data.summary.averageProgress,
      },
      {
        id: "completed",
        label: "الرحلات المكتملة",
        icon: GraduationCap,
        value: data.summary.completed,
      },
      {
        id: "pending",
        label: "بانتظار الاعتماد",
        icon: Target,
        value: data.summary.pending,
      },
    ],
  };

  return (
    <div dir="rtl" className="bg-white text-[#07152E]">
     <section className="border-b border-[#C9D4DF] bg-[#DCE7F2]">
        <StudentStatistics data={statistics} />
      </section>

      <div className="bg-white pt-6">
        <StudentWorkspace
          definition={studentWorkspaceDefinition}
          data={data}
        />
      </div>
    </div>
  );
}