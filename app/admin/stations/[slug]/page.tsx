import Link from "next/link";
import { notFound } from "next/navigation";

import CoursePanelControlsManager from "@/components/admin/course/CoursePanelControlsManager";

import {
  getCourseLearningModes,
  getCourseResultTabs,
} from "@/lib/queries/catalog/panels";

import { getStationBySlug } from "@/lib/queries/catalog/stations";

type AdminStationPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function AdminStationPage({
  params,
}: AdminStationPageProps) {
  const { slug } = await params;

  const station = await getStationBySlug(slug);

  if (!station) {
    notFound();
  }

  const [learningModes, resultTabs] =
    await Promise.all([
      getCourseLearningModes(station.id),
      getCourseResultTabs(station.id),
    ]);

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#F7F8FA] px-5 py-8 lg:px-8"
    >
      <div className="mx-auto max-w-[1450px]">
        <header
          className="
            mb-7 flex flex-col gap-5
            rounded-[22px]
            border border-[#DCE3EB]
            bg-white px-6 py-5
            shadow-[0_12px_32px_rgba(7,21,46,0.06)]
            md:flex-row
            md:items-center
            md:justify-between
          "
        >
          <div>
            <p className="text-[12px] font-black text-[#D49319]">
              إدارة المحطة التعليمية
            </p>

            <h1 className="mt-1 text-[28px] font-black text-[#07152E]">
              {station.title}
            </h1>

            <p className="mt-2 text-[13px] font-medium text-slate-500">
              تعديل أسماء أزرار التنقل وترتيبها وحالة ظهورها.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/course/${station.slug}`}
              target="_blank"
              className="
                flex h-11 items-center justify-center
                rounded-xl border border-[#DCE3EB]
                bg-white px-5 text-[13px]
                font-black text-[#07152E]
                transition hover:border-[#F7B548]
              "
            >
              معاينة صفحة الطالب
            </Link>

            <Link
              href="/admin/stations"
              className="
                flex h-11 items-center justify-center
                rounded-xl bg-[#07152E]
                px-5 text-[13px]
                font-black text-white
                transition hover:bg-[#10264A]
              "
            >
              العودة إلى المحطات
            </Link>
          </div>
        </header>

        <CoursePanelControlsManager
          stationId={station.id}
          stationTitle={station.title}
          stationSlug={station.slug}
          learningModes={learningModes}
          resultTabs={resultTabs}
        />
      </div>
    </main>
  );
}