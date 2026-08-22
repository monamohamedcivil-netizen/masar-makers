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
        `
          group relative
          min-h-[64px]
          bg-white
          px-2.5 py-2
          transition duration-200
          hover:bg-[#FFFDF8]

          border-b border-[#DCE2EA]
          odd:border-l

          sm:min-h-[72px]
          sm:px-4 sm:py-2.5

          xl:h-[82px]
          xl:min-h-0
          xl:px-5 xl:py-3
          xl:border-b-0
        `,
        !isLast ? "xl:border-l xl:border-[#DCE2EA]" : "",
        isFirst ? "xl:rounded-r-[28px]" : "",
        isLast ? "xl:rounded-l-[28px]" : "",
      ].join(" ")}
    >
      <div className="flex h-full items-center justify-between gap-2 sm:gap-4">
        <div className="min-w-0 flex-1">
          {/* Label */}
          <div className="mb-1 flex items-center gap-1.5 sm:mb-2 sm:gap-3">
            <Icon
              size={18}
              strokeWidth={2}
              className="
                shrink-0 text-[#D88A00]
                sm:h-5 sm:w-5
                xl:h-6 xl:w-6
              "
            />

            <h3
              className="
                line-clamp-2
                text-[9px]
                font-black
                leading-tight
                text-[#07152E]
                sm:text-[10px]
                xl:text-[11px]
              "
            >
              {item.label}
            </h3>
          </div>

          {/* Split value */}
          {item.splitValue ? (
            <div className="grid grid-cols-2 divide-x divide-x-reverse divide-[#DCE2EA]">
              <div className="flex items-baseline justify-center gap-1 px-1">
                <span className="text-[16px] font-black leading-none text-[#D88A00] sm:text-[19px] xl:text-[22px]">
                  {item.splitValue.primaryValue}
                </span>

                <span className="text-[8px] font-bold text-slate-600 sm:text-[9px] xl:text-[10px]">
                  {item.splitValue.primaryLabel}
                </span>
              </div>

              <div className="flex items-baseline justify-center gap-1 px-1">
                <span className="text-[16px] font-black leading-none text-[#D88A00] sm:text-[19px] xl:text-[22px]">
                  {item.splitValue.secondaryValue}
                </span>

                <span className="text-[8px] font-bold text-slate-600 sm:text-[9px] xl:text-[10px]">
                  {item.splitValue.secondaryLabel}
                </span>
              </div>
            </div>
          ) : item.progress !== undefined ? (
            <p className="text-[8px] font-bold leading-tight text-slate-600 sm:text-[9px] xl:text-[10px]">
              نسبة الإنجاز في جميع الرحلات
            </p>
          ) : (
            <div className="flex items-baseline gap-1.5">
              <span className="text-[17px] font-black leading-none text-[#D88A00] sm:text-[19px] xl:text-[22px]">
                {item.value}
              </span>

              {item.secondaryText ? (
                <span className="text-[8px] font-bold leading-tight text-slate-600 sm:text-[9px] xl:text-[10px]">
                  {item.secondaryText}
                </span>
              ) : null}
            </div>
          )}
        </div>

        {/* Circular progress */}
        {item.progress !== undefined ? (
          <div className="scale-[0.72] sm:scale-90 xl:scale-100">
            <CircularProgress
              value={item.progress}
              size={54}
              strokeWidth={6}
            />
          </div>
        ) : null}
      </div>
    </article>
  );
}