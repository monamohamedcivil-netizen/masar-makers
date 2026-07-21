export type BuilderEntityType =
  | "panel"
  | "section"
  | "block";

export type BuilderEntity = {
  id: string;
  title: string;
  active: boolean;
  displayOrder: number;

  description?: string;

  key?: string;

  type: BuilderEntityType;

  manageHref: string;
};