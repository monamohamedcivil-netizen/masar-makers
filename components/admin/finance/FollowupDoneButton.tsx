"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Check, Loader2 } from "lucide-react";

import { completeFollowup } from "@/lib/actions/admin/finance";

export default function FollowupDoneButton({ paymentId }: { paymentId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await completeFollowup(paymentId);
          router.refresh();
        })
      }
      className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
    >
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
      تمت المتابعة
    </button>
  );
}
