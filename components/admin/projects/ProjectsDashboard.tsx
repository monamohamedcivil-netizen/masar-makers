"use client";

import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  ImageIcon,
  Loader2,
  Search,
  X,
} from "lucide-react";
import {
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

import {
  updateCourseProject,
} from "@/lib/actions/admin/course-projects";

import type {
  ProjectsDashboardData,
  ProjectsDashboardRow,
} from "@/lib/actions/admin/projects-dashboard";

interface ProjectsDashboardProps {
  initialData: ProjectsDashboardData;
}

function normalize(value: string | null | undefined) {
  return value?.trim().toLocaleLowerCase("ar") ?? "";
}

function formatDate(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getStatusLabel(status: string) {
  if (status === "approved") return "معتمد";
  if (status === "needs_revision") return "يحتاج تعديل";
  if (status === "rejected") return "مرفوض";
  return "بانتظار المراجعة";
}

function getStatusClass(status: string) {
  if (status === "approved") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "rejected") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (status === "needs_revision") {
    return "border-sky-200 bg-sky-50 text-sky-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
}

export default function ProjectsDashboard({
  initialData,
}: ProjectsDashboardProps) {
  const router = useRouter();

  const [pathFilter, setPathFilter] =
    useState("all");

  const [search, setSearch] = useState("");

  const [processingId, setProcessingId] =
    useState<string | null>(null);

  const [selectedProject, setSelectedProject] =
    useState<ProjectsDashboardRow | null>(null);

  const [activeImageIndex, setActiveImageIndex] =
    useState(0);

  const [isPending, startTransition] =
    useTransition();

  const visibleRows = useMemo(() => {
    const normalizedSearch = normalize(search);

    return initialData.rows.filter((row) => {
      const matchesPath =
        pathFilter === "all" ||
        (row.pathId ?? "unassigned") === pathFilter;

      const searchableValue = normalize(
        [
          row.studentName,
          row.studentEmail,
          row.projectTitle,
          row.courseTitle,
          row.courseCode,
          row.pathTitle,
        ]
          .filter(Boolean)
          .join(" "),
      );

      const matchesSearch =
        !normalizedSearch ||
        searchableValue.includes(normalizedSearch);

      return matchesPath && matchesSearch;
    });
  }, [
    initialData.rows,
    pathFilter,
    search,
  ]);

  function applyUpdate(
    projectId: string,
    values: {
      status?: string;
      showOnCourse?: boolean;
      showOnHome?: boolean;
      featured?: boolean;
      coverImageId?: string;
      coverImagePath?: string;
    },
  ) {
    setProcessingId(projectId);

    startTransition(async () => {
      const result = await updateCourseProject(
        projectId,
        values,
      );

      setProcessingId(null);

      if (!result.success) {
        window.alert(result.message);
        return;
      }

      setSelectedProject(null);
      setActiveImageIndex(0);
      router.refresh();
    });
  }

  function openViewer(
    project: ProjectsDashboardRow,
  ) {
    setSelectedProject(project);
    setActiveImageIndex(0);
  }

  function closeViewer() {
    setSelectedProject(null);
    setActiveImageIndex(0);
  }

  function previousImage() {
    if (!selectedProject?.images.length) return;

    setActiveImageIndex((current) =>
      current === 0
        ? selectedProject.images.length - 1
        : current - 1,
    );
  }

  function nextImage() {
    if (!selectedProject?.images.length) return;

    setActiveImageIndex((current) =>
      current === selectedProject.images.length - 1
        ? 0
        : current + 1,
    );
  }

  return (
    <section dir="rtl" className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="إجمالي المشاريع"
          value={initialData.statistics.total}
        />

        <SummaryCard
          label="بانتظار المراجعة"
          value={initialData.statistics.pending}
        />

        <SummaryCard
          label="المشاريع المعتمدة"
          value={initialData.statistics.approved}
        />

        <SummaryCard
          label="معروضة في الرئيسية"
          value={initialData.statistics.showOnHome}
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <FilterButton
            active={pathFilter === "all"}
            onClick={() => setPathFilter("all")}
          >
            الكل ({initialData.rows.length})
          </FilterButton>

          {initialData.paths.map((path) => (
            <FilterButton
              key={path.id}
              active={pathFilter === path.id}
              onClick={() =>
                setPathFilter(path.id)
              }
            >
              {path.title} ({path.count})
            </FilterButton>
          ))}
        </div>

        <label className="mt-4 flex max-w-2xl items-center rounded-xl border border-slate-200 bg-slate-50 px-4">
          <Search className="h-4 w-4 text-slate-400" />

          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="بحث باسم الطالب أو المشروع أو الكورس أو كود الكورس..."
            className="h-11 w-full bg-transparent px-3 text-sm font-bold text-[#07152E] outline-none"
          />
        </label>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {visibleRows.length === 0 ? (
          <div className="flex min-h-72 items-center justify-center p-6 text-center font-bold text-slate-500">
            لا توجد مشاريع مطابقة.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1450px] text-center">
              <thead className="bg-slate-50">
                <tr>
                  {[
                    "الطالب",
                    "المسار",
                    "الكورس",
                    "كود الكورس",
                    "المشروع",
                    "عدد الصور",
                    "تاريخ الرفع",
                    "الحالة",
                    "الرئيسية",
                    "صفحة الكورس",
                    "الإجراءات",
                  ].map((header) => (
                    <th
                      key={header}
                      className="whitespace-nowrap px-4 py-4 text-xs font-black text-slate-500"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {visibleRows.map((project) => (
                  <tr
                    key={project.id}
                    className="border-t border-slate-100"
                  >
                    <td className="px-4 py-4">
                      <div className="min-w-[190px] text-right">
                        {project.userId ? (
                          <Link
                            href={`/admin/students/${project.userId}`}
                            className="font-black text-[#07152E] hover:text-[#C88712]"
                          >
                            {project.studentName ||
                              "طالب بدون اسم"}
                          </Link>
                        ) : (
                          <p className="font-black text-[#07152E]">
                            {project.studentName ||
                              "طالب بدون اسم"}
                          </p>
                        )}

                        <p className="mt-1 text-[10px] font-bold text-slate-400">
                          {project.studentEmail || "—"}
                        </p>
                      </div>
                    </td>

                    <Cell>{project.pathTitle}</Cell>

                    <Cell>{project.courseTitle}</Cell>

                    <Cell>
                      <span className="inline-flex rounded-lg bg-[#FFF5DD] px-3 py-1 text-xs font-black text-[#C88712]">
                        {project.courseCode || "—"}
                      </span>
                    </Cell>

                    <Cell>
                      <span className="font-black text-[#07152E]">
                        {project.projectTitle}
                      </span>
                    </Cell>

                    <Cell>
                      {project.images.length}
                    </Cell>

                    <Cell>
                      {formatDate(project.submittedAt)}
                    </Cell>

                    <Cell>
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${getStatusClass(
                          project.status,
                        )}`}
                      >
                        {getStatusLabel(project.status)}
                      </span>
                    </Cell>

                    <Cell>
                      <ToggleButton
                        active={project.showOnHome}
                        disabled={
                          isPending &&
                          processingId === project.id
                        }
                        activeLabel="ظاهر"
                        inactiveLabel="مخفي"
                        onClick={() =>
                          applyUpdate(project.id, {
                            showOnHome:
                              !project.showOnHome,
                          })
                        }
                      />
                    </Cell>

                    <Cell>
                      <ToggleButton
                        active={project.showOnCourse}
                        disabled={
                          isPending &&
                          processingId === project.id
                        }
                        activeLabel="ظاهر"
                        inactiveLabel="مخفي"
                        onClick={() =>
                          applyUpdate(project.id, {
                            showOnCourse:
                              !project.showOnCourse,
                          })
                        }
                      />
                    </Cell>

                    <Cell>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            openViewer(project)
                          }
                          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-black text-slate-600 hover:bg-slate-100"
                        >
                          <Eye className="h-4 w-4" />
                          عرض
                        </button>

                        {project.status !== "approved" ? (
                          <button
                            type="button"
                            disabled={
                              isPending &&
                              processingId === project.id
                            }
                            onClick={() =>
                              applyUpdate(project.id, {
                                status: "approved",
                              })
                            }
                            className="inline-flex h-9 items-center justify-center rounded-lg bg-emerald-600 px-3 text-xs font-black text-white hover:bg-emerald-700 disabled:opacity-50"
                          >
                            {processingId === project.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "اعتماد"
                            )}
                          </button>
                        ) : null}
                      </div>
                    </Cell>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedProject ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/75 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeViewer();
            }
          }}
        >
          <div className="max-h-[94vh] w-full max-w-6xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
              <div>
                <h2 className="text-xl font-black text-[#07152E]">
                  {selectedProject.projectTitle}
                </h2>

                <p className="mt-1 text-xs font-bold text-slate-500">
                  {selectedProject.studentName || "طالب بدون اسم"}
                  {" • "}
                  {selectedProject.courseTitle}
                </p>
              </div>

              <button
                type="button"
                onClick={closeViewer}
                className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1.5fr)_360px]">
              <div>
                <div className="relative aspect-video overflow-hidden rounded-2xl bg-slate-100">
                  {selectedProject.images[
                    activeImageIndex
                  ]?.imageUrl ? (
                    <img
                      src={
                        selectedProject.images[
                          activeImageIndex
                        ].imageUrl
                      }
                      alt={selectedProject.projectTitle}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-slate-300" />
                    </div>
                  )}

                  {selectedProject.images.length > 1 ? (
                    <>
                      <button
                        type="button"
                        onClick={previousImage}
                        className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-slate-950/65 text-white"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>

                      <button
                        type="button"
                        onClick={nextImage}
                        className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-slate-950/65 text-white"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                    </>
                  ) : null}
                </div>

                {selectedProject.images.length > 1 ? (
                  <div className="mt-3 flex gap-2 overflow-x-auto">
                    {selectedProject.images.map(
                      (image, index) => (
                        <button
                          key={image.id}
                          type="button"
                          onClick={() =>
                            setActiveImageIndex(index)
                          }
                          className={`h-20 w-28 shrink-0 overflow-hidden rounded-xl border-2 ${
                            index === activeImageIndex
                              ? "border-[#F7B548]"
                              : "border-transparent"
                          }`}
                        >
                          <img
                            src={image.imageUrl}
                            alt={selectedProject.projectTitle}
                            className="h-full w-full object-cover"
                          />
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
                    {selectedProject.projectDescription ||
                      "لا يوجد وصف."}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-black text-slate-500">
                    اختيار صورة الغلاف
                  </p>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {selectedProject.images.map((image) => (
                      <button
                        key={image.id}
                        type="button"
                        disabled={isPending}
                        onClick={() => {
                          setSelectedProject((current) => {
                            if (!current) {
                              return current;
                            }

                            return {
                              ...current,
                              coverImage:
                                image.publicPath ??
                                image.storagePath ??
                                image.imageUrl,
                              images: current.images.map(
                                (currentImage) => ({
                                  ...currentImage,
                                  isCover:
                                    currentImage.id === image.id,
                                }),
                              ),
                            };
                          });

                          applyUpdate(
                            selectedProject.id,
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
                        }}
                        className={`rounded-xl border px-3 py-2 text-xs font-black transition ${
                          image.isCover
                            ? "border-[#F7B548] bg-[#FFF5DD] text-[#C88712]"
                            : "border-slate-200 bg-white text-slate-600 hover:border-[#F7B548] hover:bg-amber-50"
                        }`}
                      >
                        {image.isCover
                          ? "الغلاف الحالي"
                          : "اختيار غلاف"}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedProject.projectLink ? (
                  <a
                    href={selectedProject.projectLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#07152E] px-5 text-sm font-black text-white"
                  >
                    فتح رابط المشروع
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-3xl font-black text-[#07152E]">
        {value}
      </p>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-xs font-black transition ${
        active
          ? "bg-[#07152E] text-white"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      }`}
    >
      {children}
    </button>
  );
}

function Cell({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <td className="whitespace-nowrap px-4 py-4 text-sm font-bold text-slate-600">
      {children}
    </td>
  );
}

function ToggleButton({
  active,
  disabled,
  activeLabel,
  inactiveLabel,
  onClick,
}: {
  active: boolean;
  disabled: boolean;
  activeLabel: string;
  inactiveLabel: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full px-3 py-1 text-xs font-black disabled:opacity-50 ${
        active
          ? "bg-emerald-100 text-emerald-700"
          : "bg-slate-100 text-slate-500"
      }`}
    >
      {active ? activeLabel : inactiveLabel}
    </button>
  );
}