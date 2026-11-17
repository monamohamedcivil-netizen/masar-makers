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
  const lastY = useRef(0);
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

  const rafId = useRef<number | null>(null);

  // حركة ناعمة بمنحنى تسارع/تباطؤ، مدتها ثابتة بغض النظر عن المسافة.
  const glideTo = useCallback((targetY: number) => {
    if (animating.current) return;
    const startY = window.scrollY;
    const distance = targetY - startY;
    if (Math.abs(distance) < 2) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      window.scrollTo(0, targetY);
      return;
    }

    animating.current = true;
    const duration = 1000;
    const t0 = performance.now();
    const ease = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / duration);
      window.scrollTo(0, startY + distance * ease(t));
      if (t < 1) {
        rafId.current = window.requestAnimationFrame(step);
      } else {
        rafId.current = null;
        animating.current = false;
        lastY.current = window.scrollY;
      }
    };
    rafId.current = window.requestAnimationFrame(step);
  }, []);

  const goToCenter = useCallback(() => {
    setMounted(true);
    window.requestAnimationFrame(() => {
      const center = centerRef.current;
      if (center) glideTo(center.offsetTop);
    });
  }, [glideTo]);

  const goToHeroEnd = useCallback(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const heroBottom = hero.offsetTop + hero.offsetHeight;
    glideTo(Math.max(0, heroBottom - window.innerHeight));
  }, [glideTo]);

  // لو الزائر وقف بين الشاشتين (نص من الرئيسية ونص من مركز الرحلات)،
  // نكمّل الحركة تلقائيًا في اتجاه سحبه لحد ما تظهر شاشة كاملة.
  useEffect(() => {
    let timer: number | undefined;
    const onScroll = () => {
      if (animating.current) {
        lastY.current = window.scrollY;
        return;
      }
      const goingDown = window.scrollY >= lastY.current;
      lastY.current = window.scrollY;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        const center = centerRef.current;
        if (!center || animating.current) return;
        const top = center.getBoundingClientRect().top;
        const straddling = top > 8 && top < window.innerHeight - 8;
        if (!straddling) return;
        if (goingDown) goToCenter();
        else goToHeroEnd();
      }, 140);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(timer);
      if (rafId.current != null) window.cancelAnimationFrame(rafId.current);
    };
  }, [goToCenter, goToHeroEnd]);

  useEffect(() => {
    let touchY: number | null = null;

    const onWheel = (event: WheelEvent) => {
      if (animating.current) {
        event.preventDefault();
        return;
      }
      if (event.deltaY > 8 && inSnapZone()) {
        event.preventDefault();
        goToCenter();
      }
    };
    const onTouchStart = (event: TouchEvent) => {
      touchY = event.touches[0]?.clientY ?? null;
    };
    const onTouchMove = (event: TouchEvent) => {
      if (animating.current) {
        event.preventDefault();
        return;
      }
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
