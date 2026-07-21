"use client";

import { BarChart3, ClipboardList, Compass, GraduationCap, Sparkles, Target, Zap } from "lucide-react";
import StudentStatistics from "@/components/student/StudentStatistics";
import type { StudentStatisticsData } from "@/components/student/mockStatistics";
import { StudentWorkspace, studentWorkspaceDefinition } from "@/components/student/workspace";
import type { StudentDashboardData } from "@/lib/queries/student-dashboard";

type Props = { data: StudentDashboardData };

export default function StudentJourneyDashboard({ data }: Props) {
  const statistics: StudentStatisticsData = {
    learning: [
      { id: "paths-journeys", label: "المسارات والرحلات", icon: GraduationCap, splitValue: { primaryValue: data.summary.careerPaths, primaryLabel: "مسارات", secondaryValue: data.careerCourses.length + data.pendingCourses.length, secondaryLabel: "رحلات" } },
      { id: "one-day", label: "رحلات اليوم الواحد", icon: Zap, value: data.summary.oneDay, secondaryText: "رحلات مسجلة" },
      { id: "free", label: "الرحلات المجانية", icon: Sparkles, value: data.summary.free, secondaryText: "رحلات متاحة لك" },
      { id: "surveys", label: "الاستبيانات", icon: ClipboardList, splitValue: { primaryValue: data.summary.surveysCompleted, primaryLabel: "مكتمل", secondaryValue: data.summary.surveysPending, secondaryLabel: "متبقي" } },
    ],
    achievements: [
      { id: "active", label: "الرحلات النشطة", icon: Compass, value: data.summary.active },
      { id: "average-progress", label: "متوسط التقدم", icon: BarChart3, progress: data.summary.averageProgress },
      { id: "completed", label: "الشهادات", icon: GraduationCap, value: data.summary.certificates },
      { id: "pending", label: "بانتظار الاعتماد", icon: Target, value: data.summary.pending },
    ],
  };

  return <div dir="rtl" className="min-h-[calc(100vh-55px)] bg-[#F7F8FA] pb-10 pt-[55px] text-[#07152E]"><StudentStatistics data={statistics} /><StudentWorkspace definition={studentWorkspaceDefinition} data={data} /></div>;
}
