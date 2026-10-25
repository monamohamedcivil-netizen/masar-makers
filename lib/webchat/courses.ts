/* =========================================================
   Platform course ↔ chat course (whatsapp_courses) matching.
   Shared by the chat engine (button on a course page → chat course)
   and the admin one-day prices (platform one-day lectures → chat course).
========================================================= */

type ChatCourseLike = { course_key?: string | null; title?: string | null; whatsapp_label?: string | null };

const ALIASES: [RegExp, string][] = [
  [/civil\s*site|\bcsd\b/, "csd"],
  [/vehicle|\bvt\b|تتبع/, "vehicle_tracking"],
  [/smart\s*project|deliverables|\bspd\b/, "spd"],
  [/\bbim\b/, "bim"],
  [/\bcube\b/, "cube"],
  [/civil\s*3d|\bc3d\b/, "civil 3d"],
];

const low = (v: unknown) => String(v ?? "").trim().toLowerCase();

/** The chat course for a page title / course hint (alias key first, then the title inside the hint). */
export function findChatCourse<T extends ChatCourseLike>(list: T[], hint: string): T | null {
  const h = low(hint);
  if (!h) return null;
  const key = ALIASES.find(([re]) => re.test(h))?.[1];
  return (
    list.find((c) => key && low(c.course_key) === key) ??
    list.find((c) => (low(c.title) && h.includes(low(c.title))) || (low(c.whatsapp_label) && h.includes(low(c.whatsapp_label)))) ??
    null
  );
}

/** journeys.journey_type values that mean "one-day journey" (same list as the journey-lessons API). */
export function isOneDayJourneyType(value: unknown) {
  return ["workshop", "one_day", "one-day", "one_day_workshop", "one-day-workshop"].includes(low(value));
}

/** Fundamentals / Advanced / Integrated of a chat course variant (from its key or titles). */
export function variantStageOf(v: {
  variant_key?: string | null;
  title?: string | null;
  title_en?: string | null;
}): "fundamental" | "advanced" | "integrated" | null {
  const text = [v.variant_key, v.title, v.title_en].map((x) => low(x)).join(" ");
  if (/integr|متكامل|full/.test(text)) return "integrated";
  if (/fund|أساس|اساس/.test(text)) return "fundamental";
  if (/adv|متقدم/.test(text)) return "advanced";
  return null;
}
