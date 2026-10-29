import { notFound } from "next/navigation";

import LandingWithJourneys from "@/components/landing-home/LandingWithJourneys";
import { isPreviewViewer } from "@/lib/journeys/preview";

export const dynamic = "force-dynamic";

/** نسخة تجريبية للإدارة فقط: الصفحة الرئيسية الجديدة + مركز الرحلات أسفلها. */
export default async function LandingPreviewPage() {
  if (!(await isPreviewViewer())) notFound();
  return <LandingWithJourneys />;
}
