"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function BackToRegistrationButton() {
  const router = useRouter();

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/register");
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-[#F7B548] px-4 text-[10px] font-black text-[#07152E] transition hover:brightness-95"
    >
      العودة لإكمال التسجيل
      <ArrowLeft size={14} />
    </button>
  );
}