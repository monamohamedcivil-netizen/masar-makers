"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { useOfferList } from "./useOffers";

type Locale = "ar" | "en";

const TEXT = {
  ar: { title: "العروض الحالية", prev: "العرض السابق", next: "العرض التالي" },
  en: { title: "Current offers", prev: "Previous offer", next: "Next offer" },
} as const;

function go(href: string) {
  if (!href || href === "#") return;
  if (/^https?:\/\//i.test(href) && !href.startsWith(window.location.origin)) {
    window.open(href, "_blank", "noopener,noreferrer");
    return;
  }
  window.location.assign(href);
}

/*
 * قسم العروض في الرئيسية: الإعلانات ورا بعض. الأمامي كبير وبألوانه، والباقي أصغر وخافت وبالأبيض والأسود.
 * السهم أو الضغط على إعلان خلفي يقدّمه ويكبّره ويرجع الحالي للخلف.
 */
export default function OffersShowcase() {
  const offers = useOfferList();
  const [front, setFront] = useState(0);
  const [locale, setLocale] = useState<Locale>("ar");
  const count = offers.length;

  useEffect(() => {
    const saved = window.localStorage.getItem("masar-locale");
    if (saved === "ar" || saved === "en") setLocale(saved);
    const onChange = (event: Event) => {
      const next = (event as CustomEvent<{ locale?: Locale }>).detail?.locale;
      if (next === "ar" || next === "en") setLocale(next);
    };
    window.addEventListener("masar:locale-change", onChange);
    return () => window.removeEventListener("masar:locale-change", onChange);
  }, []);

  if (count === 0) return null;

  const text = TEXT[locale];
  const rtl = locale === "ar";
  const current = offers[front] ?? offers[0];
  const buttonText = locale === "en" ? current.popup.buttonTextEn || current.popup.buttonText : current.popup.buttonText;
  const step = (delta: number) => setFront((f) => (f + delta + count) % count);

  return (
    <section dir={rtl ? "rtl" : "ltr"} aria-label={text.title} className="overflow-hidden bg-[#061329] px-4 py-10 sm:py-14">
      <p className="mb-6 text-center text-base font-black text-white sm:text-lg">🎁 {text.title}</p>

      <div className="relative mx-auto h-[min(92vw,540px)] w-full max-w-[1100px]">
        {offers.map((offer, index) => {
          // المسافة الدائرية من الإعلان الأمامي: 0 = الأمامي، ±1 = الجانبان، غير ذلك مخفي.
          let d = (index - front + count) % count;
          if (d > count / 2) d -= count;
          const isFront = d === 0;
          const visible = Math.abs(d) <= 1;
          const dir = rtl ? -d : d;
          const style: React.CSSProperties = {
            transform: `translateX(calc(-50% + ${dir * 66}%)) scale(${isFront ? 1 : 0.8})`,
            filter: isFront ? "none" : "grayscale(1) brightness(0.62)",
            opacity: visible ? (isFront ? 1 : 0.8) : 0,
            zIndex: isFront ? 30 : 20 - Math.abs(d),
            pointerEvents: visible ? "auto" : "none",
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
              className={`absolute left-1/2 top-0 h-full w-[min(72vw,430px)] overflow-hidden rounded-[22px] bg-white shadow-[0_24px_70px_rgba(0,0,0,0.55)] transition-all duration-700 ease-out ${
                isFront ? "" : "cursor-pointer"
              }`}
            >
              <img
                src={offer.popup.imageUrl}
                alt={locale === "en" ? offer.titleEn || offer.title : offer.title}
                className="h-full w-full object-contain"
                draggable={false}
                loading="lazy"
              />
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-center gap-3">
        {count > 1 ? (
          <button
            type="button"
            aria-label={text.prev}
            onClick={() => step(-1)}
            className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/30"
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
            onClick={() => step(1)}
            className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/30"
          >
            {rtl ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
        ) : null}
      </div>
    </section>
  );
}
