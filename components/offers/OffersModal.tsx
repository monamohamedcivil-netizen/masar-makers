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
      className="fixed inset-0 z-[400] flex items-center justify-center bg-[#07152E]/80 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="relative flex w-full max-w-[560px] flex-col items-center">
        <button
          type="button"
          onClick={onClose}
          aria-label={text.close}
          className="absolute -top-2 right-0 z-[60] flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white text-[#07152E] shadow-lg transition hover:bg-[#F7B548]"
        >
          <X size={18} />
        </button>

        <p className="mb-3 text-sm font-black text-white/90">
          🎁 {text.title} · {front + 1} {text.of} {count}
        </p>

        {/* الصفحات المتتالية */}
        <div className="relative h-[min(62vh,520px)] w-full">
          {offers.map((offer, index) => {
            // الترتيب بالنسبة للعرض الأمامي (دائري): 0 = الأمامي.
            const depth = (index - front + count) % count;
            const isFront = depth === 0;
            const shown = Math.min(depth, 3);
            const style: React.CSSProperties = {
              transform: `translateY(${-shown * 16}px) scale(${1 - shown * 0.07})`,
              opacity: isFront ? 1 : Math.max(0.18, 0.6 - (shown - 1) * 0.2),
              filter: isFront ? "none" : `brightness(${0.7 - (shown - 1) * 0.1}) saturate(0.7)`,
              zIndex: 40 - shown,
              pointerEvents: depth > 3 ? "none" : "auto",
              visibility: depth > 3 ? "hidden" : "visible",
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
                className={`absolute inset-0 overflow-hidden rounded-[22px] bg-white shadow-[0_24px_70px_rgba(0,0,0,0.45)] transition-all duration-500 ease-out ${
                  isFront ? "" : "cursor-pointer hover:brightness-90"
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
