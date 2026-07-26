"use client";

import Link from "next/link";
import { useState } from "react";
import CourseOverviewForm from "@/components/admin/courses/CourseOverviewForm";
import CourseCertificatesPanel from "@/components/admin/courses/CourseCertificatesPanel";

import {
  BarChart3,
  BookOpen,
  ChevronLeft,
  CircleDollarSign,
  FileBadge2,
  LayoutDashboard,
  Settings,
  Users,
} from "lucide-react";

type CourseStatus = "draft" | "published" | "archived";

interface CourseData {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
  icon_url?: string | null;
  duration_hours?: number | null;
  price?: number | null;
  currency?: string | null;
  journey_type?: string | null;
  status?: CourseStatus | null;
  whatsapp_number?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

interface CourseManagementTabsProps {
  course: CourseData;
}

type TabId =
  | "overview"
  | "content"
  | "pricing"
  | "certificates"
  | "students"
  | "analytics"
  | "settings";

const tabs: {
  id: TabId;
  label: string;
  icon: typeof LayoutDashboard;
}[] = [
  {
    id: "overview",
    label: "نظرة عامة",
    icon: LayoutDashboard,
  },
  {
    id: "content",
    label: "المحتوى",
    icon: BookOpen,
  },
  {
    id: "pricing",
    label: "الأسعار",
    icon: CircleDollarSign,
  },
  {
    id: "certificates",
    label: "الشهادات",
    icon: FileBadge2,
  },
  {
    id: "students",
    label: "الطلاب",
    icon: Users,
  },
  {
    id: "analytics",
    label: "الإحصائيات",
    icon: BarChart3,
  },
  {
    id: "settings",
    label: "الإعدادات",
    icon: Settings,
  },
];

const statusLabels: Record<CourseStatus, string> = {
  draft: "مسودة",
  published: "منشور",
  archived: "مؤرشف",
};

const journeyLabels: Record<string, string> = {
  career_path: "رحلة احتراف متكاملة",
  workshop: "رحلة اليوم الواحد",
  free: "رحلة مجانية",
};

export default function CourseManagementTabs({
  course,
}: CourseManagementTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const normalizedStatus = course.status ?? "draft";

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-5 border-b border-slate-200 p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100">
              {course.icon_url ? (
                <img
                  src={course.icon_url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <BookOpen className="h-7 w-7 text-slate-400" />
              )}
            </div>

            <div className="min-w-0">
              <Link
                href="/admin/learning/courses"
                className="mb-2 inline-flex items-center gap-1 text-sm font-bold text-slate-500 transition hover:text-[#07152E]"
              >
                <ChevronLeft className="h-4 w-4" />
                العودة إلى الكورسات
              </Link>

              <h1 className="truncate text-2xl font-black text-[#07152E]">
                {course.title}
              </h1>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                <span>{journeyLabels[course.journey_type ?? ""] ?? "غير مصنف"}</span>
                <span aria-hidden="true">•</span>
                <span>{course.duration_hours ?? 0} ساعة</span>
                <span aria-hidden="true">•</span>
                <span className="font-mono text-xs">{course.slug}</span>
              </div>
            </div>
          </div>

          <span
            className={`w-fit rounded-full px-4 py-2 text-sm font-black ${
              normalizedStatus === "published"
                ? "bg-emerald-50 text-emerald-700"
                : normalizedStatus === "archived"
                  ? "bg-slate-100 text-slate-600"
                  : "bg-amber-50 text-amber-700"
            }`}
          >
            {statusLabels[normalizedStatus]}
          </span>
        </div>

        <div className="overflow-x-auto border-b border-slate-200">
          <div className="flex min-w-max px-3">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative inline-flex items-center gap-2 px-4 py-4 text-sm font-black transition ${
                    isActive
                      ? "text-[#07152E]"
                      : "text-slate-500 hover:text-[#07152E]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}

                  {isActive && (
                    <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-[#F7B548]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6">
          {activeTab === "overview" && <OverviewPanel course={course} />}
          {activeTab === "content" && (
            <PlaceholderPanel
              icon={BookOpen}
              title="محتوى الكورس"
              description="سنضيف هنا الوحدات والدروس والفيديوهات والملفات القابلة للتحميل."
            />
          )}
          {activeTab === "pricing" && (
            <PlaceholderPanel
              icon={CircleDollarSign}
              title="الأسعار والعروض"
              description="سيحتوي هذا القسم على السعر الأساسي والخصومات والباقات وسياسات الاشتراك."
            />
          )}
          {activeTab === "certificates" && (
            <CourseCertificatesPanel
              courseId={course.id}
              courseTitle={course.title}
            />
          )}
          {activeTab === "students" && (
            <PlaceholderPanel
              icon={Users}
              title="طلاب الكورس"
              description="سيعرض هذا القسم الطلاب المشتركين وحالة التقدم والاستحقاق للشهادة."
            />
          )}
          {activeTab === "analytics" && (
            <PlaceholderPanel
              icon={BarChart3}
              title="إحصائيات الكورس"
              description="سيعرض هذا القسم التسجيلات ونسب الإكمال والمشاركة ونتائج المحتوى."
            />
          )}
          {activeTab === "settings" && (
            <PlaceholderPanel
              icon={Settings}
              title="إعدادات الكورس"
              description="ستوجد هنا إعدادات النشر والأرشفة والنسخ والحذف الآمن."
            />
          )}
        </div>
      </div>
    </div>
  );
}

function OverviewPanel({ course }: { course: CourseData }) {
  return <CourseOverviewForm course={course} />;
}

function PlaceholderPanel({
  icon: Icon,
  title,
  description,
  highlighted = false,
}: {
  icon: typeof BookOpen;
  title: string;
  description: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed p-8 text-center ${
        highlighted
          ? "border-[#F7B548] bg-amber-50/60"
          : "border-slate-300 bg-slate-50/70"
      }`}
    >
      <div
        className={`flex h-16 w-16 items-center justify-center rounded-2xl ${
          highlighted
            ? "bg-[#F7B548] text-[#07152E]"
            : "bg-white text-slate-500 shadow-sm"
        }`}
      >
        <Icon className="h-7 w-7" />
      </div>

      <h2 className="mt-5 text-xl font-black text-[#07152E]">{title}</h2>

      <p className="mt-2 max-w-xl leading-7 text-slate-600">{description}</p>
    </div>
  );
}