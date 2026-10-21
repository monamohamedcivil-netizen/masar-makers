import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

/* =========================================================
   Website chat bot engine
   Reads exactly the same data as the WhatsApp bot
   (whatsapp_menus / whatsapp_menu_items / whatsapp_answers /
   whatsapp_courses / whatsapp_course_variants / whatsapp_course_prices),
   so editing answers in "WhatsApp Sales" updates both bots.
   Visitors only leave for WhatsApp to subscribe or reach support.
========================================================= */

type AnyRow = Record<string, any>;

export type ChatButton = { id: string; label: string; kind?: "action" | "link" | "handoff"; url?: string };
export type ChatMessage = { from: "bot" | "visitor"; text: string; buttons?: ChatButton[] };

export const WHATSAPP_NUMBER = "201031885659";
const MAX_BUTTONS = 12;

const clean = (v: unknown) => String(v ?? "").trim();
const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n.toLocaleString("en-US") : clean(v);
};

function isActiveOffer(price: AnyRow) {
  if (!price.offer_active) return false;
  const now = Date.now();
  const start = price.offer_start ? new Date(price.offer_start).getTime() : null;
  const end = price.offer_end ? new Date(price.offer_end).getTime() : null;
  if (start && now < start) return false;
  if (end && now > end) return false;
  return true;
}

function priceBlock(title: string, price: AnyRow) {
  const label = clean(price.currency_label) || clean(price.currency_code);
  const current = Number(price.current_price);
  const original = price.original_price == null || price.original_price === "" ? null : Number(price.original_price);
  if (isActiveOffer(price) && original != null && original > current) {
    return [`*${title}*`, `${num(current)} ${label}`, `بدلًا من ${num(original)} ${label}`, clean(price.offer_label) ? `🎁 ${clean(price.offer_label)}` : ""]
      .filter(Boolean)
      .join("\n");
  }
  return [`*${title}*`, `${num(original ?? current)} ${label}`].join("\n");
}

export class WebChatEngine {
  constructor(private db: SupabaseClient, private session: AnyRow) {}

  /* ---------- data ---------- */

  private async menu(key: string) {
    const { data } = await this.db.from("whatsapp_menus").select("*").eq("menu_key", key).eq("is_active", true).maybeSingle();
    return data as AnyRow | null;
  }

  private async items(menuId: string) {
    const { data } = await this.db
      .from("whatsapp_menu_items")
      .select("*")
      .eq("menu_id", menuId)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    return (data ?? []) as AnyRow[];
  }

  private async course(id: string | null | undefined) {
    if (!id) return null;
    const { data } = await this.db.from("whatsapp_courses").select("*").eq("id", id).eq("is_active", true).maybeSingle();
    return data as AnyRow | null;
  }

  private async variants(courseId: string) {
    const { data } = await this.db
      .from("whatsapp_course_variants")
      .select("*")
      .eq("course_id", courseId)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    return (data ?? []) as AnyRow[];
  }

  private async answer(item: AnyRow) {
    const query = this.db.from("whatsapp_answers").select("*").eq("is_active", true);
    const { data } = item.answer_id
      ? await query.eq("id", item.answer_id).maybeSingle()
      : await query.eq("answer_key", clean(item.action_value)).maybeSingle();
    return data as AnyRow | null;
  }

  private async setCourse(courseId: string | null) {
    this.session.current_course_id = courseId;
    await this.db.from("web_chat_sessions").update({ current_course_id: courseId, updated_at: new Date().toISOString() }).eq("id", this.session.id);
  }

  /* ---------- course matching from the page the visitor came from ---------- */

  async matchCourse(hint: string) {
    const h = clean(hint).toLowerCase();
    if (!h) return null;
    const aliases: [RegExp, string][] = [
      [/civil\s*site|\bcsd\b/, "csd"],
      [/vehicle|\bvt\b|تتبع/, "vehicle_tracking"],
      [/smart\s*project|deliverables|\bspd\b/, "spd"],
      [/\bbim\b/, "bim"],
      [/\bcube\b/, "cube"],
      [/civil\s*3d|\bc3d\b/, "civil 3d"],
    ];
    const key = aliases.find(([re]) => re.test(h))?.[1];
    const { data } = await this.db.from("whatsapp_courses").select("*").eq("is_active", true).eq("whatsapp_visible", true);
    const list = (data ?? []) as AnyRow[];
    return (
      list.find((c) => key && clean(c.course_key).toLowerCase() === key) ??
      list.find((c) => h.includes(clean(c.title).toLowerCase()) || h.includes(clean(c.whatsapp_label).toLowerCase())) ??
      null
    );
  }

  /* ---------- screens ---------- */

  async mainMenu(prefix = ""): Promise<ChatMessage[]> {
    const menu = await this.menu("main_menu");
    const items = menu ? await this.items(menu.id) : [];
    const text = [prefix, clean(menu?.body_text) || "اختر استفسارك من القائمة 👇"].filter(Boolean).join("\n\n");
    return [{ from: "bot", text, buttons: items.slice(0, MAX_BUTTONS).map((i) => ({ id: `menuitem:${i.id}`, label: clean(i.label) })) }];
  }

  async allCourses(): Promise<ChatMessage[]> {
    await this.setCourse(null);
    const { data } = await this.db
      .from("whatsapp_courses")
      .select("*")
      .eq("is_active", true)
      .eq("whatsapp_visible", true)
      .order("sort_order", { ascending: true });
    const courses = (data ?? []) as AnyRow[];
    if (!courses.length) return this.mainMenu("لا توجد كورسات متاحة حاليًا.");
    const titles: Record<string, string> = { "Road Design": "🛣️ مسار تصميم الطرق", "Traffic Engineering": "🚦 مسار هندسة المرور" };
    const tracks = [...new Set(courses.map((c) => clean(c.track) || "Other"))];
    const lines = tracks.map((t) => `*${titles[t] ?? t}*\n` + courses.filter((c) => (clean(c.track) || "Other") === t).map((c) => `• ${c.whatsapp_label || c.title} — ${clean(c.short_description)}`).join("\n"));
    return [
      {
        from: "bot",
        text: "📚 رحلات Masar Makers\nاختر الكورس اللي حابب تعرف عنه أكتر:\n\n" + lines.join("\n\n"),
        buttons: [
          ...courses.slice(0, MAX_BUTTONS - 1).map((c) => ({ id: `course:${c.id}`, label: clean(c.whatsapp_label || c.title) })),
          { id: "main", label: "↩️ القائمة الرئيسية" },
        ],
      },
    ];
  }

  private async courseActions(course: AnyRow, text: string): Promise<ChatMessage[]> {
    const menu = await this.menu("course_actions");
    const items = menu ? await this.items(menu.id) : [];
    const buttons: ChatButton[] = [];
    for (const i of items) {
      if (i.action_type === "open_url") {
        const url = await this.courseUrl(course, i);
        if (url) buttons.push({ id: `menuitem:${i.id}`, label: clean(i.label), kind: "link", url });
        continue;
      }
      if (i.action_type === "subscribe") {
        buttons.push({ id: `menuitem:${i.id}`, label: clean(i.label), kind: "handoff" });
        continue;
      }
      buttons.push({ id: `menuitem:${i.id}`, label: clean(i.label) });
    }
    return [{ from: "bot", text, buttons: buttons.slice(0, MAX_BUTTONS) }];
  }

  async openCourse(courseId: string, lead = ""): Promise<ChatMessage[]> {
    const course = await this.course(courseId);
    if (!course) return this.mainMenu("هذا الكورس غير متاح حاليًا.");
    await this.setCourse(course.id);
    const text = [lead, `📘 *${course.whatsapp_label || course.title}*`, clean(course.short_description), "ماذا تريد أن تعرف عن هذا الكورس؟"].filter(Boolean).join("\n\n");
    return this.courseActions(course, text);
  }

  private async details(): Promise<ChatMessage[]> {
    const course = await this.course(this.session.current_course_id);
    if (!course) return this.mainMenu();
    let text = `📘 *${course.whatsapp_label || course.title}*\n\n${clean(course.details) || clean(course.short_description)}`;
    if (course.has_variants) {
      for (const v of await this.variants(course.id)) {
        const d = clean(v.details) || clean(v.short_description);
        if (d) text += `\n\n━━━━━━━━━━━━\n*${v.title}*\n${d}`;
      }
    }
    return this.courseActions(course, text);
  }

  private async currencyMenu(): Promise<ChatMessage[]> {
    const menu = await this.menu("currency_menu");
    const items = menu ? await this.items(menu.id) : [];
    return [{ from: "bot", text: clean(menu?.body_text) || "اختر العملة:", buttons: items.map((i) => ({ id: `menuitem:${i.id}`, label: clean(i.label), kind: i.action_type === "human_support" ? "handoff" : "action" })) }];
  }

  private async price(currency: string): Promise<ChatMessage[]> {
    const course = await this.course(this.session.current_course_id);
    if (!course) return this.mainMenu();
    const code = currency.toUpperCase();
    let text = `💰 *أسعار ${course.whatsapp_label || course.title}*`;
    const base = () => this.db.from("whatsapp_course_prices").select("*").eq("course_id", course.id).eq("currency_code", code).eq("is_active", true).order("sort_order").limit(1);
    if (course.has_variants) {
      for (const v of await this.variants(course.id)) {
        const { data } = await base().eq("variant_id", v.id).maybeSingle();
        if (data) text += `\n\n${priceBlock(v.title, data)}`;
      }
    } else {
      const { data } = await base().is("variant_id", null).maybeSingle();
      if (data) text += `\n\n${priceBlock(course.title, data)}`;
    }
    if (!text.includes("\n\n")) {
      const menu = await this.currencyMenu();
      menu[0].text = "هذا السعر غير متاح بهذه العملة حاليًا. اختر عملة أخرى أو تواصل مع خدمة العملاء.";
      return menu;
    }
    return this.courseActions(course, text);
  }

  private async courseUrl(course: AnyRow, item: AnyRow) {
    const value = clean(item.action_value);
    let url = clean(item.url) || (/^https?:\/\//.test(value) ? value : "");
    if (!url && value === "intro_video") url = clean(course.intro_video_url);
    if (!url && value === "course_url") url = clean(course.course_url);
    if (!url && course.has_variants) {
      const field = value === "course_url" ? "course_url" : "intro_video_url";
      url = clean((await this.variants(course.id)).find((v) => clean(v[field]))?.[field]);
    }
    return url;
  }

  /* ---------- hand-off to WhatsApp ---------- */

  async handoff(reason: "subscribe" | "support" | "other_currency"): Promise<ChatMessage[]> {
    const course = await this.course(this.session.current_course_id);
    const ctx = (this.session.context ?? {}) as AnyRow;
    const intro =
      reason === "subscribe"
        ? `أرغب في الاشتراك${course ? ` في ${course.whatsapp_label || course.title}` : ""}.`
        : reason === "other_currency"
          ? `أرغب في معرفة سعر${course ? ` ${course.whatsapp_label || course.title}` : ""} بعملة أخرى.`
          : "أرغب في التحدث مع خدمة العملاء.";
    const body = clean(ctx.handoffText) || ["السلام عليكم،", intro].join("\n");
    const text = `${body}\n\n🔖 كود المحادثة: ${this.session.code}`;
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;

    await this.db
      .from("web_chat_sessions")
      .update({ handoff_reason: reason, handed_off_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", this.session.id);

    const lead =
      reason === "subscribe"
        ? "ممتاز! 🎉 لإكمال الاشتراك والدفع هنحوّلك لفريقنا على واتساب، والرسالة جاهزة بكل التفاصيل."
        : "هنحوّلك لخدمة العملاء على واتساب، والرسالة جاهزة بكل التفاصيل.";
    return [
      {
        from: "bot",
        text: `${lead}\nاضغط الزر وأرسل الرسالة كما هي 👇`,
        buttons: [
          { id: "whatsapp", label: "💬 المتابعة على واتساب", kind: "link", url },
          { id: "main", label: "↩️ القائمة الرئيسية" },
        ],
      },
    ];
  }

  /* ---------- dispatcher ---------- */

  async act(actionId: string): Promise<ChatMessage[]> {
    if (actionId === "main") return this.mainMenu();
    if (actionId === "courses") return this.allCourses();
    if (actionId.startsWith("course:")) return this.openCourse(actionId.slice(7));
    if (actionId === "handoff:subscribe") return this.handoff("subscribe");
    if (actionId === "handoff:support") return this.handoff("support");
    if (!actionId.startsWith("menuitem:")) return this.mainMenu();

    const { data: item } = await this.db.from("whatsapp_menu_items").select("*").eq("id", actionId.slice(9)).eq("is_active", true).maybeSingle();
    if (!item) return this.mainMenu();

    switch (item.action_type) {
      case "open_track":
        return this.allCourses();
      case "open_menu": {
        if (clean(item.item_key) === "main_courses") return this.allCourses();
        const { data: target } = item.target_menu_id
          ? await this.db.from("whatsapp_menus").select("menu_key").eq("id", item.target_menu_id).maybeSingle()
          : { data: null };
        if (target?.menu_key === "currency_menu") return this.currencyMenu();
        return this.mainMenu();
      }
      case "show_answer": {
        const answer = await this.answer(item);
        return this.mainMenu(clean(answer?.message_text) || "المعلومة غير متاحة حاليًا.");
      }
      case "open_course":
        return this.openCourse(clean(item.action_value) || "");
      case "show_details":
        return this.details();
      case "show_price":
        return this.price(clean(item.action_value) || "SAR");
      case "subscribe":
        return this.handoff("subscribe");
      case "human_support":
        return this.handoff(clean(item.action_value).toUpperCase() === "OTHER" || clean(item.item_key).includes("other") ? "other_currency" : "support");
      case "main_menu":
      default:
        return this.mainMenu();
    }
  }
}
