"use client";

import { useEffect, useMemo, useState } from "react";

import LearningModeCard from "@/components/LearningModeCard";
import { learningModeHref, type LearningModeKey } from "@/lib/journeys/flags";
import { useJourneysPagesEnabled } from "@/lib/journeys/use-journeys-pages";
import { useRouter } from "next/navigation";
import JourneyExplorerModal, {
  type JourneyExplorerType,
} from "@/components/journeys/JourneyExplorerModal";

type Locale = "ar" | "en";

const labels = {
  ar: {
    oneDayTitle: "رحلة اليوم الواحد",
    oneDayDescription:
      "محاضرات وورش متخصصة تساعدك على اكتساب مهارة محددة أو حل مشكلة عملية في وقت قصير.",
    oneDayButton: "استكشف الورش",
    oneDayBadge: "الأسرع",

    integratedTitle: "رحلة الاحتراف المتكاملة",
    integratedDescription:
      "ابدأ من الصفر حتى الاحتراف عبر مسارات تدريبية متكاملة تشمل الكورسات والمشاريع والتطبيق العملي.",
    integratedButton: "استكشف الرحلة",
    integratedBadge: "الأكثر طلبًا",

    freeTitle: "الرحلات المجانية",
    freeDescription:
      "استكشف المنصة وتعلم مجانًا من خلال محاضرات مجانية ومحتوى مفتوح لجميع المهندسين.",
    freeButton: "استكشف المجاني",
    freeBadge: "مجاني",
  },
  en: {
    oneDayTitle: "One-Day Journey",
    oneDayDescription:
      "Focused lectures and workshops that help you gain a specific skill or solve a practical problem in a short time.",
    oneDayButton: "Explore Workshops",
    oneDayBadge: "Fastest",

    integratedTitle: "Integrated Professional Journey",
    integratedDescription:
      "Progress from fundamentals to professional practice through complete learning paths, projects, and practical application.",
    integratedButton: "Explore Journey",
    integratedBadge: "Most Popular",

    freeTitle: "Free Journeys",
    freeDescription:
      "Explore the platform and learn through free lectures and open content available to engineers.",
    freeButton: "Explore Free Content",
    freeBadge: "FREE",
  },
} as const;

const MODE_OF: Record<string, LearningModeKey> = { one_day: "one-day", integrated: "professional", free: "free" };

/**
 * pathSlug: opens the journeys page on that path's tab (career path pages).
 * onlyWhenPagesEnabled: hide the cards until the journeys pages are open (preview = admins).
 */
export default function LearningModes({
  pathSlug,
  onlyWhenPagesEnabled = false,
}: { pathSlug?: string | null; onlyWhenPagesEnabled?: boolean } = {}) {
  const router = useRouter();
  const pagesEnabled = useJourneysPagesEnabled();
  const [locale, setLocale] = useState<Locale>("ar");
  const [selectedType, setSelectedType] =
    useState<JourneyExplorerType | null>(null);

  useEffect(() => {
    const savedLocale =
      window.localStorage.getItem("masar-locale");

    if (
      savedLocale === "ar" ||
      savedLocale === "en"
    ) {
      setLocale(savedLocale);
    }

    const handleLocaleChange = (event: Event) => {
      const customEvent =
        event as CustomEvent<{
          locale?: Locale;
        }>;

      if (
        customEvent.detail?.locale === "ar" ||
        customEvent.detail?.locale === "en"
      ) {
        setLocale(customEvent.detail.locale);
      }
    };

    window.addEventListener(
      "masar:locale-change",
      handleLocaleChange,
    );

    return () => {
      window.removeEventListener(
        "masar:locale-change",
        handleLocaleChange,
      );
    };
  }, []);

  const text = labels[locale];

  const journeys = useMemo(
    () => [
      {
        type: "one_day" as const,
        title: text.oneDayTitle,
        description: text.oneDayDescription,
        image: "/images/journeys/oneday.jpg",
        button: text.oneDayButton,
        badgeLabel: text.oneDayBadge,
        color: "blue" as const,
        featured: false,
      },
      {
        type: "integrated" as const,
        title: text.integratedTitle,
        description: text.integratedDescription,
        image: "/images/journeys/professional.jpg",
        button: text.integratedButton,
        badgeLabel: text.integratedBadge,
        color: "gold" as const,
        featured: true,
      },
      {
        type: "free" as const,
        title: text.freeTitle,
        description: text.freeDescription,
        image: "/images/journeys/free.jpg",
        button: text.freeButton,
        badgeLabel: text.freeBadge,
        color: "green" as const,
        featured: false,
      },
    ],
    [text],
  );

  if (onlyWhenPagesEnabled && !pagesEnabled) return null;

  return (
    <>
      <section
        dir={locale === "ar" ? "rtl" : "ltr"}
        className="w-full bg-[#F8FAFC] py-4 sm:py-5 lg:py-6"
      >
        <div className="mx-auto w-full max-w-[800px] px-2 sm:px-4 lg:px-5">
          {/*
            على الموبايل: بطاقات تُسحب أفقيًا بعرض مريح.
            من التابلت وأكبر: ثلاث بطاقات جنبًا إلى جنب.
          */}
          <div className="-mx-2 flex snap-x snap-mandatory items-end gap-3 overflow-x-auto px-[12%] pb-2 pt-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 sm:pt-0 lg:gap-5">
            {journeys.map((journey) => (
              <div
                key={journey.type}
                className="w-[76%] shrink-0 snap-center sm:w-auto sm:shrink"
              >
              <LearningModeCard
                title={journey.title}
                description={journey.description}
                image={journey.image}
                button={journey.button}
                badgeLabel={journey.badgeLabel}
                color={journey.color}
                locale={locale}
                featured={journey.featured}
                onClick={() =>
                  pagesEnabled
                    ? router.push(learningModeHref(MODE_OF[journey.type], pathSlug))
                    : setSelectedType(journey.type)
                }
              />
              </div>
            ))}
          </div>
        </div>
      </section>

      <JourneyExplorerModal
        open={selectedType !== null}
        journeyType={selectedType}
        locale={locale}
        onClose={() => setSelectedType(null)}
      />
    </>
  );
}