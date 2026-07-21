import SectionRenderer from "./SectionRenderer";
import BlockRenderer from "./BlockRenderer";

import type {
  CatalogBuiltPanel,
} from "@/lib/queries/catalog";

type Props = {
  panel: CatalogBuiltPanel;
};

export default function PanelRenderer({
  panel,
}: Props) {
  return (
    <div className="space-y-8">
      {panel.blocks.map((block) => (
        <BlockRenderer
          key={block.id}
          block={block}
        />
      ))}

      {panel.sections.map((section) => (
        <SectionRenderer
          key={section.id}
          section={section}
        />
      ))}
    </div>
  );
}