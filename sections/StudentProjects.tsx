"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  ArrowRight,
  Building2,
  ChevronLeft,
  ChevronRight,
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

type Locale = "ar" | "en";

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

const labels = {
  ar: {
    all: "الكل",
  
    previous: "المشاريع السابقة",
    next: "المشاريع التالية",
    featured: "مشروع مميز",
    images: "صور",
    empty: "لا توجد مشاريع منشورة في هذا التصنيف بعد.",
    projectNext: "مشروعك القادم قد يكون هنا",
    projectNextDescription:
      "طبّق ما تتعلمه، وارفع مشروعك ليصبح جزءًا من معرض صناع المسار.",
    explore: "استكشف الرحلات",
    goToProject: "الانتقال إلى المشروع",
  },
  en: {
    all: "All",
   
    previous: "Previous projects",
    next: "Next projects",
    featured: "Featured Project",
    images: "Images",
    empty: "No published projects are available in this category yet.",
    projectNext: "Your next project could be here",
    projectNextDescription:
      "Apply what you learn and showcase your project as part of the Masar Makers gallery.",
    explore: "Explore Journeys",
    goToProject: "Go to project",
  },
} as const;

const categoryStyles: Record<
  Exclude<ProjectCategory, "الكل">,
  string
> = {
  "Civil 3D": "bg-[#1E66D0] text-white",
  CSD: "bg-[#7DBB37] text-white",
  Deliverables: "bg-[#F29B2D] text-[#07152E]",
  "Vehicle Tracking": "bg-[#7455C6] text-white",
  BIM: "bg-[#12A4B7] text-white",
};

function getProjectImages(
  project: HomeProject,
): string[] {
  const images = Array.isArray(project.images)
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
  const [projects, setProjects] =
    useState<HomeProject[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [selectedProject, setSelectedProject] =
    useState<ProjectGalleryData | null>(null);

  const [activeCategory, setActiveCategory] =
    useState<ProjectCategory>("الكل");

  const [startIndex, setStartIndex] =
    useState(0);

  const [visibleCount, setVisibleCount] =
    useState(2);

  const [locale, setLocale] =
    useState<Locale>("ar");

  useEffect(() => {
    const savedLocale =
      window.localStorage.getItem(
        "masar-locale",
      ) as Locale | null;

    if (
      savedLocale === "ar" ||
      savedLocale === "en"
    ) {
      setLocale(savedLocale);
    }

    const handleLocaleChange = (
      event: Event,
    ) => {
      const customEvent =
        event as CustomEvent<{
          locale?: Locale;
        }>;

      const nextLocale =
        customEvent.detail?.locale;

      if (
        nextLocale === "ar" ||
        nextLocale === "en"
      ) {
        setLocale(nextLocale);
      }
    };

    window.addEventListener(
      "masar:locale-change",
      handleLocaleChange,
    );

    return () => {
      window.removeEventListener(
        "masar:locale-change",
        handleLocaleChange,
      );
    };
  }, []);

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

  const text = labels[locale];
  const isArabic = locale === "ar";
  const DirectionArrow =
    isArabic ? ArrowLeft : ArrowRight;

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
    setStartIndex(0);
  }, [activeCategory]);

  useEffect(() => {
    const updateVisibleCount = () => {
      const width = window.innerWidth;

      if (width >= 1280) {
        setVisibleCount(4);
      } else if (width >= 1024) {
        setVisibleCount(3);
      } else {
        setVisibleCount(2);
      }
    };

    updateVisibleCount();

    window.addEventListener("resize", updateVisibleCount);

    return () => {
      window.removeEventListener("resize", updateVisibleCount);
    };
  }, []);

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

  const carouselProjects = useMemo(() => {
    if (visibleProjects.length === 0) {
      return [];
    }

    const count = Math.min(
      visibleCount,
      visibleProjects.length,
    );

    return Array.from(
      { length: count },
      (_, index) =>
        visibleProjects[
          (startIndex + index) %
            visibleProjects.length
        ],
    );
  }, [
    visibleCount,
    visibleProjects,
    startIndex,
  ]);

  const nextProjects = () => {
    if (visibleProjects.length <= 1) {
      return;
    }

    setStartIndex(
      (current) =>
        (current + 1) %
        visibleProjects.length,
    );
  };

  const previousProjects = () => {
    if (visibleProjects.length <= 1) {
      return;
    }

    setStartIndex(
      (current) =>
        (current -
          1 +
          visibleProjects.length) %
        visibleProjects.length,
    );
  };

  const categoryLabel = (
    category: ProjectCategory,
  ) =>
    category === "الكل"
      ? text.all
      : category;

  return (
    <>
      <section
        id="student-projects"
        dir={isArabic ? "rtl" : "ltr"}
        className="w-full bg-[#F7F8FA] py-2 sm:py-2.5 lg:py-3"
      >
        <div className="mx-auto w-full max-w-[1580px] px-3 sm:px-4 md:px-5 lg:px-6">
          {/* Filters */}
          <div className="mb-2 flex items-center justify-between gap-2 sm:mb-2.5 lg:mb-3">
            <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-2">
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
                    className={`shrink-0 rounded-full px-2.5 py-1.5 text-[9px] font-black transition duration-300 sm:px-3 sm:text-[10px] lg:px-3.5 lg:text-[11px] ${
                      activeCategory ===
                      category
                        ? "bg-[#07152E] text-white shadow-md"
                        : "border border-[#DCE3EC] bg-white text-slate-600 hover:border-[#F7B548] hover:text-[#07152E]"
                    }`}
                  >
                    {categoryLabel(
                      category,
                    )}
                  </button>
                ),
              )}
            </div>

            {/* Slider controls - same style as Popular Courses / Success Stories */}
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                onClick={previousProjects}
                aria-label={text.previous}
                disabled={
                  visibleProjects.length <= 1 ||
                  isLoading
                }
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[#DCE3EC] bg-white text-[#07152E] shadow-sm transition duration-300 hover:border-[#F7B548] hover:bg-[#F7B548] disabled:cursor-not-allowed disabled:opacity-40 sm:h-9 sm:w-9"
              >
                {isArabic ? (
                  <ChevronRight className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
                ) : (
                  <ChevronLeft className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
                )}
              </button>

              <button
                type="button"
                onClick={nextProjects}
                aria-label={text.next}
                disabled={
                  visibleProjects.length <= 1 ||
                  isLoading
                }
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[#DCE3EC] bg-white text-[#07152E] shadow-sm transition duration-300 hover:border-[#F7B548] hover:bg-[#F7B548] disabled:cursor-not-allowed disabled:opacity-40 sm:h-9 sm:w-9"
              >
                {isArabic ? (
                  <ChevronLeft className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
                ) : (
                  <ChevronRight className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
                )}
              </button>
            </div>
          </div>

          {/* Projects Slider */}
          {isLoading ? (
            <div
              className={`grid h-[220px] gap-2.5 sm:h-[230px] sm:gap-3 lg:h-[240px] ${
                visibleCount === 4
                  ? "grid-cols-4"
                  : visibleCount === 3
                    ? "grid-cols-3"
                    : "grid-cols-2"
              }`}
            >
              {Array.from({
                length: visibleCount,
              }).map((_, index) => (
                <div
                  key={index}
                  className="h-full animate-pulse rounded-[18px] bg-slate-200"
                />
              ))}
            </div>
          ) : visibleProjects.length > 0 ? (
            <div className="relative">
             <div
  className={`mx-auto grid h-[220px] justify-center gap-2.5 sm:h-[230px] sm:gap-3 lg:h-[240px] ${
    carouselProjects.length === 1
      ? "w-full max-w-[380px] grid-cols-1"
      : carouselProjects.length === 2
        ? "w-full max-w-[760px] grid-cols-2"
        : carouselProjects.length === 3
          ? "w-full max-w-[1100px] grid-cols-3"
          : "w-full grid-cols-4"
  }`}
>
                {carouselProjects.map(
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
                        className="group relative h-[214px] w-full cursor-pointer overflow-hidden rounded-[18px] bg-[#07152E] shadow-[0_12px_30px_rgba(7,21,46,0.10)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(7,21,46,0.18)] focus:outline-none focus:ring-2 focus:ring-[#F7B548] sm:h-[224px] sm:rounded-[20px] lg:h-[234px]"
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
                              className="absolute inset-0 h-full w-full scale-110 object-cover opacity-45 blur-xl"
                            />

                            <div className="absolute inset-0 bg-[#07152E]/20" />

                            <img
                              src={
                                project.image
                              }
                              alt={
                                project.title
                              }
                              loading="lazy"
                              decoding="async"
                              className="absolute inset-0 h-full w-full object-contain [image-rendering:auto] transition-transform duration-500 group-hover:scale-[1.015]"
                            />
                          </>
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-slate-200">
                            <ImageIcon className="h-8 w-8 text-slate-400 sm:h-9 sm:w-9" />
                          </div>
                        )}

                        {/* Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#07152E]/95 via-[#07152E]/15 to-transparent transition duration-500 group-hover:via-[#07152E]/34" />

                        {/* Category */}
                        <span
                          className={`absolute top-2 rounded-full px-2 py-1 text-[7.5px] font-black shadow-md sm:top-2.5 sm:px-2.5 sm:text-[8.5px] lg:text-[9px] ${
                            isArabic
                              ? "right-2 sm:right-2.5"
                              : "left-2 sm:left-2.5"
                          } ${
                            categoryStyles[
                              project.category
                            ]
                          }`}
                        >
                          {project.category}
                        </span>

                        {/* Featured */}
                        {project.featured ? (
                          <span
                            className={`absolute top-2 rounded-full bg-[#F7B548] px-2 py-1 text-[7.5px] font-black text-[#07152E] shadow-md sm:top-2.5 sm:px-2.5 sm:text-[8.5px] lg:text-[9px] ${
                              isArabic
                                ? "left-2 sm:left-2.5"
                                : "right-2 sm:right-2.5"
                            }`}
                          >
                            {text.featured}
                          </span>
                        ) : null}

                        {/* Images Count */}
                        {projectImages.length >
                        1 ? (
                          <span
                            className={`absolute top-9 rounded-full bg-black/65 px-2 py-1 text-[7px] font-black text-white backdrop-blur sm:top-10 sm:text-[8px] ${
                              isArabic
                                ? "left-2 sm:left-2.5"
                                : "right-2 sm:right-2.5"
                            }`}
                          >
                            {
                              projectImages.length
                            }{" "}
                            {text.images}
                          </span>
                        ) : null}

                        {/* Video */}
                        {project.video ? (
                          <div className="absolute left-1/2 top-[44%] flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-white/20 text-white backdrop-blur-md transition duration-300 group-hover:scale-110 sm:h-10 sm:w-10">
                            <Play
                              className="h-4 w-4 sm:h-[18px] sm:w-[18px]"
                              fill="currentColor"
                            />
                          </div>
                        ) : null}

                        {/* Content */}
                        <div className="absolute inset-x-0 bottom-0 z-10 p-2.5 sm:p-3 lg:p-3.5">
                          <div className="translate-y-0.5 transition-transform duration-300 group-hover:translate-y-0">
                            <p
                              className={`line-clamp-1 font-black leading-tight text-white ${
                                isArabic
                                  ? "text-[13px] sm:text-[15px] lg:text-[17px]"
                                  : "text-[12px] sm:text-[14px] lg:text-[16px]"
                              }`}
                            >
                              {project.software}
                            </p>

                            {project.description ? (
                              <p
                                className={`mt-1 line-clamp-1 font-medium text-slate-200 opacity-0 transition duration-300 group-hover:opacity-100 ${
                                  isArabic
                                    ? "text-[7.5px] leading-[1.4] sm:text-[8.5px]"
                                    : "text-[7px] leading-[1.35] sm:text-[8px]"
                                }`}
                              >
                                {
                                  project.description
                                }
                              </p>
                            ) : null}

                            <div className="mt-1.5 flex min-w-0 items-center gap-2 text-[7px] font-bold text-slate-300 sm:mt-2 sm:text-[8px] lg:text-[9px]">
                              <span className="flex min-w-0 items-center gap-1">
                                <Building2 className="h-3 w-3 shrink-0 text-[#F7B548]" />

                                <span className="truncate">
                                  {
                                    project.student
                                  }
                                </span>
                              </span>

                              {project.country ? (
                                <span className="flex shrink-0 items-center gap-1">
                                  <MapPin className="h-3 w-3 text-[#F7B548]" />

                                  {
                                    project.country
                                  }
                                </span>
                              ) : null}
                            </div>
                          </div>

                          <span
                            className={`absolute bottom-2.5 flex h-7 w-7 translate-y-2 items-center justify-center rounded-full bg-white text-[#07152E] opacity-0 shadow-lg transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 sm:h-8 sm:w-8 ${
                              isArabic
                                ? "left-2.5 sm:left-3"
                                : "right-2.5 sm:right-3"
                            }`}
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </span>
                        </div>

                        <div className="pointer-events-none absolute inset-0 rounded-[18px] border border-white/15 transition group-hover:border-[#F7B548]/70 sm:rounded-[20px]" />
                      </article>
                    );
                  },
                )}
              </div>

              {/* Slider Dots */}
              {visibleProjects.length >
              1 ? (
                <div
                  dir="ltr"
                  className="mt-1.5 flex items-center justify-center gap-1.5 sm:mt-2"
                >
                  {visibleProjects.map(
                    (project, index) => (
                      <button
                        key={`project-dot-${project.id}`}
                        type="button"
                        aria-label={`${text.goToProject} ${
                          index + 1
                        }`}
                        onClick={() =>
                          setStartIndex(index)
                        }
                        className={`h-[5px] rounded-full transition-all duration-300 ${
                          index ===
                          startIndex
                            ? "w-7 bg-[#F7B548]"
                            : "w-[5px] bg-slate-300 hover:bg-slate-400"
                        }`}
                      />
                    ),
                  )}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="flex h-[210px] items-center justify-center rounded-[20px] border border-dashed border-[#D6DEE8] bg-white text-center sm:h-[220px]">
              <div>
                <ImageIcon className="mx-auto h-8 w-8 text-slate-300 sm:h-9 sm:w-9" />

                <p className="mt-2 text-[10px] font-black text-[#07152E] sm:text-[11px] lg:text-[12px]">
                  {text.empty}
                </p>
              </div>
            </div>
          )}

          {/* Bottom Message */}
          <div className="mt-2 flex min-h-[48px] items-center justify-between gap-2 rounded-[16px] border border-[#E0E6EE] bg-white px-3 py-2 shadow-[0_8px_24px_rgba(7,21,46,0.04)] sm:px-4 lg:min-h-[52px]">
            <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#FFF6DF] text-[#D49319] sm:h-9 sm:w-9">
                <Route className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
              </div>

              <div className="min-w-0">
                <p
                  className={`font-black text-[#07152E] ${
                    isArabic
                      ? "text-[10px] sm:text-[11px] lg:text-[12px]"
                      : "text-[9px] sm:text-[10px] lg:text-[11px]"
                  }`}
                >
                  {text.projectNext}
                </p>

                <p
                  className={`mt-0.5 line-clamp-1 font-medium text-slate-500 ${
                    isArabic
                      ? "text-[8px] sm:text-[9px] lg:text-[10px]"
                      : "text-[7.5px] sm:text-[8.5px] lg:text-[9.5px]"
                  }`}
                >
                  {
                    text.projectNextDescription
                  }
                </p>
              </div>
            </div>

            <AuthLink
              href="/career-path/road-design"
              className="hidden shrink-0 items-center gap-1.5 rounded-xl bg-[#07152E] px-3 py-2 text-[9px] font-black text-white transition hover:bg-[#F7B548] hover:text-[#07152E] md:flex lg:px-4 lg:text-[10px]"
            >
              {text.explore}

              <DirectionArrow className="h-3.5 w-3.5" />
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