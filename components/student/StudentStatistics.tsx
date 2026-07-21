import { Award, GraduationCap } from "lucide-react";

import StatisticGroup from "@/components/student/StatisticGroup";
import type { StudentStatisticsData } from "@/components/student/mockStatistics";

type StudentStatisticsProps = {
  data: StudentStatisticsData;
};

export default function StudentStatistics({ data }: StudentStatisticsProps) {
  return (
    <section className="border-b border-[#DCE2EA] bg-[#F8FAFC] px-3 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px] space-y-6">
        <StatisticGroup
          title="إحصائيات رحلاتي التعليمية"
          icon={GraduationCap}
          items={data.learning}
        />
        <StatisticGroup
          title="إحصائيات الإنجاز"
          icon={Award}
          items={data.achievements}
        />
      </div>
    </section>
  );
}
