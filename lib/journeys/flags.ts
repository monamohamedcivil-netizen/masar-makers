/**
 * true = the new journeys pages (/journeys/*), «طرق التعلم» menu and card links
 * are visible to admins only (preview). Set to false when Mona approves the launch.
 */
export const JOURNEYS_PAGES_PREVIEW = false;

export type LearningModeKey = "professional" | "one-day" | "free";

export const LEARNING_MODE_HREF: Record<LearningModeKey, string> = {
  professional: "/journeys/professional",
  "one-day": "/journeys/one-day",
  free: "/journeys/free",
};

/** Card / menu link, optionally opening a path tab (e.g. traffic-engineering). */
export function learningModeHref(mode: LearningModeKey, pathSlug?: string | null) {
  const base = LEARNING_MODE_HREF[mode];
  return pathSlug ? `${base}?path=${encodeURIComponent(pathSlug)}` : base;
}
