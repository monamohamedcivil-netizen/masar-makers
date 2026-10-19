"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Mail, Search, Send } from "lucide-react";

import {
  getEmailQuota,
  listEmailPickerStudents,
  sendCustomEmail,
  type EmailCampaignRow,
  type EmailPickerStudent,
} from "@/lib/admin/custom-email";

type Props = {
  recentCampaigns: EmailCampaignRow[];
};

type AudienceMode = "all" | "selected" | "test";

const INPUT =
  "w-full rounded-xl border border-slate-200 bg-[#FAFBFC] px-3 text-[11px] font-semibold text-[#07152E] outline-none transition focus:border-[#F7B548] focus:bg-white";

const AUDIENCE_LABEL: Record<string, string> = {
  all: "كل الطلاب",
  selected: "طلاب محددون",
  test: "تجربة لي فقط",
};

export default function CustomEmailComposer({ recentCampaigns }: Props) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [buttonText, setButtonText] = useState("");
  const [buttonUrl, setButtonUrl] = useState("");
  const [mode, setMode] = useState<AudienceMode>("test");
  const [students, setStudents] = useState<EmailPickerStudent[] | null>(
    null,
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [quota, setQuota] = useState<{
    remaining: number;
    cap: number;
    configured: boolean;
  } | null>(null);
  const [feedback, setFeedback] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const [openCampaign, setOpenCampaign] = useState<string | null>(null);

  function applyTemplate(c: EmailCampaignRow) {
    setSubject(c.subject);
    setBody(c.body);
    setButtonText(c.button_text ?? "");
    setButtonUrl(c.button_url ?? "");
    setMode("test");
    setFeedback({
      ok: true,
      text: "تم تحميل الإيميل في النموذج. عدّلي ما تريدين ثم اختاري المستلمين وأرسلي.",
    });
    document
      .getElementById("custom-email-composer")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  useEffect(() => {
    getEmailQuota()
      .then(setQuota)
      .catch(() => setQuota(null));
  }, []);

  useEffect(() => {
    if (mode !== "selected" || students) return;

    listEmailPickerStudents()
      .then(setStudents)
      .catch(() => setStudents([]));
  }, [mode, students]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = students ?? [];

    if (!term) return list;

    return list.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        s.email.toLowerCase().includes(term),
    );
  }, [students, search]);

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((s) => selected.has(s.id));

  function toggleAll() {
    setSelected((current) => {
      const next = new Set(current);

      if (allFilteredSelected) {
        filtered.forEach((s) => next.delete(s.id));
      } else {
        filtered.forEach((s) => next.add(s.id));
      }

      return next;
    });
  }

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function submit() {
    setFeedback(null);

    if (!subject.trim() || !body.trim()) {
      setFeedback({ ok: false, text: "اكتبي عنوان الرسالة ونصها أولًا." });
      return;
    }

    if (mode === "selected" && selected.size === 0) {
      setFeedback({ ok: false, text: "اختاري طالبًا واحدًا على الأقل." });
      return;
    }

    const target =
      mode === "all"
        ? "كل الطلاب"
        : mode === "selected"
          ? `${selected.size} طالب`
          : "إيميلك أنتِ فقط (تجربة)";

    if (
      mode !== "test" &&
      !window.confirm(
        `سيتم إرسال هذا الإيميل إلى ${target}، ولا يمكن التراجع بعد الإرسال. هل تريدين المتابعة؟`,
      )
    ) {
      return;
    }

    startTransition(async () => {
      const result = await sendCustomEmail({
        subject,
        body,
        audience: mode,
        studentIds: mode === "selected" ? [...selected] : undefined,
        buttonText,
        buttonUrl,
      });

      setFeedback({ ok: result.success, text: result.message });
      router.refresh();
      getEmailQuota().then(setQuota).catch(() => undefined);

      if (result.success && mode !== "test") {
        setSubject("");
        setBody("");
        setButtonText("");
        setButtonUrl("");
        setSelected(new Set());
      }
    });
  }

  return (
    <section id="custom-email-composer" className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header className="flex items-center justify-between gap-4 border-b border-slate-200 bg-[#F8FAFC] px-5 py-4">
        <div>
          <p className="text-[10px] font-black text-[#C88712]">
            إيميل مخصص
          </p>
          <h2 className="mt-0.5 text-[18px] font-black text-[#07152E]">
            إرسال إيميل لكل الطلاب أو لطلاب محددين
          </h2>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF4DF] text-[#C88712]">
          <Mail size={18} />
        </span>
      </header>

      <div className="grid gap-4 p-5">
        {quota && (
          <p
            className={`rounded-xl border px-4 py-3 text-[11px] font-bold ${
              quota.configured
                ? "border-slate-200 bg-slate-50 text-slate-600"
                : "border-red-200 bg-red-50 text-red-600"
            }`}
          >
            {quota.configured
              ? `المتبقي اليوم من الحد المجاني: ${quota.remaining} إيميل من ${quota.cap}.`
              : "خدمة الإرسال (Brevo) غير مفعّلة بعد، لن يعمل الإرسال حتى تُضاف."}
          </p>
        )}

        <label>
          <span className="mb-1.5 block text-[10px] font-black text-[#07152E]">
            عنوان الرسالة
          </span>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            maxLength={150}
            className={`${INPUT} h-[42px]`}
            placeholder="مثال: خصم خاص لطلاب مسار ميكرز"
          />
        </label>

        <label>
          <span className="mb-1.5 block text-[10px] font-black text-[#07152E]">
            نص الرسالة
          </span>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={8000}
            className={`${INPUT} min-h-[140px] py-3`}
            placeholder="اكتبي رسالتك هنا. السطور الجديدة تظهر كما هي. سيظهر اسم كل طالب تلقائيًا في التحية."
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label>
            <span className="mb-1.5 block text-[10px] font-black text-[#07152E]">
              نص الزر (اختياري)
            </span>
            <input
              value={buttonText}
              onChange={(e) => setButtonText(e.target.value)}
              className={`${INPUT} h-[42px]`}
              placeholder="مثال: سجّلي الآن"
            />
          </label>
          <label>
            <span className="mb-1.5 block text-[10px] font-black text-[#07152E]">
              رابط الزر (اختياري، بدونه لا يظهر زر)
            </span>
            <input
              value={buttonUrl}
              onChange={(e) => setButtonUrl(e.target.value)}
              className={`${INPUT} h-[42px] text-left`}
              dir="ltr"
              placeholder="https://masarmakers.com/courses"
            />
          </label>
        </div>

        <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
          <p className="text-[11px] font-black text-[#07152E]">
            إلى من سيُرسل؟
          </p>

          {(["test", "all", "selected"] as AudienceMode[]).map((value) => (
            <label
              key={value}
              className="flex cursor-pointer items-center gap-3"
            >
              <input
                type="radio"
                name="email-audience"
                checked={mode === value}
                onChange={() => setMode(value)}
                className="h-4 w-4 accent-[#F7B548]"
              />
              <span className="text-[11px] font-bold text-[#07152E]">
                {value === "test"
                  ? "تجربة: أرسله لإيميلي أنا فقط (أنصح بالبدء بها)"
                  : value === "all"
                    ? "كل الطلاب"
                    : "طلاب أحددهم بنفسي"}
              </span>
            </label>
          ))}

          {mode === "selected" && (
            <div className="space-y-2 pt-1">
              <div className="relative">
                <Search
                  size={14}
                  className="pointer-events-none absolute right-3 top-3 text-slate-400"
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={`${INPUT} h-[40px] pr-9`}
                  placeholder="ابحثي بالاسم أو الإيميل"
                />
              </div>

              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-amber-200 bg-white px-3 py-2">
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  onChange={toggleAll}
                  disabled={filtered.length === 0}
                  className="h-4 w-4 accent-[#F7B548]"
                />
                <span className="text-[11px] font-black text-[#07152E]">
                  {search.trim()
                    ? `تحديد كل نتائج البحث (${filtered.length})`
                    : `تحديد الكل (${filtered.length})`}
                  {" — ثم أزيلي علامة من لا تريدين الإرسال له"}
                </span>
              </label>

              <div className="max-h-80 divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200 bg-white">
                {students === null ? (
                  <p className="p-4 text-[11px] font-bold text-slate-500">
                    جارٍ تحميل الطلاب...
                  </p>
                ) : filtered.length === 0 ? (
                  <p className="p-4 text-[11px] font-bold text-slate-500">
                    لا نتائج.
                  </p>
                ) : (
                  filtered.map((student) => (
                    <label
                      key={student.id}
                      className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-slate-50"
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(student.id)}
                        onChange={() => toggle(student.id)}
                        className="h-4 w-4 accent-[#F7B548]"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[11px] font-black text-[#07152E]">
                          {student.name}
                        </span>
                        <span
                          dir="ltr"
                          className="block truncate text-right text-[10px] font-semibold text-slate-500"
                        >
                          {student.email}
                        </span>
                      </span>
                    </label>
                  ))
                )}
              </div>

              <p className="text-[10px] font-bold text-slate-500">
                المختارون: {selected.size}
                {students ? ` من ${students.length} طالب` : ""}
              </p>
            </div>
          )}
        </div>

        {feedback && (
          <div
            className={`rounded-xl border px-4 py-3 text-[11px] font-bold ${
              feedback.ok
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-red-50 text-red-600"
            }`}
          >
            {feedback.text}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={submit}
            disabled={pending}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#07152E] px-5 text-[11px] font-black text-white transition hover:bg-[#F7B548] hover:text-[#07152E] disabled:opacity-60"
          >
            <Send size={14} />
            {pending ? "جارٍ الإرسال..." : "إرسال الإيميل"}
          </button>
        </div>

        {recentCampaigns.length > 0 && (
          <div className="border-t border-slate-100 pt-4">
            <p className="mb-2 text-[11px] font-black text-[#07152E]">
              آخر الإيميلات المرسلة
            </p>
            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
              {recentCampaigns.map((c) => (
                <div key={c.id} className="px-3 py-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setOpenCampaign(
                          openCampaign === c.id ? null : c.id,
                        )
                      }
                      className="text-right text-[11px] font-black text-[#07152E] underline-offset-2 hover:underline"
                    >
                      {c.subject}
                    </button>
                    <span className="text-[10px] font-bold text-slate-500">
                      {AUDIENCE_LABEL[c.audience] ?? c.audience} — وصل{" "}
                      {c.sent_count}
                      {c.failed_count > 0
                        ? ` / فشل ${c.failed_count}`
                        : ""}{" "}
                      — {new Date(c.created_at).toLocaleString("ar-EG")}
                    </span>
                  </div>

                  {openCampaign === c.id && (
                    <div className="mt-2 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <p className="whitespace-pre-wrap text-[11px] font-semibold leading-6 text-[#07152E]">
                        {c.body}
                      </p>
                      {c.button_url && (
                        <p className="text-[10px] font-bold text-slate-500">
                          الزر: {c.button_text || "فتح الرابط"} →{" "}
                          <span dir="ltr">{c.button_url}</span>
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={() => applyTemplate(c)}
                        className="inline-flex h-8 items-center rounded-lg bg-[#07152E] px-3 text-[10px] font-black text-white transition hover:bg-[#F7B548] hover:text-[#07152E]"
                      >
                        استخدام كقالب (تعديل وإرسال)
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
