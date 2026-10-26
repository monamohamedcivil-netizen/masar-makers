"use client";

import { useEffect, useState } from "react";

import { reportClientError } from "@/lib/actions/client-errors";

const KEY = "mm_error_reload_at";
const WINDOW_MS = 30_000;

/**
 * Shown instead of the browser's "This page couldn't load".
 * Most of these errors come from a page that was opened before a new version of the
 * platform was published (old files) — so the page reloads itself once and opens normally.
 * If it fails again right away, a friendly message with "reload" and "home" buttons is shown.
 */
export default function PageErrorRecovery({ error }: { error: Error & { digest?: string } }) {
  const [showMessage, setShowMessage] = useState(false);
  const [en, setEn] = useState(false);

  useEffect(() => {
    try {
      setEn((window.localStorage.getItem("masar-locale") ?? "") === "en");
    } catch {
      /* ignore */
    }

    let last = 0;
    try {
      last = Number(window.sessionStorage.getItem(KEY) ?? 0);
    } catch {
      /* ignore */
    }
    const canRetry = !last || Date.now() - last > WINDOW_MS;

    void reportClientError({
      url: window.location.href,
      message: `${error?.name ?? "Error"}: ${error?.message ?? ""}`,
      digest: error?.digest,
      stack: error?.stack,
      recovered: canRetry,
    });

    if (canRetry) {
      try {
        window.sessionStorage.setItem(KEY, String(Date.now()));
      } catch {
        /* ignore */
      }
      window.location.reload();
      return;
    }
    setShowMessage(true);
  }, [error]);

  if (!showMessage) {
    return <div style={{ minHeight: "60vh" }} />;
  }

  return (
    <div
      dir={en ? "ltr" : "rtl"}
      style={{
        minHeight: "70vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        padding: 24,
        textAlign: "center",
        fontFamily: "inherit",
        color: "#07152E",
      }}
    >
      <p style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>
        {en ? "The page didn't open properly" : "الصفحة لم تفتح بشكل صحيح"}
      </p>
      <p style={{ fontSize: 14, margin: 0, color: "#475569" }}>
        {en ? "Please reload the page, or go to the journeys center." : "أعد تحميل الصفحة، أو ادخل إلى مركز الرحلات."}
      </p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{ background: "#F7B548", color: "#07152E", border: 0, borderRadius: 14, padding: "10px 18px", fontWeight: 800, cursor: "pointer" }}
        >
          {en ? "Reload" : "إعادة التحميل"}
        </button>
        <a
          href="/home"
          style={{ background: "#07152E", color: "#fff", borderRadius: 14, padding: "10px 18px", fontWeight: 800, textDecoration: "none" }}
        >
          {en ? "Journeys center" : "مركز الرحلات"}
        </a>
      </div>
    </div>
  );
}
