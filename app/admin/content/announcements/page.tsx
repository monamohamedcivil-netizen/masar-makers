import Link from "next/link";

import AdminPageHeader from "@/components/admin/layout/AdminPageHeader";
import AnnouncementsManager from "@/components/admin/announcements/AnnouncementsManager";
import CustomEmailComposer from "@/components/admin/announcements/CustomEmailComposer";
import { getAdminPlatformAnnouncements } from "@/lib/admin/platform-announcements";
import { listRecentEmailCampaigns } from "@/lib/admin/custom-email";
import { buildPageOptions } from "@/lib/links/destinations";
import { createAdminClient } from "@/lib/supabase/server";
import LandingPagesSection from "@/components/admin/content/LandingPagesSection";
import LandingPromosSection from "@/components/admin/content/LandingPromosSection";

export const dynamic = "force-dynamic";

const TABS = [
  { key: "platform", label: "شريط المنصة" },
  { key: "emails", label: "ايميلات" },
  { key: "promos", label: "إعلانات صفحة البداية" },
  { key: "landing", label: "صفحات هبوط الإعلانات" },
] as const;

type Row = Record<string, unknown>;

const text = (value: unknown) => String(value ?? "").trim();

export default async function AnnouncementsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: rawTab } = await searchParams;
  const tab = TABS.some((item) => item.key === rawTab) ? (rawTab as (typeof TABS)[number]["key"]) : "platform";
  const db = createAdminClient();

  const [announcements, campaigns, stationsResult, pathsResult, chatCoursesResult] = await Promise.all([
    getAdminPlatformAnnouncements(),
    listRecentEmailCampaigns(),
    db.from("course_stations").select("slug,title,short_title,display_order").order("display_order"),
    db.from("career_paths").select("slug,title,title_ar,display_order").order("display_order"),
    db.from("whatsapp_courses").select("id,title,whatsapp_label,sort_order").eq("is_active", true).order("sort_order"),
  ]);

  // قائمة الصفحات في «وجهة الزر»: كورسات (محطات) ومسارات مهنية، بالإضافة للصفحات الثابتة.
  const pageOptions = buildPageOptions({
    courses: ((stationsResult.data ?? []) as Row[])
      .filter((row) => text(row.slug))
      .map((row) => ({ slug: text(row.slug), title: text(row.short_title) || text(row.title) || text(row.slug) })),
    careerPaths: ((pathsResult.data ?? []) as Row[])
      .filter((row) => text(row.slug))
      .map((row) => ({ slug: text(row.slug), title: text(row.title_ar) || text(row.title) || text(row.slug) })),
  });

  return (
    <>
      <AdminPageHeader
        title="الإعلانات"
        description="شريط المنصة، الإيميلات، إعلانات صفحة البداية، وصفحات هبوط الإعلانات."
      />

      <nav className="mb-5 flex flex-wrap gap-2" aria-label="تبويبات الإعلانات">
        {TABS.map((item) => (
          <Link
            key={item.key}
            href={`/admin/content/announcements?tab=${item.key}`}
            className={`rounded-xl px-4 py-2 text-sm font-black transition ${
              tab === item.key
                ? "bg-[#07152E] text-white"
                : "bg-white text-[#07152E] ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {tab === "platform" ? (
        <AnnouncementsManager
          initialAnnouncements={announcements}
          pageOptions={pageOptions}
          chatCourses={((chatCoursesResult.data ?? []) as Row[]).map((row) => ({
            id: text(row.id),
            label: text(row.whatsapp_label) || text(row.title),
          }))}
        />
      ) : null}

      {tab === "emails" ? <CustomEmailComposer recentCampaigns={campaigns} /> : null}
      {tab === "promos" ? <LandingPromosSection /> : null}
      {tab === "landing" ? <LandingPagesSection /> : null}
    </>
  );
}
