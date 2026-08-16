import "server-only";

import { createClient } from "@/lib/supabase/server";

import type {
  CatalogCareerPath,
} from "./types";

export type {
  CatalogCareerPath,
} from "./types";

import {
  normalizeCareerPath,
} from "./helpers";


/* ==================================================
   Training Duration
================================================== */

/**
 * حساب إجمالي مدة الدروس المنشورة للكورسات المحددة بالدقائق.
 *
 * نستخدم RPC عامة وآمنة بدل قراءة جدول lessons مباشرة،
 * حتى يرى الطالب والأدمن نفس الإحصائية بدون كشف بيانات الدروس.
 */
export async function getCoursesTrainingMinutes(
  courseIds: Array<string | number>
): Promise<number> {
  if (!courseIds.length) {
    return 0;
  }

  const supabase = await createClient();

  const normalizedCourseIds = courseIds
    .map((id) => String(id))
    .filter(Boolean);

  if (!normalizedCourseIds.length) {
    return 0;
  }

  const { data, error } = await supabase.rpc(
    "get_courses_training_minutes",
    {
      course_ids: normalizedCourseIds,
    },
  );

  if (error) {
    console.error(
      "Failed to load public training duration:",
      {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      },
    );

    throw new Error(
      "تعذر حساب مدة المحتوى التدريبي.",
    );
  }

  return Math.max(
    0,
    Number(data ?? 0),
  );
}

/* ==================================================
   Career Paths
================================================== */

/**
 * قراءة جميع المسارات النشطة
 * مع المحطات والكورسات والرحلات.
 */
export async function getCareerPaths(): Promise<
  CatalogCareerPath[]
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("career_paths")
    .select(`
      id,
      slug,
      title,
      short_title,
      description,
      image_url,
      is_active,
      display_order,
      created_at,
      updated_at,

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
      )
    `)
    .eq("is_active", true)
    .order("display_order", {
      ascending: true,
    });

  if (error) {
    console.error(
      "Failed to load career paths:",
      {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      }
    );

    throw new Error(
      "تعذر تحميل المسارات التعليمية."
    );
  }

  return (
    (data ?? []) as CatalogCareerPath[]
  ).map(normalizeCareerPath);
}

/**
 * قراءة مسار واحد باستخدام slug
 */
export async function getCareerPathBySlug(
  slug: string
): Promise<CatalogCareerPath | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("career_paths")
    .select(`
      id,
      slug,
      title,
      short_title,
      description,
      image_url,
      is_active,
      display_order,
      created_at,
      updated_at,

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
      )
    `)
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.error(
      `Failed to load career path "${slug}":`,
      {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      }
    );

    throw new Error(
      `تعذر تحميل بيانات المسار: ${error.message}`
    );
  }

  if (!data) {
    return null;
  }

  return normalizeCareerPath(
    data as CatalogCareerPath
  );
}