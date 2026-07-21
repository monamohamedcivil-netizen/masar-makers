import "server-only";

import { createClient } from "@/lib/supabase/server";

import type {
  CatalogCoursePanel,
  CatalogCoursePanelItem,
  CatalogPanelSection,
} from "./types";

export type {
  CatalogCoursePanel,
  CatalogCoursePanelItem,
  CatalogPanelSection,
} from "./types";

/* ==================================================
   Course Dashboard Controls
================================================== */

export async function getCourseLearningModes(
  stationId: string
): Promise<CatalogCoursePanelItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("course_learning_modes")
    .select(`
      id,
      station_id,
      station_title,
      title,
      icon,
      panel_type,
      panel_component,
      display_order,
      active,
      created_at,
      updated_at
    `)
    .eq("station_id", stationId)
    .eq("active", true)
    .order("display_order", {
      ascending: true,
    });

  if (error) {
    console.error(
      "Failed to load course learning modes:",
      {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      }
    );

    return [];
  }

  return (data ?? []) as CatalogCoursePanelItem[];
}

export async function getCourseResultTabs(
  stationId: string
): Promise<CatalogCoursePanelItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("course_result_tabs")
    .select(`
      id,
      station_id,
      station_title,
      title,
      icon,
      panel_type,
      panel_component,
      display_order,
      active,
      created_at,
      updated_at
    `)
    .eq("station_id", stationId)
    .eq("active", true)
    .order("display_order", {
      ascending: true,
    });

  if (error) {
    console.error(
      "Failed to load course result tabs:",
      {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      }
    );

    return [];
  }

  return (data ?? []) as CatalogCoursePanelItem[];
}

/* ==================================================
   Panels
================================================== */

/**
 * قراءة جميع Panels الخاصة بقالب معين.
 */

export async function getPanelsByTemplateId(
  templateId: string
): Promise<CatalogCoursePanel[]> {
  if (!templateId) {
    throw new Error("Template ID غير موجود.");
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("course_panels")
  .select(`
  id,
  template_id,
  panel_component,
  title,
  description,
  icon,
  layout_type,
  display_order,
  active,
  created_at,
  updated_at
`)
    .eq("template_id", templateId)
    .order("display_order", {
      ascending: true,
    });

  if (error) {
  console.error("SUPABASE ERROR", error);

  throw error;
}

  return (data ?? []) as CatalogCoursePanel[];
}

/**
 * اسم متوافق مع الاستدعاءات القديمة.
 */
export async function getTemplatePanels(
  templateId: string
): Promise<CatalogCoursePanel[]> {
  return getPanelsByTemplateId(templateId);
}

/**
 * قراءة عناصر Panel.
 */
export async function getPanelItems(
  panelId: string
): Promise<CatalogCoursePanelItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("course_panel_items")
    .select(`
      id,
      station_id,
      station_title,
      title,
      icon,
      panel_type,
      panel_component,
      display_order,
      active,
      created_at,
      updated_at
    `)
    
    .eq("panel_id", panelId)
    .eq("active", true)
    .order("display_order", {
      ascending: true,
    });

  if (error) {
    console.error(
      "Failed to load panel items:",
      {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      }
    );

    throw new Error(
      `تعذر تحميل عناصر الـ Panel: ${error.message}`
    );
  }

  return (data ?? []) as CatalogCoursePanelItem[];
}

/**
 * قراءة Sections الخاصة بالـ Panel.
 */
export async function getPanelSections(
  panelId: string
): Promise<CatalogPanelSection[]> {
  const supabase = await createClient();
   console.log("panelId =", panelId);
  const { data, error } = await supabase
    .from("course_panel_sections")
    .select(`
      id,
      panel_id,
      section_key,
      title,
      display_order,
      active,
      created_at,
      updated_at
    `)
 
    .eq("panel_id", panelId)
    .eq("active", true)
    .order("display_order", {
      ascending: true,
    });

  if (error) {
    console.error(
      "Failed to load panel sections:",
      {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      }
    );

    throw new Error(
      `تعذر تحميل أقسام الـ Panel: ${error.message}`
    );
  }

  return (data ?? []) as CatalogPanelSection[];
}