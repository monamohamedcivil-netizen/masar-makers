"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
} from "react";

type FitToHeightProps = {
  children: React.ReactNode;
  className?: string;
  /* أصغر تصغير مسموح حتى يبقى النص مقروءًا */
  minScale?: number;
};

/*
 * يعرض المحتوى بارتفاعه كاملًا داخل المساحة المتاحة:
 * إذا كان المحتوى أطول من الحاوية يُصغَّر (CSS zoom) حتى يظهر كله بدون تمرير،
 * وإذا كان أقصر يبقى بحجمه الطبيعي في المنتصف.
 */
export default function FitToHeight({
  children,
  className = "",
  minScale = 0.55,
}: FitToHeightProps) {
  const outerRef =
    useRef<HTMLDivElement | null>(null);

  const innerRef =
    useRef<HTMLDivElement | null>(null);

  const [scale, setScale] =
    useState(1);

  const updateRef =
    useRef<() => void>(() => {});

  useLayoutEffect(() => {
    const outer =
      outerRef.current;
    const inner =
      innerRef.current;

    if (!outer || !inner) {
      return;
    }

    function update() {
      if (!outer || !inner) {
        return;
      }

      const available =
        outer.clientHeight - 6;

      const currentScale =
        Number(inner.style.zoom) || 1;

      // الارتفاع الظاهر بعد التصغير الحالي.
      const visible =
        inner.getBoundingClientRect().height;

      if (available <= 0 || !visible) {
        return;
      }

      /*
       * التصغير يغيّر العرض فقد يتغير الارتفاع أيضًا،
       * لذلك نعدّل النسبة تدريجيًا ونعيد القياس حتى يتطابق.
       */
      const fits =
        visible <= available;

      const roomToGrow =
        currentScale < 1 &&
        visible < available * 0.97;

      if (fits && !roomToGrow) {
        return;
      }

      const next =
        Math.max(
          minScale,
          Math.min(
            1,
            (currentScale * available) / visible,
          ),
        );

      setScale((previous) =>
        Math.abs(previous - next) > 0.003
          ? next
          : previous,
      );
    }

    updateRef.current =
      update;

    const observer =
      new ResizeObserver(update);

    observer.observe(outer);
    observer.observe(inner);
    update();

    // الصور تغيّر ارتفاع المحتوى عند تحميلها.
    inner.addEventListener(
      "load",
      update,
      true,
    );

    return () => {
      observer.disconnect();
      inner.removeEventListener(
        "load",
        update,
        true,
      );
    };
  }, [minScale]);

  /*
   * تغيير zoom لا يُطلق ResizeObserver (المقاس الداخلي لا يتغير)،
   * فنعيد القياس بعد كل تغيير حتى تستقر النسبة.
   */
  useLayoutEffect(() => {
    updateRef.current();
  }, [scale]);

  return (
    <div
      ref={outerRef}
      className={`flex h-full w-full items-center justify-center overflow-hidden ${className}`}
    >
      <div
        ref={innerRef}
        className="w-full min-w-0"
        style={{ zoom: scale }}
      >
        {children}
      </div>
    </div>
  );
}
