import CircularProgress from "@/components/student/CircularProgress";
import type { StudentStatisticItem } from "@/components/student/mockStatistics";

type StatisticCardProps = {
  item: StudentStatisticItem;
};

export default function StatisticCard({ item }: StatisticCardProps) {
  const Icon = item.icon;

  return (
    <article className="group relative min-h-[128px] overflow-hidden border border-[#DCE2EA] bg-white px-4 py-4 shadow-[0_8px_24px_rgba(7,21,46,0.055)] transition duration-200 hover:-translate-y-1 hover:border-[#F7B548]/80 hover:shadow-[0_14px_34px_rgba(7,21,46,0.10)]">
      <div className="absolute inset-x-0 top-0 h-[3px] origin-right scale-x-0 bg-[#F7B548] transition-transform duration-200 group-hover:scale-x-100" />

      <div className="flex h-full items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex items-center gap-2">
            <span className="grid h-9 w-9 shrink-0 place-items-center border border-[#F7B548]/35 bg-[#FFF8E9] text-[#B87508]">
              <Icon size={17} />
            </span>
            <h3 className="text-[12px] font-black text-[#07152E]">
              {item.label}
            </h3>
          </div>

          {item.splitValue ? (
            <div className="grid grid-cols-2 divide-x divide-x-reverse divide-slate-200">
              <div className="pl-3">
                <p className="text-[24px] font-black leading-none text-[#07152E]">
                  {item.splitValue.primaryValue}
                </p>
                <p className="mt-2 text-[10px] font-bold text-slate-500">
                  {item.splitValue.primaryLabel}
                </p>
              </div>
              <div className="pr-3">
                <p className="text-[24px] font-black leading-none text-[#07152E]">
                  {item.splitValue.secondaryValue}
                </p>
                <p className="mt-2 text-[10px] font-bold text-slate-500">
                  {item.splitValue.secondaryLabel}
                </p>
              </div>
            </div>
          ) : item.progress !== undefined ? (
            <p className="text-[10px] font-bold text-slate-500">
              نسبة الإنجاز في جميع الرحلات
            </p>
          ) : (
            <div>
              <p className="text-[28px] font-black leading-none text-[#07152E]">
                {item.value}
              </p>
              {item.secondaryText ? (
                <p className="mt-2 text-[10px] font-bold text-slate-500">
                  {item.secondaryText}
                </p>
              ) : null}
            </div>
          )}
        </div>

        {item.progress !== undefined ? (
          <CircularProgress value={item.progress} size={70} strokeWidth={7} />
        ) : null}
      </div>
    </article>
  );
}
