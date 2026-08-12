"use client";
import MasarPassportCard from "../passport/MasarPassportCard";
import PointsRulesCard from "../passport/PointsRulesCard";
import RewardsCard from "../passport/RewardsCard";
import DrawModal from "../passport/DrawModal";
import ModalShell from "../passport/ModalShell";
import ProgressModal from "../passport/ProgressModal";
import {
  Award,
  BookOpenCheck,
  CheckCircle2,
  ChevronLeft,
  ClipboardCheck,
  Crown,
  FileUp,
  Gift,
  Medal,
  Plane,
  PlayCircle,
  Sparkles,
  Star,
  Ticket,
  Trophy,
  Users,
  X,
} from "lucide-react";

import { useState } from "react";

import type {
  StudentDashboardData,
} from "@/lib/queries/student-dashboard";

type Props = {
  data: StudentDashboardData;
};

type ModalType =
  | "draw"
  | "progress"
  | null;

type Level = {
  name: string;
  minimumPoints: number;
  icon: typeof Award;
};

const levels: Level[] = [
  {
    name: "Explorer",
    minimumPoints: 0,
    icon: Medal,
  },
  {
    name: "Professional",
    minimumPoints: 500,
    icon: Award,
  },
  {
    name: "Expert",
    minimumPoints: 1500,
    icon: Trophy,
  },
  {
    name: "Mentor",
    minimumPoints: 3000,
    icon: Crown,
  },
];

const journeyPointsRules = [
  {
    key: "professional-enrollment",
    label: "الاشتراك في رحلة احتراف",
    points: 50,
    icon: BookOpenCheck,
  },
  {
    key: "professional-completion",
    label: "إكمال رحلة احتراف",
    points: 20,
    icon: CheckCircle2,
  },
  {
    key: "one-day-enrollment",
    label: "الاشتراك في رحلة اليوم الواحد",
    points: 20,
    icon: Plane,
  },
  {
    key: "free-view",
    label: "مشاهدة رحلة مجانية",
    points: 5,
    icon: PlayCircle,
  },
] as const;

const interactionPointsRules = [
  {
    key: "survey",
    label: "إكمال التقييم",
    points: 20,
    icon: ClipboardCheck,
  },
  {
    key: "project",
    label: "رفع مشروع",
    points: 50,
    icon: FileUp,
  },
  {
    key: "featured-project",
    label: "مشروع مميز",
    points: 20,
    icon: Star,
  },
  {
    key: "referral",
    label: "دعوة صديق",
    points: 50,
    icon: Users,
  },
] as const;

function clamp(
  value: number,
  minimum: number,
  maximum: number,
) {
  return Math.max(
    minimum,
    Math.min(maximum, value),
  );
}

export default function MasarPassportPanel({
  data,
}: Props) {
  const [activeModal, setActiveModal] =
    useState<ModalType>(null);
const passport = data.passport;
  

  /*
   * سيتم ربط هذه القيم ببيانات المشاريع
   * والملف المهني والإحالات في الخطوة التالية.
   */
  

  const pointsBreakdown = {
  professionalEnrollment:
    passport.professionalEnrollmentPoints,

  professionalCompletion:
    passport.professionalCompletionPoints,

  oneDayEnrollment:
    passport.oneDayEnrollmentPoints,

  freeJourney:
    passport.freeJourneyPoints,

  surveys:
    passport.surveyPoints,

  projects:
    passport.projectPoints,

  featuredProjects:
    passport.featuredProjectPoints,

  referrals:
    passport.referralPoints,
};
 const totalPoints =
  passport.totalPoints;

 const monthlyDrawEntries =
  passport.drawEntries;

  const currentLevel =
  levels.find(
    (level) =>
      level.name ===
      passport.currentLevel,
  ) ?? levels[0];

const CurrentLevelIcon =
  currentLevel.icon;

const nextLevel =
  passport.nextLevel
    ? levels.find(
        (level) =>
          level.name ===
          passport.nextLevel,
      ) ?? null
    : null;

  const levelProgress =
  passport.progressPercent;

 const remainingPoints =
  passport.pointsToNextLevel;

  const rewardTarget = 10;

const completedCourses =
  passport.completedCourses;
  const rewardProgress =
passport.rewardProgress;
const visibleRewardItems =
  passport.rewardItems.slice(
    0,
    rewardTarget,
  );
const rewardPercent = Math.min(
  100,
  Math.round(
    (passport.rewardProgress /
      rewardTarget) *
      100,
  ),
);

  return (
    <>
      <div
        dir="rtl"
        className="space-y-4"
      >
    
<MasarPassportCard
  CurrentLevelIcon={CurrentLevelIcon}
  currentLevel={currentLevel}
  nextLevel={nextLevel}
  levelProgress={levelProgress}
  remainingPoints={remainingPoints}
  totalPoints={totalPoints}
  monthlyDrawEntries={monthlyDrawEntries}
  onShowProgress={() =>
    setActiveModal("progress")
  }
  onShowDraw={() =>
    setActiveModal("draw")
  }
/>
       <PointsRulesCard
  journeyRules={journeyPointsRules}
  interactionRules={interactionPointsRules}
  JourneyIcon={BookOpenCheck}
  InteractionIcon={Users}
/>

<RewardsCard

rewardProgress={rewardProgress}

rewardTarget={rewardTarget}

rewardPercent={rewardPercent}

earnedRewards={
passport.earnedRewards
}

redeemedRewards={
passport.redeemedRewards
}

availableRewards={
passport.availableRewards
}

visibleRewardItems={
visibleRewardItems
}

/>
      </div>

      <DrawModal
  open={activeModal === "draw"}
  monthlyDrawEntries={monthlyDrawEntries}
  onClose={() =>
    setActiveModal(null)
  }
/>

      <ProgressModal
  open={activeModal === "progress"}
  onClose={() =>
    setActiveModal(null)
  }
  levels={levels}
  currentLevel={currentLevel}
  nextLevel={nextLevel}
  levelProgress={levelProgress}
  remainingPoints={remainingPoints}
  totalPoints={totalPoints}
  passport={passport}
  pointsBreakdown={pointsBreakdown}
/>
    </>
  );
}
function PointsRulesRow({
  title,
  icon: SectionIcon,
  rules,
}: {
  title: string;
  icon: typeof Award;
  rules: readonly {
    key: string;
    label: string;
    points: number;
    icon: typeof Award;
  }[];
}) {
  return (
    <div className="grid gap-2 lg:grid-cols-[170px_minmax(0,1fr)] lg:items-center">
      <div className="flex items-center gap-2 rounded-xl bg-[#FFF5DD] px-3 py-2 text-[#B8790B]">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white">
          <SectionIcon size={16} />
        </span>

        <span className="text-[12px] font-black">
          {title}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {rules.map((rule) => {
          const Icon = rule.icon;

          return (
            <div
              key={rule.key}
              className="flex min-h-[44px] items-center gap-2 rounded-xl border border-[#E9D39E] bg-white px-3 py-1.5"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FFF5DD] text-[#C88712]">
                <Icon size={14} />
              </span>

              <p className="min-w-0 flex-1 text-[11px] font-black text-[#07152E]">
                {rule.label}

                <span className="mr-1 whitespace-nowrap text-[#C88712]">
                  {rule.points} نقطة
                </span>
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}