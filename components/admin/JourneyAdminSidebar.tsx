"use client";

import {
  BookOpen,
  FileText,
  Gift,
  PlayCircle,
  Settings,
  Star,
  Target,
  Info,
} from "lucide-react";

export type JourneyAdminSection =
  | "info"
  | "modules"
  | "lessons"
  | "resources"
  | "marketing"
  | "outcomes"
  | "reviews"
  | "settings";

type Props = {
  active: JourneyAdminSection;
  onChange: (section: JourneyAdminSection) => void;
};

const groups = [
  {
    title: "معلومات الرحلة",
    items: [
      {
        id: "info",
        label: "بيانات الرحلة",
        icon: Info,
      },
    ],
  },

  {
    title: "المحتوى التعليمي",
    items: [
      {
        id: "modules",
        label: "المحاور",
        icon: BookOpen,
      },
      {
        id: "lessons",
        label: "المحاضرات",
        icon: PlayCircle,
      },
      {
        id: "resources",
        label: "الملفات",
        icon: FileText,
      },
    ],
  },

  {
    title: "التسويق",
    items: [
      {
        id: "marketing",
        label: "الهدايا الدعائية",
        icon: Gift,
      },
      {
        id: "outcomes",
        label: "ماذا سأصل؟",
        icon: Target,
      },
      {
        id: "reviews",
        label: "آراء المتدربين",
        icon: Star,
      },
    ],
  },

  {
    title: "الإعدادات",
    items: [
      {
        id: "settings",
        label: "النشر",
        icon: Settings,
      },
    ],
  },
] as const;

export default function JourneyAdminSidebar({
  active,
  onChange,
}: Props) {
  return (
    <aside className="rounded-[26px] border border-[#DCE2EA] bg-white shadow-sm">

      {groups.map((group) => (
        <div
          key={group.title}
          className="border-b last:border-0"
        >
          <div className="bg-[#07152E] px-4 py-2 text-sm font-black text-white">
            {group.title}
          </div>

          <div className="p-3 space-y-2">
            {group.items.map((item) => {
              const Icon = item.icon;

              const isActive =
                active === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() =>
                    onChange(
                      item.id as JourneyAdminSection
                    )
                  }
                  className={`
                    flex w-full items-center gap-3 rounded-xl px-3 py-3 text-right transition-all

                    ${
                      isActive
                        ? "bg-[#FFF7E3] border border-[#F7B548] text-[#07152E]"
                        : "hover:bg-[#F8FAFC]"
                    }
                  `}
                >
                  <Icon size={18} />

                  <span className="font-black text-sm">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </aside>
  );
}