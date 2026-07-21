export const HeadingDefaults = {
  text: "عنوان جديد",
  level: "h2",
  align: "right",
};

export const TextDefaults = {
  html: "",
};

export const ImageDefaults = {
  url: "",
  alt: "",
  caption: "",
};

export const VideoDefaults = {
  url: "",
};

import { BlockRegistry } from "./registry";

export function createDefaultBlockData(
  blockType: string
): Record<string, unknown> {
  return (
    BlockRegistry[
      blockType as keyof typeof BlockRegistry
    ]?.defaultData ?? {}
  );
}