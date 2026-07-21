import BlockRenderer from "./BlockRenderer";

import type {
  CatalogBuiltSection,
} from "@/lib/queries/catalog";

type Props = {
  section: CatalogBuiltSection;
};

export default function SectionRenderer({
  section,
}: Props) {
  return (
    <section className="space-y-4">
      {section.blocks.map((block) => (
        <BlockRenderer
          key={block.id}
          block={block}
        />
      ))}
    </section>
  );
}