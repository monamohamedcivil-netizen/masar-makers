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
    <section>
      <div className="mb-3 flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center bg-[#07152E] text-[#F7B548]">
          <Icon size={18} />
        </span>
        <div>
          <h2 className="text-[16px] font-black text-[#07152E]">{title}</h2>
          <span className="mt-1 block h-[2px] w-10 bg-[#F7B548]" />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <StatisticCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
