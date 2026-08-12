"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Eye,
  FolderKanban,
  ImageIcon,
  Loader2,
  Pencil,
  Plus,
  Route,
  Trash2,
  X,
} from "lucide-react";

import type {
  StudentDashboardData,
  StudentPathStationProgress,
} from "@/lib/queries/student-dashboard";
import type {
  StudentProject,
} from "@/lib/projects/types";

import {
  getStudentProjects,
} from "@/lib/projects/student-projects";
import {
  deleteProject,
} from "@/lib/projects/delete-project";

import ProjectDialog from "../projects/ProjectDialog";

type Props = {
  data: StudentDashboardData;
};

export default function ProjectsPanel({
  data,
}: Props) {
  const [dialogOpen, setDialogOpen] =
    useState(false);
    const [dialogMode, setDialogMode] =
useState<"create" | "edit">(
    "create",
);

const [editingProject, setEditingProject] =
useState<StudentProject | null>(
    null,
);
  const [loading, setLoading] =
    useState(true);
  const [errorMessage, setErrorMessage] =
    useState("");
  const [projects, setProjects] = useState<
    StudentProject[]
  >([]);
  const [activePathId, setActivePathId] =
    useState("");
  const [activeCourseId, setActiveCourseId] =
    useState("");
  const [viewedProject, setViewedProject] =
    useState<StudentProject | null>(null);
  const [activeImageIndex, setActiveImageIndex] =
    useState(0);
  const [deletingProject, setDeletingProject] =
    useState<StudentProject | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] =
    useState(false);
  const [deleteError, setDeleteError] =
    useState("");

  const paths = useMemo(
    () =>
      (data.careerPaths ?? [])
        .map((path) => ({
          ...path,
          stations: path.stations.filter(
            (station) =>
              station.isEnrolled &&
              station.status !== "pending" &&
              Boolean(station.courseId),
          ),
        }))
        .filter(
          (path) => path.stations.length > 0,
        ),
    [data.careerPaths],
  );

  const loadProjects = useCallback(
    async () => {
      setLoading(true);
      setErrorMessage("");

      try {
        const studentProjects =
          await getStudentProjects();

        setProjects(studentProjects);
      } catch (error) {
        console.error(
          "Failed to load student projects:",
          error,
        );

        setProjects([]);
        setErrorMessage(
          "تعذر تحميل مشاريعك حاليًا. يرجى المحاولة مرة أخرى.",
        );
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    setActivePathId((currentPathId) => {
      const currentPathStillExists =
        paths.some(
          (path) =>
            path.pathId === currentPathId,
        );

      if (currentPathStillExists) {
        return currentPathId;
      }

      return paths[0]?.pathId ?? "";
    });
  }, [paths]);

  const activePath = useMemo(
    () =>
      paths.find(
        (path) =>
          path.pathId === activePathId,
      ) ?? paths[0],
    [paths, activePathId],
  );

  useEffect(() => {
    if (!activePath) {
      setActiveCourseId("");
      return;
    }

    const activeCourseStillExists =
      activePath.stations.some(
        (station) =>
          station.courseId ===
          activeCourseId,
      );

    if (!activeCourseStillExists) {
      setActiveCourseId(
        activePath.stations[0]?.courseId ??
          "",
      );
    }
  }, [activePath, activeCourseId]);

  const activeCourse = useMemo(
    () =>
      activePath?.stations.find(
        (station) =>
          station.courseId ===
          activeCourseId,
      ) ?? activePath?.stations[0],
    [activePath, activeCourseId],
  );

  const activeCourseProjects = useMemo(
    () => {
      if (!activeCourse) {
        return [];
      }

      return projects.filter(
        (project) =>
          project.courseId ===
          activeCourse.courseId,
      );
    },
    [projects, activeCourse],
  );

  function getCourseProjectsCount(
    courseId: string,
  ) {
    return projects.filter(
      (project) =>
        project.courseId === courseId,
    ).length;
  }

  function getPathProjectsCount(
    stations: StudentPathStationProgress[],
  ) {
    const courseIds = new Set(
      stations.map(
        (station) => station.courseId,
      ),
    );

    return projects.filter((project) =>
      courseIds.has(project.courseId),
    ).length;
  }

  function handlePathChange(pathId: string) {
    const selectedPath = paths.find(
      (path) => path.pathId === pathId,
    );

    setActivePathId(pathId);
    setActiveCourseId(
      selectedPath?.stations[0]?.courseId ??
        "",
    );
  }

  function handleDialogClose() {
   setDialogOpen(false);

setEditingProject(null);

setDialogMode("create");
    void loadProjects();
  }

  function openProjectViewer(
    project: StudentProject,
  ) {
    setViewedProject(project);
    setActiveImageIndex(0);
  }

  function closeProjectViewer() {
    setViewedProject(null);
    setActiveImageIndex(0);
  }

  function openDeleteConfirmation(
    project: StudentProject,
  ) {
    setDeleteError("");
    setDeletingProject(project);
  }

  function closeDeleteConfirmation() {
    if (deleteSubmitting) {
      return;
    }

    setDeleteError("");
    setDeletingProject(null);
  }

  async function handleDeleteProject() {
    if (!deletingProject) {
      return;
    }

    setDeleteSubmitting(true);
    setDeleteError("");

    try {
      const result = await deleteProject(
        deletingProject.id,
      );

      if (!result.success) {
        setDeleteError(
          result.message ||
            "تعذر حذف المشروع.",
        );
        return;
      }

      setProjects((currentProjects) =>
        currentProjects.filter(
          (project) =>
            project.id !==
            deletingProject.id,
        ),
      );

      if (
        viewedProject?.id ===
        deletingProject.id
      ) {
        closeProjectViewer();
      }

      setDeletingProject(null);
    } catch (error) {
      console.error(
        "Failed to delete project:",
        error,
      );

      setDeleteError(
        "حدث خطأ غير متوقع أثناء حذف المشروع.",
      );
    } finally {
      setDeleteSubmitting(false);
    }
  }

  function showPreviousImage() {
    if (!viewedProject?.images.length) {
      return;
    }

    setActiveImageIndex((currentIndex) =>
      currentIndex === 0
        ? viewedProject.images.length - 1
        : currentIndex - 1,
    );
  }

  function showNextImage() {
    if (!viewedProject?.images.length) {
      return;
    }

    setActiveImageIndex((currentIndex) =>
      currentIndex ===
      viewedProject.images.length - 1
        ? 0
        : currentIndex + 1,
    );
  }

  if (loading) {
    return (
      <div
        className="flex min-h-[420px] items-center justify-center"
        dir="rtl"
      >
        <div className="text-center">
          <Loader2 className="mx-auto h-9 w-9 animate-spin text-[#F7B548]" />
          <p className="mt-4 text-sm font-medium text-slate-500">
            جاري تحميل معرض أعمالك...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="space-y-6"
      dir="rtl"
    >
      {errorMessage && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
          {errorMessage}
        </div>
      )}

      {!errorMessage &&
        paths.length === 0 && (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <FolderKanban className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="mt-5 text-lg font-bold text-[#07152E]">
              لا توجد كورسات متاحة للمشاريع
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-slate-500">
              ستظهر هنا الكورسات التي تم تفعيل
              اشتراكك بها، وبعد ذلك يمكنك إضافة
              مشاريعك وأعمالك الهندسية.
            </p>
          </div>
        )}

      {!errorMessage &&
        paths.length > 0 && (
          <>
            <section className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex flex-wrap gap-2">
                {paths.map((path) => {
                  const isActive =
                    path.pathId ===
                    activePath?.pathId;
                  const projectsCount =
                    getPathProjectsCount(
                      path.stations,
                    );

                  return (
                    <button
                      key={path.pathId}
                      type="button"
                      onClick={() =>
                        handlePathChange(
                          path.pathId,
                        )
                      }
                      className={`flex min-h-12 items-center gap-3 rounded-2xl px-5 py-3 text-right transition ${
                        isActive
                          ? "bg-[#07152E] text-white shadow-md"
                          : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-[#07152E]"
                      }`}
                    >
                      <Route
                        className={`h-5 w-5 shrink-0 ${
                          isActive
                            ? "text-[#F7B548]"
                            : "text-slate-400"
                        }`}
                      />
                      <span>
                        <span className="block text-sm font-bold">
                          {path.title}
                        </span>
                        <span
                          className={`mt-0.5 block text-xs ${
                            isActive
                              ? "text-slate-300"
                              : "text-slate-400"
                          }`}
                        >
                          {path.stations.length}{" "}
                          كورسات
                          {" • "}
                          {projectsCount} مشاريع
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {activePath && (
              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-[#F7B548]" />
                  <h3 className="font-bold text-[#07152E]">
                    كورسات المسار
                  </h3>
                </div>

                <div className="flex gap-3 overflow-x-auto pb-2">
                  {activePath.stations.map(
                    (station) => {
                      const isActive =
                        station.courseId ===
                        activeCourse?.courseId;
                      const projectsCount =
                        getCourseProjectsCount(
                          station.courseId,
                        );

                      return (
                        <button
                          key={station.stationId}
                          type="button"
                          onClick={() =>
                            setActiveCourseId(
                              station.courseId,
                            )
                          }
                          className={`flex min-h-[112px] min-w-[210px] flex-col items-center justify-center rounded-2xl border px-4 py-4 text-center transition ${
                            isActive
                              ? "border-[#F7B548] bg-amber-50 shadow-sm"
                              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          <p
                            className={`line-clamp-2 text-sm font-bold ${
                              isActive
                                ? "text-[#07152E]"
                                : "text-slate-700"
                            }`}
                          >
                            {station.shortTitle ||
                              station.title}
                          </p>
                          <span
                            className={`mt-3 rounded-full px-3 py-1 text-xs font-semibold ${
                              projectsCount > 0
                                ? "bg-[#07152E] text-white"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {projectsCount > 0
                              ? `${projectsCount} مشروع`
                              : "لا توجد مشاريع"}
                          </span>
                        </button>
                      );
                    },
                  )}
                </div>
              </section>
            )}

            {activeCourse && (
              <section className="space-y-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-[#07152E]">
                      {activeCourse.shortTitle ||
                        activeCourse.title}
                    </h3>
                    <p className="mt-1 text-sm font-medium text-slate-500">
                      {activeCourseProjects.length >
                      0
                        ? `${activeCourseProjects.length} مشروع`
                        : "لا توجد مشاريع حتى الآن"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {

setEditingProject(null);

setDialogMode("create");

setDialogOpen(true);

}}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#07152E] px-5 text-sm font-semibold text-white transition hover:bg-[#0B2148]"
                  >
                    <Plus className="h-4 w-4" />
                    إضافة مشروع
                  </button>
                </div>

                {activeCourseProjects.length ===
                0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
                      <FolderKanban className="h-8 w-8 text-[#F7B548]" />
                    </div>
                    <h3 className="mt-5 text-lg font-bold text-[#07152E]">
                      لا توجد مشاريع لهذا الكورس
                    </h3>
                    <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-slate-500">
                      ابدأ ببناء معرض أعمالك
                      الهندسية وأضف أول مشروع قمت
                      بتنفيذه خلال هذا الكورس.
                    </p>
                    <button
                      type="button"
                     onClick={() => {
  setEditingProject(null);
  setDialogMode("create");
  setDialogOpen(true);
}}
                      className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#07152E] px-6 text-sm font-semibold text-white transition hover:bg-[#0B2148]"
                    >
                      <Plus className="h-4 w-4" />
                      إضافة أول مشروع
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {activeCourseProjects.map(
                      (project) => {
                        const coverImage =
                          project.images.find(
                            (image) =>
                              image.isCover,
                          ) ??
                          project.images[0];

                        return (
                          <article
                            key={project.id}
                            className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                          >
                            <button
                              type="button"
                              onClick={() =>
                                openProjectViewer(
                                  project,
                                )
                              }
                              className="relative block aspect-video w-full overflow-hidden bg-slate-100 text-right"
                            >
                              {coverImage?.imageUrl ? (
                                <img
                                  src={
                                    coverImage.imageUrl
                                  }
                                  alt={
                                    project.projectTitle
                                  }
                                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                />
                              ) : (
                                <span className="flex h-full items-center justify-center">
                                  <ImageIcon className="h-10 w-10 text-slate-300" />
                                </span>
                              )}
                              <span className="absolute right-3 top-3 rounded-full bg-slate-950/75 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                                {
                                  project.images
                                    .length
                                }{" "}
                                صور
                              </span>
                            </button>

                            <div className="p-5">
                              <h4 className="line-clamp-2 text-lg font-bold text-[#07152E]">
                                {
                                  project.projectTitle
                                }
                              </h4>

                              {project.projectDescription ? (
                                <p className="mt-2 line-clamp-3 min-h-[72px] text-sm leading-6 text-slate-500">
                                  {
                                    project.projectDescription
                                  }
                                </p>
                              ) : (
                                <p className="mt-2 min-h-[72px] text-sm leading-6 text-slate-400">
                                  لا يوجد وصف مضاف لهذا
                                  المشروع.
                                </p>
                              )}

                              <div className="mt-5 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4">
                                <button
                                  type="button"
                                  onClick={() =>
                                    openProjectViewer(
                                      project,
                                    )
                                  }
                                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#07152E] px-3 text-xs font-semibold text-white transition hover:bg-[#0B2148]"
                                >
                                  <Eye className="h-4 w-4" />
                                  عرض
                                </button>

                                <button
  type="button"
  onClick={() => {
    setEditingProject(project);
    setDialogMode("edit");
    setDialogOpen(true);
  }}
  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-[#07152E] transition hover:border-[#F7B548] hover:bg-amber-50"
>
  <Pencil className="h-4 w-4" />
  تعديل
</button>
                                
                                <button
                                  type="button"
                                  onClick={() =>
                                    openDeleteConfirmation(
                                      project,
                                    )
                                  }
                                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-100"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  حذف
                                </button>
                              </div>
                            </div>
                          </article>
                        );
                      },
                    )}
                  </div>
                )}
              </section>
            )}
          </>
        )}

     <ProjectDialog
open={dialogOpen}
onClose={handleDialogClose}
paths={paths}
initialCourseId={
activeCourse?.courseId ?? ""
}
mode={dialogMode}
project={editingProject}
/>


      {deletingProject && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/65 p-4"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeDeleteConfirmation();
            }
          }}
        >
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
              <Trash2 className="h-7 w-7 text-red-600" />
            </div>

            <h2 className="mt-5 text-xl font-bold text-[#07152E]">
              حذف المشروع
            </h2>

            <p className="mt-3 text-sm leading-7 text-slate-600">
              هل أنتِ متأكدة من حذف مشروع
              <span className="font-bold text-[#07152E]">
                {" "}
                {deletingProject.projectTitle}
              </span>
              ؟
            </p>

            <p className="mt-2 text-sm font-medium text-red-600">
              سيتم حذف المشروع وجميع صوره نهائيًا، ولا يمكن التراجع عن هذه العملية.
            </p>

            {deleteError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {deleteError}
              </div>
            )}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeDeleteConfirmation}
                disabled={deleteSubmitting}
                className="h-11 rounded-xl border border-slate-300 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                إلغاء
              </button>

              <button
                type="button"
                onClick={() => {
                  void handleDeleteProject();
                }}
                disabled={deleteSubmitting}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleteSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    جاري الحذف...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    حذف نهائي
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {viewedProject && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/75 p-4"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              closeProjectViewer();
            }
          }}
        >
          <div className="max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-[#07152E] sm:text-xl">
                  {viewedProject.projectTitle}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {
                    viewedProject.images
                      .length
                  }{" "}
                  صور
                </p>
              </div>

              <button
                type="button"
                onClick={closeProjectViewer}
                className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label="إغلاق"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(300px,0.8fr)]">
              <div>
                <div className="relative aspect-video overflow-hidden rounded-2xl bg-slate-100">
                  {viewedProject.images[
                    activeImageIndex
                  ]?.imageUrl ? (
                    <img
                      src={
                        viewedProject.images[
                          activeImageIndex
                        ].imageUrl
                      }
                      alt={
                        viewedProject.projectTitle
                      }
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-slate-300" />
                    </div>
                  )}

                  {viewedProject.images.length >
                    1 && (
                    <>
                      <button
                        type="button"
                        onClick={showPreviousImage}
                        className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-slate-950/65 text-white backdrop-blur-sm transition hover:bg-slate-950"
                        aria-label="الصورة السابقة"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>

                      <button
                        type="button"
                        onClick={showNextImage}
                        className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-slate-950/65 text-white backdrop-blur-sm transition hover:bg-slate-950"
                        aria-label="الصورة التالية"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                    </>
                  )}

                  <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-slate-950/70 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                    {activeImageIndex + 1}
                    {" / "}
                    {
                      viewedProject.images
                        .length
                    }
                  </span>
                </div>

                {viewedProject.images.length >
                  1 && (
                  <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                    {viewedProject.images.map(
                      (image, imageIndex) => (
                        <button
                          key={image.id}
                          type="button"
                          onClick={() =>
                            setActiveImageIndex(
                              imageIndex,
                            )
                          }
                          className={`h-20 w-28 shrink-0 overflow-hidden rounded-xl border-2 bg-slate-100 transition ${
                            imageIndex ===
                            activeImageIndex
                              ? "border-[#F7B548]"
                              : "border-transparent opacity-70 hover:opacity-100"
                          }`}
                        >
                          {image.imageUrl ? (
                            <img
                              src={image.imageUrl}
                              alt={`${viewedProject.projectTitle} ${imageIndex + 1}`}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="flex h-full items-center justify-center">
                              <ImageIcon className="h-6 w-6 text-slate-300" />
                            </span>
                          )}
                        </button>
                      ),
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-bold text-[#07152E]">
                    وصف المشروع
                  </h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                    {viewedProject.projectDescription ||
                      "لا يوجد وصف مضاف لهذا المشروع."}
                  </p>
                </div>

                {viewedProject.projectLink && (
                  <a
                    href={
                      viewedProject.projectLink
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#07152E] px-5 text-sm font-semibold text-white transition hover:bg-[#0B2148]"
                  >
                    <ExternalLink className="h-4 w-4" />
                    فتح رابط المشروع
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}