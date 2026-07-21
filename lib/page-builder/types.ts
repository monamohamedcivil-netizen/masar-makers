export type BlockType =
  | "heading"
  | "text"
  | "image"
  | "video";

export interface BlockDefinition {
  type: BlockType;

  label: string;

  icon: string;

  defaultData: Record<string, unknown>;
}