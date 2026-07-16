"use client";

import {
  GraduationCap,
  Pencil,
} from "lucide-react";

import {
  useBuilder,
  type BuilderMode,
} from "./BuilderProvider";

const modeItems: Array<{
  id: BuilderMode;
  title: string;
  icon: typeof Pencil;
}> = [
  {
    id: "student",
    title: "الطالب",
    icon: GraduationCap,
  },
  {
    id: "edit",
    title: "تعديل",
    icon: Pencil,
  },
];

export default function BuilderModeBar() {
  const {
    mode,
    setMode,
    closeProperties,
  } = useBuilder();

  const handleModeChange = (
    newMode: BuilderMode
  ) => {
    setMode(newMode);

    if (newMode === "student") {
      closeProperties();
    }
  };

  return (
    <div
      dir="rtl"
      className="
        fixed bottom-5 left-1/2
        z-[9999]
        -translate-x-1/2
      "
    >
      <div
        className="
          flex items-center gap-1
          rounded-[18px]
          border border-white/10
          bg-[#07152E]
          p-1.5
          shadow-[0_18px_50px_rgba(7,21,46,0.30)]
          backdrop-blur-xl
        "
      >
        {modeItems.map((item) => {
          const Icon = item.icon;

          const isActive =
            mode === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() =>
                handleModeChange(
                  item.id
                )
              }
              className={`
                flex h-10 items-center
                justify-center gap-2
                rounded-[12px]
                px-5 text-[12px]
                font-black
                transition-all duration-200

                ${
                  isActive
                    ? `
                      bg-[#F7B548]
                      text-[#07152E]
                      shadow-[0_8px_18px_rgba(247,181,72,0.25)]
                    `
                    : `
                      text-white/70
                      hover:bg-white/10
                      hover:text-white
                    `
                }
              `}
            >
              <Icon size={16} />

              {item.title}
            </button>
          );
        })}
      </div>
    </div>
  );
}