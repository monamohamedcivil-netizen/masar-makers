"use client";

import {
  FolderKanban,
  ImageIcon,
  MapPin,
  MessageSquareQuote,
  Star,
} from "lucide-react";

import { useState } from "react";

import type { Review } from "@/data/types";

import type {
  StudentProject,
} from "@/lib/projects/types";

import ProjectGalleryModal, {
  type ProjectGalleryData,
} from "@/components/projects/ProjectGalleryModal";

type Props = {
  reviews: Review[];
  projects: StudentProject[];
};

function getImageUrl(
  image: unknown,
): string {
  if (typeof image === "string") {
    return image.trim();
  }

  if (
    image &&
    typeof image === "object" &&
    "imageUrl" in image
  ) {
    const imageUrl = String(
      (
        image as {
          imageUrl?: unknown;
        }
      ).imageUrl ?? "",
    );

    return imageUrl.trim();
  }

  return "";
}

function getProjectImages(
  project: StudentProject,
): string[] {
  const images = Array.isArray(
    project.images,
  )
    ? project.images
    : [];

  return Array.from(
    new Set(
      images
        .map((image) =>
          getImageUrl(image),
        )
        .filter(Boolean),
    ),
  );
}

function getProjectCover(
  project: StudentProject,
): string {
  const images = Array.isArray(
    project.images,
  )
    ? project.images
    : [];

  const cover =
    images.find((image) => {
      if (
        image &&
        typeof image === "object" &&
        "isCover" in image
      ) {
        return Boolean(
          (
            image as {
              isCover?: unknown;
            }
          ).isCover,
        );
      }

      return false;
    }) ??
    images[0] ??
    null;

  return getImageUrl(cover);
}

export default function SuccessStoriesPanel({
  reviews,
  projects,
}: Props) {
  const [
    selectedProject,
    setSelectedProject,
  ] =
    useState<ProjectGalleryData | null>(
      null,
    );

  const openProjectGallery = (
    project: StudentProject,
  ) => {
    const projectImages =
      getProjectImages(project);

    const coverImage =
      getProjectCover(project);

    setSelectedProject({
      id: project.id,
      title: project.projectTitle,
      description:
        project.projectDescription,
      studentName: project.studentName,
      studentCountry:
        project.studentCountry,
      courseTitle: project.courseTitle,
      images:
        projectImages.length > 0
          ? projectImages
          : coverImage
            ? [coverImage]
            : [],
      projectLink: project.projectLink,
    });
  };

  return (
    <>
      <section
        dir="rtl"
        className="min-h-[460px] overflow-hidden rounded-[26px] border-[3px] border-[#07152E] bg-white shadow-[0_18px_48px_rgba(7,21,46,0.11)]"
      >
        <div className="flex min-h-[78px] items-center gap-4 border-b border-[#E3E7ED] bg-white px-6 py-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#FFF7E3] text-[#D49319]">
            <MessageSquareQuote size={22} />
          </span>

          <div>
            <h2 className="text-[23px] font-black text-[#07152E]">
              قصص نجاح المتدربين
            </h2>

            <p className="mt-1 text-[11px] font-medium text-slate-500">
              تقييمات حقيقية ومشاريع تطبيقية
              نفذها متدربو هذا الكورس.
            </p>
          </div>
        </div>

        <div className="grid min-h-[380px] lg:grid-cols-2">
          {/* تقييمات المتدربين */}
          <div className="border-b border-[#E3E7ED] p-5 lg:border-b-0 lg:border-l">
            <div className="mb-4 flex items-center gap-2">
              <MessageSquareQuote
                size={18}
                className="text-[#D49319]"
              />

              <h3 className="text-[16px] font-black text-[#07152E]">
                تقييمات المتدربين
              </h3>
            </div>

            {reviews.length > 0 ? (
              <div className="space-y-3">
                {reviews
                  .slice(0, 4)
                  .map((review) => (
                    <article
                      key={review.id}
                      className="rounded-2xl border border-[#E1E7EE] bg-[#F9FAFC] p-4"
                    >
                      <div className="flex items-center gap-1 text-[#F7B548]">
                        {Array.from({
                          length:
                            review.rating,
                        }).map(
                          (_, index) => (
                            <Star
                              key={index}
                              size={13}
                              fill="currentColor"
                            />
                          ),
                        )}
                      </div>

                      <p className="mt-3 text-[11px] font-medium leading-5 text-slate-600">
                        “{review.review}”
                      </p>

                      <div className="mt-3 border-t border-[#E4E8EE] pt-3">
                        <p className="text-[11px] font-black text-[#07152E]">
                          {
                            review.studentName
                          }
                        </p>

                        <div className="mt-1 flex flex-wrap items-center gap-1 text-[9px] font-bold text-slate-400">
                          {review.studentRole ? (
                            <span>
                              {
                                review.studentRole
                              }
                            </span>
                          ) : null}

                          {review.studentRole &&
                          review.country ? (
                            <span>—</span>
                          ) : null}

                          {review.country ? (
                            <span>
                              {review.country}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  ))}
              </div>
            ) : (
              <div className="flex min-h-[250px] items-center justify-center rounded-2xl border border-dashed border-[#D6DEE8] bg-[#F9FAFC] p-6 text-center">
                <p className="text-[12px] font-bold text-slate-500">
                  لا توجد تقييمات منشورة لهذا
                  الكورس بعد.
                </p>
              </div>
            )}
          </div>

          {/* مشاريع المتدربين */}
          <div className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <FolderKanban
                size={18}
                className="text-[#D49319]"
              />

              <h3 className="text-[16px] font-black text-[#07152E]">
                مشاريع المتدربين
              </h3>
            </div>

            {projects.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {projects
                  .slice(0, 4)
                  .map((project) => {
                    const coverImage =
                      getProjectCover(
                        project,
                      );

                    const projectImages =
                      getProjectImages(
                        project,
                      );

                    const imagesCount =
                      projectImages.length > 0
                        ? projectImages.length
                        : coverImage
                          ? 1
                          : 0;

                    return (
                      <article
                        key={project.id}
                        role="button"
                        tabIndex={0}
                        onClick={() =>
                          openProjectGallery(
                            project,
                          )
                        }
                        onKeyDown={(
                          event,
                        ) => {
                          if (
                            event.key ===
                              "Enter" ||
                            event.key === " "
                          ) {
                            event.preventDefault();

                            openProjectGallery(
                              project,
                            );
                          }
                        }}
                        className="group cursor-pointer overflow-hidden rounded-2xl border border-[#E1E7EE] bg-white transition duration-300 hover:-translate-y-1 hover:border-[#F7B548] hover:shadow-[0_14px_32px_rgba(7,21,46,0.12)] focus:outline-none focus:ring-2 focus:ring-[#F7B548]"
                      >
                        <div className="relative aspect-video overflow-hidden bg-slate-100">
                          {coverImage ? (
                            <img
                              src={
                                coverImage
                              }
                              alt={
                                project.projectTitle
                              }
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <ImageIcon className="h-9 w-9 text-slate-300" />
                            </div>
                          )}

                          <div className="absolute inset-0 bg-gradient-to-t from-[#07152E]/45 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />

                          {imagesCount > 1 ? (
                            <span className="absolute bottom-2 left-2 rounded-full bg-black/65 px-2.5 py-1 text-[9px] font-black text-white backdrop-blur">
                              {imagesCount} صور
                            </span>
                          ) : null}

                          <span className="absolute bottom-2 right-2 translate-y-2 rounded-full bg-[#F7B548] px-3 py-1 text-[9px] font-black text-[#07152E] opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                            عرض المشروع
                          </span>
                        </div>

                        <div className="p-4">
                          <h4 className="line-clamp-1 text-[13px] font-black text-[#07152E]">
                            {
                              project.projectTitle
                            }
                          </h4>

                          {project.projectDescription ? (
                            <p className="mt-2 line-clamp-2 text-[10px] leading-5 text-slate-500">
                              {
                                project.projectDescription
                              }
                            </p>
                          ) : null}

                          <div className="mt-3 flex items-center gap-1.5 border-t border-slate-100 pt-3 text-[10px] font-bold text-slate-500">
                            <MapPin
                              size={12}
                              className="shrink-0 text-[#D49319]"
                            />

                            <span className="min-w-0 truncate">
                              {project.studentName ||
                                "أحد متدربي Masar Makers"}

                              {project.studentCountry ? (
                                <span className="mr-1 text-slate-400">
                                  —{" "}
                                  {
                                    project.studentCountry
                                  }
                                </span>
                              ) : null}
                            </span>
                          </div>
                        </div>
                      </article>
                    );
                  })}
              </div>
            ) : (
              <div className="flex min-h-[250px] items-center justify-center rounded-2xl border border-dashed border-[#D6DEE8] bg-[#F9FAFC] p-6 text-center">
                <p className="text-[12px] font-bold text-slate-500">
                  لا توجد مشاريع منشورة لهذا
                  الكورس بعد.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <ProjectGalleryModal
        project={selectedProject}
        onClose={() =>
          setSelectedProject(null)
        }
      />
    </>
  );
}