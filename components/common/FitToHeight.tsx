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
 * أقصى عدد تعديلات للتصغير بعد كل تغيير حقيقي في مساحة العرض.
 * بدونه كانت شاشة الموبايل الضيقة تدخل في حلقة لا نهائية (React #185 → «الصفحة لم تفتح»):
 * التصغير يغيّر طريقة نزول السطور فيتغير الارتفاع، فيكبّر ثم يصغّر بلا توقف.
 */
const MAX_ADJUSTMENTS = 12;

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

    // آخر مقاس للمساحة المتاحة: التكبير مسموح فقط بعد تغيّرها (تدوير/تغيير حجم الشاشة).
    let lastOuterWidth = -1;
    let lastOuterHeight = -1;

    // أصغر نسبة جرّبناها ولم يتسع المحتوى عندها: لا نرجع لها أو لأكبر منها (يمنع التذبذب).
    let ceiling = 1;

    let adjustments = 0;

    function update() {
      if (!outer || !inner) {
        return;
      }

      const outerWidth =
        outer.clientWidth;
      const outerHeight =
        outer.clientHeight;

      if (
        outerWidth !== lastOuterWidth ||
        outerHeight !== lastOuterHeight
      ) {
        lastOuterWidth = outerWidth;
        lastOuterHeight = outerHeight;
        ceiling = 1;
        adjustments = 0;
      }

      if (adjustments >= MAX_ADJUSTMENTS) {
        return;
      }

      const available =
        outerHeight - 6;

      const currentScale =
        Number(inner.style.zoom) || 1;

      // الارتفاع الظاهر بعد التصغير الحالي.
      const visible =
        inner.getBoundingClientRect().height;

      if (available <= 0 || !visible) {
        return;
      }

      const fits =
        visible <= available;

      if (!fits) {
        ceiling = Math.min(
          ceiling,
          currentScale,
        );
      }

      const roomToGrow =
        currentScale < 1 &&
        visible < available * 0.97;

      if (fits && !roomToGrow) {
        return;
      }

      let next =
        Math.max(
          minScale,
          Math.min(
            1,
            (currentScale * available) / visible,
          ),
        );

      // التكبير لا يصل لنسبة ثبت أنها لا تتسع.
      if (next > currentScale && ceiling < 1) {
        next = Math.min(
          next,
          ceiling - 0.01,
        );
      }

      if (
        Math.abs(next - currentScale) <= 0.003
      ) {
        return;
      }

      adjustments += 1;

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
   * تغيير zoom لا يُطلق ResizeObserver دائمًا، فنعيد القياس بعد كل تغيير حتى تستقر النسبة.
   * القياس في الإطار التالي (وليس داخل نفس التحديث) حتى لا تتراكم تحديثات React المتداخلة أبدًا.
   */
  useLayoutEffect(() => {
    const frame =
      window.requestAnimationFrame(() => {
        updateRef.current();
      });

    return () => {
      window.cancelAnimationFrame(frame);
    };
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
