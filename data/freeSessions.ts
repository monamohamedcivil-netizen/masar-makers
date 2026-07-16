import type { PathSlug } from "@/data/courses";

import type {
  FreeSession,
} from "@/data/types";

export type {
  FreeSession,
} from "@/data/types";

export const freeSessions: FreeSession[] = [
  /*
  أضيفي المحاضرات المجانية هنا لاحقًا.

  مثال:

  {
    id: 1,
    slug: "introduction-to-csd",
    title: "مقدمة في Civil Site Design",
    description: "محاضرة مجانية للتعرف على البرنامج...",
    image: "/images/free-sessions/csd-introduction.jpg",
    videoUrl: "",
    pathSlug: "road",
    duration: "90 دقيقة",
    instructorIds: ["mona-abdallah"],
    active: true,
    featured: true,
    order: 1,
  },
  */
];

export function getFreeSessionBySlug(
  slug: string
) {
  return freeSessions.find(
    (session) =>
      session.slug === slug &&
      session.active
  );
}

export function getFreeSessionsByPath(
  pathSlug: PathSlug
) {
  return freeSessions
    .filter(
      (session) =>
        session.pathSlug === pathSlug &&
        session.active
    )
    .sort((a, b) => a.order - b.order);
}