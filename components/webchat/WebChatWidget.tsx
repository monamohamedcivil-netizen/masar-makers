"use client";

import { Bot, ExternalLink, Loader2, MessageCircle, Play, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { FaWhatsapp } from "react-icons/fa";

import { loadWebChat, startWebChat, webChatAct, type WebChatContext } from "@/lib/actions/webchat";
import { isWebChatEnabled, OPEN_EVENT, syncWebChatTestFlag } from "@/lib/webchat/client";
import type { ChatButton, ChatMessage, Locale } from "@/lib/webchat/engine";

/* Floating platform chat (Masar Makers assistant). Choices only — no free typing. */

const STORE = "mm_webchat_session";
const VISITOR = "mm_webchat_visitor";
const MODE = (process.env.NEXT_PUBLIC_WEBCHAT_MODE ?? "test").trim();

const UI = {
  ar: {
    title: "مساعد Masar Makers",
    subtitle: "رد فوري على أسئلتك عن الكورسات والأسعار",
    test: " • وضع التجربة",
    close: "إغلاق",
    typing: "المساعد يكتب…",
    newChat: "محادثة جديدة",
    code: "كود المحادثة:",
    pick: "اختار من القوائم 👆",
    unavailable: "المحادثة غير متاحة. سجّل الدخول بنفس الحساب أو ابدأ محادثة جديدة.",
    zoom: "اضغط لتكبير الصورة",
    video: "فيديو المنصة",
  },
  en: {
    title: "Masar Makers Assistant",
    subtitle: "Instant answers about courses and prices",
    test: " • Test mode",
    close: "Close",
    typing: "The assistant is typing…",
    newChat: "New chat",
    code: "Chat code:",
    pick: "Choose from the menus 👆",
    unavailable: "This chat isn't available. Log in with the same account or start a new chat.",
    zoom: "Click to enlarge",
    video: "Platform video",
  },
} as const;

/** Platform language (same source as the language switch). */
function currentLocale(): Locale {
  try {
    const lang = document.documentElement.lang?.toLowerCase();
    if (lang?.startsWith("en")) return "en";
    if (lang?.startsWith("ar")) return "ar";
    const saved = window.localStorage.getItem("masar-locale") || document.cookie.match(/(?:^|;\s*)masar-locale=(\w+)/)?.[1];
    if (saved?.toLowerCase().startsWith("en")) return "en";
  } catch {
    /* ignore */
  }
  return "ar";
}

/** YouTube link → embeddable URL (null when it is not a YouTube link). */
function youtubeEmbed(url: string) {
  const id = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/))([\w-]{11})/)?.[1];
  return id ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1` : null;
}

function VideoModal({ url, onClose, closeLabel, title }: { url: string; onClose: () => void; closeLabel: string; title: string }) {
  const embed = youtubeEmbed(url);
  const direct = !embed && /\.(mp4|webm|ogg)(\?|$)/i.test(url);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 p-3 sm:p-6" onClick={onClose} role="dialog" aria-modal="true" aria-label={title}>
      <div className="relative w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={onClose} aria-label={closeLabel} className="absolute -top-11 end-0 inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-sm font-bold text-white hover:bg-white/20">
          <X className="h-4 w-4" /> {closeLabel}
        </button>
        <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-2xl">
          {embed ? (
            <iframe src={embed} title={title} className="h-full w-full" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
          ) : direct ? (
            <video src={url} className="h-full w-full" controls autoPlay playsInline />
          ) : (
            <div className="flex h-full items-center justify-center p-6 text-center">
              <a href={url} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-[#F7B548] px-5 py-3 font-black text-[#07152E]">
                {title}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ImageLightbox({ src, onClose, closeLabel }: { src: string; onClose: () => void; closeLabel: string }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/85 p-3" onClick={onClose} role="dialog" aria-modal="true">
      <button type="button" onClick={onClose} aria-label={closeLabel} className="absolute end-3 top-3 rounded-full bg-white/10 p-2 text-white hover:bg-white/20">
        <X className="h-5 w-5" />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="max-h-full max-w-full rounded-xl object-contain shadow-2xl" onClick={(e) => e.stopPropagation()} />
    </div>
  );
}

type Stored = { sessionId: string; token: string; code: string; messages: ChatMessage[] };

function storage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function visitorId() {
  const s = storage();
  let id = s?.getItem(VISITOR) ?? "";
  if (!/^[a-zA-Z0-9-]{8,64}$/.test(id)) {
    id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
    try {
      s?.setItem(VISITOR, id);
    } catch {
      /* ignore */
    }
  }
  return id;
}

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
  const searchParams = useSearchParams();
  const chatParam = searchParams.get("chat");
  const [enabled, setEnabled] = useState(false);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [unseen, setUnseen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<Stored | null>(null);
  const [locale, setLocale] = useState<Locale>("ar");
  const [video, setVideo] = useState<string | null>(null);
  const [zoom, setZoom] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const save = (next: Stored | null) => {
    setState(next);
    try {
      if (next) storage()?.setItem(STORE, JSON.stringify({ sessionId: next.sessionId, token: next.token, code: next.code }));
      else storage()?.removeItem(STORE);
    } catch {
      /* ignore */
    }
  };

  // Follow the platform language (also when the visitor switches it while the chat is open).
  useEffect(() => {
    const sync = () => setLocale(currentLocale());
    sync();
    window.addEventListener("masar:locale-change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("masar:locale-change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const ui = UI[locale];
  const rtl = locale === "ar";

  const reload = useCallback(async (sessionId: string, token: string | null, markSeen: boolean) => {
    const result = await loadWebChat(sessionId, token, markSeen);
    if (!result.ok) return false;
    save({ sessionId: result.sessionId, token: result.token, code: result.code, messages: result.messages });
    setUnseen(!markSeen && result.hasUnseen);
    return true;
  }, []);

  const start = useCallback(async (context: WebChatContext) => {
    setOpen(true);
    setBusy(true);
    setError(null);
    setUnseen(false);
    const visitorFirst: ChatMessage[] = context.text ? [{ from: "visitor", text: context.text }] : [];
    setState({ sessionId: "", token: "", code: "", messages: visitorFirst });
    const result = await startWebChat({
      ...context,
      locale: currentLocale(),
      visitorId: visitorId(),
      page: `${window.location.pathname}${window.location.search.replace(/([?&])(chat|webchat)=[^&]*/g, "$1").replace(/[?&]+$/, "")}`,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    save({ sessionId: result.sessionId, token: result.token, code: result.code, messages: [...visitorFirst, ...result.messages] });
    const pop = result.messages.find((m) => m.autoVideo)?.autoVideo;
    if (pop) setVideo(pop);
  }, []);

  // Enable + resume the saved chat.
  useEffect(() => {
    syncWebChatTestFlag();
    const on = isWebChatEnabled() || Boolean(chatParam);
    setEnabled(on);
    if (!on) return;
    let saved: { sessionId?: string; token?: string } = {};
    try {
      saved = JSON.parse(storage()?.getItem(STORE) ?? "{}");
    } catch {
      /* ignore */
    }
    if (chatParam) {
      // Opened from a follow-up notification or after login.
      setOpen(true);
      void reload(chatParam, saved.sessionId === chatParam ? saved.token ?? null : null, true).then((ok) => {
        if (!ok) setError(UI[currentLocale()].unavailable);
      });
    } else if (saved.sessionId && saved.token) {
      void reload(saved.sessionId, saved.token, false);
    }
  }, [chatParam, reload]);

  useEffect(() => {
    const onOpen = (event: Event) => void start(((event as CustomEvent).detail ?? {}) as WebChatContext);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, [start]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [state?.messages.length, busy, open]);

  const press = async (button: ChatButton) => {
    if (!state?.sessionId || busy) return;
    if (button.kind === "video" && button.url) {
      setVideo(button.url);
      return;
    }
    if (button.kind === "link" && button.url) {
      if (button.sameTab) window.location.href = button.url;
      else window.open(button.url, "_blank", "noopener,noreferrer");
      return;
    }
    const withChoice: Stored = { ...state, messages: [...state.messages, { from: "visitor", text: button.label }] };
    setState(withChoice);
    setBusy(true);
    setError(null);
    const result = await webChatAct(state.sessionId, state.token, button.id, button.label, currentLocale());
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    save({ ...withChoice, messages: [...withChoice.messages, ...result.messages] });
    // "Explore the platform" → the video pops up over the page; closing it returns to this chat.
    const pop = result.messages.find((m) => m.autoVideo)?.autoVideo;
    if (pop) setVideo(pop);
  };

  const openPanel = () => {
    setOpen(true);
    if (state?.sessionId && unseen) {
      setUnseen(false);
      void reload(state.sessionId, state.token, true);
    }
  };

  if (!enabled) return null;

  const messages = state?.messages ?? [];
  const lastBotIndex = messages.map((m) => m.from).lastIndexOf("bot");

  return (
    <div dir={rtl ? "rtl" : "ltr"} lang={locale} className="fixed bottom-4 left-4 z-[250] font-sans">
      {open && (
        <div className="fixed inset-x-2 bottom-2 top-16 flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:inset-auto sm:bottom-20 sm:left-4 sm:h-[560px] sm:w-[380px]">
          <header className="flex items-center gap-3 bg-[#07152E] px-4 py-3 text-white">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F7B548] text-[#07152E]">
              <Bot className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-black">{ui.title}</div>
              <div className="text-xs text-slate-300">
                {ui.subtitle}
                {MODE === "test" ? ui.test : ""}
              </div>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-1 text-slate-300 hover:bg-white/10" aria-label={ui.close}>
              <X className="h-5 w-5" />
            </button>
          </header>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[#F4F1EA] px-3 py-4 text-sm">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${(m.from === "visitor") === rtl ? "justify-start" : "justify-end"}`}>
                <div className="max-w-[88%] space-y-2">
                  <div
                    className={`rounded-2xl px-3 py-2 leading-relaxed shadow-sm ${
                      m.from === "visitor"
                        ? `${rtl ? "rounded-tr-sm" : "rounded-tl-sm"} bg-[#07152E] text-white`
                        : `${rtl ? "rounded-tl-sm" : "rounded-tr-sm"} bg-white text-slate-800`
                    }`}
                  >
                    <RichText text={m.text} />
                    {m.image && (
                      <button type="button" onClick={() => setZoom(m.image!)} title={ui.zoom} className="mt-2 block w-full overflow-hidden rounded-xl border border-slate-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={m.image} alt={ui.zoom} loading="lazy" className="max-h-56 w-full cursor-zoom-in object-cover" />
                      </button>
                    )}
                  </div>
                  {m.from === "bot" && i === lastBotIndex && m.buttons && m.buttons.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {m.buttons.map((b) => (
                        <button
                          key={b.id + b.label}
                          type="button"
                          disabled={busy}
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
                          {b.kind === "video" && <Play className="h-3.5 w-3.5" />}
                          {b.label}
                          {b.kind === "link" && b.id !== "whatsapp" && !b.sameTab && <ExternalLink className="h-3 w-3" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {busy && (
              <div className={`flex ${rtl ? "justify-end" : "justify-start"}`}>
                <span className="inline-flex items-center gap-1.5 rounded-2xl bg-white px-3 py-2 text-xs text-slate-500 shadow-sm">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {ui.typing}
                </span>
              </div>
            )}
            {error && <div className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}
            <div ref={bottomRef} />
          </div>

          <footer className="flex items-center justify-between gap-2 border-t border-slate-200 px-3 py-2 text-[11px] text-slate-500">
            <button type="button" onClick={() => void start({ source: "launcher" })} className="font-bold text-[#07152E] hover:underline">
              {ui.newChat}
            </button>
            <span>{state?.code ? `${ui.code} ${state.code}` : ui.pick}</span>
          </footer>
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          if (open) return setOpen(false);
          if (state?.sessionId) return openPanel();
          void start({ source: "launcher" });
        }}
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#07152E] text-[#F7B548] shadow-xl ring-2 ring-[#F7B548]/60 transition hover:scale-105"
        aria-label={ui.title}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        {unseen && !open && <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-red-500" />}
      </button>

      {video && <VideoModal url={video} onClose={() => setVideo(null)} closeLabel={ui.close} title={ui.video} />}
      {zoom && <ImageLightbox src={zoom} onClose={() => setZoom(null)} closeLabel={ui.close} />}
    </div>
  );
}
