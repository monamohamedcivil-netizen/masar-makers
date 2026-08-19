"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import {
  CalendarClock,
  CheckCircle2,
  Edit3,
  Megaphone,
  Plus,
  Power,
  Save,
  Trash2,
  X,
} from "lucide-react";

import {
  createPlatformAnnouncement,
  deletePlatformAnnouncement,
  togglePlatformAnnouncement,
  updatePlatformAnnouncement,
  type PlatformAnnouncement,
  type PlatformAnnouncementType,
} from "@/lib/admin/platform-announcements";

type Props = {
  initialAnnouncements: PlatformAnnouncement[];
};

type FormState = {
  type: PlatformAnnouncementType;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  buttonText: string;
  buttonTextEn: string;
  href: string;
  isActive: boolean;
  displayOrder: number;
  startsAt: string;
  endsAt: string;
};

const EMPTY_FORM: FormState = {
  type: "news",
  title: "",
  titleEn: "",
  description: "",
  descriptionEn: "",
  buttonText: "التفاصيل",
  buttonTextEn: "Details",
  href: "#",
  isActive: true,
  displayOrder: 0,
  startsAt: "",
  endsAt: "",
};

const TYPE_LABELS: Record<PlatformAnnouncementType, string> = {
  offer: "عرض",
  course: "كورس / رحلة",
  news: "خبر",
  achievement: "إنجاز",
  alert: "تنبيه",
};

function toInputDate(value: string | null) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const local = new Date(
    date.getTime() -
      date.getTimezoneOffset() * 60_000,
  );

  return local.toISOString().slice(0, 16);
}

export default function AnnouncementsManager({
  initialAnnouncements,
}: Props) {
  const [announcements, setAnnouncements] =
    useState(initialAnnouncements);

  const [form, setForm] =
    useState<FormState>(EMPTY_FORM);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [isPending, startTransition] =
    useTransition();

  const activeCount = useMemo(
    () =>
      announcements.filter(
        (item) => item.is_active,
      ).length,
    [announcements],
  );

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError("");
    setMessage("");
  }

  function editAnnouncement(
    item: PlatformAnnouncement,
  ) {
    setEditingId(item.id);
    setForm({
      type: item.type,
      title: item.title,
      titleEn:
        item.title_en ?? "",
      description:
        item.description ?? "",
      descriptionEn:
        item.description_en ?? "",
      buttonText:
        item.button_text || "التفاصيل",
      buttonTextEn:
        item.button_text_en || "Details",
      href: item.href || "#",
      isActive: item.is_active,
      displayOrder:
        item.display_order ?? 0,
      startsAt: toInputDate(
        item.starts_at,
      ),
      endsAt: toInputDate(
        item.ends_at,
      ),
    });

    setError("");
    setMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setMessage("");

    startTransition(async () => {
      const input = {
        type: form.type,
        title: form.title,
        titleEn: form.titleEn,
        description: form.description,
        descriptionEn: form.descriptionEn,
        buttonText: form.buttonText,
        buttonTextEn: form.buttonTextEn,
        href: form.href,
        isActive: form.isActive,
        displayOrder:
          form.displayOrder,
        startsAt: form.startsAt,
        endsAt: form.endsAt,
      };

      const result = editingId
        ? await updatePlatformAnnouncement(
            editingId,
            input,
          )
        : await createPlatformAnnouncement(
            input,
          );

      if (!result.success) {
        setError(result.message);
        return;
      }

      setMessage(result.message);
      window.location.reload();
    });
  }

  function handleToggle(
    item: PlatformAnnouncement,
  ) {
    setError("");
    setMessage("");

    startTransition(async () => {
      const result =
        await togglePlatformAnnouncement(
          item.id,
          !item.is_active,
        );

      if (!result.success) {
        setError(result.message);
        return;
      }

      setAnnouncements((current) =>
        current.map((announcement) =>
          announcement.id === item.id
            ? {
                ...announcement,
                is_active:
                  !item.is_active,
              }
            : announcement,
        ),
      );

      setMessage(result.message);
    });
  }

  function handleDelete(
    item: PlatformAnnouncement,
  ) {
    if (
      !window.confirm(
        `هل تريد حذف إعلان "${item.title}" نهائيًا؟`,
      )
    ) {
      return;
    }

    setError("");
    setMessage("");

    startTransition(async () => {
      const result =
        await deletePlatformAnnouncement(
          item.id,
        );

      if (!result.success) {
        setError(result.message);
        return;
      }

      setAnnouncements((current) =>
        current.filter(
          (announcement) =>
            announcement.id !==
            item.id,
        ),
      );

      if (editingId === item.id) {
        resetForm();
      }

      setMessage(result.message);
    });
  }

  return (
    <div
      dir="rtl"
      className="space-y-5"
    >
      <section className="grid gap-3 sm:grid-cols-3">
        <Stat
          title="إجمالي الإعلانات"
          value={announcements.length}
        />
        <Stat
          title="الإعلانات النشطة"
          value={activeCount}
        />
        <Stat
          title="غير النشطة"
          value={
            announcements.length -
            activeCount
          }
        />
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header className="flex items-center justify-between gap-4 border-b border-slate-200 bg-[#F8FAFC] px-5 py-4">
          <div>
            <p className="text-[10px] font-black text-[#C88712]">
              {editingId
                ? "تعديل الإعلان"
                : "إعلان جديد"}
            </p>
            <h2 className="mt-0.5 text-[18px] font-black text-[#07152E]">
              {editingId
                ? "تعديل بيانات الإعلان"
                : "إضافة إعلان إلى شريط المنصة"}
            </h2>
          </div>

          {editingId ? (
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-[10px] font-black text-slate-600"
            >
              <X size={14} />
              إلغاء التعديل
            </button>
          ) : (
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF4DF] text-[#C88712]">
              <Plus size={18} />
            </span>
          )}
        </header>

        <form
          onSubmit={handleSubmit}
          className="grid gap-4 p-5 md:grid-cols-2"
        >
          <Field label="نوع الإعلان">
            <select
              value={form.type}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  type:
                    event.target
                      .value as PlatformAnnouncementType,
                }))
              }
              className={INPUT}
            >
              {Object.entries(
                TYPE_LABELS,
              ).map(([value, label]) => (
                <option
                  key={value}
                  value={value}
                >
                  {label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="ترتيب الظهور">
            <input
              type="number"
              value={form.displayOrder}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  displayOrder:
                    Number(
                      event.target.value,
                    ),
                }))
              }
              className={INPUT}
            />
          </Field>

          <Field label="عنوان الإعلان بالعربية">
            <input
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              required
              className={INPUT}
              placeholder="مثال: بدأ التسجيل في BIM for Roads"
            />
          </Field>

          <Field label="عنوان الإعلان بالإنجليزية">
            <input
              value={form.titleEn}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  titleEn: event.target.value,
                }))
              }
              dir="ltr"
              className={`${INPUT} text-left`}
              placeholder="Example: Vehicle Tracking registration is now open"
            />
          </Field>

          <Field label="الوصف المختصر بالعربية">
            <textarea
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              rows={2}
              className={`${INPUT} h-auto min-h-[78px] py-3`}
              placeholder="وصف قصير يظهر أسفل عنوان الإعلان"
            />
          </Field>

          <Field label="الوصف المختصر بالإنجليزية">
            <textarea
              value={form.descriptionEn}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  descriptionEn: event.target.value,
                }))
              }
              rows={2}
              dir="ltr"
              className={`${INPUT} h-auto min-h-[78px] py-3 text-left`}
              placeholder="Short description shown below the announcement title"
            />
          </Field>

          <Field label="نص الزر بالعربية">
            <input
              value={form.buttonText}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  buttonText: event.target.value,
                }))
              }
              className={INPUT}
              placeholder="التفاصيل"
            />
          </Field>

          <Field label="نص الزر بالإنجليزية">
            <input
              value={form.buttonTextEn}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  buttonTextEn: event.target.value,
                }))
              }
              dir="ltr"
              className={`${INPUT} text-left`}
              placeholder="Details"
            />
          </Field>

          <Field label="رابط الزر" className="md:col-span-2">
            <input
              value={form.href}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  href: event.target.value,
                }))
              }
              dir="ltr"
              className={`${INPUT} text-left`}
              placeholder="/course/example"
            />
          </Field>

          <Field label="يبدأ في">
            <input
              type="datetime-local"
              value={form.startsAt}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  startsAt:
                    event.target.value,
                }))
              }
              className={INPUT}
            />
          </Field>

          <Field label="ينتهي في">
            <input
              type="datetime-local"
              value={form.endsAt}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  endsAt:
                    event.target.value,
                }))
              }
              className={INPUT}
            />
          </Field>

          <label className="flex cursor-pointer items-center gap-3 md:col-span-2">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  isActive:
                    event.target.checked,
                }))
              }
              className="h-4 w-4 accent-[#F7B548]"
            />
            <span className="text-[11px] font-black text-[#07152E]">
              الإعلان نشط ويظهر عند استيفاء فترة العرض
            </span>
          </label>

          {(message || error) && (
            <div className="md:col-span-2">
              {message ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[11px] font-bold text-emerald-700">
                  {message}
                </div>
              ) : null}

              {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[11px] font-bold text-red-600">
                  {error}
                </div>
              ) : null}
            </div>
          )}

          <div className="flex justify-end md:col-span-2">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#07152E] px-5 text-[11px] font-black text-white transition hover:bg-[#F7B548] hover:text-[#07152E] disabled:opacity-60"
            >
              {editingId ? (
                <Save size={15} />
              ) : (
                <Plus size={15} />
              )}
              {isPending
                ? "جاري الحفظ..."
                : editingId
                  ? "حفظ التعديلات"
                  : "إضافة الإعلان"}
            </button>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header className="flex items-center justify-between border-b border-slate-200 bg-[#F8FAFC] px-5 py-4">
          <div>
            <p className="text-[10px] font-black text-[#C88712]">
              إدارة المحتوى
            </p>
            <h2 className="text-[17px] font-black text-[#07152E]">
              الإعلانات الحالية
            </h2>
          </div>

          <Megaphone
            size={20}
            className="text-[#C88712]"
          />
        </header>

        {!announcements.length ? (
          <div className="px-6 py-16 text-center">
            <Megaphone className="mx-auto h-9 w-9 text-slate-300" />
            <p className="mt-3 text-sm font-black text-[#07152E]">
              لا توجد إعلانات بعد
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              أضف أول إعلان ليظهر في شريط المنصة.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {announcements.map(
              (item) => (
                <article
                  key={item.id}
                  className="grid gap-4 px-5 py-4 lg:grid-cols-[minmax(0,1fr)_170px_auto] lg:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#FFF4DF] px-2.5 py-1 text-[9px] font-black text-[#A66F09]">
                        {
                          TYPE_LABELS[
                            item.type
                          ]
                        }
                      </span>

                      <span
                        className={`rounded-full px-2.5 py-1 text-[9px] font-black ${
                          item.is_active
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {item.is_active
                          ? "نشط"
                          : "متوقف"}
                      </span>

                      <span className="text-[9px] font-bold text-slate-400">
                        ترتيب:
                        {" "}
                        {item.display_order}
                      </span>
                    </div>

                    <h3 className="mt-2 text-[14px] font-black text-[#07152E]">
                      {item.title}
                    </h3>

                    {item.title_en ? (
                      <p
                        dir="ltr"
                        className="mt-1 text-left text-[11px] font-black text-[#C88712]"
                      >
                        {item.title_en}
                      </p>
                    ) : null}

                    {item.description ? (
                      <p className="mt-1 line-clamp-2 text-[10px] font-semibold leading-5 text-slate-500">
                        {item.description}
                      </p>
                    ) : null}

                    {item.description_en ? (
                      <p
                        dir="ltr"
                        className="mt-1 line-clamp-2 text-left text-[10px] font-semibold leading-5 text-slate-400"
                      >
                        {item.description_en}
                      </p>
                    ) : null}
                  </div>

                  <div className="text-[9px] font-bold leading-5 text-slate-500">
                    <p className="flex items-center gap-1.5">
                      <CalendarClock
                        size={12}
                        className="text-[#C88712]"
                      />
                      البداية:
                      {" "}
                      {item.starts_at
                        ? new Date(
                            item.starts_at,
                          ).toLocaleString(
                            "ar-SA",
                          )
                        : "فورًا"}
                    </p>

                    <p className="mt-1 flex items-center gap-1.5">
                      <CalendarClock
                        size={12}
                        className="text-[#C88712]"
                      />
                      النهاية:
                      {" "}
                      {item.ends_at
                        ? new Date(
                            item.ends_at,
                          ).toLocaleString(
                            "ar-SA",
                          )
                        : "بدون تاريخ"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <ActionButton
                      title="تعديل"
                      onClick={() =>
                        editAnnouncement(
                          item,
                        )
                      }
                    >
                      <Edit3 size={14} />
                    </ActionButton>

                    <ActionButton
                      title={
                        item.is_active
                          ? "إيقاف"
                          : "تفعيل"
                      }
                      onClick={() =>
                        handleToggle(item)
                      }
                    >
                      {item.is_active ? (
                        <Power
                          size={14}
                        />
                      ) : (
                        <CheckCircle2
                          size={14}
                        />
                      )}
                    </ActionButton>

                    <ActionButton
                      title="حذف"
                      danger
                      onClick={() =>
                        handleDelete(item)
                      }
                    >
                      <Trash2 size={14} />
                    </ActionButton>
                  </div>
                </article>
              ),
            )}
          </div>
        )}
      </section>
    </div>
  );
}

const INPUT =
  "h-[42px] w-full rounded-xl border border-slate-200 bg-[#FAFBFC] px-3 text-[11px] font-semibold text-[#07152E] outline-none transition focus:border-[#F7B548] focus:bg-white";

function Field({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={className}>
      <span className="mb-1.5 block text-[10px] font-black text-[#07152E]">
        {label}
      </span>
      {children}
    </label>
  );
}

function Stat({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
      <p className="text-[10px] font-bold text-slate-500">
        {title}
      </p>
      <p className="mt-1 text-[24px] font-black text-[#07152E]">
        {value}
      </p>
    </div>
  );
}

function ActionButton({
  title,
  onClick,
  danger = false,
  children,
}: {
  title: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${
        danger
          ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
          : "border-slate-200 bg-white text-[#07152E] hover:border-[#F7B548]"
      }`}
    >
      {children}
    </button>
  );
}