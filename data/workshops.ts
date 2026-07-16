import type { PathSlug } from "@/data/courses";

import type {
  Workshop,
} from "@/data/types";

export type {
  Workshop,
} from "@/data/types";

export const workshops: Workshop[] = [
  /*
  أضيفي ورش اليوم الواحد هنا لاحقًا.

  مثال:

  {
    id: 1,
    slug: "roundabout-design-workshop",
    title: "تصميم الدوارات في يوم واحد",
    description: "ورشة مركزة لتصميم الدوارات...",
    image: "/images/workshops/roundabout.jpg",
    pathSlug: "road",
    duration: "4 ساعات",
    date: "2026-08-01",
    price: 250,
    instructorIds: ["mona-abdallah"],
    active: true,
    featured: true,
    order: 1,
  },
  */
];

export function getWorkshopBySlug(
  slug: string
) {
  return workshops.find(
    (workshop) =>
      workshop.slug === slug &&
      workshop.active
  );
}

export function getWorkshopsByPath(
  pathSlug: PathSlug
) {
  return workshops
    .filter(
      (workshop) =>
        workshop.pathSlug === pathSlug &&
        workshop.active
    )
    .sort((a, b) => a.order - b.order);
}