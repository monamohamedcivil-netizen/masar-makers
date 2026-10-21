"use client";

import { Bot, ExternalLink, Loader2, MessageCircle, X } from "lucide-react";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { FaWhatsapp } from "react-icons/fa";

import { startWebChat, webChatAct, type WebChatContext } from "@/lib/actions/webchat";
import { isWebChatEnabled, OPEN_EVENT, syncWebChatTestFlag } from "@/lib/webchat/client";
import type { ChatButton, ChatMessage } from "@/lib/webchat/engine";

/* Floating website chat (Masar Makers assistant). Same answers as the WhatsApp bot. */

const STORE = "mm_webchat_session";
const MODE = (process.env.NEXT_PUBLIC_WEBCHAT_MODE ?? "test").trim();
const DIRECT_WHATSAPP = `https://wa.me/201031885659?text=${encodeURIComponent("السلام عليكم، أرغب في الاستفسار عن منصة صناع المسار.")}`;

type Stored = { sessionId: string; token: string; code: string; messages: ChatMessage[] };

function RichText({ text }: { text: string }) {
  // *bold*, links and line breaks (WhatsApp-style formatting from the shared answers)
  return (
    <>
      {text.split("\n").map((line, li) => (
        <Fragment key={li}>
          {li > 0 && <br />}
          {line.split(/(\*[^*\n]+\*|https?:\/\/\S+)/g).map((part, pi) =>
            /^\*[^*]+\*$/.test(part) ? (
              <strong key={pi}>{part.slice(1, -1)}</strong>
            ) : /^https?:\/\//.test(part) ? (
              <a key={pi} href={part} target="_blank" rel="noopener noreferrer" className="break-all text-sky-700 underline" dir="ltr">
                {part}
              </a>
            ) : (
              <Fragment key={pi}>{part}</Fragment>
            ),
          )}
        </Fragment>
      ))}
    </>
  );
}

export default function WebChatWidget() {
  const [enabled, setEnabled] = useState(false);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<Stored | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const save = (next: Stored | null) => {
    setState(next);
    try {
      if (next) sessionStorage.setItem(STORE, JSON.stringify(next));
      else sessionStorage.removeItem(STORE);
    } catch {
      /* ignore */
    }
  };

  const start = useCallback(async (context: WebChatContext) => {
    setOpen(true);
    setBusy(true);
    setError(null);
    const visitorFirst: ChatMessage[] = context.text ? [{ from: "visitor", text: context.text }] : [];
    setState({ sessionId: "", token: "", code: "", messages: visitorFirst });
    const result = await startWebChat(context);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    save({ sessionId: result.sessionId, token: result.token, code: result.code, messages: [...visitorFirst, ...result.messages] });
  }, []);

  useEffect(() => {
    syncWebChatTestFlag();
    setEnabled(isWebChatEnabled());
    try {
      const raw = sessionStorage.getItem(STORE);
      if (raw) setState(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    const onOpen = (event: Event) => void start(((event as CustomEvent).detail ?? {}) as WebChatContext);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, [start]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [state?.messages.length, busy, open]);

  const press = async (button: ChatButton) => {
    if (!state?.sessionId || busy) return;
    if (button.kind === "link" && button.url) {
      window.open(button.url, "_blank", "noopener,noreferrer");
      return; // links (WhatsApp hand-off, course pages) open directly
    }
    const withChoice: Stored = { ...state, messages: [...state.messages, { from: "visitor", text: button.label }] };
    save(withChoice);
    setBusy(true);
    setError(null);
    const result = await webChatAct(state.sessionId, state.token, button.id, button.label);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    save({ ...withChoice, messages: [...withChoice.messages, ...result.messages] });
  };

  if (!enabled) return null;

  const messages = state?.messages ?? [];
  const lastBotIndex = messages.map((m) => m.from).lastIndexOf("bot");

  return (
    <div dir="rtl" className="fixed bottom-4 left-4 z-[250] font-sans">
      {open && (
        <div className="fixed inset-x-2 bottom-2 top-16 flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:inset-auto sm:bottom-20 sm:left-4 sm:h-[560px] sm:w-[380px]">
          <header className="flex items-center gap-3 bg-[#07152E] px-4 py-3 text-white">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F7B548] text-[#07152E]">
              <Bot className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-black">مساعد Masar Makers</div>
              <div className="text-xs text-slate-300">
                رد فوري على أسئلتك عن الكورسات والأسعار{MODE === "test" ? " • وضع التجربة" : ""}
              </div>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-1 text-slate-300 hover:bg-white/10" aria-label="إغلاق">
              <X className="h-5 w-5" />
            </button>
          </header>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[#F4F1EA] px-3 py-4 text-sm">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.from === "visitor" ? "justify-start" : "justify-end"}`}>
                <div className="max-w-[88%] space-y-2">
                  <div
                    className={`rounded-2xl px-3 py-2 leading-relaxed shadow-sm ${
                      m.from === "visitor" ? "rounded-tr-sm bg-[#07152E] text-white" : "rounded-tl-sm bg-white text-slate-800"
                    }`}
                  >
                    <RichText text={m.text} />
                  </div>
                  {m.from === "bot" && m.buttons && m.buttons.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {m.buttons.map((b) => (
                        <button
                          key={b.id + b.label}
                          type="button"
                          disabled={i !== lastBotIndex || busy}
                          onClick={() => void press(b)}
                          className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-bold transition disabled:cursor-default disabled:opacity-40 ${
                            b.id === "whatsapp"
                              ? "border-[#25D366] bg-[#25D366] text-white hover:brightness-95"
                              : b.kind === "handoff"
                                ? "border-[#F7B548] bg-[#F7B548] text-[#07152E] hover:brightness-95"
                                : "border-[#07152E]/20 bg-white text-[#07152E] hover:bg-[#07152E] hover:text-white"
                          }`}
                        >
                          {b.id === "whatsapp" && <FaWhatsapp className="h-4 w-4" />}
                          {b.label}
                          {b.kind === "link" && b.id !== "whatsapp" && <ExternalLink className="h-3 w-3" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex justify-end">
                <span className="inline-flex items-center gap-1.5 rounded-2xl bg-white px-3 py-2 text-xs text-slate-500 shadow-sm">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  المساعد يكتب…
                </span>
              </div>
            )}
            {error && <div className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}
            <div ref={bottomRef} />
          </div>

          <footer className="flex items-center justify-between gap-2 border-t border-slate-200 px-3 py-2 text-[11px] text-slate-500">
            <button type="button" onClick={() => void start({ source: "restart" })} className="font-bold text-[#07152E] hover:underline">
              محادثة جديدة
            </button>
            <a href={DIRECT_WHATSAPP} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-[#25D366]">
              <FaWhatsapp className="h-3.5 w-3.5" />
              تواصل عبر واتساب مباشرة
            </a>
          </footer>
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          if (open) return setOpen(false);
          if (state?.sessionId) return setOpen(true);
          void start({ source: "launcher" });
        }}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#07152E] text-[#F7B548] shadow-xl ring-2 ring-[#F7B548]/60 transition hover:scale-105"
        aria-label="مساعد Masar Makers"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );
}
