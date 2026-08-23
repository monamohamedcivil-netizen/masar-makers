"use client";

import {
  BookOpen,
  ChevronDown,
  ChevronLeft,
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
import { createClient } from "@/lib/supabase/client";
import * as tus from "tus-js-client";

import BunnyVideoUploader from "@/components/admin/learning/BunnyVideoUploader";

import {
  createAssetPreview,
  deleteLessonContent,
  deleteLessonResource,
  prepareLessonAssetUpload,
  reorderLessons,
  saveLesson,
  saveLessonResource,
} from "@/lib/actions/admin/lesson-content";

import {
  getAdminBunnyEmbedUrl,
} from "@/lib/actions/admin/bunny-videos";

type Row = Record<string, any>;
type CoursePart = "single" | "fundamentals" | "advanced";

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

function normalizePart(
  value?: string | null,
): CoursePart {
  const normalized = String(
    value || "single",
  ).toLowerCase();

  if (normalized === "fundamentals") {
    return "fundamentals";
  }

  if (normalized === "advanced") {
    return "advanced";
  }

  return "single";
}

function coursePartLabel(
  value?: string | null,
) {
  const normalized =
    normalizePart(value);

  if (normalized === "fundamentals") {
    return "Fundamentals — الأساسيات";
  }

  if (normalized === "advanced") {
    return "Advanced — المتقدم";
  }

  return "Single — كورس كامل";
}

function coursePartOrder(
  value?: string | null,
) {
  const normalized =
    normalizePart(value);

  if (normalized === "single") return 0;
  if (normalized === "fundamentals") return 1;
  return 2;
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

function formatMinutes(
  value: unknown,
) {
  const minutes = Math.max(
    0,
    Number(value || 0),
  );

  if (!minutes) {
    return "المدة غير محددة";
  }

  if (minutes < 60) {
    return `${minutes} دقيقة`;
  }

  const hours =
    Math.floor(minutes / 60);

  const rest =
    minutes % 60;

  return rest
    ? `${hours} س ${rest} د`
    : `${hours} ساعة`;
}


const CURRENT_SUPABASE_FREE_LIMIT_BYTES =
  50 * 1024 * 1024;

const RESOURCE_APP_MAX_BYTES =
  500 * 1024 * 1024;

function formatFileSize(
  bytes: number,
) {
  const mb =
    bytes / 1024 / 1024;

  return mb >= 1
    ? `${mb.toFixed(
        mb >= 100 ? 0 : 1,
      )} MB`
    : `${Math.max(
        1,
        Math.round(
          bytes / 1024,
        ),
      )} KB`;
}

async function uploadResourceDirect({
  file,
  resourceScope,
  lessonId,
  courseId,
  coursePart,
  onProgress,
}: {
  file: File;
  resourceScope:
    | "lesson"
    | "section";
  lessonId?: string;
  courseId?: string;
  coursePart?: CoursePart;
  onProgress?: (
    value: number,
  ) => void;
}) {
  if (
    file.size >
    RESOURCE_APP_MAX_BYTES
  ) {
    throw new Error(
      "حجم الملف يتجاوز الحد البرمجي 500 MB.",
    );
  }

  /*
   * على الخطة المجانية Supabase يرفض أي ملف أكبر من 50 MB.
   * نوقفه مبكرًا برسالة واضحة بدل ترك المستخدم ينتظر.
   */
  if (
    file.size >
    CURRENT_SUPABASE_FREE_LIMIT_BYTES
  ) {
    throw new Error(
      `حجم الملف ${formatFileSize(
        file.size,
      )}. الحد الحالي في Supabase Free هو 50 MB. بعد الترقية يمكن رفع هذا الحد دون تغيير نظام الرفع.`,
    );
  }

  const prepared =
    await prepareLessonAssetUpload({
      resource_scope:
        resourceScope,
      lesson_id:
        resourceScope ===
        "lesson"
          ? lessonId
          : null,
      course_id:
        resourceScope ===
        "section"
          ? courseId
          : null,
      course_part:
        resourceScope ===
        "section"
          ? coursePart
          : null,
      file_name:
        file.name,
      file_size:
        file.size,
    });

  if (
    !prepared.success ||
    !prepared.data
  ) {
    throw new Error(
      prepared.message,
    );
  }
const preparedData =
  prepared.data;
  const supabase =
  createClient();

const supabaseUrl =
  process.env
    .NEXT_PUBLIC_SUPABASE_URL;

if (!supabaseUrl) {
  throw new Error(
    "رابط Supabase غير موجود.",
  );
}

  const {
    data: { session },
  } =
    await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error(
      "انتهت جلسة تسجيل الدخول. حدّثي الصفحة وسجلي الدخول مرة أخرى.",
    );
  }

  const projectRef =
    new URL(
      supabaseUrl,
    ).hostname.split(".")[0];

  if (!projectRef) {
    throw new Error(
      "تعذر تحديد مشروع Supabase.",
    );
  }

  const endpoint =
    `https://${projectRef}.storage.supabase.co/storage/v1/upload/resumable`;

  await new Promise<void>(
    (resolve, reject) => {
      const upload =
        new tus.Upload(file, {
          endpoint,
          retryDelays: [
            0,
            3000,
            5000,
            10000,
            20000,
          ],
          headers: {
            authorization:
              `Bearer ${session.access_token}`,
          },
          uploadDataDuringCreation:
            true,
          removeFingerprintOnSuccess:
            true,
          chunkSize:
            6 * 1024 * 1024,
          metadata: {
  bucketName:
    preparedData.bucket,
  objectName:
    preparedData.path,
            contentType:
              file.type ||
              "application/octet-stream",
            cacheControl:
              "3600",
          },
          onError: (error) =>
            reject(error),
          onProgress: (
            bytesUploaded,
            bytesTotal,
          ) => {
            const percent =
              bytesTotal > 0
                ? Math.round(
                    (bytesUploaded /
                      bytesTotal) *
                      100,
                  )
                : 0;

            onProgress?.(
              percent,
            );
          },
          onSuccess: () =>
            resolve(),
        });

      upload.findPreviousUploads()
        .then(
          (previousUploads) => {
            if (
              previousUploads.length >
              0
            ) {
              upload.resumeFromPreviousUpload(
                previousUploads[0],
              );
            }

            upload.start();
          },
        )
        .catch(reject);
    },
  );

  onProgress?.(100);

  return preparedData.path;
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
          .filter(
            (link) =>
              link.lesson_id ===
              lesson.id,
          )
          .map(
            (link) =>
              link.journey_id,
          ),
      })),
    );

  const [resources, setResources] =
    useState<Row[]>(initialResources);

  const [query, setQuery] =
    useState("");

  const [editing, setEditing] =
    useState<Row | null>(null);

  const [
    resourceLesson,
    setResourceLesson,
  ] = useState<Row | null>(null);

  const [
    sectionTarget,
    setSectionTarget,
  ] = useState<{
    courseId: string;
    coursePart: CoursePart;
    title: string;
  } | null>(null);

  const [
    openPaths,
    setOpenPaths,
  ] = useState<Set<string>>(
    () =>
      new Set(
        careerPaths
          .filter(
            (path) =>
              path.is_active !== false,
          )
          .map((path) => path.id),
      ),
  );

  const [
    openStations,
    setOpenStations,
  ] = useState<Set<string>>(
    () =>
      new Set(
        stations
          .filter(
            (station) =>
              station.is_active !== false,
          )
          .map(
            (station) =>
              station.id,
          ),
      ),
  );

  const [
    openSections,
    setOpenSections,
  ] = useState<Set<string>>(
    () => new Set(),
  );

  const [dragged, setDragged] =
    useState<string | null>(null);

  const [pending, startTransition] =
    useTransition();

  const getCourse = (lesson: Row) =>
    courses.find(
      (course) =>
        course.id ===
        lesson.course_id,
    );

  const getStation = (lesson: Row) => {
    const course =
      getCourse(lesson);

    return stations.find(
      (station) =>
        station.id ===
        course?.station_id,
    );
  };

  const getCareerPath = (
    lesson: Row,
  ) => {
    const course =
      getCourse(lesson);

    const station =
      getStation(lesson);

    return careerPaths.find(
      (path) =>
        path.id ===
        (course?.career_path_id ||
          station?.career_path_id),
    );
  };

  const courseTitle = (
    lesson: Row,
  ) =>
    lesson.courses?.title_ar ||
    lesson.courses?.title ||
    getCourse(lesson)?.title_ar ||
    getCourse(lesson)?.title ||
    "بدون كورس";

  const filteredLessons =
    useMemo<Row[]>(
      () =>
        lessons.filter(
          (lesson) => {
            const station =
              getStation(lesson);

            const path =
              getCareerPath(lesson);

            const haystack =
              `${lesson.title} ${courseTitle(
                lesson,
              )} ${
                station?.title || ""
              } ${
                station?.short_title || ""
              } ${
                path?.title_ar ||
                path?.title ||
                ""
              } ${coursePartLabel(
                lesson.course_part,
              )}`.toLowerCase();

            return haystack.includes(
              query
                .trim()
                .toLowerCase(),
            );
          },
        ),
      [
        lessons,
        query,
        courses,
        stations,
        careerPaths,
      ],
    );

  const tree = useMemo(() => {
    const pathMap =
      new Map<string, any>();

    for (
      const lesson of filteredLessons
    ) {
      const course =
        getCourse(lesson);

      const station =
        getStation(lesson);

      const path =
        getCareerPath(lesson);

      if (
        !course ||
        !station ||
        !path
      ) {
        continue;
      }

      if (!pathMap.has(path.id)) {
        pathMap.set(path.id, {
          path,
          stations: new Map(),
        });
      }

      const pathNode =
        pathMap.get(path.id);

      if (
        !pathNode.stations.has(
          station.id,
        )
      ) {
        pathNode.stations.set(
          station.id,
          {
            station,
            sections:
              new Map(),
          },
        );
      }

      const stationNode =
        pathNode.stations.get(
          station.id,
        );

      const part =
        normalizePart(
          lesson.course_part,
        );

      /*
       * نحتفظ بـ course_id داخل مفتاح القسم.
       * هذا مهم لأن المرفقات العامة أصبحت مرتبطة بـ
       * course_id + course_part.
       */
      const sectionKey =
        `${course.id}:${part}`;

      if (
        !stationNode.sections.has(
          sectionKey,
        )
      ) {
        stationNode.sections.set(
          sectionKey,
          {
            key: sectionKey,
            course,
            part,
            lessons: [],
          },
        );
      }

      stationNode.sections
        .get(sectionKey)
        .lessons.push(lesson);
    }

    return Array.from(
      pathMap.values(),
    )
      .sort(
        (a, b) =>
          Number(
            a.path.display_order ??
              9999,
          ) -
          Number(
            b.path.display_order ??
              9999,
          ),
      )
      .map((pathNode) => ({
        ...pathNode,
        stations: Array.from(
          pathNode.stations.values(),
        )
          .sort(
            (a: any, b: any) =>
              Number(
                a.station
                  .display_order ??
                  9999,
              ) -
              Number(
                b.station
                  .display_order ??
                  9999,
              ),
          )
          .map(
            (stationNode: any) => ({
              ...stationNode,
              sections: Array.from(
                stationNode.sections.values(),
              ).sort(
                (
                  a: any,
                  b: any,
                ) =>
                  coursePartOrder(
                    a.part,
                  ) -
                    coursePartOrder(
                      b.part,
                    ) ||
                  Number(
                    a.course
                      .display_order ??
                      9999,
                  ) -
                    Number(
                      b.course
                        .display_order ??
                        9999,
                    ),
              ),
            }),
          ),
      }));
  }, [
    filteredLessons,
    courses,
    stations,
    careerPaths,
  ]);

  const lessonResources = (
    lessonId: string,
  ) =>
    resources.filter(
      (resource) =>
        resource.resource_scope !==
          "section" &&
        resource.lesson_id ===
          lessonId,
    );

  const sectionResources = (
    courseId: string,
    coursePart: CoursePart,
  ) =>
    resources.filter(
      (resource) =>
        resource.resource_scope ===
          "section" &&
        resource.course_id ===
          courseId &&
        normalizePart(
          resource.course_part,
        ) === coursePart,
    );

  function toggleSet(
    setter: React.Dispatch<
      React.SetStateAction<
        Set<string>
      >
    >,
    id: string,
  ) {
    setter((current) => {
      const next =
        new Set(current);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  }

  function getNextLessonOrder(
    courseId: string,
    coursePart: string,
  ) {
    const normalizedPart =
      normalizePart(
        coursePart,
      );

    const orders = lessons
      .filter(
        (item: Row) =>
          item.course_id ===
            courseId &&
          normalizePart(
            item.course_part,
          ) === normalizedPart,
      )
      .map(
        (item: Row) =>
          lessonOrder(item),
      );

    return orders.length
      ? Math.max(...orders) + 1
      : 1;
  }

  function openLesson(row?: Row) {
    const courseId =
      row?.course_id ||
      courses[0]?.id ||
      "";

    const selectedCourse =
      courses.find(
        (course) =>
          course.id ===
          courseId,
      );

    setEditing(
      row
        ? {
            ...row,
            career_path_id:
              selectedCourse
                ?.career_path_id ||
              "",
            station_id:
              selectedCourse
                ?.station_id ||
              "",
            journey_ids:
              Array.isArray(
                row.journey_ids,
              )
                ? row.journey_ids
                : row.journey_id
                  ? [
                      row.journey_id,
                    ]
                  : [],
            journey_types:
              Array.from(
                new Set(
                  journeys
                    .filter(
                      (journey) =>
                        (
                          Array.isArray(
                            row.journey_ids,
                          )
                            ? row.journey_ids
                            : row.journey_id
                              ? [
                                  row.journey_id,
                                ]
                              : []
                        ).includes(
                          journey.id,
                        ),
                    )
                    .map(
                      (journey) => {
                        const value =
                          String(
                            journey.journey_type ||
                              "",
                          ).toLowerCase();

                        if (
                          value.includes(
                            "free",
                          )
                        ) {
                          return "free";
                        }

                        if (
                          value.includes(
                            "day",
                          ) ||
                          value.includes(
                            "one",
                          ) ||
                          value.includes(
                            "workshop",
                          )
                        ) {
                          return "one_day";
                        }

                        return "professional";
                      },
                    ),
                ),
              ),
            lesson_order:
              lessonOrder(row),
            is_published:
              lessonIsPublished(
                row,
              ),
            video_provider:
              "bunny",
            course_part:
              normalizePart(
                row.course_part,
              ),
          }
        : {
            career_path_id:
              selectedCourse
                ?.career_path_id ||
              "",
            station_id:
              selectedCourse
                ?.station_id ||
              "",
            course_id:
              courseId,
            journey_id: "",
            journey_ids: [],
            journey_types: [],
            course_part:
              "single",
            title: "",
            description: "",
            video_provider:
              "bunny",
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

    startTransition(
      async () => {
        const result =
          await saveLesson(
            editing,
          );

        if (!result.success) {
          alert(result.message);
          return;
        }

        setEditing(null);
        window.location.reload();
      },
    );
  }

  function removeLesson(
    row: Row,
  ) {
    if (
      !confirm(
        `هل تريدين حذف الدرس «${row.title}» والفيديو وجميع مرفقات المحاضرة؟`,
      )
    ) {
      return;
    }

    startTransition(
      async () => {
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
              item.id !==
              row.id,
          ),
        );

        setResources(
          (items) =>
            items.filter(
              (item) =>
                item.lesson_id !==
                  row.id,
            ),
        );

        router.refresh();
      },
    );
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

    const targetLesson =
      lessons.find(
        (item) =>
          item.id === target,
      );

    if (
      !draggedLesson ||
      !targetLesson ||
      draggedLesson.course_id !==
        targetLesson.course_id ||
      normalizePart(
        draggedLesson.course_part,
      ) !==
        normalizePart(
          targetLesson.course_part,
        )
    ) {
      setDragged(null);
      return;
    }

    const courseId =
      draggedLesson.course_id;

    const part =
      normalizePart(
        draggedLesson.course_part,
      );

    const sameSection =
      lessons
        .filter(
          (item) =>
            item.course_id ===
              courseId &&
            normalizePart(
              item.course_part,
            ) === part,
        )
        .sort(
          (a, b) =>
            lessonOrder(a) -
            lessonOrder(b),
        );

    const others =
      lessons.filter(
        (item) =>
          !(
            item.course_id ===
              courseId &&
            normalizePart(
              item.course_part,
            ) === part
          ),
      );

    const from =
      sameSection.findIndex(
        (item) =>
          item.id === dragged,
      );

    const to =
      sameSection.findIndex(
        (item) =>
          item.id === target,
      );

    if (
      from < 0 ||
      to < 0
    ) {
      return;
    }

    const next = [
      ...sameSection,
    ];

    const [item] =
      next.splice(
        from,
        1,
      );

    if (!item) return;

    next.splice(
      to,
      0,
      item,
    );

    const renumbered: Row[] =
  next.map(
    (
      entry: Row,
      index: number,
    ): Row => ({
      ...entry,
      id: entry.id,
      sort_order:
        index + 1,
      lesson_order:
        index + 1,
    }),
  );

    setLessons([
      ...others,
      ...renumbered,
    ]);

    setDragged(null);

    startTransition(
      async () => {
        const result =
          await reorderLessons(
  renumbered.map(
    (entry: Row) =>
      String(entry.id),
  ),
);

        if (!result.success) {
          alert(result.message);
        }

        router.refresh();
      },
    );
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
      await createAssetPreview(
        path,
      );

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

  const totalLessons =
    filteredLessons.length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-3 h-5 w-5 text-slate-400" />

          <input
            value={query}
            onChange={(event) =>
              setQuery(
                event.target.value,
              )
            }
            placeholder="ابحثي باسم المسار أو المحطة أو القسم أو المحاضرة"
            className="h-11 w-full rounded-xl border border-slate-200 pr-10 pl-3 outline-none focus:border-[#F7B548]"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-black text-slate-600">
            {totalLessons} محاضرة
          </span>

          <button
            type="button"
            onClick={() =>
              openLesson()
            }
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#F7B548] px-5 font-black text-[#07152E]"
          >
            <Plus className="h-5 w-5" />
            إضافة درس
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {tree.map(
          (pathNode: any) => {
            const path =
              pathNode.path;

            const pathOpen =
              openPaths.has(
                path.id,
              );

            const pathLessonCount =
              pathNode.stations.reduce(
                (
                  total: number,
                  stationNode: any,
                ) =>
                  total +
                  stationNode.sections.reduce(
                    (
                      sectionTotal: number,
                      section: any,
                    ) =>
                      sectionTotal +
                      section.lessons.length,
                    0,
                  ),
                0,
              );

            return (
              <section
                key={path.id}
                className="overflow-hidden rounded-2xl border border-[#CDD6E2] bg-white shadow-sm"
              >
                <button
                  type="button"
                  onClick={() =>
                    toggleSet(
                      setOpenPaths,
                      path.id,
                    )
                  }
                  className="flex w-full items-center justify-between gap-4 bg-[#07152E] px-5 py-4 text-right text-white"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {pathOpen ? (
                      <ChevronDown className="h-5 w-5 shrink-0 text-[#F7B548]" />
                    ) : (
                      <ChevronLeft className="h-5 w-5 shrink-0 text-[#F7B548]" />
                    )}

                    <div className="min-w-0">
                      <p className="text-[10px] font-black text-[#F7B548]">
                        المسار المهني
                      </p>

                      <h2 className="truncate text-lg font-black">
                        {path.title_ar ||
                          path.title ||
                          path.short_title}
                      </h2>
                    </div>
                  </div>

                  <span className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-[10px] font-black text-white/80">
                    {pathLessonCount} محاضرة
                  </span>
                </button>

                {pathOpen ? (
                  <div className="space-y-3 bg-[#F7F9FC] p-3 sm:p-4">
                    {pathNode.stations.map(
                      (
                        stationNode: any,
                      ) => {
                        const station =
                          stationNode.station;

                        const stationOpen =
                          openStations.has(
                            station.id,
                          );

                        const stationLessonCount =
                          stationNode.sections.reduce(
                            (
                              total: number,
                              section: any,
                            ) =>
                              total +
                              section.lessons.length,
                            0,
                          );

                        return (
                          <section
                            key={
                              station.id
                            }
                            className="overflow-hidden rounded-xl border border-slate-200 bg-white"
                          >
                            <button
                              type="button"
                              onClick={() =>
                                toggleSet(
                                  setOpenStations,
                                  station.id,
                                )
                              }
                              className="flex w-full items-center justify-between gap-3 border-b border-slate-100 bg-white px-4 py-3 text-right"
                            >
                              <div className="flex min-w-0 items-center gap-3">
                                {stationOpen ? (
                                  <ChevronDown className="h-4 w-4 shrink-0 text-[#C88712]" />
                                ) : (
                                  <ChevronLeft className="h-4 w-4 shrink-0 text-[#C88712]" />
                                )}

                                <div className="min-w-0">
                                  <p className="text-[9px] font-black text-slate-400">
                                    المحطة
                                  </p>

                                  <h3 className="truncate text-sm font-black text-[#07152E]">
                                    {station.short_title ||
                                      station.title}
                                  </h3>
                                </div>
                              </div>

                              <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-[9px] font-black text-slate-600">
                                {stationLessonCount} محاضرة
                              </span>
                            </button>

                            {stationOpen ? (
                              <div className="space-y-3 p-3">
                                {stationNode.sections.map(
                                  (
                                    section: any,
                                  ) => {
                                    const sectionOpen =
                                      openSections.has(
                                        section.key,
                                      );

                                    const sharedResources =
                                      sectionResources(
                                        section.course.id,
                                        section.part,
                                      );

                                    return (
                                      <section
                                        key={
                                          section.key
                                        }
                                        className="overflow-hidden rounded-xl border border-slate-200 bg-[#FBFCFE]"
                                      >
                                        <div className="flex flex-col gap-3 border-b border-slate-200 bg-[#F0F4F8] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              toggleSet(
                                                setOpenSections,
                                                section.key,
                                              )
                                            }
                                            className="flex min-w-0 items-center gap-3 text-right"
                                          >
                                            {sectionOpen ? (
                                              <ChevronDown className="h-4 w-4 shrink-0 text-[#B87508]" />
                                            ) : (
                                              <ChevronLeft className="h-4 w-4 shrink-0 text-[#B87508]" />
                                            )}

                                            <div className="min-w-0">
                                              <p className="text-[9px] font-black text-slate-400">
                                                قسم الكورس
                                              </p>

                                              <h4 className="truncate text-sm font-black text-[#07152E]">
                                                {coursePartLabel(
                                                  section.part,
                                                )}
                                              </h4>

                                              <p className="mt-0.5 truncate text-[9px] font-bold text-slate-500">
                                                {section.course.title_ar ||
                                                  section.course.title}
                                              </p>
                                            </div>
                                          </button>

                                          <div className="flex flex-wrap items-center gap-2">
                                            <span className="rounded-full bg-white px-3 py-1 text-[9px] font-black text-slate-600 shadow-sm">
                                              {section.lessons.length} محاضرات
                                            </span>

                                            <button
                                              type="button"
                                              onClick={() =>
                                                setSectionTarget(
                                                  {
                                                    courseId:
                                                      section.course.id,
                                                    coursePart:
                                                      section.part,
                                                    title:
                                                      `${station.short_title || station.title} — ${coursePartLabel(
                                                        section.part,
                                                      )}`,
                                                  },
                                                )
                                              }
                                              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#F7B548] bg-white px-3 text-[9px] font-black text-[#07152E]"
                                            >
                                              <BookOpen className="h-3.5 w-3.5" />
                                              مرفقات القسم
                                              <span className="rounded-full bg-[#FFF4DF] px-1.5 py-0.5 text-[#B87508]">
                                                {sharedResources.length}
                                              </span>
                                            </button>

                                            <button
                                              type="button"
                                              onClick={() =>
                                                setSectionTarget(
                                                  {
                                                    courseId:
                                                      section.course.id,
                                                    coursePart:
                                                      section.part,
                                                    title:
                                                      `${station.short_title || station.title} — ${coursePartLabel(
                                                        section.part,
                                                      )}`,
                                                  },
                                                )
                                              }
                                              className="inline-flex h-8 items-center gap-1 rounded-lg bg-[#F7B548] px-3 text-[9px] font-black text-[#07152E]"
                                            >
                                              <Plus className="h-3.5 w-3.5" />
                                              إضافة مرفق
                                            </button>
                                          </div>
                                        </div>

                                        {sectionOpen ? (
                                          <div className="divide-y divide-slate-100">
                                            {section.lessons
                                              .slice()
                                              .sort(
                                                (
                                                  a: Row,
                                                  b: Row,
                                                ) =>
                                                  lessonOrder(
                                                    a,
                                                  ) -
                                                  lessonOrder(
                                                    b,
                                                  ),
                                              )
                                              .map(
                                                (
                                                  lesson: Row,
                                                  index: number,
                                                ) => {
                                                  const ready =
                                                    lesson.video_status ===
                                                      "ready" ||
                                                    lesson.video_status ===
                                                      "playable";

                                                  const lessonFiles =
                                                    lessonResources(
                                                      lesson.id,
                                                    );

                                                  return (
                                                    <div
                                                      key={
                                                        lesson.id
                                                      }
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
                                                        drop(
                                                          lesson.id,
                                                        )
                                                      }
                                                      className="grid gap-3 bg-white px-4 py-3 lg:grid-cols-[34px_minmax(0,1fr)_auto]"
                                                    >
                                                      <div className="flex items-start justify-center pt-1 text-slate-300">
                                                        <GripVertical className="h-4 w-4 cursor-grab" />
                                                      </div>

                                                      <div className="min-w-0">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FFF4DF] text-[9px] font-black text-[#B87508]">
                                                            {index + 1}
                                                          </span>

                                                          <p className="min-w-0 flex-1 truncate text-xs font-black text-[#07152E]">
                                                            {lesson.title}
                                                          </p>
                                                        </div>

                                                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[9px] font-bold text-slate-500">
                                                          <span>
                                                            {formatMinutes(
                                                              lesson.duration_minutes,
                                                            )}
                                                          </span>

                                                          <span>
                                                            •
                                                          </span>

                                                          <span
                                                            className={
                                                              ready
                                                                ? "text-emerald-600"
                                                                : "text-amber-600"
                                                            }
                                                          >
                                                            الفيديو:{" "}
                                                            {videoStatusLabel(
                                                              lesson.video_status,
                                                            )}
                                                          </span>

                                                          <span>
                                                            •
                                                          </span>

                                                          <span>
                                                            {lessonFiles.length} مرفق
                                                          </span>

                                                          <span>
                                                            •
                                                          </span>

                                                          <span
                                                            className={
                                                              lessonIsPublished(
                                                                lesson,
                                                              )
                                                                ? "text-emerald-600"
                                                                : "text-slate-400"
                                                            }
                                                          >
                                                            {lessonIsPublished(
                                                              lesson,
                                                            )
                                                              ? "منشور"
                                                              : "مسودة"}
                                                          </span>
                                                        </div>
                                                      </div>

                                                      <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                                                        {lesson.video_asset_id ? (
                                                          <button
                                                            type="button"
                                                            onClick={() =>
                                                              previewVideo(
                                                                lesson.id,
                                                              )
                                                            }
                                                            className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-2.5 text-[9px] font-black text-blue-600"
                                                          >
                                                            <PlayCircle className="h-3.5 w-3.5" />
                                                            معاينة
                                                          </button>
                                                        ) : null}

                                                        <button
                                                          type="button"
                                                          onClick={() =>
                                                            setResourceLesson(
                                                              lesson,
                                                            )
                                                          }
                                                          className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-2.5 text-[9px] font-black text-violet-600"
                                                        >
                                                          <BookOpen className="h-3.5 w-3.5" />
                                                          المرفقات
                                                          <span>
                                                            ({lessonFiles.length})
                                                          </span>
                                                        </button>

                                                        <button
                                                          type="button"
                                                          onClick={() =>
                                                            openLesson(
                                                              lesson,
                                                            )
                                                          }
                                                          className="inline-flex h-8 items-center justify-center rounded-lg border border-slate-200 px-2.5 text-blue-600"
                                                          title="تعديل الدرس"
                                                        >
                                                          <Pencil className="h-3.5 w-3.5" />
                                                        </button>

                                                        <button
                                                          type="button"
                                                          onClick={() =>
                                                            removeLesson(
                                                              lesson,
                                                            )
                                                          }
                                                          className="inline-flex h-8 items-center justify-center rounded-lg border border-red-200 px-2.5 text-red-600"
                                                          title="حذف الدرس"
                                                        >
                                                          <Trash2 className="h-3.5 w-3.5" />
                                                        </button>
                                                      </div>
                                                    </div>
                                                  );
                                                },
                                              )}

                                            {section.lessons.length ===
                                            0 ? (
                                              <div className="p-8 text-center text-xs font-bold text-slate-400">
                                                لا توجد محاضرات في هذا القسم.
                                              </div>
                                            ) : null}
                                          </div>
                                        ) : null}
                                      </section>
                                    );
                                  },
                                )}
                              </div>
                            ) : null}
                          </section>
                        );
                      },
                    )}
                  </div>
                ) : null}
              </section>
            );
          },
        )}

        {tree.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-14 text-center text-sm font-bold text-slate-500">
            لا توجد نتائج مطابقة.
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
          getNextLessonOrder={
            getNextLessonOrder
          }
          pending={pending}
          close={() =>
            setEditing(null)
          }
          submit={submitLesson}
        />
      ) : null}

      {resourceLesson ? (
        <LessonResourcesDialog
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
          remove={async (
            id: string,
          ) => {
            const result =
              await deleteLessonResource(
                id,
              );

            if (!result.success) {
              alert(result.message);
              return false;
            }

            setResources(
              (items) =>
                items.filter(
                  (item) =>
                    item.id !== id,
                ),
            );

            return true;
          }}
          preview={
            previewResource
          }
        />
      ) : null}

      {sectionTarget ? (
        <SectionResourcesDialog
          target={sectionTarget}
          resources={sectionResources(
            sectionTarget.courseId,
            sectionTarget.coursePart,
          )}
          pending={pending}
          close={() =>
            setSectionTarget(null)
          }
          refresh={() =>
            window.location.reload()
          }
          remove={async (
            id: string,
          ) => {
            const result =
              await deleteLessonResource(
                id,
              );

            if (!result.success) {
              alert(result.message);
              return false;
            }

            setResources(
              (items) =>
                items.filter(
                  (item) =>
                    item.id !== id,
                ),
            );

            return true;
          }}
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


function LessonResourcesDialog({
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

  const [
    editingResource,
    setEditingResource,
  ] = useState<Row | null>(
    null,
  );

  const [
    replacementFile,
    setReplacementFile,
  ] = useState<File | null>(
    null,
  );

  const [busy, setBusy] =
    useState(false);

  const [
    uploadProgress,
    setUploadProgress,
  ] = useState(0);

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

      try {
        setUploadProgress(0);

        path =
          await uploadResourceDirect({
            file,
            resourceScope:
              "lesson",
            lessonId:
              lesson.id,
            onProgress:
              setUploadProgress,
          });
      } catch (error) {
        setBusy(false);
        setUploadProgress(0);
        alert(
          error instanceof Error
            ? error.message
            : "تعذر رفع الملف.",
        );
        return;
      }
    }

    const result =
      await saveLessonResource({
        lesson_id:
          lesson.id,
        resource_scope:
          "lesson",
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

    setUploadProgress(0);
    alert("تمت إضافة مرفق المحاضرة بنجاح ✓");
    refresh();
  }

  async function saveEdit() {
    if (!editingResource) {
      return;
    }

    if (
      !String(
        editingResource.title || "",
      ).trim()
    ) {
      alert("اسم المرفق مطلوب.");
      return;
    }

    setBusy(true);

    let replacementPath =
      editingResource.file_path || "";

    if (replacementFile) {
      try {
        setUploadProgress(0);

        replacementPath =
          await uploadResourceDirect({
            file:
              replacementFile,
            resourceScope:
              "lesson",
            lessonId:
              lesson.id,
            onProgress:
              setUploadProgress,
          });
      } catch (error) {
        setBusy(false);
        setUploadProgress(0);
        alert(
          error instanceof Error
            ? error.message
            : "تعذر استبدال الملف.",
        );
        return;
      }
    }

    const result =
      await saveLessonResource({
        id:
          editingResource.id,
        resource_scope:
          "lesson",
        lesson_id:
          lesson.id,
        title:
          editingResource.title,
        resource_type:
          editingResource.resource_type,
        file_path:
          editingResource.resource_type === "link"
            ? ""
            : replacementPath,
        file_url:
          editingResource.file_url,
        external_url:
          editingResource.resource_type === "link"
            ? editingResource.external_url
            : "",
        display_order:
          editingResource.display_order,
        is_active:
          editingResource.is_active !==
          false,
      });

    setBusy(false);

    if (!result.success) {
      alert(result.message);
      return;
    }

    setEditingResource(null);
    setReplacementFile(null);
    setUploadProgress(0);
    alert("تم تحديث مرفق المحاضرة بنجاح ✓");
    refresh();
  }

  return (
    <ResourceShell
      title="مرفقات المحاضرة"
      subtitle={lesson.title}
      close={close}
    >
      <ResourceForm
        mode={mode}
        setMode={setMode}
        title={title}
        setTitle={setTitle}
        type={type}
        setType={setType}
        url={url}
        setUrl={setUrl}
        file={file}
        setFile={setFile}
        busy={busy}
        pending={pending}
        uploadProgress={uploadProgress}
        add={add}
      />

      <div className="space-y-3">
        {resources.map(
          (resource: Row) => (
            <div
              key={resource.id}
              className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-center gap-3">
                {resource.resource_type === "zip" ? (
                  <FileArchive className="shrink-0 text-amber-600" />
                ) : (
                  <FileText className="shrink-0 text-blue-600" />
                )}

                <div className="min-w-0">
                  <div className="truncate font-bold text-[#07152E]">
                    {resource.title}
                  </div>
                  <div className="text-xs text-slate-400">
                    {resource.resource_type}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    preview(
                      resource.file_path,
                      resource.external_url ||
                        resource.file_url,
                    )
                  }
                  className="rounded-lg border p-2 text-blue-600"
                  title="معاينة"
                >
                  <Eye className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEditingResource({
                      ...resource,
                    });
                    setReplacementFile(null);
                  }}
                  className="rounded-lg border p-2 text-violet-600"
                  title="تعديل"
                >
                  <Pencil className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    if (
                      confirm(
                        "هل تريدين حذف مرفق المحاضرة؟",
                      )
                    ) {
                      const deleted =
                        await remove(
                          resource.id,
                        );

                      if (deleted !== false) {
                        alert("تم حذف المرفق بنجاح ✓");
                      }
                    }
                  }}
                  className="rounded-lg border p-2 text-red-600"
                  title="حذف"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ),
        )}

        {resources.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 p-10 text-center text-slate-500">
            لا توجد مرفقات لهذه المحاضرة حتى الآن.
          </div>
        ) : null}
      </div>

      {editingResource ? (
        <div className="rounded-2xl border border-violet-200 bg-violet-50/40 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-black text-[#07152E]">
                تعديل مرفق المحاضرة
              </h3>
              <p className="mt-1 text-xs font-bold text-slate-500">
                يمكنك تعديل الاسم أو الرابط أو استبدال الملف.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingResource(null);
                setReplacementFile(null);
              }}
              className="rounded-lg border bg-white p-2"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="اسم المرفق"
              value={editingResource.title || ""}
              set={(value: string) =>
                setEditingResource({
                  ...editingResource,
                  title: value,
                })
              }
            />

            <Select
              label="النوع"
              value={
                editingResource.resource_type ||
                "file"
              }
              set={(value: string) =>
                setEditingResource({
                  ...editingResource,
                  resource_type: value,
                })
              }
              options={[
                { value: "file", label: "ملف" },
                { value: "pdf", label: "PDF" },
                { value: "dwg", label: "DWG" },
                { value: "zip", label: "ZIP" },
                { value: "link", label: "رابط" },
                { value: "other", label: "أخرى" },
              ]}
            />

            {editingResource.resource_type === "link" ? (
              <div className="md:col-span-2">
                <Field
                  label="الرابط الخارجي"
                  value={
                    editingResource.external_url ||
                    ""
                  }
                  set={(value: string) =>
                    setEditingResource({
                      ...editingResource,
                      external_url: value,
                    })
                  }
                />
              </div>
            ) : (
              <label className="md:col-span-2 flex cursor-pointer items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-5 text-sm font-bold">
                <Upload className="h-5 w-5" />
                {replacementFile?.name ||
                  "استبدال الملف الحالي — اختياري"}

                <input
                  type="file"
                  className="hidden"
                  onChange={(event) =>
                    setReplacementFile(
                      event.target.files?.[0] ||
                        null,
                    )
                  }
                />
              </label>
            )}
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={saveEdit}
            className="mt-4 rounded-xl bg-[#07152E] px-6 py-3 text-sm font-black text-white disabled:opacity-50"
          >
            {busy
              ? "جارٍ الحفظ..."
              : "حفظ التعديل"}
          </button>
        </div>
      ) : null}
    </ResourceShell>
  );
}

function SectionResourcesDialog({
  target,
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

  const [
    editingResource,
    setEditingResource,
  ] = useState<Row | null>(
    null,
  );

  const [
    replacementFile,
    setReplacementFile,
  ] = useState<File | null>(
    null,
  );

  const [busy, setBusy] =
    useState(false);

  const [
    uploadProgress,
    setUploadProgress,
  ] = useState(0);

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

      try {
        setUploadProgress(0);

        path =
          await uploadResourceDirect({
            file,
            resourceScope:
              "section",
            courseId:
              target.courseId,
            coursePart:
              target.coursePart,
            onProgress:
              setUploadProgress,
          });
      } catch (error) {
        setBusy(false);
        setUploadProgress(0);
        alert(
          error instanceof Error
            ? error.message
            : "تعذر رفع الملف.",
        );
        return;
      }
    }

    const result =
      await saveLessonResource({
        resource_scope:
          "section",
        course_id:
          target.courseId,
        course_part:
          target.coursePart,
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

    setUploadProgress(0);
    alert("تمت إضافة مرفق القسم بنجاح ✓");
    refresh();
  }

  async function saveEdit() {
    if (
      !editingResource
    ) {
      return;
    }

    setBusy(true);

    let replacementPath =
      editingResource.file_path || "";

    if (
      replacementFile
    ) {
      try {
        setUploadProgress(0);

        replacementPath =
          await uploadResourceDirect({
            file:
              replacementFile,
            resourceScope:
              "section",
            courseId:
              target.courseId,
            coursePart:
              target.coursePart,
            onProgress:
              setUploadProgress,
          });
      } catch (error) {
        setBusy(false);
        setUploadProgress(0);
        alert(
          error instanceof Error
            ? error.message
            : "تعذر استبدال الملف.",
        );
        return;
      }
    }

    const result =
      await saveLessonResource({
        id:
          editingResource.id,
        resource_scope:
          "section",
        course_id:
          target.courseId,
        course_part:
          target.coursePart,
        title:
          editingResource.title,
        resource_type:
          editingResource.resource_type,
        file_path:
          editingResource.resource_type === "link"
            ? ""
            : replacementPath,
        file_url:
          editingResource.file_url,
        external_url:
          editingResource.resource_type === "link"
            ? editingResource.external_url
            : "",
        display_order:
          editingResource.display_order,
        is_active:
          editingResource.is_active !==
          false,
      });

    setBusy(false);

    if (!result.success) {
      alert(result.message);
      return;
    }

    setEditingResource(null);
    setReplacementFile(null);
    setUploadProgress(0);
    alert("تم تحديث المرفق بنجاح ✓");
    refresh();
  }

  return (
    <ResourceShell
      title="مرفقات القسم العامة"
      subtitle={target.title}
      close={close}
    >
      <ResourceForm
        mode={mode}
        setMode={setMode}
        title={title}
        setTitle={setTitle}
        type={type}
        setType={setType}
        url={url}
        setUrl={setUrl}
        file={file}
        setFile={setFile}
        busy={busy}
        pending={pending}
        uploadProgress={uploadProgress}
        add={add}
      />

      <div className="space-y-3">
        {resources.map(
          (
            resource: Row,
          ) => (
            <div
              key={
                resource.id
              }
              className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-center gap-3">
                {resource.resource_type ===
                "zip" ? (
                  <FileArchive className="shrink-0 text-amber-600" />
                ) : (
                  <FileText className="shrink-0 text-blue-600" />
                )}

                <div className="min-w-0">
                  <div className="truncate font-bold text-[#07152E]">
                    {resource.title}
                  </div>

                  <div className="text-xs text-slate-400">
                    {resource.resource_type}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    preview(
                      resource.file_path,
                      resource.external_url ||
                        resource.file_url,
                    )
                  }
                  className="rounded-lg border p-2 text-blue-600"
                  title="معاينة"
                >
                  <Eye className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEditingResource({
                      ...resource,
                    });
                    setReplacementFile(
                      null,
                    );
                  }}
                  className="rounded-lg border p-2 text-violet-600"
                  title="تعديل"
                >
                  <Pencil className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    if (
                      confirm(
                        "حذف مرفق القسم؟",
                      )
                    ) {
                      const deleted =
                        await remove(
                          resource.id,
                        );

                      if (deleted !== false) {
                        alert("تم حذف المرفق بنجاح ✓");
                      }
                    }
                  }}
                  className="rounded-lg border p-2 text-red-600"
                  title="حذف"
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
            لا توجد مرفقات عامة لهذا القسم حتى الآن.
          </div>
        ) : null}
      </div>

      {editingResource ? (
        <div className="rounded-2xl border border-violet-200 bg-violet-50/40 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-black text-[#07152E]">
                تعديل المرفق
              </h3>
              <p className="mt-1 text-xs font-bold text-slate-500">
                يمكنك تعديل الاسم أو الرابط أو استبدال الملف.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingResource(
                  null,
                );
                setReplacementFile(
                  null,
                );
              }}
              className="rounded-lg border bg-white p-2"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="اسم المرفق"
              value={
                editingResource.title ||
                ""
              }
              set={(
                value: string,
              ) =>
                setEditingResource(
                  {
                    ...editingResource,
                    title: value,
                  },
                )
              }
            />

            <Select
              label="النوع"
              value={
                editingResource.resource_type ||
                "file"
              }
              set={(
                value: string,
              ) =>
                setEditingResource(
                  {
                    ...editingResource,
                    resource_type:
                      value,
                  },
                )
              }
              options={[
                {
                  value: "file",
                  label: "ملف",
                },
                {
                  value: "pdf",
                  label: "PDF",
                },
                {
                  value: "dwg",
                  label: "DWG",
                },
                {
                  value: "zip",
                  label: "ZIP",
                },
                {
                  value: "link",
                  label: "رابط",
                },
                {
                  value: "other",
                  label: "أخرى",
                },
              ]}
            />

            {editingResource.resource_type ===
            "link" ? (
              <div className="md:col-span-2">
                <Field
                  label="الرابط الخارجي"
                  value={
                    editingResource.external_url ||
                    ""
                  }
                  set={(
                    value: string,
                  ) =>
                    setEditingResource(
                      {
                        ...editingResource,
                        external_url:
                          value,
                      },
                    )
                  }
                />
              </div>
            ) : (
              <label className="md:col-span-2 flex cursor-pointer items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-5 text-sm font-bold">
                <Upload className="h-5 w-5" />
                {replacementFile?.name ||
                  "استبدال الملف الحالي — اختياري"}

                <input
                  type="file"
                  className="hidden"
                  onChange={(
                    event,
                  ) =>
                    setReplacementFile(
                      event.target.files?.[0] ||
                        null,
                    )
                  }
                />
              </label>
            )}
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={saveEdit}
            className="mt-4 rounded-xl bg-[#07152E] px-6 py-3 text-sm font-black text-white disabled:opacity-50"
          >
            {busy
              ? "جارٍ الحفظ..."
              : "حفظ التعديل"}
          </button>
        </div>
      ) : null}
    </ResourceShell>
  );
}

function ResourceShell({
  title,
  subtitle,
  close,
  children,
}: {
  title: string;
  subtitle: string;
  close: () => void;
  children:
    React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/55 p-4">
      <div className="max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-5">
          <div>
            <h2 className="text-xl font-black text-[#07152E]">
              {title}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {subtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={close}
            className="rounded-lg p-2 hover:bg-slate-100"
          >
            <X />
          </button>
        </div>

        <div className="space-y-6 p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

function ResourceForm({
  mode,
  setMode,
  title,
  setTitle,
  type,
  setType,
  url,
  setUrl,
  file,
  setFile,
  busy,
  pending,
  uploadProgress = 0,
  add,
}: any) {
  return (
    <div className="rounded-2xl border border-slate-200 p-5">
      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() =>
            setMode("file")
          }
          className={`rounded-xl px-4 py-2 text-sm font-bold ${
            mode === "file"
              ? "bg-[#07152E] text-white"
              : "bg-slate-100"
          }`}
        >
          <Upload className="ml-2 inline h-4 w-4" />
          رفع ملف
        </button>

        <button
          type="button"
          onClick={() =>
            setMode("link")
          }
          className={`rounded-xl px-4 py-2 text-sm font-bold ${
            mode === "link"
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
              value: "file",
              label: "ملف",
            },
            {
              value: "pdf",
              label: "PDF",
            },
            {
              value: "dwg",
              label: "DWG",
            },
            {
              value: "zip",
              label: "ZIP",
            },
            {
              value: "other",
              label: "أخرى",
            },
          ]}
        />

        {mode === "file" ? (
          <label className="md:col-span-2 flex cursor-pointer items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 font-bold">
            <Upload className="h-5 w-5" />
            {file?.name ||
              "اختيار ملف"}

            <input
              type="file"
              className="hidden"
              onChange={(
                event,
              ) =>
                setFile(
                  event.target.files?.[0] ||
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

      {busy && mode === "file" ? (
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between text-xs font-black text-slate-600">
            <span>
              جارٍ رفع الملف مباشرة إلى التخزين
            </span>
            <span>
              {uploadProgress}%
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-[#F7B548] transition-[width] duration-200"
              style={{
                width: `${Math.max(
                  0,
                  Math.min(
                    100,
                    uploadProgress,
                  ),
                )}%`,
              }}
            />
          </div>
        </div>
      ) : null}

      <button
        type="button"
        disabled={
          busy ||
          pending
        }
        onClick={add}
        className="mt-4 rounded-xl bg-[#F7B548] px-6 py-3 font-black text-[#07152E] disabled:opacity-50"
      >
        {busy
          ? uploadProgress > 0
            ? `جارٍ الرفع... ${uploadProgress}%`
            : "جارٍ تجهيز الرفع..."
          : "إضافة المرفق"}
      </button>
    </div>
  );
}

function ResourceList({
  resources,
  preview,
  remove,
}: any) {
  return (
    <div className="space-y-3">
      {resources.map(
        (
          resource: Row,
        ) => (
          <div
            key={resource.id}
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
                  {resource.title}
                </div>

                <div className="text-xs text-slate-400">
                  {resource.resource_type}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
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
                type="button"
                onClick={async () => {
                  if (
                    confirm(
                      "حذف المرفق؟",
                    )
                  ) {
                    await remove(
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
          لا توجد مرفقات حتى الآن.
        </div>
      ) : null}
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
              {option.label}
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