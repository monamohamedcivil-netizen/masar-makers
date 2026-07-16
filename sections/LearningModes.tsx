"use client";

import LearningModeCard from "@/components/LearningModeCard";
import AuthLink from "@/components/AuthLink";

const journeys = [
  {
    title: "رحلة اليوم الواحد",
    description:
      "محاضرات وورش متخصصة تساعدك على اكتساب مهارة محددة أو حل مشكلة عملية في وقت قصير.",
    image: "/images/journeys/oneday.jpg",
    button: "استكشف الورش",
    color: "blue" as const,
    featured: false,
  },
  {
    title: "رحلة الاحتراف المتكاملة",
    description:
      "ابدأ من الصفر حتى الاحتراف عبر مسارات تدريبية متكاملة تشمل الكورسات والمشاريع والتطبيق العملي.",
    image: "/images/journeys/professional.jpg",
    button: "استكشف المسارات",
    color: "gold" as const,
    featured: true,
  },
  {
    title: "الرحلات المجانية",
    description:
      "استكشف المنصة وتعلم مجانًا من خلال محاضرات مجانية ومحتوى مفتوح لجميع المهندسين.",
    image: "/images/journeys/free.jpg",
    button: "ابدأ مجانًا",
    color: "green" as const,
    featured: false,
  },
];

export default function LearningModes() {
  return (
  <section className="w-full bg-[#F8FAFC] py-10">
    <div className="mx-auto max-w-[1540px] px-8">
      <div className="grid items-end gap-5 lg:grid-cols-[0.92fr_1.16fr_0.92fr]">
        {journeys.map((journey) => (
          <LearningModeCard
            key={journey.title}
            {...journey}
            onClick={() =>
              alert(
                "سيتم ربط هذه البطاقة بتسجيل الدخول في المرحلة القادمة."
              )
            }
          />
        ))}
      </div>
    </div>
  </section>
);
}