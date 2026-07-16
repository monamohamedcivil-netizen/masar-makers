"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  CalendarDays,
  Gift,
  MessageSquareQuote,
  PlayCircle,
  Rocket,
  Target,
} from "lucide-react";

import CourseDynamicPanel from "./CourseDynamicPanel";

import type {
  Course,
  CoursePanelTab,
  FreeSession,
  Review,
  Workshop,
} from "@/data/types";

import type { CatalogCoursePanelItem } from "@/lib/queries/catalog";
const panelIconMap = {
  "play-circle": PlayCircle,
  "calendar-days": CalendarDays,
  rocket: Rocket,
  target: Target,
  gift: Gift,
  "message-square-quote": MessageSquareQuote,
} as const;
type CourseInteractiveDashboardProps = {
   mode?: "student" | "admin";

  course: Course;
  freeSessions: FreeSession[];
  workshops: Workshop[];
  reviews: Review[];

  learningModes: CatalogCoursePanelItem[];
  resultTabs: CatalogCoursePanelItem[];
};


export default function CourseInteractiveDashboard({
  mode = "student",
  course,
  freeSessions,
  workshops,
  reviews,
  learningModes,
  resultTabs,
}: CourseInteractiveDashboardProps)
  
  {
  const [activePanel, setActivePanel] =
    useState<CoursePanelTab>("professional");

  const [displayedPanel, setDisplayedPanel] =
    useState<CoursePanelTab>("professional");

  const [panelVisible, setPanelVisible] =
    useState(true);
const mappedLearningItems = learningModes.map(
  (item) => ({
    id:
      item.panel_component as CoursePanelTab,
    title: item.title,
    icon:
      panelIconMap[
        item.icon as keyof typeof panelIconMap
      ] ?? PlayCircle,
  })
);

const mappedResultItems = resultTabs.map(
  (item) => ({
    id:
      item.panel_component as CoursePanelTab,
    title: item.title,
    icon:
      panelIconMap[
        item.icon as keyof typeof panelIconMap
      ] ?? Target,
  })
);

useEffect(() => {
  if (activePanel === displayedPanel) {
    return;
  }

  setPanelVisible(false);

  const timer = window.setTimeout(() => {
    setDisplayedPanel(activePanel);

    window.requestAnimationFrame(() => {
      setPanelVisible(true);
    });
  }, 160);

  return () => {
    window.clearTimeout(timer);
  };
}, [activePanel, displayedPanel]);

  return (
    <section
      dir="rtl"
      className="
        bg-[#F7F8FA]
        px-4 pb-12 pt-7
        sm:px-6
      "
    >
      <div className="mx-auto max-w-[1580px]">
        <div
          className="
            relative flex flex-col
            items-stretch gap-4

            lg:flex-row
            lg:items-start
            lg:gap-0
          "
        >
          {/* اليمين: أدوات اختيار طريقة التعلم */}
          <div
            className="
              order-1 w-full

              lg:relative
              lg:z-10
              lg:mt-[76px]
              lg:w-[205px]
              lg:shrink-0

              xl:w-[220px]
            "
          >
            <SideMenu
              title="اختر طريقة التعلم"
              items={mappedLearningItems}
              activePanel={activePanel}
              onChange={setActivePanel}
            />
          </div>

          {/* المنتصف: الشاشة الرئيسية */}
          <div
            className="
              order-3 w-full min-w-0

              lg:order-2
              lg:relative
              lg:z-20
              lg:-mx-1
              lg:flex-1
            "
          >
            <CourseDynamicPanel
              activePanel={displayedPanel}
              course={course}
              freeSessions={freeSessions}
              workshops={workshops}
              reviews={reviews}
              panelVisible={panelVisible}
            />
          </div>

          {/* اليسار: نتائج الرحلة */}
          <div
            className="
              order-2 w-full

              lg:order-3
              lg:relative
              lg:z-10
              lg:mt-[76px]
              lg:w-[205px]
              lg:shrink-0

              xl:w-[220px]
            "
          >
            <SideMenu
              title="نتائج الرحلة"
              items={mappedResultItems}
              activePanel={activePanel}
              onChange={setActivePanel}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ==================================================
   Side Menu
================================================== */

type SideMenuProps = {
  title: string;

  items: Array<{
    id: CoursePanelTab;
    title: string;
    icon: typeof Target;
    
  }>;

  activePanel: CoursePanelTab;

  onChange: (
    panel: CoursePanelTab
  ) => void;
};

function SideMenu({
  title,
  items,
  activePanel,
  onChange,
}: SideMenuProps) {
  return (
    <aside className="relative w-full">
      {/* عنوان مجموعة التحكم */}
      <div
        className="
          flex min-h-[56px]
          items-center justify-center
          px-2 text-center
        "
      >
        <h2
          className="
            relative px-2 pb-1
            text-[20px] font-black
            text-[#B87508]
            drop-shadow-[0_2px_2px_rgba(7,21,46,0.14)]
            xl:text-[22px]
          "
        >
          {title}

          <span
            className="
              absolute bottom-0 left-1/2
              h-[2px] w-10
              -translate-x-1/2
              bg-[#F7B548]
            "
          />
        </h2>
      </div>

      {/* أزرار التحكم */}
      <div
        className="
          overflow-hidden
          border border-[#DCE2EA]
          bg-white
          shadow-[0_10px_28px_rgba(7,21,46,0.07)]
        "
      >
        {items.map((item) => {
          const Icon = item.icon;

          const isActive =
            activePanel === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() =>
                onChange(item.id)
              }
              aria-pressed={isActive}
              className={`
                group relative flex
                min-h-[60px] w-full
                items-center gap-3
                border-b-3 px-4
                text-right
                transition-all duration-200
                last:border-b-0

                ${
                  isActive
                    ? `
                      border-[#07152E]
                      bg-[#07152E]
                      text-[#F7B548]
                    `
                    : `
                      border-[#F1F3F6] 
                      bg-[#E0E5EC]
                      text-[#59606B]
                      hover:bg-white
                      hover:text-[#07152E]
                    `
                }
              `}
            >
              <span
                className={`
                  flex h-7 w-7 shrink-0
                  items-center justify-center
                  rounded-full
                  transition duration-200

                  ${
                    isActive
                      ? `
                        bg-[#F7B548]
                        text-[#07152E]
                      `
                      : `
                        
                        text-[#747B86]
                        group-hover:bg-[#FFF4D8]
                        group-hover:text-[#B87508]
                      `
                  }
                `}
              >
                <Icon size={18} />
              </span>

              <span
                className="
                  min-w-0 flex-1
                  text-[13px] font-black
                  leading-5
                  xl:text-[14px]
                "
              >
                {item.title}
              </span>

              {isActive && (
                <span
                  className="
                    absolute bottom-0 right-0
                    h-[3px] w-full
                    bg-[#F7B548]
                  "
                />
              )}
            </button>
          );
        })}
      </div>
    </aside>
  );
}