import type { LucideIcon } from "lucide-react";

import StatisticCard from "@/components/student/StatisticCard";
import type { StudentStatisticItem } from "@/components/student/mockStatistics";

type StatisticGroupProps = {
  title: string;
  icon: LucideIcon;
  items: StudentStatisticItem[];
};

export default function StatisticGroup({
  title,
  icon: Icon,
  items,
}: StatisticGroupProps) {
  return (
    <section className="w-full">
      {/* Group title */}
      <div className="mb-1 flex items-center gap-1.5 sm:mb-1.5 sm:gap-2">
        <span
          className="
            grid h-6 w-6 shrink-0 place-items-center
            bg-[#07152E] text-[#F7B548]
            sm:h-7 sm:w-7
          "
        >
          <Icon size={14} />
        </span>

        <div>
          <h2
            className="
              text-[11px] font-black text-[#07152E]
              sm:text-[13px]
            "
          >
            {title}
          </h2>

          <span className="mt-0.5 block h-[2px] w-7 bg-[#F7B548] sm:w-8" />
        </div>
      </div>

      {/* Statistics grid */}
      <div
        className="
          grid grid-cols-2
          overflow-hidden
          rounded-[18px]
          border border-[#DCE2EA]
          bg-white
          shadow-[0_6px_18px_rgba(7,21,46,0.05)]

          sm:grid-cols-2
          sm:rounded-[24px]

          xl:grid-cols-4
          xl:rounded-[28px]
        "
      >
        {items.map((item, index) => (
          <StatisticCard
            key={item.id}
            item={item}
            index={index}
            total={items.length}
          />
        ))}
      </div>
    </section>
  );
}