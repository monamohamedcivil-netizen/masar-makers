import type { PathSlug } from "@/data/courses";

import type {
  Review,
} from "@/data/types";

export type {
  Review,
} from "@/data/types";

export const reviews: Review[] = [
  /*
  سيتم ربطها لاحقًا بـGoogle Forms
  أو بنظام التقييم داخل المنصة.
  */
];

export function getReviewsByPath(
  pathSlug: PathSlug
) {
  return reviews.filter(
    (review) =>
      review.pathSlug === pathSlug &&
      review.approved
  );
}

export function getReviewsByCourse(
  courseSlug: string
) {
  return reviews.filter(
    (review) =>
      review.courseSlug === courseSlug &&
      review.approved
  );
}