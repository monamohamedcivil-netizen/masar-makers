"use client";

import { Bell, BellOff, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { removePushSubscription, savePushSubscription } from "@/lib/actions/whatsapp-inbox";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const raw = atob((value + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

function b64(buf: ArrayBuffer | null) {
  if (!buf) return "";
  return btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

type State = "loading" | "unsupported" | "ios-install" | "no-key" | "denied" | "off" | "on";

export default function PushToggle() {
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!PUBLIC_KEY) return setState("no-key");
      const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
      const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone;
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        return setState(isIos && !standalone ? "ios-install" : "unsupported");
      }
      if (Notification.permission === "denied") return setState("denied");
      const reg = await navigator.serviceWorker.register("/sw.js");
      const sub = await reg.pushManager.getSubscription();
      setState(sub ? "on" : "off");
    })().catch(() => setState("unsupported"));
  }, []);

  const enable = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState("denied");
        return;
      }
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(PUBLIC_KEY) }));
      const result = await savePushSubscription({
        endpoint: sub.endpoint,
        p256dh: b64(sub.getKey("p256dh")),
        auth: b64(sub.getKey("auth")),
        userAgent: navigator.userAgent,
      });
      if (!result.ok) throw new Error(result.error);
      setState("on");
      setMessage("تم تفعيل الإشعارات على هذا الجهاز ✅");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "تعذّر تفعيل الإشعارات.");
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration("/sw.js");
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await removePushSubscription(sub.endpoint);
        await sub.unsubscribe();
      }
      setState("off");
      setMessage("تم إيقاف الإشعارات على هذا الجهاز.");
    } finally {
      setBusy(false);
    }
  };

  const hint: Partial<Record<State, string>> = {
    "no-key": "الإشعارات تحتاج إضافة مفاتيح VAPID في إعدادات الخادم أولًا.",
    unsupported: "هذا المتصفح لا يدعم الإشعارات. استخدمي Chrome على أندرويد أو الكمبيوتر.",
    "ios-install": "على الآيفون: افتحي المنصة من Safari ← زر المشاركة ← «إضافة إلى الشاشة الرئيسية»، ثم افتحيها من الأيقونة وفعّلي الإشعارات.",
    denied: "الإشعارات محظورة لهذا الموقع. فعّليها من إعدادات المتصفح ثم أعيدي المحاولة.",
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {state === "on" ? (
        <button
          type="button"
          onClick={disable}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
          الإشعارات مفعّلة على هذا الجهاز
        </button>
      ) : state === "off" || state === "loading" ? (
        <button
          type="button"
          onClick={enable}
          disabled={busy || state === "loading"}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#F7B548] px-3 py-2 text-sm font-black text-[#07152E] hover:brightness-95 disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
          تفعيل إشعارات الرسائل على هذا الجهاز
        </button>
      ) : (
        <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-xs text-slate-600">
          <BellOff className="h-4 w-4" />
          {hint[state]}
        </span>
      )}
      {message && <span className="text-xs text-slate-500">{message}</span>}
    </div>
  );
}
