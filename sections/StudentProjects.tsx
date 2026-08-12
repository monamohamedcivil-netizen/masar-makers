"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ArrowLeft,
  ArrowRight,
  Building2,
  ExternalLink,
  ImageIcon,
  MapPin,
  Play,
  Route,
} from "lucide-react";

import AuthLink from "@/components/AuthLink";

import ProjectGalleryModal, {
  type ProjectGalleryData,
} from "@/components/projects/ProjectGalleryModal";

import {
  getHomeProjects,
  type HomeProject,
} from "@/lib/projects/home-projects";

type ProjectCategory =
  | "الكل"
  | "Civil 3D"
  | "CSD"
  | "Deliverables"
  | "Vehicle Tracking"
  | "BIM";

const categories: ProjectCategory[] = [
  "الكل",
  "Civil 3D",
  "CSD",
  "Deliverables",
  "Vehicle Tracking",
  "BIM",
];

const categoryStyles: Record<
  Exclude<ProjectCategory, "الكل">,
  string
> = {
  "Civil 3D": "bg-[#1E66D0] text-white",
  CSD: "bg-[#7DBB37] text-white",
  Deliverables:
    "bg-[#F29B2D] text-[#07152E]",
  "Vehicle Tracking":
    "bg-[#7455C6] text-white",
  BIM: "bg-[#12A4B7] text-white",
};

function getProjectImages(
  project: HomeProject,
): string[] {
  const images = Array.isArray(
    project.images,
  )
    ? project.images
    : [];

  return Array.from(
    new Set(
      [...images, project.image]
        .map((image) =>
          typeof image === "string"
            ? image.trim()
            : "",
        )
        .filter(Boolean),
    ),
  );
}

export default function StudentProjects() {
  const [projects, setProjects] = useState<
    HomeProject[]
  >([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [
    selectedProject,
    setSelectedProject,
  ] =
    useState<ProjectGalleryData | null>(
      null,
    );

  const [activeCategory, setActiveCategory] =
    useState<ProjectCategory>("الكل");

  const [activeProjectIndex, setActiveProjectIndex] =
    useState(0);

  const sliderRef =
    useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let active = true;

    async function loadProjects() {
      try {
        const result =
          await getHomeProjects();

        if (active) {
          setProjects(result);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadProjects();

    return () => {
      active = false;
    };
  }, []);

  const visibleProjects = useMemo(() => {
    if (activeCategory === "الكل") {
      return projects;
    }

    return projects.filter(
      (project) =>
        project.category ===
        activeCategory,
    );
  }, [activeCategory, projects]);

  useEffect(() => {
    setActiveProjectIndex(0);

    requestAnimationFrame(() => {
      const slider = sliderRef.current;

      if (slider) {
        slider.scrollTo({
          left: slider.scrollWidth,
          behavior: "smooth",
        });
      }
    });
  }, [activeCategory]);

  const openProjectGallery = (
    project: HomeProject,
  ) => {
    setSelectedProject({
      id: project.id,
      title: project.title,
      description: project.description,
      studentName: project.student,
      studentCountry: project.country,
      courseTitle: project.software,
      images: getProjectImages(project),
      projectLink: project.projectLink,
    });
  };

  const scrollToProject = (
    targetIndex: number,
  ) => {
    const slider = sliderRef.current;

    if (!slider) {
      return;
    }

    const cards = Array.from(
      slider.querySelectorAll<HTMLElement>(
        "[data-project-card]",
      ),
    );

    if (cards.length === 0) {
      return;
    }

    const normalizedIndex =
      targetIndex < 0
        ? cards.length - 1
        : targetIndex >= cards.length
          ? 0
          : targetIndex;

    cards[normalizedIndex]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });

    setActiveProjectIndex(normalizedIndex);
  };

  const handleSliderScroll = () => {
    const slider = sliderRef.current;

    if (!slider) {
      return;
    }

    const cards = Array.from(
      slider.querySelectorAll<HTMLElement>(
        "[data-project-card]",
      ),
    );

    if (cards.length === 0) {
      return;
    }

    const sliderRect =
      slider.getBoundingClientRect();

    const sliderCenter =
      sliderRect.left +
      sliderRect.width / 2;

    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    cards.forEach((card, index) => {
      const cardRect =
        card.getBoundingClientRect();

      const cardCenter =
        cardRect.left +
        cardRect.width / 2;

      const distance = Math.abs(
        cardCenter - sliderCenter,
      );

      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    setActiveProjectIndex(closestIndex);
  };

  return (
    <>
      <section
        id="student-projects"
        dir="rtl"
        className="w-full bg-[#F7F8FA] px-4 py-3 sm:px-6"
      >
        <div className="mx-auto max-w-[1580px]">
          {/* Filters */}
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {categories.map(
                (category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() =>
                      setActiveCategory(
                        category,
                      )
                    }
                    className={`rounded-full px-4 py-2 text-[12px] font-black transition duration-300 ${
                      activeCategory ===
                      category
                        ? "bg-[#07152E] text-white shadow-md"
                        : "border border-[#DCE3EC] bg-white text-slate-600 hover:border-[#F7B548] hover:text-[#07152E]"
                    }`}
                  >
                    {category}
                  </button>
                ),
              )}
            </div>

            <button
              type="button"
              className="group hidden shrink-0 items-center gap-2 text-[13px] font-black text-[#07152E] transition hover:text-[#D49319] lg:flex"
            >
              عرض معرض المشاريع

              <ArrowLeft
                size={17}
                className="transition-transform duration-300 group-hover:-translate-x-1"
              />
            </button>
          </div>

          {/* Projects Slider */}
          {isLoading ? (
            <div className="flex h-[290px] gap-4 overflow-hidden">
              {Array.from({
                length: 4,
              }).map((_, index) => (
                <div
                  key={index}
                  className="h-full min-w-[280px] animate-pulse rounded-[24px] bg-slate-200 sm:min-w-[310px] lg:min-w-[325px]"
                />
              ))}
            </div>
          ) : visibleProjects.length > 0 ? (
            <div className="relative">
              {/* Previous Arrow */}
              {visibleProjects.length > 1 ? (
                <button
                  type="button"
                  aria-label="المشاريع السابقة"
                  onClick={() =>
                    scrollToProject(
                      activeProjectIndex - 1,
                    )
                  }
                  className="absolute -right-3 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/50 bg-[#07152E] text-white shadow-[0_8px_24px_rgba(7,21,46,0.25)] transition hover:scale-105 hover:bg-[#F7B548] hover:text-[#07152E] sm:-right-5"
                >
                  <ArrowRight size={19} />
                </button>
              ) : null}

              {/* Next Arrow */}
              {visibleProjects.length > 1 ? (
                <button
                  type="button"
                  aria-label="المشاريع التالية"
                  onClick={() =>
                    scrollToProject(
                      activeProjectIndex + 1,
                    )
                  }
                  className="absolute -left-3 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/50 bg-[#07152E] text-white shadow-[0_8px_24px_rgba(7,21,46,0.25)] transition hover:scale-105 hover:bg-[#F7B548] hover:text-[#07152E] sm:-left-5"
                >
                  <ArrowLeft size={19} />
                </button>
              ) : null}

              <div
                ref={sliderRef}
                onScroll={handleSliderScroll}
                className="flex h-[290px] snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {visibleProjects.map(
                  (project) => {
                    const projectImages =
                      getProjectImages(
                        project,
                      );

                    return (
                      <article
                        key={`${activeCategory}-${project.id}`}
                        data-project-card
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
                        className="group relative h-[275px] min-w-[270px] snap-center cursor-pointer overflow-hidden rounded-[24px] bg-[#07152E] shadow-[0_14px_36px_rgba(7,21,46,0.10)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_48px_rgba(7,21,46,0.20)] focus:outline-none focus:ring-2 focus:ring-[#F7B548] sm:min-w-[300px] lg:min-w-[315px] xl:min-w-[325px]"
                      >
                        {/* Blurred Background */}
                        {project.image ? (
                          <>
                            <img
                              src={
                                project.image
                              }
                              alt=""
                              aria-hidden="true"
                              loading="lazy"
                              decoding="async"
                              className="absolute inset-0 h-full w-full scale-110 object-cover opacity-50 blur-xl"
                            />

                            <div className="absolute inset-0 bg-[#07152E]/25" />

                            {/* Main Image */}
                            <img
                              src={
                                project.image
                              }
                              alt={
                                project.title
                              }
                              loading="lazy"
                              decoding="async"
                              className="absolute inset-0 h-full w-full object-contain transition-transform duration-500 group-hover:scale-[1.025]"
                            />
                          </>
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-slate-200">
                            <ImageIcon className="h-10 w-10 text-slate-400" />
                          </div>
                        )}

                        {/* Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#07152E]/95 via-[#07152E]/20 to-transparent transition duration-500 group-hover:via-[#07152E]/38" />

                        {/* Category */}
                        <span
                          className={`absolute right-3 top-3 rounded-full px-3 py-1.5 text-[10px] font-black shadow-md ${
                            categoryStyles[
                              project.category
                            ]
                          }`}
                        >
                          {project.category}
                        </span>

                        {/* Featured */}
                        {project.featured ? (
                          <span className="absolute left-3 top-3 rounded-full bg-[#F7B548] px-3 py-1.5 text-[10px] font-black text-[#07152E] shadow-md">
                            مشروع مميز
                          </span>
                        ) : null}

                        {/* Images Count */}
                        {projectImages.length >
                        1 ? (
                          <span className="absolute left-3 top-12 rounded-full bg-black/65 px-2.5 py-1 text-[9px] font-black text-white backdrop-blur">
                            {
                              projectImages.length
                            }{" "}
                            صور
                          </span>
                        ) : null}

                        {/* Video */}
                        {project.video ? (
                          <div className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-white/20 text-white backdrop-blur-md transition duration-300 group-hover:scale-110">
                            <Play
                              size={20}
                              fill="currentColor"
                            />
                          </div>
                        ) : null}

                        {/* Content */}
                        <div className="absolute inset-x-0 bottom-0 z-10 p-4">
                          <div className="translate-y-1 transition-transform duration-300 group-hover:translate-y-0">
                            <h3 className="line-clamp-1 text-[17px] font-black leading-tight text-white">
                              {
                                project.title
                              }
                            </h3>

                            <p className="mt-1 text-[11px] font-bold text-[#F7B548]">
                              {
                                project.software
                              }
                            </p>

                            {project.description ? (
                              <p className="mt-2 line-clamp-2 text-[10px] font-medium leading-5 text-slate-200 opacity-0 transition duration-300 group-hover:opacity-100">
                                {
                                  project.description
                                }
                              </p>
                            ) : null}

                            <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] font-bold text-slate-300">
                              <span className="flex min-w-0 items-center gap-1.5">
                                <Building2
                                  size={13}
                                  className="shrink-0 text-[#F7B548]"
                                />

                                <span className="truncate">
                                  {
                                    project.student
                                  }
                                </span>
                              </span>

                              {project.country ? (
                                <span className="flex items-center gap-1.5">
                                  <MapPin
                                    size={13}
                                    className="text-[#F7B548]"
                                  />

                                  {
                                    project.country
                                  }
                                </span>
                              ) : null}
                            </div>
                          </div>

                          <span className="absolute bottom-4 left-4 flex h-9 w-9 translate-y-3 items-center justify-center rounded-full bg-white text-[#07152E] opacity-0 shadow-lg transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                            <ExternalLink
                              size={16}
                            />
                          </span>
                        </div>

                        <div className="pointer-events-none absolute inset-0 rounded-[24px] border border-white/15 transition group-hover:border-[#F7B548]/70" />
                      </article>
                    );
                  },
                )}
              </div>

              {/* Slider Dots */}
              {visibleProjects.length > 1 ? (
                <div
                  dir="ltr"
                  className="mt-2 flex items-center justify-center gap-2"
                >
                  {visibleProjects.map(
                    (project, index) => (
                      <button
                        key={`project-dot-${project.id}`}
                        type="button"
                        aria-label={`الانتقال إلى المشروع ${
                          index + 1
                        }`}
                        onClick={() =>
                          scrollToProject(
                            index,
                          )
                        }
                        className={`h-2 rounded-full transition-all duration-300 ${
                          index ===
                          activeProjectIndex
                            ? "w-8 bg-[#F7B548]"
                            : "w-2 bg-slate-300 hover:bg-slate-400"
                        }`}
                      />
                    ),
                  )}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="flex h-[275px] items-center justify-center rounded-[26px] border border-dashed border-[#D6DEE8] bg-white text-center">
              <div>
                <ImageIcon className="mx-auto h-10 w-10 text-slate-300" />

                <p className="mt-3 text-[13px] font-black text-[#07152E]">
                  لا توجد مشاريع منشورة في
                  هذا التصنيف بعد.
                </p>
              </div>
            </div>
          )}

          {/* Bottom Message */}
          <div className="mt-2 flex min-h-[55px] items-center justify-between gap-4 rounded-[18px] border border-[#E0E6EE] bg-white px-5 py-2 shadow-[0_8px_24px_rgba(7,21,46,0.04)]">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FFF6DF] text-[#D49319]">
                <Route size={21} />
              </div>

              <div>
                <p className="text-[14px] font-black text-[#07152E]">
                  مشروعك القادم قد يكون هنا
                </p>

                <p className="text-[11px] font-medium text-slate-500">
                  طبّق ما تتعلمه، وارفع
                  مشروعك ليصبح جزءًا من معرض
                  صناع المسار.
                </p>
              </div>
            </div>

            <AuthLink href="/career-path/road">
              <button
                type="button"
                className="hidden items-center gap-2 rounded-xl bg-[#07152E] px-5 py-2.5 text-[12px] font-black text-white transition hover:bg-[#F7B548] hover:text-[#07152E] md:flex"
              >
                استكشف الرحلات

                <ArrowLeft size={16} />
              </button>
            </AuthLink>
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