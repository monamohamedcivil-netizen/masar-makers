import "server-only";

import {
  getPanelsByTemplateId,
  getPanelSections,
} from "./panels";

import {
  getBlocksByPanelIds,
} from "./blocks";

import type {
  CatalogCoursePanel,
  CatalogPanelSection,
  CatalogPanelBlock,
} from "./types";

/* ==================================================
   Page Builder Types
================================================== */

export type CatalogBuiltSection = CatalogPanelSection & {
  blocks: CatalogPanelBlock[];
};

export type CatalogBuiltPanel = CatalogCoursePanel & {
  blocks: CatalogPanelBlock[];
  sections: CatalogBuiltSection[];
};

export type CatalogBuiltTemplatePage = {
  template_id: string;
  panels: CatalogBuiltPanel[];
};

/* ==================================================
   Template Page Builder
================================================== */

export async function getTemplatePageBuilder(
  templateId: string
): Promise<CatalogBuiltTemplatePage> {
  const panels = await getPanelsByTemplateId(templateId);

  if (panels.length === 0) {
    return {
      template_id: templateId,
      panels: [],
    };
  }

  const panelIds = panels.map((panel) => panel.id);

  const [sectionsByPanel, allBlocks] = await Promise.all([
    Promise.all(
      panels.map(async (panel) => ({
        panelId: panel.id,
        sections: await getPanelSections(panel.id),
      }))
    ),
    getBlocksByPanelIds(panelIds),
  ]);

  const sectionsMap = new Map<string, CatalogPanelSection[]>();

  for (const item of sectionsByPanel) {
    sectionsMap.set(item.panelId, item.sections);
  }

  const blocksByPanel = new Map<string, CatalogPanelBlock[]>();

  for (const block of allBlocks) {
    const currentBlocks =
      blocksByPanel.get(block.panel_id) ?? [];

    currentBlocks.push(block);

    blocksByPanel.set(
      block.panel_id,
      currentBlocks
    );
  }

  const builtPanels: CatalogBuiltPanel[] = panels.map(
    (panel) => {
      const panelSections =
        sectionsMap.get(panel.id) ?? [];

      const panelBlocks =
        blocksByPanel.get(panel.id) ?? [];

      const directPanelBlocks = panelBlocks.filter(
        (block) => block.section_id === null
      );

      const builtSections: CatalogBuiltSection[] =
        panelSections.map((section) => ({
          ...section,

          blocks: panelBlocks.filter(
            (block) =>
              block.section_id === section.id
          ),
        }));

      return {
        ...panel,
        blocks: directPanelBlocks,
        sections: builtSections,
      };
    }
  );

  return {
    template_id: templateId,
    panels: builtPanels,
  };
}

