"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2, PlayCircle } from "lucide-react";

import CourseJourneyLessonsPanel from "@/components/course/CourseJourneyLessonsPanel";
import ProfessionalPanelViewer from "@/components/course/ProfessionalPanelViewer";
import SuccessStoriesPanel from "@/components/course/SuccessStoriesPanel";
import {
  createInitialProfessionalPanel,
  normalizeProfessionalPanel,
} from "@/components/course/editor";
import {
  getStationSections,
  type PublicSectionItem,
  type StationSectionsData,
} from "@/lib/actions/station-sections";

/* أقسام المحطة الخمسة تحت كارت المحطة في «رحلة الاحتراف المتكاملة»،
   ومحتوى كل قسم هو نفسه محتوى التبويب المقابل في صفحة الكورس. */

type SectionKey = "professional" | "outcome" | "gifts" | "free" | "reviews";

const SECTIONS: Array<{ key: SectionKey; label: string }> = [
  { key: "professional", label: "محاور الرحلة" },
  { key: "outcome", label: "نتائج الرحلة" },
  { key: "gifts", label: "هدايا الرحلة" },
  { key: "free", label: "المحاضرة الأولى" },
  { key: "reviews", label: "مشاريع المتدربين" },
];

function YoutubeCard({ item }: { item: PublicSectionItem }) {
  const [playing, setPlaying] = useState(false);
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-black">
      <div className="relative aspect-video">
        {playing ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${item.youtubeId}?autoplay=1&rel=0`}
            title={item.title || "فيديو"}
            allow="accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        ) : (
          <button type="button" onClick={() => setPlaying(true)} className="group absolute inset-0 w-full" aria-label="تشغيل الفيديو">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`https://i.ytimg.com/vi/${item.youtubeId}/hqdefault.jpg`} alt={item.title} loading="lazy" className="h-full w-full object-cover opacity-90 transition group-hover:opacity-100" />
            <PlayCircle className="absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 text-white drop-shadow-lg" />
          </button>
        )}
      </div>
      {item.title ? (
        <p className="bg-white px-3 py-2 text-sm font-black text-[#07152E]" dir="auto">
          {item.title}
        </p>
      ) : null}
    </div>
  );
}

function SectionItems({ items }: { items: PublicSectionItem[] }) {
  if (!items.length) return null;
  return (
    <div className="grid gap-3 p-3 sm:grid-cols-2">
      {items.map((item) =>
        item.kind === "youtube" ? (
          <YoutubeCard key={item.id} item={item} />
        ) : (
          <a key={item.id} href={item.href ?? "/dashboard"} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:shadow-md">
            <PlayCircle className="h-8 w-8 shrink-0 text-[#2463C7]" />
            <span className="min-w-0">
              <span className="block text-sm font-black text-[#07152E]" dir="auto">{item.title}</span>
              {item.courseCode ? <span className="text-xs font-bold text-slate-500">{item.courseCode}</span> : null}
            </span>
          </a>
        ),
      )}
    </div>
  );
}

export default function StationSections({
  stationId,
  stationSlug,
  accent,
  soft,
}: {
  stationId: string;
  stationSlug: string;
  accent: string;
  soft: string;
}) {
  const [open, setOpen] = useState<SectionKey | null>(null);
  const [cache, setCache] = useState<Record<string, StationSectionsData>>({});
  const [failed, setFailed] = useState(false);
  const [, startTransition] = useTransition();

  // عند تغيير المحطة نقفل القسم المفتوح.
  useEffect(() => {
    setOpen(null);
    setFailed(false);
  }, [stationId]);

  const needsData = open !== null;
  const data = cache[stationId];

  useEffect(() => {
    if (!needsData || cache[stationId]) return;
    setFailed(false);
    startTransition(async () => {
      try {
        const result = await getStationSections(stationId);
        setCache((prev) => ({ ...prev, [stationId]: result }));
      } catch {
        setFailed(true);
      }
    });
  }, [needsData, stationId, cache]);

  const itemsFor = open && data ? data.items.filter((i) => i.sectionKey === open) : [];

  const renderBase = () => {
    if (!open) return null;

    if (open === "free") {
      return (
        <CourseJourneyLessonsPanel
          key={`${stationId}-free`}
          stationId={stationId}
          kind="free"
        />
      );
    }

    if (failed) {
      return <p className="p-6 text-center text-sm font-bold text-slate-500">تعذر تحميل المحتوى، حاول مرة أخرى.</p>;
    }

    if (!data) {
      return (
        <p className="flex items-center justify-center gap-2 p-6 text-sm font-bold text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          جاري التحميل...
        </p>
      );
    }

    const stored = data.panels[open];
    const value = stored ? normalizeProfessionalPanel(stored) : createInitialProfessionalPanel();

    if (open === "reviews" && value.blocks.length === 0) {
      return <SuccessStoriesPanel reviews={data.reviews} projects={data.projects} />;
    }

    if (value.blocks.length === 0) {
      if (itemsFor.length) return null;
      return <p className="p-6 text-center text-sm font-bold text-slate-500">المحتوى قريبًا.</p>;
    }

    return (
      <ProfessionalPanelViewer
        key={`${stationId}-${open}`}
        stationId={stationId}
        courseId={stationSlug}
        panelComponent={open}
        value={value}
      />
    );
  };

  const renderContent = () => (
    <>
      <SectionItems items={itemsFor} />
      {renderBase()}
    </>
  );

  return (
    <div className="mt-5 border-t border-slate-200 pt-4">
      <div role="tablist" className="flex flex-wrap gap-2">
        {SECTIONS.map((section) => {
          const active = open === section.key;
          return (
            <button
              key={section.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setOpen(active ? null : section.key)}
              className="rounded-xl border px-3.5 py-2 text-xs font-black text-[#07152E] transition hover:brightness-95 sm:text-sm"
              style={{
                borderColor: `${accent}88`,
                background: active ? accent : soft,
              }}
            >
              {section.label}
            </button>
          );
        })}
      </div>

      {open ? (
        <div
          role="tabpanel"
          className="relative mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-[#F7F8FA]"
        >
          {renderContent()}
        </div>
      ) : null}
    </div>
  );
}
