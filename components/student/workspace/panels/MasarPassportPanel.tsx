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
  locale?: "ar" | "en";
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
    labelEn: "Enroll in a Professional Journey",
    points: 50,
    icon: BookOpenCheck,
  },
  {
    key: "professional-completion",
    label: "إكمال رحلة احتراف",
    labelEn: "Complete a Professional Journey",
    points: 20,
    icon: CheckCircle2,
  },
  {
    key: "one-day-enrollment",
    label: "الاشتراك في رحلة اليوم الواحد",
    labelEn: "Enroll in a One-Day Journey",
    points: 20,
    icon: Plane,
  },
  {
    key: "free-view",
    label: "مشاهدة رحلة مجانية",
    labelEn: "Watch a Free Journey",
    points: 5,
    icon: PlayCircle,
  },
] as const;

const interactionPointsRules = [
  {
    key: "survey",
    label: "إكمال التقييم",
    labelEn: "Complete a Review",
    points: 20,
    icon: ClipboardCheck,
  },
  {
    key: "project",
    label: "رفع مشروع",
    labelEn: "Upload a Project",
    points: 50,
    icon: FileUp,
  },
  {
    key: "featured-project",
    label: "مشروع مميز",
    labelEn: "Featured Project",
    points: 20,
    icon: Star,
  },
  {
    key: "referral",
    label: "دعوة صديق",
    labelEn: "Refer a Friend",
    points: 50,
    icon: Users,
  },
] as const;

export default function MasarPassportPanel({
  data,
  locale = "ar",
}: Props) {
  const isArabic = locale === "ar";
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
      <div dir={isArabic ? "rtl" : "ltr"}>
        <JourneyTabs
          ariaLabel={isArabic ? "بطاقات Masar Passport" : "Masar Passport cards"}
          tabs={[
            {
              id: "achievements",
              title:
                isArabic ? "بطاقة إنجازاتك المهنية" : "Professional Achievements Card",
              subtitle:
                isArabic ? "مستواك ونقاطك الحالية" : "Your current level and points",
              badge: `${totalPoints.toLocaleString(
                "en-US",
              )} ${isArabic ? "نقطة" : "points"}`,
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
  locale={locale}
/>
              ),
            },
            {
              id: "rewards",
              title:
                isArabic ? "بطاقة المكافآت" : "Rewards Card",
              subtitle:
                isArabic ? "تقدمك نحو المكافآت" : "Your progress toward rewards",
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
                    locale={locale}
                  />
                </div>
              ),
            },
            {
              id: "points",
              title:
                isArabic ? "طرق زيادة النقاط" : "Ways to Earn More Points",
              subtitle:
                isArabic ? "كيف تجمع نقاطًا أكثر" : "How to earn more points",
              badge: isArabic ? "8 طرق" : "8 Ways",
              content: (
                <div className="[&>section]:rounded-t-none [&>section]:border-t-0">
                  <PointsRulesCard
                    journeyRules={journeyPointsRules.map((rule) => ({
                      ...rule,
                      label: isArabic ? rule.label : rule.labelEn,
                    }))}
                    interactionRules={interactionPointsRules.map((rule) => ({
                      ...rule,
                      label: isArabic ? rule.label : rule.labelEn,
                    }))}
                    JourneyIcon={
                      BookOpenCheck
                    }
                    InteractionIcon={
                      Users
                    }
                    locale={locale}
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
        locale={locale}
      />
    </>
  );
}