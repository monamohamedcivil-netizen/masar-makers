import { notFound } from "next/navigation";

import { getJourneyBySlug } from "@/lib/queries/catalog";

import JourneyAdminPanel from "@/components/admin/JourneyAdminPanel";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function JourneyPage({
  params,
}: Props) {

  const { slug } = await params;

  const journey =
    await getJourneyBySlug(slug);

  if (!journey) {
    notFound();
  }

  return (

    <main
      dir="rtl"
      className="
        min-h-screen
        bg-[#F7F8FA]
        p-8
      "
    >

      <div className="mx-auto max-w-[1600px]">

        <JourneyAdminPanel
          journeyTitle={journey.title}
        />

      </div>

    </main>

  );

}