import { redirect } from "next/navigation";

import AnnouncementBar from "@/sections/AnnouncementBar";
import Navbar from "@/sections/Navbar";
import StudentJourneyDashboard from "@/components/student/StudentJourneyDashboard";
import type { WorkspacePanelId } from "@/components/student/workspace/types";
import { loadStudentWorkspace } from "@/lib/services/student-workspace";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    panel?: string | string[];
    lesson?: string | string[];
  }>;
};

const allowedPanels: WorkspacePanelId[] = [
  "career",
  "one-day",
  "free",
  "next",
  "certificates",
  "achievements",
  "surveys",
  "projects",
];

function resolvePanel(value: string | string[] | undefined) {
  const panel = Array.isArray(value) ? value[0] : value;

  return allowedPanels.includes(panel as WorkspacePanelId)
    ? (panel as WorkspacePanelId)
    : undefined;
}

export default async function StudentDashboardPage({
  searchParams,
}: PageProps) {
  try {
    const params = searchParams ? await searchParams : undefined;
    const initialPanelId = resolvePanel(params?.panel);
    const initialLessonId = Array.isArray(params?.lesson)
      ? params?.lesson[0]
      : params?.lesson;

    const { data } = await loadStudentWorkspace();

    return (
      <main dir="rtl" className="min-h-screen bg-white text-[#07152E]">
        <Navbar {...({ activeItem: "journey" } as any)} />
        <div className="h-[55px]" />
        <AnnouncementBar />

        <section className="rounded-b-[28px] border-b border-[#DCE6F2] bg-gradient-to-b from-[#F6F9FD] to-[#EEF4FB]">
          <StudentJourneyDashboard
            data={data}
            initialPanelId={initialPanelId}
            initialLessonId={initialLessonId}
          />
        </section>
      </main>
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "UNAUTHENTICATED"
    ) {
      redirect("/login?next=/dashboard");
    }

    throw error;
  }
}