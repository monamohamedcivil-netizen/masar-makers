"use client";

import { useState, type ReactNode } from "react";

import { getLessonResourceDownloadUrl } from "@/lib/actions/student/resource-download";

/**
 * زر تحميل المرفق: الرابط يُجهَّز فقط عند الضغط (لا شيء يُطلب عند فتح الصفحة).
 */
export default function ResourceDownloadLink({
  token,
  title,
  ariaLabel,
  className,
  children,
}: {
  token: string;
  title?: string;
  ariaLabel?: string;
  className?: string;
  children: ReactNode;
}) {
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    if (busy) return;
    setBusy(true);
    try {
      const result = await getLessonResourceDownloadUrl(token);
      if (result.ok) {
        window.location.assign(result.url);
      } else {
        window.alert(result.message);
      }
    } catch {
      window.alert("تعذّر تجهيز الملف، حاول مرة أخرى.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      title={title}
      aria-label={ariaLabel}
      aria-busy={busy}
      disabled={busy}
      className={`${className ?? ""} ${busy ? "cursor-wait opacity-60" : ""}`}
    >
      {children}
    </button>
  );
}
