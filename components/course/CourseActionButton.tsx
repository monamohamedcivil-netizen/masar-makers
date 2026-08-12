"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  requestEnrollment,
  startFreeJourney,
  type EnrollmentStatus,
} from "@/lib/actions/enroll";

interface Props {
    courseId: string;

     label?: string;

    mode?: "enrollment" | "free";

    stationId?: string;

    journeyType?: string;

    enrollmentStatus?: EnrollmentStatus | null;

    actionKey?: string;

    actionTitle?: string;

    itemTitle?: string;
    link?: string | null;
    redirectTo?: string | null;
}

function normalizeWhatsappNumber(number: string) {
  return number.replace(/[^0-9]/g, "");
}

function getJourneyLabel(journeyType: string) {
  const labels: Record<string, string> = {
    fundamental: "رحلة الأساسيات",
    fundamentals: "رحلة الأساسيات",
    advanced: "الرحلة المتقدمة",
    integrated: "رحلة الاحتراف المتكاملة",
    professional: "رحلة الاحتراف",
    career_path: "رحلة الاحتراف المتكاملة",
    workshop: "رحلة اليوم الواحد",
    free: "رحلة مجانية",
  };

  return labels[journeyType.toLowerCase()] || journeyType;
}

export default function CourseActionButton({
    courseId,

       label = "اشترك الآن",

    mode = "enrollment",

    stationId,

    journeyType = "career_path",

    enrollmentStatus,

    actionKey,

    actionTitle,

    itemTitle,
    link,
    redirectTo,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [currentStatus, setCurrentStatus] = useState<
    EnrollmentStatus | null | undefined
  >(enrollmentStatus);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    setCurrentStatus(enrollmentStatus);
  }, [enrollmentStatus]);

  const handleEnrollment = () => {
    setErrorMessage("");
    setSuccessMessage("");

    const isReactivationRequest =
      currentStatus === "suspended";

    /*
     * Reactivation does not require opening WhatsApp/payment again.
     * Normal paid enrollment requests keep the existing WhatsApp flow.
     */
    const whatsappWindow =
      mode === "enrollment" &&
      !isReactivationRequest
        ? window.open("", "_blank")
        : null;

    startTransition(async () => {
      const result =
  mode === "free"
    ? await startFreeJourney(
        courseId,
        actionKey ?? "",
        actionTitle ?? itemTitle,
      )
    : await requestEnrollment(
        courseId,
        journeyType,
        actionKey ?? "",
        actionTitle ?? itemTitle,
      );

      if (!result.success) {
        whatsappWindow?.close();

        if (result.message === "LOGIN_REQUIRED") {
          const nextPath = `${window.location.pathname}${window.location.search}`;
          router.push(`/login?next=${encodeURIComponent(nextPath)}`);
          return;
        }

        setErrorMessage(result.message || "تعذر إرسال طلب الاشتراك.");
        return;
      }

      const nextStatus = result.enrollment?.status ?? "pending";
      if (mode === "free") {
        setCurrentStatus("active");
        setSuccessMessage(
          "تمت إضافة الرحلة المجانية إلى رحلاتي.",
        );
        whatsappWindow?.close();

        if (redirectTo?.trim()) {
          router.push(redirectTo);
          return;
        }

        const startUrl = link?.trim();

        if (startUrl) {
          window.open(
            startUrl,
            "_blank",
            "noopener,noreferrer",
          );
          return;
        }

        router.refresh();
        return;
      }
      setCurrentStatus(nextStatus);

      if (nextStatus === "active" || nextStatus === "completed") {
        whatsappWindow?.close();
        setSuccessMessage("اشتراكك مفعّل بالفعل.");
        router.refresh();
        return;
      }

      if (isReactivationRequest) {
        whatsappWindow?.close();
        setSuccessMessage(
          "تم إرسال طلب إعادة تفعيل الاشتراك، وهو الآن قيد مراجعة الإدارة.",
        );
        router.refresh();
        return;
      }

      setSuccessMessage(
        "تم تسجيل طلبك بنجاح، وسيتم فتح واتساب لاستكمال إجراءات التسجيل والدفع.",
      );

      const whatsapp = result.whatsapp;

      if (whatsapp?.number) {
        const message = [
          "السلام عليكم،",
          "",
          "أرغب في الاشتراك في منصة Masar Makers.",
          "",
          `👤 الاسم: ${whatsapp.studentName}`,
          `📧 البريد الإلكتروني: ${whatsapp.studentEmail}`,
          `📚 الكورس: ${whatsapp.courseTitle}`,
          `🛣️ الرحلة: ${getJourneyLabel(whatsapp.journeyType)}`,
          itemTitle ? `📌 العنصر: ${itemTitle}` : "",
          `🔖 رقم الطلب: ${whatsapp.requestNumber}`,
          stationId ? `📍 رقم المسار: ${stationId}` : "",
          "",
          "تم إرسال طلب الاشتراك من المنصة، وأرغب في استكمال إجراءات الدفع.",
        ]
          .filter(Boolean)
          .join("\n");

        const whatsappUrl = `https://wa.me/${normalizeWhatsappNumber(
          whatsapp.number,
        )}?text=${encodeURIComponent(message)}`;

        if (whatsappWindow) {
          whatsappWindow.location.href = whatsappUrl;
        } else {
          window.open(whatsappUrl, "_blank", "noopener,noreferrer");
        }
      } else {
        whatsappWindow?.close();
        setSuccessMessage(
          "تم تسجيل طلبك بنجاح. سيظهر الطلب لدى الإدارة لتفعيله.",
        );
      }

      router.refresh();
    });
  };

  if (currentStatus === "active") {
    const startUrl = link?.trim();

    if (redirectTo?.trim()) {
      return (
        <button
          type="button"
          onClick={() =>
            router.push(redirectTo)
          }
          className="h-12 w-full rounded-xl bg-emerald-600 px-4 py-3 font-black text-white transition hover:bg-emerald-700"
        >
          {mode === "free"
            ? label || "شاهد الآن"
            : "ابدأ الرحلة"}
        </button>
      );
    }

    if (mode === "free" && startUrl) {
      return (
        <a
          href={startUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-12 w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 font-black text-white transition hover:bg-emerald-700"
        >
          استكمل الرحلة
        </a>
      );
    }

    return (
      <button
        type="button"
        className="h-12 w-full rounded-xl bg-emerald-600 px-4 py-3 font-black text-white transition hover:bg-emerald-700"
      >
        ابدأ الرحلة
      </button>
    );
  }

  if (currentStatus === "completed") {
    if (redirectTo?.trim()) {
      return (
        <button
          type="button"
          onClick={() =>
            router.push(redirectTo)
          }
          className="h-12 w-full rounded-xl bg-emerald-600 px-4 py-3 font-black text-white transition hover:bg-emerald-700"
        >
          شاهد مرة أخرى
        </button>
      );
    }

    return (
      <button
        type="button"
        disabled
        className="h-12 w-full cursor-default rounded-xl bg-emerald-600 px-4 py-3 font-black text-white"
      >
        الرحلة مكتملة
      </button>
    );
  }

  if (currentStatus === "pending") {
    return (
      <div className="w-full">
        <button
          type="button"
          disabled
          className="h-12 w-full cursor-not-allowed rounded-xl bg-[#F7B548] px-4 py-3 font-black text-[#07152E] opacity-95"
        >
          طلب الاشتراك قيد المراجعة
        </button>

        {successMessage && (
          <p className="mt-2 text-center text-xs font-bold leading-5 text-emerald-700">
            {successMessage}
          </p>
        )}
      </div>
    );
  }

  if (currentStatus === "rejected") {
    return (
      <button
        type="button"
        onClick={handleEnrollment}
        disabled={isPending}
        className="h-12 w-full rounded-xl bg-[#F7B548] px-4 py-3 font-black text-[#07152E] transition hover:brightness-105 disabled:cursor-wait disabled:opacity-60"
      >
        {isPending ? "جارٍ إعادة إرسال الطلب..." : "أعد إرسال طلب الاشتراك"}
      </button>
    );
  }

  if (currentStatus === "suspended") {
    return (
      <div className="w-full">
        <button
          type="button"
          onClick={handleEnrollment}
          disabled={isPending}
          className="h-12 w-full rounded-xl bg-[#F7B548] px-4 py-3 font-black text-[#07152E] transition hover:brightness-105 disabled:cursor-wait disabled:opacity-60"
        >
          {isPending
            ? "جارٍ إرسال طلب إعادة التفعيل..."
            : "طلب إعادة تفعيل الاشتراك"}
        </button>

        {errorMessage && (
          <p className="mt-2 text-center text-xs font-bold leading-5 text-red-600">
            {errorMessage}
          </p>
        )}
      </div>
    );
  }

  if (currentStatus === "expired") {
    return (
      <button
        type="button"
        disabled
        className="h-12 w-full cursor-not-allowed rounded-xl bg-slate-600 px-4 py-3 font-black text-white"
      >
        انتهى الاشتراك
      </button>
    );
  }

  return (
    <div className="w-full">
      <button
        type="button"
        disabled={isPending}
        onClick={handleEnrollment}
        className="h-12 w-full rounded-xl bg-[#F7B548] px-4 py-3 font-black text-[#07152E] transition hover:brightness-105 disabled:cursor-wait disabled:opacity-60"
      >
       {isPending ? "جارٍ إرسال الطلب..." : label}
      </button>

      {errorMessage && (
        <p className="mt-2 text-center text-xs font-bold leading-5 text-red-600">
          {errorMessage}
        </p>
      )}

      {successMessage && (
        <p className="mt-2 text-center text-xs font-bold leading-5 text-emerald-700">
          {successMessage}
        </p>
      )}
    </div>
  );
}