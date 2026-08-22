"use client";

import Image from "next/image";

type JourneyItem = {
  title: string;
  icon: string;
};

export default function RoadJourney({
  items,
  activeIndex,
  onChange,
  direction = "rtl",
}: {
  items: JourneyItem[];
  activeIndex: number;
  onChange: (index: number) => void;
  direction?: "rtl" | "ltr";
}) {
  return (
    <div
      className="
        relative
        h-[96px]
        w-full
        min-w-0
        max-w-full
        overflow-hidden
        rounded-[18px]

        sm:h-[105px]
        sm:rounded-[20px]

        lg:h-[110px]
        lg:rounded-[22px]
      "
    >
      {/* Road base */}
      <div
        className="
          absolute
          left-5
          right-5
          top-[27px]
          h-[16px]
          rounded-full
          bg-[#2C3037]
          shadow-[inset_0_4px_10px_rgba(0,0,0,0.65)]

          sm:left-10
          sm:right-10
          sm:top-[29px]
          sm:h-[18px]

          lg:left-15
          lg:right-15
          lg:top-[30px]
          lg:h-[20px]
        "
      />

      {/* Road border */}
      <div
        className="
          absolute
          left-5
          right-5
          top-[27px]
          h-[16px]
          rounded-full
          border
          border-white/25

          sm:left-10
          sm:right-10
          sm:top-[29px]
          sm:h-[18px]

          lg:left-15
          lg:right-15
          lg:top-[30px]
          lg:h-[20px]
        "
      />

      {/* Dashed center line */}
      <div
        className="
          absolute
          left-6
          right-6
          top-[35px]
          border-t
          border-dashed
          border-white/60

          sm:left-11
          sm:right-11
          sm:top-[38px]
          sm:border-t-2

          lg:left-17
          lg:right-17
          lg:top-[40px]
        "
      />

      {/* Progress line */}
      <div
        className={`
          absolute
          top-[45px]
          border-t
          border-dashed
          border-white
          transition-all
          duration-700
          ease-out

          sm:top-[48px]
          sm:border-t-2

          lg:top-[51px]

          ${
            direction === "rtl"
              ? "right-5 sm:right-10 lg:right-12"
              : "left-5 sm:left-10 lg:left-12"
          }
        `}
      />

      {/* Stations */}
      <div
        className="
          absolute
          inset-x-0
          top-[7px]
          flex
          w-full
          min-w-0
          items-start
          justify-between
          gap-0
          px-1

          sm:top-[8px]
          sm:px-4

          lg:px-8
        "
      >
        {items.map((item, index) => {
          const isActive =
            index === activeIndex;

          const isDone =
            index < activeIndex;

          return (
            <button
              key={item.title}
              type="button"
              onClick={() =>
                onChange(index)
              }
              className="
                group
                flex
                min-w-0
                flex-1
                flex-col
                items-center
                overflow-visible
                px-[1px]

                sm:px-1

                lg:w-[108px]
                lg:flex-none
              "
            >
              <div
                className={`
                  relative
                  z-20
                  flex
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  bg-white
                  transition-all
                  duration-500

                  ${
                    isActive
                      ? `
                        h-[50px]
                        w-[50px]
                        border-[3px]
                        border-[#F7B548]
                        shadow-[0_0_22px_rgba(247,181,72,0.9)]

                        sm:h-[60px]
                        sm:w-[60px]

                        lg:h-[70px]
                        lg:w-[70px]
                        lg:border-[4px]
                        lg:shadow-[0_0_34px_rgba(247,181,72,1)]
                      `
                      : isDone
                        ? `
                          h-[44px]
                          w-[44px]
                          border-[3px]
                          border-[#F7B548]
                          shadow-[0_0_14px_rgba(247,181,72,0.45)]

                          sm:h-[52px]
                          sm:w-[52px]

                          lg:h-[60px]
                          lg:w-[60px]
                          lg:border-[4px]
                          lg:shadow-[0_0_18px_rgba(247,181,72,0.55)]
                        `
                        : `
                          h-[44px]
                          w-[44px]
                          border-[3px]
                          border-white/90
                          shadow-[0_6px_14px_rgba(0,0,0,0.3)]

                          sm:h-[52px]
                          sm:w-[52px]

                          lg:h-[60px]
                          lg:w-[60px]
                          lg:border-[4px]
                          lg:shadow-[0_8px_20px_rgba(0,0,0,0.35)]
                        `
                  }
                `}
              >
                {isActive && (
                  <span
                    className="
                      absolute
                      -inset-2
                      rounded-full
                      bg-[#F7B548]/25
                      blur-lg

                      lg:-inset-3
                      lg:blur-xl
                    "
                  />
                )}

                <Image
                  src={item.icon}
                  alt={item.title}
                  width={
                    isActive ? 40 : 30
                  }
                  height={
                    isActive ? 40 : 30
                  }
                  className={`
                    relative
                    z-10
                    object-contain

                    ${
                      isActive
                        ? "h-[28px] w-[28px] sm:h-[34px] sm:w-[34px] lg:h-[40px] lg:w-[40px]"
                        : "h-[23px] w-[23px] sm:h-[27px] sm:w-[27px] lg:h-[30px] lg:w-[30px]"
                    }
                  `}
                />
              </div>

              <span
                className={`
                  mt-1.5
                  block
                  w-full
                  min-w-0
                  whitespace-pre-line
                  break-words
                  text-center
                  font-black
                  leading-[11px]

                  sm:mt-2
                  sm:leading-[13px]

                  lg:leading-[15px]

                  ${
                    isActive
                      ? "text-[9px] text-[#F7B548] sm:text-[11px] lg:text-[13px]"
                      : isDone
                        ? "text-[8px] text-white sm:text-[10px] lg:text-[12px]"
                        : "text-[8px] text-slate-300 sm:text-[10px] lg:text-[12px]"
                  }
                `}
              >
                {item.title}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}