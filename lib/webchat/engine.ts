import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { notifyWebChatAdmins } from "@/lib/webchat/notify";

/* =========================================================
   Website chat bot engine (platform chat — WhatsApp is only for Mona)
   - Reads the same menus / answers / courses / prices as the WhatsApp bot
     (edit them once in "WhatsApp Sales").
   - Every platform button opens the chat with a welcome + the answer to that button.
   - Choices only (no free typing). Free questions → "خدمة العملاء" → WhatsApp with a summary.
   - Menu items marked web_visibility = 'members' answer registered students only.
   - The first currency a student picks is locked on the student (admin can change it).
   - Opening a course starts the follow-up (every N days, max M, then auto-close).
========================================================= */

type AnyRow = Record<string, any>;

export type Locale = "ar" | "en";
export type ChatButton = { id: string; label: string; kind?: "action" | "link" | "handoff" | "video"; url?: string; sameTab?: boolean };
export type ChatMessage = {
  from: "bot" | "visitor";
  text: string;
  buttons?: ChatButton[];
  /** Video to pop up as soon as this reply arrives (also reachable from its "video" button). */
  autoVideo?: string;
};

export type Viewer = {
  userId: string | null;
  contact: AnyRow | null; // web_chat_contacts row
};

type ShownPrice = { variant: string | null; variantId: string | null; amount: number; original: number | null; offer: string | null };
type LastPrice = { course: string; courseId: string; currency: string; currencyLabel: string; rows: ShownPrice[] };

export const WHATSAPP_NUMBER = "201031885659";
const MAX_BUTTONS = 12;

const clean = (v: unknown) => String(v ?? "").trim();
const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n.toLocaleString("en-US") : clean(v);
};
const fill = (template: string, values: Record<string, string>) =>
  template.replace(/\{(\w+)\}/g, (_, k: string) => values[k] ?? "");

function isActiveOffer(price: AnyRow) {
  if (!price.offer_active) return false;
  const now = Date.now();
  const start = price.offer_start ? new Date(price.offer_start).getTime() : null;
  const end = price.offer_end ? new Date(price.offer_end).getTime() : null;
  if (start && now < start) return false;
  if (end && now > end) return false;
  return true;
}

function shown(price: AnyRow, variant: AnyRow | null, en = false): ShownPrice {
  const current = Number(price.current_price);
  const original = price.original_price == null || price.original_price === "" ? null : Number(price.original_price);
  const offer = isActiveOffer(price) && original != null && original > current;
  return {
    variant: variant ? (en && clean(variant.title_en) ? clean(variant.title_en) : clean(variant.title)) : null,
    variantId: variant ? String(variant.id) : null,
    amount: offer ? current : original ?? current,
    original: offer ? original : null,
    offer: offer ? (en ? clean(price.offer_label_en) || (clean(price.offer_label) ? "Special offer" : "") : clean(price.offer_label)) || null : null,
  };
}

const CURRENCY_EN: Record<string, string> = { SAR: "Saudi riyal", EGP: "Egyptian pound", USD: "US dollar" };
const CURRENCY_FLAG: Record<string, string> = { SAR: "🇸🇦", EGP: "🇪🇬", USD: "🇺🇸" };

function priceLines(title: string, p: ShownPrice, label: string, en = false) {
  if (p.original != null) {
    return [`*${title}*`, `${num(p.amount)} ${label}`, `${en ? "instead of" : "بدلًا من"} ${num(p.original)} ${label}`, p.offer ? `🎁 ${p.offer}` : ""].filter(Boolean).join("\n");
  }
  return [`*${title}*`, `${num(p.amount)} ${label}`].join("\n");
}

export class WebChatEngine {
  constructor(
    private db: SupabaseClient,
    private session: AnyRow,
    private viewer: Viewer,
    private locale: Locale = "ar",
  ) {}

  private get en() {
    return this.locale === "en";
  }

  /** Arabic or English text. */
  private t(ar: string, en: string) {
    return this.en ? en : ar;
  }

  /** Row field in the visitor's language (falls back to the Arabic text when no English is saved). */
  private f(row: AnyRow | null | undefined, field: string) {
    if (!row) return "";
    if (this.en) {
      const value = clean(row[`${field}_en`]);
      if (value) return value;
    }
    return clean(row[field]);
  }

  private get isMember() {
    return Boolean(this.viewer.userId);
  }

  private get currency(): string | null {
    return clean(this.viewer.contact?.currency).toUpperCase() || null;
  }

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

  async entryText(key: string) {
    const { data } = await this.db.from("web_chat_entry_points").select("*").eq("entry_key", key).maybeSingle();
    return data?.is_active === false ? "" : this.f(data, "welcome_text");
  }

  private async currencyLabel(code: string) {
    if (this.en && CURRENCY_EN[code]) return CURRENCY_EN[code];
    const { data } = await this.db.from("whatsapp_course_prices").select("currency_label").eq("currency_code", code).limit(1).maybeSingle();
    return clean(data?.currency_label) || code;
  }

  private async patchSession(patch: AnyRow) {
    Object.assign(this.session, patch);
    await this.db.from("web_chat_sessions").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", this.session.id);
  }

  private async followupSettings() {
    const { data } = await this.db.from("web_chat_settings").select("followup_every_days").eq("id", 1).maybeSingle();
    return Math.max(1, Number(data?.followup_every_days ?? 3));
  }

  /** Opening a course (or asking to subscribe) starts the follow-up. */
  private async startFollowup() {
    if (this.session.followup_status !== "none") return;
    const days = await this.followupSettings();
    await this.patchSession({
      followup_status: "active",
      followup_count: 0,
      followup_next_at: new Date(Date.now() + days * 86400000).toISOString(),
    });
  }

  private async setCourse(courseId: string | null) {
    await this.patchSession({ current_course_id: courseId, ...(courseId !== this.session.current_course_id ? { variant_id: null } : {}) });
    if (courseId) await this.startFollowup();
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

  /* ---------- first message of a chat (depends on the button) ---------- */

  async opening(entryKey: string, context: AnyRow): Promise<ChatMessage[]> {
    const welcome = fill(await this.entryText(entryKey), {
      action: clean(context.actionLabel) || clean(context.courseHint) || this.t("طلبك", "your request"),
      course: clean(context.courseHint),
    });
    const course = context.courseHint ? await this.matchCourse(String(context.courseHint)) : null;

    if (course && (entryKey === "enrollment" || entryKey === "course_action")) {
      await this.setCourse(course.id);
      // Enrollment button: answer = the price right away (members only; enrollment needs login anyway).
      if (entryKey === "enrollment" && this.isMember) {
        if (this.currency) return this.price(this.currency, welcome);
        const ask = await this.currencyStep();
        ask[0].text = [welcome, `📘 *${course.whatsapp_label || course.title}*`, ask[0].text].filter(Boolean).join("\n\n");
        return ask;
      }
      return this.openCourse(course.id, welcome);
    }
    return this.mainMenu(welcome);
  }

  /* ---------- screens ---------- */

  async mainMenu(prefix = "", extra: ChatButton[] = [], autoVideo?: string): Promise<ChatMessage[]> {
    const menu = await this.menu("main_menu");
    const items = menu ? await this.items(menu.id) : [];
    const text = [prefix, this.f(menu, "body_text") || this.t("اختر استفسارك من القائمة 👇", "Choose your question from the menu 👇")].filter(Boolean).join("\n\n");
    return [{ from: "bot", text, buttons: [...extra, ...items.slice(0, MAX_BUTTONS).map((i) => this.itemButton(i))], ...(autoVideo ? { autoVideo } : {}) }];
  }

  private itemButton(i: AnyRow): ChatButton {
    const locked = i.web_visibility === "members" && !this.isMember;
    const handoff = i.action_type === "subscribe" || i.action_type === "human_support";
    return { id: `menuitem:${i.id}`, label: `${this.f(i, "label")}${locked ? " 🔒" : ""}`, kind: handoff && !locked ? "handoff" : "action" };
  }

  async allCourses(): Promise<ChatMessage[]> {
    const { data } = await this.db
      .from("whatsapp_courses")
      .select("*")
      .eq("is_active", true)
      .eq("whatsapp_visible", true)
      .order("sort_order", { ascending: true });
    const courses = (data ?? []) as AnyRow[];
    if (!courses.length) return this.mainMenu(this.t("لا توجد كورسات متاحة حاليًا.", "No courses are available right now."));
    const titles: Record<string, string> = this.en
      ? { "Road Design": "🛣️ Road Design track", "Traffic Engineering": "🚦 Traffic Engineering track" }
      : { "Road Design": "🛣️ مسار تصميم الطرق", "Traffic Engineering": "🚦 مسار هندسة المرور" };
    const tracks = [...new Set(courses.map((c) => clean(c.track) || "Other"))];
    const lines = tracks.map((t) => `*${titles[t] ?? t}*\n` + courses.filter((c) => (clean(c.track) || "Other") === t).map((c) => `• ${c.whatsapp_label || c.title} — ${this.f(c, "short_description")}`).join("\n"));
    return [
      {
        from: "bot",
        text: this.t("📚 رحلات Masar Makers\nاختر الكورس اللي حابب تعرف عنه أكتر:\n\n", "📚 Masar Makers journeys\nChoose the course you'd like to know more about:\n\n") + lines.join("\n\n"),
        buttons: [
          ...courses.slice(0, MAX_BUTTONS - 1).map((c) => ({ id: `course:${c.id}`, label: clean(c.whatsapp_label || c.title) })),
          { id: "main", label: this.t("↩️ القائمة الرئيسية", "↩️ Main menu") },
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
        if (url) buttons.push({ id: `menuitem:${i.id}`, label: this.f(i, "label"), kind: "link", url });
        continue;
      }
      const b = this.itemButton(i);
      // Price button with a locked currency: say which currency.
      if (clean(i.item_key) === "course_price" && this.isMember && this.currency) b.label = `${this.f(i, "label")} (${await this.currencyLabel(this.currency)})`;
      buttons.push(b);
    }
    return [{ from: "bot", text, buttons: buttons.slice(0, MAX_BUTTONS) }];
  }

  async openCourse(courseId: string, lead = ""): Promise<ChatMessage[]> {
    const course = await this.course(courseId);
    if (!course) return this.mainMenu(this.t("هذا الكورس غير متاح حاليًا.", "This course isn't available right now."));
    await this.setCourse(course.id);
    const text = [lead, `📘 *${course.whatsapp_label || course.title}*`, this.f(course, "short_description"), this.t("ماذا تريد أن تعرف عن هذا الكورس؟", "What would you like to know about this course?")].filter(Boolean).join("\n\n");
    return this.courseActions(course, text);
  }

  private async details(): Promise<ChatMessage[]> {
    const course = await this.course(this.session.current_course_id);
    if (!course) return this.mainMenu();
    let text = `📘 *${course.whatsapp_label || course.title}*\n\n${this.f(course, "details") || this.f(course, "short_description")}`;
    if (course.has_variants) {
      for (const v of await this.variants(course.id)) {
        const d = this.f(v, "details") || this.f(v, "short_description");
        if (d) text += `\n\n━━━━━━━━━━━━\n*${this.f(v, "title")}*\n${d}`;
      }
    }
    return this.courseActions(course, text);
  }

  /** Visitor pressed a members-only question. */
  async membersOnly(): Promise<ChatMessage[]> {
    const text = (await this.entryText("members_only")) || this.t("🔒 هذه المعلومة متاحة للمسجّلين على المنصة فقط. سجّل حسابك مجانًا وارجع هنا 👇", "🔒 This information is available to registered members only. Create your free account and come back here 👇");
    const page = clean(this.session.context?.page) || "/";
    const next = `${page}${page.includes("?") ? "&" : "?"}chat=${this.session.id}`;
    return [
      {
        from: "bot",
        text,
        buttons: [
          { id: "nav:register", label: this.t("📝 إنشاء حساب مجاني", "📝 Create a free account"), kind: "link", url: "/register", sameTab: true },
          { id: "nav:login", label: this.t("🔑 لدي حساب — تسجيل الدخول", "🔑 I have an account — log in"), kind: "link", url: `/login?next=${encodeURIComponent(next)}`, sameTab: true },
          { id: "main", label: this.t("↩️ القائمة الرئيسية", "↩️ Main menu") },
        ],
      },
    ];
  }

  /** Currency question — shown only until the student picks one. */
  private async currencyStep(): Promise<ChatMessage[]> {
    if (!this.isMember) return this.membersOnly();
    if (this.currency) return this.price(this.currency);
    const menu = await this.menu("currency_menu");
    const items = menu ? await this.items(menu.id) : [];

    // Only currencies that are switched on for this course (add USD in the price editor → it appears here).
    const courseId = this.session.current_course_id;
    let pricesQuery = this.db.from("whatsapp_course_prices").select("currency_code,sort_order").eq("is_active", true);
    if (courseId) pricesQuery = pricesQuery.eq("course_id", courseId);
    const { data: priceRows } = await pricesQuery.order("sort_order", { ascending: true });
    const enabled: string[] = [];
    for (const r of (priceRows ?? []) as AnyRow[]) {
      const code = clean(r.currency_code).toUpperCase();
      if (code && !enabled.includes(code)) enabled.push(code);
    }

    const buttons: ChatButton[] = [];
    const other: ChatButton[] = [];
    for (const i of items) {
      const code = clean(i.action_value).toUpperCase();
      if (i.action_type === "show_price" && code) {
        if (enabled.includes(code)) buttons.push(this.itemButton(i));
        continue;
      }
      other.push(this.itemButton(i)); // "other currency" → customer service
    }
    for (const code of enabled) {
      if (items.some((i) => i.action_type === "show_price" && clean(i.action_value).toUpperCase() === code)) continue;
      const name = await this.currencyLabel(code);
      buttons.push({ id: `price:${code}`, label: `${CURRENCY_FLAG[code] ?? "💱"} ${name}` });
    }

    return [
      {
        from: "bot",
        text: `${this.f(menu, "body_text") || this.t("اختر العملة:", "Choose the currency:")}\n\n${this.t("ℹ️ هتتثبت العملة دي لكل الأسعار اللي هتظهرلك بعد كده.", "ℹ️ This currency will be used for all the prices you see from now on.")}`,
        buttons: [...buttons, ...other],
      },
    ];
  }

  private async lockCurrency(code: string) {
    if (this.currency || !this.viewer.contact?.id) return;
    const now = new Date().toISOString();
    await this.db
      .from("web_chat_contacts")
      .update({ currency: code, currency_set_at: now, currency_set_by: "student", updated_at: now })
      .eq("id", this.viewer.contact.id)
      .is("currency", null);
    this.viewer.contact = { ...this.viewer.contact, currency: code };
  }

  private async price(requested: string, lead = ""): Promise<ChatMessage[]> {
    if (!this.isMember) return this.membersOnly();
    const course = await this.course(this.session.current_course_id);
    if (!course) return this.mainMenu();
    const code = (this.currency || requested).toUpperCase(); // locked currency always wins
    const label = await this.currencyLabel(code);
    const rows: ShownPrice[] = [];
    const base = () => this.db.from("whatsapp_course_prices").select("*").eq("course_id", course.id).eq("currency_code", code).eq("is_active", true).order("sort_order").limit(1);
    if (course.has_variants) {
      for (const v of await this.variants(course.id)) {
        const { data } = await base().eq("variant_id", v.id).maybeSingle();
        if (data) rows.push(shown(data, v, this.en));
      }
    } else {
      const { data } = await base().is("variant_id", null).maybeSingle();
      if (data) rows.push(shown(data, null, this.en));
    }
    const title = clean(course.whatsapp_label || course.title);
    if (!rows.length) {
      return this.courseActions(course, [lead, this.t(`السعر بعملة (${label}) غير متاح حاليًا لهذا الكورس. اختار «خدمة العملاء» وهنبلغك بالسعر.`, `The price in (${label}) isn't available for this course right now. Choose “Customer service” and we'll let you know the price.`)].filter(Boolean).join("\n\n"));
    }
    await this.lockCurrency(code);
    const last: LastPrice = { course: title, courseId: String(course.id), currency: code, currencyLabel: label, rows };
    await this.patchSession({ last_price: last });
    const text = [lead, this.t(`💰 *أسعار ${title}* (${label})`, `💰 *${title} prices* (${label})`), ...rows.map((r) => priceLines(r.variant ?? title, r, label, this.en))].filter(Boolean).join("\n\n");
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

  /* ---------- subscribe ---------- */

  private async subscribe(): Promise<ChatMessage[]> {
    if (!this.isMember) return this.membersOnly();
    const course = await this.course(this.session.current_course_id);
    if (!course) return this.allCourses();
    await this.startFollowup();
    if (course.has_variants && !this.session.variant_id) {
      const variants = await this.variants(course.id);
      if (variants.length > 1) {
        return [
          {
            from: "bot",
            text: this.t(`🧩 اختار نوع الاشتراك في *${course.whatsapp_label || course.title}*:`, `🧩 Choose your subscription type for *${course.whatsapp_label || course.title}*:`),
            buttons: [...variants.map((v) => ({ id: `variant:${v.id}`, label: this.f(v, "title") })), { id: `course:${course.id}`, label: this.t("↩️ رجوع للكورس", "↩️ Back to the course") }],
          },
        ];
      }
    }
    return this.handoff("subscribe");
  }

  /* ---------- hand-off to WhatsApp (with a summary of the chat) ---------- */

  private async summary(reason: "subscribe" | "support" | "other_currency") {
    const ctx = (this.session.context ?? {}) as AnyRow;
    const course = await this.course(this.session.current_course_id);
    const courseTitle = course ? clean(course.whatsapp_label || course.title) : "";
    const last = (this.session.last_price ?? null) as LastPrice | null;
    const priceKnown = last && course && last.courseId === String(course.id) ? last : null;
    const variant = this.session.variant_id && course ? (await this.variants(course.id)).find((v) => String(v.id) === String(this.session.variant_id)) : null;
    const shownRows = priceKnown ? (variant ? priceKnown.rows.filter((r) => r.variantId === String(variant.id)) : priceKnown.rows) : [];

    let profile: AnyRow | null = null;
    if (this.viewer.userId) {
      const { data } = await this.db.from("profiles").select("full_name,email,phone,country").eq("id", this.viewer.userId).maybeSingle();
      profile = data;
    }

    const intro =
      reason === "subscribe"
        ? `أرغب في الاشتراك${courseTitle ? ` في ${courseTitle}` : ""}.`
        : reason === "other_currency"
          ? `أرغب في معرفة السعر${courseTitle ? ` لـ ${courseTitle}` : ""} بعملة أخرى.`
          : "عندي استفسار وأرغب في التحدث مع خدمة العملاء.";

    const currencyLabel = priceKnown?.currencyLabel || (this.currency ? await this.currencyLabel(this.currency) : "");
    const lines = [
      "السلام عليكم،",
      intro,
      "",
      courseTitle ? `📚 الكورس: ${courseTitle}` : "",
      variant ? `🧩 نوع الاشتراك: ${clean(variant.title)}` : "",
      clean(ctx.journeyLabel) ? `🛣️ الرحلة: ${clean(ctx.journeyLabel)}` : "",
      clean(ctx.actionLabel) ? `📌 الطلب: ${clean(ctx.actionLabel)}` : "",
      currencyLabel ? `💱 العملة: ${currencyLabel}` : "",
      ...shownRows.map(
        (r) =>
          `💰 السعر الظاهر${r.variant && !variant ? ` (${r.variant})` : ""}: ${num(r.amount)} ${priceKnown!.currencyLabel}${r.original != null ? ` بدلًا من ${num(r.original)}` : ""}${r.offer ? ` — ${r.offer}` : ""}`,
      ),
      clean(ctx.requestNumber) ? `🔖 رقم الطلب: ${clean(ctx.requestNumber)}` : "",
      "",
      profile?.full_name ? `👤 الاسم: ${clean(profile.full_name)}` : "",
      profile?.email ? `📧 البريد: ${clean(profile.email)}` : "",
      profile?.country ? `🌍 الدولة: ${clean(profile.country)}` : "",
      `🔖 كود المحادثة: ${this.session.code}`,
    ];
    return lines.filter((l, i, all) => l !== "" || (all[i - 1] !== "" && i > 0)).join("\n").trim();
  }

  async handoff(reason: "subscribe" | "support" | "other_currency"): Promise<ChatMessage[]> {
    const text = await this.summary(reason);
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
    const alreadyNotified = this.session.handoff_reason === reason;
    await this.patchSession({ handoff_reason: reason, handed_off_at: new Date().toISOString() });

    // Notify Mona once per reason: the student is moving to WhatsApp (summary in the body).
    if (!alreadyNotified) {
      const who = text.match(/👤 الاسم: (.+)/)?.[1] ?? "زائر غير مسجّل";
      const title = reason === "subscribe" ? `🟢 طلب اشتراك — ${who}` : reason === "other_currency" ? `🌍 سعر بعملة أخرى — ${who}` : `🆘 خدمة العملاء — ${who}`;
      const body = text
        .split("\n")
        .filter((l) => /^(📚|🧩|💱|💰|🔖 رقم)/.test(l))
        .join(" • ");
      await notifyWebChatAdmins(this.db, { title, body: `${body || "بدون تفاصيل"} • ${this.session.code}`, sessionId: String(this.session.id), tag: `handoff-${this.session.id}` });
    }

    const lead =
      reason === "subscribe"
        ? this.t("ممتاز! 🎉 لإكمال الاشتراك والدفع هنحوّلك لفريقنا على واتساب، والرسالة جاهزة بملخص طلبك.", "Great! 🎉 To complete your subscription and payment we'll move you to our team on WhatsApp — the message is ready with a summary of your request.")
        : this.t("هنحوّلك لخدمة العملاء على واتساب، والرسالة جاهزة بملخص طلبك.", "We'll move you to customer service on WhatsApp — the message is ready with a summary of your request.");
    return [
      {
        from: "bot",
        text: `${lead}\n${this.t("اضغط الزر وأرسل الرسالة كما هي 👇", "Press the button and send the message as it is 👇")}`,
        buttons: [
          { id: "whatsapp", label: this.t("💬 المتابعة على واتساب", "💬 Continue on WhatsApp"), kind: "link", url },
          { id: "main", label: this.t("↩️ القائمة الرئيسية", "↩️ Main menu") },
        ],
      },
    ];
  }

  /* ---------- dispatcher ---------- */

  async act(actionId: string): Promise<ChatMessage[]> {
    if (actionId === "main") return this.mainMenu();
    if (actionId === "courses") return this.allCourses();
    if (actionId.startsWith("course:")) return this.openCourse(actionId.slice(7));
    if (actionId === "handoff:subscribe") return this.subscribe();
    if (actionId === "handoff:support") return this.handoff("support");
    if (/^price:[A-Za-z]{3}$/.test(actionId)) return this.price(actionId.slice(6));
    if (actionId.startsWith("variant:")) {
      if (!this.isMember) return this.membersOnly();
      await this.patchSession({ variant_id: actionId.slice(8) });
      return this.handoff("subscribe");
    }
    if (!actionId.startsWith("menuitem:")) return this.mainMenu();

    const { data: item } = await this.db.from("whatsapp_menu_items").select("*").eq("id", actionId.slice(9)).eq("is_active", true).maybeSingle();
    if (!item) return this.mainMenu();
    if (item.web_visibility === "members" && !this.isMember) return this.membersOnly();

    switch (item.action_type) {
      case "open_track":
        return this.allCourses();
      case "open_menu": {
        if (clean(item.item_key) === "main_courses") return this.allCourses();
        const { data: target } = item.target_menu_id
          ? await this.db.from("whatsapp_menus").select("menu_key").eq("id", item.target_menu_id).maybeSingle()
          : { data: null };
        if (target?.menu_key === "currency_menu" || clean(item.item_key) === "course_price") return this.currencyStep();
        return this.mainMenu();
      }
      case "show_answer": {
        const answer = await this.answer(item);
        const video = clean(answer?.video_url);
        // A video answer ("Explore the platform") pops the video up right away; the button replays it.
        return this.mainMenu(
          this.f(answer, "message_text") || this.t("المعلومة غير متاحة حاليًا.", "This information isn't available right now."),
          video ? [{ id: `video:${answer!.id}`, label: this.t("▶️ شاهد الفيديو", "▶️ Watch the video"), kind: "video", url: video }] : [],
          video || undefined,
        );
      }
      case "open_course":
        return this.openCourse(clean(item.action_value) || "");
      case "show_details":
        return this.details();
      case "show_price":
        return this.price(clean(item.action_value) || "SAR");
      case "subscribe":
        return this.subscribe();
      case "human_support":
        return this.handoff(clean(item.action_value).toUpperCase() === "OTHER" || clean(item.item_key).includes("other") ? "other_currency" : "support");
      case "main_menu":
      default:
        return this.mainMenu();
    }
  }
}
