import type { SupabaseClient } from "@supabase/supabase-js";

import { egpFromSar, isEgyptResident } from "@/lib/pricing/student-currency";
import { findChatCourse, isOneDayJourneyType, variantStageOf } from "@/lib/webchat/courses";

/*
 * «السعر الأصلي» المقترح لطلب اشتراك، من أسعار الكورس في «قوائم الشات والأسعار»:
 * السعر قبل الخصم (original_price) وإلا السعر الحالي، لكل عملة.
 * - رحلة يوم واحد: سعر المحاضرة الخاص، وإلا السعر العام للكورس.
 * - أساسيات / متقدم: سعر نوع الاشتراك نفسه.
 * - متكاملة في كورس بمرحلتين: main = سعر الأساسيات، advanced = سعر المتقدم.
 * - كورس بمرحلة واحدة: سعر الكورس.
 * - سعر الجنيه للطالب غير المقيم في مصر (البلد ليس مصر أو الرقم أجنبي) = سعر الريال × سعر صرف الريال،
 *   مقرّبًا لأقرب 50 جنيه (نفس قاعدة الشات).
 * ملف سيرفر عادي (ليس "use server").
 */

export type CurrencyPrices = Record<string, number>;
export type ListPriceSuggestion = { main: CurrencyPrices; advanced?: CurrencyPrices };

type AnyRow = Record<string, any>;

export type EnrollmentForPricing = {
  id: string;
  course_id: string | null;
  journey_type: string | null;
  action_key?: string | null;
  user_id?: string | null;
};

const norm = (v: unknown) => String(v ?? "").trim().toLowerCase().replaceAll("-", "_");

/** Integrated / professional journey (all stages). */
export function isFullProfessionalJourney(journeyType: unknown) {
  return ["integrated", "professional", "career_path", "career", ""].includes(norm(journeyType));
}

function listPriceOf(row: AnyRow) {
  const original = row.original_price == null || row.original_price === "" ? null : Number(row.original_price);
  const current = Number(row.current_price);
  if (original != null && Number.isFinite(original) && original > 0) return original;
  return Number.isFinite(current) && current > 0 ? current : null;
}

function byCurrency(rows: AnyRow[]): CurrencyPrices {
  const out: CurrencyPrices = {};
  for (const r of rows) {
    const code = String(r.currency_code ?? "").toUpperCase();
    const price = listPriceOf(r);
    if (code && price != null && out[code] == null) out[code] = price;
  }
  return out;
}

export function lessonIdFromActionKey(actionKey: unknown) {
  return String(actionKey ?? "").match(/lesson:([0-9a-f-]{36})/i)?.[1]?.toLowerCase() ?? null;
}

export async function suggestListPrices(
  db: SupabaseClient,
  enrollments: EnrollmentForPricing[],
): Promise<Map<string, ListPriceSuggestion>> {
  const out = new Map<string, ListPriceSuggestion>();
  const courseIds = [...new Set(enrollments.map((e) => e.course_id).filter(Boolean))] as string[];
  if (!courseIds.length) return out;

  const [{ data: courses }, { data: chatCourses }, { data: variants }, { data: prices }, { data: oneDay }] =
    await Promise.all([
      db.from("courses").select("id,title,course_code,level").in("id", courseIds),
      db.from("whatsapp_courses").select("id,course_key,title,whatsapp_label,has_variants"),
      db.from("whatsapp_course_variants").select("id,course_id,variant_key,title,title_en"),
      db.from("whatsapp_course_prices").select("course_id,variant_id,currency_code,current_price,original_price,is_active,sort_order").eq("is_active", true).order("sort_order"),
      db.from("whatsapp_oneday_prices").select("course_id,lesson_id,currency_code,current_price,original_price,is_active,sort_order").eq("is_active", true).order("sort_order"),
    ]);

  // Pound prices for students not living in Egypt come from the riyal price.
  const userIds = [...new Set(enrollments.map((e) => e.user_id).filter(Boolean))] as string[];
  const [{ data: profiles }, { data: sarRate }] = await Promise.all([
    userIds.length
      ? db.from("profiles").select("id,country,phone").in("id", userIds)
      : Promise.resolve({ data: [] as AnyRow[] }),
    db.from("finance_exchange_rates").select("rate_to_egp").eq("currency", "SAR").maybeSingle(),
  ]);
  const resident = new Map(
    ((profiles ?? []) as AnyRow[]).map((p) => [String(p.id), isEgyptResident(p.country, p.phone)]),
  );
  const rate = Number((sarRate as AnyRow | null)?.rate_to_egp);
  const forStudent = (userId: string | null | undefined, prices: CurrencyPrices): CurrencyPrices => {
    if (!userId || resident.get(String(userId)) !== false) return prices;
    const out = { ...prices };
    delete out.EGP;
    if (prices.SAR != null && Number.isFinite(rate) && rate > 0) out.EGP = egpFromSar(prices.SAR, rate);
    return out;
  };
  const setFor = (e: EnrollmentForPricing, s: ListPriceSuggestion) =>
    out.set(e.id, {
      main: forStudent(e.user_id, s.main),
      ...(s.advanced ? { advanced: forStudent(e.user_id, s.advanced) } : {}),
    });

  const courseById = new Map(((courses ?? []) as AnyRow[]).map((c) => [String(c.id), c]));
  const chatList = (chatCourses ?? []) as AnyRow[];
  const variantList = (variants ?? []) as AnyRow[];
  const priceList = (prices ?? []) as AnyRow[];
  const oneDayList = (oneDay ?? []) as AnyRow[];

  for (const e of enrollments) {
    const course = e.course_id ? courseById.get(String(e.course_id)) : null;
    if (!course) continue;
    const chat = findChatCourse(chatList, `${course.course_code ?? ""} ${course.title ?? ""}`);
    if (!chat) continue;
    const journey = norm(e.journey_type);

    if (journey === "workshop" || isOneDayJourneyType(journey)) {
      const rows = oneDayList.filter((r) => String(r.course_id) === String(chat.id));
      const lessonId = lessonIdFromActionKey(e.action_key);
      const special = lessonId ? rows.filter((r) => String(r.lesson_id ?? "").toLowerCase() === lessonId) : [];
      const general = rows.filter((r) => !r.lesson_id);
      setFor(e, { main: { ...byCurrency(general), ...byCurrency(special) } });
      continue;
    }

    const chatPrices = priceList.filter((r) => String(r.course_id) === String(chat.id));
    const variantOf = (stage: "fundamental" | "advanced" | "integrated") =>
      variantList.find((v) => String(v.course_id) === String(chat.id) && variantStageOf(v) === stage);
    const pricesOfVariant = (stage: "fundamental" | "advanced" | "integrated") => {
      const v = variantOf(stage);
      return v ? byCurrency(chatPrices.filter((r) => String(r.variant_id) === String(v.id))) : {};
    };
    const isSplit = String(course.level ?? "").toLowerCase() === "split";

    if (journey === "fundamental" || journey === "fundamentals") {
      setFor(e, { main: pricesOfVariant("fundamental") });
    } else if (journey === "advanced") {
      setFor(e, { main: pricesOfVariant("advanced") });
    } else if (isSplit) {
      setFor(e, { main: pricesOfVariant("fundamental"), advanced: pricesOfVariant("advanced") });
    } else {
      const single = byCurrency(chatPrices.filter((r) => !r.variant_id));
      setFor(e, { main: Object.keys(single).length ? single : pricesOfVariant("integrated") });
    }
  }

  return out;
}
