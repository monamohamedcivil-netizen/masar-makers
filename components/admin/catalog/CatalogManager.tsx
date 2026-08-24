"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  Pencil,
  Plus,
  Search,
  Settings,
  Trash2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";

import {
  deleteCareerPath,
  deleteCatalogCourse,
  deleteJourney,
  reorderCareerPaths,
  reorderCourses,
  reorderJourneys,
  saveCareerPath,
  saveCourse,
  saveJourney,
} from "@/lib/actions/admin/catalog";

import ImageUploadField from "./ImageUploadField";

type Kind = "paths" | "courses" | "journeys";
type Row = Record<string, any>;

const empty = {
  paths: {
    title: "",
    slug: "",
    short_title: "",
    description: "",
    image_url: "",
    image_path: "",
    is_active: true,
    display_order: 1,
  },
  courses: {
    station_id: "",
    title: "",
    slug: "",
    description: "",
    image_url: "",
    image_path: "",
    icon_url: "",
    icon_path: "",
    price: 0,
    currency: "SAR",
    duration_hours: 0,
    projects_count: 0,
    level: "مبتدئ",
    journey_type: "career_path",
    status: "draft",
    is_active: true,
    is_featured: false,
    display_order: 1,
  },
  journeys: {
    course_id: "",
    title: "",
    slug: "",
    journey_type: "fundamental",
    description: "",
    duration_hours: 0,
    price: 0,
    currency: "SAR",
    registration_required: true,
    status: "available",
    start_date: "",
    end_date: "",
    is_active: true,
    display_order: 1,
  },
};

export default function CatalogManager({
  kind,
  initialRows,
  stations = [],
  courses = [],
  careerPaths = [],
}: {
  kind: Kind;
  initialRows: Row[];
  stations?: Row[];
  courses?: Row[];
  careerPaths?: Row[];
}) {
  const router = useRouter();

  const [rows, setRows] = useState(initialRows);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Row | null>(null);
  const [dragged, setDragged] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [openJourneyGroups, setOpenJourneyGroups] =
    useState<Set<string>>(
      () =>
        new Set(
          careerPaths.map((path) => path.id),
        ),
    );

  const labels = {
    paths: {
      title: "المسارات المهنية",
      single: "مسار",
      add: "إضافة مسار",
    },
    courses: {
      title: "الكورسات",
      single: "كورس",
      add: "إضافة كورس",
    },
    journeys: {
      title: "الرحلات",
      single: "رحلة",
      add: "إضافة رحلة",
    },
  }[kind];

  const filtered = useMemo(() => {
    const normalizedQuery =
      query.trim().toLowerCase();

    return rows.filter((row) => {
      const course =
        kind === "journeys"
          ? courses.find(
              (item) =>
                item.id === row.course_id,
            )
          : null;

      const searchable = [
        row.title,
        row.slug,
        row.description,
        course?.title,
        course?.career_path_title,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        !normalizedQuery ||
        searchable.includes(normalizedQuery)
      );
    });
  }, [rows, query, kind, courses]);

  const journeyGroups = useMemo(() => {
    if (kind !== "journeys") {
      return [];
    }

    const groups = new Map<
      string,
      {
        id: string;
        title: string;
        order: number;
        rows: Row[];
      }
    >();

    for (const row of filtered) {
      const course = courses.find(
        (item) =>
          item.id === row.course_id,
      );

      const pathId =
        course?.career_path_id ||
        "unassigned";

      const path = careerPaths.find(
        (item) => item.id === pathId,
      );

      const title =
        path?.title ||
        course?.career_path_title ||
        "بدون مسار";

      const order = Number(
        path?.display_order ??
          course?.career_path_order ??
          999,
      );

      const current = groups.get(pathId);

      if (current) {
        current.rows.push(row);
      } else {
        groups.set(pathId, {
          id: pathId,
          title,
          order,
          rows: [row],
        });
      }
    }

    const result = Array.from(
      groups.values(),
    );

    for (const group of result) {
      group.rows.sort((first, second) => {
        const firstCourse = courses.find(
          (item) =>
            item.id === first.course_id,
        );

        const secondCourse = courses.find(
          (item) =>
            item.id === second.course_id,
        );

        const stationOrder =
          Number(
            firstCourse?.station_display_order ??
              firstCourse?.display_order ??
              999,
          ) -
          Number(
            secondCourse?.station_display_order ??
              secondCourse?.display_order ??
              999,
          );

        if (stationOrder !== 0) {
          return stationOrder;
        }

        return (
          Number(first.display_order ?? 1) -
          Number(second.display_order ?? 1)
        );
      });
    }

    return result.sort(
      (first, second) =>
        first.order - second.order,
    );
  }, [
    kind,
    filtered,
    courses,
    careerPaths,
  ]);

  function toggleJourneyGroup(
    groupId: string,
  ) {
    setOpenJourneyGroups((current) => {
      const next = new Set(current);

      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }

      return next;
    });
  }

  function open(row?: Row) {
    setEditing(
      row
        ? { ...row }
        : {
            ...empty[kind],
            display_order:
              kind === "journeys"
                ? 1
                : rows.length + 1,
          },
    );
  }

  function submit() {
    if (!editing) return;

    startTransition(async () => {
      const save =
        kind === "paths"
          ? saveCareerPath
          : kind === "courses"
            ? saveCourse
            : saveJourney;

      const result = await save(editing);

      if (!result.success) {
        alert(result.message);
        return;
      }

      setEditing(null);
      router.refresh();
      window.location.reload();
    });
  }

  function remove(row: Row) {
    const confirmed = window.confirm(
      `هل تريدين حذف ${labels.single} «${row.title}»؟`,
    );

    if (!confirmed) return;

    startTransition(async () => {
      const deleteItem =
        kind === "paths"
          ? deleteCareerPath
          : kind === "courses"
            ? deleteCatalogCourse
            : deleteJourney;

      const result = await deleteItem(row.id);

      if (!result.success) {
        alert(result.message);
        return;
      }

      setRows((currentRows) =>
        currentRows.filter((item) => item.id !== row.id),
      );

      router.refresh();
    });
  }

  function drop(targetId: string) {
    if (!dragged || dragged === targetId) return;

    const nextRows = [...rows];
    const draggedIndex = nextRows.findIndex((item) => item.id === dragged);
    const targetIndex = nextRows.findIndex((item) => item.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDragged(null);
      return;
    }

    const [draggedItem] = nextRows.splice(draggedIndex, 1);
    nextRows.splice(targetIndex, 0, draggedItem);

    setRows(nextRows);
    setDragged(null);

    startTransition(async () => {
      const reorder =
        kind === "paths"
          ? reorderCareerPaths
          : kind === "courses"
            ? reorderCourses
            : reorderJourneys;

      const result = await reorder(nextRows.map((item) => item.id));

      if (!result.success) {
        alert(result.message);
      }

      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute right-3 top-3 h-5 w-5 text-slate-400" />

          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`البحث في ${labels.title}`}
            className="h-11 w-full rounded-xl border border-slate-200 pr-10 pl-3 outline-none focus:border-[#F7B548]"
          />
        </div>

        <button
          type="button"
          onClick={() => open()}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#F7B548] px-5 font-black text-[#07152E] transition hover:bg-[#f5af2f]"
        >
          <Plus className="h-5 w-5" />
          {labels.add}
        </button>
      </div>

      {kind === "journeys" ? (
        <div className="space-y-4">
          {journeyGroups.map((group) => {
            const isOpen =
              openJourneyGroups.has(group.id);

            return (
              <section
                key={group.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <button
                  type="button"
                  onClick={() =>
                    toggleJourneyGroup(group.id)
                  }
                  className="flex w-full items-center justify-between gap-4 bg-[#07152E] px-5 py-4 text-right text-white transition hover:bg-[#0B2147]"
                >
                  <div>
                    <p className="text-[10px] font-black text-[#F7B548]">
                      المسار المهني
                    </p>

                    <h3 className="mt-1 text-lg font-black">
                      {group.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white">
                      {group.rows.length} رحلة
                    </span>

                    {isOpen ? (
                      <ChevronUp className="h-5 w-5 text-[#F7B548]" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-[#F7B548]" />
                    )}
                  </div>
                </button>

                {isOpen ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[920px] text-right">
                      <thead className="bg-slate-50 text-xs font-black text-slate-500">
                        <tr>
                          <th className="p-4">
                            المحطة / الكورس
                          </th>
                          <th className="p-4">
                            الرحلة
                          </th>
                          <th className="p-4">
                            الرابط المختصر
                          </th>
                          <th className="p-4">
                            نوع الرحلة
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
                        {group.rows.map((row) => {
                          const course =
                            courses.find(
                              (item) =>
                                item.id ===
                                row.course_id,
                            );

                          return (
                            <tr
                              key={row.id}
                              className="border-t border-slate-100 transition hover:bg-slate-50/70"
                            >
                              <td className="p-4">
                                <div className="font-black text-[#07152E]">
                                  {course?.title ||
                                    "كورس غير معروف"}
                                </div>

                                <div className="mt-1 text-[10px] font-bold text-[#B87908]">
                                  المحطة{" "}
                                  {course?.station_display_order ??
                                    "—"}
                                </div>
                              </td>

                              <td className="p-4">
                                <div className="font-black text-[#07152E]">
                                  {row.title}
                                </div>

                                <div className="mt-1 max-w-sm truncate text-xs text-slate-500">
                                  {row.description ||
                                    "بدون وصف"}
                                </div>
                              </td>

                              <td className="p-4 font-mono text-xs text-slate-500">
                                {row.slug}
                              </td>

                              <td className="p-4 text-sm font-bold text-slate-600">
                                {getJourneyTypeLabel(
                                  row.journey_type,
                                )}
                              </td>

                              <td className="p-4">
                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                                    row.is_active !==
                                      false &&
                                    row.status !==
                                      "archived"
                                      ? "bg-emerald-50 text-emerald-700"
                                      : "bg-slate-100 text-slate-500"
                                  }`}
                                >
                                  {row.status ||
                                    (row.is_active !==
                                    false
                                      ? "نشط"
                                      : "غير نشط")}
                                </span>
                              </td>

                              <td className="p-4">
                                <div className="flex flex-wrap items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      open(row)
                                    }
                                    className="rounded-lg border border-slate-200 p-2 text-blue-600 transition hover:bg-blue-50"
                                    title="تعديل الرحلة"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      remove(row)
                                    }
                                    disabled={pending}
                                    className="rounded-lg border border-slate-200 p-2 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                    title="حذف الرحلة"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </section>
            );
          })}

          {journeyGroups.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center text-slate-500 shadow-sm">
              لا توجد رحلات مطابقة.
            </div>
          ) : null}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-right">
              <thead className="bg-slate-50 text-sm text-slate-500">
                <tr>
                  <th className="w-12 p-4" />
                  <th className="p-4">الاسم</th>
                  <th className="p-4">الرابط المختصر</th>
                  <th className="p-4">التصنيف</th>
                  <th className="p-4">الحالة</th>
                  <th className="p-4">الترتيب</th>
                  <th className="p-4">الإجراءات</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((row) => (
                  <tr
                    key={row.id}
                    draggable
                    onDragStart={() =>
                      setDragged(row.id)
                    }
                    onDragEnd={() =>
                      setDragged(null)
                    }
                    onDragOver={(event) =>
                      event.preventDefault()
                    }
                    onDrop={() =>
                      drop(row.id)
                    }
                    className="border-t border-slate-100 transition hover:bg-slate-50/70"
                  >
                    <td className="p-4 text-slate-400">
                      <GripVertical className="h-5 w-5 cursor-grab active:cursor-grabbing" />
                    </td>

                    <td className="p-4">
                      <div className="font-black text-[#07152E]">
                        {row.title}
                      </div>

                      <div className="max-w-sm truncate text-xs text-slate-500">
                        {row.description ||
                          "بدون وصف"}
                      </div>
                    </td>

                    <td className="p-4 font-mono text-xs text-slate-500">
                      {row.slug}
                    </td>

                    <td className="p-4 text-sm text-slate-600">
                      {kind === "courses"
                        ? stations.find(
                            (station) =>
                              station.id ===
                              row.station_id,
                          )?.title ||
                          row.journey_type
                        : "مسار مهني"}
                    </td>

                    <td className="p-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          row.is_active !==
                            false &&
                          row.status !==
                            "archived"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {row.status ||
                          (row.is_active !==
                          false
                            ? "نشط"
                            : "غير نشط")}
                      </span>
                    </td>

                    <td className="p-4">
                      {row.display_order}
                    </td>

                    <td className="p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        {kind === "courses" ? (
                          <Link
                            href={`/admin/learning/courses/${row.id}`}
                            className="inline-flex items-center gap-2 rounded-lg bg-[#07152E] px-3 py-2 text-xs font-black text-white transition hover:bg-[#10274f]"
                            title="إدارة الكورس"
                          >
                            <Settings className="h-4 w-4" />
                            إدارة
                          </Link>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              open(row)
                            }
                            className="rounded-lg border border-slate-200 p-2 text-blue-600 transition hover:bg-blue-50"
                            title={`تعديل ${labels.single}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            remove(row)
                          }
                          disabled={pending}
                          className="rounded-lg border border-slate-200 p-2 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          title={`حذف ${labels.single}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 ? (
            <div className="p-16 text-center text-slate-500">
              لا توجد بيانات مطابقة.
            </div>
          ) : null}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-5">
              <h2 className="text-xl font-black text-[#07152E]">
                {editing.id ? `تعديل ${labels.single}` : labels.add}
              </h2>

              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-lg p-2 transition hover:bg-slate-100"
                aria-label="إغلاق"
              >
                <X />
              </button>
            </div>

            <div className="grid gap-5 p-6 md:grid-cols-2">
              <Field
                label="الاسم"
                value={editing.title}
                set={(value) =>
                  setEditing({
                    ...editing,
                    title: value,
                  })
                }
              />

              <Field
                label="Slug"
                value={editing.slug}
                set={(value) =>
                  setEditing({
                    ...editing,
                    slug: value,
                  })
                }
              />

              {kind === "paths" && (
                <>
                  <Field
                    label="الاسم المختصر"
                    value={editing.short_title || ""}
                    set={(value) =>
                      setEditing({
                        ...editing,
                        short_title: value,
                      })
                    }
                  />

                  <ImageUploadField
                    label="صورة المسار"
                    value={editing.image_url || ""}
                    folder="career-paths"
                    onChange={(url, path) =>
                      setEditing({
                        ...editing,
                        image_url: url,
                        image_path: path || editing.image_path,
                      })
                    }
                  />
                </>
              )}

              {kind === "courses" && (
                <>
                  <Select
                    label="المحطة التابعة للمسار"
                    value={editing.station_id || ""}
                    set={(value) =>
                      setEditing({
                        ...editing,
                        station_id: value,
                      })
                    }
                    options={[
                      {
                        value: "",
                        label: "بدون محطة",
                      },
                      ...stations.map((station) => ({
                        value: station.id,
                        label: station.title,
                      })),
                    ]}
                  />

                  <Select
                    label="نوع الكورس"
                    value={editing.journey_type}
                    set={(value) =>
                      setEditing({
                        ...editing,
                        journey_type: value,
                      })
                    }
                    options={[
                      {
                        value: "career_path",
                        label: "رحلة احتراف",
                      },
                      {
                        value: "workshop",
                        label: "ورشة يوم واحد",
                      },
                      {
                        value: "free",
                        label: "مجاني",
                      },
                    ]}
                  />

                  <Field
                    label="المدة بالساعات"
                    type="number"
                    value={editing.duration_hours}
                    set={(value) =>
                      setEditing({
                        ...editing,
                        duration_hours: Number(value),
                      })
                    }
                  />

                  <Field
                    label="السعر"
                    type="number"
                    value={editing.price}
                    set={(value) =>
                      setEditing({
                        ...editing,
                        price: Number(value),
                      })
                    }
                  />

                  <Field
                    label="عدد المشاريع"
                    type="number"
                    value={editing.projects_count}
                    set={(value) =>
                      setEditing({
                        ...editing,
                        projects_count: Number(value),
                      })
                    }
                  />

                  <Select
                    label="الحالة"
                    value={editing.status}
                    set={(value) =>
                      setEditing({
                        ...editing,
                        status: value,
                      })
                    }
                    options={[
                      {
                        value: "draft",
                        label: "مسودة",
                      },
                      {
                        value: "published",
                        label: "منشور",
                      },
                      {
                        value: "archived",
                        label: "مؤرشف",
                      },
                    ]}
                  />

                  <ImageUploadField
                    label="صورة الكورس"
                    value={editing.image_url || ""}
                    folder="courses"
                    onChange={(url, path) =>
                      setEditing({
                        ...editing,
                        image_url: url,
                        image_path: path || editing.image_path,
                      })
                    }
                  />

                  <ImageUploadField
                    label="أيقونة الكورس"
                    value={editing.icon_url || ""}
                    folder="course-icons"
                    onChange={(url, path) =>
                      setEditing({
                        ...editing,
                        icon_url: url,
                        icon_path: path || editing.icon_path,
                      })
                    }
                  />
                </>
              )}

              {kind === "journeys" && (
                <>
                  <Select
                    label="الكورس"
                    value={editing.course_id || ""}
                    set={(value) =>
                      setEditing({
                        ...editing,
                        course_id: value,
                      })
                    }
                    options={[
                      {
                        value: "",
                        label: "اختاري الكورس",
                      },
                      ...courses.map((course) => ({
                        value: course.id,
                        label: course.title,
                      })),
                    ]}
                  />

                  <Select
                    label="نوع الرحلة"
                    value={editing.journey_type}
                    set={(value) =>
                      setEditing({
                        ...editing,
                        journey_type: value,
                      })
                    }
                    options={[
                      {
                        value: "fundamental",
                        label: "تأسيسية",
                      },
                      {
                        value: "advanced",
                        label: "متقدمة",
                      },
                      {
                        value: "integrated",
                        label: "متكاملة",
                      },
                    ]}
                  />

                  <Field
                    label="المدة بالساعات"
                    type="number"
                    value={editing.duration_hours}
                    set={(value) =>
                      setEditing({
                        ...editing,
                        duration_hours: Number(value),
                      })
                    }
                  />

                  <Field
                    label="السعر"
                    type="number"
                    value={editing.price}
                    set={(value) =>
                      setEditing({
                        ...editing,
                        price: Number(value),
                      })
                    }
                  />

                  <Select
                    label="الحالة"
                    value={editing.status}
                    set={(value) =>
                      setEditing({
                        ...editing,
                        status: value,
                      })
                    }
                    options={[
                      {
                        value: "draft",
                        label: "مسودة",
                      },
                      {
                        value: "coming_soon",
                        label: "قريباً",
                      },
                      {
                        value: "available",
                        label: "متاحة",
                      },
                      {
                        value: "published",
                        label: "منشورة",
                      },
                      {
                        value: "closed",
                        label: "مغلقة",
                      },
                      {
                        value: "archived",
                        label: "مؤرشفة",
                      },
                    ]}
                  />

                  <Field
                    label="تاريخ البداية"
                    type="datetime-local"
                    value={
                      editing.start_date
                        ? String(editing.start_date).slice(0, 16)
                        : ""
                    }
                    set={(value) =>
                      setEditing({
                        ...editing,
                        start_date: value
                          ? new Date(value).toISOString()
                          : "",
                      })
                    }
                  />
                </>
              )}

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-bold text-[#07152E]">
                  الوصف
                </label>

                <textarea
                  rows={4}
                  value={editing.description || ""}
                  onChange={(event) =>
                    setEditing({
                      ...editing,
                      description: event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-[#F7B548]"
                />
              </div>

              {kind !== "journeys" ? (
                <Field
                  label="الترتيب"
                  type="number"
                  value={editing.display_order}
                  set={(value) =>
                    setEditing({
                      ...editing,
                      display_order:
                        Number(value),
                    })
                  }
                />
              ) : null}

              <Toggle
                label="نشط"
                checked={editing.is_active !== false}
                set={(value) =>
                  setEditing({
                    ...editing,
                    is_active: value,
                  })
                }
              />
            </div>

            <div className="sticky bottom-0 flex justify-end gap-3 border-t bg-white px-6 py-4">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-xl border px-6 py-3 font-bold"
              >
                إلغاء
              </button>

              <button
                type="button"
                disabled={pending}
                onClick={submit}
                className="rounded-xl bg-[#F7B548] px-8 py-3 font-black text-[#07152E] disabled:opacity-50"
              >
                {pending ? "جاري الحفظ..." : "حفظ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


function getJourneyTypeLabel(
  value: string | null | undefined,
) {
  const normalized =
    value?.trim().toLowerCase() ?? "";

  if (
    normalized === "fundamental" ||
    normalized === "fundamentals"
  ) {
    return "تأسيسية";
  }

  if (normalized === "advanced") {
    return "متقدمة";
  }

  if (normalized === "integrated") {
    return "متكاملة";
  }

  return value || "—";
}

function Field({
  label,
  value,
  set,
  type = "text",
}: {
  label: string;
  value: any;
  set: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-[#07152E]">
        {label}
      </label>

      <input
        type={type}
        value={value ?? ""}
        onChange={(event) => set(event.target.value)}
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
}: {
  label: string;
  value: string;
  set: (value: string) => void;
  options: {
    value: string;
    label: string;
  }[];
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-[#07152E]">
        {label}
      </label>

      <select
        value={value || ""}
        onChange={(event) => set(event.target.value)}
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 outline-none focus:border-[#F7B548]"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function Toggle({
  label,
  checked,
  set,
}: {
  label: string;
  checked: boolean;
  set: (value: boolean) => void;
}) {
  return (
    <label className="flex h-11 items-center gap-3 self-end rounded-xl border border-slate-200 px-4">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => set(event.target.checked)}
        className="h-4 w-4"
      />

      <span className="font-bold text-[#07152E]">{label}</span>
    </label>
  );
}