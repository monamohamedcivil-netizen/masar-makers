import type {
  ProfessionalActionConfig,
  ProfessionalActionMode,
  ProfessionalContentBlock,
  ProfessionalImageBlock,
  ProfessionalJourneyColumn,
  ProfessionalListBlock,
  ProfessionalListItem,
  ProfessionalPanelDraft,
  ProfessionalVideoBlock,
} from "./ProfessionalPanelTypes";

export function createProfessionalId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function createDefaultAction(
  label = "اشترك الآن",
): ProfessionalActionConfig {
  return {
    enabled: false,
    label,
    link: "",
    mode: "enrollment",
    courseSlug: "",
    journeyType: "",
  };
}

export function createEmptyListItem(): ProfessionalListItem {
  return {
    id: createProfessionalId(),
    title: "",
    description: "",
    hasButton: false,
    buttonText: "شاهد الآن",
    buttonLink: "",
    buttonMode: "link",
  };
};


export function createEmptyListBlock(
  journey: ProfessionalJourneyColumn,
): ProfessionalListBlock {
  return {
    id: createProfessionalId(),
    type: "list",
    title: "",
    journey,
    items: [createEmptyListItem()],
  };
}

export function createEmptyImageBlock(
  journey: ProfessionalJourneyColumn,
): ProfessionalImageBlock {
  return {
    id: createProfessionalId(),
    type: "image",
    title: "",
    journey,
    imageUrl: "",
    altText: "",
    caption: "",
  };
}

export function createEmptyVideoBlock(
  journey: ProfessionalJourneyColumn,
): ProfessionalVideoBlock {
  return {
    id: createProfessionalId(),
    type: "video",
    title: "",
    journey,
    provider: "youtube",
    videoUrl: "",
    thumbnail: "",
    caption: "",
  };
}

export function cloneProfessionalBlock(
  block: ProfessionalContentBlock,
): ProfessionalContentBlock {
  return JSON.parse(
    JSON.stringify(block),
  ) as ProfessionalContentBlock;
}

export function createInitialProfessionalPanel(): ProfessionalPanelDraft {
  return {
    screenTitle: "رحلة الاحتراف المتكاملة",
    screenSubtitle: "تشمل رحلة الأساسيات + الرحلة المتقدمة",
    screenAction: createDefaultAction("اشترك الآن"),
    columnCount: 1,
    columnOneTitle: "رحلة الأساسيات",
    columnOneAction: createDefaultAction("اشترك الآن"),
    columnTwoTitle: "الرحلة المتقدمة",
    columnTwoAction: createDefaultAction("اشترك الآن"),
    blocks: [],
  };
}

function normalizeAction(
  value: Partial<ProfessionalActionConfig> | null | undefined,
  fallbackLabel: string,
): ProfessionalActionConfig {
  const fallback = createDefaultAction(fallbackLabel);

 const validModes: ProfessionalActionMode[] = [
    "enrollment",
    "free",
    "whatsapp",
    "link",
];

  const savedMode =
    value?.mode && validModes.includes(value.mode)
      ? value.mode
      : fallback.mode;

  const normalizedMode: ProfessionalActionMode =
    value?.enabled &&
    savedMode !== "enrollment" &&
    !value?.link?.trim()
      ? "enrollment"
      : savedMode;

  return {
    enabled:
      typeof value?.enabled === "boolean"
        ? value.enabled
        : fallback.enabled,
    label:
      typeof value?.label === "string"
        ? value.label
        : fallback.label,
    link:
      typeof value?.link === "string"
        ? value.link
        : fallback.link,
    mode: normalizedMode,
    courseSlug:
      typeof value?.courseSlug === "string"
        ? value.courseSlug
        : fallback.courseSlug,
    journeyType:
      typeof value?.journeyType === "string"
        ? value.journeyType
        : fallback.journeyType,
  };
}

export function normalizeProfessionalPanel(
  value: Partial<ProfessionalPanelDraft> | null | undefined,
): ProfessionalPanelDraft {
  const initial = createInitialProfessionalPanel();

  if (!value) {
    return initial;
  }

  const blocks = Array.isArray(value.blocks)
    ? value.blocks.map((block) => {
        if (block.type !== "list") {
          return block;
        }

        return {
          ...block,
         items: block.items.map((item) => ({
            ...item,
            buttonMode: item.buttonMode ?? "link",
          })),
        };
      })
    : [];

  return {
    screenTitle:
      typeof value.screenTitle === "string"
        ? value.screenTitle
        : initial.screenTitle,
    screenSubtitle:
      typeof value.screenSubtitle === "string"
        ? value.screenSubtitle
        : initial.screenSubtitle,
    screenAction: normalizeAction(
      value.screenAction,
      "اشترك الآن",
    ),
    columnCount:
      value.columnCount === 1 || value.columnCount === 2
        ? value.columnCount
        : initial.columnCount,
    columnOneTitle:
      typeof value.columnOneTitle === "string"
        ? value.columnOneTitle
        : initial.columnOneTitle,
    columnOneAction: normalizeAction(
      value.columnOneAction,
      "اشترك الآن",
    ),
    columnTwoTitle:
      typeof value.columnTwoTitle === "string"
        ? value.columnTwoTitle
        : initial.columnTwoTitle,
    columnTwoAction: normalizeAction(
      value.columnTwoAction,
      "اشترك الآن",
    ),
    blocks,
  };
}