"use client";

import type { WebChatContext } from "@/lib/actions/webchat";

/* =========================================================
   Website chat switch.
   NEXT_PUBLIC_WEBCHAT_MODE:
     "off"  → never (all buttons open WhatsApp as before)
     "test" → only in a browser that opened any page with ?webchat=1
     "live" → for every visitor   (default since 2026-10-24)
   ?webchat=0 turns the test mode off again in that browser.
========================================================= */

const MODE = (process.env.NEXT_PUBLIC_WEBCHAT_MODE ?? "live").trim();
const KEY = "mm_webchat_test";
export const OPEN_EVENT = "masar-chat-open";

export function isWebChatEnabled() {
  if (typeof window === "undefined") return false;
  if (MODE === "off") return false;
  if (MODE === "live") return true;
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

/** Reads ?webchat=1 / ?webchat=0 once per page load. */
export function syncWebChatTestFlag() {
  if (typeof window === "undefined") return;
  const flag = new URLSearchParams(window.location.search).get("webchat");
  if (flag !== "1" && flag !== "0") return;
  try {
    if (flag === "1") window.localStorage.setItem(KEY, "1");
    else window.localStorage.removeItem(KEY);
  } catch {
    /* storage blocked */
  }
}

/** Open the website chat instead of WhatsApp. Returns false when the chat is not enabled (caller keeps the old WhatsApp behaviour). */
export function openMasarChat(context: WebChatContext): boolean {
  if (!isWebChatEnabled()) return false;
  window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: context }));
  return true;
}
