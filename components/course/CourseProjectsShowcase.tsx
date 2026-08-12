import {
  ExternalLink,
  FolderKanban,
  ImageIcon,
  MapPin,
} from "lucide-react";

import type {
  StudentProject,
} from "@/lib/projects/types";

type Props = {
  projects: StudentProject[];
};

export default function CourseProjectsShowcase({
  projects,
}: Props) {
  if (projects.length === 0) {
    return null;
  }

  return (
    <section
      dir="rtl"
      className="bg-[#F7F8FA] px-4 pb-16 pt-8 sm:px-6"
    >
      <div className="mx-auto max-w-[1320px]">
        <div className="mb-7 text-center">
          <p className="text-sm font-black text-[#D49319]">
            من التدريب إلى التنفيذ
          </p>

          <h2 className="mt-2 text-3xl font-black text-[#07152E]">
            مشاريع طلاب الكورس
          </h2>

          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-500">
            نماذج تطبيقية حقيقية نفذها المتدربون
            خلال رحلتهم التعليمية.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => {
            const coverImage =
              project.images.find(
  (image) => image.isCover,
)?.imageUrl ??
project.images[0]?.imageUrl ??
"/images/project-placeholder.jpg"

            return (
              <article
                key={project.id}
                className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="relative aspect-video overflow-hidden bg-slate-100">
                {coverImage ? (
  <img
    src={coverImage}
    alt={project.projectTitle}
    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
  />
) : (
                    <div className="flex h-full items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-slate-300" />
                    </div>
                  )}

                  <span className="absolute right-4 top-4 rounded-full bg-[#07152E]/90 px-3 py-1 text-xs font-black text-white backdrop-blur-sm">
                    {project.courseTitle ||
                      "مشروع تدريبي"}
                  </span>

                  <span className="absolute bottom-4 left-4 rounded-full bg-white/90 px-3 py-1 text-xs font-black text-[#07152E] backdrop-blur-sm">
                    {project.images.length} صور
                  </span>
                </div>

                <div className="p-5">
                  <h3 className="line-clamp-2 text-xl font-black text-[#07152E]">
                    {project.projectTitle}
                  </h3>

                  {project.projectDescription ? (
                    <p className="mt-3 line-clamp-3 min-h-[72px] text-sm leading-6 text-slate-500">
                      {project.projectDescription}
                    </p>
                  ) : (
                    <p className="mt-3 min-h-[72px] text-sm text-slate-400">
                      مشروع تطبيقي من تنفيذ أحد طلاب
                      الكورس.
                    </p>
                  )}

                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <p className="text-sm font-black text-[#07152E]">
                      {project.studentName ||
                        "أحد طلاب Masar Makers"}
                    </p>

                    <div className="mt-2 flex items-center gap-2 text-xs font-bold text-slate-400">
                      <MapPin className="h-4 w-4 text-[#F7B548]" />
                      مشروع طالب
                    </div>
                  </div>

                  {project.projectLink ? (
                    <a
                      href={project.projectLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#07152E] px-5 text-sm font-black text-white transition hover:bg-[#F7B548] hover:text-[#07152E]"
                    >
                      <ExternalLink className="h-4 w-4" />
                      عرض المشروع
                    </a>
                  ) : (
                    <div className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-100 px-5 text-sm font-black text-slate-500">
                      <FolderKanban className="h-4 w-4" />
                      مشروع تطبيقي
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}