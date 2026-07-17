import "server-only";

import { createClient } from "@/lib/supabase/server";

import type {
  CatalogCourseTemplate,
} from "./types";

export type {
  CatalogCourseTemplate,
} from "./types";

/* ==================================================
   Templates
================================================== */

/**
 * قراءة قالب واحد باستخدام slug
 */
export async function getTemplateBySlug(
  slug: string
): Promise<CatalogCourseTemplate | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("course_templates")
    .select(`
      id,
      name,
      slug,
      description,
      template_type,
      version,
      source_station_id,
      content_schema,
      layout_schema,
      is_default,
      is_active,
      created_at,
      updated_at
    `)
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.error(
      `Failed to load template "${slug}":`,
      {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      }
    );

    throw new Error(
      `تعذر تحميل Template: ${error.message}`
    );
  }

  return data as CatalogCourseTemplate | null;
}

/**
 * قراءة جميع القوالب
 */
export async function getTemplates(): Promise<
  CatalogCourseTemplate[]
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("course_templates")
    .select(`
      id,
      name,
      slug,
      description,
      template_type,
      version,
      source_station_id,
      content_schema,
      layout_schema,
      is_default,
      is_active,
      created_at,
      updated_at
    `)
    .eq("is_active", true)
    .order("name");

  if (error) {
    console.error(
      "Failed to load templates:",
      {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      }
    );

    throw new Error(
      `تعذر تحميل Templates: ${error.message}`
    );
  }

  return (data ?? []) as CatalogCourseTemplate[];
}

export async function getCourseTemplates() {
  return getTemplates();
}