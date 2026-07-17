import "server-only";

import { createClient } from "@/lib/supabase/server";

import type {
  CatalogJourney,
  CatalogModule,
} from "./types";

export type {
  CatalogJourney,
  CatalogModule,
} from "./types";

/* ==================================================
   Journeys
================================================== */

/**
 * قراءة رحلة واحدة باستخدام slug
 */
export async function getJourneyBySlug(
  slug: string
): Promise<CatalogJourney | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("journeys")
    .select(`
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
    `)
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.error(
      `Failed to load journey "${slug}":`,
      {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      }
    );

    throw new Error(
      `تعذر تحميل بيانات الرحلة: ${error.message}`
    );
  }

  return data as CatalogJourney | null;
}

/**
 * قراءة جميع الرحلات الخاصة بكورس معين
 */
export async function getJourneysByCourseId(
  courseId: string
): Promise<CatalogJourney[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("journeys")
    .select(`
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
    `)
    .eq("course_id", courseId)
    .eq("is_active", true)
    .order("display_order", {
      ascending: true,
    });

  if (error) {
    console.error(
      "Failed to load course journeys:",
      {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      }
    );

    throw new Error(
      `تعذر تحميل رحلات الكورس: ${error.message}`
    );
  }

  return (data ??
    []) as CatalogJourney[];
}

/* ==================================================
   Journey Modules
================================================== */

export async function getJourneyModules(
  journeyId: string
): Promise<CatalogModule[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("journey_modules")
    .select(`
      id,
      journey_id,
      title,
      description,
      duration_minutes,
      display_order,
      is_preview,
      is_active,
      created_at,
      updated_at
    `)
    .eq("journey_id", journeyId)
    .eq("is_active", true)
    .order("display_order", {
      ascending: true,
    });

  if (error) {
    console.error(
      "Failed to load journey modules:",
      {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      }
    );

    throw new Error(
      `تعذر تحميل محاور الرحلة: ${error.message}`
    );
  }

  return (data ?? []) as CatalogModule[];
}