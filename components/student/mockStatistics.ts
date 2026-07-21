import type { LucideIcon } from "lucide-react";
import {
  ClipboardCheck,
  Clock3,
  Compass,
  GraduationCap,
  Layers3,
  PlayCircle,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";

export type SplitStatisticValue = {
  primaryValue: string | number;
  primaryLabel: string;
  secondaryValue: string | number;
  secondaryLabel: string;
};

export type StudentStatisticItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  value?: string | number;
  secondaryText?: string;
  splitValue?: SplitStatisticValue;
  progress?: number;
};

export type StudentStatisticsData = {
  learning: StudentStatisticItem[];
  achievements: StudentStatisticItem[];
};

export const defaultStudentStatistics: StudentStatisticsData = {
  learning: [
    {
      id: "paths-journeys",
      label: "المسارات والرحلات",
      icon: Layers3,
      splitValue: {
        primaryValue: 2,
        primaryLabel: "مسارات",
        secondaryValue: 5,
        secondaryLabel: "رحلات",
      },
    },
    {
      id: "one-day",
      label: "رحلات اليوم الواحد",
      icon: Zap,
      splitValue: {
        primaryValue: 3,
        primaryLabel: "مشترك",
        secondaryValue: 1,
        secondaryLabel: "متبقي",
      },
    },
    {
      id: "free",
      label: "الرحلات المجانية",
      icon: Sparkles,
      value: 8,
      secondaryText: "رحلات تمت مشاهدتها",
    },
    {
      id: "surveys",
      label: "الاستبيانات",
      icon: ClipboardCheck,
      splitValue: {
        primaryValue: 4,
        primaryLabel: "مكتمل",
        secondaryValue: 2,
        secondaryLabel: "متبقي",
      },
    },
  ],
  achievements: [
    {
      id: "active",
      label: "الرحلات النشطة",
      icon: Compass,
      value: 3,
    },
    {
      id: "progress",
      label: "متوسط التقدم",
      icon: TrendingUp,
      progress: 74,
    },
    {
      id: "completed",
      label: "الرحلات المكتملة",
      icon: GraduationCap,
      value: 6,
    },
    {
      id: "pending",
      label: "بانتظار الاعتماد",
      icon: Clock3,
      value: 2,
    },
  ],
};

export const learningStatisticIcons = {
  paths: Layers3,
  journeys: Compass,
  oneDay: Zap,
  free: PlayCircle,
  surveys: ClipboardCheck,
};
