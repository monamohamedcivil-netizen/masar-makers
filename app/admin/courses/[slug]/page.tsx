import Link from "next/link";
import { notFound } from "next/navigation";

import { getCareerPathBySlug } from "@/lib/queries/catalog";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function AdminPathPage({
  params,
}: Props) {
  const { slug } = await params;

  const path =
    await getCareerPathBySlug(slug);

  if (!path) {
    notFound();
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#F7F8FA] p-8"
    >
      <div className="mx-auto max-w-7xl">

        <div className="mb-8">
          <h1 className="text-3xl font-black text-[#07152E]">
            {path.title}
          </h1>

          <p className="mt-2 text-slate-500">
            اختر المحطة التي تريد تعديلها.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">

          {path.course_stations.map(
            (station) => (

              <Link
                key={station.id}
                href={`/admin/stations/${station.slug}`}
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
                  {station.title}
                </h2>

                <p className="mt-3 text-sm text-slate-500">
                  {station.description}
                </p>

                <div className="mt-5 flex items-center justify-between">

                  <span className="rounded-full bg-[#FFF7E3] px-3 py-1 text-xs font-black text-[#D49319]">
                    {station.courses.length} كورسات
                  </span>

                  <span className="font-black text-[#07152E]">
                    إدارة →
                  </span>

                </div>

              </Link>

            )
          )}

        </div>

      </div>
    </main>
  );
}