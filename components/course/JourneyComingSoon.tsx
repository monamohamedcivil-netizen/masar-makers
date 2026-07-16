"use client";

import { useEffect, useState } from "react";
import {
  BellRing,
  CheckCircle2,
  Loader2,
  Sparkles,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type JourneyComingSoonProps = {
  journeyId?: string;
  journeyTitle: string;
};

export default function JourneyComingSoon({
  journeyId,
  journeyTitle,
}: JourneyComingSoonProps) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [interested, setInterested] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const checkInterest = async () => {
      if (!journeyId) {
        if (mounted) {
          setLoading(false);
        }

        return;
      }

      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (mounted) {
          setLoading(false);
        }

        return;
      }

      const { data, error: selectError } =
        await supabase
          .from("journey_interests")
          .select("id")
          .eq("user_id", user.id)
          .eq("journey_id", journeyId)
          .maybeSingle();

      if (!mounted) {
        return;
      }

      if (selectError) {
        console.error(
          "Error checking journey interest:",
          selectError
        );
      }

      setInterested(Boolean(data));
      setLoading(false);
    };

    void checkInterest();

    return () => {
      mounted = false;
    };
  }, [journeyId]);

  const handleInterest = async () => {
    setError("");
    setMessage("");

    if (!journeyId) {
      setError(
        "لم يتم ربط هذه الرحلة بقاعدة البيانات بعد."
      );

      return;
    }

    setSubmitting(true);

    try {
      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error(
          "يجب تسجيل الدخول أولًا لتسجيل اهتمامك."
        );
      }

      /*
        نتحقق مرة أخرى لمنع تكرار الطلب،
        حتى لو ضغط الطالب الزر أكثر من مرة.
      */
      const { data: existingInterest } =
        await supabase
          .from("journey_interests")
          .select("id")
          .eq("user_id", user.id)
          .eq("journey_id", journeyId)
          .maybeSingle();

      if (existingInterest) {
        setInterested(true);

        setMessage(
          "اهتمامك بهذه الرحلة مسجل بالفعل، وسيتم إشعارك عند توفر أي تحديثات."
        );

        return;
      }

      const { error: insertError } =
        await supabase
          .from("journey_interests")
          .insert({
            user_id: user.id,
            journey_id: journeyId,
            notify_in_app: true,
            notify_email: true,
            notify_whatsapp: true,
          });

      if (insertError) {
        /*
          23505 = Unique violation
          أي أن الاهتمام مسجل بالفعل.
        */
        if (insertError.code === "23505") {
          setInterested(true);

          setMessage(
            "اهتمامك بهذه الرحلة مسجل بالفعل."
          );

          return;
        }

        throw insertError;
      }

      setInterested(true);

      setMessage(
        "تم تسجيل اهتمامك بالرحلة، وسيتم إشعارك فور توفرها أو وجود أخبار جديدة عنها."
      );
    } catch (submitError) {
      const errorMessage =
        submitError instanceof Error
          ? submitError.message
          : "تعذر تسجيل اهتمامك حاليًا.";

      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      dir="rtl"
      className="
        relative flex min-h-[280px]
        items-center justify-center
        overflow-hidden border
        border-dashed border-[#D6DEE8]
        bg-white px-6 py-9 text-center
      "
    >
      {/* Decorative glow */}
      <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-[#F7B548]/15 blur-3xl" />

      <div className="relative z-10 max-w-[560px]">
        <div
          className="
            mx-auto flex h-14 w-14
            items-center justify-center
            rounded-2xl bg-[#FFF7E3]
            text-[#D49319]
          "
        >
          {interested ? (
            <CheckCircle2 size={27} />
          ) : (
            <Sparkles size={27} />
          )}
        </div>

        <span
          className="
            mt-4 inline-flex rounded-full
            border border-[#F7B548]/40
            bg-[#FFF7E3] px-4 py-1.5
            text-[11px] font-black
            text-[#B87808]
          "
        >
          قريبًا
        </span>

        <h3 className="mt-3 text-[22px] font-black text-[#07152E]">
          {journeyTitle}
        </h3>

        <p className="mx-auto mt-2 max-w-[460px] text-[12px] font-medium leading-6 text-slate-500">
          نعمل حاليًا على تجهيز هذه الرحلة
          لتقديمها بأفضل محتوى وتجربة تعليمية.
          سجّل اهتمامك ليصلك إشعار عند فتح
          التسجيل أو الإعلان عن أي تحديث جديد.
        </p>

        {message && (
          <div
            className="
              mt-5 rounded-[15px]
              border border-emerald-200
              bg-emerald-50 px-5 py-3
              text-[11px] font-bold
              leading-6 text-emerald-700
            "
          >
            {message}
          </div>
        )}

        {error && (
          <div
            className="
              mt-5 rounded-[15px]
              border border-red-200
              bg-red-50 px-5 py-3
              text-[11px] font-bold
              leading-6 text-red-600
            "
          >
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleInterest}
          disabled={
            loading ||
            submitting ||
            interested
          }
          className={`
            mx-auto mt-5 flex h-[44px]
            min-w-[210px] items-center
            justify-center gap-2
            rounded-xl px-6
            text-[13px] font-black
            transition duration-300

            ${
              interested
                ? `
                  cursor-default
                  bg-emerald-100
                  text-emerald-700
                `
                : `
                  bg-[#F7B548]
                  text-[#07152E]
                  hover:-translate-y-0.5
                  hover:shadow-[0_10px_24px_rgba(247,181,72,0.25)]
                `
            }

            disabled:opacity-70
          `}
        >
          {loading || submitting ? (
            <>
              <Loader2
                size={17}
                className="animate-spin"
              />

              {loading
                ? "جاري التحقق..."
                : "جاري تسجيل اهتمامك..."}
            </>
          ) : interested ? (
            <>
              <CheckCircle2 size={17} />
              تم تسجيل اهتمامك
            </>
          ) : (
            <>
              <BellRing size={17} />
              مهتم بهذه الرحلة
            </>
          )}
        </button>
      </div>
    </div>
  );
}