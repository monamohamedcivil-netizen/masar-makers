"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import type { PopupOffer } from "./useOffers";

type Locale = "ar" | "en";

const TEXT = {
  ar: { title: "العروض الحالية", close: "إغلاق", of: "من", prev: "العرض السابق", next: "العرض التالي" },
  en: { title: "Current offers", close: "Close", of: "of", prev: "Previous offer", next: "Next offer" },
} as const;

/** يفتح وجهة الزر: واتساب في تبويب جديد، وصفحات المنصة في نفس النافذة. */
function go(href: string) {
  if (!href || href === "#") return;
  if (/^https?:\/\//i.test(href) && !href.startsWith(window.location.origin)) {
    window.open(href, "_blank", "noopener,noreferrer");
    return;
  }
  window.location.assign(href);
}

/*
 * شاشة العروض: صفحات متتالية ورا بعض. العرض الأمامي كامل وواضح، وما خلفه أصغر وخافت.
 * الضغط على عرض خلفي يقدّمه بنعومة ويرجع الأمامي للخلف.
 */
export default function OffersModal({
  offers,
  open,
  onClose,
  locale,
}: {
  offers: PopupOffer[];
  open: boolean;
  onClose: () => void;
  locale: Locale;
}) {
  const [front, setFront] = useState(0);
  const [mounted, setMounted] = useState(false);
  const text = TEXT[locale];
  const rtl = locale === "ar";
  const count = offers.length;

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (open) setFront(0);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") setFront((f) => (f + (rtl ? count - 1 : 1)) % count);
      if (event.key === "ArrowLeft") setFront((f) => (f + (rtl ? 1 : count - 1)) % count);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, count, rtl]);

  if (!mounted || !open || count === 0) return null;

  const current = offers[front] ?? offers[0];
  const buttonText = locale === "en" ? current.popup.buttonTextEn || current.popup.buttonText : current.popup.buttonText;

  return createPortal(
    <div
      dir={rtl ? "rtl" : "ltr"}
      role="dialog"
      aria-modal="true"
      aria-label={text.title}
      className="fixed inset-0 z-[400] flex items-center justify-center overflow-hidden bg-[#07152E]/80 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="relative flex w-full max-w-[1400px] flex-col items-center">
        <button
          type="button"
          onClick={onClose}
          aria-label={text.close}
          className="fixed right-4 top-4 z-[200] flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white text-[#07152E] shadow-lg transition hover:bg-[#F7B548]"
        >
          <X size={18} />
        </button>

        <p className="mb-3 text-sm font-black text-white/90">
          🎁 {text.title} · {front + 1} {text.of} {count}
        </p>

        {/* الصفحات المتتالية: كل العروض ظاهرة ورا بعض على الجانبين */}
        <div className="relative h-[min(62vh,520px)] w-full">
          {offers.map((offer, index) => {
            // المسافة الدائرية من العرض الأمامي: 0 = الأمامي، سالب/موجب = على الجانبين.
            let d = (index - front + count) % count;
            if (d > count / 2) d -= count;
            const level = Math.abs(d);
            const isFront = level === 0;
            const dir = rtl ? -Math.sign(d) : Math.sign(d);
            // أول عرض خلفي يبعد 56% من عرض الصورة، وكل مستوى بعده 15% إضافية.
            const shift = isFront ? 0 : dir * (56 + (level - 1) * 15);
            const scale = isFront ? 1 : 0.84 * Math.pow(0.93, level - 1);
            const style: React.CSSProperties = {
              transform: `translateX(calc(-50% + ${shift}%)) scale(${scale})`,
              opacity: isFront ? 1 : Math.max(0.3, 0.85 - (level - 1) * 0.12),
              filter: isFront ? "none" : `grayscale(1) brightness(${Math.max(0.4, 0.66 - (level - 1) * 0.07)})`,
              zIndex: 100 - level,
            };

            return (
              <div
                key={offer.id}
                role={isFront ? undefined : "button"}
                tabIndex={isFront ? -1 : 0}
                aria-label={isFront ? undefined : offer.title}
                onClick={isFront ? undefined : () => setFront(index)}
                onKeyDown={isFront ? undefined : (event) => event.key === "Enter" && setFront(index)}
                style={style}
                className={`absolute left-1/2 top-0 h-full w-[min(78vw,440px)] overflow-hidden rounded-[22px] bg-white shadow-[0_24px_70px_rgba(0,0,0,0.5)] transition-all duration-700 ease-out ${
                  isFront ? "" : "cursor-pointer"
                }`}
              >
                <img
                  src={offer.popup.imageUrl}
                  alt={locale === "en" ? offer.titleEn || offer.title : offer.title}
                  className="h-full w-full object-contain"
                  draggable={false}
                />
              </div>
            );
          })}
        </div>

        {/* زر الاستفادة + التنقل */}
        <div className="mt-4 flex w-full items-center justify-center gap-3">
          {count > 1 ? (
            <button
              type="button"
              aria-label={text.prev}
              onClick={() => setFront((f) => (f + count - 1) % count)}
              className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/30"
            >
              {rtl ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
          ) : null}

          {current.popup.buttonEnabled ? (
            <button
              type="button"
              onClick={() => go(current.href)}
              className="h-12 min-w-[200px] cursor-pointer rounded-full bg-[#F7B548] px-8 text-[15px] font-black text-[#07152E] shadow-[0_10px_30px_rgba(247,181,72,0.45)] transition hover:scale-[1.03] hover:bg-[#FFC766]"
            >
              {buttonText}
            </button>
          ) : null}

          {count > 1 ? (
            <button
              type="button"
              aria-label={text.next}
              onClick={() => setFront((f) => (f + 1) % count)}
              className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/30"
            >
              {rtl ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
            </button>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}
