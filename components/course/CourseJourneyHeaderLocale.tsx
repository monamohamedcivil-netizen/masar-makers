"use client";

import { useEffect, useState } from "react";

import CourseJourneyHeader from "@/components/course/CourseJourneyHeader";
import type { Course, PathSlug } from "@/data/types";

type Locale = "ar" | "en";

type CourseJourneyHeaderLocaleProps = {
  courses: Course[];
  currentCourseSlug: string;
  pathTitle: string;
  pathSlug: PathSlug;
};

export default function CourseJourneyHeaderLocale({
  courses,
  currentCourseSlug,
  pathTitle,
  pathSlug,
}: CourseJourneyHeaderLocaleProps) {
  const [locale, setLocale] = useState<Locale>("ar");

  useEffect(() => {
    const readLocale = () => {
      const savedLocale =
        window.localStorage.getItem("masar-locale");

      setLocale(savedLocale === "en" ? "en" : "ar");
    };

    readLocale();

    const handleLocaleChange = (event: Event) => {
      const customEvent =
        event as CustomEvent<{ locale?: Locale }>;

      if (
        customEvent.detail?.locale === "ar" ||
        customEvent.detail?.locale === "en"
      ) {
        setLocale(customEvent.detail.locale);
        return;
      }

      readLocale();
    };

    window.addEventListener(
      "masar:locale-change",
      handleLocaleChange,
    );
    window.addEventListener("storage", readLocale);

    return () => {
      window.removeEventListener(
        "masar:locale-change",
        handleLocaleChange,
      );
      window.removeEventListener("storage", readLocale);
    };
  }, []);

  return (
    <CourseJourneyHeader
      courses={courses}
      currentCourseSlug={currentCourseSlug}
      pathTitle={pathTitle}
      pathSlug={pathSlug}
      locale={locale}
    />
  );
}
