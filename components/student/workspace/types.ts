import type { LucideIcon } from "lucide-react";

export type WorkspacePanelId =
  | "career"
  | "one-day"
  | "free"
  | "next"
  | "certificates"
  | "achievements"
  | "surveys"
  | "projects";

export type WorkspacePanelKind =
  | "course-list"
  | "empty-journey"
  | "next-step"
  | "certificates"
  | "achievement-card"
  | "surveys"
  | "projects";

export type WorkspaceSide = "learning" | "achievement";

export type WorkspacePanelDefinition = {
  id: WorkspacePanelId;
  title: string;
  eyebrow?: string;
  icon: LucideIcon;
  side: WorkspaceSide;
  kind: WorkspacePanelKind;
  order: number;
  settings?: Record<string, string | number | boolean>;
};

export type WorkspaceDefinition = {
  id: string;
  slug: string;
  defaultPanelId: WorkspacePanelId;
  panels: WorkspacePanelDefinition[];
};
