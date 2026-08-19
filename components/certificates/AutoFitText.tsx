"use client";

import {
  CSSProperties,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

type AutoFitTextProps = {
  text: string;
  className?: string;
  maxFontSize?: number;
  minFontSize?: number;
  style?: CSSProperties;
};

export default function AutoFitText({
  text,
  className,
  maxFontSize = 60,
  minFontSize = 36,
  style,
}: AutoFitTextProps) {
  const ref =
    useRef<HTMLHeadingElement>(null);

  const [
    fontSize,
    setFontSize,
  ] = useState(maxFontSize);

  useLayoutEffect(() => {
    const element =
      ref.current;

    if (!element) {
      return;
    }

    let size =
      maxFontSize;

    element.style.fontSize =
      `${size}px`;

    /*
     * نصغر الاسم فقط إذا تجاوز العرض المتاح.
     * لا نعتمد على الارتفاع حتى لا يتم
     * تصغير الاسم بدون داعٍ.
     */
    while (
      element.scrollWidth >
        element.clientWidth &&
      size > minFontSize
    ) {
      size -= 1;

      element.style.fontSize =
        `${size}px`;
    }

    setFontSize(size);
  }, [
    text,
    maxFontSize,
    minFontSize,
  ]);

  return (
    <h1
      ref={ref}
      className={className}
      style={{
        ...style,

        fontSize,

        whiteSpace:
          "nowrap",

        overflow:
          "hidden",

        textOverflow:
          "clip",

        margin: 0,

        padding: 0,
      }}
    >
      {text}
    </h1>
  );
}