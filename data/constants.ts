import type {
  CourseType,
  PathSlug,
} from "@/data/types";

export const PATH_SLUGS: PathSlug[] = [
  "road",
  "traffic",
];

export const COURSE_TYPES: CourseType[] = [
  "professional",
  "workshop",
  "free",
];

export const COURSE_LEVELS = {
  beginner: "مبتدئ",
  intermediate: "متوسط",
  advanced: "متقدم",
  beginnerToAdvanced:
    "من المبتدئ إلى المتقدم",
} as const;

export const DEFAULT_COURSE_GIFTS = [
  "ملفات المشروع",
  "قوالب جاهزة للاستخدام",
  "ملخصات وملاحظات الكورس",
];