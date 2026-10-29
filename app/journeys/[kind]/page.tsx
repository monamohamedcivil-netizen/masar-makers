import { notFound } from "next/navigation";

import JourneysRoadView from "@/components/journeys/JourneysRoadView";
import { isPreviewViewer, JOURNEYS_PAGES_PREVIEW } from "@/lib/journeys/preview";
import { getProfessionalStations } from "@/lib/journeys/professional-stations";
import { getTopicLectures } from "@/lib/journeys/topic-lectures";
import AnnouncementBar from "@/sections/AnnouncementBar";
import Navbar from "@/sections/Navbar";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ kind: string }>;
  searchParams: Promise<{ path?: string }>;
};

export default async function LearningModePage({ params, searchParams }: PageProps) {
  const { kind } = await params;
  const { path } = await searchParams;
  if (!["professional", "one-day", "free"].includes(kind)) notFound();
  // نسخة تجريبية: للإدارة فقط حتى تعتمدها منى.
  if (JOURNEYS_PAGES_PREVIEW && !(await isPreviewViewer())) notFound();

  const initialPathSlug = path ?? null;

  return (
    <>
      <AnnouncementBar />
      <Navbar />
      {kind === "professional" ? (
        <JourneysRoadView kind="professional" paths={await getProfessionalStations()} initialPathSlug={initialPathSlug} />
      ) : (
        <JourneysRoadView
          kind={kind === "free" ? "free" : "workshop"}
          paths={await getTopicLectures(kind === "free" ? "free" : "workshop")}
          initialPathSlug={initialPathSlug}
        />
      )}
    </>
  );
}
