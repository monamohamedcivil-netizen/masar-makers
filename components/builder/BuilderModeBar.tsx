"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  GraduationCap,
  Pencil,
  X,
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

/*
 * شريط التبديل بين «الطالب» و«تعديل»:
 * مطوي افتراضيًا على شكل زر صغير على الجانب، ويُفتح عند الضغط عليه،
 * ثم يُطوى تلقائيًا بعد الاختيار أو عند الضغط خارجه.
 */
export default function BuilderModeBar() {
  const {
    mode,
    setMode,
    closeProperties,
  } = useBuilder();

  const [open, setOpen] =
    useState(false);

  const rootRef =
    useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(
      event: PointerEvent,
    ) {
      if (
        rootRef.current &&
        !rootRef.current.contains(
          event.target as Node,
        )
      ) {
        setOpen(false);
      }
    }

    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener(
      "pointerdown",
      handlePointerDown,
    );
    document.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        handlePointerDown,
      );
      document.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [open]);

  const handleModeChange = (
    newMode: BuilderMode
  ) => {
    setMode(newMode);

    if (newMode === "student") {
      closeProperties();
    }

    setOpen(false);
  };

  const CurrentIcon =
    mode === "edit"
      ? Pencil
      : GraduationCap;

  return (
    <div
      ref={rootRef}
      dir="rtl"
      className="
        fixed bottom-5 right-4
        z-[9999]
      "
    >
      {open ? (
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

          <button
            type="button"
            aria-label="إغلاق"
            onClick={() =>
              setOpen(false)
            }
            className="
              flex h-10 w-9 items-center
              justify-center rounded-[12px]
              text-white/60
              transition hover:bg-white/10
              hover:text-white
            "
          >
            <X size={15} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          aria-label="التبديل بين وضع الطالب والتعديل"
          title={
            mode === "edit"
              ? "وضع التعديل"
              : "وضع الطالب"
          }
          onClick={() =>
            setOpen(true)
          }
          className="
            flex h-9 w-9 items-center
            justify-center rounded-full
            border border-white/15
            bg-[#07152E]/70
            text-white/80
            opacity-60
            shadow-[0_6px_18px_rgba(7,21,46,0.25)]
            backdrop-blur-md
            transition-all duration-200
            hover:opacity-100
            hover:bg-[#07152E]
          "
        >
          <CurrentIcon size={15} />
        </button>
      )}
    </div>
  );
}
