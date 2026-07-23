import { redirect } from "next/navigation";

import AnnouncementBar from "@/sections/AnnouncementBar";
import Navbar from "@/sections/Navbar";
import StudentJourneyDashboard from "@/components/student/StudentJourneyDashboard";
import { loadStudentWorkspace } from "@/lib/services/student-workspace";

export const dynamic = "force-dynamic";

export default async function StudentDashboardPage() {
  try {
    const { data } = await loadStudentWorkspace();
    return (
      <main dir="rtl" className="min-h-screen bg-white text-[#07152E]">
        <Navbar {...({ activeItem: "journey" } as any)} />
        <div className="h-[55px]" />
        <AnnouncementBar />
        <section className="bg-gradient-to-b from-[#F6F9FD] to-[#EEF4FB] border-b border-[#DCE6F2] rounded-b-[28px]">
          <StudentJourneyDashboard data={data} />
        </section>
      </main>
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") redirect("/login?next=/dashboard");
    throw error;
  }
}
