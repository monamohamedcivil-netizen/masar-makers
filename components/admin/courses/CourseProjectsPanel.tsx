"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  ExternalLink,
  FolderKanban,
  ImageIcon,
  Loader2,
} from "lucide-react";

import {
  getAdminCourseProjects,
  updateCourseProject,
  type AdminCourseProject,
} from "@/lib/actions/admin/course-projects";

type Props = {
  courseId: string;
  courseTitle: string;
};

function formatDate(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function getStatusLabel(status: string) {
  if (status === "approved") {
    return "معتمد";
  }

  if (status === "needs_revision") {
    return "يحتاج تعديل";
  }

  if (status === "rejected") {
    return "مرفوض";
  }

  return "بانتظار المراجعة";
}

export default function CourseProjectsPanel({
  courseId,
  courseTitle,
}: Props) {
  const [projects, setProjects] = useState<
    AdminCourseProject[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] =
    useState("");

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    const result =
      await getAdminCourseProjects(courseId);

    if (!result.success) {
      setProjects([]);
      setErrorMessage(result.message);
      setLoading(false);
      return;
    }

    setProjects(result.data);
    setLoading(false);
  }, [courseId]);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  if (loading) {
    return (
      <div className="flex min-h-[360px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#F7B548]" />

          <p className="mt-3 text-sm font-bold text-slate-500">
            جاري تحميل مشاريع الطلاب...
          </p>
        </div>
      </div>
    );
  }

  return (
    <section dir="rtl" className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-[#07152E]">
          مشاريع طلاب {courseTitle}
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          مراجعة المشاريع والصور المرفوعة من
          الطلاب.
        </p>
      </div>

      {errorMessage ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
          {errorMessage}
        </div>
      ) : null}

      {!errorMessage && projects.length === 0 ? (
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <FolderKanban className="h-12 w-12 text-slate-300" />

          <h3 className="mt-5 text-lg font-black text-[#07152E]">
            لا توجد مشاريع لهذا الكورس
          </h3>
        </div>
      ) : null}

      <div className="space-y-5">
        {projects.map((project) => {
          const coverImage =
            project.images.find(
              (image) => image.isCover,
            ) ?? project.images[0];

          return (
            <article
              key={project.id}
              className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="grid gap-6 p-5 lg:grid-cols-[260px_minmax(0,1fr)]">
                <div className="overflow-hidden rounded-2xl bg-slate-100">
                  <div className="aspect-video">
                    {coverImage?.imageUrl ? (
                      <img
                        src={coverImage.imageUrl}
                        alt={project.projectTitle}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <ImageIcon className="h-10 w-10 text-slate-300" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-black text-[#07152E]">
                        {project.projectTitle}
                      </h3>

                      <p className="mt-2 text-sm font-bold text-slate-600">
                        {project.studentName ||
                          "طالب بدون اسم"}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {project.studentEmail || "—"}
                      </p>
                    </div>

                    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">
                      {getStatusLabel(project.status)}
                    </span>
                  </div>

                  {project.projectDescription ? (
                    <p className="mt-4 line-clamp-3 text-sm leading-7 text-slate-600">
                      {project.projectDescription}
                    </p>
                  ) : null}

                  <div className="mt-4 flex flex-wrap gap-4 text-xs font-bold text-slate-500">
                    <span>
                      تاريخ الرفع:{" "}
                      {formatDate(project.submittedAt)}
                    </span>

                    <span>
                      عدد الصور: {project.images.length}
                    </span>
                  </div>
<div className="mt-5 flex flex-wrap gap-3">

<button
className="rounded-xl bg-green-600 px-4 py-2 text-sm font-bold text-white"
onClick={async()=>{
await updateCourseProject(
project.id,
{
status:"approved",
},
);

await loadProjects();
}}
>
اعتماد المشروع
</button>

<button
className={`rounded-xl px-4 py-2 text-sm font-bold ${
project.showOnCourse
?"bg-[#07152E] text-white"
:"bg-slate-200"
}`}
onClick={async()=>{
await updateCourseProject(
project.id,
{
showOnCourse:
!project.showOnCourse,
},
);

await loadProjects();
}}
>
{
project.showOnCourse
?"إخفاء من صفحة الكورس"
:"إظهار في صفحة الكورس"
}
</button>

<button
className={`rounded-xl px-4 py-2 text-sm font-bold ${
project.showOnHome
?"bg-[#F7B548]"
:"bg-slate-200"
}`}
onClick={async()=>{
await updateCourseProject(
project.id,
{
showOnHome:
!project.showOnHome,
},
);

await loadProjects();
}}
>
{
project.showOnHome
?"إخفاء من الرئيسية"
:"إظهار بالرئيسية"
}
</button>

</div>
                  {project.projectLink ? (
                    <a
                      href={project.projectLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center gap-2 text-sm font-black text-[#07152E]"
                    >
                      <ExternalLink className="h-4 w-4" />
                      فتح رابط المشروع
                    </a>
                  ) : null}
                </div>
              </div>

              {project.images.length > 0 ? (
                <div className="border-t border-slate-200 bg-slate-50 p-4">
                  <div className="flex gap-3 overflow-x-auto pb-1">
                    {project.images.map((image) => (
                      <div
                        key={image.id}
                        className={`relative h-24 w-36 shrink-0 overflow-hidden rounded-xl border-2 bg-white ${
                          image.isCover
                            ? "border-[#F7B548]"
                            : "border-transparent"
                        }`}
                      >
                       <img
  src={image.imageUrl}
  alt={project.projectTitle}
  loading="lazy"
  onError={(event) => {
    console.error(
      "PROJECT IMAGE FAILED:",
      image.imageUrl,
    );

    event.currentTarget.style.display = "none";
  }}
  className="h-full w-full object-cover"
/>

                        {image.isCover ? (
                            
                          <span className="absolute right-2 top-2 rounded-full bg-[#F7B548] px-2 py-1 text-[10px] font-black text-[#07152E]">
                            صورة الغلاف
                          </span>
                        ) : null}
                        <button
type="button"
className="absolute bottom-2 left-2 rounded-lg bg-white/90 px-2 py-1 text-[10px] font-black"

onClick={async()=>{

await updateCourseProject(
  project.id,
  image.isImported
    ? {
        coverImagePath:
          image.publicPath ??
          image.imageUrl,
      }
    : {
        coverImageId: image.id,
      },
);

await loadProjects();

}}
>

اختيار غلاف

</button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}