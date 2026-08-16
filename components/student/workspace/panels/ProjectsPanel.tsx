"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Eye,
  FolderKanban,
  ImageIcon,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import type {
  StudentCareerPathProgress,
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

import JourneyTabs from "../components/JourneyTabs";
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

  const [
    editingProject,
    setEditingProject,
  ] =
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

  const [dialogCourseId, setDialogCourseId] =
    useState("");

  const [viewedProject, setViewedProject] =
    useState<StudentProject | null>(null);

  const [activeImageIndex, setActiveImageIndex] =
    useState(0);

  const [
    deletingProject,
    setDeletingProject,
  ] =
    useState<StudentProject | null>(
      null,
    );

  const [
    deleteSubmitting,
    setDeleteSubmitting,
  ] =
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

  function getCourseProjects(
    courseId: string,
  ) {
    return projects.filter(
      (project) =>
        project.courseId === courseId,
    );
  }

  function getCourseProjectsCount(
    courseId: string,
  ) {
    return getCourseProjects(
      courseId,
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

  function handleDialogClose() {
    setDialogOpen(false);
    setEditingProject(null);
    setDialogMode("create");
    setDialogCourseId("");
    void loadProjects();
  }

  function openCreateProject(
    courseId: string,
  ) {
    setDialogCourseId(courseId);
    setEditingProject(null);
    setDialogMode("create");
    setDialogOpen(true);
  }

  function openEditProject(
    project: StudentProject,
  ) {
    setDialogCourseId(
      project.courseId,
    );
    setEditingProject(project);
    setDialogMode("edit");
    setDialogOpen(true);
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

    setActiveImageIndex(
      (currentIndex) =>
        currentIndex === 0
          ? viewedProject.images.length - 1
          : currentIndex - 1,
    );
  }

  function showNextImage() {
    if (!viewedProject?.images.length) {
      return;
    }

    setActiveImageIndex(
      (currentIndex) =>
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

  if (errorMessage) {
    return (
      <div
        className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700"
        dir="rtl"
      >
        {errorMessage}
      </div>
    );
  }

  return (
    <div dir="rtl">
      {!paths.length ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FFF4DF] text-[#C88712]">
            <FolderKanban size={30} />
          </span>

          <h3 className="mt-4 text-lg font-black text-[#07152E]">
            لا توجد كورسات متاحة للمشاريع
          </h3>

          <p className="mt-2 max-w-md text-sm font-semibold leading-7 text-slate-500">
            ستظهر هنا الكورسات التي تم تفعيل
            اشتراكك بها، وبعد ذلك يمكنك إضافة
            مشاريعك وأعمالك الهندسية.
          </p>
        </div>
      ) : (
        <JourneyTabs
          ariaLabel="مسارات مشاريعي"
          tabs={paths.map((path) => {
            const projectsCount =
              getPathProjectsCount(
                path.stations,
              );

            return {
              id: path.pathId,
              title: path.title,
              subtitle: `${path.stations.length} محطات`,
              badge: String(projectsCount),
              statusLabel:
                projectsCount > 0
                  ? `${projectsCount} مشروع`
                  : "لا توجد مشاريع",
              content: (
                <ProjectPathView
                  key={path.pathId}
                  path={path}
                  projects={projects}
                  getCourseProjectsCount={
                    getCourseProjectsCount
                  }
                  onCreateProject={
                    openCreateProject
                  }
                  onEditProject={
                    openEditProject
                  }
                  onViewProject={
                    openProjectViewer
                  }
                  onDeleteProject={
                    openDeleteConfirmation
                  }
                />
              ),
            };
          })}
        />
      )}

      <ProjectDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        paths={paths}
        initialCourseId={
          dialogCourseId
        }
        mode={dialogMode}
        project={editingProject}
      />

      {deletingProject ? (
        <DeleteProjectDialog
          project={deletingProject}
          submitting={deleteSubmitting}
          errorMessage={deleteError}
          onCancel={
            closeDeleteConfirmation
          }
          onConfirm={() => {
            void handleDeleteProject();
          }}
        />
      ) : null}

      {viewedProject ? (
        <ProjectViewer
          project={viewedProject}
          activeImageIndex={
            activeImageIndex
          }
          onClose={closeProjectViewer}
          onPrevious={
            showPreviousImage
          }
          onNext={showNextImage}
          onSelectImage={
            setActiveImageIndex
          }
        />
      ) : null}
    </div>
  );
}

function ProjectPathView({
  path,
  projects,
  getCourseProjectsCount,
  onCreateProject,
  onEditProject,
  onViewProject,
  onDeleteProject,
}: {
  path: StudentCareerPathProgress;
  projects: StudentProject[];
  getCourseProjectsCount: (
    courseId: string,
  ) => number;
  onCreateProject: (
    courseId: string,
  ) => void;
  onEditProject: (
    project: StudentProject,
  ) => void;
  onViewProject: (
    project: StudentProject,
  ) => void;
  onDeleteProject: (
    project: StudentProject,
  ) => void;
}) {
  const [activeCourseId, setActiveCourseId] =
    useState(
      path.stations[0]?.courseId ?? "",
    );

  useEffect(() => {
    const exists = path.stations.some(
      (station) =>
        station.courseId ===
        activeCourseId,
    );

    if (!exists) {
      setActiveCourseId(
        path.stations[0]?.courseId ??
          "",
      );
    }
  }, [path, activeCourseId]);

  const activeCourse =
    path.stations.find(
      (station) =>
        station.courseId ===
        activeCourseId,
    ) ?? path.stations[0];

  if (!activeCourse) {
    return null;
  }

  const activeCourseProjects =
    projects.filter(
      (project) =>
        project.courseId ===
        activeCourse.courseId,
    );

  return (
    <div className="space-y-3">
      <CompactStationRoad
        stations={path.stations}
        activeCourseId={
          activeCourse.courseId
        }
        getCourseProjectsCount={
          getCourseProjectsCount
        }
        onSelectCourse={
          setActiveCourseId
        }
      />

      <section className="overflow-hidden rounded-b-[24px] border border-[#DCE2EA] bg-white shadow-[0_12px_32px_rgba(7,21,46,0.07)]">
        <header className="flex items-center justify-between gap-4 border-b border-[#E5EAF0] bg-[#F7F9FC] px-5 py-2.5">
  <div className="text-right" dir="rtl">
    <p className="text-[9px] font-black text-[#C88712]">
      مشاريعي
    </p>

    <div className="mt-0.5 flex items-center gap-2">
      <h3 className="text-[16px] font-black text-[#07152E]">
        {activeCourse.shortTitle ||
          activeCourse.title}
      </h3>

      <span className="text-[9px] font-bold text-slate-500">
        {activeCourseProjects.length > 0
          ? `${activeCourseProjects.length} مشروع`
          : "لا توجد مشاريع"}
      </span>
    </div>
  </div>

  <button
    type="button"
    onClick={() =>
      onCreateProject(
        activeCourse.courseId,
      )
    }
    className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#07152E] px-4 text-[10px] font-black text-white transition hover:bg-[#102A50]"
  >
    <Plus size={14} />
    إضافة مشروع
  </button>
</header>

        <div className="p-4">
          {activeCourseProjects.length ===
          0 ? (
            <div className="flex min-h-[230px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 text-center">
              <FolderKanban className="h-9 w-9 text-[#F7B548]" />

              <h4 className="mt-4 text-base font-black text-[#07152E]">
                لا توجد مشاريع لهذه المحطة
              </h4>

              <p className="mt-2 max-w-md text-xs font-semibold leading-6 text-slate-500">
                ابدأ ببناء معرض أعمالك
                الهندسية وأضف أول مشروع قمت
                بتنفيذه خلال هذا الكورس.
              </p>

                        </div>
          ) : (
           <div className="grid gap-3">
              {activeCourseProjects.map(
                (project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onView={() =>
                      onViewProject(
                        project,
                      )
                    }
                    onEdit={() =>
                      onEditProject(
                        project,
                      )
                    }
                    onDelete={() =>
                      onDeleteProject(
                        project,
                      )
                    }
                  />
                ),
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function CompactStationRoad({
  stations,
  activeCourseId,
  getCourseProjectsCount,
  onSelectCourse,
}: {
  stations: StudentPathStationProgress[];
  activeCourseId: string;
  getCourseProjectsCount: (
    courseId: string,
  ) => number;
  onSelectCourse: (
    courseId: string,
  ) => void;
}) {
  return (
    <div className="relative px-3 py-3">
        <div
          className="relative mx-auto grid w-full items-start gap-1 px-2 pt-1 sm:px-4"
          style={{
            gridTemplateColumns: `repeat(${stations.length}, minmax(0, 1fr))`,
          }}
        >
          <div className="absolute left-[11%] right-[11%] top-[32px] h-[8px] bg-[#07152E]">
            <div className="absolute inset-x-0 top-1/2 h-[0.5px] -translate-y-1/2 bg-[#F7B548]" />
          </div>

          {stations.map(
            (station, index) => {
              const active =
                station.courseId ===
                activeCourseId;

              const projectsCount =
                getCourseProjectsCount(
                  station.courseId,
                );

              return (
                <button
                  key={station.stationId}
                  type="button"
                  onClick={() =>
                    onSelectCourse(
                      station.courseId,
                    )
                  }
                  className="group relative z-10 flex min-w-0 flex-col items-center px-1 py-1"
                >
                  <span
                    className={`relative flex h-[52px] w-[52px] items-center justify-center overflow-hidden rounded-full border-[2px] bg-white transition ${
                      active
                        ? "scale-110 border-[#F7B548] shadow-[0_6px_18px_rgba(247,181,72,0.28)]"
                        : projectsCount > 0
                          ? "border-[#F7B548]/70"
                          : "border-[#D5DCE6] group-hover:border-[#F7B548]"
                    }`}
                  >
                    {station.iconUrl ? (
                      <img
                        src={station.iconUrl}
                        alt={
                          station.shortTitle ||
                          station.title
                        }
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-black text-[#07152E]">
                        {index + 1}
                      </span>
                    )}
                  </span>

                  <span
                    className={`mt-2 w-full truncate text-center text-[9px] font-black sm:text-[10px] ${
                      active
                        ? "text-[#C88712]"
                        : "text-[#334155]"
                    }`}
                  >
                    {station.shortTitle ||
                      station.title}
                  </span>

                  <span
                    className={`mt-0.5 text-[8px] font-bold ${
                      projectsCount > 0
                        ? "text-[#C88712]"
                        : "text-slate-400"
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
    </div>
  );
}

function ProjectCard({
  project,
  onView,
  onEdit,
  onDelete,
}: {
  project: StudentProject;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const sortedImages = [...project.images].sort(
    (a, b) =>
      Number(a.sortOrder ?? 0) -
      Number(b.sortOrder ?? 0),
  );

  const coverIndex =
    sortedImages.findIndex(
      (image) => image.isCover,
    );

  const [
    activeImageIndex,
    setActiveImageIndex,
  ] = useState(
    coverIndex >= 0 ? coverIndex : 0,
  );

  useEffect(() => {
    const newCoverIndex =
      sortedImages.findIndex(
        (image) => image.isCover,
      );

    setActiveImageIndex(
      newCoverIndex >= 0
        ? newCoverIndex
        : 0,
    );
  }, [project.id]);

  const activeImage =
    sortedImages[activeImageIndex] ??
    sortedImages[0];

  function previousImage() {
    if (sortedImages.length <= 1) {
      return;
    }

    setActiveImageIndex(
      (currentIndex) =>
        currentIndex === 0
          ? sortedImages.length - 1
          : currentIndex - 1,
    );
  }

  function nextImage() {
    if (sortedImages.length <= 1) {
      return;
    }

    setActiveImageIndex(
      (currentIndex) =>
        currentIndex ===
        sortedImages.length - 1
          ? 0
          : currentIndex + 1,
    );
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.75fr)_minmax(240px,0.75fr)]">

        {/* الصورة */}
        <div
          className="relative order-1 flex h-[190px] items-center justify-center overflow-hidden bg-slate-50 lg:h-[245px]"
          dir="ltr"
        >
          <button
            type="button"
            onClick={onView}
            className="absolute inset-0 flex h-full w-full items-center justify-center"
          >
            {activeImage?.imageUrl ? (
              <img
                src={activeImage.imageUrl}
                alt={project.projectTitle}
                className="h-full w-full object-contain"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center">
                <ImageIcon className="h-10 w-10 text-slate-300" />
              </span>
            )}
          </button>

          {/* عدد الصور */}
          {sortedImages.length > 0 ? (
            <span className="absolute right-3 top-3 z-10 rounded-full bg-[#07152E]/85 px-2.5 py-1 text-[9px] font-black text-white">
              {sortedImages.length} صور
            </span>
          ) : null}

          {/* الأسهم */}
          {sortedImages.length > 1 ? (
            <>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  previousImage();
                }}
                className="absolute left-3 top-1/2 z-20 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-[#07152E]/75 text-white shadow transition hover:bg-[#07152E]"
                aria-label="الصورة السابقة"
              >
                <ChevronLeft size={14} />
              </button>

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  nextImage();
                }}
                className="absolute right-3 top-1/2 z-20 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-[#07152E]/75 text-white shadow transition hover:bg-[#07152E]"
                aria-label="الصورة التالية"
              >
                <ChevronRight size={14} />
              </button>

              <span className="absolute bottom-2 left-1/2 z-10 -translate-x-1/2 rounded-full bg-[#07152E]/70 px-2 py-0.5 text-[8px] font-black text-white">
                {activeImageIndex + 1}
                {" / "}
                {sortedImages.length}
              </span>
            </>
          ) : null}
        </div>

        {/* البيانات */}
        <div
          className="order-2 flex min-h-[220px] flex-col justify-between px-4 py-3 lg:min-h-[245px]"
          dir="rtl"
        >
          <div>
            <h4 className="line-clamp-1 text-base font-black leading-6 text-[#07152E]">
  {project.projectTitle}
</h4>

            {project.projectDescription ? (
              <p className="mt-2 line-clamp-3 text-xs font-semibold leading-5 text-slate-600">
  {project.projectDescription}
</p>
            ) : null}

            {project.projectLink ? (
              <a
                href={project.projectLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-[9px] font-black text-[#C88712] hover:underline"
              >
                <ExternalLink size={11} />
                رابط المشروع
              </a>
            ) : null}
          </div>

          <div>
            <div className="mb-2 border-t border-slate-100" />

            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={onView}
                className="inline-flex h-8 items-center justify-center gap-1 rounded-lg bg-[#07152E] px-2 text-[9px] font-black text-white"
              >
                <Eye size={12} />
                عرض
              </button>

              <button
                type="button"
                onClick={onEdit}
                className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-2 text-[9px] font-black text-[#07152E] hover:border-[#F7B548]"
              >
                <Pencil size={12} />
                تعديل
              </button>

              <button
                type="button"
                onClick={onDelete}
                className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2 text-[9px] font-black text-red-600"
              >
                <Trash2 size={12} />
                حذف
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function DeleteProjectDialog({
  project,
  submitting,
  errorMessage,
  onCancel,
  onConfirm,
}: {
  project: StudentProject;
  submitting: boolean;
  errorMessage: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/65 p-4"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onCancel();
        }
      }}
    >
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
          <Trash2 className="h-7 w-7 text-red-600" />
        </div>

        <h2 className="mt-5 text-xl font-black text-[#07152E]">
          حذف المشروع
        </h2>

        <p className="mt-3 text-sm leading-7 text-slate-600">
          هل أنتِ متأكدة من حذف مشروع
          <span className="font-black text-[#07152E]">
            {" "}
            {project.projectTitle}
          </span>
          ؟
        </p>

        <p className="mt-2 text-sm font-semibold text-red-600">
          سيتم حذف المشروع وجميع صوره نهائيًا، ولا يمكن التراجع عن هذه العملية.
        </p>

        {errorMessage ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="h-11 rounded-xl border border-slate-300 px-5 text-sm font-semibold text-slate-700 disabled:opacity-50"
          >
            إلغاء
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {submitting ? (
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
  );
}

function ProjectViewer({
  project,
  activeImageIndex,
  onClose,
  onPrevious,
  onNext,
  onSelectImage,
}: {
  project: StudentProject;
  activeImageIndex: number;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onSelectImage: (
    index: number,
  ) => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/75 p-4"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div className="max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
          <div>
            <h2 className="text-lg font-black text-[#07152E] sm:text-xl">
              {project.projectTitle}
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {project.images.length} صور
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
            aria-label="إغلاق"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(300px,0.8fr)]">
          <div>
            <div className="relative aspect-video overflow-hidden rounded-2xl bg-slate-100">
              {project.images[
                activeImageIndex
              ]?.imageUrl ? (
                <img
                  src={
                    project.images[
                      activeImageIndex
                    ].imageUrl
                  }
                  alt={
                    project.projectTitle
                  }
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <ImageIcon className="h-12 w-12 text-slate-300" />
                </div>
              )}

              {project.images.length > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={onPrevious}
                    className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-slate-950/65 text-white"
                    aria-label="الصورة السابقة"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>

                  <button
                    type="button"
                    onClick={onNext}
                    className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-slate-950/65 text-white"
                    aria-label="الصورة التالية"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                </>
              ) : null}

              {project.images.length > 0 ? (
                <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-slate-950/70 px-3 py-1 text-xs font-semibold text-white">
                  {activeImageIndex + 1}
                  {" / "}
                  {project.images.length}
                </span>
              ) : null}
            </div>

            {project.images.length > 1 ? (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {project.images.map(
                  (image, imageIndex) => (
                    <button
                      key={image.id}
                      type="button"
                      onClick={() =>
                        onSelectImage(
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
                          alt={`${project.projectTitle} ${imageIndex + 1}`}
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
            ) : null}
          </div>

          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-black text-[#07152E]">
                وصف المشروع
              </h3>

              <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                {project.projectDescription ||
                  "لا يوجد وصف مضاف لهذا المشروع."}
              </p>
            </div>

            {project.projectLink ? (
              <a
                href={project.projectLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#07152E] px-5 text-sm font-semibold text-white"
              >
                <ExternalLink className="h-4 w-4" />
                فتح رابط المشروع
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}