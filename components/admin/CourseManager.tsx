"use client";

import {
  Plus,
  Search,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

type AdminCourse = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;

  image_url: string | null;

  duration_hours: number | null;
  projects_count: number;
  level: string | null;

  is_active: boolean;
  is_featured: boolean;

  display_order: number;

  stationTitle: string;
  stationSlug: string;

  pathTitle: string;
  pathSlug: string;
};

type CourseManagerProps = {
  courses: AdminCourse[];
};

export default function CourseManager({
  courses,
}: CourseManagerProps) {
  const [search, setSearch] = useState("");
  const [pathFilter, setPathFilter] = useState("all");

  const pathOptions = useMemo(() => {
  return Array.from(
    new Set(
      courses.map((course) => course.pathTitle)
    )
  );
  }, [courses]);

  const filteredCourses = useMemo(() => {
  return courses.filter((course) => {
    const matchesSearch = course.title
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesPath =
      pathFilter === "all" ||
      course.pathTitle === pathFilter;

    return matchesSearch && matchesPath;
    });
  }, [courses, search, pathFilter]);



  return (
    <section className="mx-auto max-w-[1500px]">
     <header
  className="
    rounded-[26px]
    bg-[#07152E]
    px-6 py-5
    text-white
  "
>
  <div
    className="
      flex flex-wrap
      items-center
      justify-between
      gap-4
    "
  >
    <div>
      <p className="text-[12px] font-black text-[#F7B548]">
        Masar Course Manager
      </p>

      <h1 className="mt-1 text-[28px] font-black">
        إدارة الكورسات
      </h1>

      <p className="mt-2 text-[11px] font-bold text-slate-300">
        {filteredCourses.length}
        {" "}
        كورس
      </p>
    </div>

    <button
      className="
        flex h-11
        items-center gap-2
        rounded-xl
        bg-[#F7B548]
        px-5
        text-[13px]
        font-black
        text-[#07152E]
      "
    >
      <Plus size={18} />
      إضافة كورس
    </button>
  </div>

  <div
    className="
      mt-6
      grid gap-3
      lg:grid-cols-[1fr_260px]
    "
  >
    <div
      className="
        flex items-center
        rounded-xl
        bg-white
        px-4
      "
    >
      <Search
        size={18}
        className="text-slate-400"
      />

      <input
        value={search}
        onChange={(e) =>
          setSearch(
            e.target.value
          )
        }
        placeholder="ابحث عن كورس..."
        className="
          h-11
          w-full
          bg-transparent
          px-3
          text-[#07152E]
          outline-none
        "
      />
    </div>

    <select
      value={pathFilter}
      onChange={(e) =>
        setPathFilter(
          e.target.value
        )
      }
      className="
        h-11
        rounded-xl
        bg-white
        px-4
        text-[#07152E]
      "
    >
      <option value="all">
        جميع المسارات
      </option>

      {pathOptions.map(
        (path) => (
          <option
            key={path}
            value={path}
          >
            {path}
          </option>
        )
      )}
    </select>
  </div>
</header>

      <div className="mt-6 grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        {filteredCourses.map((course) => (
          <article
            key={course.id}
            className="
              overflow-hidden
              rounded-[24px]
              border border-[#DCE3EB]
              bg-white
              shadow-[0_12px_34px_rgba(7,21,46,0.08)]
            "
          >
            <div className="aspect-[16/8] bg-slate-100">
              {course.image_url ? (
                <img
                  src={course.image_url}
                  alt={course.title}
                  className="
                    h-full w-full
                    object-cover
                  "
                />
              ) : null}
            </div>

            <div className="p-5">
              <p className="text-[10px] font-black text-[#B87508]">
                {course.pathTitle}
              </p>

              <h2 className="mt-1 text-[18px] font-black text-[#07152E]">
                {course.title}
              </h2>

              <p className="mt-1 text-[10px] font-bold text-slate-500">
                {course.stationTitle}
              </p>

              <div
                className="
                  mt-4 grid grid-cols-3
                  gap-2 text-center
                "
              >
                <Stat
                  label="الساعات"
                  value={
                    course.duration_hours
                      ? String(
                          course.duration_hours
                        )
                      : "-"
                  }
                />

                <Stat
                  label="المشاريع"
                  value={String(
                    course.projects_count
                  )}
                />

                <Stat
                  label="المستوى"
                  value={
                    course.level ??
                    "-"
                  }
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <StatusBadge
                  active={
                    course.is_active
                  }
                  activeText="نشط"
                  inactiveText="مخفي"
                />

                <StatusBadge
                  active={
                    course.is_featured
                  }
                  activeText="مميز"
                  inactiveText="عادي"
                />
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      className="
        rounded-xl
        bg-[#F8FAFC]
        px-3 py-3
      "
    >
      <p className="text-[14px] font-black text-[#07152E]">
        {value}
      </p>

      <p className="mt-1 text-[9px] font-bold text-slate-500">
        {label}
      </p>
    </div>
  );
}

function StatusBadge({
  active,
  activeText,
  inactiveText,
}: {
  active: boolean;
  activeText: string;
  inactiveText: string;
}) {
  return (
    <span
      className={`
        rounded-full
        px-3 py-1
        text-[9px]
        font-black

        ${
          active
            ? "bg-emerald-50 text-emerald-600"
            : "bg-slate-100 text-slate-500"
        }
      `}
    >
      {active
        ? activeText
        : inactiveText}
    </span>
  );
}