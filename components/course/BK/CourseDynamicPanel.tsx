import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FolderKanban,
  Gift,
  MessageSquareQuote,
  PlayCircle,
  Rocket,
  Star,
  Target,
} from "lucide-react";

import type {
  Course,
  CoursePanelTab,
  CourseVariant,
  FreeSession,
  Review,
  Workshop,
} from "@/data/types";

import JourneyComingSoon from "./JourneyComingSoon";

type CourseDynamicPanelProps = {
  activePanel: CoursePanelTab;
  course: Course;
  freeSessions: FreeSession[];
  workshops: Workshop[];
  reviews: Review[];
  panelVisible: boolean;
};

export default function CourseDynamicPanel({
  activePanel,
  course,
  freeSessions,
  workshops,
  reviews,
  panelVisible,
}: CourseDynamicPanelProps) {
  if (activePanel === "outcome") {
    return (
      <PanelShell
        title="إلى ماذا سأصل؟"
        description="النتيجة المهنية والتطبيقية التي تستهدفها هذه الرحلة."
        icon={Target}
        panelVisible={panelVisible}
      >
        <div className="border border-[#E0E5EC] bg-white p-5">
          

          {course.learningOutcomes?.length ? (
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {course.learningOutcomes.map(
                (outcome) => (
                  <div
                    key={outcome}
                    className="
                      flex items-start gap-2
                      border border-[#E3E7ED]
                      bg-[#F8FAFC]
                      px-4 py-3
                      text-[11px] font-bold
                      text-[#07152E]
                    "
                  >
                    <CheckCircle2
                      size={15}
                      className="mt-0.5 shrink-0 text-[#D49319]"
                    />

                    {outcome}
                  </div>
                )
              )}
            </div>
          ) : null}
        </div>
      </PanelShell>
    );
  }

  if (activePanel === "gifts") {
    return (
      <PanelShell
        title="الهدايا والملفات"
        description="ملفات وقوالب وأدوات تساعدك على التطبيق العملي."
        icon={Gift}
        panelVisible={panelVisible}
      >
        {course.gifts?.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {course.gifts.map(
              (gift, index) => (
                <article
                  key={gift}
                  className="
                    flex items-center gap-4
                    border border-[#E1E7EE]
                    bg-[#F9FAFC] p-4
                    transition
                    hover:border-[#F7B548]/70
                    hover:bg-white
                  "
                >
                  <span
                    className="
                      flex h-11 w-11 shrink-0
                      items-center justify-center
                      bg-[#FFF7E3]
                      text-[#D49319]
                    "
                  >
                    {index % 2 === 0 ? (
                      <Gift size={21} />
                    ) : (
                      <FolderKanban size={21} />
                    )}
                  </span>

                  <div>
                    <h3 className="text-[13px] font-black text-[#07152E]">
                      {gift}
                    </h3>

                    <p className="mt-1 text-[9px] font-bold text-slate-400">
                      متاح للمشتركين في الرحلة
                    </p>
                  </div>
                </article>
              )
            )}
          </div>
        ) : (
          <EmptyPanel text="سيتم إضافة هدايا وملفات هذه الرحلة قريبًا." />
        )}
      </PanelShell>
    );
  }

  if (activePanel === "reviews") {
    return (
      <PanelShell
        title="آراء المتدربين"
        description="تجارب حقيقية لمتدربين شاركوا في هذه الرحلة."
        icon={MessageSquareQuote}
        panelVisible={panelVisible}
      >
        {reviews.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {reviews
              .slice(0, 4)
              .map((review) => (
                <article
                  key={review.id}
                  className="
                    border border-[#E1E7EE]
                    bg-[#F9FAFC] p-4
                  "
                >
                  <div className="flex items-center gap-1 text-[#F7B548]">
                    {Array.from({
                      length: review.rating,
                    }).map((_, index) => (
                      <Star
                        key={index}
                        size={13}
                        fill="currentColor"
                      />
                    ))}
                  </div>

                  <p className="mt-3 line-clamp-4 text-[11px] font-medium leading-5 text-slate-600">
                    “{review.review}”
                  </p>

                  <div className="mt-3 border-t border-[#E4E8EE] pt-3">
                    <p className="text-[11px] font-black text-[#07152E]">
                      {review.studentName}
                    </p>

                    <p className="mt-0.5 text-[9px] font-bold text-slate-400">
                      {review.studentRole} —{" "}
                      {review.country}
                    </p>
                  </div>
                </article>
              ))}
          </div>
        ) : (
          <EmptyPanel text="سيتم إضافة آراء متدربي هذا الكورس قريبًا." />
        )}
      </PanelShell>
    );
  }

  if (activePanel === "free") {
    return (
      <PanelShell
        title="الرحلات المجانية"
        description="ابدأ باستكشاف محتوى الكورس وتجربة أسلوب التدريب مجانًا."
        icon={PlayCircle}
        panelVisible={panelVisible}
      >
        {freeSessions.length > 0 ? (
          <div className="space-y-3">
            {freeSessions.map((session) => (
              <article
                key={session.slug}
                className="
                  flex flex-col gap-4
                  border border-[#E1E7EE]
                  bg-[#F9FAFC] p-4
                  sm:flex-row sm:items-center
                "
              >
                <span
                  className="
                    flex h-11 w-11 shrink-0
                    items-center justify-center
                    bg-white text-[#D49319]
                  "
                >
                  <PlayCircle size={21} />
                </span>

                <div className="min-w-0 flex-1">
                  <h3 className="text-[14px] font-black text-[#07152E]">
                    {session.title}
                  </h3>

                  <p className="mt-1 line-clamp-1 text-[10px] font-medium text-slate-500">
                    {session.description}
                  </p>

                  <p className="mt-2 flex items-center gap-1 text-[9px] font-black text-[#D49319]">
                    <Clock3 size={11} />
                    {session.duration}
                  </p>
                </div>

                {session.videoUrl ? (
                  <a
                    href={session.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="
                      flex h-9 shrink-0
                      items-center justify-center
                      gap-2 bg-[#07152E]
                      px-5 text-[11px]
                      font-black text-white
                      transition
                      hover:bg-[#F7B548]
                      hover:text-[#07152E]
                    "
                  >
                    شاهد الآن
                    <ArrowLeft size={13} />
                  </a>
                ) : (
                  <span className="shrink-0 bg-slate-100 px-4 py-2 text-[10px] font-bold text-slate-400">
                    قريبًا
                  </span>
                )}
              </article>
            ))}
          </div>
        ) : (
          <EmptyPanel text="سيتم إضافة الرحلات المجانية الخاصة بهذا الكورس قريبًا." />
        )}
      </PanelShell>
    );
  }

  if (activePanel === "workshop") {
    return (
      <PanelShell
        title="رحلة اليوم الواحد"
        description="رحلات مركزة تساعدك على تعلم مهارة محددة وتطبيقها خلال يوم واحد."
        icon={CalendarDays}
        panelVisible={panelVisible}
      >
        {workshops.length > 0 ? (
          <div className="space-y-3">
            {workshops.map((workshop) => (
              <article
                key={workshop.slug}
                className="
                  flex flex-col gap-4
                  border border-[#E1E7EE]
                  bg-[#F9FAFC] p-4
                  sm:flex-row sm:items-center
                "
              >
                <span
                  className="
                    flex h-11 w-11 shrink-0
                    items-center justify-center
                    bg-white text-[#D49319]
                  "
                >
                  <CalendarDays size={21} />
                </span>

                <div className="min-w-0 flex-1">
                  <h3 className="text-[14px] font-black text-[#07152E]">
                    {workshop.title}
                  </h3>

                  <p className="mt-1 line-clamp-1 text-[10px] font-medium text-slate-500">
                    {workshop.description}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-4 text-[9px] font-black text-[#D49319]">
                    <span className="flex items-center gap-1">
                      <Clock3 size={11} />
                      {workshop.duration}
                    </span>

                    {workshop.date && (
                      <span>
                        {workshop.date}
                      </span>
                    )}

                    {workshop.price !== undefined && (
                      <span>
                        {workshop.price} ريال
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  className="
                    flex h-9 shrink-0
                    items-center justify-center
                    gap-2 bg-[#F7B548]
                    px-5 text-[11px]
                    font-black text-[#07152E]
                    transition
                    hover:bg-[#FFC967]
                  "
                >
                  اشترك الآن
                  <ArrowLeft size={13} />
                </button>
              </article>
            ))}
          </div>
        ) : (
          <EmptyPanel text="سيتم إضافة رحلات اليوم الواحد الخاصة بهذا الكورس قريبًا." />
        )}
      </PanelShell>
    );
  }

  return (
    <ProfessionalPanel
      course={course}
      panelVisible={panelVisible}
    />
  );
}

/* ==================================================
   Professional Panel (NEW)
================================================== */

function ProfessionalPanel({
  course,
  panelVisible,
}: {
  course: Course;
  panelVisible: boolean;
}) {
  const variants = [...(course.variants ?? [])]
    .filter((v) => v.active)
    .sort((a, b) => a.order - b.order);

  const integrated = variants.find(
    (v) => v.type === "integrated"
  );

  const fundamental = variants.find(
    (v) => v.type === "fundamental"
  );

  const advanced = variants.find(
    (v) => v.type === "advanced"
  );

  const comparison =
    course.journeyLayout ===
      "foundation_advanced" &&
    fundamental &&
    advanced;

  return (
    <PanelShell
      title="رحلة الاحتراف المتكاملة"
      description="المنهج الكامل الذي ينقلك من الأساسيات إلى التطبيق الاحترافي."
      icon={Rocket}
      panelVisible={panelVisible}
      
    >
      {course.professionalJourneyStatus ===
      "coming_soon" ? (
        <JourneyComingSoon
          journeyId={
            course.professionalJourneyId
          }
          journeyTitle={`رحلة احتراف ${course.title}`}
        />
      ) : comparison ? (
        <ProfessionalScreen
          integrated={integrated}
          foundation={fundamental}
          advanced={advanced}
        />
      ) : (
        <SingleJourney course={course} />
      )}
    </PanelShell>
  );
}
type ProfessionalScreenProps = {
  integrated?: CourseVariant;
  foundation: CourseVariant;
  advanced: CourseVariant;
};

function ProfessionalScreen({
  integrated,
  foundation,
  advanced,
}: ProfessionalScreenProps) {
  return (
    <JourneyComparisonCard
      integrated={integrated}
      foundation={foundation}
      advanced={advanced}
    />
  );
}
type JourneyComparisonCardProps = {
  integrated?: CourseVariant;
  foundation: CourseVariant;
  advanced: CourseVariant;
};

function JourneyComparisonCard({
  integrated,
  foundation,
  advanced,
}: JourneyComparisonCardProps) {
  return (
    <div className="overflow-hidden bg-white">
      {/* الرحلة المتكاملة */}
      <div
        className="
          flex min-h-[82px]
          flex-col gap-4
          border-t-2 border-[#F7B548]
          bg-[#07152E]
          px-7 py-4
          text-white

          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >
        {/* العنوان يمينًا */}
        <div>
          <h3 className="text-[21px] font-black text-[#F7B548]">
            الرحلة المتكاملة
          </h3>

          <p className="mt-1 text-[12px] font-bold text-slate-300">
            تشمل رحلة الأساسيات + الرحلة المتقدمة
          </p>
        </div>

        {/* زر الاشتراك يسارًا */}
        <button
          type="button"
          className="
            flex h-[42px] w-full shrink-0
            items-center justify-center
            gap-2 rounded-lg
            bg-[#F7B548] px-6
            text-[14px] font-black
            text-[#07152E]
            shadow-[0_8px_18px_rgba(247,181,72,0.20)]
            transition duration-200

            hover:-translate-y-0.5
            hover:bg-[#FFC966]
            hover:shadow-[0_10px_22px_rgba(247,181,72,0.28)]

            sm:w-[155px]
          "
        >
          اشترك الآن
          <ArrowLeft size={14} />
        </button>
      </div>

      {/* الأساسيات والمتقدمة */}
      <div className="grid md:grid-cols-2">
        <JourneyComparisonColumn
          variant={foundation}
          title="رحلة الأساسيات"
          theme="foundation"
        />

        <JourneyComparisonColumn
          variant={advanced}
          title="الرحلة المتقدمة"
          theme="advanced"
        />
      </div>
    </div>
  );
}
   
type JourneyComparisonColumnProps = {
  variant: CourseVariant;
  title: string;
  theme: "foundation" | "advanced";
};

function JourneyComparisonColumn({
  variant,
  title,
  theme,
}: JourneyComparisonColumnProps) {
  const isFoundation =
    theme === "foundation";

  const curriculum = [
    ...(variant.curriculum ?? []),
  ].sort(
    (a, b) => a.order - b.order
  );

  return (
    <section
      className={`
        min-w-0 bg-white

        ${
          isFoundation
            ? "md:border-l md:border-[#CBD4DF]"
            : ""
        }
      `}
    >
      {/* عنوان الرحلة */}
      <div
        className={`
          flex min-h-[62px]
          items-center
          justify-between gap-3
          px-5 text-white

          ${
            isFoundation
              ? "bg-[#214F73]"
              : "bg-[#153B5F]"
          }
        `}
      >
        <h3 className="text-[18px] font-black">
          {title}
        </h3>

        <button
          type="button"
          className="
            h-8 shrink-0
            rounded-full bg-white
            px-5 text-[11px]
            font-black text-[#07152E]
            transition duration-200

            hover:bg-[#F7B548]
            hover:-translate-y-0.5
          "
        >
          اشترك الآن
        </button>
      </div>

      {/* محتوى الرحلة */}
      <div
        className="
          flex min-h-[305px]
          flex-col px-6 py-5
        "
      >
        {curriculum.length > 0 ? (
          <div className="space-y-2.5">
            {curriculum
              .slice(0, 6)
              .map((item) => (
                <div
                  key={item.id}
                  className="
                    flex items-start gap-2
                    text-[11px] font-bold
                    leading-5 text-[#07152E]
                  "
                >
                  <CheckCircle2
                    size={14}
                    className="
                      mt-0.5 shrink-0
                      text-[#D49319]
                    "
                  />

                  <span>
                    {item.title}
                  </span>
                </div>
              ))}
          </div>
        ) : (
          <p
            className="
              flex flex-1 items-center
              justify-center text-center
              text-[11px] font-bold
              text-slate-400
            "
          >
            سيتم إضافة المحاضرات قريبًا.
          </p>
        )}

        {/* إحصائيات الرحلة */}
        <div
          className="
            mt-auto grid grid-cols-2
            rounded-xl bg-[#F7F8FA]
            px-3 py-4
          "
        >
          <div className="text-center">
            <p className="text-[21px] font-black text-[#07152E]">
              {curriculum.length}
            </p>

            <p className="mt-1 text-[9px] font-bold text-slate-500">
              محاضرة
            </p>
          </div>

          <div className="border-r border-[#DDE3EA] text-center">
            <p className="text-[19px] font-black text-[#07152E]">
              {variant.duration}
            </p>

            <p className="mt-1 text-[9px] font-bold text-slate-500">
              ساعات تدريبية
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
/* ==================================================
   Single Journey
================================================== */

function SingleJourney({
  course,
}: {
  course: Course;
}) {
  const curriculum = [
    ...(course.curriculum ?? []),
  ].sort(
    (a, b) => a.order - b.order
  );

  return (
    <>
      <div
        className="
          mb-3 flex flex-col gap-3
          bg-[#07152E]
          px-5 py-3 text-white
          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >
        <h3 className="text-[18px] font-black">
          رحلة احتراف {course.title}
        </h3>

        <button
          type="button"
          className="
            flex h-9 shrink-0
            items-center justify-center
            gap-2 bg-[#F7B548]
            px-4 text-[12px]
            font-black text-[#07152E]
          "
        >
          اشترك في الرحلة
          <ArrowLeft size={13} />
        </button>
      </div>

      {curriculum.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {curriculum.map(
            (item, index) => {
              const lastOdd =
                index ===
                  curriculum.length - 1 &&
                curriculum.length % 2 !==
                  0;

              return (
                <article
                  key={item.id}
                  className={`
                    flex items-start gap-4
                    border border-[#DCE2EA]
                    bg-white p-3
                    transition
                    hover:border-[#F7B548]/70

                    ${
                      lastOdd
                        ? "md:col-span-2"
                        : ""
                    }
                  `}
                >
                  <span
                    className="
                      flex h-10 w-10
                      shrink-0 items-center
                      justify-center
                      bg-[#07152E]
                      text-[14px] font-black
                      text-[#F7B548]
                    "
                  >
                    {String(
                      index + 1
                    ).padStart(2, "0")}
                  </span>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-[14px] font-black text-[#07152E]">
                      {item.title}
                    </h3>

                    {item.description && (
                      <p className="mt-1 text-[10px] font-medium leading-5 text-slate-500">
                        {item.description}
                      </p>
                    )}

                    {item.duration && (
                      <p className="mt-1 flex items-center gap-1 text-[11px] font-black text-[#D49319]">
                        <Clock3 size={11} />
                        {item.duration}
                      </p>
                    )}
                  </div>
                </article>
              );
            }
          )}
        </div>
      ) : (
        <EmptyPanel text="سيتم إضافة محاور رحلة الاحتراف قريبًا." />
      )}
    </>
  );
}

/* ==================================================
   Panel Shell
================================================== */

type PanelShellProps = {
  title: string;
  description: string;
  icon: typeof Gift;
  panelVisible: boolean;
  children: React.ReactNode;
};

function PanelShell({
  title,
  description,
  icon: Icon,
  panelVisible,
  children,
}: PanelShellProps) {
  return (
    <section
      className="
        min-h-[460px]
        overflow-hidden
        rounded-[26px]
        border-[3px] border-[#07152E]
        bg-white
        shadow-[0_18px_48px_rgba(7,21,46,0.11)]
      "
    >
      {/* عنوان الشاشة الثابت */}
      <div
        className="
          flex min-h-[78px]
          items-center gap-4
          border-b border-[#E3E7ED]
          bg-white px-6 py-3
        "
      >
        <span
          className="
            flex h-11 w-11 shrink-0
            items-center justify-center
            rounded-full
            bg-[#FFF7E3]
            text-[#D49319]
          "
        >
          <Icon size={22} />
        </span>

        <div className="min-w-0">
          <h2 className="text-[23px] font-black text-[#07152E]">
            {title}
          </h2>

          <p className="mt-1 text-[11px] font-medium text-slate-500">
            {description}
          </p>
        </div>
      </div>

      {/* محتوى الشاشة المتغير */}
      <div className="p-0">
        <div
          className={`
            transform-gpu
            transition-[opacity,transform]
            duration-200
            ease-[cubic-bezier(0.22,1,0.36,1)]

            ${
              panelVisible
                ? `
                  translate-y-0
                  opacity-100
                `
                : `
                  translate-y-1.5
                  opacity-0
                `
            }
          `}
        >
          {children}
        </div>
      </div>
    </section>
  );
}

function EmptyPanel({
  text,
}: {
  text: string;
}) {
  return (
    <div
      className="
        flex min-h-[260px]
        items-center justify-center
        border border-dashed
        border-[#D6DEE8]
        bg-[#F9FAFC]
        px-6 text-center
      "
    >
      <p className="text-[12px] font-bold text-slate-500">
        {text}
      </p>
    </div>
  );
}