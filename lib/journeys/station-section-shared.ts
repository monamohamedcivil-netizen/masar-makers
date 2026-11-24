/* ثوابت ودوال مشتركة (بدون سيرفر) لأقسام المحطة. */

export const SECTION_KEYS = ["professional", "outcome", "gifts", "free", "reviews", "intro"] as const;
export type SectionKey = (typeof SECTION_KEYS)[number];

export const SECTION_LABELS: Record<SectionKey, string> = {
  professional: "محاور الرحلة",
  outcome: "نتائج الرحلة",
  gifts: "هدايا الرحلة",
  free: "محاضرات الرحلة المجانية",
  reviews: "مشاريع المتدربين",
  intro: "تعرف على الرحلة أكثر",
};

export function extractYoutubeId(url: string): string | null {
  const m = String(url ?? "").match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([\w-]{11})/);
  return m ? m[1] : null;
}
