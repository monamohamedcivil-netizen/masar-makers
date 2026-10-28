import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import { notFound } from "next/navigation";

import LandingView from "@/components/landing/LandingView";
import { withDefaults } from "@/lib/landing/types";
import { createAdminClient, createClient } from "@/lib/supabase/server";

import "../landing.css";

/* صفحة هبوط إعلان: /lp/<slug> — تُعدَّل من /admin/content/landing-pages */

export const dynamic = "force-dynamic";

const mono = JetBrains_Mono({
  variable: "--lp-mono",
  subsets: ["latin"],
  weight: ["500", "700"],
  display: "swap",
});

type PageProps = {
  params: Promise<{ slug: string }>;
};

async function isAdminViewer() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;
    const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    return ["admin", "super_admin"].includes(String(data?.role));
  } catch {
    return false;
  }
}

async function loadPage(slug: string) {
  if (!/^[a-z0-9][a-z0-9-]{1,60}$/.test(slug)) return null;
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("ad_landing_pages")
    .select("id,slug,title,status,whatsapp_number,meta_pixel_id,content")
    .eq("slug", slug)
    .maybeSingle();
  if (!data) return null;
  if (data.status !== "published" && !(await isAdminViewer())) return null;
  return { ...data, content: withDefaults(data.content) };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await loadPage(slug);
  if (!page) return { title: "Masar Makers" };
  return {
    title: page.content.seo.title,
    description: page.content.seo.description,
    openGraph: {
      title: page.content.seo.title,
      description: page.content.seo.description,
      images: page.content.hero.image ? [page.content.hero.image] : undefined,
      locale: "ar_AR",
      type: "website",
    },
    robots: page.status === "published" ? undefined : { index: false, follow: false },
  };
}

export default async function LandingPage({ params }: PageProps) {
  const { slug } = await params;
  const page = await loadPage(slug);
  if (!page) notFound();

  return (
    <div className={mono.variable}>
      <LandingView
        content={page.content}
        whatsappNumber={page.whatsapp_number}
        pixelId={page.meta_pixel_id}
        isDraft={page.status !== "published"}
        slug={page.slug}
      />
    </div>
  );
}
