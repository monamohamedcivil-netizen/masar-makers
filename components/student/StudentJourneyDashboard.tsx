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

  const statistics: StudentStatisticsData = {
    learning: [
      {
        id: "paths-journeys",
        label: "المسارات والرحلات",
        icon: Layers3,
        splitValue: {
          primaryValue: 1,
          primaryLabel: "مسارات",
          secondaryValue: totalCourses,
          secondaryLabel: "كورسات",
        },
      },
      {
        id: "one-day",
        label: "رحلات اليوم الواحد",
        icon: Zap,
        value: 0,
        secondaryText: "سيتم دعمها قريباً",
      },
      {
        id: "free",
        label: "الرحلات المجانية",
        icon: Sparkles,
        value: 0,
        secondaryText: "سيتم دعمها قريباً",
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
    <div dir="rtl" className="min-h-[calc(100vh-55px)] bg-[#F7F8FA] pb-10 pt-[55px] text-[#07152E]">
      <StudentStatistics data={statistics} />
      <StudentWorkspace definition={studentWorkspaceDefinition} data={data} />
    </div>
  );
}