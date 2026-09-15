import { createClient } from "@/lib/supabase/server";

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

  return {
    settings:
      settingsResult.data as WhatsAppBotSettings | null,

    courses:
      (coursesResult.data ?? []) as WhatsAppCourse[],

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
  };
}