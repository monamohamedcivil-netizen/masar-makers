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
}: Props) {
  if (!open) return null;

  return (
    <ModalShell
      title="تفاصيل تقدمك"
      onClose={onClose}
    >
      <div className="grid gap-5 md:grid-cols-2">
        <section className="rounded-2xl border border-[#E1E7EE] bg-[#F8FAFC] p-3">
          <p className="text-[10px] font-black text-[#C88712]">
            مسار المستويات
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
              ? `يتبقى ${remainingPoints} نقطة للوصول إلى ${nextLevel.name}.`
              : "لقد وصلت إلى أعلى مستوى متاح."}
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
                    {level.minimumPoints} نقطة
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-[#E1E7EE] bg-white p-3">
          <p className="text-[10px] font-black text-[#C88712]">
            تفاصيل النقاط
          </p>

          <div className="mt-4 space-y-2">
            <PointsLine
              label="الاشتراك في رحلة احتراف"
              count={
                passport.professionalEnrollmentsCount
              }
              value={
                pointsBreakdown.professionalEnrollment
              }
            />

            <PointsLine
              label="إكمال رحلة احتراف"
              count={
                passport.professionalCompletionsCount
              }
              value={
                pointsBreakdown.professionalCompletion
              }
            />

            <PointsLine
              label="الاشتراك في رحلة اليوم الواحد"
              count={
                passport.oneDayEnrollmentsCount
              }
              value={
                pointsBreakdown.oneDayEnrollment
              }
            />

            <PointsLine
              label="مشاهدة رحلة مجانية"
              count={
                passport.freeJourneyViewsCount
              }
              value={
                pointsBreakdown.freeJourney
              }
            />

            <PointsLine
              label="إكمال التقييم"
              count={passport.surveyCount}
              value={pointsBreakdown.surveys}
            />

            <PointsLine
              label="رفع مشروع"
              count={passport.projectCount}
              value={pointsBreakdown.projects}
            />

            <PointsLine
              label="مشروع مميز"
              count={
                passport.featuredProjectCount
              }
              value={
                pointsBreakdown.featuredProjects
              }
            />

            <PointsLine
              label="دعوة صديق"
              count={passport.referralCount}
              value={pointsBreakdown.referrals}
            />
            <PointsLine
  label="نقاط إضافية"
  count={passport.bonusPointsHistory.length}
  value={pointsBreakdown.bonusPoints}
/>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-xl bg-[#07152E] px-4 py-3 text-white">
            <span className="text-[11px] font-black">
              إجمالي النقاط
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
}: {
  label: string;
  count: number;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-[#E5EAF0] px-4 py-3">
      <div className="flex flex-col">
        <span className="text-[11px] font-black text-[#07152E]">
          {label}
        </span>

        <span className="mt-1 text-[10px] font-bold text-slate-500">
          عدد الإنجازات:
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
          نقطة
        </p>
      </div>
    </div>
  );
}