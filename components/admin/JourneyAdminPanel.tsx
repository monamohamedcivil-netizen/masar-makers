"use client";

import {
  useEffect,
  useState,
} from "react";

import JourneyAdminShell from "./JourneyAdminShell";
import JourneyAdminSidebar, {
  JourneyAdminSection,
} from "./JourneyAdminSidebar";

import ModulesManager from "./ModulesManager";
import LessonsManager from "./LessonsManager";
import ResourcesManager from "./ResourcesManager";
import MarketingManager from "./MarketingManager";
import OutcomesManager from "./OutcomesManager";
import ReviewsManager from "./ReviewsManager";

type Props = {
  journeyTitle: string;
};

export default function JourneyAdminPanel({
  journeyTitle,
}: Props) {
  const [active, setActive] =
    useState<JourneyAdminSection>("info");

  const [displayed, setDisplayed] =
    useState<JourneyAdminSection>("info");

  const [visible, setVisible] =
    useState(true);

  useEffect(() => {
    if (active === displayed) return;

    setVisible(false);

    const timer = window.setTimeout(() => {
      setDisplayed(active);

      requestAnimationFrame(() => {
        setVisible(true);
      });

    }, 180);

    return () => clearTimeout(timer);

  }, [active, displayed]);

  return (

    <div
      className="
        grid gap-6
        lg:grid-cols-[280px_minmax(0,1fr)]
      "
    >

      <JourneyAdminSidebar
        active={active}
        onChange={setActive}
      />

      <JourneyAdminShell
        title={journeyTitle}
      >

        <div
          className={`
            transition-all duration-200

            ${
              visible
                ? "translate-y-0 opacity-100"
                : "translate-y-2 opacity-0"
            }
          `}
        >

          {displayed === "info" && (
            <div className="space-y-4">

              <h2 className="text-2xl font-black">
                بيانات الرحلة
              </h2>

              <p className="text-slate-500">
                سيتم هنا تعديل اسم الرحلة
                والوصف والصورة والحالة.
              </p>

            </div>
          )}

          {displayed === "modules" && (
            <ModulesManager />
          )}

          {displayed === "lessons" && (
            <LessonsManager />
          )}

          {displayed === "resources" && (
            <ResourcesManager />
          )}

          {displayed === "marketing" && (
            <MarketingManager />
          )}

          {displayed === "outcomes" && (
            <OutcomesManager />
          )}

          {displayed === "reviews" && (
            <ReviewsManager />
          )}

          {displayed === "settings" && (

            <div className="space-y-4">

              <h2 className="text-2xl font-black">
                النشر والإعدادات
              </h2>

            </div>

          )}

        </div>

      </JourneyAdminShell>

    </div>

  );
}