"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/require-admin";
import { applyActiveOffer } from "@/lib/pricing/apply-active-offer";
import {
  CURRENCIES,
  priceFromDiscount,
  type OfferInfo,
  type OfferRow,
  type PriceKind,
} from "@/lib/pricing/offer-table";
import { createAdminClient } from "@/lib/supabase/server";

type Result<T = undefined> = { success: boolean; message?: string; data?: T };

const UUID = /^[0-9a-f-]{36}$/i;
const round2 = (n: number) => Math.round(n * 100) / 100;

function fail(error: unknown): Result<never> {
  return { success: false, message: error instanceof Error ? error.message : "تعذر الحفظ" };
}

function refresh() {
  for (const path of ["/admin/prices", "/admin/whatsapp-sales", "/admin/finance/payments", "/admin/dashboard"]) {
    revalidatePath(path);
  }
  revalidatePath("/", "layout");
}

async function activeOfferId(admin: ReturnType<typeof createAdminClient>) {
  const { data } = await admin.from("price_offer_settings").select("active_offer_id").eq("id", 1).maybeSingle();
  return (data?.active_offer_id as string | null) ?? null;
}

export type PriceCellInput = {
  offerId: string;
  kind: PriceKind;
  courseId: string;
  variantId: string | null;
  currency: string;
  field: "original_price" | "offer_price" | "discount_percent" | "offer_active" | "currency_active";
  value: number | boolean | null;
};

/** Edits one cell of one offer's price row (creates the row if it does not exist yet). */
export async function savePriceCell(input: PriceCellInput): Promise<Result<OfferRow>> {
  try {
    await requireAdmin();
    const currency = String(input.currency).toUpperCase();
    if (
      !UUID.test(input.offerId) ||
      !UUID.test(input.courseId) ||
      (input.variantId != null && !UUID.test(input.variantId)) ||
      !(CURRENCIES as readonly string[]).includes(currency) ||
      (input.kind !== "course" && input.kind !== "oneday")
    ) {
      throw new Error("بيانات السعر غير صحيحة");
    }
    const admin = createAdminClient();
    const variantId = input.kind === "course" ? input.variantId : null;

    let q = admin
      .from("price_offer_rows")
      .select("*")
      .eq("offer_id", input.offerId)
      .eq("kind", input.kind)
      .eq("course_id", input.courseId)
      .eq("currency_code", currency);
    q = variantId ? q.eq("variant_id", variantId) : q.is("variant_id", null);
    const { data: existing } = await q.maybeSingle();

    let original: number | null = existing?.original_price == null ? null : Number(existing.original_price);
    let price = existing ? Number(existing.offer_price) : 0;
    let offerActive = existing ? Boolean(existing.offer_active) : true;
    // New currencies start hidden for the chat until the admin turns them on.
    let currencyActive = existing ? Boolean(existing.currency_active) : currency !== "USD";
    const currentPercent =
      original && original > 0 && price < original ? ((original - price) / original) * 100 : 0;

    if (input.field === "offer_active") offerActive = Boolean(input.value);
    else if (input.field === "currency_active") currencyActive = Boolean(input.value);
    else {
      const n = input.value == null || input.value === "" ? null : Number(input.value);
      if (n == null || !Number.isFinite(n) || n < 0) throw new Error("اكتب رقمًا صحيحًا");
      if (input.field === "original_price") {
        if (n <= 0) throw new Error("اكتب سعرًا أكبر من صفر");
        original = round2(n);
        price = priceFromDiscount(original, currentPercent); // keeps the discount %
      } else if (input.field === "offer_price") {
        if (n <= 0) throw new Error("اكتب سعرًا أكبر من صفر");
        price = round2(n);
        if (original == null || original < price) original = price;
      } else {
        if (n > 100) throw new Error("نسبة الخصم من 0 إلى 100");
        if (original == null || original <= 0) throw new Error("اكتب السعر الأصلي أولًا");
        price = priceFromDiscount(original, n);
      }
    }

    const payload = {
      offer_id: input.offerId,
      kind: input.kind,
      course_id: input.courseId,
      variant_id: variantId,
      currency_code: currency,
      original_price: original,
      offer_price: price,
      offer_active: offerActive,
      currency_active: currencyActive,
      updated_at: new Date().toISOString(),
    };
    const res = existing
      ? await admin.from("price_offer_rows").update(payload).eq("id", existing.id)
      : await admin.from("price_offer_rows").insert(payload);
    if (res.error) throw new Error(res.error.message);

    if ((await activeOfferId(admin)) === input.offerId) await applyActiveOffer(admin);
    refresh();
    return { success: true, data: payload as OfferRow };
  } catch (error) {
    return fail(error);
  }
}

/** Offer name / English name / dates (they apply to the whole offer). */
export async function saveOfferMeta(input: {
  id: string;
  name?: string;
  name_en?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
}): Promise<Result> {
  try {
    await requireAdmin();
    if (!UUID.test(input.id)) throw new Error("العرض غير صحيح");
    const patch: Record<string, unknown> = {};
    if (input.name !== undefined) {
      const name = input.name.trim();
      if (!name) throw new Error("اسم العرض مطلوب");
      patch.name = name;
    }
    if (input.name_en !== undefined) patch.name_en = input.name_en?.trim() || null;
    for (const key of ["starts_at", "ends_at"] as const) {
      if (input[key] !== undefined) {
        const v = input[key];
        patch[key] = v ? new Date(v).toISOString() : null;
      }
    }
    const start = (patch.starts_at ?? input.starts_at) as string | null | undefined;
    const end = (patch.ends_at ?? input.ends_at) as string | null | undefined;
    if (start && end && new Date(end).getTime() <= new Date(start).getTime()) {
      throw new Error("نهاية العرض يجب أن تكون بعد بدايته");
    }
    const admin = createAdminClient();
    const { error } = await admin.from("finance_offers").update(patch).eq("id", input.id);
    if (error) throw new Error(error.message);
    if ((await activeOfferId(admin)) === input.id) await applyActiveOffer(admin);
    refresh();
    return { success: true };
  } catch (error) {
    return fail(error);
  }
}

/** Chooses the offer that really applies in the chat and the platform (null = no offer). */
export async function setActiveOffer(offerId: string | null): Promise<Result<{ updated: number; created: number }>> {
  try {
    await requireAdmin();
    if (offerId !== null && !UUID.test(offerId)) throw new Error("العرض غير صحيح");
    const admin = createAdminClient();
    const { error } = await admin
      .from("price_offer_settings")
      .upsert({ id: 1, active_offer_id: offerId, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    const stats = await applyActiveOffer(admin);
    refresh();
    return { success: true, data: stats };
  } catch (error) {
    return fail(error);
  }
}

/** New offer, optionally copying another offer's prices as a starting point. */
export async function createPriceOffer(input: {
  name: string;
  copyFromOfferId?: string | null;
}): Promise<Result<{ offer: OfferInfo; rows: OfferRow[] }>> {
  try {
    await requireAdmin();
    const name = input.name.trim();
    if (!name) throw new Error("اكتبي اسم العرض");
    const admin = createAdminClient();
    const { data: dup } = await admin.from("finance_offers").select("id").eq("name", name).maybeSingle();
    if (dup) throw new Error("يوجد عرض بنفس الاسم");
    const { data: offer, error } = await admin
      .from("finance_offers")
      .insert({ name, discount_percent: 0, sort_order: 100, is_active: true })
      .select("id,name,name_en,discount_percent,starts_at,ends_at")
      .single();
    if (error || !offer) throw new Error(error?.message ?? "تعذر إنشاء العرض");

    let rows: OfferRow[] = [];
    if (input.copyFromOfferId && UUID.test(input.copyFromOfferId)) {
      const { data: src } = await admin.from("price_offer_rows").select("*").eq("offer_id", input.copyFromOfferId);
      const copy = ((src ?? []) as Array<Record<string, unknown>>).map((r) => ({
        offer_id: offer.id,
        kind: r.kind,
        course_id: r.course_id,
        variant_id: r.variant_id,
        currency_code: r.currency_code,
        original_price: r.original_price,
        offer_price: r.offer_price,
        offer_active: r.offer_active,
        currency_active: r.currency_active,
        updated_at: new Date().toISOString(),
      }));
      if (copy.length) {
        const ins = await admin.from("price_offer_rows").insert(copy);
        if (ins.error) throw new Error(ins.error.message);
        rows = copy as unknown as OfferRow[];
      }
    }
    refresh();
    return {
      success: true,
      data: {
        offer: {
          id: String(offer.id),
          name: String(offer.name),
          name_en: (offer.name_en as string | null) ?? null,
          discount_percent: Number(offer.discount_percent ?? 0),
          starts_at: null,
          ends_at: null,
          is_active: true,
        },
        rows,
      },
    };
  } catch (error) {
    return fail(error);
  }
}
