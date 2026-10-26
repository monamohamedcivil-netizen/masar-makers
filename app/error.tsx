"use client";

import PageErrorRecovery from "@/components/errors/PageErrorRecovery";

export default function Error({ error }: { error: Error & { digest?: string } }) {
  return <PageErrorRecovery error={error} />;
}
