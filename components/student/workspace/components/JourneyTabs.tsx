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
    <div className={`space-y-2 ${className}`}>
      <div className="relative">
        <div
          className="flex snap-x snap-mandatory gap-1.5 overflow-x-auto border-b border-[#DCE2EA] px-0.5 pb-1 [scrollbar-width:thin] [scrollbar-color:#CBD5E1_transparent]"
          role="tablist"
          aria-label={ariaLabel}
          dir="rtl"
        >
          {tabs.map((tab, index) => {
            const isActive = tab.id === activeTab.id;

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
                onKeyDown={(event) => handleTabKeyDown(event, index)}
                className={`group relative min-w-[125px] max-w-[170px] flex-1 snap-start overflow-hidden rounded-[14px] border px-3 py-2 text-right transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F7B548] focus-visible:ring-offset-2 sm:min-w-[140px] ${
                  isActive
                    ? "border-[#07152E] bg-[#07152E] text-white shadow-[0_7px_18px_rgba(7,21,46,0.14)]"
                    : "border-[#DCE2EA] bg-white text-[#07152E] hover:-translate-y-0.5 hover:border-[#F7B548] hover:bg-[#FFFDF8] hover:shadow-[0_6px_16px_rgba(7,21,46,0.07)]"
                }`}
              >
                <span
                  className={`absolute inset-y-0 right-0 w-1 transition-colors ${
                    isActive ? "bg-[#F7B548]" : "bg-transparent"
                  }`}
                />

                <span className="flex items-start justify-between gap-2">
                  <span className="min-w-0">
                    <span className="block truncate text-[11px] font-black sm:text-xs">
                      {tab.title}
                    </span>

                    {tab.subtitle && (
                      <span
                        className={`mt-1 block truncate text-[9px] font-bold sm:text-[10px] ${
                          isActive ? "text-white/70" : "text-slate-500"
                        }`}
                      >
                        {tab.subtitle}
                      </span>
                    )}
                  </span>

                  {tab.badge && (
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-black ${
                        isActive
                          ? "bg-[#F7B548] text-[#07152E]"
                          : "bg-[#FFF4DF] text-[#A76700]"
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </span>

                <span
                  className={`absolute inset-x-4 bottom-0 h-[2px] rounded-t-full transition-colors ${
                    isActive ? "bg-[#F7B548]" : "bg-transparent"
                  }`}
                />
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
        className="animate-[journeyPanelFade_.22s_ease-out] focus:outline-none"
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
