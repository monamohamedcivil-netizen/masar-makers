"use client";

import {
  Bot,
  Check,
  CheckCheck,
  ChevronRight,
  Clock,
  Hand,
  Loader2,
  MessageCircle,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Smartphone,
  TriangleAlert,
  UserRound,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";

import {
  getConversationMessages,
  getInboxSnapshot,
  sendAdminReply,
  setConversationMode,
  setKnownContact,
  updateRouting,
  type InboxConversation,
  type InboxMessage,
  type InboxSnapshot,
} from "@/lib/actions/whatsapp-inbox";

import PushToggle from "./PushToggle";

const POLL_MS = 4000;

function formatTime(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const today = new Date();
  const sameDay = date.toDateString() === today.toDateString();
  return new Intl.DateTimeFormat("ar-EG", sameDay
    ? { hour: "numeric", minute: "2-digit" }
    : { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" },
  ).format(date);
}

function displayPhone(phone: string) {
  return `+${phone}`;
}

const SENDER_LABEL: Record<InboxMessage["sender"], string> = {
  customer: "العميل",
  bot: "البوت",
  admin: "أنتِ (من المنصة)",
  admin_phone: "أنتِ (من الجوال)",
};

function StatusTicks({ status }: { status: string | null }) {
  if (status === "read") return <CheckCheck className="h-3.5 w-3.5 text-sky-500" />;
  if (status === "delivered") return <CheckCheck className="h-3.5 w-3.5 text-slate-400" />;
  if (status === "failed") return <TriangleAlert className="h-3.5 w-3.5 text-red-500" />;
  return <Check className="h-3.5 w-3.5 text-slate-400" />;
}

export default function WhatsAppInbox({ initial, initialPhone = null }: { initial: InboxSnapshot; initialPhone?: string | null }) {
  const [snapshot, setSnapshot] = useState<InboxSnapshot>(initial);
  const [selected, setSelected] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [routingDraft, setRoutingDraft] = useState({
    mode: initial.routing.mode,
    testNumbers: initial.routing.testNumbers.join("\n"),
    knownNumbers: initial.routing.knownNumbers.join("\n"),
  });
  const [routingNote, setRoutingNote] = useState<string | null>(null);
  const [sendMenuOnHandoff, setSendMenuOnHandoff] = useState(true);
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastCountRef = useRef(0);

  const refreshList = useCallback(async () => {
    try {
      setSnapshot(await getInboxSnapshot());
    } catch (err) {
      console.error(err);
    }
  }, []);

  const refreshThread = useCallback(async (phone: string) => {
    try {
      const rows = await getConversationMessages(phone);
      setMessages(rows);
    } catch (err) {
      console.error(err);
    }
  }, []);

  // Live updates: poll list + open conversation.
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState !== "visible") return;
      void refreshList();
      if (selected) void refreshThread(selected);
    };
    const id = window.setInterval(tick, POLL_MS);
    return () => window.clearInterval(id);
  }, [selected, refreshList, refreshThread]);

  // Scroll to newest message when the thread grows.
  useEffect(() => {
    if (messages.length !== lastCountRef.current) {
      lastCountRef.current = messages.length;
      bottomRef.current?.scrollIntoView({ block: "end" });
    }
  }, [messages]);

  const openConversation = async (phone: string) => {
    setSelected(phone);
    setError(null);
    setDraft("");
    setLoadingThread(true);
    lastCountRef.current = 0;
    await refreshThread(phone);
    setLoadingThread(false);
    void refreshList();
  };

  // Opened from a phone notification: /admin/whatsapp-inbox?phone=...
  useEffect(() => {
    if (initialPhone) void openConversation(initialPhone.replace(/\D/g, ""));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPhone]);

  const current: InboxConversation | undefined = useMemo(
    () => snapshot.conversations.find((c) => c.phone === selected),
    [snapshot, selected],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return snapshot.conversations;
    return snapshot.conversations.filter(
      (c) =>
        c.phone.includes(q.replace(/[^\d]/g, "") || "~") ||
        (c.contactName ?? "").toLowerCase().includes(q) ||
        (c.lastMessage ?? "").toLowerCase().includes(q),
    );
  }, [snapshot, query]);

  const waitingCount = snapshot.conversations.filter((c) => c.mode === "human").length;

  const send = () => {
    if (!selected || !draft.trim()) return;
    const text = draft;
    setError(null);
    startTransition(async () => {
      const result = await sendAdminReply(selected, text);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDraft("");
      await Promise.all([refreshThread(selected), refreshList()]);
    });
  };

  const toggleMode = (mode: "bot" | "human") => {
    if (!selected) return;
    setError(null);
    startTransition(async () => {
      const result = await setConversationMode(selected, mode, { sendMenu: mode === "bot" && sendMenuOnHandoff });
      if (!result.ok) setError(result.error);
      await Promise.all([refreshList(), refreshThread(selected)]);
    });
  };

  const toggleKnown = (known: boolean) => {
    if (!selected) return;
    startTransition(async () => {
      const result = await setKnownContact(selected, known);
      if (!result.ok) setError(result.error);
      await refreshList();
    });
  };

  const saveRouting = () => {
    setRoutingNote(null);
    startTransition(async () => {
      const result = await updateRouting(routingDraft);
      setRoutingNote(result.ok ? "تم الحفظ ✅" : result.error);
      await refreshList();
    });
  };

  const modeLabel = { off: "البوت متوقف للجميع", test: "وضع التجربة: البوت يرد على أرقام التجربة فقط", live: "البوت يرد تلقائيًا على الرسائل الجديدة" } as const;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-bold ${
            !snapshot.botEnabled || snapshot.routing.mode === "off"
              ? "bg-red-50 text-red-700"
              : snapshot.routing.mode === "test"
                ? "bg-sky-50 text-sky-700"
                : "bg-emerald-50 text-emerald-700"
          }`}
        >
          <Bot className="h-4 w-4" />
          {!snapshot.botEnabled ? "البوت متوقف بالكامل (من إعدادات قوائم الشات والأسعار)" : modeLabel[snapshot.routing.mode]}
        </span>
        <button
          type="button"
          onClick={() => setShowSettings((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1 font-bold text-slate-700 hover:bg-slate-50"
        >
          <Settings2 className="h-4 w-4" />
          إعدادات البوت
        </button>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 font-bold text-amber-700">
          <Hand className="h-4 w-4" />
          {waitingCount} محادثة بيدك الآن
        </span>
        {snapshot.quota && (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-bold ${
              snapshot.quota.botPaused
                ? "bg-red-50 text-red-700"
                : snapshot.quota.used >= snapshot.quota.warnAt
                  ? "bg-amber-50 text-amber-700"
                  : "bg-slate-100 text-slate-600"
            }`}
            title="الحد المجاني من Meta لرسائل الرد شهريًا"
          >
            <MessageCircle className="h-4 w-4" />
            {snapshot.quota.used} / {snapshot.quota.free} رسالة مجانية هذا الشهر
            {snapshot.quota.botPaused ? " — الرد الآلي متوقف حتى الشهر القادم" : ""}
          </span>
        )}
        <span className="text-slate-500">
          عند ردّك يتوقف البوت لهذا العميل {snapshot.humanHours} ساعة. الجهات المعروفة لا يرد عليها البوت أبدًا إلا إذا حوّلتِها له.
        </span>
      </div>

      <PushToggle />

      {showSettings && (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm">
          <div className="font-black text-[#07152E]">من يرد على الرسائل الجديدة؟</div>
          <div className="flex flex-wrap gap-2">
            {(["off", "test", "live"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setRoutingDraft((d) => ({ ...d, mode: m }))}
                className={`rounded-xl border px-3 py-2 font-bold ${
                  routingDraft.mode === m ? "border-[#07152E] bg-[#07152E] text-white" : "border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {m === "off" ? "البوت متوقف للجميع" : m === "test" ? "تجربة على أرقام محددة" : "تشغيل للجميع"}
              </button>
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-1">
              <span className="font-bold text-slate-700">أرقام التجربة (البوت يرد عليها فقط في وضع التجربة)</span>
              <textarea
                dir="ltr"
                rows={4}
                value={routingDraft.testNumbers}
                onChange={(e) => setRoutingDraft((d) => ({ ...d, testNumbers: e.target.value }))}
                placeholder={"201xxxxxxxxx\n9665xxxxxxxx"}
                className="w-full rounded-xl border border-slate-200 p-2 font-mono text-xs outline-none focus:border-[#07152E]"
              />
            </label>
            <label className="block space-y-1">
              <span className="font-bold text-slate-700">جهات معروفة (محادثات قديمة — أنتِ ترد عليها دائمًا)</span>
              <textarea
                dir="ltr"
                rows={4}
                value={routingDraft.knownNumbers}
                onChange={(e) => setRoutingDraft((d) => ({ ...d, knownNumbers: e.target.value }))}
                placeholder="الصقي الأرقام هنا، رقم في كل سطر"
                className="w-full rounded-xl border border-slate-200 p-2 font-mono text-xs outline-none focus:border-[#07152E]"
              />
              <span className="text-xs text-slate-500">طلاب المنصة يُعتبرون جهات معروفة تلقائيًا (من أرقام الحسابات والمدفوعات).</span>
            </label>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={saveRouting}
              disabled={pending}
              className="rounded-xl bg-[#07152E] px-4 py-2 font-bold text-white disabled:opacity-60"
            >
              حفظ الإعدادات
            </button>
            {routingNote && <span className="text-xs text-slate-600">{routingNote}</span>}
          </div>
        </div>
      )}

      <div className="grid h-[72vh] min-h-[520px] overflow-hidden rounded-2xl border border-slate-200 bg-white md:grid-cols-[340px_1fr]">
        {/* Conversation list */}
        <aside
          className={`flex min-h-0 flex-col border-slate-200 md:border-l ${
            selected ? "hidden md:flex" : "flex"
          }`}
        >
          <div className="border-b border-slate-200 p-3">
            <label className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="بحث بالاسم أو الرقم أو الرسالة"
                className="w-full bg-transparent text-sm outline-none"
              />
            </label>
          </div>

          <ul className="min-h-0 flex-1 overflow-y-auto">
            {filtered.length === 0 && (
              <li className="p-6 text-center text-sm text-slate-500">
                لا توجد محادثات بعد. ستظهر هنا أول رسالة تصل للرقم.
              </li>
            )}
            {filtered.map((conversation) => (
              <li key={conversation.phone}>
                <button
                  type="button"
                  onClick={() => void openConversation(conversation.phone)}
                  className={`flex w-full items-start gap-3 border-b border-slate-100 px-3 py-3 text-right transition hover:bg-slate-50 ${
                    selected === conversation.phone ? "bg-slate-100" : ""
                  }`}
                >
                  <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#07152E] text-white">
                    <UserRound className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate font-black text-[#07152E]">
                        {conversation.contactName || displayPhone(conversation.phone)}
                      </span>
                      <span className="shrink-0 text-xs text-slate-400">
                        {formatTime(conversation.lastMessageAt)}
                      </span>
                    </span>
                    <span className="mt-0.5 flex items-center gap-2">
                      <span className="truncate text-sm text-slate-500">
                        {conversation.lastSender && conversation.lastSender !== "customer" ? "↩ " : ""}
                        {conversation.lastMessage ?? "—"}
                      </span>
                    </span>
                    <span className="mt-1 flex items-center gap-1.5">
                      {conversation.mode === "human" ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                          بيدك
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                          البوت
                        </span>
                      )}
                      {conversation.alwaysHuman && (
                        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-bold text-slate-700">معروف</span>
                      )}
                      {conversation.unread > 0 && (
                        <span className="rounded-full bg-[#F7B548] px-2 py-0.5 text-[11px] font-black text-[#07152E]">
                          {conversation.unread} جديدة
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* Thread */}
        <section className={`min-h-0 flex-col ${selected ? "flex" : "hidden md:flex"}`}>
          {!selected || !current ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center text-slate-500">
              <MessageCircle className="h-10 w-10 text-slate-300" />
              اختاري محادثة لعرض الرسائل والرد عليها.
            </div>
          ) : (
            <>
              <header className="flex flex-wrap items-center gap-3 border-b border-slate-200 px-4 py-3">
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 md:hidden"
                  aria-label="رجوع"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-black text-[#07152E]">
                    {current.contactName || displayPhone(current.phone)}
                  </div>
                  <div className="text-xs text-slate-500" dir="ltr">
                    {displayPhone(current.phone)}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5">
                  <div className="inline-flex overflow-hidden rounded-xl border border-slate-200 text-sm font-bold" role="group" aria-label="من يرد الآن">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => current.mode !== "human" && toggleMode("human")}
                      className={`inline-flex items-center gap-1.5 px-3 py-2 ${current.mode === "human" ? "bg-amber-500 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
                    >
                      <Hand className="h-4 w-4" />
                      أنا أرد
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => current.mode !== "bot" && toggleMode("bot")}
                      className={`inline-flex items-center gap-1.5 px-3 py-2 ${current.mode === "bot" ? "bg-emerald-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
                    >
                      <Bot className="h-4 w-4" />
                      البوت يرد
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-3 text-[11px] text-slate-500">
                    {current.mode === "human" && current.humanModeUntil && !current.alwaysHuman && (
                      <span className="inline-flex items-center gap-1 text-amber-700">
                        <Clock className="h-3.5 w-3.5" />
                        يعود البوت {formatTime(current.humanModeUntil)}
                      </span>
                    )}
                    <label className="inline-flex cursor-pointer items-center gap-1">
                      <input type="checkbox" checked={sendMenuOnHandoff} onChange={(e) => setSendMenuOnHandoff(e.target.checked)} />
                      أرسل زر القائمة عند التحويل للبوت
                    </label>
                    <label className="inline-flex cursor-pointer items-center gap-1">
                      <input type="checkbox" checked={current.alwaysHuman} disabled={pending} onChange={(e) => toggleKnown(e.target.checked)} />
                      <ShieldCheck className="h-3.5 w-3.5" />
                      جهة معروفة (أنا أرد دائمًا)
                    </label>
                  </div>
                </div>
              </header>

              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-[#F4F1EA] px-4 py-4">
                {loadingThread && (
                  <div className="flex justify-center py-6 text-slate-500">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                )}
                {messages.map((message) => {
                  const mine = message.direction === "out";
                  const human = message.sender === "admin" || message.sender === "admin_phone";
                  return (
                    <div key={message.id} className={`flex ${mine ? "justify-start" : "justify-end"}`}>
                      <div
                        className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                          !mine
                            ? "bg-white text-slate-800"
                            : human
                              ? "bg-[#07152E] text-white"
                              : "bg-[#DCF8C6] text-slate-800"
                        }`}
                      >
                        <div className={`mb-0.5 flex items-center gap-1 text-[11px] font-bold ${mine && human ? "text-[#F7B548]" : "text-slate-500"}`}>
                          {message.sender === "bot" && <Bot className="h-3 w-3" />}
                          {message.sender === "admin_phone" && <Smartphone className="h-3 w-3" />}
                          {SENDER_LABEL[message.sender]}
                        </div>
                        <div className="whitespace-pre-wrap break-words">{message.body}</div>
                        <div className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${mine && human ? "text-slate-300" : "text-slate-400"}`}>
                          {formatTime(message.createdAt)}
                          {mine && <StatusTicks status={message.status} />}
                        </div>
                        {message.statusError && (
                          <div className="mt-1 text-[11px] text-red-500">{message.statusError}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              <footer className="border-t border-slate-200 p-3">
                {!current.windowOpen && (
                  <div className="mb-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    مرّ أكثر من 24 ساعة على آخر رسالة من العميل؛ واتساب لا يسمح بالرد الحر الآن إلا بقالب معتمد. سيُفتح الرد مجددًا عندما يراسلك العميل.
                  </div>
                )}
                {error && (
                  <div className="mb-2 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>
                )}
                <div className="flex items-end gap-2">
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        send();
                      }
                    }}
                    rows={2}
                    disabled={!current.windowOpen || pending}
                    placeholder="اكتبي ردّك… (Enter للإرسال، Shift+Enter لسطر جديد)"
                    className="min-h-[48px] flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#07152E] disabled:bg-slate-50"
                  />
                  <button
                    type="button"
                    onClick={send}
                    disabled={!current.windowOpen || pending || !draft.trim()}
                    className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#07152E] text-white hover:bg-[#0d2550] disabled:opacity-50"
                    aria-label="إرسال"
                  >
                    {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                  </button>
                </div>
                <p className="mt-1.5 text-[11px] text-slate-400">
                  إرسال رد من هنا يوقف البوت لهذا العميل تلقائيًا.
                </p>
              </footer>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
