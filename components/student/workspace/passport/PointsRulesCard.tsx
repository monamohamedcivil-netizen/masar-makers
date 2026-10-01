"use client";

import {
  Award,
} from "lucide-react";

interface Rule {
  key: string;
  label: string;
  points: number;
  icon: typeof Award;
}

interface Props {
  journeyRules: readonly Rule[];
  interactionRules: readonly Rule[];
  JourneyIcon: typeof Award;
  InteractionIcon: typeof Award;
  locale?: "ar" | "en";
}

function PointsRulesRow({
  title,
  icon: SectionIcon,
  rules,
  locale,
}: {
  title: string;
  icon: typeof Award;
  rules: readonly Rule[];
  locale: "ar" | "en";
}) {
  const isArabic = locale === "ar";
  return (
    <div className="grid gap-2 lg:grid-cols-[170px_minmax(0,1fr)] lg:items-center">

      <div className="flex items-center gap-2 rounded-xl bg-[#FFF5DD] px-3 py-2 text-[#B8790B]">

        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white">
          <SectionIcon size={16} />
        </span>

        <span className="text-[12px] font-black">
          {title}
        </span>

      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">

        {rules.map((rule) => {
          const Icon = rule.icon;

          return (
            <div
              key={rule.key}
              className="flex min-h-[50px] items-center gap-2 rounded-xl border border-[#E9D39E] bg-white px-3 py-1.5"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FFF5DD] text-[#C88712]">
                <Icon size={14} />
              </span>

              <p className="min-w-0 flex-1 text-[11px] font-black text-[#07152E]">
                {rule.label}

                <span className="mr-1 whitespace-nowrap text-[#C88712]">
                  {rule.points} {isArabic ? "نقطة" : "points"}
                </span>
              </p>

            </div>
          );
        })}

      </div>

    </div>
  );
}

export default function PointsRulesCard({
  journeyRules,
  interactionRules,
  JourneyIcon,
  InteractionIcon,
  locale = "ar",
}: Props) {
  const isArabic = locale === "ar";
  return (
    <section dir={isArabic ? "rtl" : "ltr"} className="rounded-[22px] border border-[#E3C47B] bg-[#FFFDF8] px-4 py-6 shadow-[0_8px_24px_rgba(247,181,72,0.08)] sm:px-5">

      <div className="mb-6 flex items-center justify-center gap-3">

        <span className="h-px w-16 bg-[#F7B548]" />

        <h3 className="text-[17px] font-black text-[#07152E]">
          {isArabic ? "طرق زيادة النقاط" : "Ways to Earn More Points"}
        </h3>

        <span className="h-px w-16 bg-[#F7B548]" />

      </div>

      <PointsRulesRow
        title={isArabic ? "الرحلات وأنواعها" : "Journeys & Types"}
        icon={JourneyIcon}
        rules={journeyRules}
        locale={locale}
      />

      <div className="my-4 border-t border-dashed border-[#E7C77E]" />

      <PointsRulesRow
        title={isArabic ? "التفاعل والمشاركة" : "Engagement & Participation"}
        icon={InteractionIcon}
        rules={interactionRules}
        locale={locale}
      />

    </section>
  );
}