import type { PathSlug } from "@/data/courses";

import type {
  FaqItem,
} from "@/data/types";

export type {
  FaqItem,
} from "@/data/types";

export const faq: FaqItem[] = [
  /*
  أضيفي الأسئلة الشائعة هنا لاحقًا.

  مثال:

  {
    id: 1,
    question: "هل أحتاج خبرة سابقة؟",
    answer: "لا، يبدأ المسار من الأساسيات...",
    pathSlug: "road",
    active: true,
    order: 1,
  },
  */
];

export function getFaqByPath(
  pathSlug: PathSlug
) {
  return faq
    .filter(
      (item) =>
        item.pathSlug === pathSlug &&
        item.active
    )
    .sort((a, b) => a.order - b.order);
}

export function getFaqByCourse(
  courseSlug: string
) {
  return faq
    .filter(
      (item) =>
        item.courseSlug === courseSlug &&
        item.active
    )
    .sort((a, b) => a.order - b.order);
}