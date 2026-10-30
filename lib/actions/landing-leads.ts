"use server";

import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/server";

/* =========================================================
   حجوزات صفحات الهبوط: كل ضغطة على «إرسال بياناتي على واتساب»
   تتسجل هنا قبل فتح واتساب، عشان نحسب نسبة التحويل.
========================================================= */

export type LandingLeadRow = {
  id: string;
  slug: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  plan: string;
  utm_source: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  status: string;
  created_at: string;
};

function cut(value: unknown, max: number) {
  return String(value ?? "").trim().slice(0, max);
}

export async function recordLandingLead(input: {
  slug: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  plan: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
}): Promise<{ ok: boolean }> {
  try {
    const slug = cut(input.slug, 61).toLowerCase();
    const name = cut(input.name, 120);
    const phone = cut(input.phone, 40);
    // الزائر ممكن يتواصل من غير ما يكتب بياناته، فنسجل الضغطة في كل الأحوال.
    if (!/^[a-z0-9][a-z0-9-]{1,60}$/.test(slug)) {
      return { ok: false };
    }

    const supabase = createAdminClient();
    const { data: page } = await supabase
      .from("ad_landing_pages")
      .select("id,status")
      .eq("slug", slug)
      .maybeSingle();
    if (!page) return { ok: false };

    // نفس الرقم على نفس الصفحة خلال 10 دقائق = ضغطة مكررة.
    if (phone.replace(/[^0-9]/g, "").length >= 8) {
      const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from("ad_landing_leads")
        .select("id", { count: "exact", head: true })
        .eq("page_id", page.id)
        .eq("phone", phone)
        .gte("created_at", since);
      if ((count ?? 0) > 0) return { ok: true };
    }

    const { error } = await supabase.from("ad_landing_leads").insert({
      page_id: page.id,
      slug,
      name,
      email: cut(input.email, 160),
      phone,
      country: cut(input.country, 60),
      plan: cut(input.plan, 120),
      utm_source: cut(input.utmSource, 80) || null,
      utm_medium: cut(input.utmMedium, 80) || null,
      utm_campaign: cut(input.utmCampaign, 120) || null,
      utm_content: cut(input.utmContent, 120) || null,
      is_test: page.status !== "published",
    });
    return { ok: !error };
  } catch {
    return { ok: false };
  }
}

export async function listLandingLeads(pageId: string, limit = 200): Promise<LandingLeadRow[]> {
  await requireAdmin();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("ad_landing_leads")
    .select("id,slug,name,email,phone,country,plan,utm_source,utm_campaign,utm_content,status,created_at")
    .eq("page_id", pageId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as LandingLeadRow[];
}

export async function countLandingLeads(): Promise<Record<string, number>> {
  await requireAdmin();
  const supabase = createAdminClient();
  const { data } = await supabase.from("ad_landing_leads").select("page_id").eq("is_test", false).limit(5000);
  const out: Record<string, number> = {};
  for (const row of data ?? []) out[row.page_id] = (out[row.page_id] ?? 0) + 1;
  return out;
}
