/** Shared (client + server) types and helpers for the unified price table. */

export type PriceKind = "course" | "oneday";
export type PriceTrack = "Road Design" | "Traffic Engineering" | "other";
export const CURRENCIES = ["EGP", "SAR", "USD"] as const;
export type CurrencyCode = (typeof CURRENCIES)[number];

export const CURRENCY_LABEL: Record<CurrencyCode, string> = {
  EGP: "جنيه مصري",
  SAR: "ريال سعودي",
  USD: "دولار أمريكي",
};

export type OfferInfo = {
  id: string;
  name: string;
  name_en: string | null;
  discount_percent: number;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
};

export type OfferRow = {
  offer_id: string;
  kind: PriceKind;
  course_id: string;
  variant_id: string | null;
  currency_code: string;
  original_price: number | null;
  offer_price: number;
  offer_active: boolean;
  currency_active: boolean;
  updated_at: string | null;
};

export type PriceCourse = {
  id: string;
  title: string;
  track: string | null;
  has_variants: boolean;
  sort_order: number;
};
export type PriceVariant = { id: string; course_id: string; title: string; sort_order: number };

export type PriceTableData = {
  ready: boolean;
  offers: OfferInfo[];
  activeOfferId: string | null;
  rows: OfferRow[];
  courses: PriceCourse[];
  variants: PriceVariant[];
  /** Published lecture count per chat course / variant: key = `${courseId}|${variantId ?? "-"}`. */
  lectureCounts: Record<string, number>;
};

export const EMPTY_PRICE_TABLE: PriceTableData = {
  ready: false,
  offers: [],
  activeOfferId: null,
  rows: [],
  courses: [],
  variants: [],
  lectureCounts: {},
};

export function rowKey(kind: PriceKind, courseId: string, variantId: string | null, currency: string) {
  return `${kind}|${courseId}|${variantId ?? "-"}|${currency}`;
}

export function trackOf(value: string | null | undefined): PriceTrack {
  const n = (value ?? "").trim().toLowerCase();
  if (n === "road design" || n === "roads" || n === "road" || n.includes("تصميم الطرق") || n.includes("هندسة الطرق")) {
    return "Road Design";
  }
  if (n === "traffic engineering" || n === "traffic" || n.includes("هندسة المرور") || n.includes("مرور")) {
    return "Traffic Engineering";
  }
  return "other";
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function discountPercent(original: number | null, price: number): number {
  if (!original || original <= 0 || price >= original) return 0;
  return Math.round(((original - price) / original) * 1000) / 10;
}

export function priceFromDiscount(original: number, percent: number): number {
  return round2(original * (1 - Math.min(Math.max(percent, 0), 100) / 100));
}

/** Offers that have dates and whose date ranges intersect (null = open ended). */
export function findOverlaps(offers: OfferInfo[], offerIdsWithRows: Set<string>): OfferInfo[] {
  const dated = offers.filter(
    (o) => offerIdsWithRows.has(o.id) && (o.starts_at || o.ends_at),
  );
  const range = (o: OfferInfo): [number, number] => [
    o.starts_at ? new Date(o.starts_at).getTime() : -Infinity,
    o.ends_at ? new Date(o.ends_at).getTime() : Infinity,
  ];
  const hit = new Set<string>();
  for (let i = 0; i < dated.length; i += 1) {
    for (let j = i + 1; j < dated.length; j += 1) {
      const [a1, a2] = range(dated[i]);
      const [b1, b2] = range(dated[j]);
      if (a1 <= b2 && b1 <= a2) {
        hit.add(dated[i].id);
        hit.add(dated[j].id);
      }
    }
  }
  return dated.filter((o) => hit.has(o.id));
}
