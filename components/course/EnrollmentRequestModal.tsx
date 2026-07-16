"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Loader2,
  Send,
  X,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type JourneyType =
  | "professional"
  | "workshop"
  | "free";

type EnrollmentRequestModalProps = {
  open: boolean;
  onClose: () => void;

  courseSlug: string;
  courseTitle: string;

  journeyType: JourneyType;
  journeySlug?: string;
  journeyTitle: string;
};

export default function EnrollmentRequestModal({
  open,
  onClose,
  courseSlug,
  courseTitle,
  journeyType,
  journeySlug,
  journeyTitle,
}: EnrollmentRequestModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    const loadUser = async () => {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return;
      }

      const metadata = user.user_metadata ?? {};

      setName(
        String(
          metadata.full_name ||
            metadata.name ||
            ""
        )
      );

      setEmail(user.email ?? "");

      setPhone(
        String(
          metadata.phone ||
            metadata.phone_number ||
            ""
        )
      );

      setCountry(
        String(metadata.country || "")
      );
    };

    void loadUser();
  }, [open]);

  useEffect(() => {
    if (!open) {
      setSuccess(false);
      setError("");
      setNotes("");
    }
  }, [open]);

  if (!open) {
    return null;
  }

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setLoading(true);
    setError("");
    setSuccess(false);

    if (phone.trim().length < 8) {
  setError(
    "يرجى إدخال رقم هاتف صحيح مع كود الدولة."
  );
  setLoading(false);
  return;
}

    try {
      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error(
          "يجب تسجيل الدخول أولًا لإرسال الطلب."
        );
      }

      const { error: insertError } =
        await supabase
          .from("enrollment_requests")
          .insert({
            user_id: user.id,

            student_name: name.trim(),
            student_email: email.trim(),
            student_phone: phone.trim(),
            student_country: country.trim() || null,

            course_slug: courseSlug,
            course_title: courseTitle,

            journey_type: journeyType,
            journey_slug:
              journeySlug || courseSlug,
            journey_title: journeyTitle,

            status: "pending",
            notes: notes.trim() || null,
          });

      if (insertError) {
        throw insertError;
      }

      setSuccess(true);

      const adminWhatsAppNumber =
        "201031885659";

      const journeyTypeLabel =
        journeyType === "professional"
          ? "رحلة الاحتراف المتكاملة"
          : journeyType === "workshop"
            ? "رحلة اليوم الواحد"
            : "رحلة مجانية";

     const message = [
  "طلب تسجيل جديد - منصة صناع المسار",
  "",
  `الاسم: ${name.trim()}`,
  `البريد الإلكتروني: ${email.trim()}`,
  `رقم الهاتف للتواصل: ${phone.trim()}`,
  `الدولة: ${country.trim() || "غير مضافة"}`,
  "",
  `الكورس: ${courseTitle}`,
  `نوع الرحلة: ${journeyTypeLabel}`,
  `اسم الرحلة: ${journeyTitle}`,
  "",
  notes.trim()
    ? `ملاحظات الطالب: ${notes.trim()}`
    : "",
]
  .filter(Boolean)
  .join("\n");

      const whatsappUrl =
        `https://wa.me/${adminWhatsAppNumber}` +
        `?text=${encodeURIComponent(message)}`;

      window.open(
        whatsappUrl,
        "_blank",
        "noopener,noreferrer"
      );
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "حدث خطأ أثناء إرسال الطلب.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      dir="rtl"
      className="
        fixed inset-0 z-[200]
        flex items-center justify-center
        bg-[#07152E]/65 px-4
        backdrop-blur-sm
      "
    >
      <div
        className="
          relative w-full max-w-[620px]
          overflow-hidden rounded-[28px]
          border border-white/30
          bg-white
          shadow-[0_30px_90px_rgba(7,21,46,0.35)]
        "
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="إغلاق"
          className="
            absolute left-4 top-4 z-10
            flex h-9 w-9 items-center
            justify-center rounded-full
            bg-[#F1F3F6] text-slate-600
            transition hover:bg-[#07152E]
            hover:text-white
          "
        >
          <X size={18} />
        </button>

        <div className="bg-[#07152E] px-6 py-5 text-white">
          <p className="text-[11px] font-black text-[#F7B548]">
            طلب تسجيل جديد
          </p>

          <h2 className="mt-1 text-[23px] font-black">
            {journeyTitle}
          </h2>

          <p className="mt-1 text-[11px] font-medium text-slate-300">
            {courseTitle}
          </p>
        </div>

        {success ? (
          <div className="px-6 py-10 text-center">
            <CheckCircle2
              size={52}
              className="mx-auto text-emerald-500"
            />

            <h3 className="mt-4 text-[20px] font-black text-[#07152E]">
              تم حفظ طلبك بنجاح
            </h3>

            <p className="mt-2 text-[12px] font-medium leading-6 text-slate-500">
              تم تسجيل الطلب في المنصة وفتح رسالة
              واتساب تحتوي على جميع البيانات.
            </p>

            <button
              type="button"
              onClick={onClose}
              className="
                mt-6 rounded-xl
                bg-[#07152E] px-6 py-3
                text-[12px] font-black text-white
              "
            >
              إغلاق
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-4 p-6"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="الاسم الكامل"
                value={name}
                onChange={setName}
                required
              />

              <Field
                label="البريد الإلكتروني"
                type="email"
                value={email}
                onChange={setEmail}
                required
              />

              <Field
                label="رقم الهاتف مع كود الدولة للتواصل"
                value={phone}
                onChange={setPhone}
                required
              />

              <Field
                label="الدولة"
                value={country}
                onChange={setCountry}
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-[11px] font-black text-[#07152E]">
                ملاحظات إضافية
              </label>

              <textarea
                value={notes}
                onChange={(event) =>
                  setNotes(event.target.value)
                }
                rows={3}
                className="
                  w-full resize-none rounded-[16px]
                  border border-[#D8DEE7]
                  bg-[#F8FAFC] px-4 py-3
                  text-[12px] font-medium
                  text-[#07152E] outline-none
                  transition focus:border-[#F7B548]
                  focus:bg-white
                "
                placeholder="اكتب أي ملاحظات ترغب في إضافتها..."
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[11px] font-bold text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="
                flex h-[48px] w-full
                items-center justify-center gap-2
                rounded-[16px] bg-[#F7B548]
                text-[13px] font-black
                text-[#07152E]
                transition hover:-translate-y-0.5
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >
              {loading ? (
                <>
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                  جاري إرسال الطلب...
                </>
              ) : (
                <>
                  <Send size={17} />
                  إرسال طلب التسجيل
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
};

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
}: FieldProps) {
  return (
    <div>
      <label className="mb-2 block text-[11px] font-black text-[#07152E]">
        {label}
      </label>

      <input
        type={type}
        value={value}
        required={required}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="
          h-[46px] w-full rounded-[16px]
          border border-[#D8DEE7]
          bg-[#F8FAFC] px-4
          text-[12px] font-medium
          text-[#07152E] outline-none
          transition focus:border-[#F7B548]
          focus:bg-white
        "
      />
    </div>
  );
}