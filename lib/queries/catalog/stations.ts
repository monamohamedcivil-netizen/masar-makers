import "server-only";

import { createClient } from "@/lib/supabase/server";

import type {
  CatalogStation,
} from "./types";

export type {
  CatalogStation,
} from "./types";

import {
  sortCourses,
} from "./helpers";

/* ==================================================
   Stations
================================================== */

/**
 * قراءة محطة واحدة
 * مع جميع الكورسات والرحلات الموجودة بداخلها.
 */
export async function getStationBySlug(
  slug: string
): Promise<CatalogStation | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("course_stations")
    .select(`
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
      stats_level_label,

      courses (
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
        )
      )
    `)
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.error(
      `Failed to load station "${slug}":`,
      {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      }
    );

    throw new Error(
      `تعذر تحميل بيانات المحطة: ${error.message}`
    );
  }

  if (!data) {
    return null;
  }

  const station =
    data as CatalogStation;

  return {
    ...station,
    courses: sortCourses(
      station.courses
    ),
  };
}