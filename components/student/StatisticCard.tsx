import CircularProgress from "@/components/student/CircularProgress";
import type { StudentStatisticItem } from "@/components/student/mockStatistics";

type StatisticCardProps = {
  item: StudentStatisticItem;
  index: number;
  total: number;
};

export default function StatisticCard({
  item,
  index,
  total,
}: StatisticCardProps) {
  const Icon = item.icon;

  const isFirst = index === 0;
  const isLast = index === total - 1;

  return (
    <article
      className={[
        "group relative h-[82px] bg-white px-5 py-3 transition duration-200",
        "hover:bg-[#FFFDF8]",
        !isLast ? "xl:border-l xl:border-[#DCE2EA]" : "",
        "sm:border-b sm:border-[#DCE2EA] xl:border-b-0",
        isFirst ? "xl:rounded-r-[28px]" : "",
        isLast ? "xl:rounded-l-[28px]" : "",
      ].join(" ")}
    >
      <div className="flex h-full items-center justify-between gap-4">
        <div className="min-w-0 flex-1">

          <div className="mb-2 flex items-center gap-3">
            <Icon
              size={24}
              strokeWidth={2}
              className="shrink-0 text-[#D88A00]"
            />

            <h3 className="truncate text-[11px] font-black text-[#07152E]">
              {item.label}
            </h3>
          </div>

          {item.splitValue ? (
            <div className="grid grid-cols-2 divide-x divide-x-reverse divide-[#DCE2EA]">

             <div className="flex translate-x-[-40px] items-baseline gap-2 pl-4">
                <span className="text-[22px] font-black leading-none text-[#D88A00]">
                  {item.splitValue.primaryValue}
                </span>

                <span className="whitespace-nowrap text-[10px] font-bold text-slate-600">
                  {item.splitValue.primaryLabel}
                </span>
              </div>

              <div className="flex items-baseline gap-2 pr-4">
                <span className="text-[22px] font-black leading-none text-[#D88A00]">
                  {item.splitValue.secondaryValue}
                </span>

                <span className="whitespace-nowrap text-[10px] font-bold text-slate-600">
                  {item.splitValue.secondaryLabel}
                </span>
              </div>

            </div>
          ) : item.progress !== undefined ? (

            <p className="text-[10px] font-bold text-slate-600">
              نسبة الإنجاز في جميع الرحلات
            </p>

          ) : (

            <div className="flex translate-x-[-40px] items-baseline gap-2">
              <span className="text-[22px] font-black leading-none text-[#D88A00]">
                {item.value}
              </span>

              {item.secondaryText ? (
                <span className="whitespace-nowrap text-[10px] font-bold text-slate-600">
                  {item.secondaryText}
                </span>
              ) : null}
            </div>

          )}
        </div>

        {item.progress !== undefined ? (
          <CircularProgress
            value={item.progress}
            size={54}
            strokeWidth={6}
          />
        ) : null}
      </div>
    </article>
  );
}