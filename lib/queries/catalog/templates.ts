import "server-only";

import { createClient } from "@/lib/supabase/server";

import type {
  CatalogCourseTemplate,
} from "./types";

export type {
  CatalogCourseTemplate,
} from "./types";

type CourseTemplateDatabaseRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  layout_type: string;
  active: boolean;
  created_at: string;
  updated_at: string;
};

/* ==================================================
   Helpers
================================================== */

function normalizeTemplate(
  row: CourseTemplateDatabaseRow,
): CatalogCourseTemplate {
  return {
    id: row.id,
    name: row.title,
    slug: row.slug,
    description: row.description,
    template_type: row.layout_type,
    version: 1,
    source_station_id: null,
    content_schema: {},
    layout_schema: {},
    is_default: false,
    is_active: row.active,
    created_at: row.created_at,
    updated_at: row.updated_at,
  } as CatalogCourseTemplate;
}

/* ==================================================
   Templates
================================================== */

/**
 * قراءة قالب واحد باستخدام slug
 */
export async function getTemplateBySlug(
  slug: string,
): Promise<CatalogCourseTemplate | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("course_templates")
    .select(`
      id,
      slug,
      title,
      description,
      layout_type,
      active,
      created_at,
      updated_at
    `)
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();

  if (error) {
    console.error(
      `Failed to load template "${slug}":`,
      {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      },
    );

    throw new Error(
      `تعذر تحميل القالب: ${error.message}`,
    );
  }

  if (!data) {
    return null;
  }

  return normalizeTemplate(
    data as CourseTemplateDatabaseRow,
  );
}

/**
 * قراءة جميع القوالب النشطة
 */
export async function getTemplates(): Promise<
  CatalogCourseTemplate[]
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("course_templates")
    .select(`
      id,
      slug,
      title,
      description,
      layout_type,
      active,
      created_at,
      updated_at
    `)
    .eq("active", true)
    .order("title", {
      ascending: true,
    });

  if (error) {
    console.error(
      "Failed to load templates:",
      {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      },
    );

    throw new Error(
      `تعذر تحميل القوالب: ${error.message}`,
    );
  }

  return (
    (data ?? []) as CourseTemplateDatabaseRow[]
  ).map(normalizeTemplate);
}

export async function getCourseTemplates(): Promise<
  CatalogCourseTemplate[]
> {
  return getTemplates();
}