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

function getImageUrl(image: unknown): string {
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
  const images = Array.isArray(project.images)
    ? project.images
    : [];

  return Array.from(
    new Set(
      images
        .map((image) => getImageUrl(image))
        .filter(Boolean),
    ),
  );
}

function getProjectCover(
  project: StudentProject,
): string {
  const images = Array.isArray(project.images)
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

function ReviewCard({
  review,
}: {
  review: Review;
}) {
  return (
    <article className="flex h-full min-h-[150px] flex-col rounded-2xl border border-[#E1E7EE] bg-[#F9FAFC] p-4">
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

      <p className="mt-3 text-[11px] font-medium leading-5 text-slate-600">
        “{review.review}”
      </p>

      <div className="mt-auto border-t border-[#E4E8EE] pt-3">
        <p className="text-[11px] font-black text-[#07152E]">
          {review.studentName}
        </p>

        <div className="mt-1 flex flex-wrap items-center gap-1 text-[9px] font-bold text-slate-400">
          {review.studentRole ? (
            <span>{review.studentRole}</span>
          ) : null}

          {review.studentRole &&
          review.country ? (
            <span>—</span>
          ) : null}

          {review.country ? (
            <span>{review.country}</span>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function ProjectCard({
  project,
  onOpen,
}: {
  project: StudentProject;
  onOpen: (project: StudentProject) => void;
}) {
  const coverImage = getProjectCover(project);
  const projectImages = getProjectImages(project);

  const imagesCount =
    projectImages.length > 0
      ? projectImages.length
      : coverImage
        ? 1
        : 0;

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onOpen(project)}
      onKeyDown={(event) => {
        if (
          event.key === "Enter" ||
          event.key === " "
        ) {
          event.preventDefault();
          onOpen(project);
        }
      }}
      className="group grid h-full min-h-[150px] cursor-pointer overflow-hidden rounded-2xl border border-[#E1E7EE] bg-white transition duration-300 hover:-translate-y-0.5 hover:border-[#F7B548] hover:shadow-[0_10px_24px_rgba(7,21,46,0.10)] focus:outline-none focus:ring-2 focus:ring-[#F7B548] sm:grid-cols-[150px_minmax(0,1fr)]"
    >
      <div className="relative aspect-video overflow-hidden bg-slate-100 sm:aspect-auto sm:h-full sm:min-h-[150px]">
        {coverImage ? (
          <img
            src={coverImage}
            alt={project.projectTitle}
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

      <div className="flex min-w-0 flex-col p-4">
        <h4 className="line-clamp-1 text-[13px] font-black text-[#07152E]">
          {project.projectTitle}
        </h4>

        {project.projectDescription ? (
          <p className="mt-2 line-clamp-3 text-[10px] leading-5 text-slate-500">
            {project.projectDescription}
          </p>
        ) : null}

        <div className="mt-auto flex items-center gap-1.5 border-t border-slate-100 pt-3 text-[10px] font-bold text-slate-500">
          <MapPin
            size={12}
            className="shrink-0 text-[#D49319]"
          />

          <span className="min-w-0 truncate">
            {project.studentName ||
              "أحد متدربي Masar Makers"}

            {project.studentCountry ? (
              <span className="mr-1 text-slate-400">
                — {project.studentCountry}
              </span>
            ) : null}
          </span>
        </div>
      </div>
    </article>
  );
}

export default function SuccessStoriesPanel({
  reviews,
  projects,
}: Props) {
  const [
    selectedProject,
    setSelectedProject,
  ] = useState<ProjectGalleryData | null>(
    null,
  );

  const [
    mobileSection,
    setMobileSection,
  ] = useState<
    "reviews" | "projects"
  >("reviews");

  const visibleReviews =
    reviews.slice(0, 4);

  const visibleProjects =
    projects.slice(0, 4);

  const desktopRowCount =
    Math.max(
      visibleReviews.length,
      visibleProjects.length,
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
        className="min-h-[400px] overflow-hidden rounded-b-[24px] rounded-t-none border border-[#C9D2DE] bg-white shadow-[0_22px_55px_rgba(7,21,46,0.16),0_4px_12px_rgba(7,21,46,0.08)] lg:rounded-[24px]"
      >
        <div className="flex min-h-[64px] items-center gap-2.5 border-b-[3px] border-[#F7B548] bg-[#07152E] px-5 py-2.5 text-white sm:px-6">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F7B548] text-[#07152E]">
            <MessageSquareQuote size={16} />
          </span>

          <div>
            <h2 className="text-[18px] font-black leading-5 text-white sm:text-[20px]">
              قصص نجاح المتدربين
            </h2>
          </div>
        </div>

        <div
          className="grid grid-cols-2 border-b border-[#DCE2EA] bg-[#EEF1F5] lg:hidden"
          role="tablist"
          aria-label="قصص نجاح المتدربين"
        >
          <button
            type="button"
            role="tab"
            aria-selected={
              mobileSection === "reviews"
            }
            onClick={() =>
              setMobileSection("reviews")
            }
            className={`relative min-h-[46px] px-3 text-[11px] font-black transition ${
              mobileSection === "reviews"
                ? "bg-[#173A61] text-white"
                : "bg-[#EEF1F5] text-[#4B5563]"
            }`}
          >
            تقييمات المتدربين

            {mobileSection ===
            "reviews" ? (
              <span className="absolute inset-x-4 bottom-0 h-[3px] bg-[#F7B548]" />
            ) : null}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={
              mobileSection === "projects"
            }
            onClick={() =>
              setMobileSection("projects")
            }
            className={`relative min-h-[46px] px-3 text-[11px] font-black transition ${
              mobileSection === "projects"
                ? "bg-[#102D50] text-white"
                : "bg-[#EEF1F5] text-[#4B5563]"
            }`}
          >
            مشاريع المتدربين

            {mobileSection ===
            "projects" ? (
              <span className="absolute inset-x-4 bottom-0 h-[3px] bg-[#F7B548]" />
            ) : null}
          </button>
        </div>

        {/* Mobile */}
        <div className="bg-white p-4 lg:hidden">
          {mobileSection ===
          "reviews" ? (
            visibleReviews.length ? (
              <div className="grid gap-3">
                {visibleReviews.map(
                  (review) => (
                    <ReviewCard
                      key={review.id}
                      review={review}
                    />
                  ),
                )}
              </div>
            ) : (
              <div className="flex min-h-[250px] items-center justify-center rounded-2xl border border-dashed border-[#D6DEE8] bg-[#F9FAFC] p-6 text-center">
                <p className="text-[12px] font-bold text-slate-500">
                  لا توجد تقييمات منشورة لهذا الكورس بعد.
                </p>
              </div>
            )
          ) : visibleProjects.length ? (
            <div className="grid gap-3">
              {visibleProjects.map(
                (project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onOpen={
                      openProjectGallery
                    }
                  />
                ),
              )}
            </div>
          ) : (
            <div className="flex min-h-[250px] items-center justify-center rounded-2xl border border-dashed border-[#D6DEE8] bg-[#F9FAFC] p-6 text-center">
              <p className="text-[12px] font-bold text-slate-500">
                لا توجد مشاريع منشورة لهذا الكورس بعد.
              </p>
            </div>
          )}
        </div>

        {/* Desktop */}
        <div className="hidden bg-[#DCE2EA] lg:block">
          <div className="grid grid-cols-2 gap-px">
            <div className="bg-white p-4">
              <div className="flex items-center gap-2">
                <MessageSquareQuote
                  size={18}
                  className="text-[#D49319]"
                />

                <h3 className="text-[16px] font-black text-[#07152E]">
                  تقييمات المتدربين
                </h3>
              </div>
            </div>

            <div className="bg-white p-4">
              <div className="flex items-center gap-2">
                <FolderKanban
                  size={18}
                  className="text-[#D49319]"
                />

                <h3 className="text-[16px] font-black text-[#07152E]">
                  مشاريع المتدربين
                </h3>
              </div>
            </div>
          </div>

          {desktopRowCount > 0 ? (
            Array.from({
              length: desktopRowCount,
            }).map((_, index) => {
              const review =
                visibleReviews[index];

              const project =
                visibleProjects[index];

              return (
                <div
                  key={`success-row-${index}`}
                  className="grid grid-cols-2 items-stretch gap-px"
                >
                  {/* Review side */}
                  <div className="bg-white p-4">
                    {review ? (
                      <ReviewCard
                        review={review}
                      />
                    ) : null}
                  </div>

                  {/* Project side */}
                  <div className="bg-white p-4">
                    {project ? (
                      <ProjectCard
                        project={project}
                        onOpen={
                          openProjectGallery
                        }
                      />
                    ) : null}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="grid grid-cols-2 gap-px border-t border-[#DCE2EA]">
              <div className="flex min-h-[250px] items-center justify-center bg-white p-6 text-center">
                <p className="text-[12px] font-bold text-slate-500">
                  لا توجد تقييمات منشورة لهذا الكورس بعد.
                </p>
              </div>

              <div className="flex min-h-[250px] items-center justify-center bg-white p-6 text-center">
                <p className="text-[12px] font-bold text-slate-500">
                  لا توجد مشاريع منشورة لهذا الكورس بعد.
                </p>
              </div>
            </div>
          )}
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