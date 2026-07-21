import PanelRenderer from "./PanelRenderer";

import type {
  CatalogBuiltTemplatePage,
} from "@/lib/queries/catalog";

type Props = {
  page: CatalogBuiltTemplatePage;
};

export default function CourseRenderer({
  page,
}: Props) {
  return (
    <>
      {page.panels.map((panel) => (
        <PanelRenderer
          key={panel.id}
          panel={panel}
        />
      ))}
    </>
  );
}