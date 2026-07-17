import "server-only";

import { createClient } from "@/lib/supabase/server";

/* ==================================================
   Shared Types
================================================== */

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

/* ==================================================
   Internal Helpers
================================================== */

function sortJourneys(
  journeys: CatalogJourney[] | null | undefined
): CatalogJourney[] {
  return [...(journeys ?? [])].sort(
    (a, b) => a.display_order - b.display_order
  );
}

function sortCourses(
  courses: CatalogCourse[] | null | undefined
): CatalogCourse[] {
  return [...(courses ?? [])]
    .sort((a, b) => a.display_order - b.display_order)
    .map((course) => ({
      ...course,
      journeys: sortJourneys(course.journeys),
    }));
}

function sortStations(
  stations: CatalogStation[] | null | undefined
): CatalogStation[] {
  return [...(stations ?? [])]
    .sort((a, b) => a.display_order - b.display_order)
    .map((station) => ({
      ...station,
      courses: sortCourses(station.courses),
    }));
}

function normalizeCareerPath(
  path: CatalogCareerPath
): CatalogCareerPath {
  return {
    ...path,
    course_stations: sortStations(
      path.course_stations
      

    ),
  };
}

/* ==================================================
   Career Paths
================================================== */

/**
 * قراءة جميع المسارات النشطة مع المحطات
 * والكورسات والرحلات المرتبطة بها.
 */

export async function getCareerPaths(): Promise<
  CatalogCareerPath[]
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("career_paths")
    .select(`
      id,
      slug,
      title,
      short_title,
      description,
      image_url,
      is_active,
      display_order,
      created_at,
      updated_at,

      course_stations (
        id,
        career_path_id,
        slug,
        title,
        short_title,
        description,
        image_url,
        icon_url,
        learning_column_title,
        result_column_title,
        journey_layout,
        is_active,
        display_order,
        created_at,
        updated_at,
        stats_journey_count,
        stats_lesson_count,
        stats_training_hours,
        stats_level_label,

        courses (
          id,
          station_id,
          slug,
          title,
          subtitle,
          description,
          long_description,
          image_url,
          icon_url,
          duration_hours,
          projects_count,
          level,
          final_outcome,
          is_active,
          is_featured,
          display_order,
          created_at,
          updated_at,

          journeys (
            id,
            course_id,
            slug,
            title,
            journey_type,
            description,
            duration_hours,
            price,
            currency,
            registration_required,
            status,
            start_date,
            end_date,
            is_active,
            display_order,
            created_at,
            updated_at
          )
        )
      )
    `)
    .eq("is_active", true)
    .order("display_order", {
      ascending: true,
    });

  if (error) {
    console.error(
      "Failed to load career paths:",
      {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      }
    );

    throw new Error(
      "تعذر تحميل المسارات التعليمية."
    );
  }

  return (
    (data ?? []) as unknown as CatalogCareerPath[]
  ).map(normalizeCareerPath);
}

/**
 * قراءة مسار واحد كاملًا باستخدام slug.
 */
export async function getCareerPathBySlug(
  slug: string
): Promise<CatalogCareerPath | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("career_paths")
    .select(`
      id,
      slug,
      title,
      short_title,
      description,
      image_url,
      is_active,
      journey_layout,
      display_order,
      created_at,
      updated_at,

      course_stations (
        id,
        career_path_id,
        slug,
        title,
        short_title,
        description,
        image_url,
        icon_url,
        learning_column_title,
result_column_title,
        is_active,
        display_order,
        created_at,
        updated_at,
stats_journey_count,
stats_lesson_count,
stats_training_hours,
stats_level_label,

        courses (
          id,
          station_id,
          slug,
          title,
          subtitle,
          description,
          long_description,
          image_url,
          icon_url,
          learning_column_title,
result_column_title,
          duration_hours,
          projects_count,
          level,
          final_outcome,
          is_active,
          is_featured,
          display_order,
          created_at,
          updated_at,

          journeys (
            id,
            course_id,
            slug,
            title,
            journey_type,
            description,
            duration_hours,
            price,
            currency,
            registration_required,
            status,
            start_date,
            end_date,
            is_active,
            display_order,
            created_at,
            updated_at
          )
        )
      )
    `)
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.error(
      `Failed to load career path "${slug}":`,
      error
    );

    throw new Error(
      "تعذر تحميل بيانات المسار."
    );
  }

  if (!data) {
    return null;
  }

  return normalizeCareerPath(
    data as unknown as CatalogCareerPath
  );
}

/* ==================================================
   Stations
================================================== */

/**
 * قراءة محطة واحدة مع جميع الكورسات
 * والرحلات الموجودة داخلها.
 */
export async function getStationBySlug(
  slug: string
): Promise<CatalogStation | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("course_stations")
    .select(`
  id,
  career_path_id,
  slug,
  title,
  short_title,
  description,
  image_url,
  icon_url,
  learning_column_title,
  result_column_title,
  journey_layout,
  is_active,
  display_order,
  created_at,
  updated_at,
  stats_journey_count,
  stats_lesson_count,
  stats_training_hours,
  stats_level_label,

  courses (
    id,
    station_id,
    slug,
    title,
    subtitle,
    description,
    long_description,
    image_url,
    icon_url,
    duration_hours,
    projects_count,
    level,
    final_outcome,
    is_active,
    is_featured,
    display_order,
    created_at,
    updated_at,

    journeys (
      id,
      course_id,
      slug,
      title,
      journey_type,
      description,
      duration_hours,
      price,
      currency,
      registration_required,
      status,
      start_date,
      end_date,
      is_active,
      display_order,
      created_at,
      updated_at
    )
  )
`)
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.error(
      `Failed to load station "${slug}":`,
      error
    );

    throw new Error(
      "تعذر تحميل بيانات المحطة."
    );
  }

  if (!data) {
    return null;
  }

  const station =
    data as unknown as CatalogStation;

  return {
    ...station,
    courses: sortCourses(station.courses),
  };
}

/* ==================================================
   Courses
================================================== */

/**
 * قراءة كورس واحد مع جميع الرحلات الموجودة داخله.
 */
export async function getCatalogCourseBySlug(
  slug: string
): Promise<CatalogCourse | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("courses")
    .select(`
      id,
      station_id,
      slug,
      title,
      subtitle,
      description,
      long_description,
      image_url,
      icon_url,
      learning_column_title,
result_column_title,
      duration_hours,
      projects_count,
      level,
      final_outcome,
      is_active,
      is_featured,
      display_order,
      created_at,
      updated_at,

      journeys (
        id,
        course_id,
        slug,
        title,
        journey_type,
        description,
        duration_hours,
        price,
        currency,
        registration_required,
        status,
        start_date,
        end_date,
        is_active,
        display_order,
        created_at,
        updated_at
      ),

      course_stations (
        id,
        career_path_id,
        slug,
        title,
        short_title,
        description,
        image_url,
        icon_url,
        learning_column_title,
result_column_title,
        journey_layout,
        is_active,
        display_order,
        created_at,
        updated_at
        stats_journey_count,
stats_lesson_count,
stats_training_hours,
stats_level_label,
      )
    `)
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.error(
      `Failed to load course "${slug}":`,
      error
    );

    throw new Error(
      "تعذر تحميل بيانات الكورس."
    );
  }

  if (!data) {
    return null;
  }

  const course =
    data as unknown as CatalogCourse;

  return {
    ...course,
    journeys: sortJourneys(course.journeys),
  };
}

/* ==================================================
   Journeys
================================================== */

/**
 * قراءة رحلة واحدة.
 */
export async function getJourneyBySlug(
  slug: string
): Promise<CatalogJourney | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("journeys")
    .select(`
      id,
      course_id,
      slug,
      title,
      journey_type,
      description,
      duration_hours,
      price,
      currency,
      registration_required,
      status,
      start_date,
      end_date,
      is_active,
      display_order,
      created_at,
      updated_at
    `)
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.error(
      `Failed to load journey "${slug}":`,
      error
    );

    throw new Error(
      "تعذر تحميل بيانات الرحلة."
    );
  }

  return data as CatalogJourney | null;
}

/**
 * قراءة الرحلات الموجودة داخل كورس معين.
 */
export async function getJourneysByCourseId(
  courseId: string
): Promise<CatalogJourney[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("journeys")
    .select(`
      id,
      course_id,
      slug,
      title,
      journey_type,
      description,
      duration_hours,
      price,
      currency,
      registration_required,
      status,
      start_date,
      end_date,
      is_active,
      display_order,
      created_at,
      updated_at
    `)
    .eq("course_id", courseId)
    .eq("is_active", true)
    .order("display_order", {
      ascending: true,
    });

  if (error) {
    console.error(
      "Failed to load course journeys:",
      error
    );

    throw new Error(
      "تعذر تحميل رحلات الكورس."
    );
  }

  return (data ?? []) as CatalogJourney[];
}

/* ==================================================
   Journey Modules
================================================== */

/**
 * قراءة محاور رحلة واحدة.
 */
export async function getJourneyModules(
  journeyId: string
): Promise<CatalogModule[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("journey_modules")
    .select(`
      id,
      journey_id,
      title,
      description,
      duration_minutes,
      display_order,
      is_preview,
      is_active,
      created_at,
      updated_at
    `)
    .eq("journey_id", journeyId)
    .eq("is_active", true)
    .order("display_order", {
      ascending: true,
    });

  if (error) {
    console.error(
      "Failed to load journey modules:",
      error
    );

    throw new Error(
      "تعذر تحميل محاور الرحلة."
    );
    
  }

  return (data ?? []) as CatalogModule[];


}
/* ==================================================
   Course Dashboard Controls
================================================== */

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

export async function getCourseLearningModes(
  stationId: string
): Promise<CatalogCoursePanelItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("course_learning_modes")
    .select(`
      id,
      station_id,
      station_title,
      title,
      icon,
      panel_type,
      panel_component,
      display_order,
      active,
      created_at,
      updated_at
    `)
    .eq("station_id", stationId)
    .eq("active", true)
    .order("display_order", {
      ascending: true,
    });

  if (error) {
    console.error("Failed to load course learning modes:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });

    return [];
  }

  return (data ?? []) as CatalogCoursePanelItem[];
}

export async function getCourseResultTabs(
  stationId: string
): Promise<CatalogCoursePanelItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("course_result_tabs")
    .select(`
      id,
      station_id,
      station_title,
      title,
      icon,
      panel_type,
      panel_component,
      display_order,
      active,
      created_at,
      updated_at
    `)
    .eq("station_id", stationId)
    .eq("active", true)
    .order("display_order", {
      ascending: true,
    });

  if (error) {
    console.error("Failed to load course result tabs:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });

    return [];
  }

  return (data ?? []) as CatalogCoursePanelItem[];
}
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

export async function getTemplatePanels(
  templateId: string
): Promise<CatalogCoursePanel[]> {
  const supabase =
    await createClient();

  const { data, error } =
    await supabase
      .from("course_panels")
      .select(`
        id,
        template_id,
        panel_component,
        title,
        description,
        icon,
        layout_type,
        display_order,
        active,
        created_at,
        updated_at
      `)
      .eq("template_id", templateId)
      .order("display_order", {
        ascending: true,
      });

  if (error) {
    console.error(
      "Failed to load template panels:",
      {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      }
    );

    return [];
  }

  return (
    data ?? []
  ) as CatalogCoursePanel[];
}

export async function getPanelSections(
  panelId: string
): Promise<CatalogPanelSection[]> {
  const supabase =
    await createClient();

  const { data, error } =
    await supabase
      .from("course_panel_sections")
      .select(`
        id,
        panel_id,
        section_key,
        title,
        display_order,
        active,
        created_at,
        updated_at
      `)
      .eq("panel_id", panelId)
      .order("display_order", {
        ascending: true,
      });

  if (error) {
    console.error(
      "Failed to load panel sections:",
      {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      }
    );

    return [];
  }

  return (
    data ?? []
  ) as CatalogPanelSection[];
}

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

export async function getCourseTemplates() {
  const supabase =
    await createClient();

  const { data, error } =
    await supabase
      .from("course_templates")
      .select("*")
      .order("template_type")
      .order("version");

  if (error) {
    console.error(
      "Failed to load templates:",
      error
    );

    return [];
  }

  return (
    data ?? []
  ) as CatalogCourseTemplate[];
}