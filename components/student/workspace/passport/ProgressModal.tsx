"use client";

import type { ComponentType } from "react";

import type {
  StudentDashboardData,
} from "@/lib/queries/student-dashboard";

import ModalShell from "./ModalShell";

type Level = {
  name: string;
  minimumPoints: number;
  icon: ComponentType<{
    size?: number;
    className?: string;
  }>;
};

type PointsBreakdown = {
  professionalEnrollment: number;
  professionalCompletion: number;
  oneDayEnrollment: number;
  freeJourney: number;
  surveys: number;
  projects: number;
  featuredProjects: number;
  referrals: number;
  bonusPoints: number;
};

interface Props {
  open: boolean;
  onClose: () => void;

  levels: Level[];
  currentLevel: Level;
  nextLevel: Level | null;

  levelProgress: number;
  remainingPoints: number;
  totalPoints: number;

  passport: StudentDashboardData["passport"];
  pointsBreakdown: PointsBreakdown;
  locale?: "ar" | "en";
}

export default function ProgressModal({
  open,
  onClose,
  levels,
  currentLevel,
  nextLevel,
  levelProgress,
  remainingPoints,
  totalPoints,
  passport,
  pointsBreakdown,
  locale = "ar",
}: Props) {
  const isArabic = locale === "ar";
  if (!open) return null;

  return (
    <ModalShell
      title={isArabic ? "تفاصيل تقدمك" : "Progress Details"}
      onClose={onClose}
    >
      <div className="grid gap-5 md:grid-cols-2">
        <section className="rounded-2xl border border-[#E1E7EE] bg-[#F8FAFC] p-3">
          <p className="text-[10px] font-black text-[#C88712]">
            {isArabic ? "مسار المستويات" : "Level Path"}
          </p>

          <h3 className="mt-1 text-[19px] font-black text-[#07152E]">
            {currentLevel.name}
            {nextLevel
              ? ` → ${nextLevel.name}`
              : ""}
          </h3>

          <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-[#F7B548]"
              style={{
                width: `${levelProgress}%`,
              }}
            />
          </div>

          <p className="mt-3 text-[10px] font-bold text-slate-500">
            {nextLevel
              ? isArabic
                ? `يتبقى ${remainingPoints} نقطة للوصول إلى ${nextLevel.name}.`
                : `${remainingPoints} points remaining to reach ${nextLevel.name}.`
              : isArabic
                ? "لقد وصلت إلى أعلى مستوى متاح."
                : "You reached the highest available level."}
          </p>

          <div className="mt-5 space-y-2">
            {levels.map((level) => {
              const Icon = level.icon;

              const unlocked =
                totalPoints >=
                level.minimumPoints;

              return (
                <div
                  key={level.name}
                  className={`flex items-center justify-between rounded-xl border px-3 py-2 ${
                    unlocked
                      ? "border-[#F7B548]/50 bg-[#FFF8E9]"
                      : "border-[#E1E7EE] bg-white"
                  }`}
                >
                  <span className="flex items-center gap-2 text-[10px] font-black text-[#07152E]">
                    <Icon
                      size={16}
                      className={
                        unlocked
                          ? "text-[#C88712]"
                          : "text-slate-300"
                      }
                    />

                    {level.name}
                  </span>

                  <span className="text-[9px] font-bold text-slate-500">
                    {level.minimumPoints} {isArabic ? "نقطة" : "points"}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-[#E1E7EE] bg-white p-3">
          <p className="text-[10px] font-black text-[#C88712]">
            {isArabic ? "تفاصيل النقاط" : "Points Details"}
          </p>

          <div className="mt-4 space-y-2">
            <PointsLine
              isArabic={isArabic}
              label={isArabic ? "الاشتراك في رحلة احتراف" : "Enroll in a Professional Journey"}
              count={
                passport.professionalEnrollmentsCount
              }
              value={
                pointsBreakdown.professionalEnrollment
              }
            />

            <PointsLine
              isArabic={isArabic}
              label={isArabic ? "إكمال رحلة احتراف" : "Complete a Professional Journey"}
              count={
                passport.professionalCompletionsCount
              }
              value={
                pointsBreakdown.professionalCompletion
              }
            />

            <PointsLine
              isArabic={isArabic}
              label={isArabic ? "الاشتراك في رحلة اليوم الواحد" : "Enroll in a One-Day Journey"}
              count={
                passport.oneDayEnrollmentsCount
              }
              value={
                pointsBreakdown.oneDayEnrollment
              }
            />

            <PointsLine
              isArabic={isArabic}
              label={isArabic ? "مشاهدة رحلة مجانية" : "Watch a Free Journey"}
              count={
                passport.freeJourneyViewsCount
              }
              value={
                pointsBreakdown.freeJourney
              }
            />

            <PointsLine
              isArabic={isArabic}
              label={isArabic ? "إكمال التقييم" : "Complete a Review"}
              count={passport.surveyCount}
              value={pointsBreakdown.surveys}
            />

            <PointsLine
              isArabic={isArabic}
              label={isArabic ? "رفع مشروع" : "Upload a Project"}
              count={passport.projectCount}
              value={pointsBreakdown.projects}
            />

            <PointsLine
              isArabic={isArabic}
              label={isArabic ? "مشروع مميز" : "Featured Project"}
              count={
                passport.featuredProjectCount
              }
              value={
                pointsBreakdown.featuredProjects
              }
            />

            <PointsLine
              isArabic={isArabic}
              label={isArabic ? "دعوة صديق" : "Refer a Friend"}
              count={passport.referralCount}
              value={pointsBreakdown.referrals}
            />
            <PointsLine
              isArabic={isArabic}
  label={isArabic ? "نقاط إضافية" : "Bonus Points"}
  count={passport.bonusPointsHistory.length}
  value={pointsBreakdown.bonusPoints}
/>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-xl bg-[#07152E] px-4 py-3 text-white">
            <span className="text-[11px] font-black">
              {isArabic ? "إجمالي النقاط" : "Total Points"}
            </span>

            <span className="text-[19px] font-black text-[#F7B548]">
              {totalPoints.toLocaleString(
                "en-US",
              )}
            </span>
          </div>
        </section>
      </div>
    </ModalShell>
  );
}

function PointsLine({
  label,
  count,
  value,
  isArabic,
}: {
  label: string;
  count: number;
  value: number;
  isArabic: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-[#E5EAF0] px-4 py-3">
      <div className="flex flex-col">
        <span className="text-[11px] font-black text-[#07152E]">
          {label}
        </span>

        <span className="mt-1 text-[10px] font-bold text-slate-500">
          {isArabic ? "عدد الإنجازات:" : "Achievements:"}
          <span className="mr-1 font-black text-[#C88712]">
            ({count})
          </span>
        </span>
      </div>

      <div className="rounded-xl bg-[#FFF5DD] px-4 py-2 text-center">
        <p className="text-[15px] font-black text-[#C88712]">
          {value}
        </p>

        <p className="text-[9px] font-bold text-slate-500">
          {isArabic ? "نقطة" : "points"}
        </p>
      </div>
    </div>
  );
}