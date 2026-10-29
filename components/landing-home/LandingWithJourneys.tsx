"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";

import MasarLanding from "@/sections/MasarLanding";

// مركز الرحلات يتحمّل بعد ظهور الصفحة الأولى (الشاشة الأولى تفضل سريعة).
const JourneysCenter = dynamic(() => import("@/app/home/page"), {
  ssr: false,
  loading: () => <div className="min-h-[60vh] bg-[#F7F8FA]" />,
});

/**
 * الصفحة الرئيسية + مركز الرحلات في صفحة واحدة:
 * بعد ما الزائر يشوف الشاشة الأولى كاملة، أول حركة لتحت تنقله بانتقال ناعم لمركز الرحلات.
 */
export default function LandingWithJourneys() {
  const heroRef = useRef<HTMLDivElement>(null);
  const centerRef = useRef<HTMLDivElement>(null);
  const animating = useRef(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const idle = window.setTimeout(() => setMounted(true), 2500);
    return () => window.clearTimeout(idle);
  }, []);

  // شريط تنقل مركز الرحلات يختفي طول ما الشاشة الأولى ظاهرة (عشان ما يغطيش أزرارها).
  useEffect(() => {
    const center = centerRef.current;
    if (!center) return;
    const update = () => {
      const top = center.getBoundingClientRect().top;
      if (top > 60) document.body.dataset.landingHero = "1";
      else delete document.body.dataset.landingHero;
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      delete document.body.dataset.landingHero;
    };
  }, []);

  const inSnapZone = useCallback(() => {
    const hero = heroRef.current;
    const center = centerRef.current;
    if (!hero || !center) return false;
    const heroBottom = hero.offsetTop + hero.offsetHeight;
    const viewBottom = window.scrollY + window.innerHeight;
    // الزائر شاف آخر الشاشة الأولى، ولسه ما وصلش لمركز الرحلات.
    return viewBottom >= heroBottom - 48 && window.scrollY < center.offsetTop - 8;
  }, []);

  const goToCenter = useCallback(() => {
    if (animating.current) return;
    animating.current = true;
    setMounted(true);
    window.requestAnimationFrame(() => {
      centerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      window.setTimeout(() => {
        animating.current = false;
      }, 900);
    });
  }, []);

  useEffect(() => {
    let touchY: number | null = null;

    const onWheel = (event: WheelEvent) => {
      if (event.deltaY > 8 && inSnapZone()) {
        event.preventDefault();
        goToCenter();
      }
    };
    const onTouchStart = (event: TouchEvent) => {
      touchY = event.touches[0]?.clientY ?? null;
    };
    const onTouchMove = (event: TouchEvent) => {
      if (touchY == null) return;
      const dy = touchY - (event.touches[0]?.clientY ?? touchY);
      if (dy > 24 && inSnapZone()) {
        event.preventDefault();
        touchY = null;
        goToCenter();
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (["ArrowDown", "PageDown", " "].includes(event.key) && inSnapZone()) {
        const target = event.target as HTMLElement | null;
        if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
        event.preventDefault();
        goToCenter();
      }
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", onKey);
    };
  }, [goToCenter, inSnapZone]);

  return (
    <>
      <div ref={heroRef}>
        <MasarLanding v2 />
      </div>
      <div ref={centerRef} id="journeys-center" className="scroll-mt-0">
        {mounted ? <JourneysCenter /> : <div className="min-h-[60vh] bg-[#F7F8FA]" />}
      </div>
    </>
  );
}
