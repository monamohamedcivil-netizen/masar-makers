"use client";

import {
  ExternalLink,
  Eye,
  FolderKanban,
  ImageIcon,
  Loader2,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  getStudentProjectsByUserId,
} from "@/lib/projects/student-projects";

import type {
  StudentProject,
} from "@/lib/projects/types";

type Props = {
  userId: string;
};

export default function StudentProjectsPanel({
  userId,
}: Props) {
  const [projects, setProjects] =
    useState<StudentProject[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [viewedProject, setViewedProject] =
    useState<StudentProject | null>(null);

  const loadProjects = useCallback(
    async () => {
      setLoading(true);
      setError("");

      try {
        const result =
          await getStudentProjectsByUserId(
            userId,
          );

        setProjects(result);
      } catch (loadError) {
        console.error(
          "Failed to load admin student projects:",
          loadError,
        );

        setProjects([]);
        setError(
          "تعذر تحميل مشاريع الطالب حاليًا.",
        );
      } finally {
        setLoading(false);
      }
    },
    [userId],
  );

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  if (loading) {
    return (
      <div className="flex min-h-[260px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#F7B548]" />

          <p className="mt-3 text-sm font-bold text-slate-500">
            جاري تحميل مشاريع الطالب...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700">
        {error}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 text-center">
        <FolderKanban className="h-10 w-10 text-[#F7B548]" />

        <p className="mt-4 font-black text-[#07152E]">
          لا توجد مشاريع لهذا الطالب.
        </p>
      </div>
    );
  }

  return (
    <>
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-black text-[#07152E]">
              مشاريع الطالب
            </h3>

            <p className="mt-1 text-xs font-bold text-slate-500">
              إجمالي المشاريع: {projects.length}
            </p>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {projects.map((project) => {
            const cover =
              project.images.find(
                (image) => image.isCover,
              ) ?? project.images[0];

            return (
              <article
                key={project.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="grid sm:grid-cols-[180px_minmax(0,1fr)]">
                  <div className="flex min-h-[160px] items-center justify-center bg-slate-50">
                    {cover?.imageUrl ? (
                      <img
                        src={cover.imageUrl}
                        alt={project.projectTitle}
                        className="h-full max-h-[180px] w-full object-contain"
                      />
                    ) : (
                      <ImageIcon className="h-9 w-9 text-slate-300" />
                    )}
                  </div>

                  <div className="flex flex-col justify-between p-4">
                    <div>
                      <h4 className="font-black text-[#07152E]">
                        {project.projectTitle}
                      </h4>

                      {project.courseTitle ? (
                        <p className="mt-1 text-xs font-bold text-[#C88712]">
                          {project.courseTitle}
                        </p>
                      ) : null}

                      {project.projectDescription ? (
                        <p className="mt-2 line-clamp-2 text-xs font-semibold leading-6 text-slate-500">
                          {project.projectDescription}
                        </p>
                      ) : null}
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setViewedProject(
                            project,
                          )
                        }
                        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#07152E] px-3 text-xs font-black text-white"
                      >
                        <Eye size={14} />
                        عرض
                      </button>

                      {project.projectLink ? (
                        <a
                          href={
                            project.projectLink
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-black text-[#07152E]"
                        >
                          <ExternalLink
                            size={14}
                          />
                          الرابط
                        </a>
                      ) : null}

                      <span className="mr-auto text-[10px] font-bold text-slate-400">
                        {project.images.length} صور
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {viewedProject ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/70 p-4"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setViewedProject(null);
            }
          }}
        >
          <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
              <div>
                <h2 className="text-lg font-black text-[#07152E]">
                  {viewedProject.projectTitle}
                </h2>

                <p className="mt-1 text-xs font-bold text-slate-500">
                  {viewedProject.images.length} صور
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setViewedProject(null)
                }
                className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </header>

            <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
              {viewedProject.images.map(
                (image) => (
                  <div
                    key={image.id}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
                  >
                    {image.imageUrl ? (
                      <img
                        src={image.imageUrl}
                        alt={
                          viewedProject.projectTitle
                        }
                        className="aspect-video h-full w-full object-contain"
                      />
                    ) : (
                      <div className="flex aspect-video items-center justify-center">
                        <ImageIcon className="h-10 w-10 text-slate-300" />
                      </div>
                    )}
                  </div>
                ),
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}