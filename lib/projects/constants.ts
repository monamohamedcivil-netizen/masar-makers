export const PROJECT_STATUS = {
  submitted: "submitted",
  needsRevision: "needs_revision",
} as const;
export const PROJECT_BUCKET = "student-projects";
export const MAX_PROJECT_IMAGES = 10;

export const MAX_PROJECT_IMAGE_SIZE =
  8 * 1024 * 1024;

export const ALLOWED_PROJECT_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;