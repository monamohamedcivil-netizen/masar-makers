export type PanelSectionType =
  | "hero"
  | "stats"
  | "pricing"
  | "projects"
  | "outcomes"
  | "curriculum"
  | "reviews"
  | "faq"
  | "cta";

export const DEFAULT_PANEL_STRUCTURE: Record<
  string,
  PanelSectionType[]
> = {
  professional: [
    "hero",
    "stats",
    "pricing",
    "projects",
    "outcomes",
    "curriculum",
    "reviews",
    "cta",
  ],

  workshop: [
    "hero",
    "pricing",
    "curriculum",
    "cta",
  ],

  free: [
    "hero",
    "reviews",
    "cta",
  ],
};