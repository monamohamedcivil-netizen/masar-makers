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
  maxFontSize = 64,
  minFontSize = 24,
  style,
}: AutoFitTextProps) {
  const ref = useRef<HTMLHeadingElement>(null);

  const [fontSize, setFontSize] = useState(maxFontSize);

  useLayoutEffect(() => {
    const element = ref.current;

    if (!element) return;

    let size = maxFontSize;

    element.style.fontSize = `${size}px`;

    while (
      (element.scrollWidth > element.clientWidth ||
        element.scrollHeight > element.clientHeight) &&
      size > minFontSize
    ) {
      size--;

      element.style.fontSize = `${size}px`;
    }

    setFontSize(size);
  }, [text, maxFontSize, minFontSize]);

  return (
    <h1
      ref={ref}
      className={className}
      style={{
        ...style,
        fontSize,
        whiteSpace: "nowrap",
        overflow: "hidden",
      }}
    >
      {text}
    </h1>
  );
}