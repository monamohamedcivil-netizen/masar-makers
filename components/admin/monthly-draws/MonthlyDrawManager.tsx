"use client";

import { FormEvent, useState, useTransition } from "react";
import {
  CalendarClock,
  CheckCircle2,
  Edit3,
  Gift,
  Plus,
  Save,
  Settings2,
  Trash2,
  Trophy,
  Users,
  X,
} from "lucide-react";

import {
  createMonthlyDraw,
  deleteMonthlyDraw,
  prepareMonthlyDrawParticipants,
  toggleMonthlyDrawPublished,
  updateMonthlyDraw,
  updateMonthlyDrawSettings,
  type MonthlyDraw,
  type MonthlyDrawParticipant,
  type MonthlyDrawSettings,
  type MonthlyDrawWinnerMode,
} from "@/lib/admin/monthly-draws";

type Props = {
  initialDraws: MonthlyDraw[];
  initialSettings: MonthlyDrawSettings | null;
  initialParticipantsByDraw: Record<
    string,
    MonthlyDrawParticipant[]
  >;
};

type DrawForm = {
  monthKey: string;
  title: string;
  prizeTitle: string;
  prizeDescription: string;
  prizeImageUrl: string;
  scheduledAt: string;
  winnerMode: MonthlyDrawWinnerMode;
  presetWinnerUserId: string;
  presetWinnerName: string;
  winnerSelectionNote: string;
  isPublished: boolean;
};

const INPUT =
  "h-[42px] w-full rounded-xl border border-slate-200 bg-[#FAFBFC] px-3 text-[11px] font-semibold text-[#07152E] outline-none transition focus:border-[#F7B548] focus:bg-white";

function toLocalInput(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function initialMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function initialSchedule() {
  const now = new Date();
  let date = new Date(now.getFullYear(), now.getMonth(), 1, 20, 0, 0);
  if (date <= now) date = new Date(now.getFullYear(), now.getMonth() + 1, 1, 20, 0, 0);
  return toLocalInput(date.toISOString());
}

const EMPTY_DRAW: DrawForm = {
  monthKey: initialMonth(),
  title: "سحب مكافآت Masar Makers الشهري",
  prizeTitle: "",
  prizeDescription: "",
  prizeImageUrl: "",
  scheduledAt: initialSchedule(),
  winnerMode: "random",
  presetWinnerUserId: "",
  presetWinnerName: "",
  winnerSelectionNote: "",
  isPublished: false,
};

const STATUS_LABELS: Record<MonthlyDraw["status"], string> = {
  draft: "مسودة",
  scheduled: "مجدول",
  countdown: "العد التنازلي",
  running: "جاري السحب",
  completed: "مكتمل",
  cancelled: "ملغي",
};

export default function MonthlyDrawManager({
  initialDraws,
  initialSettings,
  initialParticipantsByDraw,
}: Props) {
  const [draws, setDraws] = useState(initialDraws);

  const [participantsByDraw] = useState(
    initialParticipantsByDraw,
  );

  const [drawForm, setDrawForm] = useState<DrawForm>(EMPTY_DRAW);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [pointsPerEntry, setPointsPerEntry] = useState(
    initialSettings?.points_per_entry ?? 100,
  );
  const [countdownSeconds, setCountdownSeconds] = useState(
    initialSettings?.countdown_seconds ?? 5,
  );
  const [resultPopupDays, setResultPopupDays] = useState(
    initialSettings?.result_popup_days ?? 7,
  );
  const [isEnabled, setIsEnabled] = useState(
    initialSettings?.is_enabled ?? true,
  );

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const editingParticipants =
    editingId
      ? participantsByDraw[editingId] ?? []
      : [];

  const totalParticipants = draws.reduce(
    (sum, item) => sum + Number(item.total_participants ?? 0),
    0,
  );

  const totalEntries = draws.reduce(
    (sum, item) => sum + Number(item.total_entries ?? 0),
    0,
  );

  function resetForm() {
    setEditingId(null);
    setDrawForm(EMPTY_DRAW);
    setMessage("");
    setError("");
  }

  function editDraw(draw: MonthlyDraw) {
    setEditingId(draw.id);
    setDrawForm({
      monthKey: draw.month_key,
      title: draw.title,
      prizeTitle: draw.prize_title ?? "",
      prizeDescription: draw.prize_description ?? "",
      prizeImageUrl: draw.prize_image_url ?? "",
      scheduledAt: toLocalInput(draw.scheduled_at),
      winnerMode: draw.winner_mode,
      presetWinnerUserId: draw.preset_winner_user_id ?? "",
      presetWinnerName: draw.preset_winner_name ?? "",
      winnerSelectionNote: draw.winner_selection_note ?? "",
      isPublished: draw.is_published,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    startTransition(async () => {
      const result = await updateMonthlyDrawSettings({
        pointsPerEntry,
        countdownSeconds,
        resultPopupDays,
        isEnabled,
      });

      result.success ? setMessage(result.message) : setError(result.message);
    });
  }

  function saveDraw(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    startTransition(async () => {
      const common = {
        title: drawForm.title,
        prizeTitle: drawForm.prizeTitle,
        prizeDescription: drawForm.prizeDescription,
        prizeImageUrl: drawForm.prizeImageUrl,
        scheduledAt: drawForm.scheduledAt,
        winnerMode: drawForm.winnerMode,
        presetWinnerUserId: drawForm.presetWinnerUserId,
        presetWinnerName: drawForm.presetWinnerName,
        winnerSelectionNote: drawForm.winnerSelectionNote,
        isPublished: drawForm.isPublished,
      };

      const result = editingId
        ? await updateMonthlyDraw(editingId, common)
        : await createMonthlyDraw({
            ...common,
            monthKey: drawForm.monthKey,
          });

      if (!result.success) {
        setError(result.message);
        return;
      }

      setMessage(result.message);
      window.location.reload();
    });
  }

  function togglePublished(draw: MonthlyDraw) {
    startTransition(async () => {
      const result = await toggleMonthlyDrawPublished(
        draw.id,
        !draw.is_published,
      );

      if (!result.success) {
        setError(result.message);
        return;
      }

      setDraws((current) =>
        current.map((item) =>
          item.id === draw.id
            ? { ...item, is_published: !draw.is_published }
            : item,
        ),
      );

      setMessage(result.message);
    });
  }

  function removeDraw(draw: MonthlyDraw) {
    if (!window.confirm(`هل تريد حذف سحب ${draw.month_key}؟`)) return;

    startTransition(async () => {
      const result = await deleteMonthlyDraw(draw.id);

      if (!result.success) {
        setError(result.message);
        return;
      }

      setDraws((current) => current.filter((item) => item.id !== draw.id));
      setMessage(result.message);

      if (editingId === draw.id) resetForm();
    });
  }
function prepareParticipants(draw: MonthlyDraw) {
  setError("");
  setMessage("");

  startTransition(async () => {
    const result = await prepareMonthlyDrawParticipants(draw.id);

    if (!result.success) {
      setError(result.message);
      return;
    }

    setMessage(result.message);

    // نعيد تحميل البيانات حتى تظهر
    // أعداد المشاركين والفرص الجديدة مباشرة.
    window.location.reload();
  });
}
  return (
    <div dir="rtl" className="space-y-5">
      <section className="grid gap-3 sm:grid-cols-3">
        <Stat title="عدد السحوبات" value={draws.length} />
        <Stat title="إجمالي المشاركين" value={totalParticipants} />
        <Stat title="إجمالي فرص السحب" value={totalEntries} />
      </section>

      {(message || error) && (
        <div
          className={`rounded-xl border px-4 py-3 text-[11px] font-bold ${
            error
              ? "border-red-200 bg-red-50 text-red-600"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {error || message}
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <Header
          eyebrow="إعدادات عامة"
          title="إعدادات نظام السحب"
          icon={<Settings2 size={18} />}
        />

        <form
          onSubmit={saveSettings}
          className="grid gap-4 p-5 md:grid-cols-4"
        >
          <Field label="عدد النقاط لكل فرصة">
            <input
              type="number"
              min={1}
              value={pointsPerEntry}
              onChange={(e) => setPointsPerEntry(Number(e.target.value))}
              className={INPUT}
            />
          </Field>

          <Field label="مدة العد التنازلي">
            <input
              type="number"
              min={1}
              value={countdownSeconds}
              onChange={(e) => setCountdownSeconds(Number(e.target.value))}
              className={INPUT}
            />
          </Field>

          <Field label="ظهور نتيجة السحب تلقائيًا">
            <input
              type="number"
              min={1}
              value={resultPopupDays}
              onChange={(e) => setResultPopupDays(Number(e.target.value))}
              className={INPUT}
            />
          </Field>

          <label className="flex h-[42px] cursor-pointer items-center gap-3 self-end rounded-xl border border-slate-200 bg-[#FAFBFC] px-3">
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={(e) => setIsEnabled(e.target.checked)}
              className="h-4 w-4 accent-[#F7B548]"
            />
            <span className="text-[10px] font-black text-[#07152E]">
              نظام السحب مفعل
            </span>
          </label>

          <div className="flex justify-end md:col-span-4">
            <PrimaryButton disabled={isPending}>
              <Save size={15} />
              حفظ الإعدادات
            </PrimaryButton>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <Header
          eyebrow={editingId ? "تعديل السحب" : "سحب جديد"}
          title={editingId ? "تعديل بيانات سحب الشهر" : "إعداد سحب الشهر القادم"}
          icon={
            editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-[10px] font-black text-slate-600"
              >
                <X size={14} />
                إلغاء
              </button>
            ) : (
              <Gift size={18} />
            )
          }
        />

        <form
          onSubmit={saveDraw}
          className="grid gap-4 p-5 md:grid-cols-2"
        >
          <Field label="شهر السحب">
            <input
              type="month"
              value={drawForm.monthKey}
              disabled={Boolean(editingId)}
              onChange={(e) =>
                setDrawForm((s) => ({ ...s, monthKey: e.target.value }))
              }
              className={`${INPUT} disabled:bg-slate-100`}
            />
          </Field>

          <Field label="موعد السحب">
            <input
              type="datetime-local"
              value={drawForm.scheduledAt}
              onChange={(e) =>
                setDrawForm((s) => ({ ...s, scheduledAt: e.target.value }))
              }
              className={INPUT}
            />
          </Field>

          <Field label="عنوان السحب" className="md:col-span-2">
            <input
              value={drawForm.title}
              onChange={(e) =>
                setDrawForm((s) => ({ ...s, title: e.target.value }))
              }
              className={INPUT}
            />
          </Field>

          <Field label="جائزة الشهر">
            <input
              required
              value={drawForm.prizeTitle}
              onChange={(e) =>
                setDrawForm((s) => ({ ...s, prizeTitle: e.target.value }))
              }
              className={INPUT}
              placeholder="مثال: رحلة BIM for Roads مجانًا"
            />
          </Field>

          <Field label="رابط صورة الجائزة">
            <input
              value={drawForm.prizeImageUrl}
              onChange={(e) =>
                setDrawForm((s) => ({ ...s, prizeImageUrl: e.target.value }))
              }
              dir="ltr"
              className={`${INPUT} text-left`}
              placeholder="/images/draws/prize.png"
            />
          </Field>

          <Field label="وصف الجائزة" className="md:col-span-2">
            <textarea
              rows={2}
              value={drawForm.prizeDescription}
              onChange={(e) =>
                setDrawForm((s) => ({
                  ...s,
                  prizeDescription: e.target.value,
                }))
              }
              className={`${INPUT} h-auto min-h-[76px] py-3`}
            />
          </Field>

          <Field label="طريقة تحديد الفائز">
            <select
              value={drawForm.winnerMode}
              onChange={(e) =>
                setDrawForm((s) => ({
                  ...s,
                  winnerMode: e.target.value as MonthlyDrawWinnerMode,
                }))
              }
              className={INPUT}
            >
              <option value="random">سحب عشوائي</option>
              <option value="manual">فائز محدد</option>
            </select>
          </Field>

          <label className="flex h-[42px] cursor-pointer items-center gap-3 self-end rounded-xl border border-slate-200 bg-[#FAFBFC] px-3">
            <input
              type="checkbox"
              checked={drawForm.isPublished}
              onChange={(e) =>
                setDrawForm((s) => ({
                  ...s,
                  isPublished: e.target.checked,
                }))
              }
              className="h-4 w-4 accent-[#F7B548]"
            />
            <span className="text-[10px] font-black text-[#07152E]">
              نشر السحب على المنصة
            </span>
          </label>

          {drawForm.winnerMode === "manual" && (
            <>
              <Field
                label="الفائز المحدد"
                className="md:col-span-2"
              >
                {!editingId ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[10px] font-bold leading-6 text-amber-800">
                    أنشئي السحب أولًا، ثم اضغطي
                    «تجهيز المشاركين»، وبعدها افتحي
                    السحب للتعديل لاختيار الفائز من
                    قائمة المشاركين الفعلية.
                  </div>
                ) : editingParticipants.length === 0 ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[10px] font-bold leading-6 text-amber-800">
                    لا توجد قائمة مشاركين لهذا السحب
                    بعد. اضغطي «تجهيز المشاركين» أولًا
                    ثم عودي إلى التعديل.
                  </div>
                ) : (
                  <select
                    value={drawForm.presetWinnerUserId}
                    onChange={(e) => {
                      const selectedUserId =
                        e.target.value;

                      const selectedParticipant =
                        editingParticipants.find(
                          (participant) =>
                            participant.user_id ===
                            selectedUserId,
                        );

                      setDrawForm((s) => ({
                        ...s,
                        presetWinnerUserId:
                          selectedUserId,
                        presetWinnerName:
                          selectedParticipant
                            ?.student_name ?? "",
                      }));
                    }}
                    className={INPUT}
                  >
                    <option value="">
                      اختر الفائز من المشاركين...
                    </option>

                    {editingParticipants.map(
                      (participant) => (
                        <option
                          key={participant.user_id}
                          value={participant.user_id}
                        >
                          {participant.student_name}
                          {" — "}
                          {participant.entries_count}
                          {" فرصة"}
                        </option>
                      ),
                    )}
                  </select>
                )}
              </Field>

              <Field
                label="ملاحظة داخلية"
                className="md:col-span-2"
              >
                <textarea
                  rows={2}
                  value={drawForm.winnerSelectionNote}
                  onChange={(e) =>
                    setDrawForm((s) => ({
                      ...s,
                      winnerSelectionNote:
                        e.target.value,
                    }))
                  }
                  className={`${INPUT} h-auto min-h-[70px] py-3`}
                  placeholder="هذه الملاحظة للإدارة فقط ولا تظهر للمستخدمين."
                />
              </Field>
            </>
          )}

          <div className="flex justify-end md:col-span-2">
            <PrimaryButton disabled={isPending}>
              {editingId ? <Save size={15} /> : <Plus size={15} />}
              {editingId ? "حفظ التعديلات" : "إنشاء سحب الشهر"}
            </PrimaryButton>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <Header
          eyebrow="السحوبات"
          title="السحب الحالي والسحوبات السابقة"
          icon={<Trophy size={18} />}
        />

        {!draws.length ? (
          <div className="px-6 py-14 text-center text-sm font-black text-slate-400">
            لا توجد سحوبات بعد.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {draws.map((draw) => (
              <article
                key={draw.id}
                className="grid gap-4 px-5 py-4 lg:grid-cols-[minmax(0,1fr)_220px_150px_auto] lg:items-center"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#07152E] px-2.5 py-1 text-[9px] font-black text-[#F7B548]">
                      {draw.month_key}
                    </span>
                    <span className="rounded-full bg-[#FFF4DF] px-2.5 py-1 text-[9px] font-black text-[#A66F09]">
                      {STATUS_LABELS[draw.status]}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[9px] font-black ${
                        draw.is_published
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {draw.is_published ? "منشور" : "غير منشور"}
                    </span>
                  </div>

                  <h3 className="mt-2 text-[14px] font-black text-[#07152E]">
                    {draw.prize_title || draw.title}
                  </h3>

                  {draw.winner_name && (
                    <p className="mt-1 text-[10px] font-black text-emerald-700">
                      الفائز: {draw.winner_name}
                    </p>
                  )}

                  {!draw.winner_name &&
                    draw.winner_mode === "manual" &&
                    draw.preset_winner_name && (
                      <p className="mt-1 text-[10px] font-bold text-slate-500">
                        الفائز المحدد داخليًا:{" "}
                        <span className="font-black text-[#07152E]">
                          {draw.preset_winner_name}
                        </span>
                      </p>
                    )}
                </div>

                <div className="text-[9px] font-bold leading-5 text-slate-500">
                  <p className="flex items-center gap-1.5">
                    <CalendarClock size={12} className="text-[#C88712]" />
                    {new Date(draw.scheduled_at).toLocaleString("ar-SA")}
                  </p>
                  <p className="mt-1">
                    طريقة الاختيار:{" "}
                    <span className="font-black text-[#07152E]">
                      {draw.winner_mode === "manual" ? "فائز محدد" : "عشوائي"}
                    </span>
                  </p>
                </div>

                <div className="text-[10px] font-black text-[#07152E]">
                  <p>{draw.total_participants} مشارك</p>
                  <p className="mt-1">{draw.total_entries} فرصة</p>
                </div>

                <div className="flex items-center gap-2">
                 <ActionButton
  title="تجهيز المشاركين"
  onClick={() => prepareParticipants(draw)}
>
  <Users size={14} />
</ActionButton>
                  <ActionButton title="تعديل" onClick={() => editDraw(draw)}>
                    <Edit3 size={14} />
                  </ActionButton>

                  <ActionButton
                    title={draw.is_published ? "إخفاء" : "نشر"}
                    onClick={() => togglePublished(draw)}
                  >
                    <CheckCircle2 size={14} />
                  </ActionButton>

                  <ActionButton
                    title="حذف"
                    danger
                    onClick={() => removeDraw(draw)}
                  >
                    <Trash2 size={14} />
                  </ActionButton>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Header({
  eyebrow,
  title,
  icon,
}: {
  eyebrow: string;
  title: string;
  icon: React.ReactNode;
}) {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-slate-200 bg-[#F8FAFC] px-5 py-4">
      <div>
        <p className="text-[10px] font-black text-[#C88712]">{eyebrow}</p>
        <h2 className="mt-0.5 text-[18px] font-black text-[#07152E]">
          {title}
        </h2>
      </div>

      <span className="flex min-h-10 min-w-10 items-center justify-center rounded-xl bg-[#FFF4DF] px-2 text-[#C88712]">
        {icon}
      </span>
    </header>
  );
}

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

function Stat({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
      <p className="text-[10px] font-bold text-slate-500">{title}</p>
      <p className="mt-1 text-[24px] font-black text-[#07152E]">
        {Number(value).toLocaleString("en-US")}
      </p>
    </div>
  );
}

function PrimaryButton({
  children,
  disabled,
}: {
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#07152E] px-5 text-[11px] font-black text-white transition hover:bg-[#F7B548] hover:text-[#07152E] disabled:opacity-60"
    >
      {children}
    </button>
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