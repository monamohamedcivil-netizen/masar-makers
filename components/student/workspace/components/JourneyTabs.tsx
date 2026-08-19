"use client";

import {
  KeyboardEvent,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type JourneyTabItem = {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  progressPercent?: number;
  statusLabel?: string;
  content: ReactNode;
};

type Props = {
  tabs: JourneyTabItem[];
  ariaLabel: string;
  defaultTabId?: string;
  emptyState?: ReactNode;
  className?: string;
};

export default function JourneyTabs({
  tabs,
  ariaLabel,
  defaultTabId,
  emptyState = null,
  className = "",
}: Props) {
  const initialTabId = defaultTabId ?? tabs[0]?.id ?? null;
  const [activeTabId, setActiveTabId] = useState<string | null>(initialTabId);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    if (!tabs.length) {
      setActiveTabId(null);
      return;
    }

    const activeTabStillExists = tabs.some((tab) => tab.id === activeTabId);

    if (!activeTabStillExists) {
      setActiveTabId(defaultTabId ?? tabs[0].id);
    }
  }, [activeTabId, defaultTabId, tabs]);

  const activeTab = useMemo(
    () => tabs.find((tab) => tab.id === activeTabId) ?? tabs[0],
    [activeTabId, tabs],
  );

  if (!tabs.length || !activeTab) {
    return <>{emptyState}</>;
  }

  function selectTab(index: number) {
    const normalizedIndex = (index + tabs.length) % tabs.length;
    const tab = tabs[normalizedIndex];

    setActiveTabId(tab.id);
    tabRefs.current[normalizedIndex]?.focus();
  }

  function handleTabKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      selectTab(index + 1);
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      selectTab(index - 1);
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      selectTab(0);
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      selectTab(tabs.length - 1);
    }
  }

 return (
  <div className={`${className}`}>
  <div className="relative z-10 px-0">
      <div
        className="flex w-full snap-x snap-mandatory items-end justify-start gap-1 overflow-x-auto [scrollbar-width:thin] [scrollbar-color:#CBD5E1_transparent]"
        role="tablist"
        aria-label={ariaLabel}
        dir="rtl"
      >
        {tabs.map((tab, index) => {
          const isActive = tab.id === activeTab.id;
const isPointsTab = tab.id === "points";
          return (
            <button
              key={tab.id}
              ref={(element) => {
                tabRefs.current[index] = element;
              }}
              id={`journey-tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`journey-panel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActiveTabId(tab.id)}
              onKeyDown={(event) =>
                handleTabKeyDown(event, index)
              }
              className={`group relative min-w-[150px] max-w-[210px] flex-1 snap-start border px-4 translate-y-0 text-right transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F7B548] ${
  isPointsTab
    ? isActive
      ? "z-20 h-[50px] rounded-t-[18px] border-[#F7B548] border-b-[#F7B548] bg-[#F7B548] text-[#07152E] shadow-[0_-5px_18px_rgba(247,181,72,0.22)]"
      : "h-[40px] rounded-t-[14px] border-[#F7B548] border-b-[#E6A52F] bg-[#FFF3D6] text-[#9A6500] hover:h-[50px] hover:bg-[#F7B548] hover:text-[#07152E]"
    : isActive
      ? "z-20 h-[50px] rounded-t-[18px] border-[#07152E] border-b-[#07152E] bg-[#07152E] text-white shadow-[0_-5px_18px_rgba(7,21,46,0.10)]"
      : "h-[40px] rounded-t-[14px] border-[#CBD2DB] border-b-[#D5DAE1] bg-[#E2E5E9] text-[#4B5563] hover:h-[50px] hover:bg-[#D8DDE3] hover:text-[#07152E]"
}`}
            >
              <span className="flex items-center justify-between gap-3">
                <span className="min-w-0">
                  <span
                    className={`block truncate font-black ${
                      isActive
                        ? "text-[13px]"
                        : "text-[11px]"
                    }`}
                  >
                    {tab.title}
                  </span>

                  {tab.subtitle && (
                    <span
                      className={`mt-0 block truncate text-[9px] font-bold ${
                        isActive
                          ? "text-white/70"
                          : "text-[#667085]"
                      }`}
                    >
                      {tab.subtitle}
                    </span>
                  )}
                </span>

                {tab.badge && (
                  <span
                    className={`shrink-0 rounded-full px-1.5 py-1.5 text-[9px] font-black ${
  isPointsTab
    ? isActive
      ? "bg-[#07152E] text-white"
      : "bg-white text-[#C88712]"
    : isActive
      ? "bg-[#F7B548] text-[#07152E]"
      : "bg-[#F4F5F6] text-[#667085]"
}`}
                  >
                    {tab.badge}
                  </span>
                )}
              </span>

              {isActive ? (
                <span className="absolute inset-x-5 bottom-0 h-[3px] bg-[#F7B548]" />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>

    <div
      key={activeTab.id}
      id={`journey-panel-${activeTab.id}`}
      role="tabpanel"
      aria-labelledby={`journey-tab-${activeTab.id}`}
      tabIndex={0}
      className="mt-0 animate-[journeyPanelFade_.22s_ease-out] focus:outline-none"
    >
      {activeTab.content}
    </div>

      <style jsx>{`
        @keyframes journeyPanelFade {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}