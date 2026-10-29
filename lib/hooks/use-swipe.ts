"use client";

import { useRef } from "react";
import type { TouchEvent } from "react";

/**
 * سحب يمين/شمال بالإصبع (موبايل) لتبديل بطاقات السلايدر، بالإضافة للأسهم.
 * السحب الرأسي يفضل تمرير عادي للصفحة (touch-action: pan-y).
 * isRtl: في العربية «التالي» هو السحب لليمين، وفي الإنجليزية لليسار.
 */
export function useSwipe(onNext: () => void, onPrevious: () => void, isRtl: boolean) {
  const start = useRef<{ x: number; y: number } | null>(null);

  return {
    style: { touchAction: "pan-y" as const },
    onTouchStart: (event: TouchEvent) => {
      const t = event.touches[0];
      start.current = { x: t.clientX, y: t.clientY };
    },
    onTouchEnd: (event: TouchEvent) => {
      const from = start.current;
      start.current = null;
      if (!from) return;
      const t = event.changedTouches[0];
      const dx = t.clientX - from.x;
      const dy = t.clientY - from.y;
      if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy) * 1.4) return;
      const toNext = isRtl ? dx > 0 : dx < 0;
      if (toNext) onNext();
      else onPrevious();
    },
    onTouchCancel: () => {
      start.current = null;
    },
  };
}
