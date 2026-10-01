"use client";

import { useEffect, useState } from "react";

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
  previewUserId?: string;
  readOnly?: boolean;
};

export default function StudentJourneyDashboard({
  data,
  initialPanelId,
  initialLessonId,
  previewUserId,
  readOnly = false,
}: Props) {
  const [locale, setLocale] = useState<"ar" | "en">("ar");

  useEffect(() => {
    const readLocale = () => {
      const saved = window.localStorage.getItem("masar-locale");
      setLocale(saved === "en" ? "en" : "ar");
    };

    readLocale();

    const handleLocaleChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ locale?: "ar" | "en" }>;
      if (customEvent.detail?.locale === "ar" || customEvent.detail?.locale === "en") {
        setLocale(customEvent.detail.locale);
      } else {
        readLocale();
      }
    };

    window.addEventListener("masar:locale-change", handleLocaleChange);
    window.addEventListener("storage", readLocale);
    return () => {
      window.removeEventListener("masar:locale-change", handleLocaleChange);
      window.removeEventListener("storage", readLocale);
    };
  }, []);

  const isArabic = locale === "ar";

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

  /*
 * الإحصائيات الرسمية للرحلات تأتي من Shared Journey Calculator
 * نفسه المستخدم في لوحة الإدارة وMasar Passport.
 *
 * لا نعيد حساب Active / Completed / Pending داخل الواجهة
 * حتى لا تختلف صفحة الطالب عن لوحة الإدارة أو نظام النقاط.
 */
const activeJourneys = data.summary.active;

const completedJourneys = data.summary.completed;

const pendingJourneys = data.summary.pending;

  /*
 * متوسط التقدم العام يشمل جميع أنواع الرحلات:
 * Professional + One Day + Free
 * ويأتي من نفس Shared Calculator المستخدم في النظام.
 */
const averageJourneyProgress =
  data.summary.averageProgress;

  const statistics: StudentStatisticsData = {
    learning: [
      {
        id: "paths-journeys",
        label: isArabic ? "المسارات والرحلات" : "Paths & Journeys",
        icon: Layers3,
        splitValue: {
          primaryValue: data.careerPaths.length,
          primaryLabel: isArabic ? "مسارات" : "Paths",
          secondaryValue: professionalCount,
          secondaryLabel: isArabic ? "رحلات" : "Journeys",
        },
      },
      {
        id: "one-day",
        label: isArabic ? "رحلات اليوم الواحد" : "One-Day Journeys",
        icon: Zap,
        value: oneDayCount,
        secondaryText:
          oneDayCount > 0
            ? (isArabic ? "رحلات متاحة في حسابك" : "journeys available")
            : (isArabic ? "لا توجد رحلات بعد" : "No journeys yet"),
      },
      {
        id: "free",
        label: isArabic ? "الرحلات المجانية" : "Free Journeys",
        icon: Sparkles,
        value: freeCount,
        secondaryText:
          freeCount > 0
            ? (isArabic ? "رحلات مجانية متاحة" : "free journeys available")
            : (isArabic ? "ابدأ أول رحلة مجانية" : "Start your first free journey"),
      },
      {
  id: "surveys",
  label: isArabic ? "الاستبيانات" : "Surveys",
  icon: ClipboardList,
  splitValue: {
    primaryValue:
      data.summary.surveysCompleted,
    primaryLabel: isArabic ? "مكتمل" : "Completed",

    secondaryValue:
      data.summary.surveysRemaining,
    secondaryLabel: isArabic ? "متبقي" : "Remaining",
  },
},
    ],
    achievements: [
      {
        id: "active",
        label: isArabic ? "الرحلات النشطة" : "Active Journeys",
        icon: Compass,
        value: activeJourneys,
      },
      {
        id: "progress",
        label: isArabic ? "متوسط التقدم" : "Average Progress",
        icon: BarChart3,
        progress: averageJourneyProgress,
      },
      {
        id: "completed",
        label: isArabic ? "الرحلات المكتملة" : "Completed Journeys",
        icon: GraduationCap,
        value: completedJourneys,
      },
      {
        id: "pending",
        label: isArabic ? "بانتظار الاعتماد" : "Pending Approval",
        icon: Target,
        value: pendingJourneys,
      },
    ],
  };

  return (
    <div dir={isArabic ? "rtl" : "ltr"} className="bg-white text-[#07152E]">
      <section className="border-b border-[#C9D4DF] bg-[#DCE7F2]">
        <StudentStatistics
  data={statistics}
  currentLevel={data.passport.currentLevel}
  nextLevel={data.passport.nextLevel}
  progressPercent={data.passport.progressPercent}
  pointsToNextLevel={data.passport.pointsToNextLevel}
  locale={locale}
/>
      </section>

      <div className="bg-white pt-6">
        <StudentWorkspace
          definition={studentWorkspaceDefinition}
          data={data}
          initialPanelId={initialPanelId}
          initialLessonId={initialLessonId}
          previewUserId={previewUserId}
          readOnly={readOnly}
        />
      </div>
    </div>
  );
}