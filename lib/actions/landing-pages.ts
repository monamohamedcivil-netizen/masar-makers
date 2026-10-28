"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/server";
import {
  CIVIL3D_TEMPLATE,
  withDefaults,
  type LandingContent,
  type LandingPageRow,
} from "@/lib/landing/types";

/* =========================================================
   صفحات هبوط الإعلانات — إجراءات لوحة التحكم
========================================================= */

type Result<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,60}$/;
const MAX_ASSET_BYTES = 600 * 1024;

function errorText(error: unknown) {
  return error instanceof Error ? error.message : "خطأ غير متوقع.";
}

async function db() {
  await requireAdmin();
  return createAdminClient();
}

function clean(row: Record<string, unknown>): LandingPageRow {
  return { ...(row as LandingPageRow), content: withDefaults(row.content) };
}

export async function listLandingPages(): Promise<LandingPageRow[]> {
  const supabase = await db();
  const { data, error } = await supabase
    .from("ad_landing_pages")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(clean);
}

export async function getLandingPageForAdmin(id: string): Promise<LandingPageRow | null> {
  const supabase = await db();
  const { data, error } = await supabase.from("ad_landing_pages").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? clean(data) : null;
}

/** صفحة جديدة = نسخة من صفحة موجودة (أو من نموذج Civil 3D) كمسودة. */
export async function duplicateLandingPage(
  sourceId: string | null,
  slug: string,
  title: string,
): Promise<Result<{ id: string }>> {
  try {
    const s = slug.trim().toLowerCase();
    if (!SLUG_RE.test(s)) {
      return { ok: false, error: "رابط الصفحة لازم يكون بالإنجليزي الصغير وأرقام وشرطة فقط، مثال: csd-dec" };
    }
    const supabase = await db();
    let content: LandingContent = CIVIL3D_TEMPLATE;
    let whatsapp = "201031885659";
    let pixel: string | null = null;
    if (sourceId) {
      const { data } = await supabase.from("ad_landing_pages").select("*").eq("id", sourceId).maybeSingle();
      if (data) {
        content = withDefaults(data.content);
        whatsapp = data.whatsapp_number;
        pixel = data.meta_pixel_id;
      }
    }
    const { data, error } = await supabase
      .from("ad_landing_pages")
      .insert({
        slug: s,
        title: title.trim() || s,
        status: "draft",
        content,
        whatsapp_number: whatsapp,
        meta_pixel_id: pixel,
      })
      .select("id")
      .single();
    if (error) {
      return { ok: false, error: error.code === "23505" ? "الرابط ده مستخدم في صفحة تانية." : error.message };
    }
    revalidatePath("/admin/content/landing-pages");
    return { ok: true, data: { id: data.id } };
  } catch (error) {
    return { ok: false, error: errorText(error) };
  }
}

export async function saveLandingPage(input: {
  id: string;
  slug: string;
  title: string;
  status: "draft" | "published";
  whatsappNumber: string;
  metaPixelId: string;
  content: LandingContent;
}): Promise<Result> {
  try {
    const slug = input.slug.trim().toLowerCase();
    if (!SLUG_RE.test(slug)) {
      return { ok: false, error: "رابط الصفحة لازم يكون بالإنجليزي الصغير وأرقام وشرطة فقط." };
    }
    const whatsapp = input.whatsappNumber.replace(/[^0-9]/g, "");
    if (whatsapp.length < 10) {
      return { ok: false, error: "رقم الواتساب لازم يكون بكود الدولة، مثال: 201031885659" };
    }
    const pixel = input.metaPixelId.replace(/[^0-9]/g, "") || null;
    const supabase = await db();
    const { data: before } = await supabase.from("ad_landing_pages").select("slug").eq("id", input.id).maybeSingle();
    const { error } = await supabase
      .from("ad_landing_pages")
      .update({
        slug,
        title: input.title.trim() || slug,
        status: input.status,
        whatsapp_number: whatsapp,
        meta_pixel_id: pixel,
        content: withDefaults(input.content),
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.id);
    if (error) {
      return { ok: false, error: error.code === "23505" ? "الرابط ده مستخدم في صفحة تانية." : error.message };
    }
    revalidatePath(`/lp/${slug}`);
    if (before?.slug && before.slug !== slug) revalidatePath(`/lp/${before.slug}`);
    revalidatePath("/admin/content/landing-pages");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: errorText(error) };
  }
}

export async function deleteLandingPage(id: string): Promise<Result> {
  try {
    const supabase = await db();
    const { data: row } = await supabase.from("ad_landing_pages").select("slug,status").eq("id", id).maybeSingle();
    if (row?.status === "published") {
      return { ok: false, error: "حوّلي الصفحة لمسودة الأول قبل الحذف (ممكن يكون عليها إعلان شغال)." };
    }
    const { error } = await supabase.from("ad_landing_pages").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/content/landing-pages");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: errorText(error) };
  }
}

/** رفع صورة صغيرة (WebP من المتصفح) وتخزينها في قاعدة البيانات، وترجع رابطها /lp-asset/<id>. */
export async function uploadLandingAsset(input: {
  pageId: string;
  name: string;
  mime: string;
  base64: string;
}): Promise<Result<{ url: string }>> {
  try {
    if (!/^image\/(webp|png|jpeg|gif)$/.test(input.mime)) {
      return { ok: false, error: "الملف لازم يكون صورة." };
    }
    const bytes = Buffer.from(input.base64, "base64");
    if (bytes.length > MAX_ASSET_BYTES) {
      return { ok: false, error: "الصورة كبيرة. الحد الأقصى 600 KB بعد الضغط." };
    }
    const supabase = await db();
    const { data, error } = await supabase
      .from("ad_landing_assets")
      .insert({
        page_id: input.pageId,
        name: input.name.slice(0, 120),
        mime: input.mime,
        size_bytes: bytes.length,
        data: `\\x${bytes.toString("hex")}`,
      })
      .select("id")
      .single();
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: { url: `/lp-asset/${data.id}` } };
  } catch (error) {
    return { ok: false, error: errorText(error) };
  }
}
