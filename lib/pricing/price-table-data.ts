import { createAdminClient } from "@/lib/supabase/server";
import { getOneDayLessons } from "@/lib/queries/whatsapp-sales";
import { findChatCourse, variantStageOf } from "@/lib/webchat/courses";
import {
  EMPTY_PRICE_TABLE,
  type OfferInfo,
  type OfferRow,
  type PriceCourse,
  type PriceTableData,
  type PriceVariant,
} from "@/lib/pricing/offer-table";

/** Reads the price table data (server only). If the migration was not applied yet, `ready` is false. */
export async function getPriceTableData(): Promise<PriceTableData> {
  try {
    const db = createAdminClient();
    const [offersRes, rowsRes, settingsRes, coursesRes, variantsRes] = await Promise.all([
      db.from("finance_offers").select("id,name,name_en,discount_percent,starts_at,ends_at,is_active,sort_order").order("sort_order").order("created_at"),
      db.from("price_offer_rows").select("offer_id,kind,course_id,variant_id,currency_code,original_price,offer_price,offer_active,currency_active,updated_at"),
      db.from("price_offer_settings").select("active_offer_id").eq("id", 1).maybeSingle(),
      db.from("whatsapp_courses").select("id,course_key,title,whatsapp_label,track,has_variants,sort_order").eq("is_active", true).order("sort_order"),
      db.from("whatsapp_course_variants").select("id,course_id,title,sort_order").eq("is_active", true).order("sort_order"),
    ]);
    if (offersRes.error || rowsRes.error || settingsRes.error) return EMPTY_PRICE_TABLE;

    const num = (v: unknown) => (v == null ? null : Number(v));
    const offers: OfferInfo[] = ((offersRes.data ?? []) as Array<Record<string, unknown>>)
      .filter((o) => o.is_active !== false)
      .map((o) => ({
        id: String(o.id),
        name: String(o.name),
        name_en: (o.name_en as string | null) ?? null,
        discount_percent: Number(o.discount_percent ?? 0),
        starts_at: (o.starts_at as string | null) ?? null,
        ends_at: (o.ends_at as string | null) ?? null,
        is_active: true,
      }));
    const rows: OfferRow[] = ((rowsRes.data ?? []) as Array<Record<string, unknown>>).map((r) => ({
      offer_id: String(r.offer_id),
      kind: r.kind === "oneday" ? "oneday" : "course",
      course_id: String(r.course_id),
      variant_id: (r.variant_id as string | null) ?? null,
      currency_code: String(r.currency_code).toUpperCase(),
      original_price: num(r.original_price),
      offer_price: Number(r.offer_price ?? 0),
      offer_active: r.offer_active !== false,
      currency_active: r.currency_active !== false,
      updated_at: (r.updated_at as string | null) ?? null,
    }));
    const courses: PriceCourse[] = ((coursesRes.data ?? []) as Array<Record<string, unknown>>).map((c) => ({
      id: String(c.id),
      title: String(c.whatsapp_label || c.title || ""),
      track: (c.track as string | null) ?? null,
      has_variants: Boolean(c.has_variants),
      sort_order: Number(c.sort_order ?? 0),
    }));
    const variants: PriceVariant[] = ((variantsRes.data ?? []) as Array<Record<string, unknown>>).map((v) => ({
      id: String(v.id),
      course_id: String(v.course_id),
      title: String(v.title ?? ""),
      sort_order: Number(v.sort_order ?? 0),
    }));
    // Lecture counts: published platform lessons, matched to the chat courses by name.
    const lectureCounts: Record<string, number> = {};
    const oneDayLectureCounts: Record<string, number> = {};
    try {
      const { data: platform } = await db.from("courses").select("id,title,title_ar,is_active");
      const chatList = ((coursesRes.data ?? []) as Array<Record<string, unknown>>).map((c) => ({
        id: String(c.id),
        course_key: c.course_key as string | null,
        title: c.title as string | null,
        whatsapp_label: c.whatsapp_label as string | null,
      }));
      const platformByChat = new Map<string, string>();
      for (const pc of ((platform ?? []) as Array<Record<string, unknown>>).filter((x) => x.is_active !== false)) {
        const chat = findChatCourse(chatList, `${pc.title ?? ""} ${pc.title_ar ?? ""}`);
        if (chat && !platformByChat.has(chat.id)) platformByChat.set(chat.id, String(pc.id));
      }
      const ids = [...new Set(platformByChat.values())];
      const { data: lessons } = ids.length
        ? await db.from("lessons").select("course_id,course_part").in("course_id", ids).eq("status", "published")
        : { data: [] as Array<Record<string, unknown>> };
      const byPlatform = new Map<string, { all: number; fund: number; adv: number }>();
      for (const l of (lessons ?? []) as Array<Record<string, unknown>>) {
        const key = String(l.course_id);
        const part = String(l.course_part ?? "").trim().toLowerCase();
        const cur = byPlatform.get(key) ?? { all: 0, fund: 0, adv: 0 };
        cur.all += 1;
        if (part.startsWith("fund")) cur.fund += 1;
        else if (part === "advanced") cur.adv += 1;
        byPlatform.set(key, cur);
      }
      const oneDay = await getOneDayLessons(chatList as unknown as Parameters<typeof getOneDayLessons>[0]).catch(() => []);
      for (const l of oneDay) {
        oneDayLectureCounts[l.chat_course_id] = (oneDayLectureCounts[l.chat_course_id] ?? 0) + 1;
      }
      for (const [chatId, platformId] of platformByChat) {
        const counts = byPlatform.get(platformId);
        if (!counts) continue;
        lectureCounts[`${chatId}|-`] = counts.all;
        for (const v of variants.filter((x) => x.course_id === chatId)) {
          const stage = variantStageOf({ title: v.title });
          lectureCounts[`${chatId}|${v.id}`] =
            stage === "fundamental" ? counts.fund : stage === "advanced" ? counts.adv : counts.all;
        }
      }
    } catch {
      // The column just shows "—".
    }
    return {
      ready: true,
      offers,
      activeOfferId: (settingsRes.data?.active_offer_id as string | null) ?? null,
      rows,
      courses,
      variants,
      lectureCounts,
      oneDayLectureCounts,
    };
  } catch {
    return EMPTY_PRICE_TABLE;
  }
}
