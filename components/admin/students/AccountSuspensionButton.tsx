"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Ban, Loader2, RotateCcw, X } from "lucide-react";

import {
  reactivateStudentAccount,
  suspendStudentAccount,
} from "@/lib/actions/admin/account-suspension";

interface Props {
  userId: string;
  studentName: string;
  suspended: boolean;
  reason?: string | null;
}

export default function AccountSuspensionButton({
  userId,
  studentName,
  suspended,
  reason,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const run = (action: () => Promise<{ success: boolean; message: string }>) => {
    setError("");
    start(async () => {
      const result = await action();
      if (!result.success) {
        setError(result.message);
        return;
      }
      setOpen(false);
      setText("");
      router.refresh();
    });
  };

  if (suspended) {
    return (
      <button
        type="button"
        disabled={pending}
        title={reason ? `سبب الإيقاف: ${reason}` : "إعادة تفعيل الحساب"}
        onClick={() => {
          if (
            window.confirm(
              `إعادة تفعيل حساب ${studentName}؟ ستعود اشتراكاته وبياناته كما كانت قبل الإيقاف.`,
            )
          )
            run(() => reactivateStudentAccount(userId));
        }}
        className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-2 py-2 text-[10px] font-black text-emerald-800 hover:bg-emerald-100 disabled:opacity-60"
      >
        {pending ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />}
        إعادة التفعيل
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2 py-2 text-[10px] font-black text-red-700 hover:bg-red-100"
      >
        <Ban size={13} />
        إيقاف الحساب
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          dir="rtl"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-5 text-right shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-base font-black text-[#07152E]">
                إيقاف حساب {studentName}
              </h3>
              <button type="button" onClick={() => setOpen(false)} className="text-slate-400">
                <X size={18} />
              </button>
            </div>

            <p className="mt-2 text-xs leading-6 text-slate-600">
              سيتم إيقاف اشتراكه في جميع الكورسات ومنعه من الدخول للمنصة. عند
              إعادة التفعيل يعود حسابه واشتراكاته كما كانت تمامًا. لن يصله أي
              إشعار أو بريد بالإيقاف.
            </p>

            <label className="mt-3 block text-xs font-black text-[#07152E]">
              سبب الإيقاف (مطلوب)
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-sm font-normal outline-none focus:border-[#F7B548]"
                placeholder="اكتبي سبب إيقاف الحساب"
              />
            </label>

            {error ? <p className="mt-2 text-xs font-bold text-red-600">{error}</p> : null}

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                disabled={pending || text.trim().length < 3}
                onClick={() => run(() => suspendStudentAccount(userId, text))}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-black text-white hover:bg-red-700 disabled:opacity-50"
              >
                {pending ? <Loader2 size={14} className="animate-spin" /> : <Ban size={14} />}
                تأكيد إيقاف الحساب
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-black text-slate-600"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
