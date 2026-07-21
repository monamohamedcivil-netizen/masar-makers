import {
  Award,
  ClipboardList,
  FileCheck2,
  FileUp,
  GraduationCap,
  PlayCircle,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";

import type { WorkspaceDefinition } from "./types";

/**
 * MVP data source.
 * Package 07 can replace this object with a Supabase query without changing
 * StudentWorkspace, its sidebars, or the central renderer.
 */
export const studentWorkspaceDefinition: WorkspaceDefinition = {
  id: "student-main-workspace",
  slug: "journey",
  defaultPanelId: "career",
  panels: [
    {
      id: "career",
      title: "رحلاتي التعليمية",
      eyebrow: "مسار التصميم المتكامل للطرق",
      icon: GraduationCap,
      side: "learning",
      kind: "course-list",
      order: 1,
    },
    {
      id: "one-day",
      title: "رحلات اليوم الواحد",
      icon: Zap,
      side: "learning",
      kind: "empty-journey",
      order: 2,
      settings: {
        description: "ستظهر هنا الرحلات القصيرة التي اشتركت بها.",
        href: "/journeys/one-day",
      },
    },
    {
      id: "free",
      title: "الرحلات المجانية",
      icon: PlayCircle,
      side: "learning",
      kind: "empty-journey",
      order: 3,
      settings: {
        description: "ابدأ من المحتوى المجاني المتاح لك.",
        href: "/journeys/free",
        accent: "free",
      },
    },
    {
      id: "next",
      title: "الخطوة التالية",
      icon: Target,
      side: "learning",
      kind: "next-step",
      order: 4,
    },
    {
      id: "certificates",
      title: "شهاداتي",
      icon: FileCheck2,
      side: "achievement",
      kind: "certificates",
      order: 1,
    },
    {
      id: "achievements",
      title: "بطاقة الإنجازات",
      icon: Award,
      side: "achievement",
      kind: "achievement-card",
      order: 2,
    },
    {
      id: "surveys",
      title: "استبياناتي",
      icon: ClipboardList,
      side: "achievement",
      kind: "surveys",
      order: 3,
    },
    {
      id: "projects",
      title: "مشاريعي",
      icon: FileUp,
      side: "achievement",
      kind: "projects",
      order: 4,
    },
  ],
};
