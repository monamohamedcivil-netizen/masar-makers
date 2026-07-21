import type {
  CatalogCoursePanel,
  CatalogPanelSection,
  CatalogPanelBlock,
} from "@/lib/queries/catalog";

import type {
  BuilderEntity,
} from "./schema";

export function mapPanel(
  panel: CatalogCoursePanel,
  manageHref: string
): BuilderEntity {
  return {
    id: panel.id,
    title: panel.title,
    active: panel.active,
    displayOrder: panel.display_order,
    description: panel.description  ?? undefined,
    type: "panel",
    manageHref,
  };
}

export function mapSection(
  section: CatalogPanelSection,
  manageHref: string
): BuilderEntity {
  return {
    id: section.id,
    title: section.title ?? section.section_key ?? "Section",
    active: section.active,
    displayOrder: section.display_order,
    key: section.section_key,
    type: "section",
    manageHref,
  };
}

export function mapBlock(
  block: CatalogPanelBlock,
  manageHref: string
): BuilderEntity {
  return {
    id: block.id,
    title: block.title ?? block.block_type,
    active: block.active,
    displayOrder: block.display_order,
    description: block.subtitle ?? undefined,
    type: "block",
    manageHref,
  };
}