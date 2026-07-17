import "server-only";

import { createClient } from "@/lib/supabase/server";

import type {
  CatalogCourse,
} from "./types";

export type {
  CatalogCourse,
} from "./types";

import {
  sortJourneys,
} from "./helpers";

/* ==================================================
   Courses
================================================== */

/**
 * قراءة كورس واحد باستخدام slug
 * مع جميع الرحلات الموجودة داخله
 * وبيانات المحطة المرتبط بها.
 */
export async function getCatalogCourseBySlug(
  slug: string
): Promise<CatalogCourse | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("courses")
    .select(`
      id,
      station_id,
      slug,
      title,
      subtitle,
      description,
      long_description,
      image_url,
      icon_url,
      duration_hours,
      projects_count,
      level,
      final_outcome,
      is_active,
      is_featured,
      display_order,
      created_at,
      updated_at,

      journeys (
        id,
        course_id,
        slug,
        title,
        journey_type,
        description,
        duration_hours,
        price,
        currency,
        registration_required,
        status,
        start_date,
        end_date,
        is_active,
        display_order,
        created_at,
        updated_at
      ),

      course_stations (
        id,
        career_path_id,
        slug,
        title,
        short_title,
        description,
        image_url,
        icon_url,
        learning_column_title,
        result_column_title,
        journey_layout,
        is_active,
        display_order,
        created_at,
        updated_at,
        stats_journey_count,
        stats_lesson_count,
        stats_training_hours,
        stats_level_label
      )
    `)
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.error(
      `Failed to load course "${slug}":`,
      {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      }
    );

    throw new Error(
      `تعذر تحميل بيانات الكورس: ${error.message}`
    );
  }

  if (!data) {
    return null;
  }

  const course =
    data as unknown as CatalogCourse;

  return {
    ...course,
    journeys: sortJourneys(
      course.journeys
    ),
  };
}