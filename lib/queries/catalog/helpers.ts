import type {
  CatalogCareerPath,
  CatalogCourse,
  CatalogJourney,
  CatalogStation,
} from "./types";

/* ==================================================
   Sorting Helpers
================================================== */

export function sortJourneys(
  journeys: CatalogJourney[] | null | undefined
): CatalogJourney[] {
  return [...(journeys ?? [])].sort(
    (a, b) => a.display_order - b.display_order
  );
}

export function sortCourses(
  courses: CatalogCourse[] | null | undefined
): CatalogCourse[] {
  return [...(courses ?? [])]
    .sort(
      (a, b) => a.display_order - b.display_order
    )
    .map((course) => ({
      ...course,
      journeys: sortJourneys(course.journeys),
    }));
}

export function sortStations(
  stations: CatalogStation[] | null | undefined
): CatalogStation[] {
  return [...(stations ?? [])]
    .sort(
      (a, b) => a.display_order - b.display_order
    )
    .map((station) => ({
      ...station,
      courses: sortCourses(station.courses),
    }));
}

/* ==================================================
   Normalizers
================================================== */

export function normalizeCareerPath(
  path: CatalogCareerPath
): CatalogCareerPath {
  return {
    ...path,
    course_stations: sortStations(
      path.course_stations
    ),
  };
}