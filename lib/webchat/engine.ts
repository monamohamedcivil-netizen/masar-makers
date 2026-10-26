import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { egpFromSar, isEgyptResident } from "@/lib/pricing/student-currency";
import { findChatCourse, isOneDayJourneyType } from "@/lib/webchat/courses";
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
/** Chat opened from a one-day journey button: prices come from whatsapp_oneday_prices (kept in session.context.oneDay). */
type OneDay = { courseId: string; lessonId: string | null };
type Stage = "fundamental" | "advanced" | "integrated";
type Owned = { professional: boolean; stages: Set<Stage>; lessons: Set<string> };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

/** Riyal price shown in pounds (not living in Egypt): × exchange rate, rounded to the nearest 50. */
function converted(price: ShownPrice, factor: number): ShownPrice {
  if (factor === 1) return price;
  return {
    ...price,
    amount: egpFromSar(price.amount, factor),
    original: price.original == null ? null : egpFromSar(price.original, factor),
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

  private egyptLocalCache: boolean | null = null;

  /**
   * Egyptian-pound list prices are only for students living in Egypt (country Egypt and a
   * phone that is not clearly foreign — see lib/pricing/student-currency.ts). Anyone else who
   * chooses the pound sees the riyal price × the SAR exchange rate (finance_exchange_rates).
   */
  private async egyptLocal(): Promise<boolean> {
    if (this.egyptLocalCache !== null) return this.egyptLocalCache;
    let local = false;
    if (this.viewer.userId) {
      const { data } = await this.db.from("profiles").select("country,phone").eq("id", this.viewer.userId).maybeSingle();
      local = isEgyptResident(data?.country, data?.phone);
    }
    this.egyptLocalCache = local;
    return local;
  }

  /** Which price rows to read for the shown currency, and the factor to apply to them. */
  private async priceSource(code: string): Promise<{ code: string; factor: number }> {
    if (code !== "EGP" || (await this.egyptLocal())) return { code, factor: 1 };
    const { data } = await this.db.from("finance_exchange_rates").select("rate_to_egp").eq("currency", "SAR").maybeSingle();
    const rate = Number(data?.rate_to_egp);
    if (!Number.isFinite(rate) || rate <= 0) return { code, factor: 1 };
    return { code: "SAR", factor: rate };
  }

  /** One-day journey chat — only while the visitor stays on the course the button was for. */
  private get oneDay(): OneDay | null {
    const od = (this.session.context?.oneDay ?? null) as OneDay | null;
    return od && String(od.courseId) === String(this.session.current_course_id) ? od : null;
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
    if (!clean(hint)) return null;
    const { data } = await this.db.from("whatsapp_courses").select("*").eq("is_active", true).eq("whatsapp_visible", true);
    return findChatCourse((data ?? []) as AnyRow[], hint);
  }

  /* ---------- first message of a chat (depends on the button) ---------- */

  async opening(entryKey: string, context: AnyRow): Promise<ChatMessage[]> {
    // Announcement bar button: the reply written on that announcement, then the main menu.
    if (entryKey === "announcement") {
      let reply = "";
      if (context.announcementId) {
        const { data } = await this.db
          .from("platform_announcements")
          .select("chat_reply,chat_reply_en")
          .eq("id", String(context.announcementId))
          .maybeSingle();
        reply = this.f(data, "chat_reply");
      }
      return this.mainMenu(reply || (await this.entryText("contact")));
    }

    const course = context.courseHint ? await this.matchCourse(String(context.courseHint)) : null;
    const welcome = fill(await this.entryText(entryKey), {
      action: clean(context.actionLabel) || clean(context.courseHint) || this.t("طلبك", "your request"),
      course: course ? clean(course.whatsapp_label || course.title) : clean(context.courseHint),
    });

    if (course && (entryKey === "enrollment" || entryKey === "course_action" || entryKey === "ad")) {
      await this.setCourse(course.id);
      if (isOneDayJourneyType(context.journeyType) || /اليوم الواحد|one[\s-]?day/i.test(clean(context.journeyLabel))) {
        const oneDay: OneDay = { courseId: String(course.id), lessonId: await this.oneDayLesson(course.id, context) };
        await this.patchSession({ context: { ...(this.session.context ?? {}), oneDay } });
      }
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

  /*
   * What the student already has in this course (the platform button there is no longer
   * «اشترك» but «ابدأ / شاهد»), so the chat never shows him a price for it:
   * - one-day: the lectures he subscribed to (other lectures keep their price);
   * - professional: Fundamentals / Advanced / Integrated he has (Integrated = all of them).
   * Pending / rejected / expired requests don't count (the subscribe button is still active).
   */
  private ownedCache = new Map<string, Owned>();

  private async owned(course: AnyRow): Promise<Owned> {
    const empty: Owned = { professional: false, stages: new Set(), lessons: new Set() };
    const userId = this.viewer.userId;
    if (!userId || !course?.id) return empty;
    const key = String(course.id);
    const cached = this.ownedCache.get(key);
    if (cached) return cached;

    const result: Owned = { professional: false, stages: new Set(), lessons: new Set() };
    const { data: rows } = await this.db
      .from("enrollments")
      .select("course_id,journey_type,action_key,status")
      .eq("user_id", userId)
      .in("status", ["active", "completed", "suspended"]);
    const list = (rows ?? []) as AnyRow[];
    const courseIds = [...new Set(list.map((r) => String(r.course_id)))];
    if (courseIds.length) {
      const { data: courses } = await this.db.from("courses").select("id,title,course_code").in("id", courseIds);
      const matching = new Set(
        ((courses ?? []) as AnyRow[])
          .filter((c) => findChatCourse([course], `${clean(c.course_code)} ${clean(c.title)}`))
          .map((c) => String(c.id)),
      );
      for (const r of list) {
        if (!matching.has(String(r.course_id))) continue;
        const jt = clean(r.journey_type).toLowerCase();
        if (jt === "free") continue;
        if (jt === "workshop" || isOneDayJourneyType(jt)) {
          const lessonId = clean(r.action_key).match(/lesson:([0-9a-f-]{36})/i)?.[1];
          if (lessonId) result.lessons.add(lessonId.toLowerCase());
          continue;
        }
        result.professional = true;
        if (jt === "fundamental" || jt === "fundamentals") result.stages.add("fundamental");
        else if (jt === "advanced") result.stages.add("advanced");
        else ["fundamental", "advanced", "integrated"].forEach((st) => result.stages.add(st as Stage));
      }
      if (result.stages.has("fundamental") && result.stages.has("advanced")) result.stages.add("integrated");
    }
    this.ownedCache.set(key, result);
    return result;
  }

  /** Fundamentals / Advanced / Integrated of a chat variant (from its key or titles). */
  private variantStage(v: AnyRow): Stage | null {
    const text = [v.variant_key, v.title, v.title_en].map((x) => clean(x).toLowerCase()).join(" ");
    if (/integr|متكامل|full/.test(text)) return "integrated";
    if (/fund|أساس|اساس/.test(text)) return "fundamental";
    if (/adv|متقدم/.test(text)) return "advanced";
    return null;
  }

  private ownsVariant(v: AnyRow, owned: Owned) {
    const stage = this.variantStage(v);
    return stage ? owned.stages.has(stage) : false;
  }

  /** Nothing left to buy in the professional journey of this course. */
  private async ownsAllProfessional(course: AnyRow, owned: Owned) {
    if (!owned.professional) return false;
    if (!course.has_variants) return true;
    const variants = await this.variants(course.id);
    return variants.length > 0 && variants.every((v) => this.ownsVariant(v, owned));
  }

  /** Price is hidden for what the student already has (current one-day lecture, or the whole professional journey). */
  private async priceHidden(course: AnyRow): Promise<boolean> {
    const owned = await this.owned(course);
    const oneDay = this.oneDay;
    if (oneDay) return Boolean(oneDay.lessonId && owned.lessons.has(oneDay.lessonId.toLowerCase()));
    return this.ownsAllProfessional(course, owned);
  }

  private async alreadyEnrolled(course: AnyRow, lead = ""): Promise<ChatMessage[]> {
    const lecture = Boolean(this.oneDay?.lessonId);
    const text = [
      lead,
      lecture
        ? this.t(
            "✅ أنت مشترك بالفعل في هذه المحاضرة، لذلك لا يظهر سعرها هنا.\nلأي استفسار عن اشتراكك اختر «خدمة العملاء».",
            "✅ You're already subscribed to this lecture, so its price isn't shown here.\nFor any question about your subscription, choose “Customer service”.",
          )
        : this.t(
            "✅ أنت مشترك بالفعل في هذه الرحلة، لذلك لا تظهر أسعارها هنا.\nلأي استفسار عن اشتراكك اختر «خدمة العملاء».",
            "✅ You're already subscribed to this journey, so its prices aren't shown here.\nFor any question about your subscription, choose “Customer service”.",
          ),
    ]
      .filter(Boolean)
      .join("\n\n");
    return this.courseActions(course, text);
  }

  private async courseActions(course: AnyRow, text: string): Promise<ChatMessage[]> {
    const menu = await this.menu("course_actions");
    const items = menu ? await this.items(menu.id) : [];
    const buttons: ChatButton[] = [];
    const hidePrice = await this.priceHidden(course);
    for (const i of items) {
      if (hidePrice && (clean(i.item_key) === "course_price" || i.action_type === "show_price")) continue;
      if (i.action_type === "open_url") {
        const url = await this.courseUrl(course, i);
        // «شرح محاور الرحلة» and «المحاضرة الأولى» open as a pop-up video over the page; other links open normally.
        const popup = ["outline_video", "intro_video"].includes(clean(i.action_value));
        if (url) buttons.push({ id: `menuitem:${i.id}`, label: this.f(i, "label"), kind: popup ? "video" : "link", url });
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
    {
      const current = await this.course(this.session.current_course_id);
      if (current && (await this.priceHidden(current))) return this.alreadyEnrolled(current);
    }
    if (this.currency) return this.price(this.currency);
    const menu = await this.menu("currency_menu");
    const items = menu ? await this.items(menu.id) : [];

    // Only currencies that are switched on for this course (add USD in the price editor → it appears here).
    // One-day journey → the currencies of the one-day prices.
    const courseId = this.session.current_course_id;
    let pricesQuery = this.db.from(this.oneDay ? "whatsapp_oneday_prices" : "whatsapp_course_prices").select("currency_code,sort_order").eq("is_active", true);
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

  /** The lecture a one-day button was for: its id from the button, or its title among the lectures with a special price. */
  private async oneDayLesson(courseId: string, context: AnyRow): Promise<string | null> {
    const id = clean(context.lessonId);
    if (UUID.test(id)) return id;
    const title = clean(context.actionLabel);
    if (!title) return null;
    const { data: specials } = await this.db.from("whatsapp_oneday_prices").select("lesson_id").eq("course_id", courseId).not("lesson_id", "is", null);
    const ids = [...new Set(((specials ?? []) as AnyRow[]).map((r) => String(r.lesson_id)))];
    if (!ids.length) return null;
    const { data: lessons } = await this.db.from("lessons").select("id,title,title_ar").in("id", ids);
    const t = title.toLowerCase();
    const hit = ((lessons ?? []) as AnyRow[]).find((l) => [l.title_ar, l.title].some((v) => clean(v) && clean(v).toLowerCase() === t));
    return hit ? String(hit.id) : null;
  }

  /** Lecture names in the visitor's language (Arabic title first in Arabic, English title first in English). */
  private async lessonTitles(ids: string[]) {
    const out = new Map<string, AnyRow>();
    if (!ids.length) return out;
    const { data } = await this.db.from("lessons").select("id,title,title_ar").in("id", ids);
    for (const l of (data ?? []) as AnyRow[]) {
      out.set(String(l.id), { id: l.id, title: clean(l.title_ar) || clean(l.title), title_en: clean(l.title) || clean(l.title_ar) });
    }
    return out;
  }

  /** One-day journey prices: the lecture's special price, else the course's general one-day price. */
  private async oneDayPrice(oneDay: OneDay, course: AnyRow, code: string, lead = ""): Promise<ChatMessage[]> {
    let label = await this.currencyLabel(code);
    const source = await this.priceSource(code);
    const { data } = await this.db
      .from("whatsapp_oneday_prices")
      .select("*")
      .eq("course_id", course.id)
      .eq("currency_code", source.code)
      .eq("is_active", true)
      .order("sort_order");
    const all = (data ?? []) as AnyRow[];
    if (label === code && !this.en && source.code === code) label = clean(all[0]?.currency_label) || label;
    const general = all.find((r) => !r.lesson_id) ?? null;
    const specials = all.filter((r) => r.lesson_id);
    const titles = await this.lessonTitles([...new Set([...specials.map((r) => String(r.lesson_id)), ...(oneDay.lessonId ? [oneDay.lessonId] : [])])]);
    const generalTitle = { id: "general", title: "سعر المحاضرة الواحدة", title_en: "Price per lecture" };

    const rows: ShownPrice[] = [];
    if (oneDay.lessonId) {
      // The lecture the visitor chose: its special price, or the course's general price.
      const special = specials.find((r) => String(r.lesson_id) === oneDay.lessonId);
      const lesson = titles.get(oneDay.lessonId) ?? generalTitle;
      if (special) rows.push(shown(special, lesson, this.en));
      else if (general) rows.push(shown(general, lesson, this.en));
    } else {
      if (general) rows.push(shown(general, generalTitle, this.en));
      const ownedLessons = (await this.owned(course)).lessons;
      for (const r of specials) {
        if (ownedLessons.has(String(r.lesson_id).toLowerCase())) continue;
        const lesson = titles.get(String(r.lesson_id));
        if (lesson) rows.push(shown(r, lesson, this.en));
      }
    }

    if (source.factor !== 1) rows.splice(0, rows.length, ...rows.map((r) => converted(r, source.factor)));
    const title = clean(course.whatsapp_label || course.title);
    if (!rows.length) {
      return this.courseActions(course, [lead, this.t(`سعر رحلة اليوم الواحد بعملة (${label}) غير متاح حاليًا لهذا الكورس. اختار «خدمة العملاء» وهنبلغك بالسعر.`, `The one-day journey price in (${label}) isn't available for this course right now. Choose “Customer service” and we'll let you know the price.`)].filter(Boolean).join("\n\n"));
    }
    await this.lockCurrency(code);
    const last: LastPrice = { course: title, courseId: String(course.id), currency: code, currencyLabel: label, rows };
    await this.patchSession({ last_price: last });
    const text = [
      lead,
      this.t(`💰 *أسعار رحلة اليوم الواحد — ${title}* (${label})`, `💰 *${title} — one-day journey prices* (${label})`),
      ...rows.map((r) => priceLines(r.variant ?? title, r, label, this.en)),
    ]
      .filter(Boolean)
      .join("\n\n");
    return this.courseActions(course, text);
  }

  private async price(requested: string, lead = ""): Promise<ChatMessage[]> {
    if (!this.isMember) return this.membersOnly();
    const course = await this.course(this.session.current_course_id);
    if (!course) return this.mainMenu();
    if (await this.priceHidden(course)) return this.alreadyEnrolled(course, lead);
    const owned = await this.owned(course);
    const code = (this.currency || requested).toUpperCase(); // locked currency always wins
    const oneDay = this.oneDay;
    if (oneDay) return this.oneDayPrice(oneDay, course, code, lead);
    const label = await this.currencyLabel(code);
    const rows: ShownPrice[] = [];
    const source = await this.priceSource(code);
    const base = () => this.db.from("whatsapp_course_prices").select("*").eq("course_id", course.id).eq("currency_code", source.code).eq("is_active", true).order("sort_order").limit(1);
    if (course.has_variants) {
      for (const v of await this.variants(course.id)) {
        if (this.ownsVariant(v, owned)) continue; // already has it → no price for it
        const { data } = await base().eq("variant_id", v.id).maybeSingle();
        if (data) rows.push(shown(data, v, this.en));
      }
    } else {
      const { data } = await base().is("variant_id", null).maybeSingle();
      if (data) rows.push(shown(data, null, this.en));
    }
    if (source.factor !== 1) rows.splice(0, rows.length, ...rows.map((r) => converted(r, source.factor)));
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
    if (!url && value === "outline_video") url = clean(course.outline_video_url);
    if (!url && course.has_variants && (value === "intro_video" || value === "course_url")) {
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
    if (await this.priceHidden(course)) return this.alreadyEnrolled(course);
    await this.startFollowup();
    // A one-day lecture has no subscription type (Fundamentals / Advanced / Integrated are for the professional journey).
    if (course.has_variants && !this.session.variant_id && !this.oneDay) {
      const owned = await this.owned(course);
      const variants = (await this.variants(course.id)).filter((v) => !this.ownsVariant(v, owned));
      if (variants.length === 1) await this.patchSession({ variant_id: variants[0].id });
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
