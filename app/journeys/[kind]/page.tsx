import { notFound } from "next/navigation";

import TopicLecturesView from "@/components/journeys/TopicLecturesView";
import { getTopicLectures, type LectureKind } from "@/lib/journeys/topic-lectures";
import { isPreviewViewer, JOURNEYS_PAGES_PREVIEW } from "@/lib/journeys/preview";
import AnnouncementBar from "@/sections/AnnouncementBar";
import Navbar from "@/sections/Navbar";

export const dynamic = "force-dynamic";

const KINDS: Record<string, LectureKind> = { "one-day": "workshop", free: "free" };

type PageProps = { params: Promise<{ kind: string }> };

export default async function JourneysByTopicPage({ params }: PageProps) {
  const { kind: slug } = await params;
  const kind = KINDS[slug];
  if (!kind) notFound();
  // نسخة تجريبية: للإدارة فقط حتى تعتمدها منى.
  if (JOURNEYS_PAGES_PREVIEW && !(await isPreviewViewer())) notFound();

  const paths = await getTopicLectures(kind);

  return (
    <>
      <AnnouncementBar />
      <Navbar />
      <TopicLecturesView kind={kind} paths={paths} />
    </>
  );
}
