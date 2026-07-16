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
}: {
  items: JourneyItem[];
  activeIndex: number;
  onChange: (index: number) => void;
}) {
  const progress = (activeIndex / (items.length - 1)) * 100;

  return (
    <div className="relative h-[110px] w-full overflow-hidden rounded-[22px]">
      {/* Road base - thinner */}
      <div className="absolute left-6 right-6 top-[39px] h-[26px] rounded-full bg-[#2C3037] shadow-[inset_0_4px_10px_rgba(0,0,0,0.65)]" />

      <div className="absolute left-6 right-6 top-[39px] h-[26px] rounded-full border border-white/25" />

      {/* Gold progress - thinner and shorter */}
      <div
        className="absolute right-6 top-[39px] h-[26px] rounded-full bg-[#F7B548] shadow-[0_0_22px_rgba(247,181,72,0.75)] transition-all duration-700 ease-out"
        style={{
          width: `calc(${progress}% - 40px)`,
          minWidth: activeIndex === 0 ? "0px" : "40px",
        }}
      />

      {/* Dashed line */}
      <div className="absolute left-12 right-12 top-[51px] border-t-2 border-dashed border-white/60" />

      <div
        className="absolute right-12 top-[51px] border-t-2 border-dashed border-white transition-all duration-700 ease-out"
        style={{
          width: `calc(${progress}% - 97px)`,
          minWidth: activeIndex === 0 ? "0px" : "20px",
        }}
      />

      {/* Stations */}
      <div className="absolute left-0 right-0 top-[8px] flex justify-between px-8">
        {items.map((item, index) => {
          const isActive = index === activeIndex;
          const isDone = index < activeIndex;

          return (
            <button
              key={item.title}
              onClick={() => onChange(index)}
              className="group flex w-[108px] flex-col items-center"
            >
              <div
                className={`relative z-20 flex items-center justify-center rounded-full bg-white transition-all duration-500 ${
                  isActive
                    ? "h-[70px] w-[70px] border-[4px] border-[#F7B548] shadow-[0_0_34px_rgba(247,181,72,1)]"
                    : isDone
                    ? "h-[60px] w-[60px] border-[4px] border-[#F7B548] shadow-[0_0_18px_rgba(247,181,72,0.55)]"
                    : "h-[60px] w-[60px] border-[4px] border-white/90 shadow-[0_8px_20px_rgba(0,0,0,0.35)]"
                }`}
              >
                {isActive && (
                  <span className="absolute -inset-3 rounded-full bg-[#F7B548]/25 blur-xl" />
                )}

                <Image
                  src={item.icon}
                  alt={item.title}
                  width={isActive ? 40 : 30}
                  height={isActive ? 40 : 30}
                  className="relative z-10 object-contain"
                />
              </div>

              <span
                className={`mt-2 whitespace-pre-line text-center font-black leading-[15px] ${
                  isActive
                    ? "text-[13px] text-[#F7B548]"
                    : isDone
                    ? "text-[12px] text-white"
                    : "text-[12px] text-slate-300"
                }`}
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