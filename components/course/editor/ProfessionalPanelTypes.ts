export type ProfessionalJourneyColumn =
  | "fundamental"
  | "advanced";

export type ProfessionalActionMode =
  | "enrollment"
  | "free"
  | "whatsapp"
  | "link";

export type ProfessionalVideoProvider =
  | "youtube"
  | "vimeo"
  | "mp4";

export type ProfessionalActionConfig = {
  enabled: boolean;
  label: string;
  link: string;
  mode: ProfessionalActionMode | "enrollment";

  courseSlug: string;
  journeyType: string;
};

export type ProfessionalListItem = {
  id: string;
  title: string;
  description: string;
  hasButton: boolean;
  buttonText: string;
  buttonLink: string;
  buttonMode: ProfessionalActionMode;
};

export type ProfessionalListBlock = {
  id: string;
  type: "list";
  title: string;
  journey: ProfessionalJourneyColumn;
  items: ProfessionalListItem[];
};

export type ProfessionalImageBlock = {
  id: string;
  type: "image";
  title: string;
  journey: ProfessionalJourneyColumn;
  imageUrl: string;
  altText: string;
  caption: string;
};

export type ProfessionalVideoBlock = {
  id: string;
  type: "video";
  title: string;
  journey: ProfessionalJourneyColumn;

  provider: ProfessionalVideoProvider;

  videoUrl: string;

  thumbnail: string;

  caption: string;
};

export type ProfessionalContentBlock =
  | ProfessionalListBlock
  | ProfessionalImageBlock
  | ProfessionalVideoBlock;

export type ProfessionalPanelDraft = {
  screenTitle: string;
  screenSubtitle: string;
  screenAction: ProfessionalActionConfig;

  columnCount: 1 | 2;

  columnOneTitle: string;
  columnOneAction: ProfessionalActionConfig;

  columnTwoTitle: string;
  columnTwoAction: ProfessionalActionConfig;

  blocks: ProfessionalContentBlock[];
};

export type ProfessionalEditorContentType =
  | "list"
  | "image"
  | "video";