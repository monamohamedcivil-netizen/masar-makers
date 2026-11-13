import type { createAdminClient } from "@/lib/supabase/server";
import { CURRENCY_LABEL, type CurrencyCode } from "@/lib/pricing/offer-table";

type Admin = ReturnType<typeof createAdminClient>;
type Row = Record<string, any>;

const SORT: Record<string, number> = { SAR: 10, EGP: 20, USD: 30 };

/**
 * Copies the ACTIVE offer's prices into the live tables read by the chat, the payments
 * list prices and the enrollment suggestions (whatsapp_course_prices / whatsapp_oneday_prices).
 * Only rows whose values changed are written. A price missing from the active offer
 * goes back to its original price with no discount.
 */
export async function applyActiveOffer(admin: Admin): Promise<{ updated: number; created: number }> {
  const { data: settings } = await admin.from("price_offer_settings").select("active_offer_id").eq("id", 1).maybeSingle();
  const offerId = (settings?.active_offer_id as string | null) ?? null;

  const { data: offer } = offerId
    ? await admin.from("finance_offers").select("id,name,name_en,starts_at,ends_at").eq("id", offerId).maybeSingle()
    : { data: null };
  const { data: offerRows } = offerId
    ? await admin.from("price_offer_rows").select("*").eq("offer_id", offerId)
    : { data: [] as Row[] };

  const byKey = new Map<string, Row>();
  for (const r of (offerRows ?? []) as Row[]) {
    byKey.set(`${r.kind}|${r.course_id}|${r.variant_id ?? "-"}|${String(r.currency_code).toUpperCase()}`, r);
  }

  let updated = 0;
  let created = 0;
  const now = new Date().toISOString();

  for (const kind of ["course", "oneday"] as const) {
    const table = kind === "course" ? "whatsapp_course_prices" : "whatsapp_oneday_prices";
    let q = admin.from(table).select("*");
    if (kind === "oneday") q = q.is("lesson_id", null);
    const { data: live } = await q;
    const seen = new Set<string>();

    for (const l of (live ?? []) as Row[]) {
      const variantId = kind === "course" ? ((l.variant_id as string | null) ?? null) : null;
      const key = `${kind}|${l.course_id}|${variantId ?? "-"}|${String(l.currency_code).toUpperCase()}`;
      seen.add(key);
      const o = byKey.get(key);
      let patch: Row;
      if (o && offer) {
        patch = {
          current_price: Number(o.offer_price),
          original_price: o.original_price == null ? null : Number(o.original_price),
          offer_label: offer.name,
          offer_label_en: offer.name_en ?? l.offer_label_en ?? null,
          offer_active: Boolean(o.offer_active),
          offer_start: offer.starts_at ?? null,
          offer_end: offer.ends_at ?? null,
          is_active: Boolean(o.currency_active),
        };
      } else {
        const original = l.original_price == null ? 0 : Number(l.original_price);
        patch = { offer_active: false };
        if (original > 0) patch.current_price = original;
      }
      const changed = Object.entries(patch).some(([k, v]) => {
        const cur = l[k];
        if (v == null || cur == null) return (v ?? null) !== (cur ?? null);
        if (k === "offer_start" || k === "offer_end") return new Date(String(v)).getTime() !== new Date(String(cur)).getTime();
        if (typeof v === "number") return Number(cur) !== v;
        return cur !== v;
      });
      if (!changed) continue;
      const { error } = await admin.from(table).update({ ...patch, updated_at: now }).eq("id", l.id);
      if (error) throw new Error(error.message);
      updated += 1;
    }

    // Prices in the offer that have no live row yet (e.g. USD) → create it.
    if (offer) {
      for (const [key, o] of byKey) {
        if (!key.startsWith(`${kind}|`) || seen.has(key)) continue;
        const code = String(o.currency_code).toUpperCase();
        const insert: Row = {
          course_id: o.course_id,
          currency_code: code,
          currency_label: CURRENCY_LABEL[code as CurrencyCode] ?? code,
          current_price: Number(o.offer_price),
          original_price: o.original_price == null ? null : Number(o.original_price),
          offer_label: offer.name,
          offer_label_en: offer.name_en ?? null,
          offer_active: Boolean(o.offer_active),
          offer_start: offer.starts_at ?? null,
          offer_end: offer.ends_at ?? null,
          is_active: Boolean(o.currency_active),
          sort_order: SORT[code] ?? 40,
          updated_at: now,
        };
        if (kind === "course") insert.variant_id = o.variant_id ?? null;
        else insert.lesson_id = null;
        const { error } = await admin.from(table).insert(insert);
        if (error) throw new Error(error.message);
        created += 1;
      }
    }
  }
  return { updated, created };
}
