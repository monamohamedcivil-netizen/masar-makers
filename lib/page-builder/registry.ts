import {
  HeadingDefaults,
  ImageDefaults,
  TextDefaults,
  VideoDefaults,
} from "./defaults";

import type {
  BlockDefinition,
} from "./types";

export const BlockRegistry: Record<
  string,
  BlockDefinition
> = {
  heading: {
    type: "heading",
    label: "Heading",
    icon: "heading",
    defaultData: HeadingDefaults,
  },

  text: {
    type: "text",
    label: "Text",
    icon: "text",
    defaultData: TextDefaults,
  },

  image: {
    type: "image",
    label: "Image",
    icon: "image",
    defaultData: ImageDefaults,
  },

  video: {
    type: "video",
    label: "Video",
    icon: "video",
    defaultData: VideoDefaults,
  },
};

export function createDefaultBlockData(
  blockType: string
): Record<string, unknown> {
  switch (blockType) {
    case "heading":
      return {
        title: "",
        subtitle: "",
        align: "right",
        size: "h2",
        color: "#07152E",
      };

    case "text":
      return {
        content: "",
        align: "right",
        color: "#334155",
      };

    case "image":
      return {
        src: "",
        alt: "",
        caption: "",
      };

    case "video":
      return {
        url: "",
        title: "",
      };

    default:
      return {};
  }
}