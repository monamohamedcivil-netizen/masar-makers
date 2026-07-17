import Link from "next/link";

import { getCareerPaths } from "@/lib/queries/catalog/career-paths";

export const dynamic = "force-dynamic";

export default async function AdminCoursesPage() {
  const paths = await getCareerPaths();

  return (
    <main
      className="min-h-screen bg-[#F7F8FA] p-8"
      dir="rtl"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-[#07152E]">
            إدارة المحتوى
          </h1>

          <p className="mt-2 text-slate-500">
            اختر المسار الذي تريد إدارة محتواه.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {paths.map((path) => (
            <Link
              key={path.id}
              href={`/admin/courses/${path.slug}`}
              className="
                rounded-3xl
                border
                border-[#DCE2EA]
                bg-white
                p-6
                transition-all
                hover:-translate-y-1
                hover:border-[#F7B548]
                hover:shadow-xl
              "
            >
              <h2 className="text-2xl font-black text-[#07152E]">
                {path.title}
              </h2>

              <p className="mt-3 text-sm text-slate-500">
                {path.description}
              </p>

              <div className="mt-6 font-black text-[#D49319]">
                {path.course_stations.length} محطة →
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}