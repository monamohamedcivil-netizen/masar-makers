"use client";

import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Gift, PlayCircle, Rocket, Search, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import CourseActionButton from "@/components/course/CourseActionButton";
import { openOffersScreen } from "@/components/offers/useOffers";
import type { EnrollmentStatus } from "@/lib/actions/enroll";
import { courseIcon } from "@/lib/journeys/course-icons";
import type { ProfessionalPath, ProfessionalStation } from "@/lib/journeys/professional-stations";
import type { LecturePath, SearchTerm, TopicLecture } from "@/lib/journeys/topic-lectures";

/* =========================================================
   صفحات طرق التعلم بشكل «مسار طريق»:
   محطات على طريق، والضغط على محطة يعرض محتواها تحتها.
   - اليوم الواحد (أزرق) والمجانية (أخضر): المحطة = قسم، والمحتوى = محاضراته.
   - الاحتراف المتكامل (ذهبي هادي): المحطة = كورس، والمحتوى = مستويات الرحلة.
========================================================= */

type Kind = "workshop" | "free" | "professional";

const THEME = {
  workshop: { accent: "#3B82E6", soft: "#EAF2FE", ring: "ring-[#3B82E6]", thin: "ring-1 ring-[#3B82E6]/70 hover:ring-2 hover:ring-[#3B82E6]/60", tab: "bg-gradient-to-r from-[#2867C7] to-[#123C7A] text-white shadow-[0_6px_16px_rgba(18,60,122,.35)]", text: "text-[#2463C7]", bg: "bg-[#3B82E6]", title: "رحلات اليوم الواحد", subtitle: "محاضرة واحدة مركّزة في موضوع محدد، مرتبة حسب خطوات تصميم المشروع. اختار المحطة اللي محتاجها وابدأ.", action: "اشترك الآن", icon: Rocket },
  free: { accent: "#2FA36B", soft: "#E8F6EF", ring: "ring-[#2FA36B]", thin: "ring-1 ring-[#2FA36B]/70 hover:ring-2 hover:ring-[#2FA36B]/60", tab: "bg-gradient-to-r from-[#55C766] to-[#2E8547] text-white shadow-[0_6px_16px_rgba(46,133,71,.35)]", text: "text-[#1F8455]", bg: "bg-[#2FA36B]", title: "الرحلات المجانية", subtitle: "ابدأ مجانًا واتعرف على أسلوب التعلم في صناع المسار. المحاضرات مرتبة حسب خطوات تصميم المشروع.", action: "شاهد الآن", icon: PlayCircle },
  professional: { accent: "#D4A24C", soft: "#FBF3E2", ring: "ring-[#D4A24C]", thin: "ring-1 ring-[#F7B548] hover:ring-2 hover:ring-[#F7B548]/55", tab: "bg-gradient-to-r from-[#F7B548] to-[#D99B22] text-[#07152E] shadow-[0_6px_16px_rgba(217,155,34,.35)]", text: "text-[#A9761F]", bg: "bg-[#D4A24C]", title: "رحلات الاحتراف المتكاملة", subtitle: "رحلة متدرجة لكل برنامج، من الأساسيات حتى المخرجات الاحترافية، على مشروع حقيقي. اختار محطتك.", action: "", icon: CalendarDays },
} as const;

type Station = { key: string; title: string; iconCode?: string; comingSoon?: boolean; count?: number };

function CourseLogo({ code, size = 28 }: { code: string; size?: number }) {
  const src = courseIcon(code);
  if (!src) return <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-[#07152E]">{code}</span>;
  return (
    <span className="relative inline-block shrink-0 overflow-hidden rounded-lg bg-white" style={{ width: size, height: size }}>
      <Image src={src} alt={code} fill sizes={`${size}px`} className="object-contain p-0.5" />
    </span>
  );
}

function Road({
  stations,
  active,
  onSelect,
  kind,
}: {
  stations: Station[];
  active: string;
  onSelect: (key: string) => void;
  kind: Kind;
}) {
  const theme = THEME[kind];
  return (
    <div className="relative mx-auto max-w-6xl overflow-x-auto px-2 pb-2 [scrollbar-width:thin]">
      <div className="relative min-w-[720px] px-6 pt-2 sm:min-w-0">
        {/* الطريق */}
        <div className="absolute inset-x-6 top-[52px] h-[18px] rounded-full bg-[#1B2A44] shadow-[inset_0_2px_4px_rgba(0,0,0,.35)]">
          <div className="absolute inset-x-3 top-1/2 h-0 -translate-y-1/2 border-t-2 border-dashed border-[#F7B548]/80" />
        </div>
        <ol className="relative flex items-start justify-between gap-2">
          {stations.map((s, i) => {
            const selected = s.key === active;
            return (
              <li key={s.key} className="flex w-[96px] shrink-0 flex-col items-center text-center sm:w-[118px]">
                <button
                  type="button"
                  onClick={() => onSelect(s.key)}
                  aria-pressed={selected}
                  aria-label={s.comingSoon ? `${s.title} — قريبًا` : s.title}
                  className={`relative flex h-[58px] w-[58px] cursor-pointer items-center justify-center overflow-hidden rounded-full border border-white bg-white p-2 shadow-[0_8px_18px_rgba(7,21,46,0.14)] transition-all duration-300 focus:outline-none focus-visible:ring-4 ${
                    selected ? `scale-110 ring-4 ${theme.ring}` : `${theme.thin} hover:scale-105`
                  } ${s.comingSoon ? "opacity-45 grayscale" : ""}`}
                >
                  {s.iconCode && courseIcon(s.iconCode) ? (
                    <span className="relative h-full w-full">
                      <Image src={courseIcon(s.iconCode)!} alt="" fill sizes="42px" className="object-contain" />
                    </span>
                  ) : (
                    <span className="text-lg font-black text-[#07152E]">{i + 1}</span>
                  )}
                </button>
                <span className={`mt-3 text-[12px] font-black leading-5 sm:text-[13px] ${selected ? theme.text : "text-[#07152E]"}`}>{s.title}</span>
                {s.comingSoon ? (
                  <span className="mt-0.5 text-[11px] font-black text-[#C88712]">قريبًا</span>
                ) : typeof s.count === "number" ? (
                  <span className="mt-0.5 text-[11px] font-bold text-slate-400">{s.count} محاضرة</span>
                ) : null}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

function LectureRow({ lecture, kind }: { lecture: TopicLecture; kind: "workshop" | "free" }) {
  return (
    <article className="grid gap-3 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_170px] sm:items-center">
      <div className="flex min-w-0 items-start gap-3">
        <CourseLogo code={lecture.courseCode} size={34} />
        <div className="min-w-0">
          <h3 className="text-sm font-black leading-6 text-[#07152E]" dir="auto">
            {lecture.title}
          </h3>
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] font-bold text-slate-500">
            <span>{lecture.courseTitle}</span>
          </div>
        </div>
      </div>
      <CourseActionButton
        courseId={lecture.courseId}
        label={THEME[kind].action}
        mode={kind === "free" ? "free" : "enrollment"}
        journeyType={kind === "free" ? "free" : "workshop"}
        actionKey={lecture.actionKey}
        actionTitle={lecture.title}
        itemTitle={lecture.title}
        enrollmentStatus={(lecture.enrollmentStatus as EnrollmentStatus | null) ?? null}
        redirectTo={`/dashboard?panel=${kind === "free" ? "free" : "one-day"}&lesson=${encodeURIComponent(lecture.id)}`}
      />
    </article>
  );
}

/* تطبيع النص العربي/الإنجليزي للبحث: تشكيل، تطويل، همزات، تاء مربوطة، ياء. */
function normalizeSearch(value: string) {
  return value
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/\s+/g, " ")
    .trim();
}

/** خانة بحث كبيرة بقائمة ثابتة (عربي + English في سطر واحد) تتصفّى أثناء الكتابة. */
function SearchBar({
  terms,
  selected,
  onSelect,
  onClear,
  kind,
}: {
  terms: SearchTerm[];
  selected: SearchTerm | null;
  onSelect: (term: SearchTerm) => void;
  onClear: () => void;
  kind: "workshop" | "free";
}) {
  const theme = THEME[kind];
  const [query, setQuery] = useState("");
  // typing = الطالب يكتب الآن؛ غير ذلك نعرض الموضوع المختار داخل الخانة.
  const [typing, setTyping] = useState(false);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedLabel = selected ? (selected.titleEn ? `${selected.title}  ${selected.titleEn}` : selected.title) : "";

  const filtered = useMemo(() => {
    const q = typing ? normalizeSearch(query) : "";
    if (!q) return terms;
    return terms.filter((t) => normalizeSearch(`${t.title} ${t.titleEn}`).includes(q));
  }, [terms, query, typing]);

  const choose = (term: SearchTerm) => {
    onSelect(term);
    setQuery("");
    setTyping(false);
    setOpen(false);
    inputRef.current?.blur();
  };

  return (
    <div className="relative mx-auto max-w-3xl px-4">
      <div
        className="flex items-center gap-3 rounded-2xl border-2 bg-white px-4 shadow-[0_8px_24px_rgba(7,21,46,0.10)] transition focus-within:shadow-[0_10px_30px_rgba(7,21,46,0.18)]"
        style={{ borderColor: theme.accent }}
      >
        <Search className="h-5 w-5 shrink-0" style={{ color: theme.accent }} aria-hidden="true" />
        <input
          ref={inputRef}
          value={typing ? query : selectedLabel}
          onChange={(e) => {
            setQuery(e.target.value);
            setTyping(true);
            setOpen(true);
          }}
          onFocus={(e) => {
            setOpen(true);
            if (selected && !typing) e.currentTarget.select();
          }}
          onBlur={() =>
            window.setTimeout(() => {
              setOpen(false);
              setTyping(false);
              setQuery("");
            }, 120)
          }
          onKeyDown={(e) => {
            if (e.key === "Enter" && filtered[0]) {
              e.preventDefault();
              choose(filtered[0]);
            }
            if (e.key === "Escape") setOpen(false);
          }}
          placeholder="ابحث عن موضوع… مثال: الدوارات أو Roundabout"
          aria-label="ابحث عن موضوع في المحاضرات"
          className="h-14 min-w-0 flex-1 bg-transparent text-base font-bold text-[#07152E] outline-none placeholder:text-slate-400 sm:h-16 sm:text-lg"
        />
        {selected ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setTyping(false);
              onClear();
            }}
            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-[#07152E] hover:bg-slate-200"
          >
            <X className="h-3.5 w-3.5" /> مسح البحث
          </button>
        ) : null}
      </div>

      {open ? (
        <ul
          role="listbox"
          className="absolute inset-x-4 top-full z-30 mt-2 max-h-72 overflow-y-auto rounded-2xl border border-slate-200 bg-white py-1 shadow-[0_16px_40px_rgba(7,21,46,0.18)]"
        >
          {filtered.length === 0 ? <li className="px-4 py-3 text-sm font-bold text-slate-400">لا يوجد موضوع بهذا الاسم.</li> : null}
          {filtered.map((t) => (
            <li key={t.id} role="option" aria-selected={selected?.id === t.id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(t)}
                className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-right transition hover:bg-slate-50"
              >
                <span className="flex min-w-0 items-baseline gap-3">
                  <span className="shrink-0 text-sm font-black text-[#07152E]">{t.title}</span>
                  {t.titleEn ? (
                    <span dir="ltr" className="truncate text-xs font-bold text-slate-500">
                      {t.titleEn}
                    </span>
                  ) : null}
                </span>
                <span className="shrink-0 text-[11px] font-bold text-slate-400">{t.lectures.length} محاضرة</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function ProfessionalPanel({ station }: { station: ProfessionalStation }) {
  const theme = THEME.professional;
  const enrolled = station.enrollment && ["active", "completed"].includes(station.enrollment.status);
  const pending = station.enrollment?.status === "pending";
  return (
    <div className="p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <CourseLogo code={station.courseCode} size={44} />
        <div className="min-w-0">
          <h2 className="text-lg font-black text-[#07152E]">{station.courseTitle}</h2>
          {station.description ? <p className="mt-0.5 text-sm font-semibold text-slate-500">{station.description}</p> : null}
        </div>
      </div>
      {station.comingSoon ? (
        <p className="mt-4 rounded-xl bg-slate-50 p-4 text-center text-sm font-bold text-slate-500">رحلة هذه المحطة قريبًا.</p>
      ) : (
        <>
          <div className={`mt-4 grid gap-3 ${station.levels.length > 1 ? "sm:grid-cols-3" : ""}`}>
            {station.levels.map((level) => (
              <div key={level.key} className="rounded-2xl border p-4" style={{ borderColor: `${theme.accent}55`, background: theme.soft }}>
                <p className="text-sm font-black text-[#07152E]">{level.title}</p>
                <p className="mt-1 text-xs font-bold text-slate-500">
                  {level.lessons} محاضرة
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {enrolled ? (
              <Link href="/dashboard" className="rounded-xl bg-[#07152E] px-5 py-2.5 text-sm font-black text-white">
                ابدأ الرحلة
              </Link>
            ) : (
              <Link href={`/course/${station.slug}`} className="rounded-xl px-5 py-2.5 text-sm font-black text-[#07152E]" style={{ background: theme.accent }}>
                {pending ? "طلب الاشتراك قيد المراجعة — تفاصيل الرحلة" : "تفاصيل الرحلة والاشتراك"}
              </Link>
            )}
            <Link href={`/course/${station.slug}`} className="text-sm font-black text-[#07152E] underline-offset-4 hover:underline">
              صفحة الكورس
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

type Props =
  | { kind: "workshop" | "free"; paths: LecturePath[]; initialPathSlug?: string | null }
  | { kind: "professional"; paths: ProfessionalPath[]; initialPathSlug?: string | null };

export default function JourneysRoadView(props: Props) {
  const { kind } = props;
  const theme = THEME[kind];
  const Icon = theme.icon;
  const paths = props.paths as Array<LecturePath | ProfessionalPath>;
  const initial = paths.find((p) => p.slug === props.initialPathSlug) ?? paths[0];
  const [pathId, setPathId] = useState(initial?.id ?? "");
  const path = paths.find((p) => p.id === pathId) ?? paths[0];

  const stations: Station[] = useMemo(() => {
    if (!path) return [];
    if (kind === "professional") {
      return (path as ProfessionalPath).stations.map((s) => ({ key: s.id, title: s.title, iconCode: s.courseCode, comingSoon: s.comingSoon }));
    }
    return (path as LecturePath).topics.map((t) => ({ key: t.id ?? "other", title: t.title, count: t.lectures.length }));
  }, [path, kind]);

  const [selectedByPath, setSelectedByPath] = useState<Record<string, string>>({});
  // الموضوع المختار من خانة البحث (لكل مسار). عند اختياره تُعرض كل محاضراته تحت الطريق.
  const [termByPath, setTermByPath] = useState<Record<string, string | null>>({});
  const searchTerms = kind === "professional" || !path ? [] : (path as LecturePath).searchTerms ?? [];
  const activeTerm = (path && searchTerms.find((t) => t.id === termByPath[path.id])) || null;
  const firstOpen = stations.find((s) => !s.comingSoon)?.key ?? stations[0]?.key ?? "";
  const active = (path && selectedByPath[path.id]) || firstOpen;

  return (
    <main dir="rtl" className="min-h-screen bg-[#F7F8FA] pb-16">
      <section className="px-4 pb-3 pt-3 text-center text-white sm:pb-4 sm:pt-4" style={{ background: `linear-gradient(160deg,#07152E 55%,${theme.accent}55)` }}>
        <div className="flex items-center justify-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2" style={{ borderColor: theme.accent, color: theme.accent }}>
            <Icon className="h-4 w-4" />
          </span>
          <h1 className="text-lg font-black sm:text-2xl">{theme.title}</h1>
        </div>
        <p className="mx-auto mt-1 max-w-2xl text-xs font-semibold leading-5 text-slate-300 sm:text-sm">{theme.subtitle}</p>

        <button
          type="button"
          onClick={openOffersScreen}
          className="mx-auto mt-2 inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#F7B548] px-4 py-1.5 text-xs font-black text-[#07152E] shadow-md transition hover:scale-105 hover:bg-[#FFC766]"
        >
          <Gift className="h-4 w-4" />
          جميع العروض
        </button>

        <div role="tablist" className="mx-auto mt-3 flex max-w-xl justify-center gap-2 rounded-2xl bg-white/5 p-1">
          {paths.map((p) => (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={p.id === path?.id}
              onClick={() => setPathId(p.id)}
              className={`flex-1 rounded-xl px-3 py-2 text-sm font-black transition ${p.id === path?.id ? theme.tab : "text-white/80 hover:bg-white/10"}`}
            >
              {p.title}
            </button>
          ))}
        </div>
      </section>

      {kind !== "professional" && searchTerms.length > 0 && path ? (
        <section className="mt-4">
          <SearchBar
            key={path.id}
            kind={kind}
            terms={searchTerms}
            selected={activeTerm}
            onSelect={(term) => setTermByPath((prev) => ({ ...prev, [path.id]: term.id }))}
            onClear={() => setTermByPath((prev) => ({ ...prev, [path.id]: null }))}
          />
        </section>
      ) : null}

      <section className="mt-1">
        {stations.length === 0 ? (
          <p className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm font-bold text-slate-500">
            المحاضرات في هذا المسار قريبًا.
          </p>
        ) : (
          <Road stations={stations} active={active} onSelect={(key) => {
              if (!path) return;
              setSelectedByPath((prev) => ({ ...prev, [path.id]: key }));
              setTermByPath((prev) => ({ ...prev, [path.id]: null }));
            }} kind={kind} />
        )}
      </section>

      {kind !== "professional" && activeTerm ? (
        <section className="mx-auto mt-2 max-w-4xl px-4">
          <div className="overflow-hidden rounded-2xl border bg-white shadow-sm" style={{ borderColor: `${theme.accent}66` }}>
            <div className="flex items-center justify-between gap-3 px-4 py-3" style={{ background: theme.soft }}>
              <h2 className="flex min-w-0 flex-wrap items-baseline gap-x-3 text-base font-black text-[#07152E]">
                <span>نتائج البحث: {activeTerm.title}</span>
                {activeTerm.titleEn ? (
                  <span dir="ltr" className="text-xs font-bold text-slate-500">
                    {activeTerm.titleEn}
                  </span>
                ) : null}
              </h2>
              <span className={`shrink-0 text-xs font-black ${theme.text}`}>{activeTerm.lectures.length} محاضرة</span>
            </div>
            <div className="divide-y divide-slate-100">
              {activeTerm.lectures.map((lecture) => (
                <LectureRow key={`search:${activeTerm.id}:${lecture.id}`} lecture={lecture} kind={kind as "workshop" | "free"} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {path && active && !(kind !== "professional" && activeTerm) ? (
        <section className="mx-auto mt-2 max-w-4xl px-4">
          <div className="overflow-hidden rounded-2xl border bg-white shadow-sm" style={{ borderColor: `${theme.accent}66` }}>
            {kind === "professional" ? (
              (() => {
                const station = (path as ProfessionalPath).stations.find((s) => s.id === active);
                return station ? <ProfessionalPanel station={station} /> : null;
              })()
            ) : (
              (() => {
                const topic = (path as LecturePath).topics.find((t) => (t.id ?? "other") === active);
                if (!topic) return null;
                return (
                  <>
                    <div className="flex items-center justify-between gap-3 px-4 py-3" style={{ background: theme.soft }}>
                      <h2 className="text-base font-black text-[#07152E]">{topic.title}</h2>
                      <span className={`text-xs font-black ${theme.text}`}>{topic.lectures.length} محاضرة</span>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {topic.lectures.map((lecture) => (
                        <LectureRow key={`${active}:${lecture.id}`} lecture={lecture} kind={kind as "workshop" | "free"} />
                      ))}
                    </div>
                  </>
                );
              })()
            )}
          </div>
        </section>
      ) : null}
    </main>
  );
}
