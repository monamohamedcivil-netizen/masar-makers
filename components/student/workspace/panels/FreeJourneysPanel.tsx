"use client";

import Link from "next/link";
import { PlayCircle, Sparkles } from "lucide-react";

import type {
  StudentFreeJourney,
  StudentFreeJourneyGroup,
} from "@/lib/queries/student-dashboard";

type Props = { groups: StudentFreeJourneyGroup[] };

export default function FreeJourneysPanel({ groups }: Props) {
  if (!groups.length) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
        <span className="flex h-18 w-18 items-center justify-center rounded-full bg-[#EAF7F1] text-[#14835F]">
          <Sparkles size={31} />
        </span>
        <h3 className="mt-4 text-xl font-black text-[#07152E]">لا توجد رحلات مجانية بعد</h3>
        <p className="mt-2 max-w-sm text-sm font-semibold text-slate-500">ستظهر هنا الرحلات المجانية التي بدأتِها.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <section key={group.id} className="overflow-hidden rounded-[22px] border border-[#DCE2EA] bg-white shadow-[0_12px_32px_rgba(7,21,46,0.07)]">
          <header className="flex items-center justify-between border-b border-[#E5EAF0] bg-[#F7F9FC] px-5 py-3">
            <h3 className="text-[15px] font-black text-[#07152E]">{group.title}</h3>
            <span className="rounded-full bg-[#EAF7F1] px-3 py-1 text-[10px] font-black text-[#14835F]">{group.journeys.length} محاضرات</span>
          </header>
          <div className="divide-y divide-[#E5EAF0]">
            {group.journeys.map((journey) => {
              const actionLabel = journey.status === "completed" ? "شاهد مرة أخرى" : journey.progressPercent > 0 ? "استكمل الرحلة" : "ابدأ الرحلة";
              return (
                <div key={journey.enrollmentId} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-3 sm:grid-cols-[180px_minmax(0,1fr)_150px]">
                  <div className="hidden text-sm font-black text-[#07152E] sm:block">{group.title}</div>
                  <div className="min-w-0"><p className="truncate text-sm font-black text-[#07152E]">{journey.title}</p></div>
                  <Link href={journey.href} className="inline-flex h-10 items-center justify-center gap-2 rounded-[12px] bg-[#14835F] px-4 text-[11px] font-black text-white transition hover:-translate-y-0.5 hover:bg-[#0F6E4F]">
                    {actionLabel}<PlayCircle size={15} />
                  </Link>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}