"use client";

import {
  createContext,
  FormEvent,
  ReactNode,
  useContext,
  useState,
} from "react";

import { useRouter } from "next/navigation";

type ServerAction = (
  formData: FormData,
) => Promise<unknown>;

type SubmitContextValue = {
  pending: boolean;
};

const SubmitContext =
  createContext<SubmitContextValue>({
    pending: false,
  });

function getFriendlyError(
  error: unknown,
) {
  const message =
    error instanceof Error
      ? error.message
      : String(error);

  if (
    message.includes(
      "whatsapp_courses_course_key_key",
    )
  ) {
    return "يوجد كورس بالفعل بنفس المفتاح الداخلي. استخدمي مفتاحًا مختلفًا.";
  }

  if (
    message.includes(
      "whatsapp_course_variants_course_id_variant_key_key",
    )
  ) {
    return "هذا النوع موجود بالفعل داخل الكورس.";
  }

  if (
    message.includes(
      "duplicate key value",
    )
  ) {
    return "هذه البيانات موجودة بالفعل ولا يمكن تكرارها.";
  }

  if (
    message.includes(
      "row-level security",
    ) ||
    message.includes(
      "permission denied",
    )
  ) {
    return "لا توجد صلاحية كافية لتنفيذ هذه العملية.";
  }

  if (
    message.includes("Server Components render") ||
    message.includes("Server Action") ||
    message.includes("Failed to fetch") ||
    message.includes("NetworkError")
  ) {
    return "تعذّر الحفظ. حدّثي الصفحة وحاولي مرة أخرى.";
  }

  if (/^[\x00-\x7F]+$/.test(message.trim())) {
    // Technical English message (database/network): show a clear Arabic message instead.
    return "تعذّر الحفظ بسبب خطأ تقني. حدّثي الصفحة وحاولي مرة أخرى.";
  }

  return (
    message ||
    "حدث خطأ غير متوقع أثناء الحفظ."
  );
}

export default function ActionForm({
  action,
  children,
  className,
  successMessage = "تم الحفظ بنجاح.",
  resetOnSuccess = false,
}: {
  action: ServerAction;
  children: ReactNode;
  className?: string;
  successMessage?: string;
  resetOnSuccess?: boolean;
}) {
  const router = useRouter();

  const [pending, setPending] =
    useState(false);

  const [toast, setToast] =
    useState<{
      type: "success" | "error";
      message: string;
    } | null>(null);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (pending) {
      return;
    }

    const form =
      event.currentTarget;

    // Keep the pressed button's name/value (e.g. enable/disable offer).
    const submitter = (
      event.nativeEvent as SubmitEvent
    ).submitter as
      | HTMLButtonElement
      | null;

    const formData =
      submitter?.name
        ? new FormData(form, submitter)
        : new FormData(form);

    setPending(true);
    setToast(null);

    try {
      const result = await action(formData);

      if (
        result &&
        typeof result === "object" &&
        "ok" in result &&
        (result as { ok: unknown }).ok === false
      ) {
        throw new Error(
          String((result as { error?: unknown }).error ?? ""),
        );
      }

      setToast({
        type: "success",
        message: successMessage,
      });

      if (resetOnSuccess) {
        form.reset();
      }

      router.refresh();

      window.setTimeout(() => {
        setToast(null);
      }, 3500);
    } catch (error) {
      console.error(
        "WhatsApp Sales action failed:",
        error,
      );

      setToast({
        type: "error",
        message:
          getFriendlyError(error),
      });

      window.setTimeout(() => {
        setToast(null);
      }, 5000);
    } finally {
      setPending(false);
    }
  }

  return (
    <SubmitContext.Provider
      value={{ pending }}
    >
      <form
        onSubmit={handleSubmit}
        className={className}
      >
        {children}
      </form>

      {toast ? (
        <div
          className={[
            "fixed left-1/2 top-6 z-[9999] -translate-x-1/2 rounded-2xl border px-5 py-3 text-sm font-black shadow-2xl",
            toast.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700",
          ].join(" ")}
        >
          {toast.type ===
          "success"
            ? "✓ "
            : "✕ "}
          {toast.message}
        </div>
      ) : null}
    </SubmitContext.Provider>
  );
}

export function ActionSubmitButton({
  children,
  pendingText = "جارٍ الحفظ...",
  className,
}: {
  children: ReactNode;
  pendingText?: string;
  className?: string;
}) {
  const { pending } =
    useContext(SubmitContext);

  return (
    <button
      type="submit"
      disabled={pending}
      className={[
        className ?? "",
        pending
          ? "cursor-not-allowed opacity-60"
          : "",
      ].join(" ")}
    >
      {pending
        ? pendingText
        : children}
    </button>
  );
}