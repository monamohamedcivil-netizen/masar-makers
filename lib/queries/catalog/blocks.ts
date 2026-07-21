import "server-only";

import { createClient } from "@/lib/supabase/server";

import type {
  CatalogPanelBlock,
} from "./types";

export type {
  CatalogPanelBlock,
  PanelBlockType,
} from "./types";

/* ==================================================
   Panel Blocks
================================================== */

export async function getBlocksByPanelId(
  panelId: string
): Promise<CatalogPanelBlock[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("panel_blocks")
    .select(`
      id,
      panel_id,
      section_id,
      block_type,
      title,
      subtitle,
      content,
      media_url,
      icon,
      data,
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
      "Failed to load panel blocks:",
      {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      }
    );

    throw new Error(
      `تعذر تحميل محتوى الـ Panel: ${error.message}`
    );
  }

  return (data ?? []) as CatalogPanelBlock[];
}

export async function getBlocksBySectionId(
  sectionId: string
): Promise<CatalogPanelBlock[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("panel_blocks")
    .select(`
      id,
      panel_id,
      section_id,
      block_type,
      title,
      subtitle,
      content,
      media_url,
      icon,
      data,
      display_order,
      active,
      created_at,
      updated_at
    `)
    .eq("section_id", sectionId)
    .eq("active", true)
    .order("display_order", {
      ascending: true,
    });

  if (error) {
    console.error(
      "Failed to load section blocks:",
      {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      }
    );

    throw new Error(
      `تعذر تحميل محتوى القسم: ${error.message}`
    );
  }

  return (data ?? []) as CatalogPanelBlock[];
}

export async function getBlocksByPanelIds(
  panelIds: string[]
): Promise<CatalogPanelBlock[]> {
  if (panelIds.length === 0) {
    return [];
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("panel_blocks")
    .select(`
      id,
      panel_id,
      section_id,
      block_type,
      title,
      subtitle,
      content,
      media_url,
      icon,
      data,
      display_order,
      active,
      created_at,
      updated_at
    `)
    .in("panel_id", panelIds)
    .eq("active", true)
    .order("display_order", {
      ascending: true,
    });

  if (error) {
    console.error(
      "Failed to load panels blocks:",
      {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      }
    );

    throw new Error(
      `تعذر تحميل محتوى الـ Panels: ${error.message}`
    );
  }

  return (data ?? []) as CatalogPanelBlock[];
}