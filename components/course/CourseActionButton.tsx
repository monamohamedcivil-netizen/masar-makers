"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  requestEnrollment,
  type EnrollmentStatus,
} from "@/lib/actions/enroll";

interface Props {
  courseId: string;
  stationId?: string;
  journeyType?: string;
  enrollmentStatus?: EnrollmentStatus | null;
}

function formatJourneyType(journeyType: string) {
  const labels: Record<string, string> = {
    fundamental: "رحلة الأساسيات",
    advanced: "الرحلة المتقدمة",
    integrated: "الرحلة المتكاملة",
  };

  return labels[journeyType] || journeyType;
}

function buildWhatsAppUrl(params: {
  whatsappNumber: string;
  studentName: string;
  studentEmail: string;
  courseTitle: string;
  journeyType: string;
  enrollmentId?: string;
}) {
  const cleanNumber = params.whatsappNumber.replace(/\D/g, "");

  if (!cleanNumber) return null;

  const message = [
    "السلام عليكم،",
    "",
    "أرغب في الاشتراك في منصة Masar Makers واستكمال إجراءات الدفع.",
    "",
    `👤 الاسم: ${params.studentName}`,
    `📧 البريد الإلكتروني: ${params.studentEmail}`,
    `📚 الكورس: ${params.courseTitle}`,
    `🛣️ الرحلة: ${formatJourneyType(params.journeyType)}`,
    params.enrollmentId ? `🧾 رقم الطلب: ${params.enrollmentId}` : "",
    "",
    "تم إرسال طلب الاشتراك من المنصة.",
  ]
    .filter(Boolean)
    .join("\n");

  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
}

export default function CourseActionButton({
  courseId,
  stationId,
  journeyType,
  enrollmentStatus,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [currentStatus, setCurrentStatus] = useState<
    EnrollmentStatus | null | undefined
  >(enrollmentStatus);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);

  const handleEnrollment = () => {
    if (!stationId || !journeyType) {
      setErrorMessage("بيانات الرحلة غير مكتملة.");
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setWhatsappUrl(null);

    // فتح نافذة فارغة فور الضغط لتجنب منع المتصفح للنافذة بعد انتظار الطلب.
    const whatsappWindow = window.open("", "_blank");

    startTransition(async () => {
      const result = await requestEnrollment(
        courseId,
        stationId,
        journeyType,
      );

      if (!result.success) {
        whatsappWindow?.close();

        if (result.message === "LOGIN_REQUIRED") {
          setErrorMessage("يجب تسجيل الدخول أولًا.");
          return;
        }

        setErrorMessage(result.message || "تعذر إرسال طلب الاشتراك.");
        return;
      }

      const nextStatus = result.enrollment?.status as
        | EnrollmentStatus
        | undefined;

      setCurrentStatus(nextStatus ?? "pending");

      const url = buildWhatsAppUrl({
        whatsappNumber: result.whatsappNumber,
        studentName: result.studentName,
        studentEmail: result.studentEmail,
        courseTitle: result.courseTitle,
        journeyType,
        enrollmentId: result.enrollment?.id,
      });

      if (url) {
        setWhatsappUrl(url);
        setSuccessMessage(
          "تم تسجيل طلبك بنجاح، وسيتم تحويلك إلى واتساب لاستكمال إجراءات الدفع.",
        );

        if (whatsappWindow) {
          whatsappWindow.location.href = url;
        } else {
          window.location.href = url;
        }
      } else {
        whatsappWindow?.close();
        setSuccessMessage(
          "تم تسجيل طلبك بنجاح، لكن رقم واتساب الأكاديمية غير مُعدّ بعد.",
        );
      }

      router.refresh();
    });
  };

  if (currentStatus === "active") {
    return (
      <button
        type="button"
        className="h-12 w-full rounded-xl bg-green-600 py-3 font-semibold text-white"
      >
        استكمل الرحلة
      </button>
    );
  }

  if (currentStatus === "pending") {
    return (
      <div className="w-full space-y-2">
        <button
          type="button"
          disabled
          className="h-12 w-full cursor-not-allowed rounded-xl bg-yellow-500 py-3 font-semibold text-white opacity-90"
        >
          طلب الاشتراك قيد المراجعة
        </button>

        {successMessage && (
          <p className="text-center text-xs font-semibold text-green-700">
            {successMessage}
          </p>
        )}

        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="block w-full rounded-xl border border-green-600 py-2.5 text-center text-sm font-bold text-green-700 transition hover:bg-green-50"
          >
            فتح واتساب لاستكمال الدفع
          </a>
        )}
      </div>
    );
  }

  if (currentStatus === "rejected") {
    return (
      <button
        type="button"
        disabled
        className="w-full cursor-not-allowed rounded-xl bg-red-600 py-3 font-semibold text-white"
      >
        تم رفض الطلب
      </button>
    );
  }

  if (currentStatus === "expired") {
    return (
      <button
        type="button"
        disabled
        className="w-full cursor-not-allowed rounded-xl bg-orange-600 py-3 font-semibold text-white"
      >
        انتهى الاشتراك
      </button>
    );
  }

  if (currentStatus === "suspended") {
    return (
      <button
        type="button"
        disabled
        className="w-full cursor-not-allowed rounded-xl bg-gray-700 py-3 font-semibold text-white"
      >
        الاشتراك موقوف
      </button>
    );
  }

  return (
    <div className="w-full">
      <button
        type="button"
        disabled={isPending}
        onClick={handleEnrollment}
        className="w-full rounded-xl bg-[#F7B548] py-3 font-bold text-[#07152E] transition hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
      >
        {isPending ? "جارٍ إرسال الطلب..." : "ابدأ الرحلة"}
      </button>

      {errorMessage && (
        <p className="mt-2 text-center text-xs font-bold text-red-600">
          {errorMessage}
        </p>
      )}
    </div>
  );
}