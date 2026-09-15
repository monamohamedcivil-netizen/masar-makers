import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* =========================================================
   Environment
========================================================= */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN ?? "";
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID ?? "";
const WHATSAPP_GRAPH_VERSION = process.env.WHATSAPP_GRAPH_VERSION ?? "";
const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN ?? "";
const META_APP_SECRET = process.env.META_APP_SECRET ?? "";

function getSupabase(): SupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_SECRET) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return createClient(SUPABASE_URL, SUPABASE_SECRET, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/* =========================================================
   Small helpers
========================================================= */

type AnyRow = Record<string, any>;

type SessionRow = {
  phone: string;
  mode?: string | null;
  current_menu_key?: string | null;
  current_course_id?: string | null;
  current_variant_id?: string | null;
  current_track?: string | null;
  human_mode_until?: string | null;
  updated_at?: string | null;
};

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cut(value: unknown, max: number) {
  const text = cleanText(value);
  if (text.length <= max) return text;
  return `${text.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

function formatNumber(value: unknown) {
  const number = Number(value);
  if (!Number.isFinite(number)) return String(value ?? "");

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(number);
}

function splitLongText(text: string, limit = 3900) {
  const normalized = text.trim();
  if (!normalized) return [];
  if (normalized.length <= limit) return [normalized];

  const chunks: string[] = [];
  let remaining = normalized;

  while (remaining.length > limit) {
    let index = remaining.lastIndexOf("\n", limit);
    if (index < Math.floor(limit * 0.55)) {
      index = remaining.lastIndexOf(" ", limit);
    }
    if (index < Math.floor(limit * 0.55)) {
      index = limit;
    }

    chunks.push(remaining.slice(0, index).trim());
    remaining = remaining.slice(index).trim();
  }

  if (remaining) chunks.push(remaining);
  return chunks;
}

function renderTemplate(text: string, values: Record<string, string>) {
  let output = text;
  for (const [key, value] of Object.entries(values)) {
    output = output.replaceAll(`{${key}}`, value);
  }
  return output;
}

function isHttpUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

function isActiveOffer(price: AnyRow) {
  if (!price.offer_active) return false;

  const now = Date.now();
  const start = price.offer_start ? new Date(price.offer_start).getTime() : null;
  const end = price.offer_end ? new Date(price.offer_end).getTime() : null;

  if (start && Number.isFinite(start) && now < start) return false;
  if (end && Number.isFinite(end) && now > end) return false;

  return true;
}

function getHumanHours(settings: AnyRow | null) {
  const value = Number(
    settings?.human_mode_hours ?? settings?.human_support_hours ?? 24,
  );

  return Number.isFinite(value) && value > 0 ? value : 24;
}

function botIsEnabled(settings: AnyRow | null) {
  if (!settings) return true;
  if (typeof settings.bot_enabled === "boolean") return settings.bot_enabled;
  if (typeof settings.is_enabled === "boolean") return settings.is_enabled;
  return true;
}

/* =========================================================
   WhatsApp Cloud API
========================================================= */

async function sendWhatsApp(payload: AnyRow) {
  if (
    !WHATSAPP_ACCESS_TOKEN ||
    !WHATSAPP_PHONE_NUMBER_ID ||
    !WHATSAPP_GRAPH_VERSION
  ) {
    throw new Error(
      "Missing WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_GRAPH_VERSION.",
    );
  }

  const response = await fetch(
    `https://graph.facebook.com/${WHATSAPP_GRAPH_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        ...payload,
      }),
    },
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    console.error("WhatsApp send failed:", data);
    throw new Error(
      `WhatsApp API error ${response.status}: ${JSON.stringify(data)}`,
    );
  }
  
console.log(
  "WhatsApp send success:",
  JSON.stringify(data),
);

  return data;
}

async function sendText(to: string, text: string) {
  const chunks = splitLongText(text);

  for (const chunk of chunks) {
    await sendWhatsApp({
      to,
      type: "text",
      text: {
        preview_url: true,
        body: chunk,
      },
    });
  }
}

async function sendButtons({
  to,
  body,
  header,
  footer,
  buttons,
}: {
  to: string;
  body: string;
  header?: string | null;
  footer?: string | null;
  buttons: Array<{ id: string; title: string }>;
}) {
  const limited = buttons.slice(0, 3);

  await sendWhatsApp({
    to,
    type: "interactive",
    interactive: {
      type: "button",
      ...(cleanText(header)
        ? {
            header: {
              type: "text",
              text: cut(header, 60),
            },
          }
        : {}),
      body: {
        text: cut(body || "اختر من الخيارات التالية:", 1024),
      },
      ...(cleanText(footer)
        ? {
            footer: {
              text: cut(footer, 60),
            },
          }
        : {}),
      action: {
        buttons: limited.map((button) => ({
          type: "reply",
          reply: {
            id: button.id,
            title: cut(button.title, 20),
          },
        })),
      },
    },
  });
}

async function sendList({
  to,
  body,
  header,
  footer,
  buttonText,
  rows,
}: {
  to: string;
  body: string;
  header?: string | null;
  footer?: string | null;
  buttonText?: string | null;
  rows: Array<{ id: string; title: string; description?: string | null }>;
}) {
  const limited = rows.slice(0, 10);

  await sendWhatsApp({
    to,
    type: "interactive",
    interactive: {
      type: "list",
      ...(cleanText(header)
        ? {
            header: {
              type: "text",
              text: cut(header, 60),
            },
          }
        : {}),
      body: {
        text: cut(body || "اختر من القائمة التالية:", 1024),
      },
      ...(cleanText(footer)
        ? {
            footer: {
              text: cut(footer, 60),
            },
          }
        : {}),
      action: {
        button: cut(buttonText || "عرض الخيارات", 20),
        sections: [
          {
            rows: limited.map((row) => ({
              id: row.id,
              title: cut(row.title, 24),
              ...(cleanText(row.description)
                ? { description: cut(row.description, 72) }
                : {}),
            })),
          },
        ],
      },
    },
  });
}

/* =========================================================
   Database helpers
========================================================= */

async function getSettings(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("whatsapp_bot_settings")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Could not load WhatsApp settings:", error);
    return null;
  }

  return (data ?? null) as AnyRow | null;
}

async function getSession(supabase: SupabaseClient, phone: string) {
  const { data, error } = await supabase
    .from("whatsapp_bot_sessions")
    .select("*")
    .eq("phone", phone)
    .maybeSingle();

  if (error) {
    console.error("Could not load WhatsApp session:", error);
    return null;
  }

  return (data ?? null) as SessionRow | null;
}

async function patchSession(
  supabase: SupabaseClient,
  phone: string,
  patch: Partial<SessionRow>,
) {
  const { error } = await supabase.from("whatsapp_bot_sessions").upsert(
    {
      phone,
      ...patch,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "phone" },
  );

  if (error) {
    console.error("Could not update WhatsApp session:", error);
    throw error;
  }
}

async function getMenuByKey(supabase: SupabaseClient, menuKey: string) {
  const { data, error } = await supabase
    .from("whatsapp_menus")
    .select("*")
    .eq("menu_key", menuKey)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw error;
  return (data ?? null) as AnyRow | null;
}

async function getMenuById(supabase: SupabaseClient, id: string) {
  const { data, error } = await supabase
    .from("whatsapp_menus")
    .select("*")
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw error;
  return (data ?? null) as AnyRow | null;
}

async function getMenuItems(supabase: SupabaseClient, menuId: string) {
  const { data, error } = await supabase
    .from("whatsapp_menu_items")
    .select("*")
    .eq("menu_id", menuId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data ?? []) as AnyRow[];
}

async function getMenuItem(supabase: SupabaseClient, id: string) {
  const { data, error } = await supabase
    .from("whatsapp_menu_items")
    .select("*")
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw error;
  return (data ?? null) as AnyRow | null;
}

async function getCourse(supabase: SupabaseClient, id: string) {
  const { data, error } = await supabase
    .from("whatsapp_courses")
    .select("*")
    .eq("id", id)
    .eq("is_active", true)
    .eq("whatsapp_visible", true)
    .maybeSingle();

  if (error) throw error;
  return (data ?? null) as AnyRow | null;
}

async function getActiveVariants(supabase: SupabaseClient, courseId: string) {
  const { data, error } = await supabase
    .from("whatsapp_course_variants")
    .select("*")
    .eq("course_id", courseId)
    .eq("is_active", true)
    .eq("whatsapp_visible", true)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data ?? []) as AnyRow[];
}

async function getAnswerById(supabase: SupabaseClient, id: string) {
  const { data, error } = await supabase
    .from("whatsapp_answers")
    .select("*")
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw error;
  return (data ?? null) as AnyRow | null;
}

async function getAnswerByKey(supabase: SupabaseClient, key: string) {
  const { data, error } = await supabase
    .from("whatsapp_answers")
    .select("*")
    .eq("answer_key", key)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw error;
  return (data ?? null) as AnyRow | null;
}

/* =========================================================
   Bot UI
========================================================= */

async function sendMenu(
  supabase: SupabaseClient,
  to: string,
  menu: AnyRow,
  session?: SessionRow | null,
  extraValues: Record<string, string> = {},
) {
  const items = await getMenuItems(supabase, menu.id);
  if (!items.length) {
    await sendText(to, "لا توجد خيارات متاحة حاليًا.");
    return;
  }

  const values = {
    course: "",
    track: session?.current_track ?? "",
    ...extraValues,
  };

  const body = renderTemplate(
    cleanText(menu.body_text) || "اختر من الخيارات التالية:",
    values,
  );

  const header = renderTemplate(cleanText(menu.header_text), values);
  const footer = renderTemplate(cleanText(menu.footer_text), values);

  if (menu.interaction_type === "buttons") {
    await sendButtons({
      to,
      body,
      header,
      footer,
      buttons: items.slice(0, 3).map((item) => ({
        id: `menuitem:${item.id}`,
        title: item.label,
      })),
    });
  } else {
    await sendList({
      to,
      body,
      header,
      footer,
      buttonText: menu.open_button_text || "عرض الخيارات",
      rows: items.slice(0, 10).map((item) => ({
        id: `menuitem:${item.id}`,
        title: item.label,
        description: item.description,
      })),
    });
  }

  await patchSession(supabase, to, {
    mode: "bot",
    current_menu_key: menu.menu_key,
  });
}

async function sendMenuByKey(
  supabase: SupabaseClient,
  to: string,
  menuKey: string,
  session?: SessionRow | null,
  extraValues: Record<string, string> = {},
) {
  const menu = await getMenuByKey(supabase, menuKey);

  if (!menu) {
    await sendText(to, "القائمة غير متاحة حاليًا.");
    return;
  }

  await sendMenu(supabase, to, menu, session, extraValues);
}

async function sendMainMenu(
  supabase: SupabaseClient,
  to: string,
  session?: SessionRow | null,
) {
  await patchSession(supabase, to, {
    mode: "bot",
    current_menu_key: "main_menu",
    current_course_id: null,
    current_variant_id: null,
  });

  const latest = await getSession(supabase, to);
  await sendMenuByKey(supabase, to, "main_menu", latest ?? session);
}

async function showTrackCourses(
  supabase: SupabaseClient,
  to: string,
  track: string,
) {
  const { data, error } = await supabase
    .from("whatsapp_courses")
    .select("*")
    .eq("track", track)
    .eq("is_active", true)
    .eq("whatsapp_visible", true)
    .order("sort_order", { ascending: true });

  if (error) throw error;

  const courses = (data ?? []) as AnyRow[];

  await patchSession(supabase, to, {
    mode: "bot",
    current_track: track,
    current_course_id: null,
    current_variant_id: null,
    current_menu_key: "dynamic_courses",
  });

  if (!courses.length) {
    await sendText(to, "لا توجد كورسات متاحة في هذا المسار حاليًا.");
    await sendMenuByKey(supabase, to, "tracks_menu", await getSession(supabase, to));
    return;
  }

  const trackName =
    track === "Road Design"
      ? "مسار تصميم الطرق"
      : track === "Traffic Engineering"
        ? "مسار هندسة المرور"
        : track;

  const chunks: AnyRow[][] = [];
  for (let i = 0; i < courses.length; i += 10) {
    chunks.push(courses.slice(i, i + 10));
  }

  for (let index = 0; index < chunks.length; index += 1) {
    const chunk = chunks[index];
    const suffix = chunks.length > 1 ? ` (${index + 1}/${chunks.length})` : "";

    await sendList({
      to,
      header: trackName,
      body: `اختر الكورس الذي تريد استكشافه${suffix}:`,
      buttonText: "عرض الكورسات",
      rows: chunk.map((course) => ({
        id: `course:${course.id}`,
        title: course.whatsapp_label || course.title,
        description: course.short_description,
      })),
    });
  }
}

async function openCourse(
  supabase: SupabaseClient,
  to: string,
  courseId: string,
) {
  const course = await getCourse(supabase, courseId);

  if (!course) {
    await sendText(to, "هذا الكورس غير متاح حاليًا.");
    await sendMainMenu(supabase, to, await getSession(supabase, to));
    return;
  }

  await patchSession(supabase, to, {
    mode: "bot",
    current_course_id: course.id,
    current_variant_id: null,
    current_track: course.track ?? null,
    current_menu_key: "course_actions",
  });

  const session = await getSession(supabase, to);
  await sendMenuByKey(supabase, to, "course_actions", session, {
    course: course.whatsapp_label || course.title,
    track: course.track ?? "",
  });
}

async function showCourseDetails(
  supabase: SupabaseClient,
  to: string,
  session: SessionRow,
) {
  if (!session.current_course_id) {
    await sendMainMenu(supabase, to, session);
    return;
  }

  const course = await getCourse(supabase, session.current_course_id);
  if (!course) {
    await sendMainMenu(supabase, to, session);
    return;
  }

  let message = `📘 *${course.whatsapp_label || course.title}*`;

  const parentIntro = cleanText(course.details) || cleanText(course.short_description);
  if (parentIntro) message += `\n\n${parentIntro}`;

  if (course.has_variants) {
    const variants = await getActiveVariants(supabase, course.id);

    for (const variant of variants) {
      const details = cleanText(variant.details) || cleanText(variant.short_description);
      if (!details) continue;

      message += `\n\n━━━━━━━━━━━━\n*${variant.title}*\n${details}`;
    }
  }

  await sendText(to, message);
  await openCourse(supabase, to, course.id);
}

async function showCoursePrice(
  supabase: SupabaseClient,
  to: string,
  session: SessionRow,
  currencyCode: string,
) {
  if (!session.current_course_id) {
    await sendMainMenu(supabase, to, session);
    return;
  }

  const course = await getCourse(supabase, session.current_course_id);
  if (!course) {
    await sendMainMenu(supabase, to, session);
    return;
  }

  const currency = currencyCode.toUpperCase();
  let message = `💰 *أسعار ${course.whatsapp_label || course.title}*`;

  if (course.has_variants) {
    const variants = await getActiveVariants(supabase, course.id);

    for (const variant of variants) {
      const { data, error } = await supabase
        .from("whatsapp_course_prices")
        .select("*")
        .eq("course_id", course.id)
        .eq("variant_id", variant.id)
        .eq("currency_code", currency)
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data) continue;

      message += `\n\n${formatPriceBlock(variant.title, data as AnyRow)}`;
    }
  } else {
    const { data, error } = await supabase
      .from("whatsapp_course_prices")
      .select("*")
      .eq("course_id", course.id)
      .is("variant_id", null)
      .eq("currency_code", currency)
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    if (data) {
      message += `\n\n${formatPriceBlock(course.title, data as AnyRow)}`;
    }
  }

  if (!message.includes("\n\n")) {
    await sendText(
      to,
      "هذا السعر غير متاح بهذه العملة حاليًا. يمكنك اختيار عملة أخرى أو التواصل مع خدمة العملاء.",
    );
    await sendMenuByKey(supabase, to, "currency_menu", session, {
      course: course.title,
    });
    return;
  }

  await sendText(to, message);
  await openCourse(supabase, to, course.id);
}

function formatPriceBlock(title: string, price: AnyRow) {
  const currencyLabel = cleanText(price.currency_label) || cleanText(price.currency_code);
  const offerActive = isActiveOffer(price);

  const current = Number(price.current_price);
  const original =
    price.original_price == null || price.original_price === ""
      ? null
      : Number(price.original_price);

  if (
    offerActive &&
    Number.isFinite(current) &&
    original != null &&
    Number.isFinite(original) &&
    original > current
  ) {
    const offer = cleanText(price.offer_label);

    return [
      `*${title}*`,
      `${formatNumber(current)} ${currencyLabel}`,
      `بدلًا من ${formatNumber(original)} ${currencyLabel}`,
      ...(offer ? [`🎁 ${offer}`] : []),
    ].join("\n");
  }

  const normal =
    original != null && Number.isFinite(original)
      ? original
      : Number.isFinite(current)
        ? current
        : price.current_price;

  return [`*${title}*`, `${formatNumber(normal)} ${currencyLabel}`].join("\n");
}

async function sendCourseUrl(
  supabase: SupabaseClient,
  to: string,
  session: SessionRow,
  item: AnyRow,
) {
  if (!session.current_course_id) {
    await sendMainMenu(supabase, to, session);
    return;
  }

  const course = await getCourse(supabase, session.current_course_id);
  if (!course) {
    await sendMainMenu(supabase, to, session);
    return;
  }

  const actionValue = cleanText(item.action_value);
  let url = cleanText(item.url);

  if (!url && isHttpUrl(actionValue)) {
    url = actionValue;
  }

  if (!url && actionValue === "intro_video") {
    url = cleanText(course.intro_video_url);
  }

  if (!url && actionValue === "course_url") {
    url = cleanText(course.course_url);
  }

  if (!url && course.has_variants) {
    const variants = await getActiveVariants(supabase, course.id);
    const field = actionValue === "course_url" ? "course_url" : "intro_video_url";
    const first = variants.find((variant) => cleanText(variant[field]));
    if (first) url = cleanText(first[field]);
  }

  if (!url) {
    await sendText(to, "الرابط غير متاح حاليًا.");
  } else {
    const label = cleanText(item.label) || "الرابط";
    await sendText(to, `${label}\n${url}`);
  }

  await openCourse(supabase, to, course.id);
}

async function enterHumanMode(
  supabase: SupabaseClient,
  to: string,
  settings: AnyRow | null,
  answerKey = "human_support",
) {
  const hours = getHumanHours(settings);
  const until = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

  const answer = await getAnswerByKey(supabase, answerKey).catch(() => null);
  const defaultMessage =
    answerKey === "other_currency"
      ? "سيتم تحويلك إلى خدمة العملاء لمساعدتك بالسعر بالعملة المطلوبة."
      : "تم تحويلك إلى خدمة العملاء. سيتابع معك أحد أفراد الفريق قريبًا.";

  await sendText(to, cleanText(answer?.message_text) || defaultMessage);

  await patchSession(supabase, to, {
    mode: "human",
    human_mode_until: until,
  });
}

/* =========================================================
   Action handling
========================================================= */

async function handleMenuItem(
  supabase: SupabaseClient,
  to: string,
  itemId: string,
  settings: AnyRow | null,
) {
  const item = await getMenuItem(supabase, itemId);
  if (!item) {
    await sendMainMenu(supabase, to, await getSession(supabase, to));
    return;
  }

  let session = await getSession(supabase, to);
  if (!session) {
    await patchSession(supabase, to, { mode: "bot" });
    session = await getSession(supabase, to);
  }

  switch (item.action_type) {
    case "open_menu": {
      if (!item.target_menu_id) {
        await sendMainMenu(supabase, to, session);
        return;
      }

      const target = await getMenuById(supabase, item.target_menu_id);
      if (!target) {
        await sendMainMenu(supabase, to, session);
        return;
      }

      await sendMenu(supabase, to, target, session);
      return;
    }

    case "open_track": {
      const value = cleanText(item.action_value);
      const track = value === "current" ? cleanText(session?.current_track) : value;

      if (!track) {
        await sendMenuByKey(supabase, to, "tracks_menu", session);
        return;
      }

      await showTrackCourses(supabase, to, track);
      return;
    }

    case "show_answer": {
      let answer: AnyRow | null = null;

      if (item.answer_id) {
        answer = await getAnswerById(supabase, item.answer_id);
      } else if (cleanText(item.action_value)) {
        answer = await getAnswerByKey(supabase, cleanText(item.action_value));
      }

      if (answer?.message_text) {
        await sendText(to, answer.message_text);
      } else {
        await sendText(to, "المعلومة غير متاحة حاليًا.");
      }

      await sendMainMenu(supabase, to, await getSession(supabase, to));
      return;
    }

    case "open_course": {
      const courseId = item.course_id || cleanText(item.action_value);
      if (!courseId) {
        await sendMainMenu(supabase, to, session);
        return;
      }

      await openCourse(supabase, to, courseId);
      return;
    }

    case "show_details": {
      if (!session) {
        await sendMainMenu(supabase, to, session);
        return;
      }
      await showCourseDetails(supabase, to, session);
      return;
    }

    case "show_price": {
      const currency = cleanText(item.action_value);
      if (!session || !currency) {
        await sendMainMenu(supabase, to, session);
        return;
      }

      await showCoursePrice(supabase, to, session, currency);
      return;
    }

    case "open_url": {
      if (!session) {
        await sendMainMenu(supabase, to, session);
        return;
      }

      await sendCourseUrl(supabase, to, session, item);
      return;
    }

    case "subscribe": {
      await enterHumanMode(supabase, to, settings, "human_support");
      return;
    }

    case "human_support": {
      const answerKey =
        cleanText(item.item_key).includes("other") ||
        cleanText(item.action_value).toLowerCase() === "other"
          ? "other_currency"
          : "human_support";

      await enterHumanMode(supabase, to, settings, answerKey);
      return;
    }

    case "main_menu": {
      await sendMainMenu(supabase, to, session);
      return;
    }

    default: {
      await sendMainMenu(supabase, to, session);
    }
  }
}

async function handleReplyId(
  supabase: SupabaseClient,
  to: string,
  replyId: string,
  settings: AnyRow | null,
) {
  if (replyId.startsWith("menuitem:")) {
    await handleMenuItem(
      supabase,
      to,
      replyId.slice("menuitem:".length),
      settings,
    );
    return;
  }

  if (replyId.startsWith("course:")) {
    await openCourse(supabase, to, replyId.slice("course:".length));
    return;
  }

  await sendMainMenu(supabase, to, await getSession(supabase, to));
}

/* =========================================================
   Incoming webhook parsing
========================================================= */

function getIncomingMessages(body: AnyRow) {
  const output: AnyRow[] = [];

  for (const entry of body?.entry ?? []) {
    for (const change of entry?.changes ?? []) {
      if (change?.field !== "messages") continue;

      for (const message of change?.value?.messages ?? []) {
        output.push(message);
      }
    }
  }

  return output;
}

function getReplyId(message: AnyRow) {
  if (message?.type !== "interactive") return "";

  return cleanText(
    message?.interactive?.button_reply?.id ??
      message?.interactive?.list_reply?.id,
  );
}

async function handleIncomingMessage(
  supabase: SupabaseClient,
  message: AnyRow,
  settings: AnyRow | null,
) {
  const phone = cleanText(message?.from);
  if (!phone) return;

  let session = await getSession(supabase, phone);

  if (session?.mode === "human") {
    const until = session.human_mode_until
      ? new Date(session.human_mode_until).getTime()
      : 0;

    if (!until || until > Date.now()) {
      console.log(`Human mode active for ${phone}; bot stays silent.`);
      return;
    }

    await patchSession(supabase, phone, {
      mode: "bot",
      human_mode_until: null,
    });
    session = await getSession(supabase, phone);
  }

  if (!botIsEnabled(settings)) {
    console.log("WhatsApp bot is disabled; no automatic reply sent.");
    return;
  }

  const replyId = getReplyId(message);
  if (replyId) {
    await handleReplyId(supabase, phone, replyId, settings);
    return;
  }

  const isNewConversation = !session;

  if (!session) {
    await patchSession(supabase, phone, {
      mode: "bot",
      current_menu_key: "main_menu",
    });
    session = await getSession(supabase, phone);
  }

  const welcome = cleanText(settings?.welcome_message);
  const fallback = cleanText(settings?.fallback_message);

  if (isNewConversation && welcome) {
    await sendText(phone, welcome);
  } else if (!isNewConversation && fallback) {
    await sendText(phone, fallback);
  }

  // Requirement: any free text / image / voice / unknown input returns main menu.
  await sendMainMenu(supabase, phone, session);
}

/* =========================================================
   Optional Meta signature verification
========================================================= */

function verifyMetaSignature(rawBody: string, signature: string | null) {
  // During testing META_APP_SECRET may be unset. If set later, verification
  // becomes mandatory automatically.
  if (!META_APP_SECRET) return true;
  if (!signature?.startsWith("sha256=")) return false;

  const expected = createHmac("sha256", META_APP_SECRET)
    .update(rawBody)
    .digest("hex");

  const received = signature.slice("sha256=".length);

  if (expected.length !== received.length) return false;

  return timingSafeEqual(
    Buffer.from(expected, "utf8"),
    Buffer.from(received, "utf8"),
  );
}

/* =========================================================
   GET - Meta Webhook Verification
========================================================= */

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (!WHATSAPP_VERIFY_TOKEN) {
    console.error("WHATSAPP_VERIFY_TOKEN is missing.");
    return new NextResponse("Webhook verify token is not configured.", {
      status: 500,
    });
  }

  if (
    mode === "subscribe" &&
    token === WHATSAPP_VERIFY_TOKEN &&
    challenge
  ) {
    console.log("WhatsApp webhook verified successfully.");
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

/* =========================================================
   POST - Incoming WhatsApp events
========================================================= */

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();

    if (
      !verifyMetaSignature(
        rawBody,
        request.headers.get("x-hub-signature-256"),
      )
    ) {
      console.warn("Rejected WhatsApp webhook with invalid signature.");
      return new NextResponse("Invalid signature", { status: 401 });
    }

    const body = JSON.parse(rawBody || "{}");

    console.log(
      "WhatsApp webhook received:",
      JSON.stringify(body, null, 2),
    );

    // Status callbacks contain no incoming customer message. Acknowledge only.
    const messages = getIncomingMessages(body);
    if (!messages.length) {
      return NextResponse.json({ received: true });
    }

    const supabase = getSupabase();
    const settings = await getSettings(supabase);

    // Process sequentially so session state remains deterministic.
    for (const message of messages) {
      try {
        await handleIncomingMessage(supabase, message, settings);
      } catch (messageError) {
        console.error("Failed to process WhatsApp message:", messageError);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("WhatsApp webhook error:", error);

    // Return 200 so Meta does not repeatedly retry malformed/test payloads.
    return NextResponse.json({ received: true });
  }
}