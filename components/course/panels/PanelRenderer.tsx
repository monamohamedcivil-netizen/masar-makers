"use client";

import PanelSection from "./PanelSection";

import type {
  CatalogPanelSection,
} from "@/lib/queries/catalog/panels";

type Props = {
  sections: CatalogPanelSection[];
};

export default function PanelRenderer({
  sections,
}: Props) {
  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <PanelSection
          key={section.id}
          title={
            section.title ??
            section.section_key
          }
          sectionKey={
            section.section_key
          }
        />
      ))}
    </div>
  );
}