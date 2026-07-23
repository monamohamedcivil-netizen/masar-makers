import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FolderKanban,
  Gift,
  MessageSquareQuote,
  Pencil,
  PlayCircle,
  Plus,
  Rocket,
  Star,
  Target,
} from "lucide-react";

import CourseActionButton from "./CourseActionButton";

import type { EnrollmentStatus, EnrollmentStatusMap } from "@/lib/actions/enroll";

import type {
  Course,
  CoursePanelTab,
  CourseVariant,
  FreeSession,
  Review,
  Workshop,
} from "@/data/types";

import JourneyComingSoon from "./JourneyComingSoon";
import ProfessionalPanelViewer from "./ProfessionalPanelViewer";
import type { ProfessionalPanelDraft } from "@/components/course/editor";

export type PlatformPanelMode =
  | "student"
  | "edit"
  | "preview";

type CourseDynamicPanelProps = {
  mode?: PlatformPanelMode;
  activePanel: CoursePanelTab;
  course: Course;
  freeSessions: FreeSession[];
  workshops: Workshop[];
  reviews: Review[];
  panelVisible: boolean;
  onEditPanel?: () => void;
  onAddPanelContent?: () => void;
  panelContents?: any[];
  enrollmentStatus?: EnrollmentStatus | null;
  enrollmentStatuses?: EnrollmentStatusMap;
  stationId?: string;
  screenContent?: ProfessionalPanelDraft | null;
};

export default function CourseDynamicPanel({
  mode = "student",
  activePanel,
  course,
  enrollmentStatus,
  enrollmentStatuses,
  freeSessions,
  workshops,
  reviews,
  panelVisible,
  onEditPanel,
  onAddPanelContent,
  panelContents,
  stationId,
  screenContent,
}: CourseDynamicPanelProps) {
  if (screenContent && stationId) {
    return (
      <ProfessionalPanelViewer
        stationId={stationId}
        courseId={course.slug}
        panelComponent={activePanel}
        enrollmentStatuses={enrollmentStatuses}
        value={screenContent}
      />
    );
  }
  if (activePanel === "outcome") {
    return (
      <PanelShell
        title="إلى ماذا سأصل؟"
        description="النتيجة المهنية والتطبيقية التي تستهدفها هذه الرحلة."
        icon={Target}
        mode={mode}
        panelVisible={panelVisible}
        onEdit={onEditPanel}
        onAddContent={onAddPanelContent}
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
        mode={mode}
        panelVisible={panelVisible}
        onEdit={onEditPanel}
        onAddContent={onAddPanelContent}
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
        mode={mode}
        panelVisible={panelVisible}
        onEdit={onEditPanel}
        onAddContent={onAddPanelContent}
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
        mode={mode}
        panelVisible={panelVisible}
        onEdit={onEditPanel}
        onAddContent={onAddPanelContent}
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
        mode={mode}
        panelVisible={panelVisible}
        onEdit={onEditPanel}
        onAddContent={onAddPanelContent}
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

                <CourseActionButton
                  courseId={String(course.id)}
                  enrollmentStatus={enrollmentStatus}
                />
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
      mode={mode}
      course={course}
      enrollmentStatus={enrollmentStatus}
      panelVisible={panelVisible}
      onEditPanel={onEditPanel}
      onAddPanelContent={onAddPanelContent}
      panelContents={panelContents}
    />
  );
}

/* ==================================================
   Professional Panel (NEW)
================================================== */

function ProfessionalPanel({
  mode,
  course,
  enrollmentStatus,
  panelVisible,
  onEditPanel,
  onAddPanelContent,
  panelContents,
}: {
  mode: PlatformPanelMode;
  course: Course;
  enrollmentStatus?: EnrollmentStatus | null;
  panelVisible: boolean;
  onEditPanel?: () => void;
  onAddPanelContent?: () => void;
  panelContents?: any[];
  
}) {
  console.log("ProfessionalPanel props:", {
  panelContents,
  panelContentsType: typeof panelContents,
  panelContentsLength: panelContents?.length,
});
  console.log("ProfessionalPanel", panelContents);
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
      mode={mode}
      panelVisible={panelVisible}
      onEdit={onEditPanel}
      onAddContent={onAddPanelContent}
    >
      

    {panelContents && panelContents.length > 0 ? (
  <div className="grid grid-cols-1 md:grid-cols-2">
    {(["fundamental" , "advanced"] as const).map((journey) => (
      <div
        key={journey}
        className="min-h-[260px] space-y-4 border-x p-5"
      >
        {panelContents
          .filter((content) => content.journey === journey)
          .map((content, index) => (
            <div
              key={`${journey}-${index}`}
              className="rounded-xl border bg-white p-4"
            >
              <h3 className="mb-4 text-right text-lg font-black">
                {content.title}
              </h3>

              <div className="space-y-3">
                {content.items?.map((item: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-4 rounded-lg border p-3"
                  >
                    <div className="min-w-0 flex-1 text-right">
                      <div className="font-bold">
                        {item.title}
                      </div>

                      {item.description && (
                        <div className="mt-1 text-sm text-slate-600">
                          {item.description}
                        </div>
                      )}
                    </div>

                    {item.hasButton && (
                      <a
                        href={item.buttonLink}
                        className="shrink-0 rounded-lg bg-[#07152E] px-4 py-2 text-sm font-bold text-white"
                      >
                        {item.buttonText}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>
    ))}
  </div>
) : (
  
  <SingleJourney
    course={course}
    enrollmentStatus={enrollmentStatus}
  />
      )}
    </PanelShell>
  );
}
type ProfessionalScreenProps = {
  integrated?: CourseVariant;
  foundation: CourseVariant;
  advanced: CourseVariant;
  enrollmentStatus?: EnrollmentStatus | null;
};

function ProfessionalScreen({
  integrated,
  foundation,
  advanced,
  enrollmentStatus,
}: ProfessionalScreenProps) {
  return (
    <JourneyComparisonCard
      integrated={integrated}
      foundation={foundation}
      advanced={advanced}
      enrollmentStatus={enrollmentStatus}
    />
  );
}
type JourneyComparisonCardProps = {
  integrated?: CourseVariant;
  foundation: CourseVariant;
  advanced: CourseVariant;
  enrollmentStatus?: EnrollmentStatus | null;
};

function JourneyComparisonCard({
  integrated,
  foundation,
  advanced,
  enrollmentStatus,
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
        <CourseActionButton
          courseId={String(integrated?.id ?? foundation.id)}
          enrollmentStatus={enrollmentStatus}
        />
      </div>

      {/* الأساسيات والمتقدمة */}
      <div className="grid md:grid-cols-2">
        <JourneyComparisonColumn
          variant={foundation}
          title="رحلة الأساسيات"
          theme="foundation"
          enrollmentStatus={enrollmentStatus}
        />

        <JourneyComparisonColumn
          variant={advanced}
          title="الرحلة المتقدمة"
          theme="advanced"
          enrollmentStatus={enrollmentStatus}
        />
      </div>
    </div>
  );
}
   
type JourneyComparisonColumnProps = {
  variant: CourseVariant;
  title: string;
  theme: "foundation" | "advanced";
  enrollmentStatus?: EnrollmentStatus | null;
};

function JourneyComparisonColumn({
  variant,
  title,
  theme,
  enrollmentStatus,
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

        <div className="w-[155px] shrink-0">
          <CourseActionButton
            courseId={String(variant.id)}
            enrollmentStatus={enrollmentStatus}
          />
        </div>
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
  enrollmentStatus,
}: {
  course: Course;
  enrollmentStatus?: EnrollmentStatus | null;
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

        <div className="w-full sm:w-[190px]">
          <CourseActionButton
            courseId={String(course.id)}
            enrollmentStatus={enrollmentStatus}
          />
        </div>
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
  mode: PlatformPanelMode;
  panelVisible: boolean;
  onEdit?: () => void;
  onAddContent?: () => void;
  children: React.ReactNode;
};

function PanelShell({
  title,
  description,
  icon: Icon,
  mode,
  panelVisible,
  onEdit,
  onAddContent,
  children,
}: PanelShellProps) {
  const isEditMode = mode === "edit";

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
          relative flex min-h-[78px]
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

        <div className="min-w-0 flex-1">
          <h2 className="text-[23px] font-black text-[#07152E]">
            {title}
          </h2>

          <p className="mt-1 text-[11px] font-medium text-slate-500">
            {description}
          </p>
        </div>

        {isEditMode && (
          <button
            type="button"
            onClick={onEdit}
            className="
              flex h-9 shrink-0
              items-center justify-center
              gap-2 rounded-lg
              border border-[#F7B548]
              bg-[#FFF7E3] px-3
              text-[11px] font-black
              text-[#B87508]
              transition hover:bg-[#F7B548]
              hover:text-[#07152E]
            "
          >
            <Pencil size={14} />
            تعديل القسم
          </button>
        )}
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

      {isEditMode && (
        <div className="border-t border-[#E3E7ED] bg-[#FAFBFC] p-3">
          <button
            type="button"
            onClick={onAddContent}
            className="
              flex min-h-[44px] w-full
              items-center justify-center
              gap-2 rounded-xl
              border border-dashed
              border-[#F7B548]
              bg-white px-4
              text-[12px] font-black
              text-[#B87508]
              transition hover:bg-[#FFF7E3]
            "
          >
            <Plus size={16} />
            إضافة محتوى إلى هذا القسم
          </button>
        </div>
      )}
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