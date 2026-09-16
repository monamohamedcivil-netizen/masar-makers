"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  BookOpen,
  Bot,
  ChevronDown,
  Headphones,
  ListTree,
  MessageCircleMore,
  Plus,
  Route,
  Settings2,
  Tags,
  TrafficCone,
  UserRoundCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import ActionForm, {
  ActionSubmitButton,
} from "./ActionForm";

import {
  createAnswer,
  createCourse,
  createCourseVariant,
  createMenu,
  createMenuItem,
  returnCustomerToBot,
  savePrice,
  toggleMenuItem,
  updateAnswer,
  updateBotSettings,
  updateCourse,
  updateCourseVariant,
  updateMenu,
  updateMenuItem,
} from "@/lib/actions/whatsapp-sales";

/* =====================================================
   Types
===================================================== */

type AdminTrack = "Road Design" | "Traffic Engineering";

type AdminTab =
  | "courses"
  | "prices"
  | "menus"
  | "support"
  | "settings";

type WhatsAppCourse = {
  id: string;
  course_key: string;
  title: string;
  whatsapp_label: string | null;
  track: string | null;
  short_description: string | null;
  details: string | null;
  intro_video_url: string | null;
  course_url: string | null;
  is_active: boolean;
  whatsapp_visible: boolean;
  sort_order: number;
  has_variants: boolean;
  variants_prompt: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type WhatsAppCourseVariant = {
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
  created_at?: string | null;
  updated_at?: string | null;
};

type WhatsAppCoursePrice = {
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

type WhatsAppAnswer = {
  id: string;
  answer_key: string;
  admin_name: string;
  message_text: string;
  is_active: boolean;
};

type WhatsAppMenu = {
  id: string;
  menu_key: string;
  admin_name: string;
  interaction_type: "list" | "buttons" | string;
  header_text: string | null;
  body_text: string | null;
  footer_text: string | null;
  open_button_text: string | null;
  sort_order: number;
  is_active: boolean;
};

type WhatsAppMenuItem = {
  id: string;
  menu_id: string;
  item_key: string | null;
  label: string;
  description: string | null;
  action_type: string;
  target_menu_id: string | null;
  answer_id: string | null;
  course_id: string | null;
  action_value: string | null;
  url: string | null;
  sort_order: number;
  is_active: boolean;
};

type WhatsAppBotSession = {
  phone: string;
  mode?: string | null;
  current_menu_key?: string | null;
  current_course_id?: string | null;
  current_variant_id?: string | null;
  current_track?: string | null;
  human_mode_until?: string | null;
  updated_at?: string | null;
};

type WhatsAppBotSettings = {
  id?: string | number | null;
  bot_enabled?: boolean | null;
  is_enabled?: boolean | null;

  greeting_text?: string | null;
  unknown_message_behavior?: string | null;
  human_mode_hours?: number | null;

  // Legacy fallbacks kept only so older data does not break the page.
  welcome_message?: string | null;
  fallback_message?: string | null;
  human_support_hours?: number | null;

  updated_at?: string | null;
  [key: string]: unknown;
};

type Props = {
  settings?: WhatsAppBotSettings | null;
  botSettings?: WhatsAppBotSettings | null;
  courses: WhatsAppCourse[];
  variants: WhatsAppCourseVariant[];
  prices: WhatsAppCoursePrice[];
  answers: WhatsAppAnswer[];
  menus: WhatsAppMenu[];
  menuItems?: WhatsAppMenuItem[];
  items?: WhatsAppMenuItem[];
  sessions: WhatsAppBotSession[];
};

/* =====================================================
   Shared styles
===================================================== */

const panel =
  "rounded-2xl border border-slate-200 bg-white shadow-sm";

const input =
  "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-[#07152E] outline-none transition placeholder:text-slate-400 focus:border-[#F7B548]";

const textarea =
  "min-h-24 w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold leading-6 text-[#07152E] outline-none transition placeholder:text-slate-400 focus:border-[#F7B548]";

const label =
  "mb-1.5 block text-[11px] font-black text-slate-500";

const compactSummary =
  "flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-2 transition hover:bg-slate-50";

const primaryButton =
  "h-10 rounded-xl bg-[#07152E] px-4 text-xs font-black text-white transition hover:bg-[#17345C]";

const goldButton =
  "h-10 rounded-xl bg-[#F7B548] px-4 text-xs font-black text-[#07152E] transition hover:bg-[#FFC968]";

/* =====================================================
   Helpers
===================================================== */

function belongsToTrack(
  value: string | null | undefined,
  track: AdminTrack,
) {
  const normalized = (value ?? "").trim().toLowerCase();

  if (track === "Road Design") {
    return (
      normalized === "road design" ||
      normalized === "roads" ||
      normalized === "road" ||
      normalized.includes("تصميم الطرق") ||
      normalized.includes("هندسة الطرق")
    );
  }

  return (
    normalized === "traffic engineering" ||
    normalized === "traffic" ||
    normalized.includes("هندسة المرور") ||
    normalized.includes("مرور")
  );
}

function trackArabic(track: AdminTrack) {
  return track === "Road Design"
    ? "مسار تصميم الطرق"
    : "مسار هندسة المرور";
}

function toLocalDateTime(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const local = new Date(
    date.getTime() - date.getTimezoneOffset() * 60_000,
  );

  return local.toISOString().slice(0, 16);
}

function getBotEnabled(settings: WhatsAppBotSettings | null) {
  if (!settings) return true;

  if (typeof settings.bot_enabled === "boolean") {
    return settings.bot_enabled;
  }

  if (typeof settings.is_enabled === "boolean") {
    return settings.is_enabled;
  }

  return true;
}

function getHumanHours(settings: WhatsAppBotSettings | null) {
  const value =
    settings?.human_mode_hours ??
    settings?.human_support_hours ??
    24;

  return Number(value) || 24;
}

function getUnknownMessageBehavior(
  settings: WhatsAppBotSettings | null,
) {
  const value =
    String(
      settings?.unknown_message_behavior ??
        "main_menu",
    )
      .trim()
      .toLowerCase();

  if (
    value === "human_support" ||
    value === "silent"
  ) {
    return value;
  }

  return "main_menu";
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("ar-SA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

/* =====================================================
   Main Manager
===================================================== */

export default function WhatsAppSalesManager(props: Props) {
  const [track, setTrack] =
    useState<AdminTrack>("Road Design");

  const [tab, setTab] =
    useState<AdminTab>("courses");

  const tabs = [
    ["courses", "الكورسات", BookOpen],
    ["prices", "الأسعار والعروض", Tags],
    ["menus", "القوائم والردود", ListTree],
    ["support", "خدمة العملاء", Headphones],
    ["settings", "الإعدادات", Settings2],
  ] as const;

  return (
    <div className="space-y-4">
      {/* Track level */}
      <section className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        <TrackButton
          active={track === "Road Design"}
          icon={TrafficCone}
          title="مسار تصميم الطرق"
          subtitle="Road Design"
          onClick={() => setTrack("Road Design")}
        />

        <TrackButton
          active={track === "Traffic Engineering"}
          icon={Route}
          title="مسار هندسة المرور"
          subtitle="Traffic Engineering"
          onClick={() => setTrack("Traffic Engineering")}
        />
      </section>

      {/* Admin tabs */}
      <section className="flex flex-wrap gap-1.5 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
        {tabs.map(([key, title, Icon]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={[
              "inline-flex h-9 items-center gap-2 rounded-xl px-3.5 text-xs font-black transition",
              tab === key
                ? "bg-[#F7B548] text-[#07152E]"
                : "text-slate-500 hover:bg-slate-100 hover:text-[#07152E]",
            ].join(" ")}
          >
            <Icon className="h-4 w-4" />
            {title}
          </button>
        ))}
      </section>

      {tab === "courses" && (
        <CoursesTab {...props} selectedTrack={track} />
      )}

      {tab === "prices" && (
        <PricesTab {...props} selectedTrack={track} />
      )}

      {tab === "menus" && (
        <MenusAnswersTab {...props} selectedTrack={track} />
      )}

      {tab === "support" && (
        <SupportTab {...props} selectedTrack={track} />
      )}

      {tab === "settings" && (
        <SettingsTab {...props} selectedTrack={track} />
      )}
    </div>
  );
}

function TrackButton({
  active,
  icon: Icon,
  title,
  subtitle,
  onClick,
}: {
  active: boolean;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex min-h-14 items-center justify-center gap-3 rounded-xl px-4 text-right transition",
        active
          ? "bg-[#07152E] text-white shadow-sm"
          : "bg-slate-50 text-slate-500 hover:bg-slate-100",
      ].join(" ")}
    >
      <Icon
        className={[
          "h-5 w-5 shrink-0",
          active ? "text-[#F7B548]" : "text-slate-400",
        ].join(" ")}
      />

      <div>
        <div className="text-sm font-black">{title}</div>
        <div
          className={[
            "mt-0.5 text-[9px] font-bold",
            active ? "text-white/55" : "text-slate-400",
          ].join(" ")}
        >
          {subtitle}
        </div>
      </div>
    </button>
  );
}

/* =====================================================
   Courses Tab
===================================================== */

function CoursesTab({
  courses,
  variants,
  selectedTrack,
}: Props & { selectedTrack: AdminTrack }) {
  const trackCourses = useMemo(
    () =>
      courses
        .filter((course) =>
          belongsToTrack(course.track, selectedTrack),
        )
        .sort((a, b) => a.sort_order - b.sort_order),
    [courses, selectedTrack],
  );

  return (
    <div className="space-y-3">
      <details className={`${panel} group overflow-hidden`}>
        <summary className={compactSummary}>
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFF8E8] text-[#B87908]">
              <Plus className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-black text-[#07152E]">
                إضافة كورس جديد
              </h2>
              <p className="text-[10px] font-bold text-slate-400">
                سيضاف تلقائيًا إلى {trackArabic(selectedTrack)}
              </p>
            </div>
          </div>
          <ChevronDown className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-180" />
        </summary>

        <div className="border-t border-slate-100 bg-slate-50/50 p-4">
          <ActionForm
            action={createCourse}
            successMessage="تم إضافة الكورس بنجاح."
            resetOnSuccess
            className="grid gap-3 md:grid-cols-2 xl:grid-cols-3"
          >
            <input type="hidden" name="track" value={selectedTrack} />

            <Field
              title="المفتاح الداخلي"
              name="course_key"
              placeholder="civil3d"
              required
            />

            <Field
              title="اسم الكورس"
              name="title"
              placeholder="Civil 3D"
              required
            />

            <Field
              title="اسم WhatsApp"
              name="whatsapp_label"
              placeholder="Civil 3D"
              required
            />

            <div>
              <span className={label}>المسار</span>
              <div className="flex h-10 items-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-[#07152E]">
                {trackArabic(selectedTrack)}
              </div>
            </div>

            <Field
              title="الترتيب"
              name="sort_order"
              type="number"
              defaultValue="100"
              required
            />

            <Field
              title="رابط أول محاضرة"
              name="intro_video_url"
              placeholder="https://..."
            />

            <Field
              title="رابط الكورس"
              name="course_url"
              placeholder="https://masarmakers.com/..."
            />

            <TextAreaField
              title="وصف مختصر"
              name="short_description"
              className="md:col-span-2 xl:col-span-3"
            />

            <TextAreaField
              title="تفاصيل الكورس"
              name="details"
              className="md:col-span-2 xl:col-span-3"
            />

            <div className="flex flex-wrap items-center gap-5 md:col-span-2 xl:col-span-3">
              <CheckField name="is_active" labelText="نشط" defaultChecked />
              <CheckField
                name="whatsapp_visible"
                labelText="ظاهر في WhatsApp"
                defaultChecked
              />
              <CheckField
                name="has_variants"
                labelText="الكورس له أنواع / مستويات"
              />
            </div>

            <div className="md:col-span-2 xl:col-span-3">
              <ActionSubmitButton
                pendingText="جارٍ إضافة الكورس..."
                className={goldButton}
              >
                إضافة الكورس
              </ActionSubmitButton>
            </div>
          </ActionForm>
        </div>
      </details>

      <div className="space-y-2">
        {trackCourses.length > 0 ? (
          trackCourses.map((course) => {
            const ownVariants = variants
              .filter((variant) => variant.course_id === course.id)
              .sort((a, b) => a.sort_order - b.sort_order);

            return (
              <details
                key={course.id}
                className={`${panel} group overflow-hidden`}
              >
                <summary className={compactSummary}>
                  <div className="flex min-w-0 items-center gap-3">
                    <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-black text-[#07152E]">
                          {course.title}
                        </p>

                        {course.has_variants && (
                          <span className="rounded-md bg-[#FFF8E8] px-2 py-0.5 text-[9px] font-black text-[#9A6711]">
                            {ownVariants.length} أنواع
                          </span>
                        )}
                      </div>

                      <p className="mt-0.5 truncate text-[10px] font-bold text-slate-400">
                        {course.course_key} · ترتيب {course.sort_order}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <span
                      className={[
                        "rounded-full px-2 py-1 text-[9px] font-black",
                        course.whatsapp_visible
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-slate-100 text-slate-400",
                      ].join(" ")}
                    >
                      {course.whatsapp_visible ? "ظاهر" : "مخفي"}
                    </span>

                    <span
                      className={[
                        "h-2.5 w-2.5 rounded-full",
                        course.is_active
                          ? "bg-emerald-500"
                          : "bg-slate-300",
                      ].join(" ")}
                    />
                  </div>
                </summary>

                <div className="border-t border-slate-100 bg-slate-50/40 p-4">
                  <ActionForm
                    action={updateCourse}
                    successMessage={`تم حفظ تعديلات ${course.title} بنجاح.`}
                    className="grid gap-3 md:grid-cols-2 xl:grid-cols-3"
                  >
                    <input type="hidden" name="id" value={course.id} />

                    <Field
                      title="المفتاح الداخلي"
                      name="course_key"
                      defaultValue={course.course_key}
                      required
                    />

                    <Field
                      title="اسم الكورس"
                      name="title"
                      defaultValue={course.title}
                      required
                    />

                    <Field
                      title="اسم WhatsApp"
                      name="whatsapp_label"
                      defaultValue={course.whatsapp_label ?? ""}
                      required
                    />

                    <SelectField
                      title="المسار"
                      name="track"
                      defaultValue={
                        belongsToTrack(course.track, "Traffic Engineering")
                          ? "Traffic Engineering"
                          : "Road Design"
                      }
                      options={[
                        ["Road Design", "مسار تصميم الطرق"],
                        ["Traffic Engineering", "مسار هندسة المرور"],
                      ]}
                    />

                    <Field
                      title="الترتيب"
                      name="sort_order"
                      type="number"
                      defaultValue={String(course.sort_order)}
                      required
                    />

                    <Field
                      title="رابط أول محاضرة"
                      name="intro_video_url"
                      defaultValue={course.intro_video_url ?? ""}
                    />

                    <Field
                      title="رابط الكورس"
                      name="course_url"
                      defaultValue={course.course_url ?? ""}
                    />

                    <TextAreaField
                      title="وصف مختصر"
                      name="short_description"
                      defaultValue={course.short_description ?? ""}
                      className="md:col-span-2 xl:col-span-3"
                    />

                    <TextAreaField
                      title="تفاصيل الكورس"
                      name="details"
                      defaultValue={course.details ?? ""}
                      className="md:col-span-2 xl:col-span-3"
                    />

                    <Field
                      title="عنوان الأنواع في الإدارة"
                      name="variants_prompt"
                      defaultValue={course.variants_prompt ?? ""}
                      placeholder="اختر المستوى"
                    />

                    <div className="flex flex-wrap items-center gap-5 md:col-span-2 xl:col-span-3">
                      <CheckField
                        name="is_active"
                        labelText="نشط"
                        defaultChecked={course.is_active}
                      />
                      <CheckField
                        name="whatsapp_visible"
                        labelText="ظاهر في WhatsApp"
                        defaultChecked={course.whatsapp_visible}
                      />
                      <CheckField
                        name="has_variants"
                        labelText="له أنواع / مستويات"
                        defaultChecked={course.has_variants}
                      />
                    </div>

                    <div className="md:col-span-2 xl:col-span-3">
                      <ActionSubmitButton
                        pendingText="جارٍ حفظ الكورس..."
                        className={primaryButton}
                      >
                        حفظ الكورس
                      </ActionSubmitButton>
                    </div>
                  </ActionForm>

                  {course.has_variants && (
                    <div className="mt-4 border-t border-slate-200 pt-4">
                      <div className="mb-2 flex items-center justify-between">
                        <div>
                          <h3 className="text-xs font-black text-[#07152E]">
                            أنواع / مستويات الكورس
                          </h3>
                          <p className="mt-0.5 text-[10px] font-bold text-slate-400">
                            الأنواع للتجميع الداخلي فقط، ولن تظهر كقائمة مستقلة للعميل.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {ownVariants.map((variant) => (
                          <VariantRow key={variant.id} variant={variant} />
                        ))}

                        <details className="group overflow-hidden rounded-xl border border-dashed border-slate-300 bg-white">
                          <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between px-3 py-2 text-xs font-black text-[#B87908]">
                            <span>+ إضافة نوع جديد</span>
                            <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                          </summary>

                          <div className="border-t border-slate-100 p-3">
                            <ActionForm
                              action={createCourseVariant}
                              successMessage="تم إضافة نوع الرحلة بنجاح."
                              resetOnSuccess
                              className="grid gap-3 md:grid-cols-2 xl:grid-cols-3"
                            >
                              <input
                                type="hidden"
                                name="course_id"
                                value={course.id}
                              />

                              <Field
                                title="المفتاح الداخلي"
                                name="variant_key"
                                placeholder="fundamentals"
                                required
                              />

                              <Field
                                title="اسم النوع"
                                name="title"
                                placeholder="الأساسيات"
                                required
                              />

                              <Field
                                title="الترتيب"
                                name="sort_order"
                                type="number"
                                defaultValue="10"
                                required
                              />

                              <TextAreaField
                                title="وصف مختصر"
                                name="short_description"
                                className="md:col-span-2 xl:col-span-3"
                              />

                              <TextAreaField
                                title="تفاصيل النوع"
                                name="details"
                                className="md:col-span-2 xl:col-span-3"
                              />

                              <Field
                                title="رابط أول محاضرة"
                                name="intro_video_url"
                              />

                              <Field title="رابط النوع" name="course_url" />

                              <div className="flex flex-wrap items-center gap-5 md:col-span-2 xl:col-span-3">
                                <CheckField
                                  name="is_active"
                                  labelText="نشط"
                                  defaultChecked
                                />
                                <CheckField
                                  name="whatsapp_visible"
                                  labelText="ظاهر"
                                  defaultChecked
                                />
                              </div>

                              <div className="md:col-span-2 xl:col-span-3">
                                <ActionSubmitButton
                                  pendingText="جارٍ إضافة النوع..."
                                  className={goldButton}
                                >
                                  إضافة النوع
                                </ActionSubmitButton>
                              </div>
                            </ActionForm>
                          </div>
                        </details>
                      </div>
                    </div>
                  )}
                </div>
              </details>
            );
          })
        ) : (
          <EmptyState text={`لا توجد كورسات داخل ${trackArabic(selectedTrack)} حتى الآن.`} />
        )}
      </div>
    </div>
  );
}

function VariantRow({ variant }: { variant: WhatsAppCourseVariant }) {
  return (
    <details className="group overflow-hidden rounded-xl border border-slate-200 bg-white">
      <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 hover:bg-slate-50">
        <div className="flex min-w-0 items-center gap-2">
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
          <div className="min-w-0">
            <p className="truncate text-xs font-black text-[#07152E]">
              {variant.title}
            </p>
            <p className="text-[9px] font-bold text-slate-400">
              {variant.variant_key} · ترتيب {variant.sort_order}
            </p>
          </div>
        </div>

        <span
          className={[
            "rounded-full px-2 py-0.5 text-[9px] font-black",
            variant.is_active && variant.whatsapp_visible
              ? "bg-emerald-50 text-emerald-600"
              : "bg-slate-100 text-slate-400",
          ].join(" ")}
        >
          {variant.is_active && variant.whatsapp_visible ? "نشط" : "مخفي"}
        </span>
      </summary>

      <div className="border-t border-slate-100 bg-slate-50/50 p-3">
        <ActionForm
          action={updateCourseVariant}
          successMessage={`تم حفظ تعديلات ${variant.title} بنجاح.`}
          className="grid gap-3 md:grid-cols-2 xl:grid-cols-3"
        >
          <input type="hidden" name="id" value={variant.id} />
          <input type="hidden" name="course_id" value={variant.course_id} />

          <Field
            title="المفتاح الداخلي"
            name="variant_key"
            defaultValue={variant.variant_key}
            required
          />

          <Field
            title="اسم النوع"
            name="title"
            defaultValue={variant.title}
            required
          />

          <Field
            title="الترتيب"
            name="sort_order"
            type="number"
            defaultValue={String(variant.sort_order)}
            required
          />

          <TextAreaField
            title="وصف مختصر"
            name="short_description"
            defaultValue={variant.short_description ?? ""}
            className="md:col-span-2 xl:col-span-3"
          />

          <TextAreaField
            title="التفاصيل"
            name="details"
            defaultValue={variant.details ?? ""}
            className="md:col-span-2 xl:col-span-3"
          />

          <Field
            title="رابط أول محاضرة"
            name="intro_video_url"
            defaultValue={variant.intro_video_url ?? ""}
          />

          <Field
            title="رابط النوع"
            name="course_url"
            defaultValue={variant.course_url ?? ""}
          />

          <div className="flex flex-wrap items-center gap-5 md:col-span-2 xl:col-span-3">
            <CheckField
              name="is_active"
              labelText="نشط"
              defaultChecked={variant.is_active}
            />
            <CheckField
              name="whatsapp_visible"
              labelText="ظاهر"
              defaultChecked={variant.whatsapp_visible}
            />
          </div>

          <div className="md:col-span-2 xl:col-span-3">
            <ActionSubmitButton
              pendingText="جارٍ الحفظ..."
              className={primaryButton}
            >
              حفظ النوع
            </ActionSubmitButton>
          </div>
        </ActionForm>
      </div>
    </details>
  );
}

/* =====================================================
   Prices Tab
===================================================== */

function PricesTab({
  courses,
  variants,
  prices,
  selectedTrack,
}: Props & { selectedTrack: AdminTrack }) {
  const visibleCourses = useMemo(
    () =>
      courses
        .filter(
          (course) =>
            course.is_active &&
            belongsToTrack(course.track, selectedTrack),
        )
        .sort((a, b) => a.sort_order - b.sort_order),
    [courses, selectedTrack],
  );

  return (
    <div className="space-y-2">
      {visibleCourses.length > 0 ? (
        visibleCourses.map((course) => {
          const ownVariants = variants
            .filter(
              (variant) =>
                variant.course_id === course.id &&
                variant.is_active,
            )
            .sort((a, b) => a.sort_order - b.sort_order);

          const directPrices = prices
            .filter(
              (price) =>
                price.course_id === course.id &&
                !price.variant_id,
            )
            .sort((a, b) => a.sort_order - b.sort_order);

          return (
            <details
              key={course.id}
              className={`${panel} group overflow-hidden`}
            >
              <summary className={compactSummary}>
                <div className="flex min-w-0 items-center gap-3">
                  <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-[#07152E]">
                      {course.title}
                    </p>
                    <p className="mt-0.5 text-[10px] font-bold text-slate-400">
                      {course.has_variants
                        ? `${ownVariants.length} أنواع / مستويات`
                        : `${directPrices.length} عملات`}
                    </p>
                  </div>
                </div>

                <span className="rounded-lg bg-[#FFF8E8] px-2.5 py-1 text-[10px] font-black text-[#9A6711]">
                  إدارة الأسعار
                </span>
              </summary>

              <div className="border-t border-slate-100 bg-slate-50/40 p-4">
                {course.has_variants ? (
                  ownVariants.length > 0 ? (
                    <div className="space-y-3">
                      {ownVariants.map((variant) => {
                        const variantPrices = prices
                          .filter(
                            (price) =>
                              price.course_id === course.id &&
                              price.variant_id === variant.id,
                          )
                          .sort((a, b) => a.sort_order - b.sort_order);

                        return (
                          <PriceGroup
                            key={variant.id}
                            courseId={course.id}
                            variantId={variant.id}
                            title={variant.title}
                            prices={variantPrices}
                          />
                        );
                      })}
                    </div>
                  ) : (
                    <EmptyState text="هذا الكورس محدد ككورس متعدد الأنواع، لكن لا توجد أنواع نشطة له بعد." />
                  )
                ) : (
                  <PriceGroup
                    courseId={course.id}
                    variantId={null}
                    title="سعر الكورس"
                    prices={directPrices}
                  />
                )}
              </div>
            </details>
          );
        })
      ) : (
        <EmptyState text={`لا توجد أسعار لكورسات ${trackArabic(selectedTrack)}.`} />
      )}
    </div>
  );
}

function PriceGroup({
  courseId,
  variantId,
  title,
  prices,
}: {
  courseId: string;
  variantId: string | null;
  title: string;
  prices: WhatsAppCoursePrice[];
}) {
  return (
    <details className="group overflow-hidden rounded-xl border border-slate-200 bg-white">
      <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 hover:bg-slate-50">
        <div className="flex items-center gap-2">
          <ChevronDown className="h-3.5 w-3.5 text-slate-400 transition-transform group-open:rotate-180" />
          <span className="text-xs font-black text-[#07152E]">{title}</span>
        </div>
        <span className="text-[10px] font-bold text-slate-400">
          {prices.length} عملة
        </span>
      </summary>

      <div className="border-t border-slate-100 bg-slate-50/50 p-3">
        {prices.length > 0 && (
          <div className="grid gap-3 xl:grid-cols-2">
            {prices.map((price) => (
              <PriceEditor
                key={price.id}
                courseId={courseId}
                variantId={variantId}
                price={price}
              />
            ))}
          </div>
        )}

        <details className="group mt-3 overflow-hidden rounded-xl border border-dashed border-slate-300 bg-white">
          <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between px-3 text-xs font-black text-[#B87908]">
            <span>+ إضافة عملة جديدة</span>
            <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
          </summary>

          <div className="border-t border-slate-100 p-3">
            <PriceEditor courseId={courseId} variantId={variantId} />
          </div>
        </details>
      </div>
    </details>
  );
}

function PriceEditor({
  courseId,
  variantId,
  price,
}: {
  courseId: string;
  variantId: string | null;
  price?: WhatsAppCoursePrice;
}) {
  const currencyTitle = price
    ? `${price.currency_label} (${price.currency_code})`
    : "عملة جديدة";

  return (
    <ActionForm
      action={savePrice}
      successMessage={
        price
          ? `تم حفظ سعر ${currencyTitle} بنجاح.`
          : "تم إضافة العملة والسعر بنجاح."
      }
      resetOnSuccess={!price}
      className="rounded-xl border border-slate-200 bg-white p-3"
    >
      <input type="hidden" name="course_id" value={courseId} />
      <input type="hidden" name="variant_id" value={variantId ?? ""} />
      {price && <input type="hidden" name="id" value={price.id} />}

      <div className="mb-3 flex items-center justify-between gap-2">
        <h4 className="text-xs font-black text-[#07152E]">
          {currencyTitle}
        </h4>
        {price && (
          <span
            className={[
              "rounded-full px-2 py-0.5 text-[9px] font-black",
              price.is_active
                ? "bg-emerald-50 text-emerald-600"
                : "bg-slate-100 text-slate-400",
            ].join(" ")}
          >
            {price.is_active ? "مفعلة" : "غير مفعلة"}
          </span>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          title="كود العملة"
          name="currency_code"
          defaultValue={price?.currency_code ?? ""}
          placeholder="SAR"
          required
          readOnly={Boolean(price)}
        />

        <Field
          title="اسم العملة"
          name="currency_label"
          defaultValue={price?.currency_label ?? ""}
          placeholder="ريال سعودي"
          required
        />

        <Field
          title="السعر الحالي"
          name="current_price"
          type="number"
          step="0.01"
          min="0"
          defaultValue={
            price ? String(price.current_price) : ""
          }
          required
        />

        <Field
          title="السعر الأصلي"
          name="original_price"
          type="number"
          step="0.01"
          min="0"
          defaultValue={
            price?.original_price != null
              ? String(price.original_price)
              : ""
          }
        />

        <Field
          title="اسم العرض"
          name="offer_label"
          defaultValue={price?.offer_label ?? ""}
          placeholder="عرض التوفير"
        />

        <Field
          title="الترتيب"
          name="sort_order"
          type="number"
          defaultValue={String(price?.sort_order ?? 100)}
        />

        <Field
          title="بداية العرض"
          name="offer_start"
          type="datetime-local"
          defaultValue={toLocalDateTime(price?.offer_start)}
        />

        <Field
          title="نهاية العرض"
          name="offer_end"
          type="datetime-local"
          defaultValue={toLocalDateTime(price?.offer_end)}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4">
        <CheckField
          name="offer_active"
          labelText="العرض مفعل"
          defaultChecked={price?.offer_active ?? false}
        />
        <CheckField
          name="is_active"
          labelText="العملة مفعلة"
          defaultChecked={price?.is_active ?? true}
        />
      </div>

      <ActionSubmitButton
        pendingText="جارٍ حفظ السعر..."
        className={`${primaryButton} mt-4`}
      >
        {price ? "حفظ السعر" : "إضافة العملة"}
      </ActionSubmitButton>
    </ActionForm>
  );
}

/* =====================================================
   Menus + Answers Tab
===================================================== */

function MenusAnswersTab({
  menus,
  menuItems,
  items: legacyItems,
  answers,
  courses,
  selectedTrack,
}: Props & { selectedTrack: AdminTrack }) {
  const effectiveMenuItems = menuItems ?? legacyItems ?? [];
  const orderedMenus = [...menus].sort(
    (a, b) => a.sort_order - b.sort_order,
  );

  const orderedAnswers = [...answers].sort((a, b) =>
    a.admin_name.localeCompare(b.admin_name, "ar"),
  );

  const trackCourses = courses
    .filter((course) => belongsToTrack(course.track, selectedTrack))
    .sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="space-y-4">
      <InfoBar>
        القوائم والردود ثابتة ومتحكم بها من لوحة الإدارة. اختيار المسار في الأعلى
        يفيدك عند ربط عنصر بقائمة كورسات المسار الحالي.
      </InfoBar>

      <details className={`${panel} group overflow-hidden`}>
        <summary className={compactSummary}>
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFF8E8] text-[#B87908]">
              <Plus className="h-4 w-4" />
            </span>
            <span className="text-sm font-black text-[#07152E]">
              إضافة قائمة جديدة
            </span>
          </div>
          <ChevronDown className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-180" />
        </summary>

        <div className="border-t border-slate-100 bg-slate-50/50 p-4">
          <MenuForm mode="create" menus={menus} answers={answers} courses={trackCourses} />
        </div>
      </details>

      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-black text-[#07152E]">القوائم</h3>
          <span className="text-[10px] font-bold text-slate-400">
            {orderedMenus.length} قائمة
          </span>
        </div>

        {orderedMenus.map((menu) => {
          const items = effectiveMenuItems
            .filter((item) => item.menu_id === menu.id)
            .sort((a, b) => a.sort_order - b.sort_order);

          const limit = menu.interaction_type === "buttons" ? 3 : 10;

          return (
            <details
              key={menu.id}
              className={`${panel} group overflow-hidden`}
            >
              <summary className={compactSummary}>
                <div className="flex min-w-0 items-center gap-3">
                  <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-[#07152E]">
                      {menu.admin_name}
                    </p>
                    <p className="mt-0.5 text-[10px] font-bold text-slate-400">
                      {menu.menu_key} · {menu.interaction_type === "buttons" ? "أزرار" : "قائمة"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={[
                      "rounded-lg px-2 py-1 text-[9px] font-black",
                      items.length > limit
                        ? "bg-red-50 text-red-600"
                        : "bg-slate-100 text-slate-500",
                    ].join(" ")}
                  >
                    {items.length}/{limit}
                  </span>
                  <span
                    className={[
                      "h-2.5 w-2.5 rounded-full",
                      menu.is_active ? "bg-emerald-500" : "bg-slate-300",
                    ].join(" ")}
                  />
                </div>
              </summary>

              <div className="border-t border-slate-100 bg-slate-50/40 p-4">
                <MenuForm
                  mode="edit"
                  menu={menu}
                  menus={menus}
                  answers={answers}
                  courses={trackCourses}
                />

                <div className="mt-4 border-t border-slate-200 pt-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-black text-[#07152E]">
                        عناصر القائمة
                      </h4>
                      <p className="mt-0.5 text-[10px] font-bold text-slate-400">
                        Lists حدها 10 عناصر، والأزرار حدها 3.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {items.map((item) => (
                      <MenuItemRow
                        key={item.id}
                        item={item}
                        menus={menus}
                        answers={answers}
                        courses={trackCourses}
                      />
                    ))}

                    <details className="group overflow-hidden rounded-xl border border-dashed border-slate-300 bg-white">
                      <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between px-3 text-xs font-black text-[#B87908]">
                        <span>+ إضافة اختيار جديد</span>
                        <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                      </summary>

                      <div className="border-t border-slate-100 p-3">
                        <MenuItemForm
                          mode="create"
                          menuId={menu.id}
                          menus={menus}
                          answers={answers}
                          courses={trackCourses}
                          currentCount={items.length}
                          interactionType={menu.interaction_type}
                        />
                      </div>
                    </details>
                  </div>
                </div>
              </div>
            </details>
          );
        })}
      </section>

      <section className="space-y-2 pt-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-black text-[#07152E]">الردود الثابتة</h3>
          <span className="text-[10px] font-bold text-slate-400">
            {orderedAnswers.length} رد
          </span>
        </div>

        <details className={`${panel} group overflow-hidden`}>
          <summary className={compactSummary}>
            <span className="text-xs font-black text-[#B87908]">
              + إضافة رد ثابت
            </span>
            <ChevronDown className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-180" />
          </summary>
          <div className="border-t border-slate-100 bg-slate-50/50 p-4">
            <AnswerForm mode="create" />
          </div>
        </details>

        {orderedAnswers.map((answer) => (
          <details
            key={answer.id}
            className={`${panel} group overflow-hidden`}
          >
            <summary className={compactSummary}>
              <div className="flex min-w-0 items-center gap-3">
                <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
                <div className="min-w-0">
                  <p className="truncate text-xs font-black text-[#07152E]">
                    {answer.admin_name}
                  </p>
                  <p className="text-[9px] font-bold text-slate-400">
                    {answer.answer_key}
                  </p>
                </div>
              </div>
              <span
                className={[
                  "h-2.5 w-2.5 rounded-full",
                  answer.is_active ? "bg-emerald-500" : "bg-slate-300",
                ].join(" ")}
              />
            </summary>

            <div className="border-t border-slate-100 bg-slate-50/40 p-4">
              <AnswerForm mode="edit" answer={answer} />
            </div>
          </details>
        ))}
      </section>
    </div>
  );
}

function MenuForm({
  mode,
  menu,
}: {
  mode: "create" | "edit";
  menu?: WhatsAppMenu;
  menus: WhatsAppMenu[];
  answers: WhatsAppAnswer[];
  courses: WhatsAppCourse[];
}) {
  const action = mode === "create" ? createMenu : updateMenu;

  return (
    <ActionForm
      action={action}
      successMessage={
        mode === "create"
          ? "تم إضافة القائمة بنجاح."
          : `تم حفظ قائمة ${menu?.admin_name ?? ""} بنجاح.`
      }
      resetOnSuccess={mode === "create"}
      className="grid gap-3 md:grid-cols-2 xl:grid-cols-3"
    >
      {menu && <input type="hidden" name="id" value={menu.id} />}

      <Field
        title="المفتاح الداخلي"
        name="menu_key"
        defaultValue={menu?.menu_key ?? ""}
        placeholder="main_menu"
        required
      />

      <Field
        title="اسم الإدارة"
        name="admin_name"
        defaultValue={menu?.admin_name ?? ""}
        placeholder="القائمة الرئيسية"
        required
      />

      <SelectField
        title="نوع التفاعل"
        name="interaction_type"
        defaultValue={menu?.interaction_type ?? "list"}
        options={[
          ["list", "List — حتى 10 عناصر"],
          ["buttons", "Buttons — حتى 3 أزرار"],
        ]}
      />

      <Field
        title="العنوان"
        name="header_text"
        defaultValue={menu?.header_text ?? ""}
      />

      <Field
        title="نص زر فتح القائمة"
        name="open_button_text"
        defaultValue={menu?.open_button_text ?? ""}
        placeholder="عرض الخيارات"
      />

      <Field
        title="الترتيب"
        name="sort_order"
        type="number"
        defaultValue={String(menu?.sort_order ?? 100)}
      />

      <TextAreaField
        title="نص الرسالة"
        name="body_text"
        defaultValue={menu?.body_text ?? ""}
        className="md:col-span-2 xl:col-span-3"
        required
      />

      <Field
        title="Footer"
        name="footer_text"
        defaultValue={menu?.footer_text ?? ""}
        className="md:col-span-2 xl:col-span-3"
      />

      <div className="md:col-span-2 xl:col-span-3">
        <CheckField
          name="is_active"
          labelText="القائمة مفعلة"
          defaultChecked={menu?.is_active ?? true}
        />
      </div>

      <div className="md:col-span-2 xl:col-span-3">
        <ActionSubmitButton
          pendingText="جارٍ الحفظ..."
          className={mode === "create" ? goldButton : primaryButton}
        >
          {mode === "create" ? "إضافة القائمة" : "حفظ القائمة"}
        </ActionSubmitButton>
      </div>
    </ActionForm>
  );
}

function MenuItemRow({
  item,
  menus,
  answers,
  courses,
}: {
  item: WhatsAppMenuItem;
  menus: WhatsAppMenu[];
  answers: WhatsAppAnswer[];
  courses: WhatsAppCourse[];
}) {
  return (
    <details className="group overflow-hidden rounded-xl border border-slate-200 bg-white">
      <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 hover:bg-slate-50">
        <div className="flex min-w-0 items-center gap-2">
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
          <div className="min-w-0">
            <p className="truncate text-xs font-black text-[#07152E]">
              {item.label}
            </p>
            <p className="text-[9px] font-bold text-slate-400">
              {item.item_key} · {item.action_type} · ترتيب {item.sort_order}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ActionForm
            action={toggleMenuItem}
            successMessage={
              item.is_active
                ? "تم إخفاء الاختيار."
                : "تم إظهار الاختيار."
            }
          >
            <input type="hidden" name="id" value={item.id} />
            <input
              type="hidden"
              name="current_active"
              value={item.is_active ? "true" : "false"}
            />
            <ActionSubmitButton
              pendingText="..."
              className="h-7 rounded-lg border border-slate-200 px-2 text-[9px] font-black text-slate-500 hover:border-[#F7B548]"
            >
              {item.is_active ? "إخفاء" : "إظهار"}
            </ActionSubmitButton>
          </ActionForm>

          <span
            className={[
              "h-2.5 w-2.5 rounded-full",
              item.is_active ? "bg-emerald-500" : "bg-slate-300",
            ].join(" ")}
          />
        </div>
      </summary>

      <div className="border-t border-slate-100 bg-slate-50/50 p-3">
        <MenuItemForm
          mode="edit"
          item={item}
          menuId={item.menu_id}
          menus={menus}
          answers={answers}
          courses={courses}
        />
      </div>
    </details>
  );
}

function MenuItemForm({
  mode,
  item,
  menuId,
  menus,
  answers,
  courses,
  currentCount,
  interactionType,
}: {
  mode: "create" | "edit";
  item?: WhatsAppMenuItem;
  menuId: string;
  menus: WhatsAppMenu[];
  answers: WhatsAppAnswer[];
  courses: WhatsAppCourse[];
  currentCount?: number;
  interactionType?: string;
}) {
  const action = mode === "create" ? createMenuItem : updateMenuItem;
  const limit = interactionType === "buttons" ? 3 : 10;
  const limitReached =
    mode === "create" &&
    typeof currentCount === "number" &&
    currentCount >= limit;

  return (
    <>
      {limitReached && (
        <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-black text-red-600">
          وصلتِ للحد الأقصى لهذه القائمة ({limit}). أخفي أو عدلي عنصرًا قبل إضافة عنصر جديد.
        </div>
      )}

      <ActionForm
        action={action}
        successMessage={
          mode === "create"
            ? "تم إضافة اختيار القائمة بنجاح."
            : "تم حفظ اختيار القائمة بنجاح."
        }
        resetOnSuccess={mode === "create"}
        className="grid gap-3 md:grid-cols-2 xl:grid-cols-3"
      >
        {item && <input type="hidden" name="id" value={item.id} />}
        <input type="hidden" name="menu_id" value={menuId} />

        <Field
          title="المفتاح الداخلي"
          name="item_key"
          defaultValue={item?.item_key ?? ""}
          placeholder="course_price"
          required
        />

        <Field
          title="النص الظاهر للعميل"
          name="label"
          defaultValue={item?.label ?? ""}
          required
        />

        <Field
          title="الوصف القصير"
          name="description"
          defaultValue={item?.description ?? ""}
        />

        <SelectField
          title="الإجراء"
          name="action_type"
          defaultValue={item?.action_type ?? "open_menu"}
          options={[
            ["open_menu", "فتح قائمة"],
            ["open_track", "فتح مسار"],
            ["show_answer", "عرض رد ثابت"],
            ["open_course", "فتح كورس"],
            ["show_details", "تفاصيل الكورس"],
            ["show_price", "السعر"],
            ["open_url", "فتح رابط"],
            ["subscribe", "الاشتراك / تحويل للبشر"],
            ["human_support", "خدمة العملاء"],
            ["main_menu", "القائمة الرئيسية"],
          ]}
        />

        <SelectField
          title="القائمة المستهدفة"
          name="target_menu_id"
          defaultValue={item?.target_menu_id ?? ""}
          options={[
            ["", "بدون"],
            ...menus.map((menu) => [menu.id, menu.admin_name] as const),
          ]}
        />

        <SelectField
          title="الرد الثابت"
          name="answer_id"
          defaultValue={item?.answer_id ?? ""}
          options={[
            ["", "بدون"],
            ...answers.map((answer) => [answer.id, answer.admin_name] as const),
          ]}
        />

        <SelectField
          title="الكورس"
          name="course_id"
          defaultValue={item?.course_id ?? ""}
          options={[
            ["", "بدون"],
            ...courses.map((course) => [course.id, course.title] as const),
          ]}
        />

        <Field
          title="قيمة الإجراء"
          name="action_value"
          defaultValue={item?.action_value ?? ""}
          placeholder="Road Design / current / SAR ..."
        />

        <Field
          title="الرابط"
          name="url"
          defaultValue={item?.url ?? ""}
          placeholder="https://..."
        />

        <Field
          title="الترتيب"
          name="sort_order"
          type="number"
          defaultValue={String(item?.sort_order ?? 100)}
        />

        <div className="md:col-span-2 xl:col-span-3">
          <CheckField
            name="is_active"
            labelText="الاختيار مفعل"
            defaultChecked={item?.is_active ?? true}
          />
        </div>

        <div className="md:col-span-2 xl:col-span-3">
          <ActionSubmitButton
            pendingText="جارٍ الحفظ..."
            className={mode === "create" ? goldButton : primaryButton}
          >
            {mode === "create" ? "إضافة الاختيار" : "حفظ الاختيار"}
          </ActionSubmitButton>
        </div>
      </ActionForm>
    </>
  );
}

function AnswerForm({
  mode,
  answer,
}: {
  mode: "create" | "edit";
  answer?: WhatsAppAnswer;
}) {
  const action = mode === "create" ? createAnswer : updateAnswer;

  return (
    <ActionForm
      action={action}
      successMessage={
        mode === "create"
          ? "تم إضافة الرد الثابت بنجاح."
          : `تم حفظ رد ${answer?.admin_name ?? ""} بنجاح.`
      }
      resetOnSuccess={mode === "create"}
      className="grid gap-3 md:grid-cols-2"
    >
      {answer && <input type="hidden" name="id" value={answer.id} />}

      <Field
        title="المفتاح الداخلي"
        name="answer_key"
        defaultValue={answer?.answer_key ?? ""}
        placeholder="current_offer"
        required
      />

      <Field
        title="اسم الإدارة"
        name="admin_name"
        defaultValue={answer?.admin_name ?? ""}
        placeholder="العرض الحالي"
        required
      />

      <TextAreaField
        title="نص الرد"
        name="message_text"
        defaultValue={answer?.message_text ?? ""}
        required
        className="md:col-span-2"
      />

      <div className="md:col-span-2">
        <CheckField
          name="is_active"
          labelText="الرد مفعل"
          defaultChecked={answer?.is_active ?? true}
        />
      </div>

      <div className="md:col-span-2">
        <ActionSubmitButton
          pendingText="جارٍ الحفظ..."
          className={mode === "create" ? goldButton : primaryButton}
        >
          {mode === "create" ? "إضافة الرد" : "حفظ الرد"}
        </ActionSubmitButton>
      </div>
    </ActionForm>
  );
}

/* =====================================================
   Support Tab
===================================================== */

function SupportTab({ sessions }: Props & { selectedTrack: AdminTrack }) {
  const humanSessions = [...sessions]
    .filter((session) => {
      const mode = (session.mode ?? "").toLowerCase();
      const until = session.human_mode_until
        ? new Date(session.human_mode_until).getTime()
        : 0;

      return mode === "human" || until > Date.now();
    })
    .sort((a, b) => {
      const aTime = a.updated_at ? new Date(a.updated_at).getTime() : 0;
      const bTime = b.updated_at ? new Date(b.updated_at).getTime() : 0;
      return bTime - aTime;
    });

  return (
    <div className="space-y-3">
      <InfoBar>
        عند دخول العميل Human Mode يتوقف البوت تمامًا عن الرد حتى انتهاء المدة أو ضغطك على «إعادة للبوت».
      </InfoBar>

      <section className={`${panel} overflow-hidden`}>
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <Headphones className="h-4 w-4 text-[#B87908]" />
            <h3 className="text-sm font-black text-[#07152E]">
              العملاء مع خدمة العملاء
            </h3>
          </div>
          <span className="rounded-full bg-[#FFF8E8] px-2.5 py-1 text-[10px] font-black text-[#9A6711]">
            {humanSessions.length}
          </span>
        </div>

        {humanSessions.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {humanSessions.map((session) => (
              <div
                key={session.phone}
                className="flex flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-black text-[#07152E]" dir="ltr">
                      {session.phone}
                    </p>
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-black text-amber-600">
                      Human Mode
                    </span>
                  </div>

                  <p className="mt-1 text-[10px] font-bold text-slate-400">
                    حتى: {formatDate(session.human_mode_until)} · آخر تحديث: {formatDate(session.updated_at)}
                  </p>
                </div>

                <ActionForm
                  action={returnCustomerToBot}
                  successMessage="تمت إعادة العميل إلى البوت."
                >
                  <input type="hidden" name="phone" value={session.phone} />
                  <ActionSubmitButton
                    pendingText="جارٍ الإرجاع..."
                    className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#07152E] px-3 text-[10px] font-black text-white"
                  >
                    <UserRoundCheck className="h-3.5 w-3.5" />
                    إعادة للبوت
                  </ActionSubmitButton>
                </ActionForm>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState text="لا يوجد عملاء في Human Mode حاليًا." />
        )}
      </section>
    </div>
  );
}

/* =====================================================
   Settings Tab
===================================================== */

function SettingsTab({
  settings,
  botSettings,
}: Props & { selectedTrack: AdminTrack }) {
  const effectiveSettings =
    settings ?? botSettings ?? null;

  const botEnabled =
    getBotEnabled(effectiveSettings);

  const humanHours =
    getHumanHours(effectiveSettings);

  const unknownBehavior =
    getUnknownMessageBehavior(
      effectiveSettings,
    );

  const unknownBehaviorLabel =
    unknownBehavior === "human_support"
      ? "تحويل لخدمة العملاء"
      : unknownBehavior === "silent"
        ? "بدون رد"
        : "القائمة الرئيسية";

  return (
    <div className="space-y-3">
      <section className={`${panel} p-4`}>
        <div className="mb-4 flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#07152E] text-[#F7B548]">
            <Bot className="h-4 w-4" />
          </span>

          <div>
            <h3 className="text-sm font-black text-[#07152E]">
              إعدادات البوت العامة
            </h3>

            <p className="mt-1 text-[10px] font-bold leading-5 text-slate-400">
              رسالة الترحيب تُدمج مع القائمة الرئيسية.
              ويمكنك تحديد سلوك أي رسالة حرة أو غير معروفة.
            </p>
          </div>
        </div>

        <ActionForm
          action={updateBotSettings}
          successMessage="تم حفظ إعدادات WhatsApp Sales بنجاح."
          className="grid gap-3 md:grid-cols-2"
        >
          {effectiveSettings?.id != null && (
            <input
              type="hidden"
              name="id"
              value={String(
                effectiveSettings.id,
              )}
            />
          )}

          <TextAreaField
            title="رسالة الترحيب"
            name="greeting_text"
            defaultValue={
              String(
                effectiveSettings?.greeting_text ??
                  effectiveSettings?.welcome_message ??
                  "",
              )
            }
            placeholder="أهلًا بك في Masar Makers..."
            className="md:col-span-2"
          />

          <SelectField
            title="سلوك الرسالة الحرة / غير المعروفة"
            name="unknown_message_behavior"
            defaultValue={unknownBehavior}
            options={[
              [
                "main_menu",
                "إظهار القائمة الرئيسية",
              ],
              [
                "human_support",
                "تحويل لخدمة العملاء",
              ],
              [
                "silent",
                "عدم إرسال رد",
              ],
            ]}
          />

          <Field
            title="مدة خدمة العملاء (بالساعات)"
            name="human_mode_hours"
            type="number"
            min="1"
            defaultValue={String(
              humanHours,
            )}
            required
          />

          <div className="flex items-end pb-1">
            <CheckField
              name="bot_enabled"
              labelText="البوت يعمل"
              defaultChecked={botEnabled}
            />
          </div>

          <div className="md:col-span-2">
            <ActionSubmitButton
              pendingText="جارٍ حفظ الإعدادات..."
              className={primaryButton}
            >
              حفظ الإعدادات
            </ActionSubmitButton>
          </div>
        </ActionForm>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <StatusCard
          icon={Bot}
          title="حالة البوت"
          value={
            botEnabled
              ? "يعمل"
              : "متوقف"
          }
          active={botEnabled}
        />

        <StatusCard
          icon={Headphones}
          title="Human Mode"
          value={`${humanHours} ساعة`}
          active
        />

        <StatusCard
          icon={MessageCircleMore}
          title="الرسائل الحرة"
          value={unknownBehaviorLabel}
          active={
            unknownBehavior !== "silent"
          }
        />
      </section>
    </div>
  );
}

function StatusCard({
  icon: Icon,
  title,
  value,
  active,
}: {
  icon: LucideIcon;
  title: string;
  value: string;
  active: boolean;
}) {
  return (
    <div className={`${panel} flex items-center gap-3 p-4`}>
      <span
        className={[
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
          active
            ? "bg-emerald-50 text-emerald-600"
            : "bg-slate-100 text-slate-400",
        ].join(" ")}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-[10px] font-bold text-slate-400">{title}</p>
        <p className="mt-0.5 text-xs font-black text-[#07152E]">{value}</p>
      </div>
    </div>
  );
}

/* =====================================================
   Shared fields
===================================================== */

function Field({
  title,
  name,
  type = "text",
  defaultValue = "",
  placeholder,
  required = false,
  readOnly = false,
  min,
  step,
  className = "",
}: {
  title: string;
  name: string;
  type?: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  readOnly?: boolean;
  min?: string;
  step?: string;
  className?: string;
}) {
  return (
    <label className={className}>
      <span className={label}>{title}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        readOnly={readOnly}
        min={min}
        step={step}
        className={[
          input,
          readOnly ? "bg-slate-50 text-slate-500" : "",
        ].join(" ")}
      />
    </label>
  );
}

function TextAreaField({
  title,
  name,
  defaultValue = "",
  placeholder,
  required = false,
  className = "",
}: {
  title: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <label className={className}>
      <span className={label}>{title}</span>
      <textarea
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        className={textarea}
      />
    </label>
  );
}

function SelectField({
  title,
  name,
  defaultValue,
  options,
}: {
  title: string;
  name: string;
  defaultValue?: string;
  options: readonly (readonly [string, string])[];
}) {
  return (
    <label>
      <span className={label}>{title}</span>
      <select name={name} defaultValue={defaultValue} className={input}>
        {options.map(([value, text]) => (
          <option key={`${name}-${value}`} value={value}>
            {text}
          </option>
        ))}
      </select>
    </label>
  );
}

function CheckField({
  name,
  labelText,
  defaultChecked = false,
}: {
  name: string;
  labelText: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-xs font-black text-[#07152E]">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="h-4 w-4 accent-[#07152E]"
      />
      {labelText}
    </label>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-7 text-center text-xs font-bold text-slate-400">
      {text}
    </div>
  );
}

function InfoBar({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-[#F7B548]/35 bg-[#FFF8E8] px-4 py-3 text-xs font-bold leading-6 text-[#76500D]">
      {children}
    </div>
  );
}