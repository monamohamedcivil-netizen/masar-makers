"use client";

import PageErrorRecovery from "@/components/errors/PageErrorRecovery";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  return (
    <html lang="ar" dir="rtl">
      <body style={{ margin: 0, background: "#F7F8FA", fontFamily: "system-ui, sans-serif" }}>
        <PageErrorRecovery error={error} />
      </body>
    </html>
  );
}
