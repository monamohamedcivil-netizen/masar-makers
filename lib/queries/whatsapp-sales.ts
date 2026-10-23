import { createAdminClient, createClient } from "@/lib/supabase/server";
import { findChatCourse, isOneDayJourneyType } from "@/lib/webchat/courses";

export type WhatsAppBotSettings = {
  id: number;
  bot_enabled: boolean;
  greeting_text: string;
  human_mode_hours: number;
  unknown_message_behavior: "main_menu" | "ignore";
  updated_at: string;
};

export type WhatsAppCourse = {
  id: string;
  course_key: string;
  title: string;
  whatsapp_label: string | null;
  track: string | null;
  short_description: string | null;
  details: string | null;
  intro_video_url: string | null;
  course_url: string | null;
  has_variants: boolean;
  variants_prompt: string;
  is_active: boolean;
  whatsapp_visible: boolean;
  sort_order: number;
};

export type WhatsAppCourseVariant = {
  id: string;
  course_id: string;
  variant_key: string;
  title: string;
  short_description: string | null;
  details: string | null;
  intro_video_url: string | null;
  course_url: string | null;
  is_active: boolean;
  whatsapp_visible: boolean;
  sort_order: number;
};

export type WhatsAppCoursePrice = {
  id: string;
  course_id: string;
  variant_id: string | null;
  currency_code: string;
  currency_label: string;
  current_price: number;
  original_price: number | null;
  offer_label: string | null;
  offer_active: boolean;
  offer_start: string | null;
  offer_end: string | null;
  is_active: boolean;
  sort_order: number;
};

/** lesson_id null = the course's general one-day price; set = special price for that lecture. */
export type WhatsAppOneDayPrice = Omit<WhatsAppCoursePrice, "variant_id"> & {
  lesson_id: string | null;
  offer_label_en?: string | null;
};

/** A published lecture of a platform one-day journey, matched to its chat course. */
export type WhatsAppOneDayLesson = {
  id: string;
  chat_course_id: string;
  title: string;
  course_part: string | null;
  sort_order: number;
};

export type WhatsAppAnswer = {
  id: string;
  answer_key: string;
  admin_name: string;
  message_text: string;
  is_active: boolean;
};

export type WhatsAppMenu = {
  id: string;
  menu_key: string;
  admin_name: string;
  interaction_type: "list" | "buttons";
  header_text: string | null;
  body_text: string;
  footer_text: string | null;
  open_button_text: string | null;
  is_active: boolean;
  sort_order: number;
};

export type WhatsAppMenuItem = {
  id: string;
  menu_id: string;
  item_key: string | null;
  label: string;
  description: string | null;
  action_type:
    | "open_menu"
    | "show_answer"
    | "open_course"
    | "show_details"
    | "show_price"
    | "open_url"
    | "human_support"
    | "subscribe"
    | "main_menu";
  target_menu_id: string | null;
  answer_id: string | null;
  course_id: string | null;
  action_value: string | null;
  url: string | null;
  sort_order: number;
  is_active: boolean;
};

export type WhatsAppSession = {
  phone: string;
  mode: string | null;
  human_mode_until: string | null;
  current_menu_key: string | null;
  current_course_id: string | null;
  current_variant_id?: string | null;
  updated_at: string;
};

/** One-day lectures of every platform course, grouped under the matching chat course. */
async function getOneDayLessons(chatCourses: WhatsAppCourse[]): Promise<WhatsAppOneDayLesson[]> {
  const db = createAdminClient();
  const { data: courses } = await db.from("courses").select("id,title").eq("is_active", true);
  const chatCourseOf = new Map<string, string>();
  for (const c of courses ?? []) {
    const chat = findChatCourse(chatCourses, String(c.title ?? ""));
    if (chat) chatCourseOf.set(String(c.id), chat.id);
  }
  if (!chatCourseOf.size) return [];

  const { data: journeys } = await db
    .from("journeys")
    .select("id,course_id,journey_type")
    .in("course_id", [...chatCourseOf.keys()])
    .eq("is_active", true);
  const oneDay = (journeys ?? []).filter((j) => isOneDayJourneyType(j.journey_type));
  if (!oneDay.length) return [];

  const { data: links } = await db.from("lesson_journeys").select("lesson_id,journey_id").in("journey_id", oneDay.map((j) => j.id));
  const lessonIds = [...new Set((links ?? []).map((l) => String(l.lesson_id ?? "")).filter(Boolean))];
  if (!lessonIds.length) return [];

  const { data: lessons } = await db
    .from("lessons")
    .select("id,course_id,title,title_ar,course_part,sort_order")
    .in("id", lessonIds)
    .eq("status", "published");

  const partOrder: Record<string, number> = { fundamental: 1, fundamentals: 1, advanced: 2 };
  const part = (v: unknown) => partOrder[String(v ?? "").toLowerCase()] ?? 0;
  return (lessons ?? [])
    .filter((l) => chatCourseOf.has(String(l.course_id)))
    .map((l) => ({
      id: String(l.id),
      chat_course_id: chatCourseOf.get(String(l.course_id))!,
      title: String(l.title_ar || l.title || "محاضرة").trim(),
      course_part: l.course_part ?? null,
      sort_order: Number(l.sort_order ?? 0),
    }))
    .sort((a, b) => part(a.course_part) - part(b.course_part) || a.sort_order - b.sort_order);
}

export async function getWhatsAppSalesAdminData() {
  const supabase = await createClient();

  const [
    settingsResult,
    coursesResult,
    variantsResult,
    pricesResult,
    answersResult,
    menusResult,
    menuItemsResult,
    sessionsResult,
    oneDayPricesResult,
  ] = await Promise.all([
    supabase
      .from("whatsapp_bot_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle(),

    supabase
      .from("whatsapp_courses")
      .select("*")
      .order("sort_order"),

    supabase
      .from("whatsapp_course_variants")
      .select("*")
      .order("sort_order"),

    supabase
      .from("whatsapp_course_prices")
      .select("*")
      .order("sort_order"),

    supabase
      .from("whatsapp_answers")
      .select("*")
      .order("admin_name"),

    supabase
      .from("whatsapp_menus")
      .select("*")
      .order("sort_order"),

    supabase
      .from("whatsapp_menu_items")
      .select("*")
      .order("sort_order"),

    supabase
      .from("whatsapp_bot_sessions")
      .select("*")
      .order("updated_at", {
        ascending: false,
      }),

    // Not in `errors` below: the page still opens before the one-day migration is applied.
    supabase
      .from("whatsapp_oneday_prices")
      .select("*")
      .order("sort_order"),
  ]);

  const errors = [
    settingsResult.error,
    coursesResult.error,
    variantsResult.error,
    pricesResult.error,
    answersResult.error,
    menusResult.error,
    menuItemsResult.error,
    sessionsResult.error,
  ].filter(Boolean);

  if (errors.length) {
    throw new Error(
      errors
        .map((error) => error?.message)
        .join(" | "),
    );
  }

  const courses = (coursesResult.data ?? []) as WhatsAppCourse[];
  const oneDayLessons = await getOneDayLessons(courses).catch((error) => {
    console.error("one-day lessons failed:", error);
    return [] as WhatsAppOneDayLesson[];
  });

  return {
    settings:
      settingsResult.data as WhatsAppBotSettings | null,

    courses,

    variants:
      (variantsResult.data ?? []) as WhatsAppCourseVariant[],

    prices:
      (pricesResult.data ?? []) as WhatsAppCoursePrice[],

    answers:
      (answersResult.data ?? []) as WhatsAppAnswer[],

    menus:
      (menusResult.data ?? []) as WhatsAppMenu[],

    menuItems:
      (menuItemsResult.data ?? []) as WhatsAppMenuItem[],

    sessions:
      (sessionsResult.data ?? []) as WhatsAppSession[],

    oneDayPrices:
      (oneDayPricesResult.data ?? []) as WhatsAppOneDayPrice[],

    oneDayReady: !oneDayPricesResult.error,

    oneDayLessons,
  };
}