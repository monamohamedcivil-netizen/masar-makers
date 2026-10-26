"use client";

import { ChevronDown, ChevronUp, Loader2, Lock, RefreshCw, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useMemo, useState, useTransition } from "react";

import PushToggle from "@/components/admin/whatsapp/PushToggle";
import {
  getWebChatTranscript,
  saveWebChatEntry,
  saveWebChatFollowupSettings,
  setWebChatCurrency,
  setWebChatFollowup,
  setWebChatQuestionVisibility,
  type WebChatAdminData,
  type WebChatRow,
} from "@/lib/actions/webchat-admin";

const SOURCE: Record<string, string> = {
  contact: "زر التواصل",
  course_action: "زر داخل الكورس",
  enrollment: "طلب اشتراك",
  launcher: "زر المساعد",
  restart: "زر المساعد",
};
const HANDOFF: Record<string, string> = { subscribe: "🟢 اشتراك", support: "🆘 خدمة العملاء", other_currency: "🌍 عملة أخرى" };
const CLOSED: Record<string, string> = { no_reply: "لم يرد على المتابعات", admin: "أُغلقت يدويًا", new_chat: "بدأ محادثة أحدث" };
const SET_BY: Record<string, string> = { student: "اختارها الطالب", admin: "عدّلتِها يدويًا", payments: "من المدفوعات", country: "طالب من السعودية (البلد أو الرقم)" };

const fmt = (v: string | null) =>
  v ? new Intl.DateTimeFormat("ar-EG", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(new Date(v)) : "—";

function Transcript({ sessionId }: { sessionId: string }) {
  const [items, setItems] = useState<{ from: "bot" | "visitor"; text: string; at: string }[] | null>(null);
  useEffect(() => {
    void getWebChatTranscript(sessionId).then(setItems);
  }, [sessionId]);
  if (!items) return <div className="flex items-center gap-2 p-4 text-xs text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> تحميل المحادثة…</div>;
  return (
    <div className="max-h-96 space-y-2 overflow-y-auto bg-[#F4F1EA] p-4 text-xs">
      {items.map((m, i) => (
        <div key={i} className={`flex ${m.from === "visitor" ? "justify-start" : "justify-end"}`}>
          <div className={`max-w-[80%] whitespace-pre-wrap rounded-xl px-3 py-2 ${m.from === "visitor" ? "bg-[#07152E] text-white" : "bg-white text-slate-800"}`}>
            {m.text.replace(/\*/g, "")}
            <div className="mt-1 text-[10px] opacity-60">{fmt(m.at)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function WebChatAdmin({ data, focusId }: { data: WebChatAdminData; focusId: string | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [openId, setOpenId] = useState<string | null>(focusId);
  const [filter, setFilter] = useState<"all" | "active" | "handoff">("all");
  const [note, setNote] = useState<string | null>(null);
  const [entries, setEntries] = useState(data.entries);
  const [follow, setFollow] = useState({ ...data.followup, text: data.followup.messages.join("\n---\n") });

  const run = (fn: () => Promise<{ ok: true } | { ok: false; error: string }>, ok = "تم الحفظ ✅") =>
    startTransition(async () => {
      const result = await fn();
      setNote(result.ok ? ok : result.error);
      if (result.ok) router.refresh();
    });

  const rows = useMemo(
    () =>
      data.rows.filter((r) => (filter === "active" ? r.followupStatus === "active" : filter === "handoff" ? Boolean(r.handoffReason) : true)),
    [data.rows, filter],
  );

  const stats = {
    total: data.rows.length,
    members: data.rows.filter((r) => r.isMember).length,
    active: data.rows.filter((r) => r.followupStatus === "active").length,
    subscribe: data.rows.filter((r) => r.handoffReason === "subscribe").length,
  };

  const followCell = (r: WebChatRow) => {
    if (r.followupStatus === "active")
      return (
        <div className="space-y-1">
          <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 font-bold text-emerald-800">متابعة {r.followupCount}/{data.followup.max}</span>
          <div className="text-[11px] text-slate-500">القادمة: {fmt(r.followupNextAt)}</div>
          <button type="button" disabled={pending} onClick={() => run(() => setWebChatFollowup(r.id, "closed"), "تم إغلاق المتابعة ✅")} className="text-[11px] font-bold text-red-700 hover:underline">
            إغلاق المتابعة
          </button>
        </div>
      );
    return (
      <div className="space-y-1">
        <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 font-bold text-slate-600">{r.followupStatus === "closed" ? "مغلق" : "لا يوجد"}</span>
        {r.followupClosedReason && <div className="text-[11px] text-slate-500">{CLOSED[r.followupClosedReason] ?? r.followupClosedReason}</div>}
        <button type="button" disabled={pending} onClick={() => run(() => setWebChatFollowup(r.id, "active"), "تم تشغيل المتابعة ✅")} className="text-[11px] font-bold text-[#07152E] hover:underline">
          تشغيل المتابعة
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6 text-sm" dir="rtl">
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          ["كل المحادثات", stats.total],
          ["طلاب مسجّلين", stats.members],
          ["في المتابعة", stats.active],
          ["طلبات اشتراك", stats.subscribe],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-xs text-slate-500">{label}</div>
            <div className="text-2xl font-black text-[#07152E]">{value}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {(["all", "active", "handoff"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full border px-3 py-1.5 text-xs font-bold ${filter === f ? "border-[#07152E] bg-[#07152E] text-white" : "border-slate-200 bg-white text-slate-700"}`}
          >
            {f === "all" ? "الكل" : f === "active" ? "في المتابعة" : "اتحوّلوا لواتساب"}
          </button>
        ))}
        <button type="button" onClick={() => router.refresh()} className="mr-auto inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700">
          <RefreshCw className="h-3.5 w-3.5" /> تحديث
        </button>
        <PushToggle />
      </div>
      {note && <div className="rounded-xl bg-slate-100 px-3 py-2 text-xs text-slate-700">{note}</div>}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full min-w-[1100px] text-right text-xs">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="p-3">الطالب</th>
              <th className="p-3">بدأ من</th>
              <th className="p-3">الكورس</th>
              <th className="p-3">العملة</th>
              <th className="p-3">آخر سعر ظهر له</th>
              <th className="p-3">التحويل لواتساب</th>
              <th className="p-3">المتابعة</th>
              <th className="p-3">آخر نشاط</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <Fragment key={r.id}>
                <tr className={`border-t border-slate-100 align-top ${r.id === focusId ? "bg-amber-50" : ""}`}>
                  <td className="p-3">
                    <div className="font-bold text-[#07152E]">{r.name || (r.isMember ? "طالب مسجّل" : "زائر غير مسجّل")}</div>
                    {r.email && <div className="text-slate-500" dir="ltr">{r.email}</div>}
                    {r.phone && <div className="text-slate-500" dir="ltr">{r.phone}</div>}
                    <div className="font-mono text-[10px] text-slate-400">{r.code}</div>
                  </td>
                  <td className="p-3">{SOURCE[r.source ?? ""] ?? r.source ?? "—"}</td>
                  <td className="p-3">{r.course ?? "—"}</td>
                  <td className="p-3">
                    {r.contactId ? (
                      <div className="space-y-1">
                        <select
                          value={r.currency ?? ""}
                          disabled={pending}
                          onChange={(e) => run(() => setWebChatCurrency(r.contactId!, e.target.value || null), "تم تغيير عملة الطالب ✅")}
                          className="rounded-lg border border-slate-200 px-2 py-1"
                        >
                          <option value="">— لم تُحدد —</option>
                          {data.currencies.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                        {r.currencySetBy && <div className="text-[10px] text-slate-400">{SET_BY[r.currencySetBy] ?? r.currencySetBy}</div>}
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="p-3">{r.lastPrice ?? "—"}</td>
                  <td className="p-3">
                    {r.handoffReason ? (
                      <div>
                        <div className="font-bold">{HANDOFF[r.handoffReason] ?? r.handoffReason}</div>
                        <div className="text-[11px] text-slate-500">{fmt(r.handedOffAt)}</div>
                        <div className="text-[11px] text-slate-500">{r.whatsappPhone ? "✅ وصلت رسالته" : "⏳ لم يرسل بعد"}</div>
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="p-3">{followCell(r)}</td>
                  <td className="p-3">{fmt(r.lastActivityAt)}</td>
                  <td className="p-3">
                    <button type="button" onClick={() => setOpenId(openId === r.id ? null : r.id)} className="inline-flex items-center gap-1 font-bold text-[#07152E]">
                      المحادثة {openId === r.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>
                  </td>
                </tr>
                {openId === r.id && (
                  <tr>
                    <td colSpan={9} className="p-0">
                      <Transcript sessionId={r.id} />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={9} className="p-8 text-center text-slate-500">لا توجد محادثات بعد.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <details className="rounded-2xl border border-slate-200 bg-white p-4">
        <summary className="cursor-pointer font-black text-[#07152E]">
          <Lock className="ml-1 inline h-4 w-4" /> أسئلة البوت: تظهر إجابتها للكل أم للمسجّلين فقط
        </summary>
        <p className="mt-2 text-xs text-slate-500">الزائر غير المسجّل يرى السؤال، ولو كان «للمسجّلين فقط» تظهر له رسالة التسجيل بدل الإجابة. (يخص شات المنصة فقط.)</p>
        <table className="mt-3 w-full text-right text-xs">
          <tbody>
            {data.questions.map((q) => (
              <tr key={q.id} className="border-t border-slate-100">
                <td className="p-2 text-slate-500">{q.menu}</td>
                <td className="p-2 font-bold">{q.label}</td>
                <td className="p-2">
                  <select
                    value={q.visibility}
                    disabled={pending}
                    onChange={(e) => run(() => setWebChatQuestionVisibility(q.id, e.target.value as "all" | "members"))}
                    className="rounded-lg border border-slate-200 px-2 py-1"
                  >
                    <option value="all">يظهر للكل (مسجّل وزائر)</option>
                    <option value="members">للمسجّلين فقط</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>

      <details className="rounded-2xl border border-slate-200 bg-white p-4">
        <summary className="cursor-pointer font-black text-[#07152E]">
          <Users className="ml-1 inline h-4 w-4" /> أول رسالة لكل زر
        </summary>
        <p className="mt-2 text-xs text-slate-500">بعدها يرد البوت تلقائيًا على سؤال الزر (بيانات الكورس أو السعر) ثم القائمة. {"{action}"} = اسم الزر، {"{course}"} = اسم الكورس.</p>
        <div className="mt-3 space-y-4">
          {entries.map((e, idx) => (
            <div key={e.key} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold">{e.label}</span>
                <label className="flex items-center gap-1 text-xs">
                  <input type="checkbox" checked={e.active} onChange={(ev) => setEntries((all) => all.map((x, i) => (i === idx ? { ...x, active: ev.target.checked } : x)))} />
                  مفعّلة
                </label>
              </div>
              <textarea
                rows={3}
                value={e.text}
                onChange={(ev) => setEntries((all) => all.map((x, i) => (i === idx ? { ...x, text: ev.target.value } : x)))}
                className="w-full rounded-xl border border-slate-200 p-2 outline-none focus:border-[#07152E]"
              />
              <button type="button" disabled={pending} onClick={() => run(() => saveWebChatEntry(e.key, e.text, e.active))} className="rounded-lg bg-[#07152E] px-3 py-1.5 text-xs font-bold text-white">
                حفظ
              </button>
            </div>
          ))}
        </div>
      </details>

      <details className="rounded-2xl border border-slate-200 bg-white p-4">
        <summary className="cursor-pointer font-black text-[#07152E]">إعدادات المتابعة</summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs font-bold">كل كام يوم</span>
            <input type="number" min={1} max={30} value={follow.everyDays} onChange={(e) => setFollow((f) => ({ ...f, everyDays: Number(e.target.value) }))} className="w-full rounded-xl border border-slate-200 p-2" />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-bold">عدد المتابعات قبل الإغلاق التلقائي</span>
            <input type="number" min={1} max={10} value={follow.max} onChange={(e) => setFollow((f) => ({ ...f, max: Number(e.target.value) }))} className="w-full rounded-xl border border-slate-200 p-2" />
          </label>
        </div>
        <label className="mt-3 block space-y-1">
          <span className="text-xs font-bold">رسائل المتابعة بالترتيب (افصلي بين كل رسالة بسطر فيه ---). {"{course}"} = اسم الكورس.</span>
          <textarea rows={8} value={follow.text} onChange={(e) => setFollow((f) => ({ ...f, text: e.target.value }))} className="w-full rounded-xl border border-slate-200 p-2" />
        </label>
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => saveWebChatFollowupSettings(follow.everyDays, follow.max, follow.text.split(/\n-{3,}\n/)))}
          className="mt-2 rounded-lg bg-[#07152E] px-3 py-1.5 text-xs font-bold text-white"
        >
          حفظ إعدادات المتابعة
        </button>
      </details>
    </div>
  );
}
