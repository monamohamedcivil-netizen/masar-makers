import Link from "next/link";
import {
  Award,
  BarChart3,
  BookOpenCheck,
  CheckCircle2,
  ChevronLeft,
  ClipboardList,
  Compass,
  FileCheck2,
  FileUp,
  PlayCircle,
  Sparkles,
  Target,
} from "lucide-react";

import StudentCourseCard from "@/components/student/StudentCourseCard";
import type { StudentDashboardData } from "@/lib/queries/student-dashboard";
import type { WorkspacePanelDefinition } from "../types";

type Props = {
  panel: WorkspacePanelDefinition;
  data: StudentDashboardData;
};

export default function WorkspacePanelContent({ panel, data }: Props) {
  switch (panel.kind) {
    case "course-list":
      return (
        <CourseListPanel
          courses={data.careerCourses}
          pending={data.pendingCourses}
        />
      );

    case "empty-journey":
      if (panel.id === "one-day" && data.oneDayCourses.length) return <CourseListPanel courses={data.oneDayCourses} pending={[]} />;
      if (panel.id === "free" && data.freeCourses.length) return <CourseListPanel courses={data.freeCourses} pending={[]} />;
      return (
        <EmptyPanel
          icon={panel.settings?.accent === "free" ? Sparkles : panel.icon}
          title={panel.title}
          text={String(panel.settings?.description ?? "لا يوجد محتوى متاح حاليًا.")}
          href={String(panel.settings?.href ?? "/career-path")}
        />
      );

    case "next-step":
      return <NextStepPanel data={data} />;

    case "certificates":
      return <CertificatesPanel certificates={data.certificates} />;

    case "achievement-card":
      return (
        <AchievementCard
          completed={data.summary.completed}
          active={data.summary.active}
        />
      );

    case "surveys":
      return <SurveysPanel surveys={data.surveys} />;

    case "projects":
      return <ProjectsPanel projects={data.projects} />;

    default:
      return null;
  }
}

function CourseListPanel({
  courses,
  pending,
}: {
  courses: StudentDashboardData["activeCourses"];
  pending: StudentDashboardData["pendingCourses"];
}) {
  if (!courses.length && !pending.length) {
    return (
      <EmptyPanel
        icon={BookOpenCheck}
        title="رحلتك الأولى في انتظارك"
        text="اختر مسارك المهني وابدأ رحلتك."
        href="/career-path"
      />
    );
  }

  return (
    <div className="space-y-6">
      {courses.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2">
          {courses.map((course) => (
            <StudentCourseCard key={course.enrollmentId} course={course} />
          ))}
        </div>
      ) : null}

      {pending.length > 0 ? (
        <div>
          <h3 className="mb-3 text-sm font-black text-amber-700">
            بانتظار الاعتماد
          </h3>
          <div className="grid gap-5 md:grid-cols-2">
            {pending.map((course) => (
              <StudentCourseCard
                key={course.enrollmentId}
                course={course}
                pending
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function NextStepPanel({ data }: { data: StudentDashboardData }) {
  const course = [...data.activeCourses]
    .filter((item) => item.progressPercent < 100)
    .sort((a, b) => b.progressPercent - a.progressPercent)[0];

  if (!course) {
    return (
      <EmptyPanel
        icon={Target}
        title="ابدأ خطوتك التالية"
        text="ستظهر هنا نقطة المتابعة بمجرد بدء رحلة."
        href="/career-path"
      />
    );
  }

  const href = course.lastLessonId
    ? `/course/${course.slug}?lesson=${course.lastLessonId}`
    : `/course/${course.slug}`;

  return (
    <div className="mx-auto max-w-xl border border-slate-200 bg-[#FFFDF7] p-5">
      <p className="text-xs font-black text-[#C88712]">تابع من حيث توقفت</p>
      <h3 className="mt-2 text-xl font-black">
        {course.lastLessonTitle || course.title}
      </h3>
      <p className="mt-2 text-sm font-semibold text-slate-500">
        {course.completedLessons} من {course.totalLessons || "—"} درس
      </p>
      <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-[#72B63F]"
          style={{ width: `${course.progressPercent}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between text-[11px] font-black">
        <span>{Math.round(course.progressPercent)}%</span>
        <span>نحو الاحتراف</span>
      </div>
      <Link
        href={href}
        className="mt-6 flex h-12 items-center justify-center gap-2 bg-[#07152E] text-sm font-black text-[#F7B548]"
      >
        متابعة الرحلة <PlayCircle size={20} />
      </Link>
    </div>
  );
}

function CertificatesPanel({ certificates }: { certificates: StudentDashboardData["certificates"] }) {
  if (!certificates.length) return <EmptyPanel icon={FileCheck2} title="لا توجد شهادات بعد" text="أكمل أول رحلة لتظهر شهادتك هنا." href="/career-path" />;
  return <div className="grid gap-4 md:grid-cols-2">{certificates.map((item) => <div key={item.id} className="border border-slate-200 bg-slate-50 p-5"><div className="flex items-center justify-between"><FileCheck2 className="text-[#C88712]" /><span className="text-[10px] font-black text-slate-500">{item.certificateNumber}</span></div><h3 className="mt-4 font-black">{item.courseTitle}</h3><p className="mt-1 text-xs font-semibold text-slate-500">صدرت في {new Date(item.issuedAt).toLocaleDateString("ar-SA")}</p>{item.fileUrl ? <a href={item.fileUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex h-10 items-center bg-[#07152E] px-4 text-xs font-black text-[#F7B548]">عرض الشهادة</a> : null}</div>)}</div>;
}

function SurveysPanel({ surveys }: { surveys: StudentDashboardData["surveys"] }) {
  if (!surveys.length) return <EmptyPanel icon={ClipboardList} title="لا توجد استبيانات" text="ستظهر الاستبيانات المطلوبة هنا تلقائيًا." href="/dashboard" />;
  return <div className="space-y-3">{surveys.map((survey) => <div key={survey.id} className="flex flex-col gap-3 border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3">{survey.completed ? <CheckCircle2 className="text-emerald-600" /> : <ClipboardList className="text-[#C88712]" />}<div><h3 className="font-black">{survey.title}</h3><p className="text-xs font-semibold text-slate-500">{survey.completed ? "تم إرسال الاستبيان" : "بانتظار إجابتك"}</p></div></div>{!survey.completed && survey.formUrl ? <a href={survey.formUrl} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center justify-center bg-[#07152E] px-4 text-xs font-black text-[#F7B548]">ابدأ الاستبيان</a> : null}</div>)}</div>;
}

function ProjectsPanel({ projects }: { projects: StudentDashboardData["projects"] }) {
  if (!projects.length) return <EmptyPanel icon={FileUp} title="مشاريعك" text="ستظهر هنا المشاريع التي ترفعها ضمن رحلاتك." href="/dashboard" />;
  return <div className="grid gap-4 md:grid-cols-2">{projects.map((project) => <div key={project.id} className="border border-slate-200 bg-slate-50 p-5"><div className="flex items-center justify-between"><FileUp className="text-[#C88712]" /><span className="text-[10px] font-black text-slate-500">{project.status}</span></div><h3 className="mt-4 font-black">{project.title}</h3>{project.description ? <p className="mt-1 text-sm font-semibold text-slate-500">{project.description}</p> : null}{project.projectUrl ? <a href={project.projectUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex text-xs font-black text-[#9A6711]">عرض المشروع</a> : null}</div>)}</div>;
}

function AchievementCard({
  completed,
  active,
}: {
  completed: number;
  active: number;
}) {
  return (
    <div className="mx-auto max-w-3xl border border-[#F7B548]/30 bg-gradient-to-l from-[#07152E] to-[#12345F] p-6 text-white shadow-xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-black text-[#F7B548]">بطاقة الإنجازات</p>
          <h3 className="mt-2 text-2xl font-black">إنجازاتك في مكان واحد</h3>
        </div>
        <Award size={48} className="text-[#F7B548]" />
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <Metric label="رحلات مكتملة" value={completed} icon={FileCheck2} />
        <Metric label="رحلات نشطة" value={active} icon={BarChart3} />
      </div>
    </div>
  );
}

function Metric({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Award }) {
  return (
    <div className="bg-white/10 p-4">
      <Icon size={18} className="text-[#F7B548]" />
      <p className="mt-3 text-2xl font-black">{value}</p>
      <p className="text-[10px] font-bold text-white/65">{label}</p>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  title,
  value,
  text,
}: {
  icon: typeof Compass;
  title: string;
  value: number;
  text: string;
}) {
  return (
    <div className="border border-slate-200 bg-slate-50 p-5">
      <div className="flex items-center justify-between">
        <Icon className="text-[#C88712]" />
        <span className="text-2xl font-black">{value}</span>
      </div>
      <h3 className="mt-4 font-black">{title}</h3>
      <p className="mt-1 text-sm font-semibold text-slate-500">{text}</p>
    </div>
  );
}

function EmptyPanel({
  icon: Icon,
  title,
  text,
  href,
}: {
  icon: typeof Compass;
  title: string;
  text: string;
  href: string;
}) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
      <span className="flex h-18 w-18 items-center justify-center rounded-full bg-[#FFF4DF] text-[#C88712]">
        <Icon size={31} />
      </span>
      <h3 className="mt-4 text-xl font-black">{title}</h3>
      <p className="mt-2 max-w-sm text-sm font-semibold text-slate-500">{text}</p>
      <Link
        href={href}
        className="mt-5 inline-flex h-11 items-center gap-2 bg-[#07152E] px-5 text-xs font-black text-white"
      >
        استكشف الآن <ChevronLeft size={17} />
      </Link>
    </div>
  );
}
