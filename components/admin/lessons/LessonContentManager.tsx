"use client";

import {
  BookOpen,
  Eye,
  FileArchive,
  FileText,
  GripVertical,
  Link as LinkIcon,
  Pencil,
  PlayCircle,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  useMemo,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";

import BunnyVideoUploader from "@/components/admin/learning/BunnyVideoUploader";

import {
  createAssetPreview,
  deleteLessonContent,
  deleteLessonResource,
  reorderLessons,
  saveLesson,
  saveLessonResource,
  uploadLessonAsset,
} from "@/lib/actions/admin/lesson-content";

import {
  getAdminBunnyEmbedUrl,
} from "@/lib/actions/admin/bunny-videos";

type Row = Record<string, any>;

function lessonOrder(lesson: Row) {
  return Number(
    lesson.sort_order ??
      lesson.lesson_order ??
      0,
  );
}

function lessonIsPublished(
  lesson: Row,
) {
  return (
    lesson.is_published === true ||
    String(
      lesson.status ?? "",
    ).toLowerCase() === "published"
  );
}

function videoStatusLabel(
  status?: string | null,
) {
  switch (status) {
    case "queued":
      return "في الانتظار";
    case "processing":
      return "جارٍ التجهيز";
    case "encoding":
      return "جارٍ التحويل";
    case "playable":
      return "قابل للتشغيل";
    case "ready":
      return "جاهز";
    case "uploading":
      return "جارٍ الرفع";
    case "uploaded":
      return "تم الرفع";
    case "failed":
    case "upload_failed":
      return "فشل";
    default:
      return "غير مضاف";
  }
}

export default function LessonContentManager({
  initialLessons,
  courses,
  journeys,
  initialResources,
  careerPaths,
  stations,
  lessonJourneys,
}: {
  initialLessons: Row[];
  courses: Row[];
  journeys: Row[];
  initialResources: Row[];
  careerPaths: Row[];
  stations: Row[];
  lessonJourneys: Row[];
}) {
  const router = useRouter();

  const [lessons, setLessons] =
    useState<Row[]>(
      initialLessons.map((lesson) => ({
        ...lesson,
        lesson_order:
          lessonOrder(lesson),
        is_published:
          lessonIsPublished(lesson),
        journey_ids: lessonJourneys
          .filter((link) => link.lesson_id === lesson.id)
          .map((link) => link.journey_id),
      })),
    );

  const [resources, setResources] =
    useState<Row[]>(initialResources);

  const [
    careerPathFilter,
    setCareerPathFilter,
  ] = useState("");

  const [
    stationFilter,
    setStationFilter,
  ] = useState("");

  const [
    coursePartFilter,
    setCoursePartFilter,
  ] = useState("");

  const [
    courseFilter,
    setCourseFilter,
  ] = useState("");

  const [query, setQuery] =
    useState("");

  const [editing, setEditing] =
    useState<Row | null>(null);

  const [
    resourceLesson,
    setResourceLesson,
  ] = useState<Row | null>(null);

  const [dragged, setDragged] =
    useState<string | null>(null);

  const [pending, startTransition] =
    useTransition();

  const courseTitle = (
    lesson: Row,
  ) =>
    lesson.courses?.title_ar ||
    lesson.courses?.title ||
    courses.find(
      (course) =>
        course.id === lesson.course_id,
    )?.title_ar ||
    courses.find(
      (course) =>
        course.id === lesson.course_id,
    )?.title ||
    "بدون كورس";

  const getCourse = (lesson: Row) =>
    courses.find(
      (course) => course.id === lesson.course_id,
    );

  const getStation = (lesson: Row) => {
    const course = getCourse(lesson);
    return stations.find(
      (station) => station.id === course?.station_id,
    );
  };

  const getCareerPath = (lesson: Row) => {
    const course = getCourse(lesson);
    const station = getStation(lesson);

    return careerPaths.find(
      (path) =>
        path.id ===
        (course?.career_path_id ||
          station?.career_path_id),
    );
  };

  const coursePartLabel = (
    value?: string | null,
  ) => {
    const normalized = String(
      value || "single",
    ).toLowerCase();

    if (normalized === "fundamentals") {
      return "Fundamentals — الأساسيات";
    }

    if (normalized === "advanced") {
      return "Advanced — المتقدم";
    }

    return "Single — كورس كامل";
  };

  const coursePartOrder = (
    value?: string | null,
  ) => {
    const normalized = String(
      value || "single",
    ).toLowerCase();

    if (normalized === "single") return 0;
    if (normalized === "fundamentals") return 1;
    if (normalized === "advanced") return 2;
    return 99;
  };

  const visible = useMemo<Row[]>(
    () =>
      lessons
        .filter((lesson) => {
          const course = getCourse(lesson);
          const station = getStation(lesson);
          const path = getCareerPath(lesson);
          const part = String(
            lesson.course_part || "single",
          ).toLowerCase();

          const matchesSearch =
            `${lesson.title} ${courseTitle(
              lesson,
            )} ${station?.title || ""} ${
              station?.short_title || ""
            } ${path?.title || ""} ${
              path?.title_ar || ""
            } ${coursePartLabel(part)}`
              .toLowerCase()
              .includes(
                query.toLowerCase(),
              );

          return (
            (!careerPathFilter ||
              path?.id === careerPathFilter) &&
            (!stationFilter ||
              station?.id === stationFilter) &&
            (!courseFilter ||
              lesson.course_id ===
                courseFilter) &&
            (!coursePartFilter ||
              part === coursePartFilter) &&
            matchesSearch
          );
        })
        .sort((a, b) => {
          const pathA = getCareerPath(a);
          const pathB = getCareerPath(b);
          const stationA = getStation(a);
          const stationB = getStation(b);

          const pathOrderA = Number(
            pathA?.display_order ?? 9999,
          );
          const pathOrderB = Number(
            pathB?.display_order ?? 9999,
          );

          if (pathOrderA !== pathOrderB) {
            return pathOrderA - pathOrderB;
          }

          const stationOrderA = Number(
            stationA?.display_order ?? 9999,
          );
          const stationOrderB = Number(
            stationB?.display_order ?? 9999,
          );

          if (
            stationOrderA !== stationOrderB
          ) {
            return (
              stationOrderA -
              stationOrderB
            );
          }

          const partOrderA =
            coursePartOrder(
              a.course_part,
            );
          const partOrderB =
            coursePartOrder(
              b.course_part,
            );

          if (
            partOrderA !== partOrderB
          ) {
            return partOrderA - partOrderB;
          }

          return (
            lessonOrder(a) -
            lessonOrder(b)
          );
        }),
    [
      lessons,
      careerPathFilter,
      stationFilter,
      courseFilter,
      coursePartFilter,
      query,
      courses,
      stations,
      careerPaths,
    ],
  );

  const lessonResources = (
    lessonId: string,
  ) =>
    resources.filter(
      (resource) =>
        resource.lesson_id ===
        lessonId,
    );

  function getNextLessonOrder(
    courseId: string,
    coursePart: string,
  ) {
    const normalizedPart = String(
      coursePart || "single",
    ).toLowerCase();

    const orders = lessons
      .filter(
        (item: Row) =>
          item.course_id === courseId &&
          String(
            item.course_part || "single",
          ).toLowerCase() === normalizedPart,
      )
      .map((item: Row) => lessonOrder(item));

    return orders.length
      ? Math.max(...orders) + 1
      : 1;
  }

  function openLesson(row?: Row) {
    const courseId = row?.course_id || courseFilter || courses[0]?.id || "";
    const selectedCourse = courses.find((course) => course.id === courseId);

    setEditing(
      row
        ? {
            ...row,
            career_path_id: selectedCourse?.career_path_id || "",
            station_id: selectedCourse?.station_id || "",
            journey_ids: Array.isArray(row.journey_ids)
              ? row.journey_ids
              : row.journey_id
                ? [row.journey_id]
                : [],
            journey_types: Array.from(
              new Set(
                journeys
                  .filter((journey) =>
                    (Array.isArray(row.journey_ids)
                      ? row.journey_ids
                      : row.journey_id
                        ? [row.journey_id]
                        : []
                    ).includes(journey.id),
                  )
                  .map((journey) => {
                    const value = String(journey.journey_type || "").toLowerCase();
                    if (value.includes("free")) return "free";
                    if (
                      value.includes("day") ||
                      value.includes("one") ||
                      value.includes("workshop")
                    ) return "one_day";
                    return "professional";
                  }),
              ),
            ),
            lesson_order: lessonOrder(row),
            is_published: lessonIsPublished(row),
            video_provider: "bunny",
            course_part:
              String(
                row.course_part || "single",
              ).toLowerCase(),
          }
        : {
            career_path_id: selectedCourse?.career_path_id || "",
            station_id: selectedCourse?.station_id || "",
            course_id: courseId,
            journey_id: "",
            journey_ids: [],
            journey_types: [],
            course_part: "single",
            title: "",
            description: "",
            video_provider: "bunny",
            video_asset_id: "",
            video_status: null,
            lesson_order:
              getNextLessonOrder(
                courseId,
                "single",
              ),
            duration_minutes: 30,
            is_preview: false,
            is_published: false,
          },
    );
  }

  function submitLesson() {
    if (!editing) return;

    startTransition(async () => {
      const result =
        await saveLesson(editing);

      if (!result.success) {
        alert(result.message);
        return;
      }

      setEditing(null);
      window.location.reload();
    });
  }

  function removeLesson(
    row: Row,
  ) {
    if (
      !confirm(
        `هل تريدين حذف الدرس «${row.title}» والفيديو وجميع المرفقات؟`,
      )
    ) {
      return;
    }

    startTransition(async () => {
      const result =
        await deleteLessonContent(
          row.id,
        );

      if (!result.success) {
        alert(result.message);
        return;
      }

      setLessons((items) =>
        items.filter(
          (item) =>
            item.id !== row.id,
        ),
      );

      setResources((items) =>
        items.filter(
          (item) =>
            item.lesson_id !== row.id,
        ),
      );

      router.refresh();
    });
  }

  function drop(target: string) {
    if (
      !dragged ||
      dragged === target
    ) {
      return;
    }

    const draggedLesson =
      lessons.find(
        (item) =>
          item.id === dragged,
      );

    const groupCourse =
      draggedLesson?.course_id;

    const groupPart =
      String(
        draggedLesson?.course_part ||
          "single",
      ).toLowerCase();

    const sameCourse =
      lessons
        .filter(
          (item) =>
            item.course_id ===
              groupCourse &&
            String(
              item.course_part ||
                "single",
            ).toLowerCase() ===
              groupPart,
        )
        .sort(
          (a, b) =>
            lessonOrder(a) -
            lessonOrder(b),
        );

    const other =
      lessons.filter(
        (item) =>
          item.course_id !==
            groupCourse ||
          String(
            item.course_part ||
              "single",
          ).toLowerCase() !==
            groupPart,
      );

    const from =
      sameCourse.findIndex(
        (item) =>
          item.id === dragged,
      );

    const to =
      sameCourse.findIndex(
        (item) =>
          item.id === target,
      );

    if (from < 0 || to < 0) {
      return;
    }

    const next = [
      ...sameCourse,
    ];

    const [item] = next.splice(
      from,
      1,
    );

    next.splice(to, 0, item);

    const renumbered: Row[] =
      next.map(
        (entry: Row, index) => ({
          ...entry,
          sort_order:
            index + 1,
          lesson_order:
            index + 1,
        }),
      );

    setLessons([
      ...other,
      ...renumbered,
    ]);

    setDragged(null);

    startTransition(async () => {
      const result =
        await reorderLessons(
          renumbered.map(
            (entry) => entry.id,
          ),
        );

      if (!result.success) {
        alert(result.message);
      }

      router.refresh();
    });
  }

  async function previewResource(
    path?: string,
    external?: string,
  ) {
    if (external) {
      window.open(
        external,
        "_blank",
        "noopener,noreferrer",
      );
      return;
    }

    if (!path) return;

    const result =
      await createAssetPreview(path);

    if (
      !result.success ||
      !result.data?.url
    ) {
      alert(result.message);
      return;
    }

    window.open(
      result.data.url,
      "_blank",
      "noopener,noreferrer",
    );
  }

  async function previewVideo(
    lessonId: string,
  ) {
    const result =
      await getAdminBunnyEmbedUrl(
        lessonId,
      );

    if (!result.success) {
      alert(result.message);
      return;
    }

    window.open(
      result.data.url,
      "_blank",
      "noopener,noreferrer",
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm xl:grid-cols-6">
        <div className="relative xl:col-span-2">
          <Search className="absolute right-3 top-3 h-5 w-5 text-slate-400" />

          <input
            value={query}
            onChange={(event) =>
              setQuery(
                event.target.value,
              )
            }
            placeholder="البحث باسم الدرس أو الكورس"
            className="h-11 w-full rounded-xl border border-slate-200 pr-10 pl-3 outline-none focus:border-[#F7B548]"
          />
        </div>

        <select
          value={careerPathFilter}
          onChange={(event) => {
            const value =
              event.target.value;
            setCareerPathFilter(value);
            setStationFilter("");
            setCourseFilter("");
          }}
          className="h-11 rounded-xl border border-slate-200 bg-white px-3 outline-none focus:border-[#F7B548]"
        >
          <option value="">
            كل المسارات
          </option>
          {careerPaths.map((path) => (
            <option
              key={path.id}
              value={path.id}
            >
              {path.title_ar ||
                path.title ||
                path.short_title}
            </option>
          ))}
        </select>

        <select
          value={stationFilter}
          onChange={(event) => {
            const value =
              event.target.value;
            setStationFilter(value);
            setCourseFilter("");
          }}
          className="h-11 rounded-xl border border-slate-200 bg-white px-3 outline-none focus:border-[#F7B548]"
        >
          <option value="">
            كل المحطات
          </option>
          {stations
            .filter(
              (station) =>
                !careerPathFilter ||
                station.career_path_id ===
                  careerPathFilter,
            )
            .map((station) => (
              <option
                key={station.id}
                value={station.id}
              >
                {station.short_title ||
                  station.title}
              </option>
            ))}
        </select>

        <select
          value={coursePartFilter}
          onChange={(event) =>
            setCoursePartFilter(
              event.target.value,
            )
          }
          className="h-11 rounded-xl border border-slate-200 bg-white px-3 outline-none focus:border-[#F7B548]"
        >
          <option value="">
            كل أقسام الكورس
          </option>
          <option value="single">
            Single
          </option>
          <option value="fundamentals">
            Fundamentals
          </option>
          <option value="advanced">
            Advanced
          </option>
        </select>

        <select
          value={courseFilter}
          onChange={(event) =>
            setCourseFilter(
              event.target.value,
            )
          }
          className="h-11 rounded-xl border border-slate-200 bg-white px-3 outline-none focus:border-[#F7B548]"
        >
          <option value="">
            كل الكورسات
          </option>

          {courses
            .filter((course) => {
              const station =
                stations.find(
                  (item) =>
                    item.id ===
                    course.station_id,
                );

              return (
                (!careerPathFilter ||
                  course.career_path_id ===
                    careerPathFilter ||
                  station?.career_path_id ===
                    careerPathFilter) &&
                (!stationFilter ||
                  course.station_id ===
                    stationFilter)
              );
            })
            .map((course) => (
              <option
                key={course.id}
                value={course.id}
              >
                {course.title_ar ||
                  course.title}
              </option>
            ))}
        </select>

        <button
          onClick={() =>
            openLesson()
          }
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#F7B548] px-5 font-black text-[#07152E] xl:col-span-1"
        >
          <Plus className="h-5 w-5" />
          إضافة درس
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1500px] text-right">
            <thead className="bg-slate-50 text-sm text-slate-500">
              <tr>
                <th className="w-12 p-4" />
                <th className="p-4">
                  الدرس
                </th>
                <th className="p-4">
                  المسار
                </th>
                <th className="p-4">
                  المحطة
                </th>
                <th className="p-4">
                  قسم الكورس
                </th>
                <th className="p-4">
                  الكورس / الرحلة
                </th>
                <th className="p-4">
                  الفيديو
                </th>
                <th className="p-4">
                  المرفقات
                </th>
                <th className="p-4">
                  المدة
                </th>
                <th className="p-4">
                  الوصول
                </th>
                <th className="p-4">
                  الحالة
                </th>
                <th className="p-4">
                  الإجراءات
                </th>
              </tr>
            </thead>

            <tbody>
              {visible.map(
                (lesson) => {
                  const ready =
                    lesson.video_status ===
                      "ready" ||
                    lesson.video_status ===
                      "playable";

                  return (
                    <tr
                      key={lesson.id}
                      draggable
                      onDragStart={() =>
                        setDragged(
                          lesson.id,
                        )
                      }
                      onDragOver={(
                        event,
                      ) =>
                        event.preventDefault()
                      }
                      onDrop={() =>
                        drop(lesson.id)
                      }
                      className="border-t border-slate-100 hover:bg-slate-50/70"
                    >
                      <td className="p-4 text-slate-400">
                        <GripVertical className="h-5 w-5 cursor-grab" />
                      </td>

                      <td className="p-4">
                        <div className="font-black text-[#07152E]">
                          {lessonOrder(
                            lesson,
                          )}
                          .{" "}
                          {lesson.title}
                        </div>

                        <div className="max-w-xs truncate text-xs text-slate-500">
                          {lesson.description ||
                            "بدون وصف"}
                        </div>
                      </td>

                      <td className="p-4 text-sm font-bold text-[#07152E]">
                        {getCareerPath(
                          lesson,
                        )?.title_ar ||
                          getCareerPath(
                            lesson,
                          )?.title ||
                          "—"}
                      </td>

                      <td className="p-4 text-sm">
                        {getStation(
                          lesson,
                        )?.short_title ||
                          getStation(
                            lesson,
                          )?.title ||
                          "—"}
                      </td>

                      <td className="p-4">
                        <span className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">
                          {coursePartLabel(
                            lesson.course_part,
                          )}
                        </span>
                      </td>

                      <td className="p-4 text-sm">
                        <div>
                          {courseTitle(
                            lesson,
                          )}
                        </div>

                        <div className="text-xs text-slate-400">
                          {lesson.journeys
                            ?.title ||
                            journeys.find(
                              (
                                journey,
                              ) =>
                                journey.id ===
                                lesson.journey_id,
                            )?.title ||
                            "بدون رحلة محددة"}
                        </div>
                      </td>

                      <td className="p-4">
                        {lesson.video_asset_id ? (
                          <div className="space-y-1">
                            <button
                              onClick={() =>
                                previewVideo(
                                  lesson.id,
                                )
                              }
                              className="inline-flex items-center gap-2 text-sm font-bold text-blue-600"
                            >
                              <PlayCircle className="h-4 w-4" />
                              معاينة
                            </button>

                            <div
                              className={`text-[10px] font-black ${
                                ready
                                  ? "text-emerald-600"
                                  : "text-amber-600"
                              }`}
                            >
                              {videoStatusLabel(
                                lesson.video_status,
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">
                            غير مضاف
                          </span>
                        )}
                      </td>

                      <td className="p-4">
                        <button
                          onClick={() =>
                            setResourceLesson(
                              lesson,
                            )
                          }
                          className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700"
                        >
                          {lessonResources(
                            lesson.id,
                          ).length}{" "}
                          ملف
                        </button>
                      </td>

                      <td className="p-4 text-sm">
                        {lesson.duration_minutes ||
                          0}{" "}
                        دقيقة
                      </td>

                      <td className="p-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            lesson.is_preview
                              ? "bg-amber-50 text-amber-700"
                              : "bg-blue-50 text-blue-700"
                          }`}
                        >
                          {lesson.is_preview
                            ? "معاينة مجانية"
                            : "للمشتركين"}
                        </span>
                      </td>

                      <td className="p-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            lessonIsPublished(
                              lesson,
                            )
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {lessonIsPublished(
                            lesson,
                          )
                            ? "منشور"
                            : "مسودة"}
                        </span>
                      </td>

                      <td className="p-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              setResourceLesson(
                                lesson,
                              )
                            }
                            title="المحتوى والمرفقات"
                            className="rounded-lg border border-slate-200 p-2 text-violet-600 hover:bg-violet-50"
                          >
                            <BookOpen className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() =>
                              openLesson(
                                lesson,
                              )
                            }
                            className="rounded-lg border border-slate-200 p-2 text-blue-600 hover:bg-blue-50"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() =>
                              removeLesson(
                                lesson,
                              )
                            }
                            className="rounded-lg border border-slate-200 p-2 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                },
              )}
            </tbody>
          </table>
        </div>

        {visible.length === 0 ? (
          <div className="p-16 text-center text-slate-500">
            لا توجد دروس مطابقة.
          </div>
        ) : null}
      </div>

      {editing ? (
        <LessonDialog
          editing={editing}
          setEditing={setEditing}
          courses={courses}
          journeys={journeys}
          careerPaths={careerPaths}
          stations={stations}
          getNextLessonOrder={getNextLessonOrder}
          pending={pending}
          close={() =>
            setEditing(null)
          }
          submit={submitLesson}
        />
      ) : null}

      {resourceLesson ? (
        <ResourcesDialog
          lesson={resourceLesson}
          resources={lessonResources(
            resourceLesson.id,
          )}
          pending={pending}
          close={() =>
            setResourceLesson(null)
          }
          refresh={() =>
            window.location.reload()
          }
          remove={(id: string) =>
            startTransition(
              async () => {
                const result =
                  await deleteLessonResource(
                    id,
                  );

                if (
                  !result.success
                ) {
                  alert(
                    result.message,
                  );
                  return;
                }

                setResources(
                  (items) =>
                    items.filter(
                      (item) =>
                        item.id !==
                        id,
                    ),
                );
              },
            )
          }
          preview={
            previewResource
          }
        />
      ) : null}
    </div>
  );
}

function LessonDialog({
  editing,
  setEditing,
  courses,
  journeys,
  careerPaths,
  stations,
  getNextLessonOrder,
  pending,
  close,
  submit,
}: any) {
  const filteredStations = stations.filter(
    (station: Row) =>
      !editing.career_path_id ||
      station.career_path_id === editing.career_path_id,
  );

  const filteredCourses = courses.filter(
    (course: Row) =>
      (!editing.career_path_id ||
        course.career_path_id === editing.career_path_id) &&
      (!editing.station_id || course.station_id === editing.station_id),
  );

  const filteredJourneys = journeys.filter(
    (journey: Row) =>
      editing.course_id && journey.course_id === editing.course_id,
  );

  const selectedJourneyIds: string[] = Array.isArray(editing.journey_ids)
    ? editing.journey_ids
    : [];

  function toggleJourney(journeyId: string, checked: boolean) {
    const next = checked
      ? Array.from(new Set([...selectedJourneyIds, journeyId]))
      : selectedJourneyIds.filter((id) => id !== journeyId);

    setEditing({
      ...editing,
      journey_ids: next,
      journey_id: next[0] || "",
    });
  }

  function journeyTypeLabel(type?: string | null) {
    const value = String(type || "").toLowerCase();
    if (value.includes("free")) return "رحلة مجانية";
    if (value.includes("day") || value.includes("one")) return "رحلة اليوم الواحد";
    if (value.includes("integr")) return "رحلة الاحتراف المتكاملة";
    return type || "رحلة";
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-5">
          <h2 className="text-xl font-black text-[#07152E]">
            {editing.id ? "تعديل الدرس" : "إضافة درس"}
          </h2>
          <button onClick={close} className="rounded-lg p-2 hover:bg-slate-100">
            <X />
          </button>
        </div>

        <div className="grid gap-5 p-6 md:grid-cols-2">
          <Select
            label="المسار"
            value={editing.career_path_id || ""}
            set={(value: string) =>
              setEditing({
                ...editing,
                career_path_id: value,
                station_id: "",
                course_id: "",
                journey_id: "",
                journey_ids: [],
              })
            }
            options={[
              { value: "", label: "اختاري المسار" },
              ...careerPaths.map((path: Row) => ({
                value: path.id,
                label: path.title_ar || path.title || path.short_title,
              })),
            ]}
          />

          <Select
            label="المحطة"
            value={editing.station_id || ""}
            set={(value: string) => {
              const stationCourse = courses.find(
                (course: Row) =>
                  course.station_id === value &&
                  (!editing.career_path_id ||
                    course.career_path_id === editing.career_path_id),
              );

              setEditing({
                ...editing,
                station_id: value,
                course_id: stationCourse?.id || "",
                journey_id: "",
                journey_ids: [],
              });
            }}
            options={[
              { value: "", label: "اختاري المحطة" },
              ...filteredStations.map((station: Row) => ({
                value: station.id,
                label: station.short_title || station.title,
              })),
            ]}
          />

          <Select
            label="قسم الكورس"
            value={editing.course_part || "single"}
            set={(value: string) => {
              const nextOrder =
                editing.id
                  ? editing.lesson_order
                  : getNextLessonOrder(
                      editing.course_id,
                      value,
                    );

              setEditing({
                ...editing,
                course_part: value,
                lesson_order: nextOrder,
              });
            }}
            options={[
              { value: "single", label: "Single — كورس كامل غير مقسّم" },
              { value: "fundamentals", label: "Fundamentals — الأساسيات" },
              { value: "advanced", label: "Advanced — المتقدم" },
            ]}
          />

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-bold text-[#07152E]">
              نوع الرحلة التي يظهر فيها الدرس
            </label>

            {!editing.course_id ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-400">
                اختاري المحطة أولًا.
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-3">
                {[
                  { key: "professional", label: "رحلة الاحتراف المتكاملة" },
                  { key: "one_day", label: "رحلة اليوم الواحد" },
                  { key: "free", label: "رحلة مجانية" },
                ].map((group) => {
                  const checked = Array.isArray(editing.journey_types)
                    ? editing.journey_types.includes(group.key)
                    : false;

                  return (
                    <label
                      key={group.key}
                      className={`cursor-pointer rounded-xl border p-4 transition ${
                        checked
                          ? "border-[#F7B548] bg-amber-50"
                          : "border-slate-200 bg-white hover:border-[#F7B548]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="font-black text-[#07152E]">
                            {group.label}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            متاحة دائمًا لهذا الكورس
                          </div>
                        </div>

                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(event) => {
                            const current: string[] = Array.isArray(editing.journey_types)
                              ? editing.journey_types
                              : [];

                            const next = event.target.checked
                              ? Array.from(new Set([...current, group.key]))
                              : current.filter((type) => type !== group.key);

                            setEditing({
                              ...editing,
                              journey_types: next,
                            });
                          }}
                          className="h-5 w-5 accent-[#F7B548]"
                        />
                      </div>
                    </label>
                  );
                })}
              </div>
            )}

            <p className="mt-2 text-xs text-slate-500">
              يمكن اختيار أكثر من نوع رحلة لنفس المحاضرة، ويظل فيديو Bunny واحدًا فقط.
            </p>
          </div>

          <Field
            label="اسم الدرس"
            value={editing.title || ""}
            set={(value: string) => setEditing({ ...editing, title: value })}
          />

          <Field
            label="الترتيب"
            type="number"
            value={editing.lesson_order}
            set={(value: string) =>
              setEditing({ ...editing, lesson_order: Number(value) })
            }
          />

          <Field
            label="المدة بالدقائق"
            type="number"
            value={editing.duration_minutes}
            set={(value: string) =>
              setEditing({ ...editing, duration_minutes: Number(value) })
            }
          />

          <div className="rounded-xl border border-slate-200 p-3">
            <p className="text-sm font-bold text-[#07152E]">مصدر الفيديو</p>
            <p className="mt-1 text-sm font-black text-[#C88712]">Bunny Stream</p>
          </div>

          <div className="md:col-span-2">
            {editing.id ? (
              <BunnyVideoUploader
                lessonId={editing.id}
                lessonTitle={editing.title || "Lesson"}
                currentVideoId={editing.video_asset_id || null}
                currentStatus={editing.video_status || null}
                onChanged={(data) =>
  setEditing({
    ...editing,
    video_provider: "bunny",
    video_asset_id: data.videoId || "",
    video_status: data.status,
    video_url: "",

    video_duration_seconds:
      Number(data.durationSeconds || 0),

    duration_minutes:
      Number(data.durationSeconds || 0) > 0
        ? Math.max(
            1,
            Math.ceil(
              Number(data.durationSeconds) / 60,
            ),
          )
        : Number(editing.duration_minutes || 0),
  })
}
              />
            ) : (
              <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50 p-5 text-center text-sm font-black text-amber-700">
                احفظي الدرس أولًا، ثم افتحيه للتعديل لرفع الفيديو.
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-bold text-[#07152E]">
              وصف الدرس
            </label>
            <textarea
              rows={4}
              value={editing.description || ""}
              onChange={(event) =>
                setEditing({ ...editing, description: event.target.value })
              }
              className="w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-[#F7B548]"
            />
          </div>

          <Toggle
            label="معاينة مجانية"
            checked={editing.is_preview}
            set={(value: boolean) => setEditing({ ...editing, is_preview: value })}
          />
          <Toggle
            label="منشور للطلاب"
            checked={editing.is_published}
            set={(value: boolean) =>
              setEditing({ ...editing, is_published: value })
            }
          />
        </div>

        <div className="sticky bottom-0 flex justify-end gap-3 border-t bg-white p-5">
          <button onClick={close} className="rounded-xl border px-5 py-3 font-bold">
            إلغاء
          </button>
          <button
            disabled={pending}
            onClick={submit}
            className="rounded-xl bg-[#07152E] px-7 py-3 font-black text-white disabled:opacity-50"
          >
            {pending ? "جارٍ الحفظ..." : "حفظ الدرس"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ResourcesDialog({
  lesson,
  resources,
  pending,
  close,
  refresh,
  remove,
  preview,
}: any) {
  const [mode, setMode] =
    useState<"file" | "link">(
      "file",
    );

  const [title, setTitle] =
    useState("");

  const [type, setType] =
    useState("file");

  const [url, setUrl] =
    useState("");

  const [file, setFile] =
    useState<File | null>(null);

  const [busy, setBusy] =
    useState(false);

  async function add() {
    if (!title.trim()) {
      alert(
        "أدخلي اسم المرفق.",
      );
      return;
    }

    setBusy(true);

    let path = "";

    if (mode === "file") {
      if (!file) {
        setBusy(false);
        alert("اختاري الملف.");
        return;
      }

      const form =
        new FormData();

      form.append(
        "file",
        file,
      );

      form.append(
        "lessonId",
        lesson.id,
      );

      const uploaded =
        await uploadLessonAsset(
          form,
        );

      if (
        !uploaded.success ||
        !uploaded.data
      ) {
        setBusy(false);
        alert(uploaded.message);
        return;
      }

      path =
        uploaded.data.path;
    }

    const result =
      await saveLessonResource({
        lesson_id:
          lesson.id,
        title,
        resource_type:
          mode === "link"
            ? "link"
            : type,
        file_path: path,
        external_url:
          mode === "link"
            ? url
            : "",
        display_order:
          resources.length + 1,
        is_active: true,
      });

    setBusy(false);

    if (!result.success) {
      alert(result.message);
      return;
    }

    refresh();
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/55 p-4">
      <div className="max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-5">
          <div>
            <h2 className="text-xl font-black text-[#07152E]">
              محتوى الدرس
              ومرفقاته
            </h2>

            <p className="text-sm text-slate-500">
              {lesson.title}
            </p>
          </div>

          <button
            onClick={close}
            className="rounded-lg p-2 hover:bg-slate-100"
          >
            <X />
          </button>
        </div>

        <div className="space-y-6 p-6">
          <div className="rounded-2xl border border-slate-200 p-5">
            <div className="mb-4 flex gap-2">
              <button
                onClick={() =>
                  setMode(
                    "file",
                  )
                }
                className={`rounded-xl px-4 py-2 text-sm font-bold ${
                  mode ===
                  "file"
                    ? "bg-[#07152E] text-white"
                    : "bg-slate-100"
                }`}
              >
                <Upload className="ml-2 inline h-4 w-4" />
                رفع ملف
              </button>

              <button
                onClick={() =>
                  setMode(
                    "link",
                  )
                }
                className={`rounded-xl px-4 py-2 text-sm font-bold ${
                  mode ===
                  "link"
                    ? "bg-[#07152E] text-white"
                    : "bg-slate-100"
                }`}
              >
                <LinkIcon className="ml-2 inline h-4 w-4" />
                رابط خارجي
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="اسم المرفق"
                value={title}
                set={setTitle}
              />

              <Select
                label="النوع"
                value={type}
                set={setType}
                options={[
                  {
                    value:
                      "file",
                    label:
                      "ملف",
                  },
                  {
                    value:
                      "pdf",
                    label:
                      "PDF",
                  },
                  {
                    value:
                      "dwg",
                    label:
                      "DWG",
                  },
                  {
                    value:
                      "zip",
                    label:
                      "ZIP",
                  },
                  {
                    value:
                      "other",
                    label:
                      "أخرى",
                  },
                ]}
              />

              {mode ===
              "file" ? (
                <label className="md:col-span-2 flex cursor-pointer items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 font-bold">
                  <Upload className="h-5 w-5" />
                  {file?.name ||
                    "اختيار ملف حتى 100 MB"}

                  <input
                    type="file"
                    className="hidden"
                    onChange={(
                      event,
                    ) =>
                      setFile(
                        event
                          .target
                          .files?.[0] ||
                          null,
                      )
                    }
                  />
                </label>
              ) : (
                <div className="md:col-span-2">
                  <Field
                    label="الرابط الخارجي"
                    value={url}
                    set={setUrl}
                  />
                </div>
              )}
            </div>

            <button
              disabled={
                busy ||
                pending
              }
              onClick={add}
              className="mt-4 rounded-xl bg-[#F7B548] px-6 py-3 font-black text-[#07152E] disabled:opacity-50"
            >
              {busy
                ? "جارٍ الرفع..."
                : "إضافة المرفق"}
            </button>
          </div>

          <div className="space-y-3">
            {resources.map(
              (
                resource: Row,
              ) => (
                <div
                  key={
                    resource.id
                  }
                  className="flex items-center justify-between rounded-2xl border border-slate-200 p-4"
                >
                  <div className="flex items-center gap-3">
                    {resource.resource_type ===
                    "zip" ? (
                      <FileArchive className="text-amber-600" />
                    ) : (
                      <FileText className="text-blue-600" />
                    )}

                    <div>
                      <div className="font-bold text-[#07152E]">
                        {
                          resource.title
                        }
                      </div>

                      <div className="text-xs text-slate-400">
                        {
                          resource.resource_type
                        }
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        preview(
                          resource.file_path,
                          resource.external_url ||
                            resource.file_url,
                        )
                      }
                      className="rounded-lg border p-2 text-blue-600"
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => {
                        if (
                          confirm(
                            "حذف المرفق؟",
                          )
                        ) {
                          remove(
                            resource.id,
                          );
                        }
                      }}
                      className="rounded-lg border p-2 text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ),
            )}

            {resources.length ===
            0 ? (
              <div className="rounded-2xl bg-slate-50 p-10 text-center text-slate-500">
                لا توجد مرفقات
                حتى الآن.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  set,
  type = "text",
}: any) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-[#07152E]">
        {label}
      </label>

      <input
        type={type}
        value={value ?? ""}
        onChange={(event) =>
          set(
            event.target.value,
          )
        }
        className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-[#F7B548]"
      />
    </div>
  );
}

function Select({
  label,
  value,
  set,
  options,
}: any) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-[#07152E]">
        {label}
      </label>

      <select
        value={value ?? ""}
        onChange={(event) =>
          set(
            event.target.value,
          )
        }
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 outline-none focus:border-[#F7B548]"
      >
        {options.map(
          (option: any) => (
            <option
              key={
                option.value
              }
              value={
                option.value
              }
            >
              {
                option.label
              }
            </option>
          ),
        )}
      </select>
    </div>
  );
}

function Toggle({
  label,
  checked,
  set,
}: any) {
  return (
    <label className="flex items-center justify-between rounded-xl border border-slate-200 p-3 font-bold text-[#07152E]">
      <span>{label}</span>

      <input
        type="checkbox"
        checked={Boolean(
          checked,
        )}
        onChange={(event) =>
          set(
            event.target.checked,
          )
        }
        className="h-5 w-5 accent-[#F7B548]"
      />
    </label>
  );
}