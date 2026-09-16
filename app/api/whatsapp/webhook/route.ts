import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* =========================================================
   Environment
========================================================= */

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
const SUPABASE_SECRET = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
const WHATSAPP_ACCESS_TOKEN = (process.env.WHATSAPP_ACCESS_TOKEN ?? "").trim();
const WHATSAPP_PHONE_NUMBER_ID = (process.env.WHATSAPP_PHONE_NUMBER_ID ?? "").trim();
const WHATSAPP_GRAPH_VERSION_RAW = (
  process.env.WHATSAPP_GRAPH_VERSION ?? ""
).trim();
const WHATSAPP_VERIFY_TOKEN = (process.env.WHATSAPP_VERIFY_TOKEN ?? "").trim();
const META_APP_SECRET = (process.env.META_APP_SECRET ?? "").trim();

function normalizeGraphVersion(value: string) {
  const match = value.match(/v?\d+\.\d+/i);
  if (!match) return "";
  return match[0].toLowerCase().startsWith("v")
    ? match[0]
    : `v${match[0]}`;
}

const WHATSAPP_GRAPH_VERSION = normalizeGraphVersion(
  WHATSAPP_GRAPH_VERSION_RAW,
);

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
    settings?.human_mode_hour ??
      settings?.human_mode_hours ??
      settings?.human_support_hours ??
      24,
  );

  return Number.isFinite(value) && value > 0 ? value : 24;
}

function getUnknownMessageBehavior(settings: AnyRow | null) {
  return (
    cleanText(settings?.unknown_message_behavior).toLowerCase() ||
    "main_menu"
  );
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
      "Missing or invalid WhatsApp environment configuration: WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_GRAPH_VERSION.",
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
    JSON.stringify({
      contacts: data?.contacts ?? null,
      messages: data?.messages ?? null,
    }),
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


async function sendSectionedList({
  to,
  body,
  header,
  footer,
  buttonText,
  sections,
}: {
  to: string;
  body: string;
  header?: string | null;
  footer?: string | null;
  buttonText?: string | null;
  sections: Array<{
    title: string;
    rows: Array<{
      id: string;
      title: string;
      description?: string | null;
    }>;
  }>;
}) {
  let remaining = 10;

  const limitedSections = sections
    .map((section) => {
      if (remaining <= 0) return null;

      const rows = section.rows.slice(0, remaining);
      remaining -= rows.length;

      if (!rows.length) return null;

      return {
        title: cut(section.title, 24),
        rows: rows.map((row) => ({
          id: row.id,
          title: cut(row.title, 24),
          ...(cleanText(row.description)
            ? { description: cut(row.description, 72) }
            : {}),
        })),
      };
    })
    .filter(
      (
        section,
      ): section is {
        title: string;
        rows: Array<{
          id: string;
          title: string;
          description?: string;
        }>;
      } => Boolean(section),
    );

  if (!limitedSections.length) {
    await sendText(to, "لا توجد خيارات متاحة حاليًا.");
    return;
  }

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
        button: cut(buttonText || "عرض الكورسات", 20),
        sections: limitedSections,
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
  bodyPrefix = "",
  bodyOverride = "",
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

  const defaultBody = renderTemplate(
    cleanText(menu.body_text) || "اختر من الخيارات التالية:",
    values,
  );

  const body =
    cleanText(bodyOverride) ||
    [cleanText(bodyPrefix), defaultBody]
      .filter(Boolean)
      .join("\n\n");

  const header = renderTemplate(
    cleanText(menu.header_text),
    values,
  );

  const footer = renderTemplate(
    cleanText(menu.footer_text),
    values,
  );

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
      buttonText:
        menu.open_button_text ||
        "عرض الخيارات",
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
  bodyPrefix = "",
  bodyOverride = "",
) {
  const menu = await getMenuByKey(
    supabase,
    menuKey,
  );

  if (!menu) {
    await sendText(
      to,
      "القائمة غير متاحة حاليًا.",
    );
    return;
  }

  await sendMenu(
    supabase,
    to,
    menu,
    session,
    extraValues,
    bodyPrefix,
    bodyOverride,
  );
}

async function sendMainMenu(
  supabase: SupabaseClient,
  to: string,
  session?: SessionRow | null,
  greetingText = "",
) {
  await patchSession(supabase, to, {
    mode: "bot",
    current_menu_key: "main_menu",
    current_course_id: null,
    current_variant_id: null,
    current_track: null,
    human_mode_until: null,
  });

  const latest = await getSession(
    supabase,
    to,
  );

  await sendMenuByKey(
    supabase,
    to,
    "main_menu",
    latest ?? session,
    {},
    greetingText,
  );
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

async function showAllCourses(
  supabase: SupabaseClient,
  to: string,
) {
  const { data, error } = await supabase
    .from("whatsapp_courses")
    .select("*")
    .eq("is_active", true)
    .eq("whatsapp_visible", true)
    .order("sort_order", {
      ascending: true,
    });

  if (error) throw error;

  const courses = (data ?? []) as AnyRow[];

  await patchSession(supabase, to, {
    mode: "bot",
    current_track: null,
    current_course_id: null,
    current_variant_id: null,
    current_menu_key:
      "dynamic_all_courses",
  });

  if (!courses.length) {
    await sendText(
      to,
      "لا توجد كورسات متاحة حاليًا.",
    );

    await sendMainMenu(
      supabase,
      to,
      await getSession(supabase, to),
    );

    return;
  }

  const preferredTracks = [
    "Road Design",
    "Traffic Engineering",
  ];

  const trackTitles: Record<
    string,
    string
  > = {
    "Road Design":
      "🛣️ مسار تصميم الطرق",
    "Traffic Engineering":
      "🚦 مسار هندسة المرور",
  };

  const grouped = new Map<
    string,
    AnyRow[]
  >();

  for (const course of courses) {
    const track =
      cleanText(course.track) ||
      "Other";

    const group =
      grouped.get(track) ?? [];

    group.push(course);
    grouped.set(track, group);
  }

  for (const group of grouped.values()) {
    group.sort(
      (a, b) =>
        Number(a.sort_order ?? 0) -
        Number(b.sort_order ?? 0),
    );
  }

  const trackOrder = [
    ...preferredTracks.filter((track) =>
      grouped.has(track),
    ),
    ...Array.from(grouped.keys())
      .filter(
        (track) =>
          !preferredTracks.includes(
            track,
          ),
      )
      .sort((a, b) =>
        a.localeCompare(b),
      ),
  ];

  const sections = trackOrder.map(
    (track) => ({
      title:
        trackTitles[track] || track,
      rows: (
        grouped.get(track) ?? []
      ).map((course) => ({
        id: `course:${course.id}`,
        title:
          course.whatsapp_label ||
          course.title,
        description:
          course.short_description,
      })),
    }),
  );

  type CourseSection =
    (typeof sections)[number];

  const pages: CourseSection[][] = [];
  let currentPage: CourseSection[] = [];
  let usedRows = 0;

  for (const section of sections) {
    let remainingRows = [
      ...section.rows,
    ];

    let continued = false;

    while (remainingRows.length) {
      const room =
        10 - usedRows;

      if (room === 0) {
        pages.push(currentPage);
        currentPage = [];
        usedRows = 0;
        continue;
      }

      const take =
        remainingRows.slice(0, room);

      remainingRows =
        remainingRows.slice(room);

      currentPage.push({
        title: continued
          ? `${section.title} - تابع`
          : section.title,
        rows: take,
      });

      usedRows += take.length;
      continued = true;

      if (usedRows === 10) {
        pages.push(currentPage);
        currentPage = [];
        usedRows = 0;
      }
    }
  }

  if (currentPage.length) {
    pages.push(currentPage);
  }

  for (
    let index = 0;
    index < pages.length;
    index += 1
  ) {
    const suffix =
      pages.length > 1
        ? ` (${index + 1}/${pages.length})`
        : "";

    await sendSectionedList({
      to,
      header:
        "رحلات Masar Makers",
      body:
        `اختر الكورس الذي تريد استكشافه${suffix}:`,
      buttonText:
        "عرض الكورسات",
      sections: pages[index],
    });
  }
}

async function openCourse(
  supabase: SupabaseClient,
  to: string,
  courseId: string,
) {
  const course = await getCourse(
    supabase,
    courseId,
  );

  if (!course) {
    await sendText(
      to,
      "هذا الكورس غير متاح حاليًا.",
    );

    await sendMainMenu(
      supabase,
      to,
      await getSession(supabase, to),
    );

    return;
  }

  await patchSession(supabase, to, {
    mode: "bot",
    current_course_id: course.id,
    current_variant_id: null,
    current_track:
      course.track ?? null,
    current_menu_key:
      "course_actions",
  });

  const session = await getSession(
    supabase,
    to,
  );

  const summary = [
    `📘 *${
      course.whatsapp_label ||
      course.title
    }*`,
    cleanText(
      course.short_description,
    ),
  ]
    .filter(Boolean)
    .join("\n\n");

  await sendMenuByKey(
    supabase,
    to,
    "course_actions",
    session,
    {
      course:
        course.whatsapp_label ||
        course.title,
      track:
        course.track ?? "",
    },
    summary,
  );
}

async function sendCourseActionsWithContent(
  supabase: SupabaseClient,
  to: string,
  session: SessionRow,
  course: AnyRow,
  content: string,
) {
  const chunks = splitLongText(
    content,
    980,
  );

  if (!chunks.length) {
    await openCourse(
      supabase,
      to,
      course.id,
    );
    return;
  }

  for (
    let index = 0;
    index < chunks.length - 1;
    index += 1
  ) {
    await sendText(
      to,
      chunks[index],
    );
  }

  const latest = await getSession(
    supabase,
    to,
  );

  await sendMenuByKey(
    supabase,
    to,
    "course_actions",
    latest ?? session,
    {
      course:
        course.whatsapp_label ||
        course.title,
      track:
        course.track ?? "",
    },
    "",
    chunks[chunks.length - 1],
  );
}

async function showCourseDetails(
  supabase: SupabaseClient,
  to: string,
  session: SessionRow,
) {
  if (!session.current_course_id) {
    await sendMainMenu(
      supabase,
      to,
      session,
    );
    return;
  }

  const course = await getCourse(
    supabase,
    session.current_course_id,
  );

  if (!course) {
    await sendMainMenu(
      supabase,
      to,
      session,
    );
    return;
  }

  let message =
    `📘 *${
      course.whatsapp_label ||
      course.title
    }*`;

  const parentIntro =
    cleanText(course.details) ||
    cleanText(
      course.short_description,
    );

  if (parentIntro) {
    message +=
      `\n\n${parentIntro}`;
  }

  if (course.has_variants) {
    const variants =
      await getActiveVariants(
        supabase,
        course.id,
      );

    for (const variant of variants) {
      const details =
        cleanText(variant.details) ||
        cleanText(
          variant.short_description,
        );

      if (!details) continue;

      message +=
        `\n\n━━━━━━━━━━━━\n*${variant.title}*\n${details}`;
    }
  }

  await sendCourseActionsWithContent(
    supabase,
    to,
    session,
    course,
    message,
  );
}

async function showCoursePrice(
  supabase: SupabaseClient,
  to: string,
  session: SessionRow,
  currencyCode: string,
) {
  if (!session.current_course_id) {
    await sendMainMenu(
      supabase,
      to,
      session,
    );
    return;
  }

  const course = await getCourse(
    supabase,
    session.current_course_id,
  );

  if (!course) {
    await sendMainMenu(
      supabase,
      to,
      session,
    );
    return;
  }

  const currency =
    currencyCode.toUpperCase();

  let message =
    `💰 *أسعار ${
      course.whatsapp_label ||
      course.title
    }*`;

  if (course.has_variants) {
    const variants =
      await getActiveVariants(
        supabase,
        course.id,
      );

    for (const variant of variants) {
      const { data, error } =
        await supabase
          .from(
            "whatsapp_course_prices",
          )
          .select("*")
          .eq(
            "course_id",
            course.id,
          )
          .eq(
            "variant_id",
            variant.id,
          )
          .eq(
            "currency_code",
            currency,
          )
          .eq(
            "is_active",
            true,
          )
          .order("sort_order", {
            ascending: true,
          })
          .limit(1)
          .maybeSingle();

      if (error) throw error;
      if (!data) continue;

      message +=
        `\n\n${formatPriceBlock(
          variant.title,
          data as AnyRow,
        )}`;
    }
  } else {
    const { data, error } =
      await supabase
        .from(
          "whatsapp_course_prices",
        )
        .select("*")
        .eq(
          "course_id",
          course.id,
        )
        .is(
          "variant_id",
          null,
        )
        .eq(
          "currency_code",
          currency,
        )
        .eq(
          "is_active",
          true,
        )
        .order("sort_order", {
          ascending: true,
        })
        .limit(1)
        .maybeSingle();

    if (error) throw error;

    if (data) {
      message +=
        `\n\n${formatPriceBlock(
          course.title,
          data as AnyRow,
        )}`;
    }
  }

  if (!message.includes("\n\n")) {
    await sendText(
      to,
      "هذا السعر غير متاح بهذه العملة حاليًا. يمكنك اختيار عملة أخرى أو التواصل مع خدمة العملاء.",
    );

    await sendMenuByKey(
      supabase,
      to,
      "currency_menu",
      session,
      {
        course: course.title,
      },
    );

    return;
  }

  await sendCourseActionsWithContent(
    supabase,
    to,
    session,
    course,
    message,
  );
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
    await sendMainMenu(
      supabase,
      to,
      session,
    );
    return;
  }

  const course = await getCourse(
    supabase,
    session.current_course_id,
  );

  if (!course) {
    await sendMainMenu(
      supabase,
      to,
      session,
    );
    return;
  }

  const actionValue =
    cleanText(item.action_value);

  let url =
    cleanText(item.url);

  if (
    !url &&
    isHttpUrl(actionValue)
  ) {
    url = actionValue;
  }

  if (
    !url &&
    actionValue === "intro_video"
  ) {
    url = cleanText(
      course.intro_video_url,
    );
  }

  if (
    !url &&
    actionValue === "course_url"
  ) {
    url = cleanText(
      course.course_url,
    );
  }

  if (
    !url &&
    course.has_variants
  ) {
    const variants =
      await getActiveVariants(
        supabase,
        course.id,
      );

    const field =
      actionValue === "course_url"
        ? "course_url"
        : "intro_video_url";

    const first =
      variants.find((variant) =>
        cleanText(
          variant[field],
        ),
      );

    if (first) {
      url = cleanText(
        first[field],
      );
    }
  }

  const content = url
    ? `${cleanText(item.label) || "الرابط"}\n${url}`
    : "الرابط غير متاح حاليًا.";

  await sendCourseActionsWithContent(
    supabase,
    to,
    session,
    course,
    content,
  );
}


async function notifyAdminsOfHumanSupport(
  supabase: SupabaseClient,
  phone: string,
  reason:
    | "human_support"
    | "other_currency"
    | "subscribe",
) {
  try {
    const {
      data: admins,
      error: adminsError,
    } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "admin");

    if (adminsError) {
      throw adminsError;
    }

    if (!admins?.length) {
      console.warn(
        "No admin profiles found for WhatsApp support notification.",
      );
      return;
    }

    const reasonText =
      reason === "other_currency"
        ? "يحتاج مساعدة بعملة أخرى"
        : reason === "subscribe"
          ? "يرغب في الاشتراك"
          : "طلب التحدث مع خدمة العملاء";

    const {
      data: notification,
      error: notificationError,
    } = await supabase
      .from("notifications")
      .insert({
        title:
          "طلب خدمة عملاء من WhatsApp",
        body:
          `العميل ${phone} ${reasonText}.`,
        type:
          "admin_whatsapp_human_support",
        action_url:
          "/admin/whatsapp-sales",
      })
      .select("id")
      .single();

    if (
      notificationError ||
      !notification
    ) {
      throw (
        notificationError ??
        new Error(
          "Could not create WhatsApp admin notification.",
        )
      );
    }

    const recipients =
      admins.map((admin) => ({
        notification_id:
          notification.id,
        user_id:
          admin.id,
        is_read:
          false,
        read_at:
          null,
      }));

    const {
      error: recipientsError,
    } = await supabase
      .from(
        "notification_recipients",
      )
      .insert(recipients);

    if (recipientsError) {
      throw recipientsError;
    }

    console.log(
      `WhatsApp admin notification created for ${phone}.`,
    );
  } catch (error) {
    // Never block Human Mode because an internal
    // dashboard notification failed.
    console.error(
      "Could not create WhatsApp admin notification:",
      error,
    );
  }
}

async function enterHumanMode(
  supabase: SupabaseClient,
  to: string,
  settings: AnyRow | null,
  answerKey = "human_support",
  reason:
    | "human_support"
    | "other_currency"
    | "subscribe" =
      "human_support",
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
    current_menu_key: "human_support",
    human_mode_until: until,
  });

  await notifyAdminsOfHumanSupport(
    supabase,
    to,
    reason,
  );
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
  const item = await getMenuItem(
    supabase,
    itemId,
  );

  if (!item) {
    await sendMainMenu(
      supabase,
      to,
      await getSession(
        supabase,
        to,
      ),
    );
    return;
  }

  let session = await getSession(
    supabase,
    to,
  );

  if (!session) {
    await patchSession(
      supabase,
      to,
      { mode: "bot" },
    );

    session = await getSession(
      supabase,
      to,
    );
  }

  switch (item.action_type) {
    case "open_menu": {
      if (
        cleanText(item.item_key) ===
        "main_courses"
      ) {
        await showAllCourses(
          supabase,
          to,
        );
        return;
      }

      if (!item.target_menu_id) {
        await sendMainMenu(
          supabase,
          to,
          session,
        );
        return;
      }

      const target =
        await getMenuById(
          supabase,
          item.target_menu_id,
        );

      if (!target) {
        await sendMainMenu(
          supabase,
          to,
          session,
        );
        return;
      }

      await sendMenu(
        supabase,
        to,
        target,
        session,
      );

      return;
    }

    case "open_track": {
      const value =
        cleanText(
          item.action_value,
        );

      if (
        value === "all" ||
        cleanText(item.item_key) ===
          "course_back"
      ) {
        await showAllCourses(
          supabase,
          to,
        );
        return;
      }

      const track =
        value === "current"
          ? cleanText(
              session?.current_track,
            )
          : value;

      if (!track) {
        await showAllCourses(
          supabase,
          to,
        );
        return;
      }

      await showTrackCourses(
        supabase,
        to,
        track,
      );

      return;
    }

    case "show_answer": {
      let answer:
        AnyRow | null = null;

      if (item.answer_id) {
        answer =
          await getAnswerById(
            supabase,
            item.answer_id,
          );
      } else if (
        cleanText(
          item.action_value,
        )
      ) {
        answer =
          await getAnswerByKey(
            supabase,
            cleanText(
              item.action_value,
            ),
          );
      }

      const answerText =
        cleanText(
          answer?.message_text,
        ) ||
        "المعلومة غير متاحة حاليًا.";

      const chunks =
        splitLongText(
          answerText,
          980,
        );

      for (
        let index = 0;
        index < chunks.length - 1;
        index += 1
      ) {
        await sendText(
          to,
          chunks[index],
        );
      }

      await sendMainMenu(
        supabase,
        to,
        await getSession(
          supabase,
          to,
        ),
        chunks[
          chunks.length - 1
        ] || answerText,
      );

      return;
    }

    case "open_course": {
      const courseId =
        item.course_id ||
        cleanText(
          item.action_value,
        );

      if (!courseId) {
        await sendMainMenu(
          supabase,
          to,
          session,
        );
        return;
      }

      await openCourse(
        supabase,
        to,
        courseId,
      );

      return;
    }

    case "show_details": {
      if (!session) {
        await sendMainMenu(
          supabase,
          to,
          session,
        );
        return;
      }

      await showCourseDetails(
        supabase,
        to,
        session,
      );

      return;
    }

    case "show_price": {
      const currency =
        cleanText(
          item.action_value,
        );

      if (
        !session ||
        !currency
      ) {
        await sendMainMenu(
          supabase,
          to,
          session,
        );
        return;
      }

      await showCoursePrice(
        supabase,
        to,
        session,
        currency,
      );

      return;
    }

    case "open_url": {
      if (!session) {
        await sendMainMenu(
          supabase,
          to,
          session,
        );
        return;
      }

      await sendCourseUrl(
        supabase,
        to,
        session,
        item,
      );

      return;
    }

    case "subscribe": {
      await enterHumanMode(
        supabase,
        to,
        settings,
        "human_support",
        "subscribe",
      );
      return;
    }

    case "human_support": {
      const answerKey =
        cleanText(
          item.item_key,
        ).includes("other") ||
        cleanText(
          item.action_value,
        ).toLowerCase() ===
          "other"
          ? "other_currency"
          : "human_support";

      await enterHumanMode(
        supabase,
        to,
        settings,
        answerKey,
        answerKey ===
          "other_currency"
          ? "other_currency"
          : "human_support",
      );

      return;
    }

    case "main_menu": {
      await sendMainMenu(
        supabase,
        to,
        session,
      );

      return;
    }

    default: {
      await sendMainMenu(
        supabase,
        to,
        session,
      );
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

function getStatusUpdates(body: AnyRow) {
  const output: AnyRow[] = [];

  for (const entry of body?.entry ?? []) {
    for (const change of entry?.changes ?? []) {
      if (change?.field !== "messages") continue;

      for (const status of change?.value?.statuses ?? []) {
        output.push(status);
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
  const phone =
    cleanText(message?.from);

  if (!phone) return;

  let session =
    await getSession(
      supabase,
      phone,
    );

  if (
    session?.mode === "human"
  ) {
    const until =
      session.human_mode_until
        ? new Date(
            session.human_mode_until,
          ).getTime()
        : 0;

    if (
      !until ||
      until > Date.now()
    ) {
      console.log(
        `Human mode active for ${phone}; bot stays silent.`,
      );
      return;
    }

    await patchSession(
      supabase,
      phone,
      {
        mode: "bot",
        current_menu_key:
          "main_menu",
        current_course_id:
          null,
        current_variant_id:
          null,
        current_track:
          null,
        human_mode_until:
          null,
      },
    );

    session =
      await getSession(
        supabase,
        phone,
      );
  }

  if (!botIsEnabled(settings)) {
    console.log(
      "WhatsApp bot is disabled; no automatic reply sent.",
    );
    return;
  }

  const replyId =
    getReplyId(message);

  if (replyId) {
    await handleReplyId(
      supabase,
      phone,
      replyId,
      settings,
    );
    return;
  }

  const isNewConversation =
    !session;

  if (!session) {
    await patchSession(
      supabase,
      phone,
      {
        mode: "bot",
        current_menu_key:
          "main_menu",
      },
    );

    session =
      await getSession(
        supabase,
        phone,
      );
  }

  const greeting =
    isNewConversation
      ? cleanText(
          settings?.greeting_text,
        )
      : "";

  const unknownBehavior =
    getUnknownMessageBehavior(
      settings,
    );

  if (
    unknownBehavior ===
    "human_support"
  ) {
    await enterHumanMode(
      supabase,
      phone,
      settings,
      "human_support",
      "human_support",
    );
    return;
  }

  if (
    unknownBehavior ===
    "silent"
  ) {
    return;
  }

  await sendMainMenu(
    supabase,
    phone,
    session,
    greeting,
  );
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
    .digest();

  const receivedHex = signature.slice("sha256=".length);

  if (!/^[a-f0-9]{64}$/i.test(receivedHex)) return false;

  const received = Buffer.from(receivedHex, "hex");

  if (expected.length !== received.length) return false;

  return timingSafeEqual(expected, received);
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

    const messages = getIncomingMessages(body);
    const statuses = getStatusUpdates(body);

    console.log(
      "WhatsApp webhook received:",
      JSON.stringify({
        incoming_messages: messages.map((message) => ({
          id: message?.id ?? null,
          from: message?.from ?? null,
          type: message?.type ?? null,
        })),
        statuses: statuses.map((status) => ({
          id: status?.id ?? null,
          status: status?.status ?? null,
          errors: status?.errors ?? null,
        })),
      }),
    );

    // Delivery/read/failed callbacks contain no incoming customer message.
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