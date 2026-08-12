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
      <div className="mb-1.5 flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center bg-[#07152E] text-[#F7B548]">
          <Icon size={15} />
        </span>

        <div>
          <h2 className="text-[13px] font-black text-[#07152E]">
            {title}
          </h2>
          <span className="mt-0.5 block h-[2px] w-8 bg-[#F7B548]" />
        </div>
      </div>

      <div className="grid overflow-hidden rounded-[28px] border border-[#DCE2EA] bg-white shadow-[0_10px_30px_rgba(7,21,46,0.06)] sm:grid-cols-2 xl:grid-cols-4">
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