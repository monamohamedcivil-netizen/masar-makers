"use client";

import { useState } from "react";
import {
  Award,
  BookOpenCheck,
  CheckCircle2,
  ClipboardCheck,
  Crown,
  FileUp,
  Medal,
  Plane,
  PlayCircle,
  Star,
  Trophy,
  Users,
} from "lucide-react";

import JourneyTabs from "../components/JourneyTabs";
import MasarPassportCard from "../passport/MasarPassportCard";
import PointsRulesCard from "../passport/PointsRulesCard";
import RewardsCard from "../passport/RewardsCard";

import ProgressModal from "../passport/ProgressModal";

import type {
  StudentDashboardData,
} from "@/lib/queries/student-dashboard";

type Props = {
  data: StudentDashboardData;
};

type ModalType =
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

export default function MasarPassportPanel({
  data,
}: Props) {
  const [activeModal, setActiveModal] =
    useState<ModalType>(null);

  const passport = data.passport;

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
      bonusPoints:
  passport.bonusPoints,
  };

  const totalPoints =
    passport.totalPoints;

  const monthlyDrawEntries =
    passport.drawEntries;

  const monthlyDrawWins =
    passport.drawWins;

  const monthlyDrawAvailableEntries =
    passport.availableDrawEntries;

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
      <div dir="rtl">
        <JourneyTabs
          ariaLabel="بطاقات Masar Passport"
          tabs={[
            {
              id: "achievements",
              title:
                "بطاقة إنجازاتك المهنية",
              subtitle:
                "مستواك ونقاطك الحالية",
              badge: `${totalPoints.toLocaleString(
                "en-US",
              )} نقطة`,
              content: (
                <MasarPassportCard
  CurrentLevelIcon={CurrentLevelIcon}
  currentLevel={currentLevel}
  nextLevel={nextLevel}
  levelProgress={levelProgress}
  remainingPoints={remainingPoints}
  totalPoints={totalPoints}
  monthlyDrawEntries={monthlyDrawEntries}
  monthlyDrawWins={monthlyDrawWins}
  monthlyDrawAvailableEntries={
    monthlyDrawAvailableEntries
  }
  onShowProgress={() =>
    setActiveModal("progress")
  }
  onShowDraw={() => {
  window.dispatchEvent(
    new CustomEvent(
      "masar:open-monthly-draw",
    ),
  );
}}
/>
              ),
            },
            {
              id: "rewards",
              title:
                "بطاقة المكافآت",
              subtitle:
                "تقدمك نحو المكافآت",
              badge: `${passport.availableRewards}`,
              content: (
                <div className="[&>section]:rounded-t-none [&>section]:border-t-0">
                  <RewardsCard
                    rewardProgress={
                      rewardProgress
                    }
                    rewardTarget={
                      rewardTarget
                    }
                    rewardPercent={
                      rewardPercent
                    }
                    earnedRewards={
                      passport.earnedRewards
                    }
                    redeemedRewards={
                      passport.redeemedRewards
                    }
                    availableRewards={
                      passport.availableRewards
                    }
                    drawRewardsEarned={
                      passport.drawRewardsEarned
                    }
                    drawRewardsRedeemed={
                      passport.drawRewardsRedeemed
                    }
                    drawRewardsAvailable={
                      passport.drawRewardsAvailable
                    }
                    visibleRewardItems={
                      visibleRewardItems
                    }
                  />
                </div>
              ),
            },
            {
              id: "points",
              title:
                "طرق زيادة النقاط",
              subtitle:
                "كيف تجمع نقاطًا أكثر",
              badge: "8 طرق",
              content: (
                <div className="[&>section]:rounded-t-none [&>section]:border-t-0">
                  <PointsRulesCard
                    journeyRules={
                      journeyPointsRules
                    }
                    interactionRules={
                      interactionPointsRules
                    }
                    JourneyIcon={
                      BookOpenCheck
                    }
                    InteractionIcon={
                      Users
                    }
                  />
                </div>
              ),
            },
          ]}
        />
      </div>

          <ProgressModal
        open={
          activeModal ===
          "progress"
        }
        onClose={() =>
          setActiveModal(null)
        }
        levels={levels}
        currentLevel={
          currentLevel
        }
        nextLevel={nextLevel}
        levelProgress={
          levelProgress
        }
        remainingPoints={
          remainingPoints
        }
        totalPoints={
          totalPoints
        }
        passport={passport}
        pointsBreakdown={
          pointsBreakdown
        }
      />
    </>
  );
}