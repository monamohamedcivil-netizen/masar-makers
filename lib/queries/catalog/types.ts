export type CatalogJourneyStatus =
  | "draft"
  | "open"
  | "closed"
  | "coming_soon"
  | "archived";

export type CatalogJourney = {
  id: string;
  course_id: string;

  slug: string;
  title: string;
  journey_type: string;

  description: string | null;
  duration_hours: number | null;

  price: number | null;
  currency: string;

  registration_required: boolean;
  status: CatalogJourneyStatus;

  start_date: string | null;
  end_date: string | null;

  is_active: boolean;
  display_order: number;

  created_at: string;
  updated_at: string;
};

export type CatalogCourse = {
  id: string;
  station_id: string;

  slug: string;
  title: string;
  subtitle: string | null;

  description: string | null;
  long_description: string | null;

  image_url: string | null;
  icon_url: string | null;

  duration_hours: number | null;
  projects_count: number;
  level: string | null;

  final_outcome: string | null;

  is_active: boolean;
  is_featured: boolean;
  display_order: number;

  created_at: string;
  updated_at: string;

  journeys: CatalogJourney[];
};

export type CatalogStation = {
  id: string;
  career_path_id: string;

  slug: string;
  title: string;
  short_title: string | null;
  description: string | null;

  image_url: string | null;
  icon_url: string | null;

  learning_column_title: string | null;
  result_column_title: string | null;

  journey_layout:
    | "single"
    | "foundation_advanced";

  is_active: boolean;
  display_order: number;

  created_at: string;
  updated_at: string;

  courses: CatalogCourse[];

  stats_journey_count: number | null;
  stats_lesson_count: number | null;
  stats_training_hours: number | null;
  stats_level_label: string | null;
};

export type CatalogCareerPath = {
  id: string;

  slug: string;
  title: string;
  short_title: string | null;
  description: string | null;
  image_url: string | null;

  is_active: boolean;
  display_order: number;

  created_at: string;
  updated_at: string;

  course_stations: CatalogStation[];
};

export type CatalogModule = {
  id: string;
  journey_id: string;

  title: string;
  description: string | null;

  duration_minutes: number | null;
  display_order: number;

  is_preview: boolean;
  is_active: boolean;

  created_at: string;
  updated_at: string;
};

export type CatalogCoursePanelItem = {
  id: string;
  station_id: string;
  station_title: string | null;

  title: string;
  icon: string | null;

  panel_type: string;
  panel_component: string;

  display_order: number;
  active: boolean;

  created_at: string;
  updated_at: string;
};

export type CatalogCoursePanel = {
  id: string;
  template_id: string;

  panel_component: string;
  title: string;
  description: string | null;

  icon: string | null;
  layout_type: string;

  display_order: number;
  active: boolean;

  created_at: string;
  updated_at: string;
};

export type CatalogPanelSection = {
  id: string;
  panel_id: string;

  section_key: string;
  title: string | null;

  display_order: number;
  active: boolean;

  created_at: string;
  updated_at: string;
};

export type CatalogCourseTemplate = {
  id: string;

  name: string;
  slug: string;

  description: string | null;

  template_type:
    | "road"
    | "traffic"
    | "general";

  version: number;

  source_station_id: string | null;

  content_schema: Record<
    string,
    unknown
  >;

  layout_schema: Record<
    string,
    unknown
  >;

  is_default: boolean;
  is_active: boolean;

  created_at: string;
  updated_at: string;
};

export type PanelBlockType =
  | "heading"
  | "text"
  | "image"
  | "video"
  | "learning_outcomes"
  | "downloads"
  | "faq"
  | "cta";

export type CatalogPanelBlock = {
  id: string;

  panel_id: string;
  section_id: string | null;

  block_type: PanelBlockType;

  title: string | null;
  subtitle: string | null;
  content: string | null;

  media_url: string | null;
  icon: string | null;

  data: Record<string, unknown>;

  display_order: number;
  active: boolean;

  created_at: string;
  updated_at: string;
  
};