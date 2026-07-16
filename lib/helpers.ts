import {
  careerPaths,
  getPathBySlug,
} from "@/data/paths";

import {
  courses,
  getCourseBySlug,
  getCoursesByPath,
  type PathSlug,
} from "@/data/courses";

import {
  workshops,
  getWorkshopBySlug,
  getWorkshopsByPath,
} from "@/data/workshops";

import {
  freeSessions,
  getFreeSessionBySlug,
  getFreeSessionsByPath,
} from "@/data/freeSessions";

import {
  instructors,
  getInstructorById,
} from "@/data/instructors";

import {
  reviews,
  getReviewsByCourse,
  getReviewsByPath,
} from "@/data/reviews";

import {
  faq,
  getFaqByCourse,
  getFaqByPath,
} from "@/data/faq";

export function getPath(
  slug: string
) {
  return getPathBySlug(slug);
}

export function getCourse(
  slug: string
) {
  return getCourseBySlug(slug);
}

export function getCourses(
  pathSlug: string
) {
  return getCoursesByPath(
    pathSlug as PathSlug
  );
}

export function getWorkshop(
  slug: string
) {
  return getWorkshopBySlug(slug);
}

export function getPathWorkshops(
  pathSlug: string
) {
  return getWorkshopsByPath(
    pathSlug as PathSlug
  );
}

export function getFreeSession(
  slug: string
) {
  return getFreeSessionBySlug(slug);
}

export function getPathFreeSessions(
  pathSlug: string
) {
  return getFreeSessionsByPath(
    pathSlug as PathSlug
  );
}

export function getInstructor(
  id: string
) {
  return getInstructorById(id);
}

export function getPathReviews(
  pathSlug: string
) {
  return getReviewsByPath(
    pathSlug as PathSlug
  );
}

export function getCourseReviews(
  courseSlug: string
) {
  return getReviewsByCourse(courseSlug);
}

export function getPathFaq(
  pathSlug: string
) {
  return getFaqByPath(
    pathSlug as PathSlug
  );
}

export function getCourseFaq(
  courseSlug: string
) {
  return getFaqByCourse(courseSlug);
}

export function getPathData(
  slug: string
) {
  const path = getPath(slug);

  if (!path) {
    return null;
  }

  return {
    path,
    courses: getCourses(path.slug),
    workshops: getPathWorkshops(path.slug),
    freeSessions:
      getPathFreeSessions(path.slug),
    reviews: getPathReviews(path.slug),
    faq: getPathFaq(path.slug),
  };
}

/*
هذه التصديرات مفيدة لاحقًا
في صفحات الإدارة أو البحث.
*/

export {
  careerPaths,
  courses,
  workshops,
  freeSessions,
  instructors,
  reviews,
  faq,
};